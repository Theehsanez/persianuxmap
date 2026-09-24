import type { Designer } from '../data/designers'
import type { City } from '../data/geo'

/** Tiny string hash → [0, 1). Used to place people deterministically but "randomly" around a city centre. */
export function hash01(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

/** Radius (km) of the display area around a city centre. Grows gently with the number of people. */
export const cityRadiusKm = (n: number) => 2.2 * Math.sqrt(n) + 3

/** Screen radius (px) a city needs before its avatars can be shown without piling on top of each other. */
export const neededPx = (n: number) => 17 * Math.sqrt(n) + 16

export const pxPerKm = (zoom: number, lat: number) => (512 * 2 ** zoom) / (40075 * Math.cos((lat * Math.PI) / 180))

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

/** 0 = fully clustered, 1 = fully split into individual avatars. Computed per city so small cities open earlier. */
export function splitProgress(zoom: number, lat: number, n: number) {
  const r = cityRadiusKm(n) * pxPerKm(zoom, lat)
  const need = neededPx(n)
  return smooth((r - need * 0.45) / (need * 0.55))
}

/** Zoom at which a city is comfortably split. Used when the user clicks a cluster. */
export function splitZoom(lat: number, n: number) {
  const targetPx = neededPx(n) * 1.25
  return Math.min(12.5, Math.max(6, Math.log2((targetPx * 40075 * Math.cos((lat * Math.PI) / 180)) / (512 * cityRadiusKm(n)))))
}

/**
 * Approximate display positions for everyone in a city.
 * A jittered sunflower pattern keeps people evenly spread (no pile-ups) while still looking organic.
 * These positions are purely decorative — they never reflect where a person actually lives.
 */
export function scatter(city: City, members: Designer[]): Map<string, [number, number]> {
  const n = members.length
  const R = cityRadiusKm(n)
  const rot = hash01(city.id) * Math.PI * 2
  const ordered = [...members].sort((a, b) => hash01(a.id) - hash01(b.id))
  const kmLat = 1 / 110.574
  const kmLng = 1 / (111.32 * Math.cos((city.lat * Math.PI) / 180))
  const out = new Map<string, [number, number]>()
  ordered.forEach((d, i) => {
    const j1 = hash01(d.id + 'r') - 0.5
    const j2 = hash01(d.id + 'a') - 0.5
    const r = n === 1 ? R * 0.35 : R * Math.min(1, Math.sqrt((i + 0.5) / n) + j1 * 0.12)
    const a = rot + i * 2.39996323 + j2 * 0.5
    out.set(d.id, [city.lng + Math.cos(a) * r * kmLng, city.lat + Math.sin(a) * r * kmLat])
  })
  return out
}
