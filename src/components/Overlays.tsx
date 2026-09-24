import { useEffect, useState } from 'react'
import { CheckCircle2, ChevronDown, Flag, Globe2, Minus, Plus, ShieldCheck, SearchX } from 'lucide-react'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { usePublicDesigners, useStats, useFilteredDesigners, filterCount } from '../lib/data'
import { skillById } from '../data/taxonomy'
import { mapApi, getMap } from '../map/mapApi'
import { useDesigner } from '../lib/data'
import { Avatar } from './Avatar'
import { Button, LogoMark, useEscape, useIsMobile } from './ui'

// ————————————————————————————————— Community stats (floating, collapsible)

export function StatsCard() {
  const { t, locale, n } = useT()
  const all = usePublicDesigners()
  const s = useStats(all)
  const [open, setOpen] = useState(true)
  const exploreOpen = useStore((st) => st.exploreOpen)
  if (exploreOpen) return null
  return (
    <div className="surface animate-fade-in absolute start-4 bottom-4 z-20 w-[272px] overflow-hidden rounded-2xl">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-4 pt-3 pb-2 text-start" aria-expanded={open}>
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-40" />
          <span className="relative inline-flex size-2 rounded-full bg-accent" />
        </span>
        <span className="flex-1 text-[12px] font-medium tracking-wide text-muted uppercase">{t.community}</span>
        <ChevronDown size={15} className={`text-subtle transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
      <div className="grid grid-cols-3 px-4 pb-3">
        {[
          [s.designers, t.statsDesigners],
          [s.countries, t.statsCountries],
          [s.cities, t.statsCities],
        ].map(([v, l]) => (
          <div key={l as string}>
            <div className="text-[19px] font-semibold tabular-nums tracking-tight">{n(v as number)}</div>
            <div className="text-[11.5px] text-subtle">{l}</div>
          </div>
        ))}
      </div>
      {open && (
        <div className="animate-fade-in border-t border-line px-4 pt-2.5 pb-3">
          <div className="mb-2 text-[11.5px] text-subtle">{t.popularSkills}</div>
          <div className="flex flex-wrap gap-1">
            {s.topSkills.slice(0, 4).map(({ id }) => (
              <span key={id} className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[12px] text-text/85">
                {skillById[id][locale]}
              </span>
            ))}
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-subtle">
            <ShieldCheck size={13} className="mt-px shrink-0" />
            {t.privacy}
          </p>
        </div>
      )}
    </div>
  )
}

// ————————————————————————————————— Map controls

export function MapControls() {
  const { t } = useT()
  const drawer = useStore((s) => s.drawer)
  const mobile = useIsMobile()
  const shift = drawer && !mobile
  const btn = 'grid size-9 place-items-center text-muted transition-colors hover:bg-white/[0.07] hover:text-text active:scale-95'
  return (
    <div
      className={`absolute z-20 flex flex-col gap-2 transition-[inset-inline-end] duration-500 ${mobile ? 'end-3 bottom-[calc(env(safe-area-inset-bottom)+84px)]' : 'bottom-4'}`}
      style={mobile ? undefined : { insetInlineEnd: shift ? 432 : 16 }}
    >
      {!mobile && (
        <div className="surface flex flex-col overflow-hidden rounded-xl">
          <button className={btn} aria-label={t.zoomIn} title={t.zoomIn} onClick={mapApi.zoomIn}>
            <Plus size={17} />
          </button>
          <span className="mx-2 h-px bg-line" />
          <button className={btn} aria-label={t.zoomOut} title={t.zoomOut} onClick={mapApi.zoomOut}>
            <Minus size={17} />
          </button>
        </div>
      )}
      <button className={`surface ${btn} rounded-xl ${mobile ? 'size-11' : ''}`} aria-label={t.resetView} title={t.resetView} onClick={mapApi.reset}>
        <Globe2 size={mobile ? 19 : 17} />
      </button>
    </div>
  )
}

/** Gentle hint while the map is at world zoom. Disappears once the user zooms. */
export function ZoomHint() {
  const { t } = useT()
  const ready = useStore((s) => s.mapReady)
  const [show, setShow] = useState(true)
  useEffect(() => {
    const m = getMap()
    if (!m || !ready) return
    const on = () => setShow(m.getZoom() < 3)
    m.on('zoomend', on)
    return () => {
      m.off('zoomend', on)
    }
  }, [ready])
  const mobile = useIsMobile()
  if (!ready || !show || mobile) return null
  return (
    <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
      <div className="animate-fade-in rounded-full border border-line bg-bg/70 px-3.5 py-1.5 text-[12.5px] text-muted backdrop-blur" style={{ animationDelay: '1.2s' }}>
        {t.zoomHint}
      </div>
    </div>
  )
}

// ————————————————————————————————— Empty filter state (on the map)

export function EmptyMapState() {
  const { t } = useT()
  const filters = useStore((s) => s.filters)
  const clear = useStore((s) => s.clearFilters)
  const setOnboarding = useStore((s) => s.setOnboarding)
  const account = useStore((s) => s.account)
  const results = useFilteredDesigners()
  if (!filterCount(filters) || results.length) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center px-6">
      <div className="surface animate-pop pointer-events-auto flex max-w-sm flex-col items-center rounded-3xl px-7 py-7 text-center">
        <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-white/[0.05] text-muted">
          <SearchX size={22} />
        </span>
        <h3 className="text-[16px] font-semibold">{t.noMatchesTitle}</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{filters.q ? t.noResultsBody(filters.q) : t.noMatchesBody}</p>
        <div className="mt-5 flex gap-2">
          <Button onClick={clear}>{t.clearAll}</Button>
          {!account && (
            <Button variant="primary" onClick={() => setOnboarding(true)}>
              {t.addYourself}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ————————————————————————————————— Report

export function ReportDialog() {
  const { t, locale } = useT()
  const id = useStore((s) => s.reportId)
  const setReport = useStore((s) => s.setReport)
  const markReported = useStore((s) => s.markReported)
  const d = useDesigner(id)
  const [reason, setReason] = useState<keyof typeof t.reportReasons | ''>('')
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  const close = () => {
    setReport(null)
    setTimeout(() => {
      setReason('')
      setNote('')
      setSent(false)
    }, 200)
  }
  useEscape(close, !!id)
  if (!id || !d) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true" aria-label={t.reportTitle}>
      <div className="backdrop-enter absolute inset-0 bg-black/60" onClick={close} />
      <div className="sheet-enter md:animate-pop relative w-full rounded-t-[24px] border border-line bg-surface p-6 pb-[max(env(safe-area-inset-bottom),24px)] md:max-w-md md:rounded-[24px]">
        {sent ? (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="animate-pop mb-4 grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
              <CheckCircle2 size={26} />
            </span>
            <h3 className="text-[18px] font-semibold">{t.reportThanksTitle}</h3>
            <p className="mt-1.5 max-w-xs text-[13.5px] leading-relaxed text-muted">{t.reportThanksBody}</p>
            <Button className="mt-6 w-full" onClick={close}>
              {t.done}
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!reason) return
              markReported(d.id)
              setSent(true)
            }}
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-danger/10 text-danger">
                <Flag size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[17px] font-semibold">{t.reportTitle}</h3>
                <p className="flex items-center gap-1.5 truncate text-[13px] text-muted">
                  <Avatar d={d} size={16} /> {d.name[locale]}
                </p>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-muted">{t.reportBody}</p>
            <div className="mt-4 flex flex-col gap-1.5" role="radiogroup">
              {(Object.keys(t.reportReasons) as (keyof typeof t.reportReasons)[]).map((k) => (
                <label
                  key={k}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[14px] transition-colors ${
                    reason === k ? 'border-accent/50 bg-accent-soft' : 'border-line hover:bg-white/[0.03]'
                  }`}
                >
                  <input type="radio" name="reason" className="sr-only" checked={reason === k} onChange={() => setReason(k)} />
                  <span className={`grid size-4 place-items-center rounded-full border ${reason === k ? 'border-accent' : 'border-line-strong'}`}>
                    {reason === k && <span className="size-2 rounded-full bg-accent" />}
                  </span>
                  {t.reportReasons[k]}
                </label>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={t.reportNote}
              className="mt-3 w-full resize-none rounded-xl border border-line bg-white/[0.03] px-3.5 py-2.5 text-[14px] outline-none placeholder:text-subtle focus:border-accent/50"
            />
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="ghost" onClick={close}>
                {t.cancel}
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={!reason}>
                {t.reportSubmit}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ————————————————————————————————— Toasts

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const mobile = useIsMobile()
  return (
    <div className={`pointer-events-none fixed inset-x-0 z-[80] flex flex-col items-center gap-2 px-4 ${mobile ? 'top-[max(env(safe-area-inset-top),12px)]' : 'bottom-6'}`}>
      {toasts.map((x) => (
        <div key={x.id} className="animate-pop pointer-events-auto flex items-center gap-2.5 rounded-full border border-line-strong bg-elevated px-4 py-2.5 text-[13.5px] shadow-[0_12px_30px_-8px_rgb(0_0_0/0.8)]">
          {x.tone === 'success' && <CheckCircle2 size={16} className="text-accent" />}
          {x.text}
        </div>
      ))}
    </div>
  )
}

// ————————————————————————————————— Loading

export function LoadingScreen() {
  const { t } = useT()
  const ready = useStore((s) => s.mapReady)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    if (ready) {
      const id = setTimeout(() => setGone(true), 700)
      return () => clearTimeout(id)
    }
  }, [ready])
  if (gone) return null
  return (
    <div className={`pointer-events-none absolute inset-0 z-[45] grid place-items-center bg-bg transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`} aria-busy={!ready}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <span className="absolute inset-0 animate-ping rounded-[10px] bg-accent/20" />
          <LogoMark size={48} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-[14px] text-muted">{t.loadingMap}</p>
          <div className="flex gap-1.5">
            {[64, 40, 52].map((w, i) => (
              <span key={i} className="skeleton h-1.5 rounded-full" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
