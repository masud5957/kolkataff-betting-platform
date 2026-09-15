import { and, desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gameRounds } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { ensureGameTables } from '@/lib/db/ensure-game'

export async function GET() {
  await ensureGameTables()
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
  const history = new URL(request.url).searchParams.get('history') === '1'
  const rounds = history
    ? await db.select({ id: gameRounds.id, roundDate: gameRounds.roundDate, roundNumber: gameRounds.roundNumber, status: gameRounds.status, singleResult: gameRounds.singleResult, pattiResult: gameRounds.pattiResult, createdAt: gameRounds.createdAt, declaredAt: gameRounds.declaredAt }).from(gameRounds).orderBy(desc(gameRounds.roundDate), gameRounds.roundNumber)
    : await db.select({ id: gameRounds.id, roundDate: gameRounds.roundDate, roundNumber: gameRounds.roundNumber, status: gameRounds.status, singleResult: gameRounds.singleResult, pattiResult: gameRounds.pattiResult, createdAt: gameRounds.createdAt, declaredAt: gameRounds.declaredAt }).from(gameRounds).where(eq(gameRounds.roundDate, date)).orderBy(desc(gameRounds.roundNumber))
  return NextResponse.json({ rounds }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}
