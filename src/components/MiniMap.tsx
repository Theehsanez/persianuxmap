import { useEffect, useRef, useState } from 'react'
import type { FeatureCollection, Position } from 'geojson'
import { loadWorld, MAP_COLORS } from '../map/MapView'
import type { City } from '../data/geo'
import type { Designer } from '../data/designers'
import { Avatar } from './Avatar'

// Web-Mercator at zoom 0 with 512px tiles (same maths as MapLibre), so a zoom level here matches the main map.
const WS = 512
const px = (lng: number) => ((lng + 180) / 360) * WS
const py = (lat: number) => {
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180)
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * WS
}

let worldPath: Promise<string> | null = null
function getWorldPath() {
  worldPath ??= loadWorld().then((fc: FeatureCollection) => {
    const ring = (r: Position[]) => 'M' + r.map(([x, y]) => `${px(x).toFixed(3)},${py(y).toFixed(3)}`).join('L') + 'Z'
    let d = ''
    for (const f of fc.features) {
      const g = f.geometry
      if (g.type === 'Polygon') d += g.coordinates.map(ring).join('')
      else if (g.type === 'MultiPolygon') d += g.coordinates.map((p) => p.map(ring).join('')).join('')
    }
    return d
  })
  return worldPath
}

/**
 * A small static map centred on a city (SVG, no second WebGL context).
 * It shows the approximate area around the city centre, never a precise point.
 */
export function MiniMap({ city, d, height = 150, zoom = 4.2, label }: { city: City; d?: Pick<Designer, 'name' | 'avatar'>; height?: number; zoom?: number; label?: string }) {
  const [path, setPath] = useState<string | null>(null)
  const [w, setW] = useState(0)
  const [z, setZ] = useState(zoom - 1.2)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getWorldPath().then(setPath)
  }, [])
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  // Ease in from slightly further out, like the main map does.
  useEffect(() => {
    const id = requestAnimationFrame(() => setZ(zoom))
    return () => cancelAnimationFrame(id)
  }, [zoom])

  const k = 2 ** z
  const tx = w / 2 - px(city.lng) * k
  const ty = height / 2 - py(city.lat) * k

  return (
    <div ref={box} className="relative overflow-hidden rounded-2xl border border-line" style={{ height, background: MAP_COLORS.ocean }}>
      {path && w > 0 && (
        <svg width={w} height={height} className="absolute inset-0 animate-[fade-in_0.6s_ease_both]" aria-hidden>
          <g style={{ transform: `translate(${tx}px, ${ty}px) scale(${k})`, transition: 'transform 1s cubic-bezier(0.22, 1, 0.36, 1)' }}>
            <path d={path} fill={MAP_COLORS.landActive} stroke={MAP_COLORS.border} strokeWidth={1} vectorEffect="non-scaling-stroke" fillRule="evenodd" />
          </g>
        </svg>
      )}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="absolute size-24 rounded-full border border-dashed border-white/20 bg-white/[0.03]" />
        <span className="absolute size-12 rounded-full bg-white/[0.04]" />
        {d ? (
          <span className="animate-pop relative rounded-full bg-accent p-[2px]">
            <Avatar d={d} size={30} />
          </span>
        ) : (
          <span className="relative size-3 rounded-full bg-accent " />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_30px_rgb(0_0_0/0.55)]" />
      {label && (
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-line bg-bg/80 px-3 py-1 text-[12px] whitespace-nowrap text-muted backdrop-blur">
          {label}
        </span>
      )}
    </div>
  )
}
