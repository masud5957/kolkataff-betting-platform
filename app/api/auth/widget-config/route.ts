import { NextResponse } from 'next/server'

export async function GET() {
  const requestId = crypto.randomUUID()
  const widgetId = process.env.MSG91_WIDGET_ID
  const tokenAuth = process.env.MSG91_WIDGET_AUTH_TOKEN
  const ready = Boolean(widgetId && tokenAuth)
  console.info('[auth.widget_config]', { requestId, widgetIdPresent: Boolean(widgetId), tokenAuthPresent: Boolean(tokenAuth), tokenLength: tokenAuth?.length ?? 0 })
  if (!ready) return NextResponse.json({ error: 'OTP service is not configured.', requestId }, { status: 503 })
  return NextResponse.json({ widgetId, tokenAuth })
}
