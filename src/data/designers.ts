import type { L10n, RoleId, SkillId, ToolId } from './taxonomy'
import { ROLES } from './taxonomy'

export type Verification = 'unverified' | 'email' | 'pending' | 'verified'

export type Designer = {
  id: string
  name: L10n
  role: RoleId
  title: L10n
  cityId: string
  skills: SkillId[]
  tools: ToolId[]
  bio: L10n
  links: { linkedin?: string; portfolio?: string; website?: string; instagram?: string; telegram?: string }
  joined: string // ISO date
  verification: Verification
  avatar: { hue: number; photo?: string }
  isMe?: boolean
}

// Deterministic PRNG so the demo map looks the same on every load.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST: [string, string][] = `Sara سارا|Ali علی|Niloofar نیلوفر|Arman آرمان|Mahsa مهسا|Reza رضا|Parsa پارسا|Negar نگار|Kian کیان|Shirin شیرین|Dariush داریوش|Yasaman یاسمن|Omid امید|Leila لیلا|Babak بابک|Ghazal غزل|Pouya پویا|Mina مینا|Sina سینا|Roya رویا|Amir امیر|Tara تارا|Hamed حامد|Elham الهام|Behnam بهنام|Setareh ستاره|Farhad فرهاد|Nazanin نازنین|Kaveh کاوه|Parisa پریسا|Mehdi مهدی|Azadeh آزاده|Soroush سروش|Hoda هدی|Navid نوید|Shadi شادی|Aria آریا|Bahar بهار|Mohsen محسن|Donya دنیا|Pedram پدرام|Maryam مریم|Hooman هومن|Samira سمیرا|Keyvan کیوان|Atena آتنا|Ramin رامین|Sepideh سپیده|Farzad فرزاد|Golnaz گلناز|Siavash سیاوش|Mahtab مهتاب|Erfan عرفان|Nasim نسیم|Milad میلاد|Fatemeh فاطمه|Saman سامان|Ladan لادن|Arash آرش|Yalda یلدا|Nima نیما|Ava آوا|Hesam حسام|Kimia کیمیا|Shayan شایان|Taraneh ترانه|Ehsan احسان|Zahra زهرا|Mani مانی|Rozhin روژین`
  .split('|')
  .map((p) => p.split(' ') as [string, string])

const LAST: [string, string][] = `Ahmadi احمدی|Moradi مرادی|Karimi کریمی|Hosseini حسینی|Rahimi رحیمی|Mohammadi محمدی|Ebrahimi ابراهیمی|Jalali جلالی|Rezaei رضایی|Kazemi کاظمی|Tehrani تهرانی|Shirazi شیرازی|Farahani فراهانی|Sadeghi صادقی|Najafi نجفی|Ghasemi قاسمی|Mousavi موسوی|Heidari حیدری|Salehi صالحی|Azizi عزیزی|Bagheri باقری|Zand زند|Nikpour نیک‌پور|Khosravi خسروی|Rostami رستمی|Amini امینی|Asadi اسدی|Yazdani یزدانی|Soltani سلطانی|Farzaneh فرزانه|Golzar گلزار|Mirzaei میرزایی|Rahmani رحمانی|Parvizi پرویزی|Sharifi شریفی|Abbasi عباسی|Nazari نظری|Jafari جعفری|Shams شمس|Kashani کاشانی|Esfandiari اسفندیاری|Daneshvar دانشور|Taheri طاهری|Vaziri وزیری|Ansari انصاری|Hashemi هاشمی|Sepehri سپهری|Arjmand ارجمند|Behzadi بهزادی|Firouzi فیروزی`
  .split('|')
  .map((p) => p.split(' ') as [string, string])

const FOCUS: L10n[] = [
  { en: 'SaaS', fa: 'محصولات SaaS' },
  { en: 'fintech', fa: 'فین‌تک' },
  { en: 'e-commerce', fa: 'تجارت الکترونیک' },
  { en: 'health tech', fa: 'سلامت دیجیتال' },
  { en: 'AI products', fa: 'محصولات هوش مصنوعی' },
  { en: 'developer tools', fa: 'ابزارهای توسعه‌دهندگان' },
  { en: 'edtech', fa: 'آموزش آنلاین' },
  { en: 'mobility', fa: 'حمل‌ونقل هوشمند' },
  { en: 'travel', fa: 'صنعت سفر' },
  { en: 'media & streaming', fa: 'رسانه و استریم' },
  { en: 'B2B dashboards', fa: 'داشبوردهای B2B' },
  { en: 'marketplaces', fa: 'مارکت‌پلیس‌ها' },
]

const BIOS: Record<string, ((a: L10n, b: L10n) => L10n)[]> = {
  product: [
    (a, b) => ({
      en: `Product designer focused on ${a.en}, ${b.en} and design systems. I care about calm, honest interfaces.`,
      fa: `طراح محصول با تمرکز روی ${a.fa}، ${b.fa} و دیزاین سیستم. به رابط‌های آرام و صادق اهمیت می‌دهم.`,
    }),
    (a) => ({
      en: `Designing ${a.en} products end to end — from discovery workshops to shipped, polished UI.`,
      fa: `طراحی ${a.fa} از صفر تا صد؛ از ورکشاپ‌های کشف مسئله تا رابط کاربری نهایی و منتشرشده.`,
    }),
    (a) => ({
      en: `Previously agency side, now in-house at a ${a.en} startup. Happy to mentor designers moving abroad.`,
      fa: `قبلاً در آژانس، حالا در یک استارتاپ ${a.fa}. خوشحال می‌شوم به طراحانی که مهاجرت می‌کنند کمک کنم.`,
    }),
  ],
  ui: [
    () => ({
      en: 'UI designer with a soft spot for typography, Persian type and bilingual RTL interfaces.',
      fa: 'طراح رابط کاربری، عاشق تایپوگرافی، حروف فارسی و رابط‌های دوزبانه راست‌به‌چپ.',
    }),
    (a) => ({
      en: `Crafting pixel-careful interfaces for ${a.en}. Grids, color, detail.`,
      fa: `طراحی رابط‌های دقیق و تمیز برای ${a.fa}. گرید، رنگ و جزئیات.`,
    }),
  ],
  ux: [
    (a) => ({
      en: `UX designer untangling complex flows in ${a.en}. Wireframes first, pixels later.`,
      fa: `طراح تجربه کاربری؛ ساده کردن فلوهای پیچیده در ${a.fa}. اول وایرفریم، بعد پیکسل.`,
    }),
  ],
  uiux: [
    (a, b) => ({
      en: `UI/UX designer working across ${a.en} and ${b.en}. Freelance-friendly, remote-first.`,
      fa: `طراح UI/UX در حوزه ${a.fa} و ${b.fa}. پذیرای پروژه فریلنس و کار ریموت.`,
    }),
  ],
  research: [
    (a) => ({
      en: `Researcher turning messy interviews into clear product decisions. Currently in ${a.en}.`,
      fa: `پژوهشگری که مصاحبه‌های شلوغ را به تصمیم‌های روشن محصول تبدیل می‌کند. فعلاً در حوزه ${a.fa}.`,
    }),
  ],
  system: [
    (a) => ({
      en: `I build and maintain design systems for ${a.en} teams — tokens, components, docs, adoption.`,
      fa: `دیزاین سیستم می‌سازم و نگه می‌دارم برای تیم‌های ${a.fa}؛ توکن، کامپوننت، مستندات و پذیرش.`,
    }),
  ],
  interaction: [
    (a) => ({
      en: `Interaction designer who prototypes everything. Motion, micro-interactions and ${a.en}.`,
      fa: `طراح تعامل که همه‌چیز را پروتوتایپ می‌کند. موشن، میکرواینترکشن و ${a.fa}.`,
    }),
  ],
  writer: [
    (a) => ({
      en: `Writing the words inside ${a.en} products. Microcopy, voice & tone, content design in EN/FA.`,
      fa: `نوشتن کلمات داخل ${a.fa}. میکروکپی، لحن و طراحی محتوا به فارسی و انگلیسی.`,
    }),
  ],
  other: [
    () => ({
      en: 'Design lead turned design educator. Running workshops for Persian-speaking designers.',
      fa: 'از مدیریت طراحی به آموزش طراحی رسیدم. برای طراحان فارسی‌زبان ورکشاپ برگزار می‌کنم.',
    }),
  ],
}

const ROLE_SKILLS: Record<RoleId, SkillId[]> = {
  ui: ['ui', 'responsive', 'prototyping', 'motion', 'systems'],
  ux: ['ux', 'wireframing', 'flow', 'ia', 'testing'],
  uiux: ['ui', 'ux', 'wireframing', 'prototyping', 'responsive'],
  product: ['product', 'ux', 'systems', 'prototyping', 'research'],
  research: ['research', 'testing', 'ia', 'flow', 'ux'],
  system: ['systems', 'a11y', 'ui', 'responsive'],
  interaction: ['prototyping', 'motion', 'ui'],
  writer: ['ux', 'ia', 'flow', 'a11y', 'research'],
  other: ['product', 'graphic'],
}

const ROLE_TOOLS: Record<RoleId, ToolId[]> = {
  ui: ['figma', 'sketch', 'adobexd', 'principle'],
  ux: ['figma', 'miro', 'notion'],
  uiux: ['figma', 'sketch', 'adobexd', 'invision'],
  product: ['figma', 'notion', 'miro', 'ai'],
  research: ['miro', 'notion', 'figma'],
  system: ['figma', 'storybook', 'zeplin'],
  interaction: ['framer', 'principle', 'protopie', 'figma'],
  writer: ['notion', 'figma'],
  other: ['figma', 'webflow', 'canva', 'ai', 'illustrator', 'photoshop'],
}

const ALL_SKILLS: SkillId[] = ['ui', 'ux', 'product', 'graphic', 'research', 'wireframing', 'prototyping', 'systems', 'flow', 'ia', 'responsive', 'a11y', 'testing', 'motion']
const ALL_TOOLS: ToolId[] = [
  'figma', 'sketch', 'adobexd', 'photoshop', 'illustrator', 'aftereffects', 'framer', 'webflow',
  'invision', 'principle', 'protopie', 'miro', 'zeplin', 'notion', 'canva', 'storybook', 'marvel', 'ai',
]

const SENIORITY: { en: string; fa: string }[] = [
  { en: '', fa: '' },
  { en: 'Senior', fa: 'ارشد' },
  { en: 'Senior', fa: 'ارشد' },
  { en: 'Lead', fa: '(لید)' },
  { en: 'Staff', fa: '(استف)' },
  { en: 'Junior', fa: '(جونیور)' },
]

// Weighted role distribution
const ROLE_POOL: RoleId[] = ['product', 'product', 'product', 'product', 'uiux', 'uiux', 'uiux', 'ui', 'ui', 'ux', 'ux', 'research', 'research', 'system', 'system', 'interaction', 'writer', 'other']

// How many demo designers live in each city.
const DISTRIBUTION: Record<string, number> = {
  'tehran-ir': 34, 'shiraz-ir': 7, 'tabriz-ir': 6, 'mashhad-ir': 5, 'isfahan-ir': 6, 'karaj-ir': 3, 'rasht-ir': 2,
  'berlin-de': 14, 'hamburg-de': 6, 'munich-de': 5, 'frankfurt-de': 2,
  'amsterdam-nl': 9, 'rotterdam-nl': 4,
  'toronto-ca': 16, 'vancouver-ca': 9, 'montreal-ca': 6,
  'dubai-ae': 8, 'istanbul-tr': 8, 'london-gb': 10, 'paris-fr': 5, 'stockholm-se': 5,
  'sydney-au': 5, 'melbourne-au': 5,
  'san-francisco-us': 8, 'new-york-us': 8, 'los-angeles-us': 5, 'seattle-us': 3, 'austin-us': 2,
  'vienna-at': 3, 'oslo-no': 2, 'copenhagen-dk': 2, 'lisbon-pt': 2, 'barcelona-es': 2,
  'yerevan-am': 2, 'tbilisi-ge': 2, 'kuala-lumpur-my': 2, 'kabul-af': 2, 'herat-af': 1, 'dushanbe-tj': 1,
  'zurich-ch': 2, 'dublin-ie': 2, 'helsinki-fi': 2, 'doha-qa': 1, 'tokyo-jp': 1, 'auckland-nz': 1,
}

// A few hand-written profiles so the first clicks feel real.
type Featured = Partial<Designer> & { first: string; last: string; cityId: string; role: RoleId; seniority?: number }
const FEATURED: Featured[] = [
  {
    first: 'Sara', last: 'Ahmadi', cityId: 'berlin-de', role: 'product', seniority: 1,
    skills: ['systems', 'research', 'prototyping', 'product'],
    tools: ['figma', 'notion'],
    bio: {
      en: 'Product designer focused on SaaS, design systems and AI products.',
      fa: 'طراح محصول با تمرکز روی محصولات SaaS، دیزاین سیستم و محصولات هوش مصنوعی.',
    },
    verification: 'verified',
    links: { portfolio: 'https://saraahmadi.design', linkedin: 'https://linkedin.com/in/sara-ahmadi' },
  },
  {
    first: 'Ali', last: 'Moradi', cityId: 'toronto-ca', role: 'uiux', seniority: 0,
    skills: ['ui', 'ux', 'wireframing', 'responsive'],
    tools: ['figma', 'webflow'],
    bio: { en: 'UI/UX designer at a Toronto fintech. Previously built banking apps in Tehran.', fa: 'طراح UI/UX در یک فین‌تک در تورنتو. قبلاً اپ‌های بانکی را در تهران طراحی می‌کردم.' },
    verification: 'verified',
  },
  {
    first: 'Niloofar', last: 'Karimi', cityId: 'amsterdam-nl', role: 'research', seniority: 1,
    skills: ['research', 'testing', 'ia', 'flow'],
    tools: ['miro', 'notion', 'figma'],
    bio: { en: 'Mixed-methods researcher in mobility. I run the monthly Persian UX Research circle.', fa: 'پژوهشگر ترکیبی در حوزه حمل‌ونقل. میزبان دورهمی ماهانه پژوهش تجربه کاربری فارسی‌زبان‌ها هستم.' },
    verification: 'verified',
  },
  {
    first: 'Arman', last: 'Hosseini', cityId: 'tehran-ir', role: 'system', seniority: 3,
    skills: ['systems', 'a11y', 'ui', 'responsive'],
    tools: ['figma', 'storybook', 'zeplin'],
    bio: { en: 'Leading the design system at a large Iranian super-app. RTL-first components are my thing.', fa: 'لید دیزاین سیستم در یک سوپراپ ایرانی. کامپوننت‌های راست‌به‌چپ تخصص من است.' },
    verification: 'verified',
  },
  {
    first: 'Mahsa', last: 'Rahimi', cityId: 'london-gb', role: 'interaction', seniority: 1,
    skills: ['prototyping', 'motion'],
    tools: ['framer', 'figma', 'protopie'],
    bio: { en: 'Interaction designer in media & streaming. Motion is how interfaces explain themselves.', fa: 'طراح تعامل در حوزه رسانه و استریم. موشن زبانی است که رابط با آن خودش را توضیح می‌دهد.' },
    verification: 'email',
  },
  {
    first: 'Reza', last: 'Mohammadi', cityId: 'san-francisco-us', role: 'product', seniority: 4,
    skills: ['product', 'prototyping', 'systems', 'research'],
    tools: ['figma', 'ai', 'notion'],
    bio: { en: 'Staff designer working on AI developer tools. Ex-Tehran startup founder.', fa: 'طراح استف روی ابزارهای هوش مصنوعی برای توسعه‌دهندگان. پیش‌تر بنیان‌گذار یک استارتاپ در تهران.' },
    verification: 'verified',
  },
  {
    first: 'Parsa', last: 'Ebrahimi', cityId: 'dubai-ae', role: 'ui', seniority: 0,
    skills: ['ui', 'motion', 'responsive'],
    tools: ['figma', 'adobexd'],
    bio: { en: 'UI designer for e-commerce brands across the Gulf. Bilingual EN/AR/FA interfaces.', fa: 'طراح رابط کاربری برای برندهای فروشگاهی حاشیه خلیج فارس. رابط‌های چندزبانه.' },
    verification: 'email',
  },
  {
    first: 'Negar', last: 'Jalali', cityId: 'stockholm-se', role: 'writer', seniority: 1,
    skills: ['ux', 'ia', 'a11y', 'research'],
    tools: ['notion', 'figma'],
    bio: { en: 'UX writer. Words are interface too. Currently shaping voice & tone for a Nordic bank.', fa: 'نویسنده تجربه کاربری. کلمه‌ها هم رابط کاربری‌اند. فعلاً روی لحن یک بانک اسکاندیناویایی کار می‌کنم.' },
    verification: 'verified',
  },
]

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '-')

const FEMALE = new Set('Sara Niloofar Mahsa Negar Shirin Yasaman Leila Ghazal Mina Roya Tara Elham Setareh Nazanin Parisa Azadeh Hoda Shadi Bahar Donya Maryam Samira Atena Sepideh Golnaz Mahtab Nasim Fatemeh Ladan Yalda Ava Kimia Taraneh Zahra Rozhin'.split(' '))

/**
 * Demo portraits from randomuser.me (free placeholder photos, 100 per gender).
 * Handed out round-robin so neighbours rarely share a face. If they can't load, <Avatar> falls back to initials.
 */
const photoCounter = { women: 0, men: 0 }
function demoPhoto(first: string) {
  const g = FEMALE.has(first) ? 'women' : 'men'
  const i = (photoCounter[g]++ * 37) % 100 // stride so consecutive people get visually different faces
  return `https://randomuser.me/api/portraits/${g}/${i}.jpg`
}

function roleTitle(role: RoleId, sen: number): L10n {
  const r = ROLES.find((x) => x.id === role)!
  const s = SENIORITY[sen]
  if (role === 'other') return { en: s.en ? `${s.en} Designer` : 'Design Educator', fa: s.en ? `طراح ${s.fa}` : 'مدرس طراحی' }
  return { en: [s.en, r.en].filter(Boolean).join(' '), fa: [r.fa, s.fa].filter(Boolean).join(' ') }
}

function generate(): Designer[] {
  const rnd = mulberry32(1404)
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]
  const usedNames = new Set<string>()
  const out: Designer[] = []
  const now = Date.now()
  const DAY = 86400000

  const makeLinks = (first: string, last: string, i: number) => {
    const handle = `${slug(first)}${slug(last)}`
    const links: Designer['links'] = {}
    if (rnd() < 0.85) links.linkedin = `https://linkedin.com/in/${slug(first)}-${slug(last)}`
    const p = rnd()
    links.portfolio = p < 0.35 ? `https://dribbble.com/${handle}` : p < 0.65 ? `https://behance.net/${handle}` : `https://${handle}.design`
    if (rnd() < 0.25) links.website = `https://${slug(first)}${i % 3 === 0 ? '.studio' : '.me'}`
    if (rnd() < 0.45) links.instagram = `${slug(first)}.${slug(last)}`.replace(/-/g, '')
    if (rnd() < 0.35) links.telegram = `${slug(first)}_${slug(last)}`.replace(/-/g, '')
    return links
  }

  FEATURED.forEach((f, i) => {
    usedNames.add(f.first + f.last)
    const fn = FIRST.find((x) => x[0] === f.first)![1]
    const ln = LAST.find((x) => x[0] === f.last)![1]
    out.push({
      id: `d${i + 1}`,
      name: { en: `${f.first} ${f.last}`, fa: `${fn} ${ln}` },
      role: f.role,
      title: roleTitle(f.role, f.seniority ?? 0),
      cityId: f.cityId,
      skills: f.skills!,
      tools: f.tools ?? [],
      bio: f.bio!,
      links: f.links ?? makeLinks(f.first, f.last, i),
      joined: new Date(now - (300 + i * 23) * DAY).toISOString(),
      verification: f.verification ?? 'email',
      avatar: { hue: Math.floor(rnd() * 360), photo: demoPhoto(f.first) },
    })
  })

  const featuredPerCity: Record<string, number> = {}
  FEATURED.forEach((f) => (featuredPerCity[f.cityId] = (featuredPerCity[f.cityId] ?? 0) + 1))

  let n = out.length
  for (const [cityId, count] of Object.entries(DISTRIBUTION)) {
    for (let k = featuredPerCity[cityId] ?? 0; k < count; k++) {
      let first: [string, string], last: [string, string]
      do {
        first = pick(FIRST)
        last = pick(LAST)
      } while (usedNames.has(first[0] + last[0]))
      usedNames.add(first[0] + last[0])

      const role = pick(ROLE_POOL)
      const sen = Math.floor(rnd() * SENIORITY.length)
      const base = [...ROLE_SKILLS[role]].sort(() => rnd() - 0.5)
      const total = 3 + Math.floor(rnd() * 5)
      const skills = new Set<SkillId>(base.slice(0, Math.min(total, base.length)))
      while (skills.size < total) skills.add(pick(ALL_SKILLS))
      const toolBase = [...ROLE_TOOLS[role]].sort(() => rnd() - 0.5)
      const toolTotal = 1 + Math.floor(rnd() * 4)
      const tools = new Set<ToolId>(toolBase.slice(0, Math.min(toolTotal, toolBase.length)))
      if (rnd() < 0.75) tools.add('figma')
      while (tools.size < toolTotal) tools.add(pick(ALL_TOOLS))
      const a = pick(FOCUS)
      let b = pick(FOCUS)
      if (b === a) b = FOCUS[(FOCUS.indexOf(a) + 3) % FOCUS.length]
      // Recent sign-ups are denser so "Recently joined" feels alive.
      const age = Math.floor(Math.pow(rnd(), 1.6) * 600)
      n++
      out.push({
        id: `d${n}`,
        name: { en: `${first[0]} ${last[0]}`, fa: `${first[1]} ${last[1]}` },
        role,
        title: roleTitle(role, sen),
        cityId,
        skills: [...skills].slice(0, 8),
        tools: [...tools].slice(0, 6),
        bio: pick(BIOS[role])(a, b),
        links: makeLinks(first[0], last[0], n),
        joined: new Date(now - age * DAY - Math.floor(rnd() * DAY)).toISOString(),
        verification: rnd() < 0.45 ? 'verified' : 'email',
        avatar: { hue: Math.floor(rnd() * 360), photo: demoPhoto(first[0]) },
      })
    }
  }
  return out
}

export const DEMO_DESIGNERS: Designer[] = generate()
