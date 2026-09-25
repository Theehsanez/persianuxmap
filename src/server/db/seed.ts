import { count } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { DEMO_DESIGNERS } from '../../data/designers'
import { cityById } from '../../data/geo'
import * as schema from './schema'

/** Fill an empty database with the demo designers so the map is alive from the first run. */
export async function seedIfEmpty(db: LibSQLDatabase<typeof schema>) {
  const [{ n }] = await db.select({ n: count() }).from(schema.profiles)
  if (n > 0) return
  const users = DEMO_DESIGNERS.map((d) => ({
    id: `seed-${d.id}`,
    email: `${d.id}@demo.persianuxmap.local`,
    provider: 'seed' as const,
    emailVerified: true,
    createdAt: new Date(d.joined),
  }))
  const profiles = DEMO_DESIGNERS.map((d) => ({
    id: d.id,
    userId: `seed-${d.id}`,
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
    instagram: d.links.instagram ?? null,
    telegram: d.links.telegram ?? null,
    photo: d.avatar.photo ?? null,
    hue: d.avatar.hue,
    verification: d.verification,
    hidden: false,
    joinedAt: new Date(d.joined),
  }))
  // onConflictDoNothing: safe if two cold-started instances seed at the same moment.
  await db.batch([
    db.insert(schema.users).values(users).onConflictDoNothing(),
    db.insert(schema.profiles).values(profiles).onConflictDoNothing(),
  ])
  console.log(`[db] seeded ${DEMO_DESIGNERS.length} demo designers`)
}
