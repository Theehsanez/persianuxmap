import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  provider: text('provider', { enum: ['google', 'email', 'seed'] }).notNull(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

/**
 * A designer's public profile. Location is only city + country (via the city id) — never an address or GPS point;
 * map positions are generated around the city centre on the client.
 */
export const profiles = sqliteTable(
  'profiles',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    nameEn: text('name_en').notNull(),
    nameFa: text('name_fa').notNull(),
    titleEn: text('title_en').notNull(),
    titleFa: text('title_fa').notNull(),
    role: text('role').notNull(),
    cityId: text('city_id').notNull(),
    countryCode: text('country_code').notNull(),
    bioEn: text('bio_en').notNull().default(''),
    bioFa: text('bio_fa').notNull().default(''),
    skills: text('skills', { mode: 'json' }).$type<string[]>().notNull(),
    tools: text('tools', { mode: 'json' }).$type<string[]>().notNull().default([]),
    linkedin: text('linkedin'),
    portfolio: text('portfolio'),
    website: text('website'),
    /** Social handles, stored without @ or URL (rendered as instagram.com/… and t.me/…). */
    instagram: text('instagram'),
    telegram: text('telegram'),
    photo: text('photo'),
    hue: real('hue').notNull(),
    verification: text('verification', { enum: ['unverified', 'email', 'pending', 'verified'] }).notNull().default('email'),
    hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false),
    joinedAt: integer('joined_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [index('profiles_city_idx').on(t.cityId), index('profiles_country_idx').on(t.countryCode)],
)

export const sessions = sqliteTable('sessions', {
  token: text('token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

export const emailCodes = sqliteTable('email_codes', {
  email: text('email').primaryKey(),
  code: text('code').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  attempts: integer('attempts').notNull().default(0),
})

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  reporterUserId: text('reporter_user_id'),
  reason: text('reason').notNull(),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  /** open → dismissed (no action needed) or actioned (profile hidden/removed) by an admin. */
  status: text('status', { enum: ['open', 'dismissed', 'actioned'] }).notNull().default('open'),
  resolvedAt: integer('resolved_at', { mode: 'timestamp_ms' }),
  resolvedBy: text('resolved_by'),
})
