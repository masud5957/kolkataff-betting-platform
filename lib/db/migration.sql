create extension if not exists pgcrypto;

create table if not exists users (id uuid primary key default gen_random_uuid(), phone text not null unique, email text unique, name text not null, password_hash text, role text not null default 'user', phone_verified boolean not null default false, email_verified boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table users add column if not exists email text;
alter table users add column if not exists email_verified boolean not null default false;
create unique index if not exists users_email_idx on users(email);
create table if not exists email_challenges (id uuid primary key default gen_random_uuid(), email text not null, token_hash text not null unique, type text not null, expires_at timestamptz not null, consumed_at timestamptz, created_at timestamptz not null default now());
create table if not exists otp_challenges (id uuid primary key default gen_random_uuid(), phone text not null, code_hash text not null, expires_at timestamptz not null, attempts integer not null default 0, consumed_at timestamptz, created_at timestamptz not null default now());
create table if not exists sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null, token_hash text not null unique, expires_at timestamptz not null, created_at timestamptz not null default now());
create table if not exists wallets (id uuid primary key default gen_random_uuid(), user_id uuid not null unique, balance_paise integer not null default 0, updated_at timestamptz not null default now());
create table if not exists recharge_requests (id uuid primary key default gen_random_uuid(), user_id uuid not null, amount_paise integer not null, method text not null, utr text not null unique, proof_url text, status text not null default 'pending', reviewed_by uuid, reviewed_at timestamptz, created_at timestamptz not null default now());
create table if not exists wallet_ledger (id uuid primary key default gen_random_uuid(), user_id uuid not null, recharge_request_id uuid, amount_paise integer not null, balance_after_paise integer not null, type text not null, note text not null, created_at timestamptz not null default now());
create table if not exists payment_settings (id uuid primary key default gen_random_uuid(), upi_id text, account_name text, account_number text, ifsc text, qr_url text, updated_by uuid, updated_at timestamptz not null default now());
create table if not exists audit_logs (id uuid primary key default gen_random_uuid(), actor_id uuid not null, action text not null, entity_type text not null, entity_id uuid, metadata text, created_at timestamptz not null default now());
