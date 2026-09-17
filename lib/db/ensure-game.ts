import { pool } from './index'

let ready: Promise<void> | null = null

export function ensureGameTables() {
  if (!ready) {
    ready = (async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS game_rounds (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), round_date text NOT NULL, round_number integer NOT NULL, status text NOT NULL DEFAULT 'open', deadline_at timestamptz, single_result text, patti_result text, created_by uuid NOT NULL, declared_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(round_date, round_number))`)
      await pool.query(`ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS deadline_at timestamptz`)
      await pool.query(`CREATE TABLE IF NOT EXISTS game_bets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), round_id uuid NOT NULL, user_id uuid NOT NULL, bet_type text NOT NULL, selection text NOT NULL, stake_paise integer NOT NULL, payout_paise integer NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now())`)
    })().catch(error => { ready = null; throw error })
  }
  return ready
}
