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
  const result = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: [to],
    subject: `${code} is your KolkataFF verification code`,
    html: `<div style="margin:0;background:#f2f7f4;padding:36px 16px;font-family:Arial,Helvetica,sans-serif;color:#173b2f">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe9e0;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(23,59,47,.08)">
        <div style="height:6px;background:#21835a"></div>
        <div style="padding:32px 34px">
          <div style="font-size:13px;letter-spacing:2px;font-weight:700;color:#21835a">KOLKATAFF</div>
          <div style="margin-top:6px;font-size:11px;letter-spacing:1px;color:#7a9185">ACCOUNT SECURITY</div>
          <h1 style="margin:28px 0 12px;font-size:28px;line-height:1.2;color:#173b2f">Verify your email</h1>
          <p style="margin:0;font-size:16px;line-height:1.6;color:#536d61">Hi,</p>
          <p style="margin:8px 0 0;font-size:16px;line-height:1.6;color:#536d61">Your KolkataFF verification code is:</p>
          <div style="margin:24px 0;padding:20px;text-align:center;background:#edf8f0;border:1px solid #cce8d5;border-radius:12px;color:#173b2f;font-size:36px;line-height:1;font-weight:800;letter-spacing:10px">${code}</div>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#536d61">This code will expire in <strong style="color:#173b2f">10 minutes</strong>.</p>
          <p style="margin:18px 0 0;padding-top:18px;border-top:1px solid #e7efea;font-size:13px;line-height:1.6;color:#7a9185">If you did not request this verification code, you can safely ignore this email.</p>
          <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#536d61">Regards,<br><strong style="color:#173b2f">KolkataFF</strong><br><a href="https://kolkataff.shop" style="color:#21835a;text-decoration:none">kolkataff.shop</a></p>
        </div>
      </div>
      <p style="margin:18px auto 0;max-width:560px;text-align:center;font-size:11px;color:#91a39a">This is an automated security email from KolkataFF.</p>
    </div>`
  }, { idempotencyKey })
  if (result.error) throw new Error(result.error.message)
}

export async function sendAuthEmail(to: string, subject: string, title: string, text: string, link: string, idempotencyKey: string) {
  const result = await getResend().emails.send({ from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev', to: [to], subject, html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h1 style="color:#16352b">${title}</h1><p>${text}</p><p><a href="${link}" style="display:inline-block;background:#16352b;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none">Continue</a></p><p>This link expires in 30 minutes.</p></div>` }, { idempotencyKey })
  if (result.error) throw new Error(result.error.message)
}
