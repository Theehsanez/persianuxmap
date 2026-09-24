import { useState } from 'react'
import type { Designer } from '../data/designers'
import { useStore } from '../lib/store'

type P = { d: Pick<Designer, 'name' | 'avatar'>; size?: number; className?: string }

/** Initials monogram (or uploaded photo). Near-greyscale with a faint per-person tint so the map feels human without stock photos. */
export function Avatar({ d, size = 32, className = '' }: P) {
  const locale = useStore((s) => s.locale)
  const [failed, setFailed] = useState<string | null>(null)
  const style = { width: size, height: size, fontSize: Math.max(8, size * 0.38) }
  const photo = d.avatar.photo
  if (photo && failed !== photo) {
    // randomuser.me also serves a 72px "med" size — plenty for map markers and lists.
    const src = size <= 44 ? photo.replace('/api/portraits/', '/api/portraits/med/') : photo
    return (
      <img
        src={src}
        alt=""
        draggable={false}
        decoding="async"
        onError={() => setFailed(photo)}
        className={`avatar shrink-0 rounded-full bg-surface-2 object-cover ${className}`}
        style={style}
      />
    )
  }
  const h = d.avatar.hue
  const name = (locale === 'fa' ? d.name.fa : d.name.en) || d.name.en || d.name.fa
  const parts = name.trim().split(/\s+/)
  const initials =
    locale === 'fa' || size < 24 ? (parts[0]?.[0] ?? '').toUpperCase() : ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
  return (
    <span
      className={`avatar inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${className}`}
      style={{
        ...style,
        background: `linear-gradient(160deg, hsl(${h} 6% 30%), hsl(${h} 6% 19%))`,
        color: 'rgb(255 255 255 / 0.85)',
        letterSpacing: locale === 'fa' ? 0 : '0.02em',
      }}
      aria-hidden
    >
      {initials}
    </span>
  )
}
