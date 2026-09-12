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

const encodeUsername = (username: string) => Buffer.from(username, 'utf8').toString('base64url')
const decodeUsername = (value: string) => Buffer.from(value, 'base64url').toString('utf8')

export const createAdminSession = (username: string) => `${encodeUsername(username)}.${digest(`${username}:${process.env.ADMIN_PASSWORD}:${new Date().toISOString().slice(0, 13)}`)}`

export async function isAdminSessionValid() {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value
  if (!value) return false
  const separator = value.lastIndexOf('.')
  if (separator <= 0 || !process.env.ADMIN_PASSWORD) return false
  const encodedUsername = value.slice(0, separator)
  const signature = value.slice(separator + 1)
  let username = ''
  try {
    username = decodeUsername(encodedUsername)
  } catch {
    return false
  }
  if (!signature || username !== process.env.ADMIN_USERNAME) return false
  return safeEqual(signature, digest(`${username}:${process.env.ADMIN_PASSWORD}:${new Date().toISOString().slice(0, 13)}`)) || safeEqual(signature, digest(`${username}:${process.env.ADMIN_PASSWORD}:${new Date(Date.now() - 60 * 60 * 1000).toISOString().slice(0, 13)}`))
}

export { SESSION_TTL }
