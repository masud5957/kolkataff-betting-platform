import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  MSG91_WIDGET_ID: z.string().min(1),
  MSG91_WIDGET_AUTH_TOKEN: z.string().min(1),
})

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  MSG91_WIDGET_ID: process.env.MSG91_WIDGET_ID,
  MSG91_WIDGET_AUTH_TOKEN: process.env.MSG91_WIDGET_AUTH_TOKEN,
})
