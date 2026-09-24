import type { Designer } from '../data/designers'
import { ROLES } from '../data/taxonomy'
import type { ProfileInputT } from './contract'

export const normalizeUrl = (u?: string) => {
  const s = (u ?? '').trim()
  if (!s) return undefined
  return /^https?:\/\//i.test(s) ? s : `https://${s}`
}

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
    bio: { en: bio, fa: bio },
    links: { linkedin: normalizeUrl(input.linkedin), portfolio: normalizeUrl(input.portfolio), website: normalizeUrl(input.website) },
    avatar: { hue: input.hue, photo: input.photo || undefined },
  }
}

export const randomCode = () => String(100000 + Math.floor(Math.random() * 900000))
