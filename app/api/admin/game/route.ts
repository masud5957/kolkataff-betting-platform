import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gameBets, gameRounds, walletLedger, wallets } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { ensureGameTables } from '@/lib/db/ensure-game'

async function requireAdmin() {
  await ensureGameTables()
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
  const rounds = await db.select().from(gameRounds).where(eq(gameRounds.roundDate, date)).orderBy(gameRounds.roundNumber)
  return NextResponse.json({ rounds }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
  const existing = await db.select({ roundNumber: gameRounds.roundNumber }).from(gameRounds).where(eq(gameRounds.roundDate, date))
  const present = new Set(existing.map(row => row.roundNumber))
  const rows = Array.from({ length: 8 }, (_, index) => index + 1).filter(roundNumber => !present.has(roundNumber)).map(roundNumber => ({ roundDate: date, roundNumber, createdBy: user.id }))
  if (rows.length) await db.insert(gameRounds).values(rows)
  const rounds = await db.select().from(gameRounds).where(eq(gameRounds.roundDate, date)).orderBy(gameRounds.roundNumber)
  return NextResponse.json({ rounds })
}

export async function PATCH(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json().catch(() => null)
  const roundId = typeof body?.roundId === 'string' ? body.roundId : ''
  const singleResult = typeof body?.singleResult === 'string' ? body.singleResult : ''
  const pattiResult = typeof body?.pattiResult === 'string' ? body.pattiResult : ''
  if (!roundId || !/^\d$/.test(singleResult) || !/^\d{3}$/.test(pattiResult)) return NextResponse.json({ error: 'Enter a valid single and patti result.' }, { status: 400 })
  const result = await db.transaction(async tx => {
    const [round] = await tx.select().from(gameRounds).where(and(eq(gameRounds.id, roundId), eq(gameRounds.status, 'open'))).limit(1)
    if (!round) throw new Error('Round is already declared or unavailable.')
    const bets = await tx.select().from(gameBets).where(eq(gameBets.roundId, roundId))
    for (const bet of bets) {
      const won = bet.betType === 'single' ? bet.selection === singleResult : bet.selection === pattiResult
      const payoutPaise = won ? bet.stakePaise * (bet.betType === 'single' ? 9 : 100) : 0
      await tx.update(gameBets).set({ status: won ? 'won' : 'lost', payoutPaise }).where(eq(gameBets.id, bet.id))
      if (payoutPaise) {
        const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, bet.userId)).limit(1)
        if (wallet) {
          const balanceAfterPaise = wallet.balancePaise + payoutPaise
          await tx.update(wallets).set({ balancePaise: balanceAfterPaise, updatedAt: new Date() }).where(eq(wallets.id, wallet.id))
          await tx.insert(walletLedger).values({ userId: bet.userId, amountPaise: payoutPaise, balanceAfterPaise, type: 'game_win', note: `${bet.betType}:${bet.selection}`, createdAt: new Date() })
        }
      }
    }
    return (await tx.update(gameRounds).set({ status: 'declared', singleResult, pattiResult, declaredAt: new Date() }).where(eq(gameRounds.id, roundId)).returning())[0]
  })
  return NextResponse.json({ round: result })
}
