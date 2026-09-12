import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { paymentSettings } from '@/lib/db/schema'
import { isAdminSessionValid } from '@/lib/admin-auth'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET() {
  if (!await isAdminSessionValid() && !await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const settings = await db.select().from(paymentSettings).limit(1)
  return NextResponse.json({ settings: settings[0] ?? null })
}

export async function PATCH(request: Request) {
  const sessionAdmin = await isAdminSessionValid()
  const user = await requireAdmin()
  if (!sessionAdmin && !user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid payment settings' }, { status: 400 })
  const qrUrl = typeof body?.qrUrl === 'string' ? body.qrUrl.trim() : ''
  if (qrUrl) {
    try {
      const parsedQrUrl = new URL(qrUrl)
      if (parsedQrUrl.protocol !== 'https:' || !['i.ibb.co', 'ibb.co', 'www.ibb.co'].includes(parsedQrUrl.hostname.toLowerCase())) {
        return NextResponse.json({ error: 'QR code URL must be a secure ImgBB URL.' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'Enter a valid ImgBB QR image URL.' }, { status: 400 })
    }
  }
  const values = {
    upiId: typeof body?.upiId === 'string' ? body.upiId.trim() : null,
    accountName: typeof body?.accountName === 'string' ? body.accountName.trim() : null,
    accountNumber: typeof body?.accountNumber === 'string' ? body.accountNumber.trim() : null,
    ifsc: typeof body?.ifsc === 'string' ? body.ifsc.trim().toUpperCase() : null,
    qrUrl: typeof body?.qrUrl === 'string' ? body.qrUrl.trim() : null,
    updatedBy: user?.id ?? null,
    updatedAt: new Date(),
  }
  const current = await db.select({ id: paymentSettings.id }).from(paymentSettings).limit(1)
  const settings = current[0]
    ? (await db.update(paymentSettings).set(values).where(eq(paymentSettings.id, current[0].id)).returning())[0]
    : (await db.insert(paymentSettings).values(values).returning())[0]
  return NextResponse.json({ settings })
}
