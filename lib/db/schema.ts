import { pgTable, text, integer, timestamp, uuid, uniqueIndex, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: text('phone').notNull(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('user'),
  phoneVerified: boolean('phone_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ phoneIdx: uniqueIndex('users_phone_idx').on(table.phone) }))

export const otpChallenges = pgTable('otp_challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: text('phone').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ tokenIdx: uniqueIndex('sessions_token_hash_idx').on(table.tokenHash) }))

export const wallets = pgTable('wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  balancePaise: integer('balance_paise').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ userIdx: uniqueIndex('wallets_user_idx').on(table.userId) }))

export const rechargeRequests = pgTable('recharge_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  amountPaise: integer('amount_paise').notNull(),
  method: text('method').notNull(),
  utr: text('utr').notNull(),
  proofUrl: text('proof_url'),
  status: text('status').notNull().default('pending'),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ utrIdx: uniqueIndex('recharge_requests_utr_idx').on(table.utr) }))

export const walletLedger = pgTable('wallet_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  rechargeRequestId: uuid('recharge_request_id'),
  amountPaise: integer('amount_paise').notNull(),
  balanceAfterPaise: integer('balance_after_paise').notNull(),
  type: text('type').notNull(),
  note: text('note').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const paymentSettings = pgTable('payment_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  upiId: text('upi_id'),
  accountName: text('account_name'),
  accountNumber: text('account_number'),
  ifsc: text('ifsc'),
  qrUrl: text('qr_url'),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const schema = { users, otpChallenges, sessions, wallets, rechargeRequests, walletLedger, paymentSettings, auditLogs }
export type User = typeof users.$inferSelect
export type RechargeRequest = typeof rechargeRequests.$inferSelect
export type Wallet = typeof wallets.$inferSelect
