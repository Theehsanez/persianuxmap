import { createFileRoute } from '@tanstack/react-router'
import { sql } from 'drizzle-orm'
import { getDb, databaseInfo } from '../../server/db'

/** GET /api/health — is the database reachable? Reports configuration problems without exposing secrets. */
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        const info = databaseInfo()
        try {
          const db = await getDb()
          const row = await db.get<{ n: number }>(sql`select count(*) as n from profiles`)
          return Response.json({ ok: true, database: { ...info, profiles: row?.n ?? 0 } })
        } catch (e) {
          return Response.json({ ok: false, database: info, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
        }
      },
    },
  },
})
