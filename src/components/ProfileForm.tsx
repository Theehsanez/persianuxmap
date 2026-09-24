import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ImagePlus, Link2, Globe, MapPin, Search, Trash2, UserRound, X, Loader2 } from 'lucide-react'
import { ROLES, SKILLS, MIN_SKILLS, MAX_SKILLS, type RoleId, type SkillId } from '../data/taxonomy'
import { cityById, countryByCode, searchCities, norm, type City } from '../data/geo'
import type { Designer } from '../data/designers'
import { useT } from '../lib/i18n'
import { Avatar } from './Avatar'
import { MiniMap } from './MiniMap'
import { Button, Field, LinkedinIcon, inputCls } from './ui'

export type Draft = {
  name: string
  title: string
  role: RoleId | ''
  cityId: string
  bio: string
  skills: SkillId[]
  photo?: string
  hue: number
  linkedin: string
  portfolio: string
  website: string
}

export const emptyDraft = (): Draft => ({
  name: '',
  title: '',
  role: '',
  cityId: '',
  bio: '',
  skills: [],
  hue: Math.floor(Math.random() * 360),
  linkedin: '',
  portfolio: '',
  website: '',
})

export const BIO_MAX = 180

export function draftFromDesigner(d: Designer): Draft {
  return {
    name: d.name.en || d.name.fa,
    title: d.title.en || d.title.fa,
    role: d.role,
    cityId: d.cityId,
    bio: d.bio.en || d.bio.fa,
    skills: d.skills,
    photo: d.avatar.photo,
    hue: d.avatar.hue,
    linkedin: d.links.linkedin ?? '',
    portfolio: d.links.portfolio ?? '',
    website: d.links.website ?? '',
  }
}

export function normalizeUrl(u: string) {
  const s = u.trim()
  if (!s) return ''
  return /^https?:\/\//i.test(s) ? s : `https://${s}`
}
export const isUrl = (u: string) => {
  if (!u.trim()) return true
  try {
    const x = new URL(normalizeUrl(u))
    return x.hostname.includes('.') && !x.hostname.startsWith('.') && !x.hostname.endsWith('.')
  } catch {
    return false
  }
}

/** User-entered text is shown as typed in both languages. */
export function designerFromDraft(d: Draft, base: Partial<Designer> = {}): Designer {
  const roleTitle = ROLES.find((r) => r.id === d.role)
  const title = d.title.trim()
  return {
    id: base.id ?? 'me',
    name: { en: d.name.trim(), fa: d.name.trim() },
    role: (d.role || 'other') as RoleId,
    title: title ? { en: title, fa: title } : { en: roleTitle?.en ?? '', fa: roleTitle?.fa ?? '' },
    cityId: d.cityId,
    skills: d.skills,
    bio: { en: d.bio.trim(), fa: d.bio.trim() },
    links: {
      linkedin: normalizeUrl(d.linkedin) || undefined,
      portfolio: normalizeUrl(d.portfolio) || undefined,
      website: normalizeUrl(d.website) || undefined,
    },
    joined: base.joined ?? new Date().toISOString(),
    verification: base.verification ?? 'email',
    avatar: { hue: d.hue, photo: d.photo },
  }
}

export const draftErrors = (d: Draft) => ({
  name: d.name.trim().length < 2,
  role: !d.role,
  city: !d.cityId,
  skills: d.skills.length < MIN_SKILLS || d.skills.length > MAX_SKILLS,
  links: !d.linkedin.trim() && !d.portfolio.trim(),
  urls: ![d.linkedin, d.portfolio, d.website].every(isUrl),
})

// ————————————————————————————————— Photo

function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const img = new Image()
      img.onload = () => {
        const S = 256
        const c = document.createElement('canvas')
        c.width = c.height = S
        const ctx = c.getContext('2d')!
        const m = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, S, S)
        resolve(c.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = r.result as string
    }
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

/** Simulated "import from a connected source": produces a soft portrait illustration. */
function importedPortrait(hue: number) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hue} 35% 38%)'/><stop offset='1' stop-color='hsl(${(hue + 40) % 360} 30% 18%)'/></linearGradient></defs><rect width='128' height='128' fill='url(#g)'/><circle cx='64' cy='52' r='22' fill='hsl(${hue} 30% 82%)' opacity='.92'/><path d='M22 128c4-26 22-40 42-40s38 14 42 40z' fill='hsl(${hue} 30% 82%)' opacity='.92'/></svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

export function PhotoPicker({ draft, set }: { draft: Draft; set: (p: Partial<Draft>) => void }) {
  const { t } = useT()
  const file = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const preview = { name: { en: draft.name || '?', fa: draft.name || '?' }, avatar: { hue: draft.hue, photo: draft.photo } }
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {draft.name || draft.photo ? (
          <Avatar d={preview} size={64} />
        ) : (
          <span className="grid size-16 place-items-center rounded-full border border-dashed border-line-strong text-subtle">
            <UserRound size={24} />
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => file.current?.click()} icon={<ImagePlus size={14} />}>
            {t.uploadPhoto}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={importing}
            onClick={() => {
              setImporting(true)
              setTimeout(() => {
                set({ photo: importedPortrait(draft.hue) })
                setImporting(false)
              }, 900)
            }}
            icon={importing ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
          >
            {importing ? t.importing : t.importPhoto}
          </Button>
          {draft.photo && (
            <Button type="button" size="sm" variant="ghost" onClick={() => set({ photo: undefined })} icon={<Trash2 size={14} />}>
              {t.removePhoto}
            </Button>
          )}
        </div>
        <p className="text-xs text-subtle">{t.photoHint}</p>
      </div>
      <input
        ref={file}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) set({ photo: await downscale(f) })
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ————————————————————————————————— Role

export function RolePicker({ value, onChange }: { value: RoleId | ''; onChange: (r: RoleId) => void }) {
  const { locale } = useT()
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup">
      {ROLES.map((r) => {
        const on = value === r.id
        return (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(r.id)}
            className={`h-9 rounded-xl border px-3 text-[13px] transition-all active:scale-[0.97] ${
              on ? 'border-accent/55 bg-accent-soft text-accent-strong' : 'border-line bg-white/[0.02] text-text/80 hover:border-line-strong hover:text-text'
            }`}
          >
            {r[locale]}
          </button>
        )
      })}
    </div>
  )
}

// ————————————————————————————————— City

function Highlight({ text, q }: { text: string; q: string }) {
  const i = norm(text).indexOf(norm(q))
  if (!q || i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <span className="text-accent-strong">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  )
}

export function CityAutocomplete({ value, onChange, avatar, id }: { value: string; onChange: (id: string) => void; avatar?: Pick<Designer, 'name' | 'avatar'>; id?: string }) {
  const { t, locale } = useT()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const city = value ? cityById[value] : undefined
  const results = useMemo(() => searchCities(q, 6), [q])
  useEffect(() => setHi(0), [q])
  const inputRef = useRef<HTMLInputElement>(null)

  const choose = (c: City) => {
    onChange(c.id)
    setQ('')
    setOpen(false)
  }

  if (city && !open) {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex h-11 items-center gap-2.5 rounded-xl border border-accent/40 bg-accent-soft/60 px-3.5">
          <MapPin size={16} className="text-accent" />
          <span className="flex-1 text-[14.5px]">
            {city[locale]}
            <span className="text-muted">
              {locale === 'fa' ? '، ' : ', '}
              {countryByCode[city.country]?.[locale]}
            </span>
          </span>
          <button
            type="button"
            className="text-[12.5px] text-muted hover:text-text"
            onClick={() => {
              setOpen(true)
              requestAnimationFrame(() => inputRef.current?.focus())
            }}
          >
            {t.change}
          </button>
        </div>
        <MiniMap city={city} d={avatar} />
      </div>
    )
  }

  return (
    <div className="relative">
      <div className={`${inputCls} flex items-center gap-2`}>
        <Search size={16} className="shrink-0 text-subtle" />
        <input
          id={id}
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setHi((h) => Math.min(results.length - 1, h + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHi((h) => Math.max(0, h - 1))
            } else if (e.key === 'Enter' && results[hi]) {
              e.preventDefault()
              choose(results[hi])
            } else if (e.key === 'Escape') setOpen(false)
          }}
          placeholder={t.cityPlaceholder}
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-subtle"
          role="combobox"
          aria-expanded={open && q.length > 0}
        />
        {city && (
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen(false)} className="text-subtle hover:text-text" aria-label={t.close}>
            <X size={15} />
          </button>
        )}
      </div>
      {open && q.trim().length > 0 && (
        <div className="surface-solid animate-fade-in absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl p-1" role="listbox">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-[13px] text-muted">{t.cityNoResults}</p>
          ) : (
            results.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={i === hi}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHi(i)}
                onClick={() => choose(c)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start ${i === hi ? 'bg-white/[0.07]' : ''}`}
              >
                <MapPin size={15} className="shrink-0 text-subtle" />
                <span className="min-w-0 flex-1 truncate text-[14px]">
                  <Highlight text={c[locale]} q={q} />
                  <span className="text-muted">
                    {locale === 'fa' ? '، ' : ', '}
                    {countryByCode[c.country]?.[locale]}
                  </span>
                </span>
                <span className="text-sm">{countryByCode[c.country]?.flag}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ————————————————————————————————— Skills

export function SkillPicker({ value, onChange }: { value: SkillId[]; onChange: (s: SkillId[]) => void }) {
  const { t, locale, n } = useT()
  const [q, setQ] = useState('')
  const [shake, setShake] = useState(false)
  const full = value.length >= MAX_SKILLS
  const list = SKILLS.filter((s) => !q || norm(s.en + ' ' + s.fa).includes(norm(q)))
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className={`${inputCls} !h-10 flex max-w-60 items-center gap-2`}>
          <Search size={15} className="shrink-0 text-subtle" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.skills + '…'} className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" />
        </div>
        <span className={`text-[12.5px] tabular-nums transition-colors ${value.length >= MIN_SKILLS ? 'text-accent' : 'text-muted'}`}>
          {t.skillsSelected(n(value.length), n(MAX_SKILLS))}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(value.length / MAX_SKILLS) * 100}%` }} />
      </div>
      <div className={`flex flex-wrap gap-2 ${shake ? 'animate-[pop_0.3s]' : ''}`}>
        {list.map((s) => {
          const on = value.includes(s.id)
          const disabled = !on && full
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                if (on) onChange(value.filter((x) => x !== s.id))
                else if (full) {
                  setShake(true)
                  setTimeout(() => setShake(false), 300)
                } else onChange([...value, s.id])
              }}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[13.5px] transition-all active:scale-[0.97] ${
                on
                  ? 'border-accent/55 bg-accent-soft text-accent-strong'
                  : disabled
                    ? 'border-line text-subtle opacity-50'
                    : 'border-line bg-white/[0.02] text-text/85 hover:border-line-strong hover:text-text'
              }`}
            >
              {on && <Check size={14} strokeWidth={2.6} />}
              {s[locale]}
            </button>
          )
        })}
      </div>
      <p className={`text-xs ${full ? 'text-warn' : 'text-subtle'}`}>{full ? t.skillsMax : value.length < MIN_SKILLS ? t.skillsMin(n(MIN_SKILLS)) : ' '}</p>
    </div>
  )
}

// ————————————————————————————————— Links

export function LinkFields({ draft, set, showErrors }: { draft: Draft; set: (p: Partial<Draft>) => void; showErrors?: boolean }) {
  const { t } = useT()
  const need = showErrors && !draft.linkedin.trim() && !draft.portfolio.trim()
  const row = (k: 'linkedin' | 'portfolio' | 'website', label: string, icon: React.ReactNode, placeholder: string, optional?: boolean) => (
    <Field label={label} htmlFor={k} optional={optional ? t.optional : undefined} error={showErrors && !isUrl(draft[k]) && t.urlInvalid}>
      <div className={`${inputCls} flex items-center gap-2.5 ${need && !optional ? '!border-danger/50' : ''}`}>
        <span className="text-subtle">{icon}</span>
        <input
          id={k}
          dir="ltr"
          inputMode="url"
          autoComplete="url"
          value={draft[k]}
          onChange={(e) => set({ [k]: e.target.value })}
          placeholder={placeholder}
          className="latin h-full min-w-0 flex-1 bg-transparent text-start outline-none placeholder:text-subtle rtl:text-right"
        />
      </div>
    </Field>
  )
  return (
    <div className="flex flex-col gap-4">
      {row('linkedin', t.linkedin, <LinkedinIcon size={16} />, 'linkedin.com/in/your-name')}
      {row('portfolio', t.portfolio, <Link2 size={16} />, 'behance.net/you · dribbble.com/you')}
      <p className={`-mt-1 text-xs ${need ? 'text-danger' : 'text-subtle'}`}>{t.linksRule}</p>
      {row('website', t.personalWebsite, <Globe size={16} />, 'yourname.design', true)}
    </div>
  )
}
