import { useMemo } from 'react'
import { useStore, selectPublicDesigners, type Filters } from './store'
import type { Designer } from '../data/designers'
import { cityById, countryByCode, COUNTRIES, norm, CITIES, type City } from '../data/geo'
import { ROLES, SKILLS, type RoleId, type SkillId } from '../data/taxonomy'

export function usePublicDesigners() {
  const designers = useStore((s) => s.designers)
  const account = useStore((s) => s.account)
  return useMemo(() => selectPublicDesigners({ designers, account }), [designers, account])
}

export function useDesigner(id: string | null | undefined): Designer | undefined {
  const all = usePublicDesigners()
  const account = useStore((s) => s.account)
  return useMemo(() => {
    if (!id) return undefined
    if (account && account.profile.id === id) return { ...account.profile, isMe: true }
    return all.find((d) => d.id === id)
  }, [all, id, account])
}

/** Text used for free-text matching: names in both scripts, title, city, country, role and skills. */
function haystack(d: Designer) {
  const c = cityById[d.cityId]
  const country = c ? countryByCode[c.country] : undefined
  const role = ROLES.find((r) => r.id === d.role)
  return norm(
    [
      d.name.en, d.name.fa, d.title.en, d.title.fa,
      c?.en, c?.fa, country?.en, country?.fa,
      role?.en, role?.fa,
      ...d.skills.flatMap((s) => [SKILLS.find((x) => x.id === s)?.en, SKILLS.find((x) => x.id === s)?.fa]),
    ].join(' '),
  )
}

const hayCache = new WeakMap<Designer, string>()
const hay = (d: Designer) => {
  let h = hayCache.get(d)
  if (!h) hayCache.set(d, (h = haystack(d)))
  return h
}

export function matches(d: Designer, f: Filters) {
  const c = cityById[d.cityId]
  if (!c) return false
  if (f.roles.length && !f.roles.includes(d.role)) return false
  if (f.skills.length && !f.skills.every((s) => d.skills.includes(s))) return false // AND: must know all
  if (f.countries.length && !f.countries.includes(c.country)) return false
  if (f.cities.length && !f.cities.includes(d.cityId)) return false
  if (f.q) {
    const h = hay(d)
    if (!norm(f.q).split(/\s+/).every((tok) => h.includes(tok))) return false
  }
  return true
}

export function useFilteredDesigners() {
  const all = usePublicDesigners()
  const filters = useStore((s) => s.filters)
  return useMemo(() => all.filter((d) => matches(d, filters)), [all, filters])
}

export const filterCount = (f: Filters) => f.roles.length + f.skills.length + f.countries.length + f.cities.length + (f.q ? 1 : 0)

export type CityGroup = { city: City; members: Designer[] }

export function groupByCity(list: Designer[]): CityGroup[] {
  const m = new Map<string, Designer[]>()
  for (const d of list) {
    const arr = m.get(d.cityId)
    if (arr) arr.push(d)
    else m.set(d.cityId, [d])
  }
  return [...m.entries()]
    .filter(([id]) => cityById[id])
    .map(([id, members]) => ({ city: cityById[id], members }))
    .sort((a, b) => b.members.length - a.members.length)
}

export function useStats(list: Designer[]) {
  return useMemo(() => {
    const cities = new Set(list.map((d) => d.cityId))
    const countries = new Set([...cities].map((c) => cityById[c]?.country))
    const skillCounts = new Map<SkillId, number>()
    list.forEach((d) => d.skills.forEach((s) => skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1)))
    const topSkills = [...skillCounts.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, n }))
    const countryCounts = new Map<string, number>()
    list.forEach((d) => {
      const cc = cityById[d.cityId]?.country
      if (cc) countryCounts.set(cc, (countryCounts.get(cc) ?? 0) + 1)
    })
    const topCountries = [...countryCounts.entries()].sort((a, b) => b[1] - a[1]).map(([code, n]) => ({ code, n }))
    return { designers: list.length, cities: cities.size, countries: countries.size, topSkills, topCountries }
  }, [list])
}

export type SearchResults = {
  designers: Designer[]
  cities: { city: City; n: number }[]
  countries: { code: string; n: number }[]
  skills: SkillId[]
  roles: RoleId[]
}

export function searchAll(all: Designer[], query: string): SearchResults {
  const q = norm(query)
  const empty: SearchResults = { designers: [], cities: [], countries: [], skills: [], roles: [] }
  if (!q) return empty
  const starts = (s: string) => norm(s).startsWith(q) || norm(s).split(/[\s/-]/).some((w) => w.startsWith(q))
  const designers = all
    .filter((d) => starts(d.name.en) || starts(d.name.fa))
    .concat(all.filter((d) => !(starts(d.name.en) || starts(d.name.fa)) && (starts(d.title.en) || starts(d.title.fa))))
    .slice(0, 5)
  const byCity = groupByCity(all)
  const cityCount = new Map(byCity.map((g) => [g.city.id, g.members.length]))
  const cities = CITIES.filter((c) => starts(c.en) || starts(c.fa))
    .map((city) => ({ city, n: cityCount.get(city.id) ?? 0 }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)
  const countryCount = new Map<string, number>()
  all.forEach((d) => {
    const cc = cityById[d.cityId]?.country
    if (cc) countryCount.set(cc, (countryCount.get(cc) ?? 0) + 1)
  })
  const countries = COUNTRIES.filter((c) => starts(c.en) || starts(c.fa))
    .map((c) => ({ code: c.code, n: countryCount.get(c.code) ?? 0 }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 3)
  const skills = SKILLS.filter((s) => starts(s.en) || starts(s.fa)).map((s) => s.id).slice(0, 4)
  const roles = ROLES.filter((r) => starts(r.en) || starts(r.fa)).map((r) => r.id).slice(0, 3)
  return { designers, cities, countries, skills, roles }
}
