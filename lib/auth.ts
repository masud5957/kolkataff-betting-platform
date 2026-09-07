import { createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { and, eq, gt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { sessions, users } from '@/lib/db/schema'

export const SESSION_COOKIE = 'kolkataff_session'
const SESSION_DAYS = 30

function hashToken(token: string) { return createHash('sha256').update(token).digest('hex') }

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex')
  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + SESSION_DAYS * 86400000) })
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_DAYS * 86400 })
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const result = await db.select({ user: users }).from(sessions).innerJoin(users, eq(users.id, sessions.userId)).where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date()))).limit(1)
  return result[0]?.user ?? null
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)))
  jar.delete(SESSION_COOKIE)
}
