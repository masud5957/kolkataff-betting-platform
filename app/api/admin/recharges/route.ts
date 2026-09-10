import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auditLogs, rechargeRequests, walletLedger, wallets } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { isAdminSessionValid } from '@/lib/admin-auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!await isAdminSessionValid() && (!user || user.role !== 'admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rows = await db.select().from(rechargeRequests).where(eq(rechargeRequests.status, 'pending'))
  return NextResponse.json({ requests: rows })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!await isAdminSessionValid() && (!user || user.role !== 'admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  const status = body?.status === 'approved' || body?.status === 'rejected' ? body.status : ''
  if (!id || !status) return NextResponse.json({ error: 'Invalid review request.' }, { status: 400 })
  try {
  const result = await db.transaction(async (tx) => {
    const [row] = await tx.update(rechargeRequests).set({ status, reviewedBy: user?.id ?? null, reviewedAt: new Date() }).where(and(eq(rechargeRequests.id, id), eq(rechargeRequests.status, 'pending'))).returning()
    if (!row) return null
    if (!Number.isSafeInteger(row.amountPaise) || row.amountPaise <= 0) throw new Error('Invalid recharge amount in database')
    if (status === 'rejected') {
      if (user) await tx.insert(auditLogs).values({ actorId: user.id, action: 'recharge.rejected', entityType: 'recharge_request', entityId: row.id })
      return { row, balancePaise: null }
    }
    const [wallet] = await tx.insert(wallets).values({ userId: row.userId, balancePaise: 0 }).onConflictDoNothing({ target: wallets.userId }).returning({ id: wallets.id })
    const existing = wallet ?? (await tx.select({ id: wallets.id, balancePaise: wallets.balancePaise }).from(wallets).where(eq(wallets.userId, row.userId)).limit(1))[0]
    if (!existing) throw new Error('Wallet unavailable')
    if (!Number.isSafeInteger(existing.balancePaise) || existing.balancePaise < 0) throw new Error('Invalid wallet balance in database')
    const nextBalancePaise = existing.balancePaise + row.amountPaise
    if (!Number.isSafeInteger(nextBalancePaise)) throw new Error('Wallet balance exceeds supported limit')
    const [updated] = await tx.update(wallets).set({ balancePaise: nextBalancePaise, updatedAt: new Date() }).where(eq(wallets.id, existing.id)).returning({ balancePaise: wallets.balancePaise })
    await tx.insert(walletLedger).values({ userId: row.userId, rechargeRequestId: row.id, amountPaise: row.amountPaise, balanceAfterPaise: updated.balancePaise, type: 'recharge_credit', note: 'Manual recharge approved' })
    if (user) await tx.insert(auditLogs).values({ actorId: user.id, action: 'recharge.approved', entityType: 'recharge_request', entityId: row.id })
    return { row, balancePaise: updated.balancePaise }
  })
  if (!result) return NextResponse.json({ error: 'Request already reviewed or not found.' }, { status: 409 })
  return NextResponse.json({ request: result.row, balancePaise: result.balancePaise })
  } catch (error) {
    console.error('[v0] Recharge approval failed:', error)
    return NextResponse.json({ error: 'Recharge could not be approved. No wallet balance was changed.' }, { status: 500 })
  }
}
