import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, createAdminSession, isAdminSessionValid, SESSION_TTL, verifyAdminCredentials } from '@/lib/admin-auth'

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminSessionValid() })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!verifyAdminCredentials(username, password)) return NextResponse.json({ error: 'Invalid admin username or password.' }, { status: 401 })
  const response = NextResponse.json({ authenticated: true })
  response.cookies.set(ADMIN_COOKIE, createAdminSession(username), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_TTL })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false })
  response.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 })
  return response
}
