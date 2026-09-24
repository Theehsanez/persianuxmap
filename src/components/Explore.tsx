import { ArrowUpRight, Sparkles, TrendingUp, UsersRound } from 'lucide-react'
import { useStore } from '../lib/store'
import { useT, fmtAgo } from '../lib/i18n'
import { groupByCity, usePublicDesigners, useStats } from '../lib/data'
import { countryByCode, cityById } from '../data/geo'
import { skillById } from '../data/taxonomy'
import { mapApi } from '../map/mapApi'
import { Avatar } from './Avatar'
import { CloseButton, Sheet, useEscape, useIsMobile } from './ui'
import { focusDesignerOnMap } from './SearchBox'
import { CountUp, MapAttribution } from './Overlays'

function ExploreContent() {
  const { t, locale, n } = useT()
  const all = usePublicDesigners()
  const stats = useStats(all)
  const toggle = useStore((s) => s.toggleFilter)
  const filters = useStore((s) => s.filters)
  const setExplore = useStore((s) => s.setExplore)
  const mobile = useIsMobile()
  const cities = groupByCity(all).slice(0, 6)
  const max = cities[0]?.members.length ?? 1
  const recent = [...all].sort((a, b) => b.joined.localeCompare(a.joined)).slice(0, 6)
  const leave = () => mobile && setExplore(false)

  return (
    <div className="stagger flex flex-col gap-7 px-6 pt-2 pb-8 md:pt-6">
      <div className="pe-10">
        <p className="text-[12px] font-medium tracking-wide text-accent uppercase">{t.explore}</p>
        <h2 className="mt-1 text-[22px] leading-tight font-semibold tracking-[-0.015em]">{t.exploreTitle}</h2>
        <p className="mt-1.5 text-[13.5px] text-muted">{t.heroLine}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          [stats.designers, t.statsDesigners],
          [stats.countries, t.statsCountries],
          [stats.cities, t.statsCities],
        ].map(([v, l]) => (
          <div key={l as string} className="rounded-2xl border border-line bg-white/[0.02] px-3 py-3">
            <div className="text-[22px] font-semibold tabular-nums tracking-tight">
              <CountUp value={v as number} />
            </div>
            <div className="text-[12px] text-muted">{l}</div>
          </div>
        ))}
      </div>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-[13px] font-medium text-muted">
          <TrendingUp size={15} /> {t.trendingCities}
        </h3>
        <div className="flex flex-col gap-1">
          {cities.map((g, i) => (
            <button
              key={g.city.id}
              type="button"
              onClick={() => {
                leave()
                mapApi.flyToCity(g.city.id, g.members.length)
              }}
              className="group flex items-center gap-3 rounded-xl px-2 py-2 text-start transition-colors hover:bg-white/[0.05]"
            >
              <span className="w-4 text-[12px] tabular-nums text-subtle">{n(i + 1)}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="text-[14px] font-medium">{g.city[locale]}</span>
                  <span className="truncate text-[12px] text-subtle">{countryByCode[g.city.country]?.[locale]}</span>
                </span>
                <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/[0.05]">
                  <span className="block h-full rounded-full bg-accent/70" style={{ width: `${(g.members.length / max) * 100}%` }} />
                </span>
              </span>
              <span className="flex -space-x-1.5">
                {g.members.slice(0, 3).map((d) => (
                  <span key={d.id} className="rounded-full ring-2 ring-surface">
                    <Avatar d={d} size={22} />
                  </span>
                ))}
              </span>
              <span className="w-8 text-end text-[13px] font-medium tabular-nums">{n(g.members.length)}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-[13px] font-medium text-muted">
          <Sparkles size={15} /> {t.popularSkills}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {stats.topSkills.slice(0, 10).map(({ id, n: c }) => {
            const on = filters.skills.includes(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  toggle('skills', id)
                  leave()
                }}
                className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] transition-colors ${
                  on ? 'border-accent/45 bg-accent-soft text-accent-strong' : 'border-line bg-white/[0.02] text-text/85 hover:border-line-strong'
                }`}
              >
                {skillById[id][locale]}
                <span className="text-[11px] tabular-nums text-subtle">{n(c)}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-[13px] font-medium text-muted">
          <UsersRound size={15} /> {t.recentlyJoined}
        </h3>
        <div className="flex flex-col gap-0.5">
          {recent.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => focusDesignerOnMap(d.id)}
              className="group flex items-center gap-3 rounded-xl px-2 py-2 text-start transition-colors hover:bg-white/[0.05]"
            >
              <Avatar d={d} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">{d.name[locale]}</span>
                <span className="block truncate text-[12.5px] text-muted">
                  {d.title[locale]} · {cityById[d.cityId]?.[locale]}
                </span>
              </span>
              <span className="text-[11.5px] whitespace-nowrap text-subtle">{fmtAgo(d.joined, locale)}</span>
              <ArrowUpRight size={14} className="text-subtle opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100" />
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[13px] font-medium text-muted">{t.topCountries}</h3>
        <div className="flex flex-wrap gap-1.5">
          {stats.topCountries.slice(0, 10).map(({ code, n: c }) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                leave()
                if (!filters.countries.includes(code)) toggle('countries', code)
                mapApi.fitCities(groupByCity(all.filter((d) => cityById[d.cityId]?.country === code)).map((g) => g.city.id), 6)
              }}
              className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-white/[0.02] px-3 text-[13px] text-text/85 hover:border-line-strong"
            >
              <span>{countryByCode[code]?.flag}</span>
              {countryByCode[code]?.[locale]}
              <span className="text-[11px] tabular-nums text-subtle">{n(c)}</span>
            </button>
          ))}
        </div>
      </section>
      <MapAttribution />
    </div>
  )
}

export function ExplorePanel() {
  const open = useStore((s) => s.exploreOpen)
  const setExplore = useStore((s) => s.setExplore)
  const mobile = useIsMobile()
  const { t } = useT()
  useEscape(() => setExplore(false), open && !mobile)
  if (!open) return null
  if (mobile)
    return (
      <Sheet label={t.explore} onClose={() => setExplore(false)} initial="full">
        <ExploreContent />
      </Sheet>
    )
  return (
    <aside className="drawer-start-enter surface-solid absolute start-4 top-[76px] bottom-4 z-30 flex w-[380px] flex-col overflow-hidden rounded-[22px]" aria-label={t.explore}>
      <div className="absolute end-3 top-3 z-10">
        <CloseButton onClick={() => setExplore(false)} />
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <ExploreContent />
      </div>
    </aside>
  )
}
