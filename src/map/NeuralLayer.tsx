import { useEffect, useMemo, useRef } from 'react'
import type { CityGroup } from '../lib/data'

/** Screen positions published by MarkerLayer every frame. */
export type NeuralFrame = {
  /** Where each city's lines attach: its cluster bubble, or the city centre once it has opened. */
  cityAnchor: Map<string, { x: number; y: number; cluster: string }>
  /** How far each city has opened into people (0..1). */
  cityT: Map<string, number>
  /** Current screen position of every visible person. */
  people: Map<string, { x: number; y: number }>
  w: number
  h: number
}

type Edge = { a: string; b: string; phase: number; speed: number }

const rand = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return ((h >>> 0) % 10000) / 10000
}

const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** City ↔ city: a minimum spanning tree (so everyone is connected) plus each city's nearest neighbour. */
function cityEdges(groups: CityGroup[]): Edge[] {
  const cs = groups.map((g) => g.city)
  if (cs.length < 2) return []
  const key = (a: string, b: string) => (a < b ? a + '|' + b : b + '|' + a)
  const set = new Set<string>()
  const inTree = new Set([cs[0].id])
  while (inTree.size < cs.length) {
    let best: [string, string, number] | null = null
    for (const a of cs) {
      if (!inTree.has(a.id)) continue
      for (const b of cs) {
        if (inTree.has(b.id)) continue
        const d = km(a, b)
        if (!best || d < best[2]) best = [a.id, b.id, d]
      }
    }
    inTree.add(best![1])
    set.add(key(best![0], best![1]))
  }
  for (const a of cs) {
    let best: [string, number] | null = null
    for (const b of cs) if (b !== a && (!best || km(a, b) < best[1])) best = [b.id, km(a, b)]
    if (best) set.add(key(a.id, best[0]))
  }
  return [...set].map((k) => {
    const [a, b] = k.split('|')
    return { a, b, phase: rand(k), speed: 0.12 + rand(k + 's') * 0.1 }
  })
}

/** Person ↔ person inside a city: each person linked to their nearest neighbours (a k-NN graph). */
function peopleEdges(groups: CityGroup[], scatters: Map<string, Map<string, [number, number]>>, k = 3): Edge[] {
  const out: Edge[] = []
  for (const g of groups) {
    const pos = scatters.get(g.city.id)
    if (!pos || g.members.length < 2) continue
    const cos = Math.cos((g.city.lat * Math.PI) / 180)
    const set = new Set<string>()
    for (const a of g.members) {
      const pa = pos.get(a.id)!
      const near = g.members
        .filter((b) => b !== a)
        .map((b) => {
          const pb = pos.get(b.id)!
          return { id: b.id, d: ((pa[0] - pb[0]) * cos) ** 2 + (pa[1] - pb[1]) ** 2 }
        })
        .sort((x, y) => x.d - y.d)
        .slice(0, k)
      for (const b of near) set.add(a.id < b.id ? a.id + '|' + b.id : b.id + '|' + a.id)
    }
    for (const k2 of set) {
      const [a, b] = k2.split('|')
      out.push({ a, b, phase: rand(k2), speed: 0.35 + rand(k2 + 's') * 0.35 })
    }
  }
  return out
}

const peopleCity = (groups: CityGroup[]) => {
  const m = new Map<string, string>()
  groups.forEach((g) => g.members.forEach((d) => m.set(d.id, g.city.id)))
  return m
}

/**
 * The "neural network": a canvas under the markers. People in a city are wired to each other,
 * cities are wired to other cities, and signals keep travelling along every connection.
 */
export function NeuralLayer({
  frame,
  groups,
  scatters,
  selectedId,
}: {
  frame: React.RefObject<NeuralFrame | null>
  groups: CityGroup[]
  scatters: Map<string, Map<string, [number, number]>>
  selectedId: string | null
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const inter = useMemo(() => cityEdges(groups), [groups])
  const intra = useMemo(() => peopleEdges(groups, scatters), [groups, scatters])
  const cityOf = useMemo(() => peopleCity(groups), [groups])
  const selected = useRef(selectedId)
  selected.current = selectedId

  useEffect(() => {
    const cv = canvas.current!
    const ctx = cv.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const start = performance.now()

    const curve = (x0: number, y0: number, x1: number, y1: number, bend: number) => {
      const mx = (x0 + x1) / 2
      const my = (y0 + y1) / 2
      const dx = x1 - x0
      const dy = y1 - y0
      return { cx: mx - dy * bend, cy: my + dx * bend }
    }
    const at = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, s: number) => {
      const u = 1 - s
      return [u * u * x0 + 2 * u * s * cx + s * s * x1, u * u * y0 + 2 * u * s * cy + s * s * y1]
    }
    const glowDot = (x: number, y: number, r: number, a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(190, 255, 246, ${a})`)
      g.addColorStop(0.35, `rgba(95, 212, 196, ${a * 0.6})`)
      g.addColorStop(1, 'rgba(95, 212, 196, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      const f = frame.current
      if (!f || document.hidden) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (cv.width !== Math.round(f.w * dpr) || cv.height !== Math.round(f.h * dpr)) {
        cv.width = Math.round(f.w * dpr)
        cv.height = Math.round(f.h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, f.w, f.h)
      ctx.globalCompositeOperation = 'lighter'
      const time = (now - start) / 1000
      const off = (x0: number, y0: number, x1: number, y1: number) =>
        (x0 < -50 && x1 < -50) || (x0 > f.w + 50 && x1 > f.w + 50) || (y0 < -50 && y1 < -50) || (y0 > f.h + 50 && y1 > f.h + 50)

      // ── City ↔ city axons
      for (const e of inter) {
        const A = f.cityAnchor.get(e.a)
        const B = f.cityAnchor.get(e.b)
        if (!A || !B || A.cluster === B.cluster) continue
        if (off(A.x, A.y, B.x, B.y)) continue
        const len = Math.hypot(B.x - A.x, B.y - A.y)
        if (len < 30) continue
        const { cx, cy } = curve(A.x, A.y, B.x, B.y, 0.18 * (e.phase > 0.5 ? 1 : -1))
        const grad = ctx.createLinearGradient(A.x, A.y, B.x, B.y)
        grad.addColorStop(0, 'rgba(95, 212, 196, 0.42)')
        grad.addColorStop(0.5, 'rgba(95, 212, 196, 0.14)')
        grad.addColorStop(1, 'rgba(95, 212, 196, 0.42)')
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.2
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(A.x, A.y)
        ctx.quadraticCurveTo(cx, cy, B.x, B.y)
        ctx.stroke()
        if (reduce) continue
        // Signals: a glowing impulse with a short tail, sometimes one each way.
        for (const [dir, ph] of [[1, e.phase], [-1, e.phase + 0.5]] as const) {
          if (dir === -1 && e.phase < 0.55) continue
          const s = (time * e.speed * (240 / Math.max(240, len)) + ph) % 1
          for (let i = 0; i < 6; i++) {
            const si = dir === 1 ? s - i * 0.012 : 1 - s + i * 0.012
            if (si < 0 || si > 1) continue
            const [x, y] = at(A.x, A.y, cx, cy, B.x, B.y, si)
            glowDot(x, y, i === 0 ? 7 : 4 - i * 0.5, i === 0 ? 0.9 : 0.35 - i * 0.05)
          }
        }
      }

      // ── Person ↔ person synapses inside open cities
      for (const e of intra) {
        const city = cityOf.get(e.a)!
        const t = f.cityT.get(city) ?? 0
        if (t < 0.05) continue
        const A = f.people.get(e.a)
        const B = f.people.get(e.b)
        if (!A || !B || off(A.x, A.y, B.x, B.y)) continue
        const hot = selected.current === e.a || selected.current === e.b
        // Each synapse "fires" now and then: its brightness breathes on its own rhythm.
        const fire = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(time * (1.2 + e.speed) + e.phase * 12)
        const alpha = t * (hot ? 0.9 : 0.16 + 0.34 * fire)
        const { cx, cy } = curve(A.x, A.y, B.x, B.y, 0.12 * (e.phase > 0.5 ? 1 : -1))
        ctx.strokeStyle = `rgba(95, 212, 196, ${alpha})`
        ctx.lineWidth = hot ? 1.8 : 1.2
        ctx.beginPath()
        ctx.moveTo(A.x, A.y)
        ctx.quadraticCurveTo(cx, cy, B.x, B.y)
        ctx.stroke()
        if (reduce) continue
        const s = (time * e.speed + e.phase) % 1
        const [x, y] = at(A.x, A.y, cx, cy, B.x, B.y, e.phase > 0.5 ? s : 1 - s)
        glowDot(x, y, hot ? 6 : 4.5, t * (hot ? 1 : 0.75))
      }
      ctx.globalCompositeOperation = 'source-over'
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [frame, inter, intra, cityOf])

  return <canvas ref={canvas} className="neural" aria-hidden />
}
