import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, EyeOff, Loader2, Mail, MailCheck, MapPin } from 'lucide-react'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'
import { MAX_SKILLS, MIN_SKILLS } from '../data/taxonomy'
import { cityById, countryByCode } from '../data/geo'
import { Button, CloseButton, Field, Logo, inputCls, useEscape, useIsMobile } from './ui'
import { BIO_MAX, CityAutocomplete, LinkFields, PhotoPicker, RolePicker, SkillPicker, designerFromDraft, draftErrors, emptyDraft, type Draft } from './ProfileForm'
import { ProfileContent } from './Profile'
import { MiniMap } from './MiniMap'
import { focusDesignerOnMap } from './SearchBox'

const STEPS = 6
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function CodeInput({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(6, ' ').slice(0, 6).split('')
  useEffect(() => refs.current[0]?.focus(), [])
  const setAt = (i: number, ch: string) => {
    const arr = value.padEnd(6, ' ').split('')
    arr[i] = ch
    onChange(arr.join('').replace(/\s+$/, ''))
  }
  return (
    <div className={`flex justify-center gap-2 ${invalid ? 'animate-[pop_0.3s]' : ''}`} dir="ltr">
      {digits.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={c.trim()}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '')
            if (!v) return setAt(i, ' ')
            if (v.length > 1) {
              onChange(v.slice(0, 6))
              refs.current[Math.min(5, v.length)]?.focus()
              return
            }
            setAt(i, v)
            refs.current[i + 1]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !c.trim() && i > 0) refs.current[i - 1]?.focus()
          }}
          onPaste={(e) => {
            const v = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
            if (v) {
              e.preventDefault()
              onChange(v)
              refs.current[Math.min(5, v.length)]?.focus()
            }
          }}
          className={`latin h-14 w-11 rounded-xl border bg-white/[0.03] text-center text-xl font-semibold tabular-nums outline-none transition-[border,box-shadow] focus:border-accent/60 focus:shadow-[0_0_0_4px_rgb(95_212_196/0.1)] sm:w-12 ${
            invalid ? 'border-danger/60' : 'border-line'
          }`}
        />
      ))}
    </div>
  )
}

export function Onboarding() {
  const { t, n, locale } = useT()
  const open = useStore((s) => s.onboardingOpen)
  const setOpen = useStore((s) => s.setOnboarding)
  const setAccount = useStore((s) => s.setAccount)
  const clearFilters = useStore((s) => s.clearFilters)
  const toast = useStore((s) => s.toast)
  const setPulse = useStore((s) => s.setPulse)
  const mobile = useIsMobile()

  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [provider, setProvider] = useState<'google' | 'email' | null>(null)
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [touched, setTouched] = useState(false)
  const [code, setCode] = useState('')
  const [sentCode, setSentCode] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [inbox, setInbox] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const set = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }))
  const errs = draftErrors(draft)
  const scroller = useRef<HTMLDivElement>(null)

  const close = () => setOpen(false)
  useEscape(close, open)

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setStep(0)
      setProvider(null)
      setEmail('')
      setEmailTouched(false)
      setDraft(emptyDraft())
      setTouched(false)
      setCode('')
      setVerified(false)
      setInbox(false)
    }
  }, [open])

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
    setTouched(false)
  }, [step])

  const sendCode = () => {
    const c = String(Math.floor(100000 + Math.random() * 900000))
    setSentCode(c)
    setCode('')
    setCodeError(false)
    setInbox(false)
    setCooldown(30)
    setTimeout(() => setInbox(true), 1200)
  }
  useEffect(() => {
    if (step === 4 && provider === 'email' && !verified && !sentCode) sendCode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])
  useEffect(() => {
    if (!cooldown) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const tryVerify = (c = code) => {
    if (c.length < 6) return
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      if (c === sentCode) {
        setVerified(true)
        setCodeError(false)
        setTimeout(() => go(5), 700)
      } else setCodeError(true)
    }, 600)
  }
  useEffect(() => {
    if (code.length === 6 && !verified) tryVerify(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const go = (s: number) => {
    setDir(s > step ? 1 : -1)
    setStep(s)
  }

  const canNext = [
    !!provider && (provider === 'google' || isEmail(email)),
    !errs.name && !errs.role && !errs.city,
    !errs.skills,
    !errs.links && !errs.urls,
    verified,
    true,
  ][step]

  const next = () => {
    if (!canNext) {
      setTouched(true)
      if (step === 0) setEmailTouched(true)
      return
    }
    go(step + 1)
  }

  const preview = useMemo(() => designerFromDraft(draft, { verification: 'email' }), [draft])

  const join = () => {
    const profile = designerFromDraft(draft, { verification: 'email' })
    setAccount({ email: provider === 'google' ? email || 'you@gmail.com' : email, provider: provider ?? 'email', emailVerified: true, hidden: false, profile })
    setOpen(false)
    clearFilters()
    toast(t.welcomeToast, 'success')
    setTimeout(() => {
      focusDesignerOnMap(profile.id)
      setPulse(profile.id)
      setTimeout(() => setPulse(null), 6000)
    }, 150)
  }

  if (!open) return null

  const google = () => {
    setProvider('google')
    setGoogleLoading(true)
    setTimeout(() => {
      setGoogleLoading(false)
      setEmail('you@gmail.com')
      setVerified(true)
      go(1)
    }, 1000)
  }

  const body = (() => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col gap-6">
            <Heading title={t.s1Title} body={t.s1Body} />
            <div className="flex flex-col gap-3">
              <Button size="lg" variant="outline" className="w-full !bg-white !text-[#1f1f1f] hover:!bg-white/90" onClick={google} disabled={googleLoading}>
                {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
                {googleLoading ? t.connectingGoogle : t.continueGoogle}
              </Button>
              <div className="flex items-center gap-3 text-xs text-subtle">
                <span className="h-px flex-1 bg-line" />
                {t.or}
                <span className="h-px flex-1 bg-line" />
              </div>
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  setProvider('email')
                  setEmailTouched(true)
                  if (isEmail(email)) {
                    setVerified(false)
                    setSentCode('')
                    go(1)
                  }
                }}
              >
                <Field label={t.emailLabel} htmlFor="email" error={emailTouched && !isEmail(email) && t.emailInvalid}>
                  <input
                    id="email"
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => email && setEmailTouched(true)}
                    placeholder={t.emailPlaceholder}
                    className={`${inputCls} latin text-start rtl:text-right`}
                  />
                </Field>
                <Button type="submit" size="lg" variant="secondary" className="w-full" icon={<Mail size={17} />}>
                  {t.continueEmail}
                </Button>
              </form>
              <p className="text-center text-xs leading-relaxed text-subtle">{t.termsNote}</p>
            </div>
          </div>
        )
      case 1:
        return (
          <div className="flex flex-col gap-6">
            <Heading title={t.s2Title} body={t.s2Body} />
            <Field label={t.photo}>
              <PhotoPicker draft={draft} set={set} />
            </Field>
            <Field label={t.fullName} htmlFor="name" error={touched && errs.name && t.required}>
              <input id="name" autoComplete="name" value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder={t.fullNamePlaceholder} className={inputCls} />
            </Field>
            <Field label={t.professionalRole} error={touched && errs.role && t.required}>
              <RolePicker value={draft.role} onChange={(role) => set({ role })} />
            </Field>
            <Field label={t.jobTitle} htmlFor="title" optional={t.optional}>
              <input id="title" value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder={t.jobTitlePlaceholder} className={inputCls} />
            </Field>
            <Field label={t.whereBased} htmlFor="city" hint={t.cityHint} error={touched && errs.city && t.required}>
              <CityAutocomplete id="city" value={draft.cityId} onChange={(cityId) => set({ cityId })} avatar={draft.name ? { name: { en: draft.name, fa: draft.name }, avatar: { hue: draft.hue, photo: draft.photo } } : undefined} />
            </Field>
            <Field label={t.bio} htmlFor="bio" optional={`${n(draft.bio.length)}/${n(BIO_MAX)}`}>
              <textarea
                id="bio"
                rows={3}
                maxLength={BIO_MAX}
                value={draft.bio}
                onChange={(e) => set({ bio: e.target.value })}
                placeholder={t.bioPlaceholder}
                className={`${inputCls} !h-auto resize-none py-3 leading-relaxed`}
              />
            </Field>
          </div>
        )
      case 2:
        return (
          <div className="flex flex-col gap-6">
            <Heading title={t.s3Title} body={t.s3Body(n(MIN_SKILLS), n(MAX_SKILLS))} />
            <SkillPicker value={draft.skills} onChange={(skills) => set({ skills })} />
          </div>
        )
      case 3:
        return (
          <div className="flex flex-col gap-6">
            <Heading title={t.s4Title} body={t.s4Body} />
            <LinkFields draft={draft} set={set} showErrors={touched} />
          </div>
        )
      case 4:
        return (
          <div className="flex flex-col gap-6">
            <div className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">{verified ? <MailCheck size={26} /> : <Mail size={26} />}</div>
            <Heading title={t.s5Title} body={provider === 'google' ? t.s5Google : t.s5Body(email)} />
            {provider === 'google' || verified ? (
              <div className="animate-pop flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3.5 text-[14px] text-accent-strong">
                <Check size={18} strokeWidth={2.6} />
                {t.verified} · <span className="latin" dir="ltr">{email}</span>
              </div>
            ) : (
              <>
                <CodeInput value={code} onChange={(v) => { setCode(v); setCodeError(false) }} invalid={codeError} />
                <div className="flex min-h-5 items-center justify-center gap-2 text-[13px]">
                  {verifying ? (
                    <Loader2 size={16} className="animate-spin text-muted" />
                  ) : codeError ? (
                    <span className="text-danger">{t.codeInvalid}</span>
                  ) : (
                    <button type="button" disabled={cooldown > 0} onClick={sendCode} className="text-muted hover:text-text disabled:text-subtle disabled:hover:text-subtle">
                      {cooldown > 0 ? t.resendIn(n(cooldown)) : t.resend}
                    </button>
                  )}
                </div>
                {inbox && (
                  <button
                    type="button"
                    onClick={() => setCode(sentCode)}
                    className="animate-fade-in flex items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-white/[0.02] px-4 py-3 text-start transition-colors hover:bg-white/[0.05]"
                  >
                    <span className="grid size-9 place-items-center rounded-xl bg-white/[0.06] text-muted">
                      <Mail size={17} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[11.5px] font-medium tracking-wide text-subtle uppercase">{t.demoInbox}</span>
                      <span className="block text-[13.5px] text-text">
                        {t.demoInboxBody('')}
                        <span className="latin font-semibold tracking-[0.2em] text-accent-strong">{sentCode}</span>
                      </span>
                    </span>
                  </button>
                )}
              </>
            )}
            <p className="flex items-center gap-2 text-xs text-subtle">
              <EyeOff size={14} />
              {t.hiddenUntil}
            </p>
          </div>
        )
      default: {
        const city = cityById[draft.cityId]
        return (
          <div className="flex flex-col gap-5">
            <Heading title={t.s6Title} body={t.s6Body} />
            <div className="grid gap-4 sm:grid-cols-[1fr_1.15fr]">
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-medium tracking-wide text-subtle uppercase">{t.onTheMap}</span>
                {city && <MiniMap city={city} d={preview} height={mobile ? 180 : 300} zoom={5.2} label={`${city[locale]}${locale === 'fa' ? '، ' : ', '}${countryByCode[city.country]?.[locale]} · ${t.approxLocation}`} />}
                <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-subtle">
                  <MapPin size={13} className="mt-0.5 shrink-0" />
                  {t.privacy}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-medium tracking-wide text-subtle uppercase">{t.profileCard}</span>
                <div className="overflow-hidden rounded-2xl border border-line bg-surface-2/60 pb-1">
                  <ProfileContent d={preview} preview />
                </div>
              </div>
            </div>
          </div>
        )
      }
    }
  })()

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center md:items-center md:p-6" role="dialog" aria-modal="true" aria-label={t.addYourself}>
      <div className="backdrop-enter absolute inset-0 bg-[rgb(5_6_8/0.72)] backdrop-blur-[3px]" onClick={close} />
      <div
        className={`animate-pop relative flex w-full flex-col overflow-hidden bg-surface md:max-h-[min(860px,92vh)] md:rounded-[26px] md:border md:border-line md:shadow-[0_40px_80px_-20px_rgb(0_0_0/0.9)] ${
          step === 5 ? 'md:max-w-[860px]' : 'md:max-w-[560px]'
        } transition-[max-width] duration-500`}
      >
        {/* header */}
        <div className="flex shrink-0 items-center gap-4 px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3 md:px-7 md:pt-5">
          <Logo size={26} withText={!mobile} />
          <div className="flex flex-1 items-center gap-1.5" aria-label={t.step(n(step + 1), n(STEPS))}>
            {Array.from({ length: STEPS }).map((_, i) => (
              <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                <span className="block h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: i < step ? '100%' : i === step ? '50%' : '0%' }} />
              </span>
            ))}
          </div>
          <CloseButton onClick={close} />
        </div>
        <div className="flex shrink-0 items-center justify-between px-5 pb-1 text-[12px] text-subtle md:px-7">
          <span>{t.step(n(step + 1), n(STEPS))}</span>
          <span className="font-medium text-muted">{t.stepNames[step]}</span>
        </div>

        {/* body */}
        <div ref={scroller} className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-6 md:px-7">
          <div key={step} className={dir === 1 ? 'animate-fade-in' : 'animate-fade-in'}>
            {body}
          </div>
        </div>

        {/* footer */}
        {step > 0 && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-5 pt-3 pb-[max(env(safe-area-inset-bottom),14px)] md:px-7 md:pb-4">
            <Button variant="ghost" onClick={() => go(step === 5 ? 1 : step - 1)} icon={<ArrowLeft size={16} className="rtl:-scale-x-100" />}>
              {step === 5 ? t.editDetails : t.back}
            </Button>
            {step === 5 ? (
              <Button variant="primary" size="lg" onClick={join} icon={<MapPin size={17} />}>
                {t.joinMap}
              </Button>
            ) : step === 4 && !verified ? (
              <Button variant="primary" onClick={() => tryVerify()} disabled={code.length < 6 || verifying}>
                {t.verify}
              </Button>
            ) : (
              <Button variant="primary" onClick={next} className={canNext ? '' : 'opacity-60'}>
                {t.continue}
                <ArrowRight size={16} className="rtl:-scale-x-100" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Heading({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-text">{title}</h2>
      <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{body}</p>
    </div>
  )
}
