import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export async function GET() {
  const requestId = crypto.randomUUID()
  const config = {
    databaseUrlPresent: Boolean(process.env.DATABASE_URL),
    betterAuthSecretPresent: Boolean(process.env.BETTER_AUTH_SECRET),
  }
  try {
    await db.execute(sql`select 1`)
    console.info('[health.ok]', { requestId, database: true, config })
    return NextResponse.json({ ok: true, requestId, database: 'ok', config })
  } catch (error) {
    console.error('[health.database_failed]', { requestId, error: error instanceof Error ? error.message : 'unknown', config })
    return NextResponse.json({ ok: false, requestId, database: 'error', config }, { status: 503 })
  }
}
