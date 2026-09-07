import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { users, wallets } from '@/lib/db/schema'

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (/^0\d{10}$/.test(digits)) return `91${digits.slice(1)}`
  if (/^\d{10}$/.test(digits)) return `91${digits}`
  if (/^91\d{10}$/.test(digits)) return digits
  return ''
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const phone = typeof body?.phone === 'string' ? normalizePhone(body.phone) : ''
  const action = body?.action === 'verify' ? 'verify' : 'send'
  if (!/^91\d{10}$/.test(phone)) return NextResponse.json({ error: 'Enter a valid Indian mobile number.' }, { status: 400 })
  if (!process.env.MSG91_WIDGET_ID || !process.env.MSG91_WIDGET_AUTH_TOKEN) return NextResponse.json({ error: 'OTP service is not configured.' }, { status: 503 })
  if (action === 'send') return NextResponse.json({ ok: true, message: 'Use the MSG91 widget to send OTP.' })
  if (typeof body?.widgetToken !== 'string' || body.widgetToken.length < 3) return NextResponse.json({ error: 'MSG91 did not confirm this OTP.' }, { status: 400 })

  try {
    const tokenResponse = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authkey: process.env.MSG91_WIDGET_AUTH_TOKEN, 'access-token': body.widgetToken }),
      cache: 'no-store',
    })
    const tokenData = await tokenResponse.json().catch(() => null)
    if (!tokenResponse.ok || tokenData?.type === 'error' || tokenData?.success === false) {
      return NextResponse.json({ error: 'MSG91 could not verify the widget token.' }, { status: 401 })
    }

    const existing = await db.select().from(users).where(eq(users.phone, phone)).limit(1)
    const user = existing[0] ?? (await db.insert(users).values({ phone, name: `Player ${phone.slice(-4)}`, phoneVerified: true }).returning())[0]
    await db.update(users).set({ phoneVerified: true, updatedAt: new Date() }).where(eq(users.id, user.id))
    await db.insert(wallets).values({ userId: user.id, balancePaise: 0 }).onConflictDoNothing({ target: wallets.userId })
    await createSession(user.id)
    return NextResponse.json({ ok: true, user: { id: user.id, phone: user.phone, name: user.name, role: user.role } })
  } catch (error) {
    console.error('[v0] Session creation failed:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Unable to create your session. Please try again.' }, { status: 500 })
  }
}
