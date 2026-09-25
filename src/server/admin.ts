import { eq, inArray } from 'drizzle-orm'
import type { AdminDesignerT, AdminOverviewT, AdminReportT } from '../api/contract'
import { cityById } from '../data/geo'
import type { RoleId, SkillId } from '../data/taxonomy'
import { getDb, schema } from './db'

const { users, profiles, sessions, reports } = schema

/** Admins are the (lower-cased) emails in ADMIN_EMAILS, comma- or space-separated. */
export const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? '')
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
export const isAdminEmail = (email: string) => adminEmails().includes(email.toLowerCase())

type Row = { p: typeof profiles.$inferSelect; u: typeof users.$inferSelect }

function toAdminDesigner({ p, u }: Row, openReports: number): AdminDesignerT {
  return {
    id: p.id,
    name: { en: p.nameEn, fa: p.nameFa },
    role: p.role as RoleId,
    title: { en: p.titleEn, fa: p.titleFa },
    cityId: p.cityId,
    skills: p.skills as SkillId[],
    bio: { en: p.bioEn, fa: p.bioFa },
    links: {
      linkedin: p.linkedin ?? undefined,
      portfolio: p.portfolio ?? undefined,
      website: p.website ?? undefined,
      instagram: p.instagram ?? undefined,
      telegram: p.telegram ?? undefined,
    },
    joined: p.joinedAt.toISOString(),
    verification: p.verification,
    avatar: { hue: p.hue, photo: p.photo ?? undefined },
    email: u.email,
    provider: u.provider,
    hidden: p.hidden,
    openReports,
  }
}

async function openReportCounts() {
  const rows = await (await getDb()).select({ profileId: reports.profileId }).from(reports).where(eq(reports.status, 'open'))
  const m = new Map<string, number>()
  rows.forEach((r) => m.set(r.profileId, (m.get(r.profileId) ?? 0) + 1))
  return m
}

const top = (m: Map<string, number>, k = 8) =>
  [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([key, n]) => ({ key, n }))

export async function overview(): Promise<AdminOverviewT> {
  const db = await getDb()
  const [rows, allUsers, allReports, sessionRows] = await Promise.all([
    db.select({ p: profiles, u: users }).from(profiles).innerJoin(users, eq(profiles.userId, users.id)),
    db.select().from(users),
    db.select({ status: reports.status }).from(reports),
    db.select({ token: sessions.token }).from(sessions),
  ])
  const now = Date.now()
  const DAY = 86400000
  const withProfile = new Set(rows.map((r) => r.u.id))

  // Sign-ups per week for the last 12 weeks (weeks start on Monday, UTC).
  const monday = new Date(now)
  monday.setUTCHours(0, 0, 0, 0)
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
  const weekly = Array.from({ length: 12 }, (_, i) => ({ weekStart: new Date(monday.getTime() - (11 - i) * 7 * DAY).toISOString(), n: 0 }))
  const firstWeek = new Date(weekly[0].weekStart).getTime()

  const cities = new Map<string, number>()
  const countries = new Map<string, number>()
  const skills = new Map<string, number>()
  const roles = new Map<string, number>()
  const verification = { email: 0, pending: 0, verified: 0, unverified: 0 }
  let last7 = 0
  let last30 = 0
  for (const { p } of rows) {
    const t = p.joinedAt.getTime()
    if (t > now - 7 * DAY) last7++
    if (t > now - 30 * DAY) last30++
    if (t >= firstWeek) weekly[Math.min(11, Math.floor((t - firstWeek) / (7 * DAY)))].n++
    verification[p.verification]++
    cities.set(p.cityId, (cities.get(p.cityId) ?? 0) + 1)
    countries.set(p.countryCode, (countries.get(p.countryCode) ?? 0) + 1)
    roles.set(p.role, (roles.get(p.role) ?? 0) + 1)
    ;(p.skills as string[]).forEach((s) => skills.set(s, (skills.get(s) ?? 0) + 1))
  }

  return {
    designers: { total: rows.length, visible: rows.filter((r) => !r.p.hidden && r.u.emailVerified).length, hidden: rows.filter((r) => r.p.hidden).length },
    verification,
    users: {
      total: allUsers.length,
      withoutProfile: allUsers.filter((u) => !withProfile.has(u.id)).length,
      demo: allUsers.filter((u) => u.provider === 'seed').length,
      google: allUsers.filter((u) => u.provider === 'google').length,
      email: allUsers.filter((u) => u.provider === 'email').length,
    },
    signups: { last7, last30, weekly },
    reports: { open: allReports.filter((r) => r.status === 'open').length, total: allReports.length },
    geography: { countries: countries.size, cities: cities.size, topCities: top(cities), topCountries: top(countries) },
    topSkills: top(skills, 10),
    roles: top(roles, 10),
    activeSessions: sessionRows.length,
  }
}

export async function listDesigners(input: { q?: string; filter: string; limit: number; offset: number }) {
  const db = await getDb()
  const [rows, counts] = await Promise.all([db.select({ p: profiles, u: users }).from(profiles).innerJoin(users, eq(profiles.userId, users.id)), openReportCounts()])
  const q = input.q?.trim().toLowerCase()
  const filtered = rows
    .filter(({ p, u }) => {
      switch (input.filter) {
        case 'pending':
          return p.verification === 'pending'
        case 'verified':
          return p.verification === 'verified'
        case 'email':
          return p.verification === 'email'
        case 'hidden':
          return p.hidden
        case 'reported':
          return (counts.get(p.id) ?? 0) > 0
        case 'real':
          return u.provider !== 'seed'
        default:
          return true
      }
    })
    .filter(({ p, u }) => {
      if (!q) return true
      const city = cityById[p.cityId]
      return [p.nameEn, p.nameFa, u.email, p.titleEn, city?.en, city?.fa].some((v) => v?.toLowerCase().includes(q))
    })
    // Newest first — that's where review work is.
    .sort((a, b) => b.p.joinedAt.getTime() - a.p.joinedAt.getTime())
  return {
    total: filtered.length,
    items: filtered.slice(input.offset, input.offset + input.limit).map((r) => toAdminDesigner(r, counts.get(r.p.id) ?? 0)),
  }
}

export async function listReports(status: string): Promise<AdminReportT[]> {
  const db = await getDb()
  const all = await db.select().from(reports)
  const chosen = all.filter((r) => status === 'all' || r.status === status).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  const profileIds = [...new Set(chosen.map((r) => r.profileId))]
  const reporterIds = [...new Set(chosen.map((r) => r.reporterUserId).filter(Boolean))] as string[]
  const [profRows, reporters, counts] = await Promise.all([
    profileIds.length ? db.select({ p: profiles, u: users }).from(profiles).innerJoin(users, eq(profiles.userId, users.id)).where(inArray(profiles.id, profileIds)) : [],
    reporterIds.length ? db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, reporterIds)) : [],
    openReportCounts(),
  ])
  const byId = new Map(profRows.map((r) => [r.p.id, r]))
  const emailOf = new Map(reporters.map((r) => [r.id, r.email]))
  return chosen.map((r) => ({
    id: r.id,
    reason: r.reason,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    status: r.status,
    resolvedAt: r.resolvedAt?.toISOString() ?? null,
    resolvedBy: r.resolvedBy,
    reporterEmail: r.reporterUserId ? (emailOf.get(r.reporterUserId) ?? null) : null,
    profile: byId.has(r.profileId) ? toAdminDesigner(byId.get(r.profileId)!, counts.get(r.profileId) ?? 0) : null,
  }))
}
