import { create } from 'zustand'
import type { Locale, RoleId, SkillId } from '../data/taxonomy'
import type { Designer } from '../data/designers'
import { api, session } from '../api/client'
import type { Account as ApiAccount } from '../api/contract'

export type Filters = { q: string; roles: RoleId[]; skills: SkillId[]; countries: string[]; cities: string[] }
export const EMPTY_FILTERS: Filters = { q: '', roles: [], skills: [], countries: [], cities: [] }

/** A signed-in person who has finished onboarding (has a profile). */
export type Account = Omit<ApiAccount, 'profile'> & { profile: Designer }

export type Drawer = { type: 'designer'; id: string } | { type: 'me'; edit?: boolean } | null
export type Toast = { id: number; text: string; tone?: 'default' | 'success' }

type State = {
  locale: Locale
  designers: Designer[]
  designersLoaded: boolean
  /** Set when the first API load fails, so the loading screen can say so instead of spinning forever. */
  loadError: string | null
  /** Which sign-in methods the server has live (real Google OAuth, real email delivery). */
  authConfig: { googleOAuth: boolean; emailDelivery: boolean }
  /** Set after returning from Google without a profile yet: onboarding continues from the basics step. */
  onboardingPrefill: { provider: 'google'; email: string; name?: string; photo?: string } | null
  account: Account | null
  filters: Filters
  drawer: Drawer
  exploreOpen: boolean
  onboardingOpen: boolean
  filterSheetOpen: boolean
  reportId: string | null
  reportedIds: string[]
  toasts: Toast[]
  pulseId: string | null
  mapReady: boolean

  setLocale: (l: Locale) => void
  setFilters: (f: Partial<Filters>) => void
  toggleFilter: <K extends 'roles' | 'skills' | 'countries' | 'cities'>(k: K, v: Filters[K][number]) => void
  clearFilters: () => void
  openDesigner: (id: string) => void
  openMe: (edit?: boolean) => void
  closeDrawer: () => void
  setExplore: (v: boolean) => void
  setOnboarding: (v: boolean) => void
  setFilterSheet: (v: boolean) => void
  setReport: (id: string | null) => void
  markReported: (id: string) => void
  /** Accepts the API's account shape; people without a profile yet are treated as signed out of the map. */
  setAccount: (a: ApiAccount | null) => void
  loadDesigners: () => Promise<void>
  init: () => Promise<void>
  toast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
  setPulse: (id: string | null) => void
  setMapReady: () => void
}

const LS = {
  get<T>(k: string, fallback: T): T {
    try {
      const v = localStorage.getItem(k)
      return v ? (JSON.parse(v) as T) : fallback
    } catch {
      return fallback
    }
  },
  set(k: string, v: unknown) {
    try {
      if (v === null) localStorage.removeItem(k)
      else localStorage.setItem(k, JSON.stringify(v))
    } catch {
      /* storage unavailable — demo still works in memory */
    }
  },
}

// Persian first; the choice is remembered once someone switches.
const initialLocale: Locale = LS.get<Locale | null>('pux.locale', null) ?? 'fa'

let toastSeq = 0

export const useStore = create<State>((set, get) => ({
  locale: initialLocale,
  designers: [],
  designersLoaded: false,
  loadError: null,
  authConfig: { googleOAuth: false, emailDelivery: false },
  onboardingPrefill: null,
  account: null,
  filters: EMPTY_FILTERS,
  drawer: null,
  exploreOpen: false,
  onboardingOpen: false,
  filterSheetOpen: false,
  reportId: null,
  reportedIds: LS.get<string[]>('pux.reported', []),
  toasts: [],
  pulseId: null,
  mapReady: false,

  setLocale: (locale) => {
    LS.set('pux.locale', locale)
    set({ locale })
  },
  setFilters: (f) => set({ filters: { ...get().filters, ...f } }),
  toggleFilter: (k, v) => {
    const cur = get().filters[k] as string[]
    const next = cur.includes(v as string) ? cur.filter((x) => x !== v) : [...cur, v as string]
    set({ filters: { ...get().filters, [k]: next } })
  },
  clearFilters: () => set({ filters: EMPTY_FILTERS }),
  openDesigner: (id) => set({ drawer: { type: 'designer', id }, exploreOpen: false }),
  openMe: (edit) => set({ drawer: { type: 'me', edit }, exploreOpen: false }),
  closeDrawer: () => set({ drawer: null }),
  setExplore: (exploreOpen) => set(exploreOpen ? { exploreOpen, drawer: null } : { exploreOpen }),
  setOnboarding: (onboardingOpen) => set({ onboardingOpen }),
  setFilterSheet: (filterSheetOpen) => set({ filterSheetOpen }),
  setReport: (reportId) => set({ reportId }),
  markReported: (id) => {
    const reportedIds = [...new Set([...get().reportedIds, id])]
    LS.set('pux.reported', reportedIds)
    set({ reportedIds })
  },
  setAccount: (a) => set({ account: a && a.profile ? { ...a, profile: a.profile } : null }),
  loadDesigners: async () => {
    const designers = await (await api()).designers.list()
    set({ designers, designersLoaded: true })
  },
  init: async () => {
    set({ loadError: null })
    const google = consumeGoogleRedirect()
    try {
      const client = await api()
      const [designers, me, authConfig] = await Promise.all([
        client.designers.list(),
        session.get() ? client.auth.me().catch(() => null) : Promise.resolve(null),
        client.auth.config().catch(() => get().authConfig),
      ])
      set({ designers, designersLoaded: true, authConfig })
      get().setAccount(me)
      if (google === 'error') get().toast(get().locale === 'fa' ? 'ورود با گوگل انجام نشد' : 'Google sign-in didn’t complete')
      else if (google && me) {
        // Back from Google: existing members land on their profile; new people continue onboarding.
        if (me.profile) get().openMe()
        else set({ onboardingPrefill: { provider: 'google', email: google.email, name: google.name, photo: google.picture }, onboardingOpen: true })
      }
    } catch (e) {
      console.error('[api] initial load failed', e)
      set({ loadError: e instanceof Error ? e.message : String(e) })
    }
  },
  toast: (text, tone = 'default') => {
    const id = ++toastSeq
    set({ toasts: [...get().toasts, { id, text, tone }] })
    setTimeout(() => get().dismissToast(id), 3600)
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  setPulse: (pulseId) => set({ pulseId }),
  setMapReady: () => set({ mapReady: true }),
}))

/** Google sends people back with `#auth=google&token=…` (fragment: never reaches servers or logs). */
function consumeGoogleRedirect(): { email: string; name?: string; picture?: string } | 'error' | null {
  if (typeof window === 'undefined' || !window.location.hash) return null
  const p = new URLSearchParams(window.location.hash.slice(1))
  const clear = () => history.replaceState(null, '', window.location.pathname + window.location.search)
  if (p.get('auth_error')) {
    clear()
    return 'error'
  }
  const token = p.get('token')
  if (p.get('auth') !== 'google' || !token) return null
  session.set(token)
  clear()
  return { email: p.get('email') ?? '', name: p.get('name') || undefined, picture: p.get('picture') || undefined }
}

/**
 * Everyone on the public map. The server list already contains me when I'm visible;
 * my local copy wins so edits show instantly, and it's flagged `isMe`.
 */
export function selectPublicDesigners(s: Pick<State, 'designers' | 'account'>): Designer[] {
  const a = s.account
  if (!a) return s.designers
  const others = s.designers.filter((d) => d.id !== a.profile.id)
  return a.emailVerified && !a.hidden ? [...others, { ...a.profile, isMe: true }] : others
}
