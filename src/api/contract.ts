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
  links: z.object({ linkedin: z.string().optional(), portfolio: z.string().optional(), website: z.string().optional() }),
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
    // Uploaded photos are downscaled to 256px JPEG data URLs on the client.
    photo: z.string().max(200_000).optional(),
    hue: z.number().min(0).max(360),
  })
  .refine((p) => p.linkedin || p.portfolio, { message: 'LinkedIn or Portfolio is required', path: ['portfolio'] })

const Session = z.object({ token: z.string(), account: AccountSchema })

export const contract = {
  designers: {
    /** Everyone visible on the public map (email confirmed, not hidden). */
    list: oc.output(z.array(DesignerSchema)),
  },
  auth: {
    /** Send a 6-digit code. Without a mail provider configured, the code is returned so the demo inbox can show it. */
    requestCode: oc.input(z.object({ email: z.email() })).output(z.object({ sent: z.literal(true), devCode: z.string().optional() })),
    verifyCode: oc.input(z.object({ email: z.email(), code: z.string().length(6) })).output(Session),
    /** Simulated Google sign-in (demo): real OAuth needs client credentials. */
    google: oc.output(Session),
    me: oc.output(AccountSchema.nullable()),
    signOut: oc.output(z.object({ ok: z.literal(true) })),
  },
  profile: {
    save: oc.input(ProfileInput).output(AccountSchema),
    setHidden: oc.input(z.object({ hidden: z.boolean() })).output(AccountSchema),
    requestReview: oc.output(AccountSchema),
    /** Demo-only shortcut so the full verification flow can be tried. */
    approveDemo: oc.output(AccountSchema),
    remove: oc.output(z.object({ ok: z.literal(true) })),
  },
  reports: {
    create: oc
      .input(z.object({ profileId: z.string(), reason: z.enum(['fake', 'notDesigner', 'impersonation', 'inappropriate', 'other']), note: z.string().max(500).optional() }))
      .output(z.object({ ok: z.literal(true) })),
  },
}

export type Contract = typeof contract
export type Account = z.infer<typeof AccountSchema>
export type ProfileInputT = z.infer<typeof ProfileInput>
