import { useEffect, useMemo, useRef, useState } from 'react'
import { Map as MapLibreMap, setWorkerUrl, type Map as MLMap, type StyleSpecification, type ExpressionSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre resolves its worker URL at runtime, which bundlers can't see. Let Vite bundle it and hand over the URL.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { feature } from 'topojson-client'
import type { FeatureCollection, Geometry, Position } from 'geojson'
import { isMobile, MOBILE_START, setMap, WORLD_BOUNDS, viewPadding } from './mapApi'
import { useStore } from '../lib/store'
import { cityById, countryByCode } from '../data/geo'
import { MarkerLayer } from './MarkerLayer'
import { useFilteredDesigners, usePublicDesigners } from '../lib/data'

export const MAP_COLORS = {
  ocean: '#090b0e',
  land: '#14181d',
  landActive: '#191e25',
  landHighlight: '#132421',
  border: '#262c34',
  borderHighlight: '#3c7f76',
}

/**
 * world-atlas polygons are stitched for spherical rendering, so rings that cross ±180° (Russia, Fiji…)
 * jump across the whole planar map. Unwrapping longitudes keeps each ring continuous; geojson-vt wraps the rest.
 */
function unwrapAntimeridian(g: Geometry) {
  const fixRing = (ring: Position[]) => {
    for (let i = 1; i < ring.length; i++) {
      const prev = ring[i - 1][0]
      let lng = ring[i][0]
      while (lng - prev > 180) lng -= 360
      while (lng - prev < -180) lng += 360
      ring[i] = [lng, ring[i][1]]
    }
  }
  if (g.type === 'Polygon') g.coordinates.forEach(fixRing)
  else if (g.type === 'MultiPolygon') g.coordinates.forEach((p) => p.forEach(fixRing))
}

setWorkerUrl(workerUrl)

let worldPromise: Promise<FeatureCollection> | null = null
export function loadWorld() {
  worldPromise ??= import('world-atlas/countries-50m.json').then((m) => {
    const topo = (m.default ?? m) as unknown as Parameters<typeof feature>[0]
    const fc = feature(topo, (topo as any).objects.countries) as unknown as FeatureCollection
    fc.features = fc.features.filter((f) => f.properties?.name !== 'Antarctica')
    fc.features.forEach((f) => unwrapAntimeridian(f.geometry))
    return fc
  })
  return worldPromise
}

export function baseStyle(world: FeatureCollection): StyleSpecification {
  return {
    version: 8,
    sources: { countries: { type: 'geojson', data: world } },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': MAP_COLORS.ocean } },
      { id: 'land', type: 'fill', source: 'countries', paint: { 'fill-color': MAP_COLORS.land, 'fill-antialias': true } },
      {
        id: 'borders',
        type: 'line',
        source: 'countries',
        paint: { 'line-color': MAP_COLORS.border, 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.4, 6, 1] },
      },
      {
        id: 'borders-hl',
        type: 'line',
        source: 'countries',
        filter: ['in', ['get', 'name'], ['literal', []]],
        paint: { 'line-color': MAP_COLORS.borderHighlight, 'line-width': 1, 'line-opacity': 0.7 },
      },
    ],
  }
}

export function MapView() {
  const el = useRef<HTMLDivElement>(null)
  const [map, setLocalMap] = useState<MLMap | null>(null)
  const setMapReady = useStore((s) => s.setMapReady)
  const filters = useStore((s) => s.filters)
  const all = usePublicDesigners()
  const filtered = useFilteredDesigners()

  useEffect(() => {
    let disposed = false
    let m: MLMap | null = null
    loadWorld().then((world) => {
      if (disposed || !el.current) return
      const mm = new MapLibreMap({
        container: el.current,
        style: baseStyle(world),
        ...(isMobile() ? MOBILE_START : { bounds: WORLD_BOUNDS, fitBoundsOptions: { padding: viewPadding() } }),
        minZoom: 0.6,
        maxZoom: 13,
        renderWorldCopies: false,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        fadeDuration: 0,
      })
      m = mm
      mm.touchZoomRotate.disableRotation()
      mm.keyboard.disableRotation()
      mm.on('load', () => {
        if (disposed) return
        setMap(mm)
        setLocalMap(mm)
        // Small delay so the first frame of markers fades in over a settled map.
        setTimeout(setMapReady, 250)
      })
    })
    return () => {
      disposed = true
      setMap(null)
      m?.remove()
    }
  }, [setMapReady])

  // Countries with designers read slightly lighter; filtered countries get a quiet accent tint.
  const activeNames = useMemo(
    () => [...new Set(all.map((d) => countryByCode[cityById[d.cityId]?.country]?.atlas).filter(Boolean))] as string[],
    [all],
  )
  const highlightNames = useMemo(() => {
    const codes = new Set(filters.countries)
    filters.cities.forEach((c) => cityById[c] && codes.add(cityById[c].country))
    if (!codes.size && (filters.roles.length || filters.skills.length || filters.q)) filtered.forEach((d) => codes.add(cityById[d.cityId].country))
    return [...codes].map((c) => countryByCode[c]?.atlas).filter(Boolean) as string[]
  }, [filters, filtered])

  useEffect(() => {
    if (!map) return
    const color: ExpressionSpecification = [
      'case',
      ['in', ['get', 'name'], ['literal', highlightNames]],
      MAP_COLORS.landHighlight,
      ['in', ['get', 'name'], ['literal', activeNames]],
      MAP_COLORS.landActive,
      MAP_COLORS.land,
    ]
    map.setPaintProperty('land', 'fill-color', color)
    map.setFilter('borders-hl', ['in', ['get', 'name'], ['literal', highlightNames]])
  }, [map, activeNames, highlightNames])

  return (
    <div className="absolute inset-0">
      <div ref={el} className="h-full w-full" aria-label="World map of designers" />
      <div className="map-vignette pointer-events-none absolute inset-0" />
      {map && <MarkerLayer map={map} designers={filtered} />}
    </div>
  )
}
