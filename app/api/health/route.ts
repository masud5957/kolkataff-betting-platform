import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export async function GET() {
  try { await db.execute(sql`select 1`); return NextResponse.json({ ok: true, service: 'kolkataff' }) }
  catch { return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 }) }
}
