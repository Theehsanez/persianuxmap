import { ArrowUpRight, CalendarDays, Flag, Globe, Link2, MapPin, ShieldCheck } from 'lucide-react'
import type { Designer } from '../data/designers'
import { instagramUrl, telegramUrl } from '../api/shared'
import { cityById, countryByCode } from '../data/geo'
import { skillById } from '../data/taxonomy'
import { useT, fmtMonthYear, DICTS } from '../lib/i18n'
import { profileLink, useStore } from '../lib/store'
import { usePublicDesigners } from '../lib/data'
import { Avatar } from './Avatar'
import { Button, btnCls, InstagramIcon, LinkedinIcon, TelegramIcon, CloseButton, Sheet, VerificationBadge, useEscape, useIsMobile } from './ui'
import { focusDesignerOnMap } from './SearchBox'
import { MyProfile } from './MyProfile'
import { useDesigner } from '../lib/data'

/** Native share sheet on phones; copy to clipboard elsewhere. */
async function shareProfile(d: Designer) {
  const s = useStore.getState()
  const t = DICTS[s.locale]
  const url = profileLink(d.id)
  if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ title: d.name[s.locale], text: `${d.name[s.locale]} — Persian UX Map`, url })
      return
    } catch {
      /* dismissed — fall back to copying */
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    s.toast(t.linkCopied, 'success')
  } catch {
    window.prompt(t.copyLink, url)
  }
}

const prettyUrl = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

export function ProfileContent({ d, preview = false, bare = false }: { d: Designer; preview?: boolean; bare?: boolean }) {
  const { t, locale } = useT()
  const city = cityById[d.cityId]
  const country = city ? countryByCode[city.country] : undefined
  const toggleFilter = useStore((s) => s.toggleFilter)
  const filters = useStore((s) => s.filters)
  const setReport = useStore((s) => s.setReport)
  const reported = useStore((s) => s.reportedIds.includes(d.id))
  const all = usePublicDesigners()
  const neighbours = preview ? [] : all.filter((x) => x.cityId === d.cityId && x.id !== d.id).slice(0, 7)
  const nameOk = d.name[locale] || d.name.en || d.name.fa

  return (
    <div className="stagger flex flex-col">
      {!bare && <div className="px-6 pt-2 md:pt-6">
        <div className="relative w-fit">
          <span className="block rounded-full p-[3px] ring-1 ring-line-strong">
            <Avatar d={d} size={76} />
          </span>
          {d.verification === 'verified' && (
            <span className="absolute -bottom-0.5 end-0 grid size-6 place-items-center rounded-full bg-surface text-accent">
              <ShieldCheck size={17} />
            </span>
          )}
        </div>
        <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.015em] text-text">{nameOk}</h2>
        <p className="mt-0.5 text-[15px] text-muted">{d.title[locale] || d.title.en}</p>
        {city && (
          <p className="mt-3 flex items-center gap-1.5 text-[13.5px] text-text/85">
            <MapPin size={15} className="text-accent" />
            <span>
              {city[locale]}
              {locale === 'fa' ? '، ' : ', '}
              {country?.[locale]}
            </span>
            <span className="ms-1 text-subtle">{country?.flag}</span>
          </p>
        )}
      </div>}

      {d.bio[locale] || d.bio.en ? <p className="px-6 pt-5 text-[14.5px] leading-[1.7] text-text/90">{d.bio[locale] || d.bio.en}</p> : null}

      <div className="px-6 pt-6">
        <h3 className="mb-2.5 text-[12px] font-medium tracking-wide text-subtle uppercase">{t.skills}</h3>
        <div className="flex flex-wrap gap-1.5">
          {d.skills.map((s) => {
            const on = filters.skills.includes(s)
            return (
              <button
                key={s}
                type="button"
                disabled={preview}
                onClick={() => toggleFilter('skills', s)}
                className={`h-7 rounded-lg border px-2.5 text-[12.5px] transition-colors disabled:cursor-default ${
                  on ? 'border-accent/45 bg-accent-soft text-accent-strong' : 'border-line bg-white/[0.03] text-text/85 enabled:hover:border-line-strong'
                }`}
              >
                {skillById[s]?.[locale]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-6 pt-6">
        {d.links.portfolio && (
          <a href={preview ? undefined : d.links.portfolio} target="_blank" rel="noreferrer noopener" className={`${btnCls('primary', 'lg')} w-full`}>
            {t.viewPortfolio}
            <ArrowUpRight size={17} className="rtl:-scale-x-100" />
          </a>
        )}
        <div className="flex gap-2">
          {d.links.linkedin && (
            <a href={preview ? undefined : d.links.linkedin} target="_blank" rel="noreferrer noopener" className={`${btnCls()} min-w-0 flex-1`}>
              <LinkedinIcon size={16} />
              {t.linkedin}
            </a>
          )}
          {d.links.website && (
            <a href={preview ? undefined : d.links.website} target="_blank" rel="noreferrer noopener" className={`${btnCls()} min-w-0 flex-1`} title={d.links.website}>
              <Globe size={16} className="shrink-0" />
              <span className="latin truncate" dir="ltr">
                {prettyUrl(d.links.website)}
              </span>
            </a>
          )}
        </div>
        {(d.links.instagram || d.links.telegram) && (
          <div className="flex gap-2">
            {d.links.instagram && (
              <a href={preview ? undefined : instagramUrl(d.links.instagram)} target="_blank" rel="noreferrer noopener" className={`${btnCls()} min-w-0 flex-1`} title={t.instagram}>
                <InstagramIcon size={16} className="shrink-0" />
                <span className="latin truncate" dir="ltr">
                  @{d.links.instagram}
                </span>
              </a>
            )}
            {d.links.telegram && (
              <a href={preview ? undefined : telegramUrl(d.links.telegram)} target="_blank" rel="noreferrer noopener" className={`${btnCls()} min-w-0 flex-1`} title={t.telegram}>
                <TelegramIcon size={16} className="shrink-0" />
                <span className="latin truncate" dir="ltr">
                  @{d.links.telegram}
                </span>
              </a>
            )}
          </div>
        )}
      </div>

      <div className="mx-6 mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-5 text-[12.5px] text-muted">
        <VerificationBadge v={d.verification} compact />
        <span className="flex items-center gap-1.5">
          <CalendarDays size={14} className="text-subtle" />
          {t.memberSince(fmtMonthYear(d.joined, locale))}
        </span>
      </div>

      {neighbours.length > 0 && city && (
        <div className="px-6 pt-6">
          <h3 className="mb-2.5 text-[12px] font-medium tracking-wide text-subtle uppercase">{t.nearby(city[locale])}</h3>
          <div className="flex flex-wrap gap-1.5">
            {neighbours.map((x) => (
              <button
                key={x.id}
                type="button"
                title={x.name[locale]}
                onClick={() => focusDesignerOnMap(x.id)}
                className="rounded-full ring-1 ring-line transition-transform hover:scale-110 hover:ring-accent/60"
              >
                <Avatar d={x} size={34} />
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mx-6 mt-6 flex items-start gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 text-[12px] leading-relaxed text-subtle">
        <MapPin size={14} className="mt-0.5 shrink-0" />
        {t.privacy}
      </p>

      {!preview && (
        <div className="flex items-center justify-between px-4 pt-3 pb-6">
          <Button variant="ghost" size="sm" onClick={() => shareProfile(d)} icon={<Link2 size={14} />}>
            {t.copyLink}
          </Button>
          {!d.isMe && (
            <Button variant="ghost" size="sm" disabled={reported} onClick={() => setReport(d.id)} icon={<Flag size={14} />}>
              {reported ? t.reported : t.report}
            </Button>
          )}
        </div>
      )}
      {preview && <div className="h-6" />}
    </div>
  )
}

/** People who still share one spot at the deepest zoom — pick someone to open their profile. */
function PeopleList({ ids }: { ids: string[] }) {
  const { t, locale, n } = useT()
  const all = usePublicDesigners()
  const people = ids.map((id) => all.find((d) => d.id === id)).filter(Boolean) as Designer[]
  const city = people[0] ? cityById[people[0].cityId] : undefined
  return (
    <div className="stagger flex flex-col px-4 pt-3 pb-6 md:pt-6">
      <div className="px-2 pb-3 pe-12">
        <h2 className="text-[18px] font-semibold">{t.peopleHere(n(people.length))}</h2>
        {city && <p className="mt-0.5 text-[13px] text-muted">{city[locale]}</p>}
      </div>
      {people.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => focusDesignerOnMap(d.id)}
          className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-start transition-colors hover:bg-white/[0.05]"
        >
          <Avatar d={d} size={38} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium">{d.name[locale]}</span>
            <span className="block truncate text-[12.5px] text-muted">{d.title[locale]}</span>
          </span>
          {d.verification === 'verified' && <ShieldCheck size={15} className="shrink-0 text-subtle" />}
        </button>
      ))}
    </div>
  )
}

export function ProfileDrawer() {
  const drawer = useStore((s) => s.drawer)
  const close = useStore((s) => s.closeDrawer)
  const mobile = useIsMobile()
  const d = useDesigner(drawer?.type === 'designer' ? drawer.id : null)
  const { t } = useT()
  useEscape(close, !!drawer && !mobile)

  if (!drawer) return null
  const body =
    drawer.type === 'me' ? <MyProfile /> : drawer.type === 'list' ? <PeopleList ids={drawer.ids} /> : d ? <ProfileContent key={d.id} d={d} /> : null
  if (!body) return null

  if (mobile) {
    return (
      <Sheet label={drawer.type === 'me' ? t.myProfileTitle : t.profileCard} onClose={close} initial={drawer.type === 'me' ? 'full' : 'half'}>
        {body}
      </Sheet>
    )
  }
  return (
    <aside
      key={drawer.type === 'designer' ? drawer.id : drawer.type === 'list' ? 'list:' + drawer.ids[0] : 'me'}
      className="drawer-enter surface-solid absolute end-4 top-[76px] bottom-4 z-30 flex w-[400px] flex-col overflow-hidden rounded-[22px]"
      aria-label={t.profileCard}
    >
      <div className="absolute end-3 top-3 z-10">
        <CloseButton onClick={close} />
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">{body}</div>
    </aside>
  )
}
