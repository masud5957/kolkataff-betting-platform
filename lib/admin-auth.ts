import { cookies } from 'next/headers'
import { createHash, timingSafeEqual } from 'node:crypto'

export const ADMIN_COOKIE = 'kolkataff_admin'
const SESSION_TTL = 60 * 60 * 8

const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const safeEqual = (left: string, right: string) => {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

export const verifyAdminCredentials = (username: string, password: string) => Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && safeEqual(username, process.env.ADMIN_USERNAME) && safeEqual(password, process.env.ADMIN_PASSWORD))

export const createAdminSession = (username: string) => `${username}.${digest(`${username}:${process.env.ADMIN_PASSWORD}:${new Date().toISOString().slice(0, 13)}`)}`

export async function isAdminSessionValid() {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value
  if (!value) return false
  const [username, signature] = value.split('.')
  if (!username || !signature || !process.env.ADMIN_PASSWORD || username !== process.env.ADMIN_USERNAME) return false
  return safeEqual(signature, digest(`${username}:${process.env.ADMIN_PASSWORD}:${new Date().toISOString().slice(0, 13)}`)) || safeEqual(signature, digest(`${username}:${process.env.ADMIN_PASSWORD}:${new Date(Date.now() - 60 * 60 * 1000).toISOString().slice(0, 13)}`))
}

export { SESSION_TTL }
