import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { Resend } from 'resend'

export const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured.')
  return new Resend(apiKey)
}
export const normalizeEmail = (value: string) => value.trim().toLowerCase()
export const hashToken = (value: string) => createHash('sha256').update(value).digest('hex')
export const createToken = () => randomBytes(32).toString('hex')
export const createOtp = () => String(Math.floor(100000 + Math.random() * 900000))
export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}
export const verifyPassword = (password: string, stored: string) => {
  const [salt, digest] = stored.split(':')
  if (!salt || !digest) return false
  const expected = Buffer.from(digest, 'hex')
  const actual = scryptSync(password, salt, 64)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
export async function sendAuthOtp(to: string, code: string, idempotencyKey: string) {
  const result = await getResend().emails.send({ from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev', to: [to], subject: `${code} is your KolkataFF verification code`, html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#16352b"><p style="letter-spacing:.14em;font-size:12px;font-weight:700;color:#6a7b72">KOLKATAFF · ACCOUNT SECURITY</p><h1 style="font-size:28px">Verify your email</h1><p>Enter this one-time code to finish creating your account:</p><div style="font-size:36px;letter-spacing:12px;font-weight:800;padding:20px 0;color:#16352b">${code}</div><p style="color:#6a7b72">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p></div>` }, { idempotencyKey })
  if (result.error) throw new Error(result.error.message)
}

export async function sendAuthEmail(to: string, subject: string, title: string, text: string, link: string, idempotencyKey: string) {
  const result = await getResend().emails.send({ from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev', to: [to], subject, html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h1 style="color:#16352b">${title}</h1><p>${text}</p><p><a href="${link}" style="display:inline-block;background:#16352b;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none">Continue</a></p><p>This link expires in 30 minutes.</p></div>` }, { idempotencyKey })
  if (result.error) throw new Error(result.error.message)
}
