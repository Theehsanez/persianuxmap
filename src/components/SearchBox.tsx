import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowUpRight, Building2, CornerDownLeft, Flag, Search, Sparkles, Tag, UserRound, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { searchAll, usePublicDesigners, groupByCity } from '../lib/data'
import { useT } from '../lib/i18n'
import { cityById, countryByCode } from '../data/geo'
import { roleById, skillById, type RoleId, type SkillId } from '../data/taxonomy'
import { mapApi } from '../map/mapApi'
import { scatter, splitZoom } from '../map/layout'
import { Avatar } from './Avatar'
import { useDismiss } from './ui'

type Item = { key: string; group: keyof ReturnType<typeof useT>['t']['searchHeadings']; icon: ReactNode; label: ReactNode; meta?: ReactNode; run: () => void }

export function focusDesignerOnMap(id: string) {
  const s = useStore.getState()
  const all = [...s.designers, ...(s.account ? [{ ...s.account.profile, isMe: true }] : [])]
  const d = all.find((x) => x.id === id)
  if (!d) return
  const c = cityById[d.cityId]
  const members = all.filter((x) => x.cityId === d.cityId)
  const pos = scatter(c, members).get(d.id) ?? [c.lng, c.lat]
  s.openDesigner(id)
  // Wait a tick so padding accounts for the drawer that just opened.
  requestAnimationFrame(() => mapApi.flyToPoint(pos, splitZoom(c.lat, members.length) + 0.4))
}

export function SearchBox({ compact = false }: { compact?: boolean }) {
  const { t, locale, n } = useT()
  const all = usePublicDesigners()
  const q = useStore((s) => s.filters.q)
  const setFilters = useStore((s) => s.setFilters)
  const toggleFilter = useStore((s) => s.toggleFilter)
  const filters = useStore((s) => s.filters)
  const [text, setText] = useState(q)
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const wrap = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  useDismiss(open, () => setOpen(false), wrap)
  useEffect(() => setText(q), [q])

  // ⌘K / "/" focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (((e.metaKey || e.ctrlKey) && e.key === 'k') || (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA')) {
        e.preventDefault()
        input.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const res = useMemo(() => searchAll(all, text), [all, text])
  const done = () => {
    setOpen(false)
    input.current?.blur()
  }

  const items: Item[] = useMemo(() => {
    const out: Item[] = []
    res.designers.forEach((d) =>
      out.push({
        key: 'd' + d.id,
        group: 'designers',
        icon: <Avatar d={d} size={28} />,
        label: d.name[locale],
        meta: `${d.title[locale]} · ${cityById[d.cityId]?.[locale]}`,
        run: () => {
          setText('')
          done()
          focusDesignerOnMap(d.id)
        },
      }),
    )
    res.cities.forEach(({ city, n: count }) =>
      out.push({
        key: 'c' + city.id,
        group: 'cities',
        icon: <Building2 size={16} />,
        label: city[locale],
        meta: `${countryByCode[city.country]?.[locale]} · ${t.designersCount(n(count))}`,
        run: () => {
          setText('')
          done()
          mapApi.flyToCity(city.id, count)
        },
      }),
    )
    res.countries.forEach(({ code, n: count }) =>
      out.push({
        key: 'k' + code,
        group: 'countries',
        icon: <Flag size={16} />,
        label: (
          <span>
            <span className="me-1.5">{countryByCode[code].flag}</span>
            {countryByCode[code][locale]}
          </span>
        ),
        meta: t.designersCount(n(count)),
        run: () => {
          setText('')
          done()
          if (!filters.countries.includes(code)) toggleFilter('countries', code)
          const ids = groupByCity(all.filter((d) => cityById[d.cityId]?.country === code)).map((g) => g.city.id)
          mapApi.fitCities(ids, 6)
        },
      }),
    )
    res.skills.forEach((s: SkillId) =>
      out.push({
        key: 's' + s,
        group: 'skills',
        icon: <Sparkles size={16} />,
        label: skillById[s][locale],
        meta: t.searchFilterFor + ' ' + t.skills.toLowerCase(),
        run: () => {
          setText('')
          done()
          if (!filters.skills.includes(s)) toggleFilter('skills', s)
        },
      }),
    )
    res.roles.forEach((r: RoleId) =>
      out.push({
        key: 'r' + r,
        group: 'roles',
        icon: <Tag size={16} />,
        label: roleById[r][locale],
        meta: t.searchFilterFor + ' ' + t.role.toLowerCase(),
        run: () => {
          setText('')
          done()
          if (!filters.roles.includes(r)) toggleFilter('roles', r)
        },
      }),
    )
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res, locale, filters, all])

  useEffect(() => setHi(0), [text])

  const applyQuery = () => {
    setFilters({ q: text.trim() })
    done()
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHi((h) => Math.min(items.length - 1, h + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHi((h) => Math.max(0, h - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (items[hi]) items[hi].run()
      else applyQuery()
    } else if (e.key === 'Escape') {
      done()
    }
  }

  const trimmed = text.trim()
  const showPanel = open && trimmed.length > 0
  let lastGroup = ''

  return (
    <div ref={wrap} className="relative w-full">
      <div
        className={`flex items-center gap-2 rounded-2xl border bg-white/[0.04] px-3 transition-[border,box-shadow,background] ${compact ? 'h-11' : 'h-10'} ${
          open ? 'border-accent/50 bg-white/[0.06] shadow-[0_0_0_4px_rgb(95_212_196/0.08)]' : 'border-line hover:border-line-strong'
        }`}
      >
        <Search size={16} className="shrink-0 text-subtle" />
        <input
          ref={input}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={compact ? t.searchShort : t.searchPlaceholder}
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-text outline-none placeholder:text-subtle"
          aria-label={t.searchPlaceholder}
          role="combobox"
          aria-expanded={showPanel}
          enterKeyHint="search"
        />
        {text ? (
          <button
            type="button"
            aria-label={t.clear}
            onClick={() => {
              setText('')
              setFilters({ q: '' })
              input.current?.focus()
            }}
            className="grid size-6 place-items-center rounded-md text-subtle hover:bg-white/10 hover:text-text"
          >
            <X size={14} />
          </button>
        ) : (
          !compact && <kbd className="latin hidden rounded-md border border-line px-1.5 py-0.5 text-[10.5px] text-subtle lg:block">⌘K</kbd>
        )}
      </div>

      {showPanel && (
        <div
          className={`surface-solid animate-fade-in z-40 overflow-hidden rounded-2xl ${compact ? 'fixed inset-x-3 top-[calc(max(env(safe-area-inset-top),10px)+68px)]' : 'absolute inset-x-0 top-[calc(100%+8px)]'}`}
          role="listbox"
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-8 text-center">
              <div className="mb-3 grid size-11 place-items-center rounded-2xl bg-white/[0.05] text-subtle">
                <UserRound size={20} />
              </div>
              <p className="text-sm font-medium">{t.noResultsTitle}</p>
              <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted">{t.noResultsBody(trimmed)}</p>
            </div>
          ) : (
            <div className="scroll-thin max-h-[min(60vh,440px)] overflow-y-auto p-1.5">
              {items.map((it, i) => {
                const head = it.group !== lastGroup
                lastGroup = it.group
                return (
                  <div key={it.key}>
                    {head && <div className="px-2.5 pt-2.5 pb-1 text-[11px] font-medium tracking-wide text-subtle uppercase">{t.searchHeadings[it.group]}</div>}
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === hi}
                      onMouseEnter={() => setHi(i)}
                      onClick={it.run}
                      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-start transition-colors ${i === hi ? 'bg-white/[0.07]' : ''}`}
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg text-muted">{it.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] text-text">{it.label}</span>
                        {it.meta && <span className="block truncate text-[12px] text-subtle">{it.meta}</span>}
                      </span>
                      {i === hi && <ArrowUpRight size={15} className="shrink-0 text-subtle rtl:-scale-x-100" />}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          <button
            type="button"
            onClick={applyQuery}
            className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-[12.5px] text-muted hover:bg-white/[0.04] hover:text-text"
          >
            <CornerDownLeft size={13} className="rtl:-scale-x-100" />
            <span>
              {t.searchFilterFor} “<span className="text-text">{trimmed}</span>”
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
