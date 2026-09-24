import { create } from 'zustand'
import type { Locale, RoleId, SkillId } from '../data/taxonomy'
import { DEMO_DESIGNERS, type Designer } from '../data/designers'

export type Filters = { q: string; roles: RoleId[]; skills: SkillId[]; countries: string[]; cities: string[] }
export const EMPTY_FILTERS: Filters = { q: '', roles: [], skills: [], countries: [], cities: [] }

export type Account = {
  email: string
  provider: 'google' | 'email'
  emailVerified: boolean
  hidden: boolean
  profile: Designer
}

export type Drawer = { type: 'designer'; id: string } | { type: 'me'; edit?: boolean } | null
export type Toast = { id: number; text: string; tone?: 'default' | 'success' }

type State = {
  locale: Locale
  designers: Designer[]
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
  setAccount: (a: Account | null) => void
  updateAccount: (fn: (a: Account) => Account) => void
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

const initialLocale = LS.get<Locale | null>('pux.locale', null) ?? (navigator.language?.startsWith('fa') ? 'fa' : 'en')

let toastSeq = 0

export const useStore = create<State>((set, get) => ({
  locale: initialLocale,
  designers: DEMO_DESIGNERS,
  account: LS.get<Account | null>('pux.account', null),
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
  setAccount: (account) => {
    LS.set('pux.account', account)
    set({ account })
  },
  updateAccount: (fn) => {
    const a = get().account
    if (!a) return
    const account = fn(a)
    LS.set('pux.account', account)
    set({ account })
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

/** Everyone who should appear on the public map: demo designers + me, once verified and visible. */
export function selectPublicDesigners(s: Pick<State, 'designers' | 'account'>): Designer[] {
  const a = s.account
  if (a && a.emailVerified && !a.hidden) return [...s.designers, { ...a.profile, isMe: true }]
  return s.designers
}
