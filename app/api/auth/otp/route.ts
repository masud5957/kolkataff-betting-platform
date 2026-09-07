import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { otpChallenges, users, wallets } from '@/lib/db/schema'

const MSG91_SEND_URL = 'https://control.msg91.com/api/v5/widget/sendOtp'
const MSG91_VERIFY_URL = 'https://control.msg91.com/api/v5/widget/verifyOtp'

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (/^0\d{10}$/.test(digits)) return `91${digits.slice(1)}`
  if (/^\d{10}$/.test(digits)) return `91${digits}`
  if (/^91\d{10}$/.test(digits)) return digits
  return ''
}
function hash(value: string) { return createHash('sha256').update(value).digest('hex') }
function authHeaders() { return { 'Content-Type': 'application/json', Accept: 'application/json' } }

async function msg91(path: string, body: Record<string, string>) {
  const response = await fetch(path, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ widgetId: process.env.MSG91_WIDGET_ID, tokenAuth: process.env.MSG91_WIDGET_AUTH_TOKEN, ...body }), cache: 'no-store' })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.type === 'error' || payload?.type === 'error_message') {
    throw new Error(typeof payload?.message === 'string' ? payload.message : 'MSG91 request failed')
  }
  return payload as { reqId?: string; message?: string; type?: string; data?: { reqId?: string; accessToken?: string } }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const action = body?.action === 'verify' ? 'verify' : 'send'
  const phone = typeof body?.phone === 'string' ? normalizePhone(body.phone) : ''
  if (!/^91\d{10}$/.test(phone)) return NextResponse.json({ error: 'Enter a valid Indian mobile number.' }, { status: 400 })
  if (!process.env.MSG91_WIDGET_ID || !process.env.MSG91_WIDGET_AUTH_TOKEN) return NextResponse.json({ error: 'OTP service is not configured.' }, { status: 503 })

  try {
    if (action === 'send') {
      const result = await msg91(MSG91_SEND_URL, { identifier: phone })
      const requestId = result.reqId ?? result.data?.reqId
      if (!requestId) throw new Error('Missing OTP request id')
      await db.delete(otpChallenges).where(eq(otpChallenges.phone, phone))
      await db.insert(otpChallenges).values({ phone, codeHash: hash(`${phone}:${requestId}`), expiresAt: new Date(Date.now() + 5 * 60 * 1000) })
      return NextResponse.json({ ok: true, reqId: requestId })
    }

    const reqId = typeof body?.reqId === 'string' ? body.reqId : ''
    const otp = typeof body?.otp === 'string' ? body.otp : ''
    if (!reqId || !/^\d{4,8}$/.test(otp)) return NextResponse.json({ error: 'OTP and request id are required.' }, { status: 400 })
    const challenge = await db.select().from(otpChallenges).where(and(eq(otpChallenges.phone, phone), eq(otpChallenges.codeHash, hash(`${phone}:${reqId}`)), gt(otpChallenges.expiresAt, new Date()))).limit(1)
    if (!challenge[0]) return NextResponse.json({ error: 'OTP expired. Please request a new code.' }, { status: 400 })
    await msg91(MSG91_VERIFY_URL, { reqId, otp })
    const existing = await db.select().from(users).where(eq(users.phone, phone)).limit(1)
    const user = existing[0] ?? (await db.insert(users).values({ phone, name: `Player ${phone.slice(-4)}`, phoneVerified: true }).returning())[0]
    await db.update(users).set({ phoneVerified: true, updatedAt: new Date() }).where(eq(users.id, user.id))
    await db.insert(wallets).values({ userId: user.id, balancePaise: 0 }).onConflictDoNothing({ target: wallets.userId })
    await db.delete(otpChallenges).where(eq(otpChallenges.id, challenge[0].id))
    await createSession(user.id)
    return NextResponse.json({ ok: true, user: { id: user.id, phone: user.phone, name: user.name, role: user.role } })
  } catch (error) {
    console.error('[v0] OTP request failed:', error instanceof Error ? error.message : error)
    const message = error instanceof Error ? error.message : ''
    return NextResponse.json({ error: message || 'Unable to verify OTP. Please try again.' }, { status: 502 })
  }
}
