import { implement, ORPCError } from '@orpc/server'
import { and, eq } from 'drizzle-orm'
import { randomBytes, randomUUID } from 'node:crypto'
import { contract, type Account } from '../api/contract'
import { designerFromInput, randomCode } from '../api/shared'
import type { Designer } from '../data/designers'
import type { RoleId, SkillId } from '../data/taxonomy'
import { cityById } from '../data/geo'
import { getDb, schema } from './db'

type Ctx = { headers: Headers }
const os = implement(contract).$context<Ctx>()

const { users, profiles, sessions, emailCodes, reports } = schema
type ProfileRow = typeof profiles.$inferSelect
type UserRow = typeof users.$inferSelect

const toDesigner = (p: ProfileRow): Designer => ({
  id: p.id,
  name: { en: p.nameEn, fa: p.nameFa },
  role: p.role as RoleId,
  title: { en: p.titleEn, fa: p.titleFa },
  cityId: p.cityId,
  skills: p.skills as SkillId[],
  bio: { en: p.bioEn, fa: p.bioFa },
  links: { linkedin: p.linkedin ?? undefined, portfolio: p.portfolio ?? undefined, website: p.website ?? undefined },
  joined: p.joinedAt.toISOString(),
  verification: p.verification,
  avatar: { hue: p.hue, photo: p.photo ?? undefined },
})

async function accountOf(user: UserRow): Promise<Account> {
  const p = await (await getDb()).select().from(profiles).where(eq(profiles.userId, user.id)).get()
  return {
    email: user.email,
    provider: user.provider === 'google' ? 'google' : 'email',
    emailVerified: user.emailVerified,
    hidden: p?.hidden ?? false,
    profile: p ? toDesigner(p) : null,
  }
}

async function currentUser(headers: Headers): Promise<UserRow | null> {
  const token = headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const row = await (await getDb()).select({ user: users }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(eq(sessions.token, token)).get()
  return row?.user ?? null
}

/** Procedures below require a signed-in person with a confirmed email. */
const authed = os.middleware(async ({ context, next }) => {
  const user = await currentUser(context.headers)
  if (!user) throw new ORPCError('UNAUTHORIZED')
  if (!user.emailVerified) throw new ORPCError('FORBIDDEN', { message: 'Email not verified' })
  return next({ context: { user } })
})

async function openSession(email: string, provider: 'google' | 'email') {
  const db = await getDb()
  let user = await db.select().from(users).where(eq(users.email, email)).get()
  if (!user) {
    user = { id: randomUUID(), email, provider, emailVerified: true, createdAt: new Date() }
    await db.insert(users).values(user)
  } else if (!user.emailVerified) {
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, user.id))
    user = { ...user, emailVerified: true }
  }
  const token = randomBytes(32).toString('base64url')
  await db.insert(sessions).values({ token, userId: user.id, createdAt: new Date() })
  return { token, account: await accountOf(user) }
}

const CODE_TTL = 10 * 60 * 1000
const MAX_ATTEMPTS = 5
// No mail provider is wired up yet, so by default the code is returned to the client for the demo inbox.
const exposeCodes = process.env.EXPOSE_EMAIL_CODES !== 'false'

export const router = os.router({
  designers: {
    list: os.designers.list.handler(async () => {
      const rows = await (await getDb())
        .select({ p: profiles })
        .from(profiles)
        .innerJoin(users, eq(profiles.userId, users.id))
        .where(and(eq(profiles.hidden, false), eq(users.emailVerified, true)))
      return rows.map((r) => toDesigner(r.p))
    }),
  },

  auth: {
    requestCode: os.auth.requestCode.handler(async ({ input }) => {
      const email = input.email.toLowerCase()
      const code = randomCode()
      await (await getDb())
        .insert(emailCodes)
        .values({ email, code, expiresAt: new Date(Date.now() + CODE_TTL), attempts: 0 })
        .onConflictDoUpdate({ target: emailCodes.email, set: { code, expiresAt: new Date(Date.now() + CODE_TTL), attempts: 0 } })
      // TODO: send `code` by email once a mail provider is configured.
      return { sent: true as const, devCode: exposeCodes ? code : undefined }
    }),
    verifyCode: os.auth.verifyCode.handler(async ({ input }) => {
      const db = await getDb()
      const email = input.email.toLowerCase()
      const row = await db.select().from(emailCodes).where(eq(emailCodes.email, email)).get()
      if (!row || row.expiresAt.getTime() < Date.now() || row.attempts >= MAX_ATTEMPTS) throw new ORPCError('BAD_REQUEST', { message: 'Code expired' })
      if (row.code !== input.code) {
        await db.update(emailCodes).set({ attempts: row.attempts + 1 }).where(eq(emailCodes.email, email))
        throw new ORPCError('BAD_REQUEST', { message: 'Wrong code' })
      }
      await db.delete(emailCodes).where(eq(emailCodes.email, email))
      return openSession(email, 'email')
    }),
    google: os.auth.google.handler(() => openSession('you@gmail.com', 'google')),
    me: os.auth.me.handler(async ({ context }) => {
      const user = await currentUser(context.headers)
      return user ? accountOf(user) : null
    }),
    signOut: os.auth.signOut.handler(async ({ context }) => {
      const token = context.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
      if (token) await (await getDb()).delete(sessions).where(eq(sessions.token, token))
      return { ok: true as const }
    }),
  },

  profile: {
    save: os.profile.save.use(authed).handler(async ({ input, context }) => {
      const city = cityById[input.cityId]
      if (!city) throw new ORPCError('BAD_REQUEST', { message: 'Unknown city' })
      const db = await getDb()
      const existing = await db.select().from(profiles).where(eq(profiles.userId, context.user.id)).get()
      const d = designerFromInput(input, {
        id: existing?.id ?? randomUUID(),
        joined: (existing?.joinedAt ?? new Date()).toISOString(),
        verification: existing?.verification ?? 'email',
      })
      const values = {
        nameEn: d.name.en,
        nameFa: d.name.fa,
        titleEn: d.title.en,
        titleFa: d.title.fa,
        role: d.role,
        cityId: d.cityId,
        countryCode: city.country,
        bioEn: d.bio.en,
        bioFa: d.bio.fa,
        skills: d.skills,
        linkedin: d.links.linkedin ?? null,
        portfolio: d.links.portfolio ?? null,
        website: d.links.website ?? null,
        photo: d.avatar.photo ?? null,
        hue: d.avatar.hue,
      }
      if (existing) await db.update(profiles).set(values).where(eq(profiles.id, existing.id))
      else await db.insert(profiles).values({ ...values, id: d.id, userId: context.user.id, joinedAt: new Date(), verification: 'email', hidden: false })
      return accountOf(context.user)
    }),
    setHidden: os.profile.setHidden.use(authed).handler(async ({ input, context }) => {
      await (await getDb()).update(profiles).set({ hidden: input.hidden }).where(eq(profiles.userId, context.user.id))
      return accountOf(context.user)
    }),
    requestReview: os.profile.requestReview.use(authed).handler(async ({ context }) => {
      await (await getDb())
        .update(profiles)
        .set({ verification: 'pending' })
        .where(and(eq(profiles.userId, context.user.id), eq(profiles.verification, 'email')))
      return accountOf(context.user)
    }),
    approveDemo: os.profile.approveDemo.use(authed).handler(async ({ context }) => {
      await (await getDb())
        .update(profiles)
        .set({ verification: 'verified' })
        .where(and(eq(profiles.userId, context.user.id), eq(profiles.verification, 'pending')))
      return accountOf(context.user)
    }),
    remove: os.profile.remove.use(authed).handler(async ({ context }) => {
      // Deleting the user cascades to their profile, sessions and reports about them.
      await (await getDb()).delete(users).where(eq(users.id, context.user.id))
      return { ok: true as const }
    }),
  },

  reports: {
    create: os.reports.create.handler(async ({ input, context }) => {
      const db = await getDb()
      if (!(await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, input.profileId)).get())) throw new ORPCError('NOT_FOUND')
      const reporter = await currentUser(context.headers)
      await db
        .insert(reports)
        .values({ id: randomUUID(), profileId: input.profileId, reporterUserId: reporter?.id ?? null, reason: input.reason, note: input.note ?? null, createdAt: new Date() })
      return { ok: true as const }
    }),
  },
})
