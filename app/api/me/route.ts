import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { users } from '@/lib/db/schema'
import { hashPassword, verifyPassword } from '@/lib/email-auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, phoneVerified: user.phoneVerified, emailVerified: user.emailVerified } })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({})) as { name?: unknown; currentPassword?: unknown; newPassword?: unknown }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
  if (!name || name.length < 2 || name.length > 80) return NextResponse.json({ error: 'Enter a name between 2 and 80 characters.' }, { status: 400 })
  const update: { name: string; updatedAt: Date; passwordHash?: string } = { name, updatedAt: new Date() }
  if (newPassword) {
    if (newPassword.length < 8) return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
    if (!user.passwordHash || !currentPassword || !verifyPassword(currentPassword, user.passwordHash)) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
    update.passwordHash = hashPassword(newPassword)
  }
  const [updated] = await db.update(users).set(update).where(eq(users.id, user.id)).returning({ id: users.id, name: users.name, email: users.email, phone: users.phone, role: users.role, phoneVerified: users.phoneVerified, emailVerified: users.emailVerified })
  return NextResponse.json({ user: updated })
}
