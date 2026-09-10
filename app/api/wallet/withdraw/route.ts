import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { rechargeRequests, wallets } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const amount = Number(body?.amount)
  const upiId = typeof body?.upiId === 'string' ? body.upiId.trim().toLowerCase() : ''
  if (!Number.isInteger(amount) || amount < 100 || amount > 1000000 || !upiId || upiId.length > 120 || !/^[a-z0-9._-]+@[a-z0-9.-]+$/.test(upiId)) return NextResponse.json({ error: 'Enter a valid amount and UPI ID.' }, { status: 400 })
  const [pending] = await db.select({ id: rechargeRequests.id }).from(rechargeRequests).where(and(eq(rechargeRequests.userId, user.id), eq(rechargeRequests.status, 'pending'))).limit(1)
  if (pending) return NextResponse.json({ error: 'You already have a withdrawal pending review.' }, { status: 409 })
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1)
  if (!wallet) return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 })
  if (wallet.balancePaise < 10000) return NextResponse.json({ error: 'A minimum wallet balance of ₹100 is required to withdraw.' }, { status: 400 })
  if (amount * 100 > wallet.balancePaise) return NextResponse.json({ error: `Withdrawal cannot exceed your available balance of ₹${(wallet.balancePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.` }, { status: 400 })
  const [row] = await db.insert(rechargeRequests).values({ userId: user.id, amountPaise: amount * 100, method: `withdrawal:${upiId}`, utr: `WD-${crypto.randomUUID().slice(0, 12)}` }).returning()
  return NextResponse.json({ request: row }, { status: 201 })
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(rechargeRequests).where(eq(rechargeRequests.userId, user.id))
  return NextResponse.json({ requests: rows.filter(row => row.method.startsWith('withdrawal:')) })
}
