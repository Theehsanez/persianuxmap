import { useState, type ReactNode } from 'react'
import { AlertTriangle, ArrowUpRight, BadgeCheck, Check, Circle, Clock, Eye, EyeOff, Link2, LogOut, MailCheck, MapPin, Pencil, Shield, Trash2 } from 'lucide-react'
import { profileLink, useStore } from '../lib/store'
import { MIN_SKILLS } from '../data/taxonomy'
import { cityById, countryByCode } from '../data/geo'
import { useT } from '../lib/i18n'
import { Avatar } from './Avatar'
import { ProfileContent } from './Profile'
import { Button, Field, Toggle, inputCls, VerificationBadge } from './ui'
import { BIO_MAX, CityAutocomplete, LinkFields, PhotoPicker, RolePicker, SkillPicker, ToolPicker, draftErrors, draftFromDesigner, type Draft } from './ProfileForm'
import { focusDesignerOnMap } from './SearchBox'
import { applyAccount, call, signOutEverywhere, toProfileInput } from '../lib/actions'
import { session } from '../api/client'

/** Segmented tabs that stay pinned under the header while the panel scrolls. */
function Tabs<K extends string>({ value, onChange, items }: { value: K; onChange: (k: K) => void; items: { key: K; label: string; dot?: boolean }[] }) {
  return (
    <div className="sticky top-0 z-10 border-b border-line bg-surface/95 px-6 pt-3 backdrop-blur">
      <div role="tablist" className="flex gap-1">
        {items.map((it) => (
          <button
            key={it.key}
            role="tab"
            aria-selected={value === it.key}
            onClick={() => onChange(it.key)}
            className={`relative flex h-10 items-center gap-1.5 px-3 text-[13.5px] transition-colors ${value === it.key ? 'text-text' : 'text-muted hover:text-text'}`}
          >
            {it.label}
            {it.dot && <span className="size-1.5 rounded-full bg-danger" />}
            {value === it.key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-white" />}
          </button>
        ))}
      </div>
    </div>
  )
}

const Section = ({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) => (
  <section className={`rounded-2xl border border-line bg-white/[0.02] p-4 ${className}`}>
    {title && <h3 className="mb-3 text-[14px] font-medium">{title}</h3>}
    {children}
  </section>
)

type Tab = 'profile' | 'verification' | 'account'

export function MyProfile() {
  const { t, locale } = useT()
  const account = useStore((s) => s.account)
  const drawer = useStore((s) => s.drawer)
  const openMe = useStore((s) => s.openMe)
  const close = useStore((s) => s.closeDrawer)
  const toast = useStore((s) => s.toast)
  const adminConfigured = useStore((s) => !!s.authConfig.adminConfigured)
  const [tab, setTab] = useState<Tab>('profile')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!account) return null
  const p = account.profile
  if (drawer?.type === 'me' && drawer.edit) return <EditProfile key={p.id} />

  const city = cityById[p.cityId]
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileLink(p.id))
      toast(t.linkCopied, 'success')
    } catch {
      window.prompt(t.copyLink, profileLink(p.id))
    }
  }

  const trust = [
    { ok: account.emailVerified, icon: <MailCheck size={15} />, label: t.trustEmail },
    { ok: !!(p.links.linkedin || p.links.portfolio), icon: <Link2 size={15} />, label: t.trustLink },
    { ok: p.verification === 'verified', pending: p.verification === 'pending', icon: <BadgeCheck size={15} />, label: t.trustBadge },
  ]

  return (
    <div className="flex flex-col">
      {/* Header: who I am + the actions I use most */}
      <div className="px-6 pt-4 pe-16 md:pt-6">
        <div className="flex items-center gap-4">
          <span className="rounded-full p-[3px] ring-1 ring-line-strong">
            <Avatar d={p} size={56} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[18px] font-semibold">{p.name[locale] || p.name.en}</h2>
            <p className="truncate text-[13.5px] text-muted">{p.title[locale] || p.title.en}</p>
            {city && (
              <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-subtle">
                <MapPin size={12} />
                {city[locale]}
                {locale === 'fa' ? '، ' : ', '}
                {countryByCode[city.country]?.[locale]}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <VerificationBadge v={p.verification} compact />
          <span
            className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-[11.5px] font-medium ${account.hidden ? 'border-warn/25 bg-warn/10 text-warn' : 'border-line bg-white/[0.04] text-muted'}`}
          >
            {account.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
            {account.hidden ? t.hiddenChip : t.visibleChip}
          </span>
        </div>
        <div className="mt-4 flex gap-2 pb-4">
          <Button variant="primary" className="flex-1" icon={<Pencil size={15} />} onClick={() => openMe(true)}>
            {t.editProfile}
          </Button>
          {!account.hidden && (
            <Button variant="secondary" icon={<MapPin size={15} />} onClick={() => focusDesignerOnMap(p.id)}>
              {t.showOnMap}
            </Button>
          )}
          <Button variant="secondary" className="!px-3" onClick={copyLink} aria-label={t.copyLink} title={t.copyLink}>
            <Link2 size={16} />
          </Button>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { key: 'profile', label: t.tabProfile },
          { key: 'verification', label: t.tabVerification },
          { key: 'account', label: t.tabAccount },
        ]}
      />

      <div key={tab} className="animate-fade-in">
        {tab === 'profile' && (
          <>
            <p className="mx-6 mt-4 rounded-xl bg-white/[0.03] px-3 py-2 text-[12.5px] text-subtle">{t.publicPreviewNote}</p>
            <ProfileContent d={{ ...p, isMe: true }} preview bare />
          </>
        )}

        {tab === 'verification' && (
          <div className="flex flex-col gap-3 px-6 py-5">
            <p className="text-[13px] leading-relaxed text-muted">{t.verificationIntro}</p>
            <Section>
              <ul className="flex flex-col gap-3">
                {trust.map((x) => (
                  <li key={x.label} className={`flex items-center gap-2.5 text-[13.5px] ${x.ok ? 'text-text' : 'text-muted'}`}>
                    <span className={x.ok ? 'text-accent' : x.pending ? 'text-warn' : 'text-subtle'}>
                      {x.ok ? <Check size={16} strokeWidth={2.6} /> : x.pending ? <Clock size={16} /> : <Circle size={16} />}
                    </span>
                    {x.label}
                  </li>
                ))}
              </ul>
              {p.verification === 'email' && (
                <Button variant="secondary" className="mt-4 w-full" onClick={async () => applyAccount((await call((api) => api.profile.requestReview())) ?? account)}>
                  {t.requestVerification}
                </Button>
              )}
              {p.verification === 'pending' && (
                <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3">
                  <p className="text-[12.5px] leading-relaxed text-subtle">{t.pendingNote}</p>
                  {!adminConfigured && (
                    <button
                      className="self-start text-[12.5px] text-accent underline-offset-4 hover:underline"
                      onClick={async () => applyAccount((await call((api) => api.profile.approveDemo())) ?? account)}
                    >
                      {t.simulateApproval}
                    </button>
                  )}
                </div>
              )}
            </Section>
          </div>
        )}

        {tab === 'account' && (
          <div className="flex flex-col gap-3 px-6 py-5">
            <Section>
              <div className="flex items-center gap-3">
                <span className={`grid size-9 place-items-center rounded-xl ${account.hidden ? 'bg-white/[0.05] text-subtle' : 'bg-accent-soft text-accent'}`}>
                  {account.hidden ? <EyeOff size={17} /> : <Eye size={17} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">{t.visibility}</p>
                  <p className="text-[12.5px] text-muted">{account.hidden ? t.visibilityOff : t.visibilityOn}</p>
                </div>
                <Toggle
                  label={t.visibility}
                  checked={!account.hidden}
                  onChange={async (v) => {
                    const a = await call((api) => api.profile.setHidden({ hidden: !v }))
                    if (!a) return
                    applyAccount(a)
                    toast(v ? t.shownToast : t.hiddenToast)
                  }}
                />
              </div>
            </Section>

            <Section>
              <dl className="flex flex-col gap-2.5 text-[13px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t.emailLabel}</dt>
                  <dd className="latin truncate" dir="ltr">
                    {account.email}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t.signInMethod}</dt>
                  <dd>{account.provider === 'google' ? 'Google' : t.emailLabel}</dd>
                </div>
              </dl>
              <button
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-[13px] text-muted transition-colors hover:bg-white/[0.04] hover:text-text"
                onClick={async () => {
                  await signOutEverywhere()
                  close()
                }}
              >
                <LogOut size={14} className="rtl:-scale-x-100" />
                {t.signOut}
              </button>
            </Section>

            {account.isAdmin && (
              <a href={`${import.meta.env.BASE_URL}admin`} className="flex items-center gap-3 rounded-2xl border border-line bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]">
                <span className="grid size-9 place-items-center rounded-xl bg-white/[0.06]">
                  <Shield size={17} />
                </span>
                <span className="flex-1 text-[14px] font-medium">{t.adminPanel}</span>
                <ArrowUpRight size={16} className="text-subtle rtl:-scale-x-100" />
              </a>
            )}

            <section className="rounded-2xl border border-danger/20 bg-danger/[0.04] p-4">
              <p className="flex items-center gap-2 text-[14px] font-medium text-danger">
                <AlertTriangle size={15} />
                {t.dangerZone}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{t.deleteBody}</p>
              {confirmDelete ? (
                <div className="animate-fade-in mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-text">{t.deleteSure}</span>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<Trash2 size={14} />}
                    onClick={async () => {
                      if (!(await call((api) => api.profile.remove()))) return
                      session.set(null)
                      applyAccount(null)
                      close()
                      toast(t.deletedToast)
                    }}
                  >
                    {t.deleteConfirm}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                    {t.cancel}
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="danger" className="mt-3" icon={<Trash2 size={14} />} onClick={() => setConfirmDelete(true)}>
                  {t.dangerZone}
                </Button>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

type EditTab = 'basics' | 'skills' | 'links'

function EditProfile() {
  const { t, n } = useT()
  const account = useStore((s) => s.account)!
  const openMe = useStore((s) => s.openMe)
  const toast = useStore((s) => s.toast)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<EditTab>('basics')
  const [draft, setDraft] = useState<Draft>(() => draftFromDesigner(account.profile))
  const [touched, setTouched] = useState(false)
  const set = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }))
  const errs = draftErrors(draft)
  const tabErrors: Record<EditTab, boolean> = {
    basics: errs.name || errs.role || errs.city,
    skills: errs.skills,
    links: errs.links || errs.urls || errs.social,
  }
  const invalid = Object.values(tabErrors).some(Boolean)

  const save = async () => {
    setTouched(true)
    if (invalid) {
      // Take the person straight to the first tab that needs fixing.
      setTab((['basics', 'skills', 'links'] as EditTab[]).find((k) => tabErrors[k])!)
      toast(t.fixErrors)
      return
    }
    const cityChanged = draft.cityId !== account.profile.cityId
    setSaving(true)
    const a = await call((api) => api.profile.save(toProfileInput(draft)))
    setSaving(false)
    if (!a) return
    applyAccount(a)
    openMe(false)
    toast(cityChanged ? t.cityChangedToast : t.saved, 'success')
    if (cityChanged && !account.hidden) setTimeout(() => focusDesignerOnMap(account.profile.id), 100)
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="px-6 pt-4 pe-16 pb-1 md:pt-6">
        <h2 className="text-[19px] font-semibold">{t.editProfile}</h2>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { key: 'basics', label: t.tabBasics, dot: touched && tabErrors.basics },
          { key: 'skills', label: t.skills, dot: touched && tabErrors.skills },
          { key: 'links', label: t.tabLinks, dot: touched && tabErrors.links },
        ]}
      />
      <div key={tab} className="animate-fade-in flex flex-1 flex-col gap-5 px-6 pt-5 pb-6">
        {tab === 'basics' && (
          <>
            <Field label={t.photo}>
              <PhotoPicker draft={draft} set={set} email={account.email} />
            </Field>
            <Field label={t.fullName} htmlFor="e-name" error={touched && errs.name && t.required}>
              <input id="e-name" value={draft.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} />
            </Field>
            <Field label={t.professionalRole}>
              <RolePicker value={draft.role} onChange={(role) => set({ role })} />
            </Field>
            <Field label={t.jobTitle} htmlFor="e-title" optional={t.optional}>
              <input id="e-title" value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder={t.jobTitlePlaceholder} className={inputCls} />
            </Field>
            <Field label={t.whereBased} hint={t.cityHint}>
              <CityAutocomplete value={draft.cityId} onChange={(cityId) => set({ cityId })} avatar={{ name: { en: draft.name, fa: draft.name }, avatar: { hue: draft.hue, photo: draft.photo } }} />
            </Field>
            <Field label={t.bio} htmlFor="e-bio" optional={`${n(draft.bio.length)}/${n(BIO_MAX)}`}>
              <textarea id="e-bio" rows={3} maxLength={BIO_MAX} value={draft.bio} onChange={(e) => set({ bio: e.target.value })} className={`${inputCls} !h-auto resize-none py-3 leading-relaxed`} />
            </Field>
          </>
        )}
        {tab === 'skills' && (
          <>
            <Field label={t.skills} error={touched && errs.skills && t.skillsMin(n(MIN_SKILLS))}>
              <SkillPicker value={draft.skills} onChange={(skills) => set({ skills })} />
            </Field>
            <Field label={t.tools} optional={t.optional}>
              <ToolPicker value={draft.tools} onChange={(tools) => set({ tools })} />
            </Field>
          </>
        )}
        {tab === 'links' && <LinkFields draft={draft} set={set} showErrors={touched} />}
      </div>
      <div className="sticky bottom-0 flex gap-2 border-t border-line bg-surface/95 px-6 py-3 backdrop-blur">
        <Button variant="ghost" onClick={() => openMe(false)}>
          {t.cancel}
        </Button>
        <Button variant="primary" className="flex-1" onClick={save} disabled={saving}>
          {t.saveChanges}
        </Button>
      </div>
    </div>
  )
}
