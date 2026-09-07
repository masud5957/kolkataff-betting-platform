import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { schema } from './schema'

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/kolkataff_build'

export const pool = new Pool({ connectionString, max: 5, ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false } })
export const db = drizzle(pool, { schema })
