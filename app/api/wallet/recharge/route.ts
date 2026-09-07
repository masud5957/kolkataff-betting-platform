import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { rechargeRequests } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const amount = Number(body?.amount)
  const method = body?.method === 'bank' ? 'bank' : 'upi'
  const utr = typeof body?.utr === 'string' ? body.utr.trim() : ''
  if (!Number.isInteger(amount) || amount < 100 || amount > 1000000 || !utr || utr.length > 64) return NextResponse.json({ error: 'Enter a valid amount and payment reference.' }, { status: 400 })
  try {
    const [requestRow] = await db.insert(rechargeRequests).values({ userId: user.id, amountPaise: amount * 100, method, utr }).returning({ id: rechargeRequests.id, status: rechargeRequests.status })
    return NextResponse.json({ request: requestRow }, { status: 201 })
  } catch { return NextResponse.json({ error: 'This payment reference has already been submitted.' }, { status: 409 }) }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(rechargeRequests).where(eq(rechargeRequests.userId, user.id))
  return NextResponse.json({ requests: rows })
}
