import type { Client } from '@libsql/client'

/**
 * Minimal migrator for the SQL files drizzle-kit generates in /drizzle.
 * They are bundled into the server at build time (no file-system access needed at runtime,
 * which serverless hosts don't guarantee). Applied migrations are tracked in `__migrations`.
 */
const files = import.meta.glob('../../../drizzle/*.sql', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export async function runMigrations(client: Client) {
  await client.execute('CREATE TABLE IF NOT EXISTS __migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)')
  const applied = new Set((await client.execute('SELECT name FROM __migrations')).rows.map((r) => String(r.name)))
  for (const [path, sql] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    const name = path.split('/').pop()!.replace(/\.sql$/, '')
    if (applied.has(name)) continue
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean)
    try {
      // One transaction per migration, including its bookkeeping row.
      await client.batch([...statements, { sql: 'INSERT INTO __migrations (name, applied_at) VALUES (?, ?)', args: [name, Date.now()] }], 'write')
      console.log(`[db] applied migration ${name}`)
    } catch (e) {
      // Another instance may have applied it concurrently (cold starts); only rethrow if it's still missing.
      const again = await client.execute({ sql: 'SELECT 1 FROM __migrations WHERE name = ?', args: [name] })
      if (!again.rows.length) throw e
    }
  }
}
