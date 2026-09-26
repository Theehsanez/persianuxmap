import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { useStore, type Filters } from '../lib/store'
import { filterCount, useFilteredDesigners, usePublicDesigners, groupByCity } from '../lib/data'
import { useT } from '../lib/i18n'
import { ROLES, SKILLS, TOOLS, roleById, skillById, toolById } from '../data/taxonomy'
import { countryByCode, cityById, norm } from '../data/geo'
import { mapApi } from '../map/mapApi'
import { Button, Chip, Sheet, useDismiss } from './ui'
import { ToolIcon } from './ToolIcon'

type Key = 'roles' | 'skills' | 'tools' | 'countries' | 'cities'

function useOptionCounts() {
  const all = usePublicDesigners()
  return useMemo(() => {
    const roles = new Map<string, number>()
    const skills = new Map<string, number>()
    const tools = new Map<string, number>()
    const countries = new Map<string, number>()
    const cities = new Map<string, number>()
    for (const d of all) {
      roles.set(d.role, (roles.get(d.role) ?? 0) + 1)
      d.skills.forEach((s) => skills.set(s, (skills.get(s) ?? 0) + 1))
      d.tools.forEach((s) => tools.set(s, (tools.get(s) ?? 0) + 1))
      const c = cityById[d.cityId]
      if (!c) continue
      countries.set(c.country, (countries.get(c.country) ?? 0) + 1)
      cities.set(c.id, (cities.get(c.id) ?? 0) + 1)
    }
    return { roles, skills, tools, countries, cities }
  }, [all])
}

/** After changing place filters, bring the matching cities into view. */
function useFitAfterPlaceChange() {
  const all = usePublicDesigners()
  return (next: Filters) => {
    const ids = next.cities.length
      ? next.cities
      : groupByCity(all.filter((d) => next.countries.includes(cityById[d.cityId]?.country))).map((g) => g.city.id)
    if (ids.length) mapApi.fitCities(ids, next.cities.length === 1 ? 8 : 6)
  }
}

function OptionList({ k, query }: { k: Key; query?: string }) {
  const { t, locale, n } = useT()
  const filters = useStore((s) => s.filters)
  const toggle = useStore((s) => s.toggleFilter)
  const counts = useOptionCounts()
  const fit = useFitAfterPlaceChange()

  const opts: { id: string; label: ReactNode; text: string; count: number }[] = useMemo(() => {
    if (k === 'roles') return ROLES.map((r) => ({ id: r.id, label: r[locale], text: r.en + r.fa, count: counts.roles.get(r.id) ?? 0 }))
    if (k === 'skills') return SKILLS.map((s) => ({ id: s.id, label: s[locale], text: s.en + s.fa, count: counts.skills.get(s.id) ?? 0 })).sort((a, b) => b.count - a.count)
    if (k === 'tools')
      return TOOLS.map((s) => ({
        id: s.id,
        label: (
          <span className="flex items-center gap-1.5">
            <ToolIcon id={s.id} size={14} />
            {s[locale]}
          </span>
        ),
        text: s.en + s.fa,
        count: counts.tools.get(s.id) ?? 0,
      })).sort((a, b) => b.count - a.count)
    if (k === 'countries')
      return [...counts.countries.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([code, count]) => ({
          id: code,
          label: (
            <span>
              <span className="me-2">{countryByCode[code]?.flag}</span>
              {countryByCode[code]?.[locale] ?? code}
            </span>
          ),
          text: (countryByCode[code]?.en ?? '') + (countryByCode[code]?.fa ?? ''),
          count,
        }))
    return [...counts.cities.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({
        id,
        label: (
          <span>
            {cityById[id][locale]}
            <span className="ms-1.5 text-subtle">{countryByCode[cityById[id].country]?.[locale]}</span>
          </span>
        ),
        text: cityById[id].en + cityById[id].fa,
        count,
      }))
  }, [k, locale, counts])

  const q = norm(query ?? '')
  const shown = q ? opts.filter((o) => norm(o.text).includes(q)) : opts
  const selected = filters[k] as string[]

  return (
    <div className="flex flex-col">
      {k === 'skills' && <p className="px-2.5 pt-1 pb-2 text-[11.5px] text-subtle">{t.skillsAllHint}</p>}
      {k === 'tools' && <p className="px-2.5 pt-1 pb-2 text-[11.5px] text-subtle">{t.toolsAllHint}</p>}
      {shown.map((o) => {
        const on = selected.includes(o.id)
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              toggle(k, o.id as never)
              if (k === 'countries' || k === 'cities') {
                const cur = useStore.getState().filters
                fit(cur)
              }
            }}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-start text-[13.5px] transition-colors hover:bg-white/[0.06]"
          >
            <span className={`grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors ${on ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong'}`}>
              {on && <Check size={11} strokeWidth={3} />}
            </span>
            <span className={`min-w-0 flex-1 truncate ${on ? 'text-text' : 'text-text/85'}`}>{o.label}</span>
            <span className="text-[11.5px] tabular-nums text-subtle">{n(o.count)}</span>
          </button>
        )
      })}
    </div>
  )
}

function FilterDropdown({ k, label }: { k: Key; label: string }) {
  const { t, locale } = useT()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const selected = useStore((s) => s.filters[k]) as string[]
  const setFilters = useStore((s) => s.setFilters)
  useDismiss(open, () => setOpen(false), ref)
  const searchable = k === 'countries' || k === 'cities' || k === 'skills' || k === 'tools'

  const summary =
    selected.length === 0
      ? label
      : selected.length === 1
        ? k === 'roles'
          ? roleById[selected[0] as keyof typeof roleById][locale]
          : k === 'skills'
            ? skillById[selected[0] as keyof typeof skillById][locale]
            : k === 'tools'
              ? toolById[selected[0] as keyof typeof toolById][locale]
              : k === 'countries'
                ? countryByCode[selected[0]]?.[locale]
                : cityById[selected[0]]?.[locale]
        : `${label} · ${selected.length.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en')}`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`surface inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors ${
          selected.length ? '!border-accent/45 text-accent-strong' : 'text-muted hover:text-text'
        }`}
      >
        <span className="max-w-[10rem] truncate">{summary}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="surface-solid animate-fade-in absolute start-0 top-[calc(100%+8px)] z-40 flex max-h-[min(60vh,420px)] w-72 flex-col overflow-hidden rounded-2xl">
          {searchable && (
            <div className="flex items-center gap-2 border-b border-line px-3">
              <Search size={14} className="text-subtle" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={label + '…'}
                className="h-10 min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-subtle"
              />
            </div>
          )}
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-1.5">
            <OptionList k={k} query={q} />
          </div>
          {selected.length > 0 && (
            <div className="flex justify-end border-t border-line p-1.5">
              <Button variant="ghost" size="sm" onClick={() => setFilters({ [k]: [] } as Partial<Filters>)}>
                {t.clear}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function FilterBar() {
  const { t, n } = useT()
  const filters = useStore((s) => s.filters)
  const clear = useStore((s) => s.clearFilters)
  const setFilters = useStore((s) => s.setFilters)
  const count = filterCount(filters)
  const results = useFilteredDesigners()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterDropdown k="roles" label={t.role} />
      <FilterDropdown k="skills" label={t.skills} />
      <FilterDropdown k="tools" label={t.tools} />
      <FilterDropdown k="countries" label={t.country} />
      <FilterDropdown k="cities" label={t.city} />
      {filters.q && (
        <span className="surface inline-flex h-9 items-center gap-1.5 rounded-full !border-accent/45 ps-3.5 pe-1.5 text-[13px] text-accent-strong">
          “{filters.q}”
          <button aria-label={t.clear} onClick={() => setFilters({ q: '' })} className="grid size-6 place-items-center rounded-full hover:bg-white/10">
            <X size={13} />
          </button>
        </span>
      )}
      {count > 0 && (
        <span className="surface animate-fade-in flex h-9 items-center gap-3 rounded-full px-3.5">
          <span className="text-[12.5px] text-text tabular-nums">{t.showing(n(results.length))}</span>
          <span className="h-4 w-px bg-line-strong" />
          <button onClick={clear} className="text-[12.5px] text-muted underline-offset-4 hover:text-text hover:underline">
            {t.clearAll}
          </button>
        </span>
      )}
    </div>
  )
}

/** Mobile: all filters in one bottom sheet. */
export function FilterSheet() {
  const { t, locale, n } = useT()
  const open = useStore((s) => s.filterSheetOpen)
  const setOpen = useStore((s) => s.setFilterSheet)
  const filters = useStore((s) => s.filters)
  const toggle = useStore((s) => s.toggleFilter)
  const clear = useStore((s) => s.clearFilters)
  const counts = useOptionCounts()
  const results = useFilteredDesigners()
  const fit = useFitAfterPlaceChange()
  if (!open) return null

  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="px-5 py-4">
      <h3 className="mb-3 text-[13px] font-medium text-muted">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  )
  const topCountries = [...counts.countries.entries()].sort((a, b) => b[1] - a[1])
  const topCities = [...counts.cities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16)

  return (
    <Sheet
      label={t.filters}
      onClose={() => setOpen(false)}
      initial="full"
      header={
        <div className="flex items-center justify-between border-b border-line px-5 pb-3">
          <h2 className="text-[17px] font-semibold">{t.filters}</h2>
          <button onClick={clear} className="text-[13px] text-muted hover:text-text">
            {t.clearAll}
          </button>
        </div>
      }
    >
      <Section title={t.role}>
        {ROLES.map((r) => (
          <Chip key={r.id} active={filters.roles.includes(r.id)} onClick={() => toggle('roles', r.id)}>
            {r[locale]}
          </Chip>
        ))}
      </Section>
      <Section title={t.skills}>
        {SKILLS.map((s) => (
          <Chip key={s.id} active={filters.skills.includes(s.id)} onClick={() => toggle('skills', s.id)}>
            {s[locale]}
          </Chip>
        ))}
      </Section>
      <Section title={t.tools}>
        {TOOLS.map((s) => (
          <Chip key={s.id} active={filters.tools.includes(s.id)} onClick={() => toggle('tools', s.id)}>
            <ToolIcon id={s.id} size={14} />
            {s[locale]}
          </Chip>
        ))}
      </Section>
      <Section title={t.country}>
        {topCountries.map(([code, c]) => (
          <Chip key={code} active={filters.countries.includes(code)} onClick={() => toggle('countries', code)} count={c}>
            {countryByCode[code]?.flag} {countryByCode[code]?.[locale]}
          </Chip>
        ))}
      </Section>
      <Section title={t.city}>
        {topCities.map(([id, c]) => (
          <Chip key={id} active={filters.cities.includes(id)} onClick={() => toggle('cities', id)} count={c}>
            {cityById[id][locale]}
          </Chip>
        ))}
      </Section>
      <div className="sticky bottom-0 border-t border-line bg-surface/95 px-5 pt-3 pb-1 backdrop-blur">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => {
            setOpen(false)
            fit(useStore.getState().filters)
          }}
        >
          <SlidersHorizontal size={17} />
          {t.apply} · {n(results.length)}
        </Button>
      </div>
    </Sheet>
  )
}
