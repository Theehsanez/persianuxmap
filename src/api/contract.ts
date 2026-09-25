import { oc } from '@orpc/contract'
import { z } from 'zod'
import { ROLES, SKILLS, MAX_SKILLS, MIN_SKILLS } from '../data/taxonomy'

/**
 * The API contract — the single source of truth shared by the server (Drizzle + SQLite)
 * and the in-browser demo implementation used for the static GitHub Pages build.
 */

const L10n = z.object({ en: z.string(), fa: z.string() })
const RoleId = z.enum(ROLES.map((r) => r.id) as [(typeof ROLES)[number]['id'], ...(typeof ROLES)[number]['id'][]])
const SkillId = z.enum(SKILLS.map((s) => s.id) as [(typeof SKILLS)[number]['id'], ...(typeof SKILLS)[number]['id'][]])
export const Verification = z.enum(['unverified', 'email', 'pending', 'verified'])

export const DesignerSchema = z.object({
  id: z.string(),
  name: L10n,
  role: RoleId,
  title: L10n,
  cityId: z.string(),
  skills: z.array(SkillId),
  bio: L10n,
  links: z.object({
    linkedin: z.string().optional(),
    portfolio: z.string().optional(),
    website: z.string().optional(),
    instagram: z.string().optional(),
    telegram: z.string().optional(),
  }),
  joined: z.string(),
  verification: Verification,
  avatar: z.object({ hue: z.number(), photo: z.string().optional() }),
})

export const AccountSchema = z.object({
  email: z.string(),
  provider: z.enum(['google', 'email']),
  emailVerified: z.boolean(),
  hidden: z.boolean(),
  profile: DesignerSchema.nullable(),
  /** True for emails listed in ADMIN_EMAILS. */
  isAdmin: z.boolean().optional(),
})

const Count = z.object({ key: z.string(), n: z.number() })
export const AdminOverview = z.object({
  designers: z.object({ total: z.number(), visible: z.number(), hidden: z.number() }),
  verification: z.object({ email: z.number(), pending: z.number(), verified: z.number(), unverified: z.number() }),
  users: z.object({ total: z.number(), withoutProfile: z.number(), demo: z.number(), google: z.number(), email: z.number() }),
  signups: z.object({ last7: z.number(), last30: z.number(), weekly: z.array(z.object({ weekStart: z.string(), n: z.number() })) }),
  reports: z.object({ open: z.number(), total: z.number() }),
  geography: z.object({ countries: z.number(), cities: z.number(), topCities: z.array(Count), topCountries: z.array(Count) }),
  topSkills: z.array(Count),
  roles: z.array(Count),
  activeSessions: z.number(),
})

export const AdminDesigner = DesignerSchema.extend({
  email: z.string(),
  provider: z.enum(['google', 'email', 'seed']),
  hidden: z.boolean(),
  openReports: z.number(),
})

export const AdminReport = z.object({
  id: z.string(),
  reason: z.string(),
  note: z.string().nullable(),
  createdAt: z.string(),
  status: z.enum(['open', 'dismissed', 'actioned']),
  resolvedAt: z.string().nullable(),
  resolvedBy: z.string().nullable(),
  reporterEmail: z.string().nullable(),
  profile: AdminDesigner.nullable(),
})

const url = z.string().max(300).optional()
/** What a person submits in onboarding / edit profile. Only city, country and the city centre are ever stored. */
export const ProfileInput = z
  .object({
    name: z.string().trim().min(2).max(80),
    title: z.string().trim().max(80).optional(),
    role: RoleId,
    cityId: z.string(),
    bio: z.string().trim().max(180).optional(),
    skills: z.array(SkillId).min(MIN_SKILLS).max(MAX_SKILLS),
    linkedin: url,
    portfolio: url,
    website: url,
    // Handles or profile links; normalised to a bare handle before saving.
    instagram: z.string().max(100).optional(),
    telegram: z.string().max(100).optional(),
    // Uploaded photos are downscaled to 256px JPEG data URLs on the client.
    photo: z.string().max(200_000).optional(),
    hue: z.number().min(0).max(360),
  })
  .refine((p) => p.linkedin || p.portfolio, { message: 'LinkedIn or Portfolio is required', path: ['portfolio'] })

/** Admin-only procedures (session email must be listed in ADMIN_EMAILS). */
export const adminContract = {
  overview: oc.output(AdminOverview),
  designers: oc
    .input(
      z.object({
        q: z.string().max(100).optional(),
        filter: z.enum(['all', 'pending', 'verified', 'email', 'hidden', 'reported', 'real']).default('all'),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .output(z.object({ items: z.array(AdminDesigner), total: z.number() })),
  setVerification: oc.input(z.object({ id: z.string(), verification: z.enum(['email', 'verified']) })).output(z.object({ ok: z.literal(true) })),
  setHidden: oc.input(z.object({ id: z.string(), hidden: z.boolean() })).output(z.object({ ok: z.literal(true) })),
  deleteProfile: oc.input(z.object({ id: z.string() })).output(z.object({ ok: z.literal(true) })),
  reports: oc.input(z.object({ status: z.enum(['open', 'dismissed', 'actioned', 'all']).default('open') })).output(z.array(AdminReport)),
  resolveReport: oc.input(z.object({ id: z.string(), status: z.enum(['dismissed', 'actioned', 'open']) })).output(z.object({ ok: z.literal(true) })),
}

const Session = z.object({ token: z.string(), account: AccountSchema })

export const contract = {
  designers: {
    /** Everyone visible on the public map (email confirmed, not hidden). */
    list: oc.output(z.array(DesignerSchema)),
  },
  auth: {
    /** Send a 6-digit code. Without a mail provider configured, the code is returned so the demo inbox can show it. */
    /** Which sign-in methods are live, so the UI can use real Google OAuth or fall back to the demo flow. */
    config: oc.output(z.object({ googleOAuth: z.boolean(), emailDelivery: z.boolean(), adminConfigured: z.boolean().optional() })),
    requestCode: oc.input(z.object({ email: z.email() })).output(z.object({ sent: z.literal(true), devCode: z.string().optional() })),
    verifyCode: oc.input(z.object({ email: z.email(), code: z.string().length(6) })).output(Session),
    /** Simulated Google sign-in for the demo. Disabled once real Google OAuth is configured (see /api/auth/google). */
    google: oc.output(Session),
    me: oc.output(AccountSchema.nullable()),
    signOut: oc.output(z.object({ ok: z.literal(true) })),
  },
  profile: {
    save: oc.input(ProfileInput).output(AccountSchema),
    setHidden: oc.input(z.object({ hidden: z.boolean() })).output(AccountSchema),
    requestReview: oc.output(AccountSchema),
    /** Demo-only shortcut so the full verification flow can be tried. Disabled once ADMIN_EMAILS is set. */
    approveDemo: oc.output(AccountSchema),
    remove: oc.output(z.object({ ok: z.literal(true) })),
  },
  admin: adminContract,
  reports: {
    create: oc
      .input(z.object({ profileId: z.string(), reason: z.enum(['fake', 'notDesigner', 'impersonation', 'inappropriate', 'other']), note: z.string().max(500).optional() }))
      .output(z.object({ ok: z.literal(true) })),
  },
}


export type Contract = typeof contract
export type AdminOverviewT = z.infer<typeof AdminOverview>
export type AdminDesignerT = z.infer<typeof AdminDesigner>
export type AdminReportT = z.infer<typeof AdminReport>
export type Account = z.infer<typeof AccountSchema>
export type ProfileInputT = z.infer<typeof ProfileInput>
