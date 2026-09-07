import { NextResponse } from 'next/server'

export async function GET() {
  const widgetId = process.env.MSG91_WIDGET_ID
  const tokenAuth = process.env.MSG91_WIDGET_AUTH_TOKEN
  if (!widgetId || !tokenAuth) return NextResponse.json({ error: 'OTP service is not configured.' }, { status: 503 })
  return NextResponse.json({ widgetId, tokenAuth })
}
