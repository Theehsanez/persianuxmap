import { useState } from 'react'
import { AlertTriangle, BadgeCheck, Check, Circle, Eye, EyeOff, LogOut, MailCheck, Link2, Pencil, Trash2, Clock } from 'lucide-react'
import { useStore } from '../lib/store'
import { MIN_SKILLS } from '../data/taxonomy'
import { useT } from '../lib/i18n'
import { Avatar } from './Avatar'
import { ProfileContent } from './Profile'
import { Button, Field, Toggle, inputCls, VerificationBadge } from './ui'
import { BIO_MAX, CityAutocomplete, LinkFields, PhotoPicker, RolePicker, SkillPicker, draftErrors, draftFromDesigner, type Draft } from './ProfileForm'
import { focusDesignerOnMap } from './SearchBox'
import { applyAccount, call, signOutEverywhere, toProfileInput } from '../lib/actions'
import { session } from '../api/client'

export function MyProfile() {
  const { t } = useT()
  const account = useStore((s) => s.account)
  const drawer = useStore((s) => s.drawer)
  const openMe = useStore((s) => s.openMe)
  const close = useStore((s) => s.closeDrawer)
  const toast = useStore((s) => s.toast)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!account) return null
  const p = account.profile
  const editing = drawer?.type === 'me' && drawer.edit

  if (editing) return <EditProfile key={p.id} />

  const trust = [
    { ok: account.emailVerified, icon: <MailCheck size={15} />, label: t.trustEmail },
    { ok: !!(p.links.linkedin || p.links.portfolio), icon: <Link2 size={15} />, label: t.trustLink },
    { ok: p.verification === 'verified', pending: p.verification === 'pending', icon: <BadgeCheck size={15} />, label: t.trustBadge },
  ]

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-6 pt-3 pe-16 md:pt-6">
        <Avatar d={p} size={44} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-semibold">{t.myProfileTitle}</h2>
          <p className="latin truncate text-[12.5px] text-subtle" dir="ltr">
            {account.email}
          </p>
        </div>
      </div>

      <div className="mx-6 mt-5 flex items-center gap-3 rounded-2xl border border-line bg-white/[0.02] p-4">
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

      <div className="mx-6 mt-3 rounded-2xl border border-line bg-white/[0.02] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[14px] font-medium">{t.trust}</p>
          <VerificationBadge v={p.verification} compact />
        </div>
        <ul className="flex flex-col gap-2.5">
          {trust.map((x) => (
            <li key={x.label} className={`flex items-center gap-2.5 text-[13px] ${x.ok ? 'text-text' : 'text-muted'}`}>
              <span className={x.ok ? 'text-accent' : x.pending ? 'text-warn' : 'text-subtle'}>{x.ok ? <Check size={15} strokeWidth={2.6} /> : x.pending ? <Clock size={15} /> : <Circle size={15} />}</span>
              {x.label}
            </li>
          ))}
        </ul>
        {p.verification === 'email' && (
          <Button size="sm" variant="secondary" className="mt-4 w-full" onClick={async () => applyAccount((await call((api) => api.profile.requestReview())) ?? account)}>
            {t.requestVerification}
          </Button>
        )}
        {p.verification === 'pending' && (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-[12px] leading-relaxed text-subtle">{t.pendingNote}</p>
            <button
              className="self-start text-[12px] text-accent underline-offset-4 hover:underline"
              onClick={async () => applyAccount((await call((api) => api.profile.approveDemo())) ?? account)}
            >
              {t.simulateApproval}
            </button>
          </div>
        )}
      </div>

      <div className="mx-6 mt-3 flex gap-2">
        <Button variant="primary" className="flex-1" icon={<Pencil size={15} />} onClick={() => openMe(true)}>
          {t.editProfile}
        </Button>
        {!account.hidden && (
          <Button variant="secondary" onClick={() => focusDesignerOnMap(p.id)}>
            {t.showOnMap}
          </Button>
        )}
      </div>

      <div className="mt-6 border-t border-line">
        <ProfileContent d={{ ...p, isMe: true }} preview />
      </div>

      <div className="mx-6 mb-6 rounded-2xl border border-danger/20 bg-danger/[0.04] p-4">
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
      </div>
      <div className="mx-6 mb-8 flex items-center justify-between text-[12.5px] text-subtle">
        <span>{t.signedInAs('')}<span className="latin" dir="ltr">{account.email}</span></span>
        <button
          className="flex items-center gap-1.5 hover:text-text"
          onClick={async () => {
            await signOutEverywhere()
            close()
          }}
        >
          <LogOut size={13} className="rtl:-scale-x-100" />
          {t.signOut}
        </button>
      </div>
    </div>
  )
}

function EditProfile() {
  const { t, n } = useT()
  const account = useStore((s) => s.account)!
  const openMe = useStore((s) => s.openMe)
  const [saving, setSaving] = useState(false)
  const toast = useStore((s) => s.toast)
  const [draft, setDraft] = useState<Draft>(() => draftFromDesigner(account.profile))
  const [touched, setTouched] = useState(false)
  const set = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }))
  const errs = draftErrors(draft)
  const invalid = Object.values(errs).some(Boolean)

  const save = async () => {
    setTouched(true)
    if (invalid) return
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
    <div className="flex flex-col">
      <div className="px-6 pt-3 pe-16 md:pt-6">
        <h2 className="text-[19px] font-semibold">{t.editProfile}</h2>
      </div>
      <div className="flex flex-col gap-5 px-6 pt-5 pb-6">
        <Field label={t.photo}>
          <PhotoPicker draft={draft} set={set} />
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
        <Field label={t.skills} error={touched && errs.skills && t.skillsMin(n(MIN_SKILLS))}>
          <SkillPicker value={draft.skills} onChange={(skills) => set({ skills })} />
        </Field>
        <LinkFields draft={draft} set={set} showErrors={touched} />
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
