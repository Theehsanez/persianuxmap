import type { Map as MLMap, PaddingOptions } from 'maplibre-gl'
import { cityById } from '../data/geo'
import { useStore } from '../lib/store'
import { splitZoom } from './layout'

let map: MLMap | null = null
export const setMap = (m: MLMap | null) => {
  map = m
  if (import.meta.env.DEV) (window as unknown as { __map: MLMap | null }).__map = m
}
export const getMap = () => map

export const isMobile = () => window.matchMedia('(max-width: 767px)').matches

/** Keep the focus point clear of floating UI (nav, drawer, bottom sheets). */
export function viewPadding(): PaddingOptions {
  const s = useStore.getState()
  const rtl = s.locale === 'fa'
  if (isMobile()) {
    const sheet = s.drawer ? Math.round(Math.min(window.innerHeight * 0.62, 560)) + 16 : 90
    return { top: 110, bottom: sheet, left: 24, right: 24 }
  }
  const drawer = s.drawer ? 440 : 0
  const explore = s.exploreOpen ? 400 : 0
  return {
    top: 130,
    bottom: 90,
    left: 60 + (rtl ? drawer : explore),
    right: 60 + (rtl ? explore : drawer),
  }
}

export const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-132, -44],
  [156, 64],
]

/** Portrait screens can't show the whole world legibly; start on the Europe ↔ Iran corridor where most people are. */
export const MOBILE_START = { center: [24, 40] as [number, number], zoom: 1.35 }

export const mapApi = {
  flyToCity(cityId: string, n: number) {
    const c = cityById[cityId]
    if (!map || !c) return
    map.flyTo({ center: [c.lng, c.lat], zoom: splitZoom(c.lat, n), padding: viewPadding(), speed: 1.8, curve: 1.45, maxDuration: 2600, essential: true })
  },
  flyToPoint(lngLat: [number, number], zoom: number) {
    if (!map) return
    map.flyTo({ center: lngLat, zoom: Math.max(map.getZoom(), zoom), padding: viewPadding(), speed: 1.8, curve: 1.45, maxDuration: 2600, essential: true })
  },
  fitCities(ids: string[], maxZoom = 9) {
    if (!map) return
    const cs = ids.map((id) => cityById[id]).filter(Boolean)
    if (!cs.length) return
    if (cs.length === 1) {
      map.flyTo({ center: [cs[0].lng, cs[0].lat], zoom: Math.min(maxZoom, 8), padding: viewPadding(), essential: true })
      return
    }
    const lngs = cs.map((c) => c.lng)
    const lats = cs.map((c) => c.lat)
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: viewPadding(), maxZoom, duration: 1400, essential: true },
    )
  },
  zoomIn: () => map?.zoomIn({ duration: 300 }),
  zoomOut: () => map?.zoomOut({ duration: 300 }),
  reset() {
    if (!map) return
    if (isMobile()) map.flyTo({ ...MOBILE_START, padding: viewPadding(), duration: 1200, essential: true })
    else map.fitBounds(WORLD_BOUNDS, { padding: viewPadding(), duration: 1200, essential: true })
  },
}
