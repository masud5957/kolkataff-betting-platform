import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { walletLedger, wallets } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const wallet = (await db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1))[0]
  const transactions = await db.select().from(walletLedger).where(eq(walletLedger.userId, user.id)).orderBy(desc(walletLedger.createdAt)).limit(100)
  return NextResponse.json({ wallet: { balancePaise: wallet?.balancePaise ?? 0 }, transactions })
}
