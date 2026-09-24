import { count } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { DEMO_DESIGNERS } from '../../data/designers'
import { cityById } from '../../data/geo'
import * as schema from './schema'

/** Fill an empty database with the demo designers so the map is alive from the first run. */
export function seedIfEmpty(db: BetterSQLite3Database<typeof schema>) {
  const [{ n }] = db.select({ n: count() }).from(schema.profiles).all()
  if (n > 0) return
  db.transaction((tx) => {
    for (const d of DEMO_DESIGNERS) {
      const userId = `seed-${d.id}`
      tx.insert(schema.users)
        .values({ id: userId, email: `${d.id}@demo.persianuxmap.local`, provider: 'seed', emailVerified: true, createdAt: new Date(d.joined) })
        .run()
      tx.insert(schema.profiles)
        .values({
          id: d.id,
          userId,
          nameEn: d.name.en,
          nameFa: d.name.fa,
          titleEn: d.title.en,
          titleFa: d.title.fa,
          role: d.role,
          cityId: d.cityId,
          countryCode: cityById[d.cityId].country,
          bioEn: d.bio.en,
          bioFa: d.bio.fa,
          skills: d.skills,
          linkedin: d.links.linkedin ?? null,
          portfolio: d.links.portfolio ?? null,
          website: d.links.website ?? null,
          photo: d.avatar.photo ?? null,
          hue: d.avatar.hue,
          verification: d.verification,
          hidden: false,
          joinedAt: new Date(d.joined),
        })
        .run()
    }
  })
  console.log(`[db] seeded ${DEMO_DESIGNERS.length} demo designers`)
}
