import { forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { BadgeCheck, Check, Clock, MailCheck, X } from 'lucide-react'
import type { Verification } from '../data/designers'
import { useT } from '../lib/i18n'

export function useIsMobile() {
  const q = '(max-width: 767px)'
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return m
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
}

export function btnCls(variant: BtnProps['variant'] = 'secondary', size: BtnProps['size'] = 'md') {
  const v = {
    primary: 'bg-accent text-accent-ink hover:bg-white font-semibold',
    secondary: 'bg-white/[0.06] text-text hover:bg-white/[0.1] border border-line',
    outline: 'border border-line-strong text-text hover:bg-white/[0.05]',
    ghost: 'text-muted hover:text-text hover:bg-white/[0.06]',
    danger: 'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/25',
  }[variant]
  const s = { sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg', md: 'h-10 px-4 text-sm gap-2 rounded-xl', lg: 'h-12 px-5 text-[15px] gap-2 rounded-xl' }[size]
  return `inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-[background,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${v} ${s}`
}

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = 'secondary', size = 'md', icon, className = '', children, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={`${btnCls(variant, size)} ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  )
})

export function IconButton({ label, className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-grid size-9 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-white/[0.07] hover:text-text active:scale-95 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Chip({ active, onClick, children, className = '', count }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-all duration-150 active:scale-[0.97] ${
        active ? 'border-accent/50 bg-accent-soft text-accent-strong' : 'border-line bg-white/[0.03] text-muted hover:border-line-strong hover:text-text'
      } ${className}`}
    >
      {active && <Check size={13} strokeWidth={2.5} />}
      {children}
      {count !== undefined && <span className="text-[11px] tabular-nums opacity-60">{count}</span>}
    </button>
  )
}

export function VerificationBadge({ v, compact }: { v: Verification; compact?: boolean }) {
  const { t } = useT()
  const cfg = {
    verified: { icon: <BadgeCheck size={14} />, label: t.verifiedDesigner, cls: 'text-text bg-white/[0.05] border-white/15' },
    email: { icon: <MailCheck size={14} />, label: t.emailVerified, cls: 'text-muted bg-white/[0.04] border-line' },
    pending: { icon: <Clock size={14} />, label: t.pendingReview, cls: 'text-warn bg-warn/10 border-warn/25' },
    unverified: { icon: <Clock size={14} />, label: t.unverified, cls: 'text-subtle bg-white/[0.03] border-line' },
  }[v]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${compact ? 'h-6 px-2 text-[11.5px]' : 'h-7 px-2.5 text-xs'} font-medium ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-accent' : 'bg-white/15'}`}
    >
      {/* On: dark knob on the white track (the accent is white, so a white knob would disappear). */}
      <span
        className={`absolute top-0.5 size-5 rounded-full shadow transition-[inset-inline-start,background-color] duration-200 ${checked ? 'start-[18px] bg-bg' : 'start-0.5 bg-white'}`}
      />
    </button>
  )
}

export function Field({ label, hint, error, optional, children, htmlFor }: { label: string; hint?: ReactNode; error?: string | false; optional?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="flex items-baseline justify-between text-[13px] font-medium text-text/90">
        {label}
        {optional && <span className="text-[11.5px] font-normal text-subtle">{optional}</span>}
      </label>
      {children}
      {error ? <p className="animate-fade-in text-xs text-danger">{error}</p> : hint ? <p className="text-xs leading-relaxed text-subtle">{hint}</p> : null}
    </div>
  )
}

export const inputCls =
  'h-11 w-full rounded-xl border border-line bg-white/[0.03] px-3.5 text-[14.5px] text-text placeholder:text-subtle outline-none transition-[border,box-shadow,background] focus:border-accent/60 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgb(255_255_255/0.1)]'

/** Dismiss on outside click + Escape. */
export function useDismiss(open: boolean, onClose: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('keydown', key)
    }
  }, [open, onClose, ref])
}

export function useEscape(onClose: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose, active])
}

/**
 * Mobile bottom sheet with a drag handle. Drag down to dismiss, drag up to expand to full height.
 */
export function Sheet({
  onClose,
  children,
  initial = 'half',
  header,
  label,
}: {
  onClose: () => void
  children: ReactNode
  initial?: 'half' | 'full'
  header?: ReactNode
  label: string
}) {
  const [full, setFull] = useState(initial === 'full')
  const [drag, setDrag] = useState(0)
  const start = useRef<number | null>(null)
  const { t } = useT()
  useEscape(onClose)

  const onDown = (e: React.PointerEvent) => {
    start.current = e.clientY
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    if (start.current === null) return
    setDrag(e.clientY - start.current)
  }
  const onUp = () => {
    if (start.current === null) return
    if (drag > 90) full ? setFull(false) : onClose()
    else if (drag < -60) setFull(true)
    start.current = null
    setDrag(0)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={label}>
      <div className="backdrop-enter absolute inset-0 bg-black/35" onClick={onClose} />
      <div
        className="sheet-enter relative flex flex-col rounded-t-[22px] border-t border-line-strong bg-surface shadow-[0_-20px_40px_-10px_rgb(0_0_0/0.8)]"
        style={{
          height: full ? 'calc(100dvh - 12px)' : 'min(62dvh, 560px)',
          transform: drag > 0 ? `translateY(${drag}px)` : drag < 0 && !full ? `translateY(${drag / 3}px)` : undefined,
          transition: start.current === null ? 'height 0.35s var(--ease), transform 0.3s var(--ease)' : 'none',
        }}
      >
        <div className="relative flex h-11 shrink-0 items-center justify-center">
          {/* Drag handle: pull down to close, up to expand. */}
          <div className="absolute inset-0 touch-none cursor-grab" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
          <span className="pointer-events-none h-1 w-10 rounded-full bg-white/20" />
          {/* An explicit close button — dragging isn't obvious to everyone. */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="absolute end-2 top-1.5 grid size-9 place-items-center rounded-full bg-white/[0.06] text-muted transition-colors active:scale-95 hover:bg-white/10 hover:text-text"
          >
            <X size={17} />
          </button>
        </div>
        {header}
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(env(safe-area-inset-bottom),16px)]">{children}</div>
      </div>
    </div>
  )
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  const { t } = useT()
  return (
    <IconButton label={t.close} onClick={onClick}>
      <X size={18} />
    </IconButton>
  )
}

export function Logo({ size = 28, withText = true, sub }: { size?: number; withText?: boolean; sub?: boolean }) {
  const { t } = useT()
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      {withText && (
        <span className="flex flex-col text-start leading-none">
          <span className="latin text-[14.5px] font-semibold tracking-[-0.01em] text-text" dir="ltr">
            Persian <span className="text-accent">UX</span> Map
          </span>
          {sub && <span className="mt-1 text-[11px] text-subtle">{t.tagline}</span>}
        </span>
      )}
    </span>
  )
}

/** Mark: an eight-pointed Persian star (khatam) — doubling as a map pin/compass with a location dot at its centre. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="9" fill="#15171a" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="rgb(255 255 255 / 0.08)" />
      <g transform="translate(16 16)" fill="none" stroke="#f4f4f5" strokeWidth="1.6" strokeLinejoin="round">
        <rect x="-6.6" y="-6.6" width="13.2" height="13.2" rx="1.4" />
        <rect x="-6.6" y="-6.6" width="13.2" height="13.2" rx="1.4" transform="rotate(45)" />
      </g>
      <circle cx="16" cy="16" r="2.5" fill="#f4f4f5" />
    </svg>
  )
}

/** LinkedIn glyph (brand icons are not part of Lucide). */
export function LinkedinIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

/** Instagram glyph (brand icons are not part of Lucide). */
export function InstagramIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Telegram glyph. */
export function TelegramIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M21.4 4.1 2.9 11.3c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.5-1.5Zm-3.5 3.4-8.7 7.9-.3 3.6-1.6-5 10.2-6.4c.5-.3.9-.1.4.3Z" />
    </svg>
  )
}
