import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { rechargeRequests, walletLedger } from '@/lib/db/schema'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [requests, ledger] = await Promise.all([
    db.select().from(rechargeRequests).where(eq(rechargeRequests.userId, user.id)).orderBy(desc(rechargeRequests.createdAt)).limit(100),
    db.select().from(walletLedger).where(eq(walletLedger.userId, user.id)).orderBy(desc(walletLedger.createdAt)).limit(100),
  ])
  const items = [
    ...requests.map(request => ({ id: request.id, kind: request.method.startsWith('withdrawal:') ? 'withdrawal' : 'recharge', amountPaise: request.amountPaise, reference: request.utr, status: request.status, createdAt: request.createdAt })),
    ...ledger.map(entry => ({ id: entry.id, kind: entry.type.startsWith('withdrawal') ? 'withdrawal' : 'recharge', amountPaise: entry.amountPaise, reference: entry.note, status: 'completed', createdAt: entry.createdAt })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100)
  return NextResponse.json({ items })
}
