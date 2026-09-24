import { createClient } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import * as schema from './schema'
import { runMigrations } from './migrate'
import { seedIfEmpty } from './seed'

export type DB = LibSQLDatabase<typeof schema>

let ready: Promise<DB> | null = null

/**
 * libSQL client: a local SQLite file in development (`file:./data/persianuxmap.db`),
 * or a hosted database such as Turso in production (`libsql://…` + DATABASE_AUTH_TOKEN) — needed on
 * serverless hosts like Vercel, whose file system doesn't persist.
 * Opened on the first request; runs pending migrations and seeds the demo designers once.
 */
export function getDb(): Promise<DB> {
  ready ??= (async () => {
    const url = process.env.DATABASE_URL ?? 'file:./data/persianuxmap.db'
    if (url.startsWith('file:')) mkdirSync(dirname(resolve(url.slice('file:'.length))), { recursive: true })
    const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN })
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
