import { and, desc, eq, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gameBets, gameRounds, walletLedger, wallets } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { ensureGameTables } from '@/lib/db/ensure-game'

const MIN_STAKE = 500
const MAX_STAKE = 10000

export async function GET() {
  await ensureGameTables()
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const bets = await db.select({ id: gameBets.id, roundId: gameBets.roundId, betType: gameBets.betType, selection: gameBets.selection, stakePaise: gameBets.stakePaise, payoutPaise: gameBets.payoutPaise, status: gameBets.status, createdAt: gameBets.createdAt, roundNumber: gameRounds.roundNumber, roundDate: gameRounds.roundDate }).from(gameBets).innerJoin(gameRounds, eq(gameBets.roundId, gameRounds.id)).where(eq(gameBets.userId, user.id)).orderBy(desc(gameBets.createdAt)).limit(100)
  return NextResponse.json({ bets }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}

export async function POST(request: Request) {
  await ensureGameTables()
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const roundId = typeof body?.roundId === 'string' ? body.roundId : ''
  const betType = body?.betType === 'patti' ? 'patti' : body?.betType === 'single' ? 'single' : ''
  const selection = typeof body?.selection === 'string' ? body.selection.trim() : ''
  const stake = Number(body?.stake)
  if (!roundId || !betType || !Number.isInteger(stake) || stake < MIN_STAKE || stake > MAX_STAKE) return NextResponse.json({ error: 'Stake must be between ₹500 and ₹10,000.' }, { status: 400 })
  if ((betType === 'single' && !/^\d$/.test(selection)) || (betType === 'patti' && !/^\d{3}$/.test(selection))) return NextResponse.json({ error: 'Enter a valid single or three-digit patti.' }, { status: 400 })
  try {
    const result = await db.transaction(async (tx) => {
      const [round] = await tx.select().from(gameRounds).where(and(eq(gameRounds.id, roundId), eq(gameRounds.status, 'open'))).limit(1)
      if (!round) throw new Error('Round is closed or unavailable.')
      const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1)
      if (!wallet || wallet.balancePaise < stake * 100) throw new Error('Insufficient wallet balance.')
      const [bet] = await tx.insert(gameBets).values({ roundId, userId: user.id, betType, selection, stakePaise: stake * 100, status: 'result_awaited' }).returning()
      const balanceAfterPaise = wallet.balancePaise - stake * 100
      await tx.update(wallets).set({ balancePaise: balanceAfterPaise, updatedAt: new Date() }).where(eq(wallets.id, wallet.id))
      await tx.insert(walletLedger).values({ userId: user.id, amountPaise: -(stake * 100), balanceAfterPaise, type: 'game_bet', note: `${betType}:${selection}`, createdAt: new Date() })
      return bet
    })
    return NextResponse.json({ bet: result }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to place bet.' }, { status: 400 })
  }
}
