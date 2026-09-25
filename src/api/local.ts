import { implement, ORPCError, createRouterClient } from '@orpc/server'
import { contract, type Account } from './contract'
import { designerFromInput, randomCode } from './shared'
import { DEMO_DESIGNERS, type Designer } from '../data/designers'

/**
 * In-browser implementation of the same contract, for the static GitHub Pages build (no server there).
 * Demo designers are generated locally; the visitor's own account lives in localStorage.
 */

type Store = {
  accounts: Record<string, { provider: 'google' | 'email'; hidden: boolean; profile: Designer | null }>
  sessions: Record<string, string>
  codes: Record<string, string>
  reports: { profileId: string; reason: string; note?: string; at: string }[]
}
const KEY = 'pux.localdb'
const load = (): Store => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '')
    if (s && s.accounts) return s
  } catch {
    /* empty or unavailable */
  }
  return { accounts: {}, sessions: {}, codes: {}, reports: [] }
}
const save = (s: Store) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* storage full or unavailable — keep going in memory */
  }
}

type Ctx = { token: string | null }
const os = implement(contract).$context<Ctx>()

const account = (s: Store, email: string): Account => {
  const a = s.accounts[email]
  return { email, provider: a.provider, emailVerified: true, hidden: a.hidden, profile: a.profile }
}
const open = (email: string, provider: 'google' | 'email') => {
  const s = load()
  s.accounts[email] ??= { provider, hidden: false, profile: null }
  const token = crypto.randomUUID()
  s.sessions[token] = email
  save(s)
  return { token, account: account(s, email) }
}
const authed = os.middleware(({ context, next }) => {
  const s = load()
  const email = context.token ? s.sessions[context.token] : undefined
  if (!email || !s.accounts[email]) throw new ORPCError('UNAUTHORIZED')
  return next({ context: { email } })
})
const mutate = (email: string, fn: (a: Store['accounts'][string]) => void) => {
  const s = load()
  fn(s.accounts[email])
  save(s)
  return account(s, email)
}

export const localRouter = os.router({
  designers: {
    list: os.designers.list.handler(() => {
      const s = load()
      const mine = Object.values(s.accounts)
        .filter((a) => a.profile && !a.hidden)
        .map((a) => a.profile!)
      return [...DEMO_DESIGNERS, ...mine]
    }),
  },
  auth: {
    config: os.auth.config.handler(() => ({ googleOAuth: false, emailDelivery: false })),
    requestCode: os.auth.requestCode.handler(({ input }) => {
      const s = load()
      const code = randomCode()
      s.codes[input.email.toLowerCase()] = code
      save(s)
      return { sent: true as const, devCode: code }
    }),
    verifyCode: os.auth.verifyCode.handler(({ input }) => {
      const email = input.email.toLowerCase()
      if (load().codes[email] !== input.code) throw new ORPCError('BAD_REQUEST', { message: 'Wrong code' })
      return open(email, 'email')
    }),
    google: os.auth.google.handler(() => open('you@gmail.com', 'google')),
    me: os.auth.me.handler(({ context }) => {
      const s = load()
      const email = context.token ? s.sessions[context.token] : undefined
      return email && s.accounts[email] ? account(s, email) : null
    }),
    signOut: os.auth.signOut.handler(({ context }) => {
      const s = load()
      if (context.token) delete s.sessions[context.token]
      save(s)
      return { ok: true as const }
    }),
  },
  profile: {
    save: os.profile.save.use(authed).handler(({ input, context }) =>
      mutate(context.email, (a) => {
        a.profile = designerFromInput(input, {
          id: a.profile?.id ?? `me-${crypto.randomUUID().slice(0, 8)}`,
          joined: a.profile?.joined ?? new Date().toISOString(),
          verification: a.profile?.verification ?? 'email',
        })
      }),
    ),
    setHidden: os.profile.setHidden.use(authed).handler(({ input, context }) => mutate(context.email, (a) => void (a.hidden = input.hidden))),
    requestReview: os.profile.requestReview.use(authed).handler(({ context }) =>
      mutate(context.email, (a) => void (a.profile && a.profile.verification === 'email' && (a.profile.verification = 'pending'))),
    ),
    approveDemo: os.profile.approveDemo.use(authed).handler(({ context }) =>
      mutate(context.email, (a) => void (a.profile && a.profile.verification === 'pending' && (a.profile.verification = 'verified'))),
    ),
    remove: os.profile.remove.use(authed).handler(({ context }) => {
      const s = load()
      delete s.accounts[context.email]
      for (const [t, e] of Object.entries(s.sessions)) if (e === context.email) delete s.sessions[t]
      save(s)
      return { ok: true as const }
    }),
  },
  reports: {
    create: os.reports.create.handler(({ input }) => {
      const s = load()
      s.reports.push({ ...input, at: new Date().toISOString() })
      save(s)
      return { ok: true as const }
    }),
  },
})

export const createLocalClient = (getToken: () => string | null) => createRouterClient(localRouter, { context: () => ({ token: getToken() }) })
