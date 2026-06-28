import { neon } from '@neondatabase/serverless'

export function getDb() {
  return neon(process.env.DATABASE_URL)
}

export async function initSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS flowboard_columns (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      accent TEXT,
      position INTEGER DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS flowboard_cards (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS flowboard_tasks (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS flowboard_reminders (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS flowboard_shares (
      card_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      shared_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (card_id, user_id)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS flowboard_mentions (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL,
      card_title TEXT NOT NULL,
      mentioned_user_id TEXT NOT NULL,
      mentioned_by_user_id TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      read_at TIMESTAMPTZ
    )
  `
}
