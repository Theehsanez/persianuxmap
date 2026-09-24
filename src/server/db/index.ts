import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import * as schema from './schema'
import { seedIfEmpty } from './seed'

export type DB = BetterSQLite3Database<typeof schema>

let db: DB | null = null

/** Opened lazily on the first request: runs pending migrations and seeds the demo designers once. */
export function getDb(): DB {
  if (db) return db
  const file = resolve(process.env.DATABASE_URL ?? './data/persianuxmap.db')
  mkdirSync(dirname(file), { recursive: true })
  const sqlite = new Database(file)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: resolve(process.env.MIGRATIONS_DIR ?? './drizzle') })
  seedIfEmpty(db)
  return db
}

export { schema }
