import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { paymentSettings } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  if (!await getCurrentUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const settings = await db.select({ upiId: paymentSettings.upiId, accountName: paymentSettings.accountName, qrUrl: paymentSettings.qrUrl }).from(paymentSettings).limit(1)
  return NextResponse.json({ settings: settings[0] ?? null })
}
