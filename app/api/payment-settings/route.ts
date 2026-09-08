import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { paymentSettings } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [settings] = await db.select({
    accountName: paymentSettings.accountName,
    accountNumber: paymentSettings.accountNumber,
    ifsc: paymentSettings.ifsc,
    upiId: paymentSettings.upiId,
    qrUrl: paymentSettings.qrUrl,
  }).from(paymentSettings).limit(1)
  return NextResponse.json({ settings: settings ?? null })
}
