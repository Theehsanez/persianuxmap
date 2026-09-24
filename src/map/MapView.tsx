import { useEffect, useMemo, useRef, useState } from 'react'
import { Map as MapLibreMap, setRTLTextPlugin, setWorkerUrl, type Map as MLMap, type StyleSpecification, type ExpressionSpecification, type LayerSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre resolves its worker URL at runtime, which bundlers can't see. Let Vite bundle it and hand over the URL.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
// Shapes Persian/Arabic labels correctly (joining + right-to-left). The package's exports map hides dist/, hence the path.
import rtlTextUrl from '../../node_modules/@mapbox/mapbox-gl-rtl-text/dist/mapbox-gl-rtl-text.js?url'
import { feature } from 'topojson-client'
import type { Locale } from '../data/taxonomy'
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
try {
  setRTLTextPlugin(rtlTextUrl, true)
} catch {
  /* already registered (hot reload) */
}

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

/**
 * Street-level detail (water, urban areas, roads, place names) from OpenFreeMap — free OpenStreetMap vector tiles, no key.
 * It sits on top of the bundled country shapes, so if the tiles can't load the map still works (countries only).
 */
const DETAIL_SOURCE = 'https://tiles.openfreemap.org/planet'
const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'
export const LABEL_LAYERS = ['label-country', 'label-city', 'label-town', 'label-suburb', 'label-water']

export function labelField(locale: Locale): ExpressionSpecification {
  return locale === 'fa'
    ? ['coalesce', ['get', 'name:fa'], ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']]
    : ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']]
}

function detailLayers(locale: Locale): LayerSpecification[] {
  const src = { source: 'detail' }
  const text = labelField(locale)
  const font = ['Noto Sans Regular']
  const halo = { 'text-halo-color': MAP_COLORS.ocean, 'text-halo-width': 1.4, 'text-halo-blur': 0.5 }
  const road = (id: string, classes: string[], minzoom: number, color: string, w: [number, number, number, number]): LayerSpecification => ({
    id,
    type: 'line',
    ...src,
    'source-layer': 'transportation',
    minzoom,
    filter: ['in', ['get', 'class'], ['literal', classes]],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': color, 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], w[0], w[1], w[2], w[3]] },
  })
  return [
    { id: 'urban', type: 'fill', ...src, 'source-layer': 'landuse', minzoom: 8, filter: ['in', ['get', 'class'], ['literal', ['residential', 'suburb', 'neighbourhood', 'commercial', 'retail', 'industrial']]], paint: { 'fill-color': '#1a1f26', 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0, 10, 0.9] } },
    { id: 'park', type: 'fill', ...src, 'source-layer': 'park', minzoom: 9, paint: { 'fill-color': '#132019', 'fill-opacity': 0.8 } },
    { id: 'water', type: 'fill', ...src, 'source-layer': 'water', minzoom: 3, paint: { 'fill-color': MAP_COLORS.ocean } },
    { id: 'waterway', type: 'line', ...src, 'source-layer': 'waterway', minzoom: 9, paint: { 'line-color': '#0d1116', 'line-width': 1.2 } },
    road('road-minor', ['minor', 'service'], 12, '#1d232a', [12, 0.5, 15, 4]),
    road('road-mid', ['secondary', 'tertiary'], 9, '#20262e', [9, 0.4, 15, 6]),
    road('road-primary', ['primary', 'trunk'], 6, '#242b34', [6, 0.4, 15, 8]),
    road('road-motorway', ['motorway'], 5, '#29313b', [5, 0.5, 15, 10]),
    { id: 'building', type: 'fill', ...src, 'source-layer': 'building', minzoom: 13, paint: { 'fill-color': '#1e242b', 'fill-opacity': 0.7 } },
    {
      id: 'label-water',
      type: 'symbol',
      ...src,
      'source-layer': 'water_name',
      minzoom: 3,
      filter: ['in', ['get', 'class'], ['literal', ['ocean', 'sea', 'lake', 'bay']]],
      layout: { 'text-field': text, 'text-font': ['Noto Sans Italic'], 'text-size': 11, 'text-max-width': 8, 'text-letter-spacing': 0.1 },
      paint: { 'text-color': '#2f3a44', ...halo },
    },
    {
      id: 'label-country',
      type: 'symbol',
      ...src,
      'source-layer': 'place',
      minzoom: 2.5,
      maxzoom: 7,
      filter: ['==', ['get', 'class'], 'country'],
      layout: { 'text-field': text, 'text-font': font, 'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 6, 13], 'text-letter-spacing': 0.12, 'text-transform': 'uppercase', 'text-max-width': 7 },
      paint: { 'text-color': '#4a535d', ...halo },
    },
    {
      id: 'label-suburb',
      type: 'symbol',
      ...src,
      'source-layer': 'place',
      minzoom: 11,
      filter: ['in', ['get', 'class'], ['literal', ['suburb', 'neighbourhood', 'quarter']]],
      layout: { 'text-field': text, 'text-font': font, 'text-size': 11, 'text-max-width': 7 },
      paint: { 'text-color': '#56606b', ...halo },
    },
    {
      id: 'label-town',
      type: 'symbol',
      ...src,
      'source-layer': 'place',
      minzoom: 8,
      filter: ['in', ['get', 'class'], ['literal', ['town', 'village']]],
      layout: { 'text-field': text, 'text-font': font, 'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10, 13, 13], 'text-max-width': 7 },
      paint: { 'text-color': '#66707b', ...halo },
    },
    {
      id: 'label-city',
      type: 'symbol',
      ...src,
      'source-layer': 'place',
      minzoom: 4,
      filter: ['==', ['get', 'class'], 'city'],
      layout: {
        'text-field': text,
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 8, 13, 12, 16],
        'text-max-width': 7,
        'symbol-sort-key': ['get', 'rank'],
      },
      paint: { 'text-color': '#7d8792', ...halo },
    },
  ]
}

export function baseStyle(world: FeatureCollection, opts: { detail?: boolean; locale?: Locale } = {}): StyleSpecification {
  return {
    version: 8,
    ...(opts.detail ? { glyphs: GLYPHS } : {}),
    sources: {
      countries: { type: 'geojson', data: world },
      ...(opts.detail ? { detail: { type: 'vector' as const, url: DETAIL_SOURCE, attribution: '© OpenStreetMap contributors, OpenFreeMap' } } : {}),
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': MAP_COLORS.ocean } },
      { id: 'land', type: 'fill', source: 'countries', paint: { 'fill-color': MAP_COLORS.land, 'fill-antialias': true } },
      ...(opts.detail ? detailLayers(opts.locale ?? 'en').filter((l) => !l.id.startsWith('label')) : []),
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
      ...(opts.detail ? detailLayers(opts.locale ?? 'en').filter((l) => l.id.startsWith('label')) : []),
    ],
  }
}

export function MapView() {
  const el = useRef<HTMLDivElement>(null)
  const [map, setLocalMap] = useState<MLMap | null>(null)
  const setMapReady = useStore((s) => s.setMapReady)
  const locale = useStore((s) => s.locale)
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
        style: baseStyle(world, { detail: true, locale: useStore.getState().locale }),
        ...(isMobile() ? MOBILE_START : { bounds: WORLD_BOUNDS, fitBoundsOptions: { padding: viewPadding() } }),
        minZoom: 0.6,
        maxZoom: 15,
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
      // Detail tiles are optional: if OpenFreeMap is unreachable the country map still renders.
      mm.on('error', (e) => console.warn('[map]', e.error?.message ?? e))
      mm.on('load', () => {
        if (disposed) return
        setMap(mm)
        setLocalMap(mm)
        // Intro: settle in from slightly further out while the clusters pop in.
        const z = mm.getZoom()
        mm.jumpTo({ zoom: z - 0.7 })
        mm.easeTo({ zoom: z, duration: 1800, easing: (t) => 1 - Math.pow(1 - t, 3) })
        setTimeout(setMapReady, 200)
      })
    })
    return () => {
      disposed = true
      setMap(null)
      m?.remove()
    }
  }, [setMapReady])

  useEffect(() => {
    if (!map) return
    for (const id of LABEL_LAYERS) if (map.getLayer(id)) map.setLayoutProperty(id, 'text-field', labelField(locale))
  }, [map, locale])

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
