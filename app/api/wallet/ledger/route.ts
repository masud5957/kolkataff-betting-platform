import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { walletLedger } from '@/lib/db/schema'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const entries = await db.select().from(walletLedger).where(eq(walletLedger.userId, user.id)).orderBy(desc(walletLedger.createdAt)).limit(100)
  return NextResponse.json({ entries })
}
