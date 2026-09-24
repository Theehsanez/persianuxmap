import type { Designer } from '../data/designers'
import { useStore } from '../lib/store'

type P = { d: Pick<Designer, 'name' | 'avatar'>; size?: number; className?: string }

/** Initials monogram (or uploaded photo). Muted, per-person hue so the map feels human without stock photos. */
export function Avatar({ d, size = 32, className = '' }: P) {
  const locale = useStore((s) => s.locale)
  const style = { width: size, height: size, fontSize: Math.max(8, size * 0.38) }
  if (d.avatar.photo) {
    return <img src={d.avatar.photo} alt="" draggable={false} className={`avatar shrink-0 rounded-full object-cover ${className}`} style={style} />
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
        background: `radial-gradient(120% 120% at 30% 20%, hsl(${h} 32% 34%), hsl(${(h + 30) % 360} 30% 18%))`,
        color: `hsl(${h} 45% 88%)`,
        letterSpacing: locale === 'fa' ? 0 : '0.02em',
      }}
      aria-hidden
    >
      {initials}
    </span>
  )
}
