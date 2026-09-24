import { defineConfig } from 'drizzle-kit'

// Used for `npm run db:generate` / `db:studio`. Local file by default; set DATABASE_URL (+ DATABASE_AUTH_TOKEN) for Turso.
export default defineConfig({
  dialect: 'turso',
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? 'file:./data/persianuxmap.db', authToken: process.env.DATABASE_AUTH_TOKEN },
})
