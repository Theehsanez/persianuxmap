import { Compass, Languages, MapPinPlus, SlidersHorizontal, UserRound, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { filterCount, useFilteredDesigners, usePublicDesigners, useStats } from '../lib/data'
import { roleById, skillById } from '../data/taxonomy'
import { cityById, countryByCode } from '../data/geo'
import { Avatar } from './Avatar'
import { SearchBox } from './SearchBox'
import { FilterBar } from './Filters'
import { Button, Logo, LogoMark } from './ui'

function useAddOrProfile() {
  const account = useStore((s) => s.account)
  const setOnboarding = useStore((s) => s.setOnboarding)
  const openMe = useStore((s) => s.openMe)
  return (mode: 'join' | 'signin' = 'join') => (account ? openMe() : setOnboarding(true, mode))
}

function LangButton({ compact }: { compact?: boolean }) {
  const { t, locale } = useT()
  const setLocale = useStore((s) => s.setLocale)
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'en' ? 'fa' : 'en')}
      className={`inline-flex items-center gap-1.5 rounded-xl text-[13px] text-muted transition-colors hover:bg-white/[0.07] hover:text-text ${compact ? 'h-11 flex-col justify-center gap-0.5 px-2 text-[11px]' : 'h-9 px-2.5'}`}
      aria-label={t.language}
      title={t.language}
    >
      <Languages size={compact ? 19 : 16} />
      <span className={locale === 'en' ? 'font-[Vazirmatn]' : 'latin'}>{compact ? t.languageShort : t.language}</span>
    </button>
  )
}

function MeButton({ size = 32 }: { size?: number }) {
  const { t } = useT()
  const account = useStore((s) => s.account)
  const go = useAddOrProfile()
  return (
    <button type="button" onClick={() => go('signin')} aria-label={account ? t.myProfile : t.signIn} title={account ? t.myProfile : t.signIn} className="relative rounded-full ring-1 ring-line-strong transition hover:ring-accent/60">
      {account ? (
        <>
          <Avatar d={account.profile} size={size} />
          {account.hidden && <span className="absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2 border-surface bg-subtle" />}
        </>
      ) : (
        <span className="grid place-items-center rounded-full bg-white/[0.05] text-muted" style={{ width: size, height: size }}>
          <UserRound size={size * 0.5} />
        </span>
      )}
    </button>
  )
}

export function DesktopTopBar() {
  const { t } = useT()
  const account = useStore((s) => s.account)
  const exploreOpen = useStore((s) => s.exploreOpen)
  const setExplore = useStore((s) => s.setExplore)
  const setOnboarding = useStore((s) => s.setOnboarding)
  return (
    <>
      <header className="surface absolute inset-x-4 top-4 z-40 flex h-[60px] items-center gap-4 rounded-[18px] px-3 ps-4">
        <div className="flex flex-1 items-center">
          <button type="button" onClick={() => window.location.reload()} className="rounded-lg" aria-label={t.brand}>
            <Logo sub />
          </button>
        </div>
        <div className="w-full max-w-[480px]">
          <SearchBox />
        </div>
        <nav className="flex flex-1 items-center justify-end gap-1.5">
          <Button variant={exploreOpen ? 'secondary' : 'ghost'} size="sm" className="!h-9" icon={<Compass size={16} />} onClick={() => setExplore(!exploreOpen)} aria-pressed={exploreOpen}>
            {t.explore}
          </Button>
          {!account && (
            <>
              <Button variant="ghost" size="sm" className="!h-9" onClick={() => setOnboarding(true, 'signin')}>
                {t.signIn}
              </Button>
              <Button variant="primary" size="sm" className="!h-9" icon={<MapPinPlus size={16} />} onClick={() => setOnboarding(true)}>
                {t.addYourself}
              </Button>
            </>
          )}
          <LangButton />
          <span className="mx-1 h-6 w-px bg-line" />
          <MeButton />
        </nav>
      </header>
      <div className="absolute top-[88px] z-30 transition-[inset-inline-start] duration-500" style={{ insetInlineStart: exploreOpen ? 412 : 16, insetInlineEnd: 16 }}>
        <FilterBar />
      </div>
    </>
  )
}

export function MobileTopBar() {
  const { t, locale, n } = useT()
  const filters = useStore((s) => s.filters)
  const setSheet = useStore((s) => s.setFilterSheet)
  const toggle = useStore((s) => s.toggleFilter)
  const setFilters = useStore((s) => s.setFilters)
  const clear = useStore((s) => s.clearFilters)
  const count = filterCount(filters)
  const results = useFilteredDesigners()
  const stats = useStats(usePublicDesigners())

  const chips: { key: string; label: string; remove: () => void }[] = [
    ...(filters.q ? [{ key: 'q', label: `“${filters.q}”`, remove: () => setFilters({ q: '' }) }] : []),
    ...filters.roles.map((r) => ({ key: 'r' + r, label: roleById[r][locale], remove: () => toggle('roles', r) })),
    ...filters.skills.map((s) => ({ key: 's' + s, label: skillById[s][locale], remove: () => toggle('skills', s) })),
    ...filters.countries.map((c) => ({ key: 'c' + c, label: `${countryByCode[c]?.flag} ${countryByCode[c]?.[locale]}`, remove: () => toggle('countries', c) })),
    ...filters.cities.map((c) => ({ key: 'y' + c, label: cityById[c][locale], remove: () => toggle('cities', c) })),
  ]

  return (
    <div className="absolute inset-x-0 top-0 z-40 px-3 pt-[max(env(safe-area-inset-top),10px)]">
      <div className="surface flex items-center gap-2 rounded-[18px] p-1.5 ps-2">
        <LogoMark size={30} />
        <div className="min-w-0 flex-1">
          <SearchBox compact />
        </div>
        <button
          type="button"
          onClick={() => setSheet(true)}
          aria-label={t.filters}
          className={`relative grid size-11 shrink-0 place-items-center rounded-2xl border transition-colors ${count ? 'border-accent/45 bg-accent-soft text-accent-strong' : 'border-line bg-white/[0.04] text-muted'}`}
        >
          <SlidersHorizontal size={18} />
          {count > 0 && (
            <span className="absolute -end-1 -top-1 grid size-5 place-items-center rounded-full bg-accent text-[11px] font-semibold text-accent-ink">{n(count)}</span>
          )}
        </button>
      </div>
      <div className="no-scrollbar mt-2 flex items-center gap-1.5 overflow-x-auto">
        {count ? (
          <>
            <span className="shrink-0 rounded-full bg-bg/80 px-2.5 py-1.5 text-[12px] text-muted backdrop-blur">{t.showing(n(results.length))}</span>
            {chips.map((c) => (
              <button
                key={c.key}
                onClick={c.remove}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-accent/40 bg-[#1a1c20]/90 ps-3 pe-2 text-[12.5px] text-accent-strong backdrop-blur"
              >
                {c.label}
                <X size={13} />
              </button>
            ))}
            <button onClick={clear} className="shrink-0 px-2 text-[12.5px] text-subtle">
              {t.clearAll}
            </button>
          </>
        ) : (
          <span className="rounded-full bg-bg/70 px-3 py-1.5 text-[12px] text-muted backdrop-blur">
            <span className="font-medium text-text">{n(stats.designers)}</span> {t.statsDesigners} · <span className="font-medium text-text">{n(stats.countries)}</span>{' '}
            {t.statsCountries} · <span className="font-medium text-text">{n(stats.cities)}</span> {t.statsCities}
          </span>
        )}
      </div>
    </div>
  )
}

export function MobileDock() {
  const { t } = useT()
  const account = useStore((s) => s.account)
  const exploreOpen = useStore((s) => s.exploreOpen)
  const setExplore = useStore((s) => s.setExplore)
  const go = useAddOrProfile()
  return (
    <div className="absolute inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),12px)]">
      <nav className="surface flex items-center gap-1 rounded-[20px] p-1.5">
        <button
          type="button"
          onClick={() => setExplore(!exploreOpen)}
          className={`flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-[11px] ${exploreOpen ? 'text-accent' : 'text-muted'}`}
        >
          <Compass size={19} />
          {t.explore}
        </button>
        <Button variant="primary" className="!h-11 flex-1 !rounded-[14px]" icon={account ? undefined : <MapPinPlus size={18} />} onClick={() => go()}>
          {account ? t.myProfile : t.addYourself}
        </Button>
        <LangButton compact />
        <span className="px-1.5">
          <MeButton size={34} />
        </span>
      </nav>
    </div>
  )
}
