import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { rechargeRequests, walletLedger } from '@/lib/db/schema'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [requests, ledger] = await Promise.all([
    db.select().from(rechargeRequests).where(eq(rechargeRequests.userId, user.id)).orderBy(desc(rechargeRequests.createdAt)).limit(100),
    db.select().from(walletLedger).where(eq(walletLedger.userId, user.id)).orderBy(desc(walletLedger.createdAt)).limit(100),
  ])
  const items = [
    ...requests.map(request => { const isWithdrawal = request.method === 'withdrawal' || request.method.startsWith('withdrawal:'); return { id: request.id, kind: isWithdrawal ? 'withdrawal' : 'recharge', amountPaise: isWithdrawal ? -Math.abs(request.amountPaise) : Math.abs(request.amountPaise), reference: request.utr, status: request.status, createdAt: request.createdAt } }),
    ...ledger.map(entry => { const isWithdrawal = entry.type.startsWith('withdrawal'); const isBet = entry.type === 'game_bet'; const isWin = entry.type === 'game_win'; return { id: entry.id, kind: isWithdrawal ? 'withdrawal' : isBet ? 'bet' : isWin ? 'win' : 'recharge', amountPaise: isWithdrawal || isBet ? -Math.abs(entry.amountPaise) : Math.abs(entry.amountPaise), reference: isBet ? `${entry.note} bet placed` : isWin ? `${entry.note} bet winning` : entry.note, status: 'completed', createdAt: entry.createdAt } }),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100)
  return NextResponse.json({ items })
}
