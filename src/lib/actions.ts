import { api, session, type Api } from '../api/client'
import { useStore } from './store'
import { DICTS } from './i18n'
import type { Draft } from '../components/ProfileForm'
import type { ProfileInputT } from '../api/contract'

/** Run an API call; on failure show a toast and resolve to undefined so callers can bail out. */
export async function call<T>(fn: (api: Api) => Promise<T>): Promise<T | undefined> {
  try {
    return await fn(await api())
  } catch (e) {
    console.error('[api]', e)
    const s = useStore.getState()
    s.toast(DICTS[s.locale].genericError)
    return undefined
  }
}

export const toProfileInput = (d: Draft): ProfileInputT => ({
  name: d.name,
  title: d.title || undefined,
  role: d.role || 'other',
  cityId: d.cityId,
  bio: d.bio || undefined,
  skills: d.skills,
  tools: d.tools,
  linkedin: d.linkedin || undefined,
  portfolio: d.portfolio || undefined,
  website: d.website || undefined,
  instagram: d.instagram.trim() || undefined,
  telegram: d.telegram.trim() || undefined,
  photo: d.photo,
  hue: d.hue,
})

/** Save the account returned by a mutation and refresh the public map list in the background. */
export function applyAccount(a: Parameters<ReturnType<typeof useStore.getState>['setAccount']>[0]) {
  const s = useStore.getState()
  s.setAccount(a)
  void s.loadDesigners().catch(() => {})
}

export async function signOutEverywhere() {
  await call((a) => a.auth.signOut())
  session.set(null)
  applyAccount(null)
}
