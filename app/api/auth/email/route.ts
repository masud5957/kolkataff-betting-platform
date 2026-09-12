import { and, eq, gt, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emailChallenges, users } from '@/lib/db/schema'
import { createSession } from '@/lib/auth'
import { createOtp, hashPassword, hashToken, normalizeEmail, sendAuthOtp, verifyPassword } from '@/lib/email-auth'

const appUrl = (request: Request) => process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
const response = (body: unknown, status = 200) => NextResponse.json(body, { status })

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const action = body?.action
  const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!/^\S+@\S+\.\S+$/.test(email)) return response({ error: 'Enter a valid email address.' }, 400)
  if (action === 'signup') {
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (name.length < 2 || password.length < 8) return response({ error: 'Enter your name and a password of at least 8 characters.' }, 400)
    const existing = await db.select({ id: users.id, emailVerified: users.emailVerified }).from(users).where(eq(users.email, email)).limit(1)
    if (existing[0]?.emailVerified) return response({ error: 'An account with this email already exists. Sign in instead.' }, 409)
    const user = existing[0]
      ? await db.update(users).set({ name, passwordHash: hashPassword(password), updatedAt: new Date() }).where(eq(users.id, existing[0].id)).returning({ id: users.id })
      : await db.insert(users).values({ email, phone: `email:${email}`, name, passwordHash: hashPassword(password) }).returning({ id: users.id })
    await db.update(emailChallenges).set({ consumedAt: new Date() }).where(and(eq(emailChallenges.email, email), eq(emailChallenges.type, 'verify'), isNull(emailChallenges.consumedAt)))
    const code = createOtp()
    await db.insert(emailChallenges).values({ email, tokenHash: hashToken(code), type: 'signup-otp', expiresAt: new Date(Date.now() + 10 * 60 * 1000) })
    await sendAuthOtp(email, code, `signup-otp/${user[0].id}-${hashToken(code).slice(0, 12)}`)
    return response({ ok: true, requiresOtp: true, message: 'We sent a 6-digit verification code to your email.' }, existing[0] ? 200 : 201)
  }
  if (action === 'resend-verification') {
    const result = await db.select({ id: users.id, emailVerified: users.emailVerified }).from(users).where(eq(users.email, email)).limit(1)
    if (!result[0] || result[0].emailVerified) return response({ ok: true, message: 'If the account needs verification, a new email has been sent.' })
    await db.update(emailChallenges).set({ consumedAt: new Date() }).where(and(eq(emailChallenges.email, email), eq(emailChallenges.type, 'verify'), isNull(emailChallenges.consumedAt)))
    const code = createOtp()
    await db.update(emailChallenges).set({ consumedAt: new Date() }).where(and(eq(emailChallenges.email, email), eq(emailChallenges.type, 'signup-otp'), isNull(emailChallenges.consumedAt)))
    await db.insert(emailChallenges).values({ email, tokenHash: hashToken(code), type: 'signup-otp', expiresAt: new Date(Date.now() + 10 * 60 * 1000) })
    await sendAuthOtp(email, code, `signup-otp-resend/${result[0].id}-${hashToken(code).slice(0, 12)}`)
    return response({ ok: true, message: 'A new 6-digit verification code has been sent.' })
  }
  if (action === 'verify-signup-otp') {
    const code = typeof body?.code === 'string' ? body.code.replace(/\D/g, '') : ''
    if (!/^\d{6}$/.test(code)) return response({ error: 'Enter the 6-digit verification code.' }, 400)
    const challenge = await db.select().from(emailChallenges).where(and(eq(emailChallenges.email, email), eq(emailChallenges.tokenHash, hashToken(code)), eq(emailChallenges.type, 'signup-otp'), isNull(emailChallenges.consumedAt), gt(emailChallenges.expiresAt, new Date()))).limit(1)
    if (!challenge[0]) return response({ error: 'That code is invalid or expired. Request a new code.' }, 400)
    await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.email, email))
    await db.update(emailChallenges).set({ consumedAt: new Date() }).where(eq(emailChallenges.id, challenge[0].id))
    const user = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (user[0]) await createSession(user[0].id)
    return response({ ok: true })
  }
  if (action === 'login') {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const user = result[0]
    if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) return response({ error: 'Invalid email or password.' }, 401)
    if (!user.emailVerified) return response({ error: 'Please verify your email before signing in.' }, 403)
    await createSession(user.id)
    return response({ ok: true })
  }
  if (action === 'forgot') {
    const result = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (result[0]) {
      await db.update(emailChallenges).set({ consumedAt: new Date() }).where(and(eq(emailChallenges.email, email), eq(emailChallenges.type, 'password-reset-otp'), isNull(emailChallenges.consumedAt)))
      const code = createOtp()
      await db.insert(emailChallenges).values({ email, tokenHash: hashToken(code), type: 'password-reset-otp', expiresAt: new Date(Date.now() + 10 * 60 * 1000) })
      await sendAuthOtp(email, code, `password-reset-otp/${result[0].id}-${hashToken(code).slice(0, 12)}`)
    }
    return response({ ok: true, message: 'If an account exists, a 6-digit password reset code has been sent.' })
  }
  if (action === 'reset') {
    const code = typeof body?.code === 'string' ? body.code.replace(/\D/g, '') : ''
    if (password.length < 8 || !/^\d{6}$/.test(code)) return response({ error: 'Enter a valid 6-digit code and a password of at least 8 characters.' }, 400)
    const challenge = await db.select().from(emailChallenges).where(and(eq(emailChallenges.email, email), eq(emailChallenges.tokenHash, hashToken(code)), eq(emailChallenges.type, 'password-reset-otp'), isNull(emailChallenges.consumedAt), gt(emailChallenges.expiresAt, new Date()))).limit(1)
    if (!challenge[0]) return response({ error: 'That code is invalid or expired. Request a new code.' }, 400)
    await db.update(users).set({ passwordHash: hashPassword(password), updatedAt: new Date() }).where(eq(users.email, challenge[0].email)); await db.update(emailChallenges).set({ consumedAt: new Date() }).where(eq(emailChallenges.id, challenge[0].id)); return response({ ok: true })
  }
  return response({ error: 'Unsupported auth action.' }, 400)
}
