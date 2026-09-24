import { createClient } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import * as schema from './schema'
import { runMigrations } from './migrate'
import { seedIfEmpty } from './seed'

export type DB = LibSQLDatabase<typeof schema>

let ready: Promise<DB> | null = null

// DATABASE_* is ours; TURSO_* is what Vercel's Turso integration sets automatically.
const dbUrl = () => (process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL)?.trim() || undefined
const dbToken = () => (process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN)?.trim() || undefined

const onServerless = () => !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)

/** Non-secret description of the database configuration, for /api/health and error messages. */
export function databaseInfo() {
  const url = dbUrl()
  return {
    urlScheme: url ? url.split(':')[0] : 'unset (using local file)',
    host: url && !url.startsWith('file:') ? url.replace(/^[a-z]+:\/\//, '').split(/[/?]/)[0] : undefined,
    authToken: dbToken() ? 'set' : 'unset',
    serverless: onServerless(),
  }
}

/**
 * libSQL client: a local SQLite file in development (`file:./data/persianuxmap.db`),
 * or a hosted database such as Turso in production (`libsql://…` + DATABASE_AUTH_TOKEN) — needed on
 * serverless hosts like Vercel, whose file system doesn't persist.
 * Opened on the first request; runs pending migrations and seeds the demo designers once.
 */
export function getDb(): Promise<DB> {
  ready ??= (async () => {
    const url = dbUrl() || 'file:./data/persianuxmap.db'
    if (onServerless() && url.startsWith('file:'))
      throw new Error('DATABASE_URL is not set. On Vercel the file system is read-only: connect Turso (Vercel → Storage) or set DATABASE_URL (libsql://…) and DATABASE_AUTH_TOKEN, then redeploy.')
    if (/^libsql:|^https?:|^wss?:/.test(url) && !dbToken())
      console.warn('[db] DATABASE_AUTH_TOKEN is not set — Turso will reject the connection.')
    if (url.startsWith('file:')) mkdirSync(dirname(resolve(url.slice('file:'.length))), { recursive: true })
    const client = createClient({ url, authToken: dbToken() })
    const db = drizzle(client, { schema })
    await runMigrations(client)
    await seedIfEmpty(db)
    return db
  })().catch((e) => {
    ready = null // retry on the next request instead of caching the failure
    throw e
  })
  return ready
}

export { schema }
