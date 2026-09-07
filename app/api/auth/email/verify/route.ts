import { and, eq, gt, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emailChallenges, users } from '@/lib/db/schema'
import { createSession } from '@/lib/auth'
import { hashToken } from '@/lib/email-auth'

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/?verified=error', request.url))
  const challenge = await db.select().from(emailChallenges).where(and(eq(emailChallenges.tokenHash, hashToken(token)), eq(emailChallenges.type, 'verify'), isNull(emailChallenges.consumedAt), gt(emailChallenges.expiresAt, new Date()))).limit(1)
  if (!challenge[0]) return NextResponse.redirect(new URL('/?verified=error', request.url))
  const user = await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.email, challenge[0].email)).returning({ id: users.id })
  await db.update(emailChallenges).set({ consumedAt: new Date() }).where(eq(emailChallenges.id, challenge[0].id))
  if (user[0]) await createSession(user[0].id)
  return NextResponse.redirect(new URL('/?verified=success', request.url))
}
