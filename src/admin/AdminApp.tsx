import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Flag,
  Globe,
  Languages,
  LayoutDashboard,
  Loader2,
  LogOut,
  Map as MapIcon,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { api, session } from '../api/client'
import { instagramUrl, telegramUrl } from '../api/shared'
import type { Account, AdminDesignerT, AdminOverviewT, AdminReportT } from '../api/contract'
import { cityById, countryByCode } from '../data/geo'
import { roleById, skillById, type RoleId, type SkillId } from '../data/taxonomy'
import { useStore } from '../lib/store'
import { fmtNum } from '../lib/i18n'
import { Avatar } from '../components/Avatar'
import { Button, InstagramIcon, LinkedinIcon, LogoMark, TelegramIcon, VerificationBadge, inputCls } from '../components/ui'
import { Toasts } from '../components/Overlays'

// ————————————————————————————————— copy (EN / FA)

const T = {
  en: {
    admin: 'Admin',
    backToMap: 'Back to map',
    signOut: 'Sign out',
    tabs: { overview: 'Overview', verification: 'Verification', reports: 'Reports', designers: 'Designers' },
    signInTitle: 'Admin sign in',
    signInBody: 'Use an email listed in ADMIN_EMAILS.',
    email: 'Email',
    sendCode: 'Send code',
    code: '6-digit code',
    verify: 'Sign in',
    demoCode: (c: string) => `Code (no email service yet): ${c}`,
    wrongCode: 'Wrong or expired code',
    notAdmin: 'This account isn’t an admin',
    notAdminBody: (e: string) => `${e} is not in ADMIN_EMAILS. Add it in your hosting environment variables and redeploy.`,
    noServer: 'The admin panel needs the server version (it isn’t available on the static GitHub Pages demo).',
    useOther: 'Use another account',
    refresh: 'Refresh',
    // overview
    designers: 'Designers',
    visible: 'visible on map',
    newLast7: 'New this week',
    newLast30: (n: string) => `${n} in the last 30 days`,
    pendingReview: 'Waiting for review',
    openReports: 'Open reports',
    ofTotal: (n: string) => `of ${n} total`,
    realUsers: 'Real accounts',
    demoUsers: (n: string) => `${n} demo profiles`,
    incomplete: (n: string) => `${n} signed up without a profile`,
    signupsWeekly: 'Sign-ups per week',
    last12: 'Last 12 weeks',
    weekOf: (d: string) => `Week of ${d}`,
    joined: (n: string) => `${n} joined`,
    verificationBreakdown: 'Verification',
    vLabels: { verified: 'Verified designer', pending: 'Pending review', email: 'Email verified', unverified: 'Unverified' },
    topCities: 'Top cities',
    topCountries: 'Top countries',
    topSkills: 'Top skills',
    roles: 'Roles',
    reach: (c: string, k: string) => `${c} countries · ${k} cities`,
    sessions: (n: string) => `${n} active sessions`,
    signInMethods: 'Sign-in methods',
    // lists
    approve: 'Approve',
    reject: 'Reject',
    emptyQueue: 'Nothing to review. New requests appear here.',
    viewOnMap: 'View on map',
    hide: 'Hide',
    show: 'Show',
    delete: 'Delete',
    confirmDelete: 'Delete permanently?',
    verifyBtn: 'Verify',
    unverify: 'Remove badge',
    dismiss: 'Dismiss',
    hideAndResolve: 'Hide profile',
    deleteAndResolve: 'Delete profile',
    reopen: 'Reopen',
    reportStatus: { open: 'Open', dismissed: 'Dismissed', actioned: 'Actioned', all: 'All' },
    reasons: { fake: 'Fake or spam', notDesigner: 'Not a designer', impersonation: 'Impersonation', inappropriate: 'Inappropriate', other: 'Other' } as Record<string, string>,
    reportedBy: (e: string) => `Reported by ${e}`,
    anonymous: 'Reported anonymously',
    resolvedBy: (e: string, d: string) => `Resolved by ${e} · ${d}`,
    profileGone: 'Profile no longer exists',
    emptyReports: 'No reports here.',
    searchPh: 'Search name, email, city…',
    filters: { all: 'All', pending: 'Pending', verified: 'Verified', email: 'Email only', hidden: 'Hidden', reported: 'Reported', real: 'Real accounts' },
    cols: { designer: 'Designer', email: 'Email', city: 'City', status: 'Status', visibility: 'Map', reports: 'Reports', joined: 'Joined', actions: '' },
    hiddenBadge: 'Hidden',
    visibleBadge: 'Visible',
    demoBadge: 'Demo',
    results: (n: string) => `${n} designers`,
    noResults: 'No designers match.',
    page: (a: string, b: string) => `${a}–${b}`,
    saved: 'Saved',
    failed: 'That didn’t work — try again',
  },
  fa: {
    admin: 'مدیریت',
    backToMap: 'بازگشت به نقشه',
    signOut: 'خروج',
    tabs: { overview: 'نمای کلی', verification: 'تأیید', reports: 'گزارش‌ها', designers: 'طراحان' },
    signInTitle: 'ورود مدیر',
    signInBody: 'با ایمیلی وارد شوید که در ADMIN_EMAILS ثبت شده است.',
    email: 'ایمیل',
    sendCode: 'ارسال کد',
    code: 'کد ۶ رقمی',
    verify: 'ورود',
    demoCode: (c: string) => `کد (سرویس ایمیل هنوز وصل نیست): ${c}`,
    wrongCode: 'کد اشتباه است یا منقضی شده',
    notAdmin: 'این حساب مدیر نیست',
    notAdminBody: (e: string) => `${e} در ADMIN_EMAILS نیست. آن را در متغیرهای محیطی هاست اضافه و دوباره deploy کنید.`,
    noServer: 'پنل مدیریت به نسخه سرور نیاز دارد (روی دموی GitHub Pages در دسترس نیست).',
    useOther: 'ورود با حساب دیگر',
    refresh: 'به‌روزرسانی',
    designers: 'طراحان',
    visible: 'روی نقشه',
    newLast7: 'عضو جدید این هفته',
    newLast30: (n: string) => `${n} در ۳۰ روز اخیر`,
    pendingReview: 'در انتظار بررسی',
    openReports: 'گزارش‌های باز',
    ofTotal: (n: string) => `از ${n} گزارش`,
    realUsers: 'حساب‌های واقعی',
    demoUsers: (n: string) => `${n} پروفایل دمو`,
    incomplete: (n: string) => `${n} ثبت‌نام بدون پروفایل`,
    signupsWeekly: 'عضویت در هر هفته',
    last12: '۱۲ هفته اخیر',
    weekOf: (d: string) => `هفته ${d}`,
    joined: (n: string) => `${n} عضو جدید`,
    verificationBreakdown: 'وضعیت تأیید',
    vLabels: { verified: 'طراح تأییدشده', pending: 'در انتظار بررسی', email: 'ایمیل تأییدشده', unverified: 'تأییدنشده' },
    topCities: 'شهرهای برتر',
    topCountries: 'کشورهای برتر',
    topSkills: 'مهارت‌های پرتکرار',
    roles: 'نقش‌ها',
    reach: (c: string, k: string) => `${c} کشور · ${k} شهر`,
    sessions: (n: string) => `${n} نشست فعال`,
    signInMethods: 'روش ورود',
    approve: 'تأیید',
    reject: 'رد',
    emptyQueue: 'چیزی برای بررسی نیست. درخواست‌های جدید این‌جا می‌آیند.',
    viewOnMap: 'روی نقشه',
    hide: 'پنهان',
    show: 'نمایش',
    delete: 'حذف',
    confirmDelete: 'برای همیشه حذف شود؟',
    verifyBtn: 'تأیید',
    unverify: 'حذف نشان',
    dismiss: 'رد گزارش',
    hideAndResolve: 'پنهان کردن پروفایل',
    deleteAndResolve: 'حذف پروفایل',
    reopen: 'باز کردن دوباره',
    reportStatus: { open: 'باز', dismissed: 'ردشده', actioned: 'اقدام‌شده', all: 'همه' },
    reasons: { fake: 'جعلی یا اسپم', notDesigner: 'طراح نیست', impersonation: 'جعل هویت', inappropriate: 'نامناسب', other: 'سایر' } as Record<string, string>,
    reportedBy: (e: string) => `گزارش از ${e}`,
    anonymous: 'گزارش ناشناس',
    resolvedBy: (e: string, d: string) => `بررسی توسط ${e} · ${d}`,
    profileGone: 'این پروفایل دیگر وجود ندارد',
    emptyReports: 'گزارشی نیست.',
    searchPh: 'جستجوی نام، ایمیل، شهر…',
    filters: { all: 'همه', pending: 'در انتظار', verified: 'تأییدشده', email: 'فقط ایمیل', hidden: 'پنهان', reported: 'گزارش‌شده', real: 'حساب‌های واقعی' },
    cols: { designer: 'طراح', email: 'ایمیل', city: 'شهر', status: 'وضعیت', visibility: 'نقشه', reports: 'گزارش', joined: 'عضویت', actions: '' },
    hiddenBadge: 'پنهان',
    visibleBadge: 'نمایان',
    demoBadge: 'دمو',
    results: (n: string) => `${n} طراح`,
    noResults: 'طراحی پیدا نشد.',
    page: (a: string, b: string) => `${a}–${b}`,
    saved: 'ذخیره شد',
    failed: 'انجام نشد — دوباره تلاش کنید',
  },
}
type Dict = (typeof T)['en']

function useAdminT() {
  const locale = useStore((s) => s.locale)
  const t = T[locale] as Dict
  const n = (x: number) => fmtNum(x, locale)
  const date = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
    new Date(iso).toLocaleDateString(locale === 'fa' ? 'fa-IR-u-ca-persian' : 'en-GB', opts)
  return { t, n, date, locale }
}

type Tab = 'overview' | 'verification' | 'reports' | 'designers'

// ————————————————————————————————— shell

export default function AdminApp() {
  const { t, locale } = useAdminT()
  const setLocale = useStore((s) => s.setLocale)
  const toast = useStore((s) => s.toast)
  const [me, setMe] = useState<Account | null | 'loading'>('loading')
  const [tab, setTab] = useState<Tab>(() => (new URLSearchParams(window.location.search).get('tab') as Tab) || 'overview')
  const [overview, setOverview] = useState<AdminOverviewT | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr'
  }, [locale])

  const loadMe = useCallback(async () => {
    setMe('loading')
    try {
      setMe(session.get() ? await (await api()).auth.me() : null)
    } catch {
      setMe(null)
    }
  }, [])
  useEffect(() => void loadMe(), [loadMe])

  const loadOverview = useCallback(async () => {
    try {
      setOverview(await (await api()).admin.overview())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])
  const isAdmin = me !== 'loading' && !!me?.isAdmin
  useEffect(() => {
    if (isAdmin) void loadOverview()
  }, [isAdmin, loadOverview])

  const switchTab = (next: Tab) => {
    setTab(next)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', next)
    history.replaceState(null, '', url)
  }

  /** Run an admin mutation, toast the outcome and refresh the counters. */
  const act = useCallback(
    async (fn: () => Promise<unknown>) => {
      try {
        await fn()
        toast(t.saved, 'success')
        void loadOverview()
        return true
      } catch (e) {
        console.error(e)
        toast(t.failed)
        return false
      }
    },
    [toast, t, loadOverview],
  )

  const signOut = async () => {
    try {
      await (await api()).auth.signOut()
    } catch {
      /* ignore */
    }
    session.set(null)
    setMe(null)
  }

  const langBtn = (
    <button
      onClick={() => setLocale(locale === 'en' ? 'fa' : 'en')}
      className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[13px] text-muted hover:bg-white/[0.07] hover:text-text"
    >
      <Languages size={16} />
      {locale === 'en' ? 'فارسی' : 'English'}
    </button>
  )

  if (me === 'loading')
    return (
      <Center>
        <Loader2 className="animate-spin text-muted" />
      </Center>
    )
  if (!me) return <SignIn onDone={loadMe} langBtn={langBtn} />
  if (!me.isAdmin)
    return (
      <Center>
        <Card className="max-w-md text-center">
          <ShieldCheck className="mx-auto text-subtle" size={28} />
          <h1 className="mt-4 text-[18px] font-semibold">{t.notAdmin}</h1>
          <p className="latin mt-2 text-[13.5px] leading-relaxed text-muted" dir="auto">
            {t.notAdminBody(me.email)}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={signOut}>{t.useOther}</Button>
            <a href={import.meta.env.BASE_URL} className="inline-flex h-10 items-center rounded-xl px-4 text-sm text-muted hover:text-text">
              {t.backToMap}
            </a>
          </div>
        </Card>
      </Center>
    )

  const tabs: { id: Tab; icon: ReactNode; badge?: number }[] = [
    { id: 'overview', icon: <LayoutDashboard size={17} /> },
    { id: 'verification', icon: <BadgeCheck size={17} />, badge: overview?.verification.pending },
    { id: 'reports', icon: <Flag size={17} />, badge: overview?.reports.open },
    { id: 'designers', icon: <Users size={17} /> },
  ]

  return (
    <div className="min-h-dvh bg-bg text-text">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 md:px-6">
          <a href={import.meta.env.BASE_URL} className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="latin hidden text-[14.5px] font-semibold sm:inline" dir="ltr">
              Persian UX Map
            </span>
          </a>
          <span className="rounded-md border border-line px-2 py-0.5 text-[12px] text-muted">{t.admin}</span>
          <div className="flex-1" />
          <span className="latin hidden text-[12.5px] text-subtle md:inline" dir="ltr">
            {me.email}
          </span>
          {langBtn}
          <a href={import.meta.env.BASE_URL} className="hidden h-9 items-center gap-1.5 rounded-xl px-2.5 text-[13px] text-muted hover:bg-white/[0.07] hover:text-text sm:inline-flex">
            <MapIcon size={16} />
            {t.backToMap}
          </a>
          <button onClick={signOut} aria-label={t.signOut} title={t.signOut} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-white/[0.07] hover:text-text">
            <LogOut size={16} className="rtl:-scale-x-100" />
          </button>
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-[1280px] gap-1 overflow-x-auto px-3 md:px-5">
          {tabs.map((x) => (
            <button
              key={x.id}
              onClick={() => switchTab(x.id)}
              className={`relative flex h-11 shrink-0 items-center gap-2 px-3 text-[13.5px] transition-colors ${tab === x.id ? 'text-text' : 'text-muted hover:text-text'}`}
            >
              {x.icon}
              {t.tabs[x.id]}
              {!!x.badge && <span className="rounded-full bg-white px-1.5 text-[11px] font-semibold text-bg tabular-nums">{fmtNum(x.badge, locale)}</span>}
              {tab === x.id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-white" />}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-8">
        {error && (
          <Card className="mb-6 border-danger/30 text-[13.5px] text-danger">
            {error.includes('server') ? t.noServer : error}
          </Card>
        )}
        {tab === 'overview' && <Overview data={overview} onRefresh={loadOverview} goTo={switchTab} />}
        {tab === 'verification' && <VerificationQueue act={act} />}
        {tab === 'reports' && <Reports act={act} />}
        {tab === 'designers' && <Designers act={act} />}
      </main>
      <Toasts />
    </div>
  )
}

type Act = (fn: () => Promise<unknown>) => Promise<boolean>

// ————————————————————————————————— sign-in gate

function SignIn({ onDone, langBtn }: { onDone: () => void; langBtn: ReactNode }) {
  const { t } = useAdminT()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [devCode, setDevCode] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      const r = await (await api()).auth.requestCode({ email })
      setDevCode(r.devCode)
      setSent(true)
    } catch (e2) {
      setErr(e2 instanceof Error && e2.message.includes('server') ? t.noServer : t.failed)
    } finally {
      setBusy(false)
    }
  }
  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      const r = await (await api()).auth.verifyCode({ email, code })
      session.set(r.token)
      onDone()
    } catch {
      setErr(t.wrongCode)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Center>
      <div className="absolute end-4 top-4">{langBtn}</div>
      <Card className="w-full max-w-sm">
        <LogoMark size={36} />
        <h1 className="mt-5 text-[20px] font-semibold">{t.signInTitle}</h1>
        <p className="mt-1 text-[13.5px] text-muted">{t.signInBody}</p>
        {!sent ? (
          <form onSubmit={send} className="mt-5 flex flex-col gap-3">
            <input type="email" required dir="ltr" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.email} className={`${inputCls} latin`} />
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : t.sendCode}
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-5 flex flex-col gap-3">
            <input
              inputMode="numeric"
              dir="ltr"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder={t.code}
              className={`${inputCls} latin text-center tracking-[0.4em]`}
            />
            {devCode && <p className="latin text-center text-[12px] text-subtle">{t.demoCode(devCode)}</p>}
            <Button type="submit" variant="primary" disabled={busy || code.length !== 6}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : t.verify}
            </Button>
          </form>
        )}
        {err && <p className="mt-3 text-[13px] text-danger">{err}</p>}
      </Card>
    </Center>
  )
}

// ————————————————————————————————— overview

function Overview({ data, onRefresh, goTo }: { data: AdminOverviewT | null; onRefresh: () => void; goTo: (t: Tab) => void }) {
  const { t, n, locale } = useAdminT()
  if (!data)
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    )
  const realUsers = data.users.google + data.users.email
  const cityLabel = (id: string) => cityById[id]?.[locale] ?? id
  const countryLabel = (code: string) => `${countryByCode[code]?.flag ?? ''} ${countryByCode[code]?.[locale] ?? code}`
  const skillLabel = (id: string) => skillById[id as SkillId]?.[locale] ?? id
  const roleLabel = (id: string) => roleById[id as RoleId]?.[locale] ?? id

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight">{t.tabs.overview}</h1>
        <Button size="sm" variant="ghost" icon={<RefreshCw size={14} />} onClick={onRefresh}>
          {t.refresh}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t.designers} value={n(data.designers.total)} sub={`${n(data.designers.visible)} ${t.visible}`} />
        <Stat label={t.newLast7} value={n(data.signups.last7)} sub={t.newLast30(n(data.signups.last30))} />
        <Stat label={t.pendingReview} value={n(data.verification.pending)} sub={t.tabs.verification} onClick={() => goTo('verification')} highlight={data.verification.pending > 0} />
        <Stat label={t.openReports} value={n(data.reports.open)} sub={t.ofTotal(n(data.reports.total))} onClick={() => goTo('reports')} highlight={data.reports.open > 0} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle title={t.signupsWeekly} sub={t.last12} />
          <WeeklyBars weeks={data.signups.weekly} />
        </Card>
        <Card>
          <SectionTitle title={t.verificationBreakdown} />
          <VerificationBar v={data.verification} />
          <div className="mt-6 border-t border-line pt-4">
            <SectionTitle title={t.realUsers} />
            <p className="text-[28px] font-semibold tabular-nums">{n(realUsers)}</p>
            <ul className="mt-2 flex flex-col gap-1 text-[13px] text-muted">
              <li className="flex items-center gap-2">
                <Globe size={13} /> {t.signInMethods}: Google {n(data.users.google)} · Email {n(data.users.email)}
              </li>
              <li>{t.demoUsers(n(data.users.demo))}</li>
              <li>{t.incomplete(n(data.users.withoutProfile))}</li>
              <li>{t.sessions(n(data.activeSessions))}</li>
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <SectionTitle title={t.topCities} sub={t.reach(n(data.geography.countries), n(data.geography.cities))} />
          <BarList items={data.geography.topCities.map((x) => ({ label: cityLabel(x.key), n: x.n }))} />
        </Card>
        <Card>
          <SectionTitle title={t.topCountries} />
          <BarList items={data.geography.topCountries.map((x) => ({ label: countryLabel(x.key), n: x.n }))} />
        </Card>
        <Card>
          <SectionTitle title={t.topSkills} />
          <BarList items={data.topSkills.map((x) => ({ label: skillLabel(x.key), n: x.n }))} />
        </Card>
        <Card>
          <SectionTitle title={t.roles} />
          <BarList items={data.roles.map((x) => ({ label: roleLabel(x.key), n: x.n }))} />
        </Card>
      </div>
    </div>
  )
}

function Stat({ label, value, sub, onClick, highlight }: { label: string; value: string; sub?: string; onClick?: () => void; highlight?: boolean }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={`rounded-2xl border bg-surface p-4 text-start transition-colors ${highlight ? 'border-white/25' : 'border-line'} ${onClick ? 'hover:border-white/35' : ''}`}
    >
      <div className="flex items-center justify-between text-[12.5px] text-muted">
        {label}
        {onClick && <ArrowUpRight size={14} className="text-subtle rtl:-scale-x-100" />}
      </div>
      <div className="mt-2 text-[30px] leading-none font-semibold tracking-tight tabular-nums">{value}</div>
      {sub && <div className="mt-2 text-[12px] text-subtle">{sub}</div>}
    </Comp>
  )
}

/** Single series over time → one neutral colour, rounded data-ends on the baseline, hover tooltip per bar. */
function WeeklyBars({ weeks }: { weeks: { weekStart: string; n: number }[] }) {
  const { t, n, date } = useAdminT()
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...weeks.map((w) => w.n))
  const nice = Math.max(4, Math.ceil(max / 4) * 4)
  return (
    <div className="mt-4">
      <div className="relative ml-7 flex h-48 items-end gap-[2px]" dir="ltr" onMouseLeave={() => setHover(null)}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <div key={f} className="pointer-events-none absolute inset-x-0 border-t border-white/[0.05]" style={{ bottom: `${f * 100}%` }}>
            <span className="absolute -top-2 end-full me-2 text-[10.5px] text-subtle tabular-nums">{n(Math.round(nice * f))}</span>
          </div>
        ))}
        {weeks.map((w, i) => (
          <div key={w.weekStart} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${t.weekOf(date(w.weekStart))}: ${t.joined(n(w.n))}`}>
            <div
              className={`w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-white' : 'bg-white/55'}`}
              style={{ height: `${(w.n / nice) * 100}%`, minHeight: w.n ? 3 : 0 }}
            />
            {hover === i && (
              <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-10 -translate-x-1/2 rounded-lg border border-line-strong bg-elevated px-2.5 py-1.5 text-[12px] whitespace-nowrap shadow-lg">
                <div className="text-subtle">{t.weekOf(date(w.weekStart, { day: 'numeric', month: 'short' }))}</div>
                <div className="font-medium text-text">{t.joined(n(w.n))}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 ml-7 flex justify-between border-t border-line pt-2 text-[11px] text-subtle" dir="ltr">
        {weeks
          .filter((_, i) => i % 3 === 0)
          .map((w) => (
            <span key={w.weekStart}>{date(w.weekStart, { day: 'numeric', month: 'short' })}</span>
          ))}
      </div>
    </div>
  )
}

/** Ordinal states (unverified → verified) as lightness steps of one neutral, always with a labelled legend. */
function VerificationBar({ v }: { v: AdminOverviewT['verification'] }) {
  const { t, n } = useAdminT()
  const parts = [
    { key: 'verified' as const, cls: 'bg-white' },
    { key: 'email' as const, cls: 'bg-white/45' },
    { key: 'pending' as const, cls: 'bg-warn' },
    { key: 'unverified' as const, cls: 'bg-white/15' },
  ].filter((p) => v[p.key] > 0)
  const total = parts.reduce((s, p) => s + v[p.key], 0) || 1
  return (
    <div className="mt-4">
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
        {parts.map((p) => (
          <div key={p.key} className={p.cls} style={{ width: `${(v[p.key] / total) * 100}%` }} title={`${t.vLabels[p.key]}: ${v[p.key]}`} />
        ))}
      </div>
      <ul className="mt-4 flex flex-col gap-2 text-[13px]">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2.5">
            <span className={`size-2.5 rounded-sm ${p.cls}`} />
            <span className="flex-1 text-muted">{t.vLabels[p.key]}</span>
            <span className="tabular-nums">{n(v[p.key])}</span>
            <span className="w-10 text-end text-[12px] text-subtle tabular-nums">{Math.round((v[p.key] / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BarList({ items }: { items: { label: string; n: number }[] }) {
  const { n } = useAdminT()
  const max = Math.max(1, ...items.map((i) => i.n))
  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex items-baseline justify-between gap-2 text-[13px]">
            <span className="truncate">{i.label}</span>
            <span className="text-muted tabular-nums">{n(i.n)}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-white/[0.05]">
            <div className="h-full rounded-full bg-white/60" style={{ width: `${(i.n / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

// ————————————————————————————————— verification queue

function VerificationQueue({ act }: { act: Act }) {
  const { t, n } = useAdminT()
  const [items, setItems] = useState<AdminDesignerT[] | null>(null)
  const load = useCallback(async () => setItems((await (await api()).admin.designers({ filter: 'pending', limit: 100, offset: 0 })).items), [])
  useEffect(() => void load().catch(() => setItems([])), [load])

  const decide = async (d: AdminDesignerT, verification: 'verified' | 'email') => {
    if (await act(async () => (await api()).admin.setVerification({ id: d.id, verification }))) setItems((xs) => xs?.filter((x) => x.id !== d.id) ?? null)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[22px] font-semibold tracking-tight">
        {t.tabs.verification} {items && <span className="text-muted">· {n(items.length)}</span>}
      </h1>
      {!items ? (
        <Skeletons />
      ) : items.length === 0 ? (
        <Empty>{t.emptyQueue}</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((d) => (
            <Card key={d.id} className="flex flex-col gap-4">
              <DesignerSummary d={d} />
              <Links d={d} />
              <div className="flex gap-2">
                <Button variant="primary" className="flex-1" icon={<Check size={15} />} onClick={() => decide(d, 'verified')}>
                  {t.approve}
                </Button>
                <Button className="flex-1" icon={<X size={15} />} onClick={() => decide(d, 'email')}>
                  {t.reject}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ————————————————————————————————— reports

function Reports({ act }: { act: Act }) {
  const { t, date } = useAdminT()
  const [status, setStatus] = useState<'open' | 'dismissed' | 'actioned' | 'all'>('open')
  const [items, setItems] = useState<AdminReportT[] | null>(null)
  const load = useCallback(async () => {
    setItems(null)
    setItems(await (await api()).admin.reports({ status }))
  }, [status])
  useEffect(() => void load().catch(() => setItems([])), [load])

  const resolve = async (r: AdminReportT, next: 'dismissed' | 'actioned' | 'open', also?: () => Promise<unknown>) => {
    if (
      await act(async () => {
        if (also) await also()
        await (await api()).admin.resolveReport({ id: r.id, status: next })
      })
    )
      void load()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold tracking-tight">{t.tabs.reports}</h1>
        <Segmented value={status} onChange={setStatus} options={(['open', 'actioned', 'dismissed', 'all'] as const).map((s) => ({ value: s, label: t.reportStatus[s] }))} />
      </div>
      {!items ? (
        <Skeletons />
      ) : items.length === 0 ? (
        <Empty>{t.emptyReports}</Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((r) => (
            <Card key={r.id} className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-1 text-[12px] font-medium text-danger">
                    <Flag size={12} /> {t.reasons[r.reason] ?? r.reason}
                  </span>
                  <span className="text-[12px] text-subtle">{date(r.createdAt)}</span>
                  {r.status !== 'open' && <span className="rounded-full border border-line px-2 py-0.5 text-[11.5px] text-muted">{t.reportStatus[r.status]}</span>}
                </div>
                {r.note && <p className="mt-3 rounded-xl bg-white/[0.03] px-3 py-2 text-[13.5px] leading-relaxed">“{r.note}”</p>}
                <p className="latin mt-2 text-[12px] text-subtle" dir="auto">
                  {r.reporterEmail ? t.reportedBy(r.reporterEmail) : t.anonymous}
                  {r.resolvedBy && r.resolvedAt && <span className="block">{t.resolvedBy(r.resolvedBy, date(r.resolvedAt))}</span>}
                </p>
              </div>
              <div className="flex flex-col gap-3 md:w-[380px]">
                {r.profile ? (
                  <>
                    <DesignerSummary d={r.profile} compact />
                    <Links d={r.profile} />
                  </>
                ) : (
                  <p className="text-[13px] text-subtle">{t.profileGone}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {r.status === 'open' ? (
                    <>
                      <Button size="sm" onClick={() => resolve(r, 'dismissed')}>
                        {t.dismiss}
                      </Button>
                      {r.profile && !r.profile.hidden && (
                        <Button size="sm" icon={<EyeOff size={14} />} onClick={() => resolve(r, 'actioned', async () => (await api()).admin.setHidden({ id: r.profile!.id, hidden: true }))}>
                          {t.hideAndResolve}
                        </Button>
                      )}
                      {r.profile && (
                        <ConfirmButton
                          label={t.deleteAndResolve}
                          confirm={t.confirmDelete}
                          onConfirm={async () => {
                            // Deleting the profile also removes its reports (cascade), so just reload.
                            if (await act(async () => (await api()).admin.deleteProfile({ id: r.profile!.id }))) void load()
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => resolve(r, 'open')}>
                      {t.reopen}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ————————————————————————————————— designers table

const PAGE = 50
type Filter = 'all' | 'pending' | 'verified' | 'email' | 'hidden' | 'reported' | 'real'

function Designers({ act }: { act: Act }) {
  const { t, n, date, locale } = useAdminT()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [offset, setOffset] = useState(0)
  const [data, setData] = useState<{ items: AdminDesignerT[]; total: number } | null>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 250)
    return () => clearTimeout(id)
  }, [q])
  useEffect(() => setOffset(0), [debounced, filter])
  const load = useCallback(async () => setData(await (await api()).admin.designers({ q: debounced || undefined, filter, limit: PAGE, offset })), [debounced, filter, offset])
  useEffect(() => void load().catch(() => setData({ items: [], total: 0 })), [load])

  const run = async (fn: () => Promise<unknown>) => {
    if (await act(fn)) void load()
  }

  const filters = useMemo(() => Object.keys(t.filters) as Filter[], [t])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold tracking-tight">
          {t.tabs.designers} {data && <span className="text-muted">· {t.results(n(data.total))}</span>}
        </h1>
        <div className={`${inputCls} !h-10 flex w-full items-center gap-2 sm:w-72`}>
          <Search size={15} className="text-subtle" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchPh} className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" />
        </div>
      </div>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-8 shrink-0 rounded-full border px-3 text-[13px] transition-colors ${filter === f ? 'border-white/40 bg-white/[0.08] text-text' : 'border-line text-muted hover:text-text'}`}
          >
            {t.filters[f]}
          </button>
        ))}
      </div>

      {!data ? (
        <Skeletons />
      ) : data.items.length === 0 ? (
        <Empty>{t.noResults}</Empty>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-[13px]">
            <thead className="hidden bg-surface text-[12px] text-subtle md:table-header-group">
              <tr className="[&>th]:px-4 [&>th]:py-2.5 [&>th]:text-start [&>th]:font-medium">
                <th>{t.cols.designer}</th>
                <th>{t.cols.email}</th>
                <th>{t.cols.city}</th>
                <th>{t.cols.status}</th>
                <th>{t.cols.visibility}</th>
                <th>{t.cols.reports}</th>
                <th>{t.cols.joined}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((d) => {
                const city = cityById[d.cityId]
                return (
                  <tr key={d.id} className="flex flex-col gap-2 border-t border-line p-4 first:border-t-0 md:table-row md:p-0 md:first:border-t [&>td]:md:px-4 [&>td]:md:py-3">
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar d={d} size={34} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate font-medium">
                            {d.name[locale] || d.name.en}
                            {d.provider === 'seed' && <span className="rounded border border-line px-1 text-[10.5px] font-normal text-subtle">{t.demoBadge}</span>}
                          </div>
                          <div className="truncate text-[12px] text-muted">{d.title[locale] || d.title.en}</div>
                        </div>
                      </div>
                    </td>
                    <td className="latin truncate text-muted md:max-w-[220px]" dir="ltr">
                      {d.email}
                    </td>
                    <td className="text-muted">{city ? `${city[locale]}${locale === 'fa' ? '، ' : ', '}${countryByCode[city.country]?.[locale] ?? ''}` : d.cityId}</td>
                    <td>
                      <VerificationBadge v={d.verification} compact />
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 text-[12px] ${d.hidden ? 'text-warn' : 'text-muted'}`}>
                        {d.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                        {d.hidden ? t.hiddenBadge : t.visibleBadge}
                      </span>
                    </td>
                    <td className="tabular-nums">{d.openReports ? <span className="font-medium text-danger">{n(d.openReports)}</span> : <span className="text-subtle">—</span>}</td>
                    <td className="text-[12px] whitespace-nowrap text-subtle">{date(d.joined)}</td>
                    <td>
                      <div className="flex flex-wrap items-center gap-1 md:justify-end">
                        <a
                          href={`${import.meta.env.BASE_URL}?d=${encodeURIComponent(d.id)}`}
                          target="_blank"
                          rel="noreferrer"
                          title={t.viewOnMap}
                          className="grid size-8 place-items-center rounded-lg text-muted hover:bg-white/[0.07] hover:text-text"
                        >
                          <MapIcon size={15} />
                        </a>
                        {d.verification === 'verified' ? (
                          <Button size="sm" variant="ghost" onClick={() => run(async () => (await api()).admin.setVerification({ id: d.id, verification: 'email' }))}>
                            {t.unverify}
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" icon={<BadgeCheck size={14} />} onClick={() => run(async () => (await api()).admin.setVerification({ id: d.id, verification: 'verified' }))}>
                            {t.verifyBtn}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => run(async () => (await api()).admin.setHidden({ id: d.id, hidden: !d.hidden }))}>
                          {d.hidden ? t.show : t.hide}
                        </Button>
                        <ConfirmButton label={t.delete} confirm={t.confirmDelete} onConfirm={() => run(async () => (await api()).admin.deleteProfile({ id: d.id }))} iconOnly />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > PAGE && (
        <div className="flex items-center justify-end gap-2 text-[13px] text-muted">
          <span className="tabular-nums">
            {t.page(n(offset + 1), n(Math.min(offset + PAGE, data.total)))} / {n(data.total)}
          </span>
          <Button size="sm" variant="ghost" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))} aria-label="Previous">
            <ChevronLeft size={16} className="rtl:-scale-x-100" />
          </Button>
          <Button size="sm" variant="ghost" disabled={offset + PAGE >= data.total} onClick={() => setOffset(offset + PAGE)} aria-label="Next">
            <ChevronRight size={16} className="rtl:-scale-x-100" />
          </Button>
        </div>
      )}
    </div>
  )
}

// ————————————————————————————————— bits

function DesignerSummary({ d, compact }: { d: AdminDesignerT; compact?: boolean }) {
  const { t, date, locale } = useAdminT()
  const city = cityById[d.cityId]
  return (
    <div className="flex items-start gap-3">
      <Avatar d={d} size={compact ? 36 : 44} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{d.name[locale] || d.name.en}</span>
          {d.hidden && (
            <span className="inline-flex items-center gap-1 text-[11.5px] text-warn">
              <EyeOff size={12} />
              {t.hiddenBadge}
            </span>
          )}
        </div>
        <div className="text-[13px] text-muted">
          {d.title[locale] || d.title.en}
          {city && ` · ${city[locale]}`}
        </div>
        <div className="latin mt-0.5 truncate text-[12px] text-subtle" dir="ltr">
          {d.email} · {d.provider} · {date(d.joined)}
        </div>
        {!compact && d.bio.en && <p className="mt-2 text-[13px] leading-relaxed text-text/85">{d.bio[locale] || d.bio.en}</p>}
        {!compact && (
          <div className="mt-2 flex flex-wrap gap-1">
            {d.skills.map((s) => (
              <span key={s} className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[11.5px] text-muted">
                {skillById[s]?.[locale] ?? s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Links({ d }: { d: AdminDesignerT }) {
  const { t } = useAdminT()
  const link = (href: string | undefined, icon: ReactNode, label: string) =>
    href && (
      <a href={href} target="_blank" rel="noreferrer noopener" className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg border border-line px-2.5 text-[12.5px] text-muted hover:border-line-strong hover:text-text">
        {icon}
        <span className="latin truncate" dir="ltr">
          {label}
        </span>
      </a>
    )
  const pretty = (u?: string) => u?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') ?? ''
  return (
    <div className="flex flex-wrap gap-1.5">
      {link(d.links.portfolio, <ArrowUpRight size={13} />, pretty(d.links.portfolio))}
      {link(d.links.linkedin, <LinkedinIcon size={13} />, 'LinkedIn')}
      {link(d.links.website, <Globe size={13} />, pretty(d.links.website))}
      {d.links.instagram && link(instagramUrl(d.links.instagram), <InstagramIcon size={13} />, '@' + d.links.instagram)}
      {d.links.telegram && link(telegramUrl(d.links.telegram), <TelegramIcon size={13} />, '@' + d.links.telegram)}
      {link(`${import.meta.env.BASE_URL}?d=${encodeURIComponent(d.id)}`, <MapIcon size={13} />, t.viewOnMap)}
    </div>
  )
}

function ConfirmButton({ label, confirm, onConfirm, iconOnly }: { label: string; confirm: string; onConfirm: () => void; iconOnly?: boolean }) {
  const [asking, setAsking] = useState(false)
  if (asking)
    return (
      <span className="inline-flex items-center gap-1">
        <Button size="sm" variant="danger" onClick={() => (setAsking(false), onConfirm())}>
          {confirm}
        </Button>
        <button onClick={() => setAsking(false)} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-white/[0.07]" aria-label="Cancel">
          <X size={14} />
        </button>
      </span>
    )
  return iconOnly ? (
    <button onClick={() => setAsking(true)} title={label} aria-label={label} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger">
      <Trash2 size={15} />
    </button>
  ) : (
    <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => setAsking(true)}>
      {label}
    </Button>
  )
}

function Segmented<V extends string>({ value, onChange, options }: { value: V; onChange: (v: V) => void; options: { value: V; label: string }[] }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`h-8 rounded-lg px-3 text-[13px] transition-colors ${value === o.value ? 'bg-white/[0.1] text-text' : 'text-muted hover:text-text'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>{children}</div>
)
const Center = ({ children }: { children: ReactNode }) => <div className="relative grid min-h-dvh place-items-center bg-bg px-4 text-text">{children}</div>
const SectionTitle = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="flex items-baseline justify-between gap-2">
    <h2 className="text-[14px] font-medium">{title}</h2>
    {sub && <span className="text-[12px] text-subtle">{sub}</span>}
  </div>
)
const Empty = ({ children }: { children: ReactNode }) => <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-[14px] text-muted">{children}</div>
const Skeletons = () => (
  <div className="flex flex-col gap-3">
    {[0, 1, 2].map((i) => (
      <div key={i} className="skeleton h-24 rounded-2xl" />
    ))}
  </div>
)
