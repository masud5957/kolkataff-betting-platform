import { NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { rechargeRequests, wallets } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const amount = Number(body?.amount)
  const upiId = typeof body?.upiId === 'string' ? body.upiId.trim().toLowerCase() : ''
  const accountName = typeof body?.accountName === 'string' ? body.accountName.trim() : ''
  const accountNumber = typeof body?.accountNumber === 'string' ? body.accountNumber.trim() : ''
  const ifscCode = typeof body?.ifscCode === 'string' ? body.ifscCode.trim().toUpperCase() : ''
  const hasUpi = /^[a-z0-9._-]+@[a-z0-9.-]+$/.test(upiId)
  const hasBank = accountName.length >= 2 && accountName.length <= 120 && /^\d{6,30}$/.test(accountNumber) && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)
  if (!Number.isInteger(amount) || amount < 300 || amount > 1000000 || (!hasUpi && !hasBank)) return NextResponse.json({ error: 'Enter a valid amount and either a UPI ID or complete bank details.' }, { status: 400 })
  const [daily] = await db.select({ count: sql<number>`count(*)` }).from(rechargeRequests).where(and(eq(rechargeRequests.userId, user.id), eq(rechargeRequests.method, 'withdrawal'), sql`(${rechargeRequests.createdAt} AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date`))
  if (Number(daily?.count ?? 0) >= 3) return NextResponse.json({ error: 'You can submit a maximum of 3 withdrawals per day.' }, { status: 429 })
  const result = await db.transaction(async (tx) => {
    const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, user.id)).for('update')
    if (!wallet) throw new Error('WALLET_NOT_FOUND')
    if (wallet.balancePaise < 10000) throw new Error('MINIMUM_BALANCE')
    if (amount * 100 > wallet.balancePaise) throw new Error(`INSUFFICIENT:${wallet.balancePaise}`)
    const nextBalance = wallet.balancePaise - amount * 100
    await tx.update(wallets).set({ balancePaise: nextBalance, updatedAt: new Date() }).where(eq(wallets.id, wallet.id))
    const [row] = await tx.insert(rechargeRequests).values({ userId: user.id, amountPaise: amount * 100, method: 'withdrawal', upiId: hasUpi ? upiId : null, accountName: hasBank ? accountName : null, accountNumber: hasBank ? accountNumber : null, ifscCode: hasBank ? ifscCode : null, utr: `WD-${crypto.randomUUID().slice(0, 12)}` }).returning()
    await tx.insert(walletLedger).values({ userId: user.id, amountPaise: -amount * 100, balanceAfterPaise: nextBalance, type: 'withdrawal_reserved', note: 'Withdrawal amount reserved pending admin review' })
    return row
  }).catch((error: unknown) => { const message = error instanceof Error ? error.message : ''; if (message === 'WALLET_NOT_FOUND') return null; if (message === 'MINIMUM_BALANCE') return 'minimum'; if (message.startsWith('INSUFFICIENT:')) return `insufficient:${message.split(':')[1]}`; throw error })
  if (result === null) return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 })
  if (result === 'minimum') return NextResponse.json({ error: 'A minimum withdrawal amount of ₹300 is required.' }, { status: 400 })
  if (typeof result === 'string' && result.startsWith('insufficient:')) return NextResponse.json({ error: `Withdrawal cannot exceed your available balance of ₹${(Number(result.split(':')[1]) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.` }, { status: 400 })
  return NextResponse.json({ request: result }, { status: 201 })
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(rechargeRequests).where(eq(rechargeRequests.userId, user.id))
  return NextResponse.json({ requests: rows.filter(row => row.method.startsWith('withdrawal:')) })
}
