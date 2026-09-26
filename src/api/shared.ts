import type { Designer } from '../data/designers'
import { ROLES, skillById, toolById, type SkillId, type ToolId } from '../data/taxonomy'
import type { ProfileInputT } from './contract'

/** Drop ids that no longer exist (e.g. a skill/tool that moved list or was retired) so one stale row can't break the whole map. */
export const liveSkills = (skills: string[]): SkillId[] => skills.filter((s): s is SkillId => s in skillById)
export const liveTools = (tools: string[]): ToolId[] => tools.filter((t): t is ToolId => t in toolById)

export const normalizeUrl = (u?: string) => {
  const s = (u ?? '').trim()
  if (!s) return undefined
  return /^https?:\/\//i.test(s) ? s : `https://${s}`
}

/**
 * Accept "@name", "name", or a profile URL (instagram.com/name, t.me/name) and return the bare handle.
 * Returns undefined for empty input and null when it isn't a valid handle.
 */
export function socialHandle(kind: 'instagram' | 'telegram', raw?: string): string | undefined | null {
  let s = (raw ?? '').trim()
  if (!s) return undefined
  s = s.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  s = kind === 'instagram' ? s.replace(/^instagram\.com\//i, '') : s.replace(/^(t\.me|telegram\.me)\//i, '')
  s = s.replace(/^@/, '').split(/[/?#]/)[0]
  const ok = kind === 'instagram' ? /^[A-Za-z0-9._]{1,30}$/.test(s) : /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(s)
  return ok ? s : null
}
export const instagramUrl = (h: string) => `https://instagram.com/${h}`
export const telegramUrl = (h: string) => `https://t.me/${h}`

/** Build the public Designer shape from what the person typed. Their own text is shown as typed in both languages. */
export function designerFromInput(input: ProfileInputT, base: Pick<Designer, 'id' | 'joined' | 'verification'>): Designer {
  const role = ROLES.find((r) => r.id === input.role)!
  const title = input.title?.trim()
  const name = input.name.trim()
  const bio = input.bio?.trim() ?? ''
  return {
    ...base,
    name: { en: name, fa: name },
    role: input.role,
    title: title ? { en: title, fa: title } : { en: role.en, fa: role.fa },
    cityId: input.cityId,
    skills: input.skills,
    tools: input.tools,
    bio: { en: bio, fa: bio },
    links: {
      linkedin: normalizeUrl(input.linkedin),
      portfolio: normalizeUrl(input.portfolio),
      website: normalizeUrl(input.website),
      instagram: socialHandle('instagram', input.instagram) || undefined,
      telegram: socialHandle('telegram', input.telegram) || undefined,
    },
    avatar: { hue: input.hue, photo: input.photo || undefined },
  }
}

export const randomCode = () => String(100000 + Math.floor(Math.random() * 900000))
