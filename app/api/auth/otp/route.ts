import { NextResponse } from 'next/server'
import { createHash, randomInt } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { otpChallenges } from '@/lib/db/schema'

function normalizePhone(phone: string) { return phone.replace(/\D/g, '').replace(/^0/, '91') }
function hash(value: string) { return createHash('sha256').update(value).digest('hex') }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const phone = typeof body?.phone === 'string' ? normalizePhone(body.phone) : ''
  const widgetToken = typeof body?.widgetToken === 'string' ? body.widgetToken : ''
  if (!/^91\d{10}$/.test(phone) || !widgetToken) return NextResponse.json({ error: 'Phone and MSG91 widget verification are required.' }, { status: 400 })
  const code = String(randomInt(100000, 999999))
  await db.delete(otpChallenges).where(eq(otpChallenges.phone, phone))
  await db.insert(otpChallenges).values({ phone, codeHash: hash(`${code}:${widgetToken}`), expiresAt: new Date(Date.now() + 5 * 60 * 1000) })
  return NextResponse.json({ ok: true, message: 'Widget verification accepted. Complete OTP verification to continue.' })
}
