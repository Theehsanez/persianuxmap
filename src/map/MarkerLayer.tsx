import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Map as MLMap } from 'maplibre-gl'
import type { Designer } from '../data/designers'
import { groupByCity, type CityGroup } from '../lib/data'
import { cityRadiusKm, pxPerKm, scatter, splitProgress } from './layout'
import { mapApi } from './mapApi'
import { useStore } from '../lib/store'
import { Avatar } from '../components/Avatar'
import { useT } from '../lib/i18n'
import { BadgeCheck } from 'lucide-react'

type Cluster = { key: string; groups: CityGroup[]; count: number }

// Cluster pills are anchored on their avatar stack (the city point) and extend towards the reading direction.
const ANCHOR = 16
const PILL_W = 150
const MERGE_DY = 36

export function MarkerLayer({ map, designers }: { map: MLMap; designers: Designer[] }) {
  const { locale, n } = useT()
  const drawer = useStore((s) => s.drawer)
  const pulseId = useStore((s) => s.pulseId)
  const mapReady = useStore((s) => s.mapReady)
  const openDesigner = useStore((s) => s.openDesigner)
  const selectedId = drawer?.type === 'designer' ? drawer.id : null

  const groups = useMemo(() => groupByCity(designers), [designers])
  const scatters = useMemo(() => new Map(groups.map((g) => [g.city.id, scatter(g.city, g.members)])), [groups])

  const [clusters, setClusters] = useState<Cluster[]>([])
  const sig = useRef('')
  const avatarRefs = useRef(new Map<string, HTMLElement>())
  const clusterRefs = useRef(new Map<string, HTMLElement>())
  const areaRefs = useRef(new Map<string, HTMLElement>())

  const update = useCallback(() => {
    const z = map.getZoom()
    const rtl = document.documentElement.dir === 'rtl'
    const { clientWidth: W, clientHeight: H } = map.getContainer()
    const per = groups.map((g) => ({ g, p: map.project([g.city.lng, g.city.lat]), t: splitProgress(z, g.city.lat, g.members.length) }))

    // 1. Screen-space merge of nearby clusters (only those fully clustered).
    const out: { key: string; groups: CityGroup[]; x: number; y: number; t: number; count: number }[] = []
    for (const x of per) {
      if (x.t >= 1) continue
      const host =
        x.t < 0.02
          ? out.find((c) => {
              if (c.t >= 0.02 || Math.abs(c.y - x.p.y) > MERGE_DY) return false
              // Merge when the two pills would overlap (pills extend PILL_W towards the reading direction).
              return Math.abs(x.p.x - c.x) < PILL_W
            })
          : undefined
      if (host) {
        host.groups.push(x.g)
        host.count += x.g.members.length
      } else out.push({ key: x.g.city.id, groups: [x.g], x: x.p.x, y: x.p.y, t: x.t, count: x.g.members.length })
    }
    const nextSig = out.map((c) => c.groups.map((g) => g.city.id + ':' + g.members.length).join('+')).join('|')
    if (nextSig !== sig.current) {
      sig.current = nextSig
      setClusters(out.map((c) => ({ key: c.key, groups: c.groups, count: c.count })))
    }
    for (const c of out) {
      const el = clusterRefs.current.get(c.key)
      if (!el) continue
      const off = c.x < -PILL_W - 40 || c.x > W + PILL_W + 40 || c.y < -60 || c.y > H + 60
      el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) translate(${rtl ? `calc(-100% + ${ANCHOR}px)` : `-${ANCHOR}px`}, -50%) scale(${1 - c.t * 0.35})`
      el.style.transformOrigin = rtl ? `calc(100% - ${ANCHOR}px) 50%` : `${ANCHOR}px 50%`
      el.style.opacity = String(1 - c.t)
      el.style.visibility = off ? 'hidden' : 'visible'
      el.style.pointerEvents = c.t < 0.5 ? 'auto' : 'none'
    }

    // 2. Individual avatars flow out from the city centre as the city splits.
    for (const x of per) {
      const area = areaRefs.current.get(x.g.city.id)
      if (area) {
        if (x.t <= 0.001) area.style.visibility = 'hidden'
        else {
          const r = cityRadiusKm(x.g.members.length) * pxPerKm(z, x.g.city.lat) + 26
          const off = x.p.x < -r || x.p.x > W + r || x.p.y < -r || x.p.y > H + r
          area.style.visibility = off ? 'hidden' : 'visible'
          area.style.opacity = String(x.t)
          area.style.transform = `translate3d(${x.p.x}px, ${x.p.y}px, 0) translate(-50%, -50%)`
          area.style.width = area.style.height = `${2 * r * (0.6 + 0.4 * x.t)}px`
        }
      }
      const pos = scatters.get(x.g.city.id)
      for (const d of x.g.members) {
        const el = avatarRefs.current.get(d.id)
        if (!el) continue
        if (x.t <= 0.001) {
          el.style.visibility = 'hidden'
          continue
        }
        const q = map.project(pos!.get(d.id)!)
        const px = x.p.x + (q.x - x.p.x) * x.t
        const py = x.p.y + (q.y - x.p.y) * x.t
        const off = px < -40 || px > W + 40 || py < -40 || py > H + 40
        el.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) scale(${0.6 + 0.4 * x.t})`
        el.style.opacity = String(Math.min(1, x.t * 1.5))
        el.style.visibility = off ? 'hidden' : 'visible'
        el.style.pointerEvents = x.t > 0.6 ? 'auto' : 'none'
      }
    }
  }, [map, groups, scatters])

  useEffect(() => {
    map.on('move', update)
    map.on('resize', update)
    return () => {
      map.off('move', update)
      map.off('resize', update)
    }
  }, [map, update])

  // Re-position after every React commit (new clusters/avatars mounted).
  useLayoutEffect(() => {
    update()
  })

  const onCluster = (c: Cluster) => {
    // A merged cluster named after a city that holds most of its people goes straight to that city;
    // otherwise reveal the region so the individual city clusters separate.
    const lead = c.groups[0]
    if (c.groups.length > 1 && lead.members.length < c.count * 0.5) mapApi.fitCities(c.groups.map((g) => g.city.id), 8)
    else mapApi.flyToCity(lead.city.id, lead.members.length)
  }

  return (
    <div className={`markers absolute inset-0 overflow-hidden transition-opacity duration-700 ${mapReady ? 'opacity-100' : 'opacity-0'}`} aria-hidden={false}>
      {groups.map((g) => (
        <div
          key={'area-' + g.city.id}
          ref={(el) => {
            if (el) areaRefs.current.set(g.city.id, el)
            else areaRefs.current.delete(g.city.id)
          }}
          className="city-area"
          style={{ visibility: 'hidden' }}
          aria-hidden
        >
          <span className="city-area-label">
            <span className="text-text/80">{g.city[locale]}</span>
            <span className="tabular-nums">{n(g.members.length)}</span>
          </span>
        </div>
      ))}
      {groups.map((g) =>
        g.members.map((d) => (
          <button
            key={d.id}
            ref={(el) => {
              if (el) avatarRefs.current.set(d.id, el)
              else avatarRefs.current.delete(d.id)
            }}
            type="button"
            onClick={() => openDesigner(d.id)}
            className={`marker-avatar group ${selectedId === d.id ? 'is-selected' : ''} ${d.isMe ? 'is-me' : ''} ${pulseId === d.id ? 'is-pulse' : ''}`}
            style={{ visibility: 'hidden' }}
            aria-label={d.name[locale]}
          >
            <span className="marker-avatar-ring">
              <Avatar d={d} size={30} />
            </span>
            {d.verification === 'verified' && (
              <span className="marker-verified">
                <BadgeCheck size={11} strokeWidth={2.5} />
              </span>
            )}
            <span className="marker-label">
              <span className="font-medium text-text">{d.name[locale]}</span>
              <span className="text-muted">{d.title[locale]}</span>
            </span>
          </button>
        )),
      )}
      {clusters.map((c) => {
        const lead = c.groups[0]
        const faces = c.groups.flatMap((g) => g.members).slice(0, 3)
        const extra = c.groups.length - 1
        return (
          <button
            key={c.key}
            ref={(el) => {
              if (el) clusterRefs.current.set(c.key, el)
              else clusterRefs.current.delete(c.key)
            }}
            type="button"
            onClick={() => onCluster(c)}
            className={`marker-cluster ${c.count >= 20 ? 'is-large' : ''}`}
            title={c.groups.map((g) => g.city[locale]).join(' · ')}
            style={{ visibility: 'hidden' }}
          >
            <span className="flex -space-x-2">
              {faces.map((d) => (
                <span key={d.id} className="rounded-full ring-2 ring-[var(--cluster-bg)]">
                  <Avatar d={d} size={20} />
                </span>
              ))}
            </span>
            <span className="text-[13px] font-semibold tabular-nums text-text">{n(c.count)}</span>
            <span className="max-w-[9rem] truncate text-[12.5px] text-muted">{lead.city[locale]}</span>
            {extra > 0 && <span className="rounded-full bg-white/[0.07] px-1.5 text-[11px] font-medium text-muted">+{n(extra)}</span>}
          </button>
        )
      })}
    </div>
  )
}
