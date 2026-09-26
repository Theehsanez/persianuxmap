export type Locale = 'en' | 'fa'
export type L10n = { en: string; fa: string }

export const ROLES = [
  { id: 'ui', en: 'UI Designer', fa: 'طراح رابط کاربری' },
  { id: 'ux', en: 'UX Designer', fa: 'طراح تجربه کاربری' },
  { id: 'uiux', en: 'UI/UX Designer', fa: 'طراح UI/UX' },
  { id: 'product', en: 'Product Designer', fa: 'طراح محصول' },
  { id: 'research', en: 'UX Researcher', fa: 'پژوهشگر تجربه کاربری' },
  { id: 'system', en: 'Design System Designer', fa: 'طراح دیزاین سیستم' },
  { id: 'interaction', en: 'Interaction Designer', fa: 'طراح تعامل' },
  { id: 'writer', en: 'UX Writer', fa: 'نویسنده تجربه کاربری' },
  { id: 'other', en: 'Other', fa: 'سایر' },
] as const

export type RoleId = (typeof ROLES)[number]['id']

/** Abstract design skills — not tied to a specific piece of software. See TOOLS for that. */
export const SKILLS = [
  { id: 'ui', en: 'UI Design', fa: 'طراحی رابط کاربری' },
  { id: 'ux', en: 'UX Design', fa: 'طراحی تجربه کاربری' },
  { id: 'product', en: 'Product Design', fa: 'طراحی محصول' },
  { id: 'graphic', en: 'Graphic Design', fa: 'طراحی گرافیک' },
  { id: 'research', en: 'UX Research', fa: 'پژوهش تجربه کاربری' },
  { id: 'wireframing', en: 'Wireframing', fa: 'وایرفریم' },
  { id: 'prototyping', en: 'Prototyping', fa: 'نمونه‌سازی' },
  { id: 'systems', en: 'Design Systems', fa: 'دیزاین سیستم' },
  { id: 'flow', en: 'User Flow', fa: 'یوزر فلو' },
  { id: 'ia', en: 'Information Architecture', fa: 'معماری اطلاعات' },
  { id: 'responsive', en: 'Responsive Design', fa: 'طراحی واکنش‌گرا' },
  { id: 'a11y', en: 'Accessibility', fa: 'دسترس‌پذیری' },
  { id: 'testing', en: 'Usability Testing', fa: 'تست کاربردپذیری' },
  { id: 'motion', en: 'Motion Design', fa: 'موشن دیزاین' },
] as const

export type SkillId = (typeof SKILLS)[number]['id']

/** The actual software a designer works in — shown with its own logo, separate from abstract skills. */
export const TOOLS = [
  { id: 'figma', en: 'Figma', fa: 'فیگما' },
  { id: 'sketch', en: 'Sketch', fa: 'اسکچ' },
  { id: 'adobexd', en: 'Adobe XD', fa: 'ادوبی ایکس‌دی' },
  { id: 'photoshop', en: 'Photoshop', fa: 'فتوشاپ' },
  { id: 'illustrator', en: 'Illustrator', fa: 'ایلوستریتور' },
  { id: 'aftereffects', en: 'After Effects', fa: 'افترافکتس' },
  { id: 'framer', en: 'Framer', fa: 'فریمر' },
  { id: 'webflow', en: 'Webflow', fa: 'وب‌فلو' },
  { id: 'invision', en: 'InVision', fa: 'این‌ویژن' },
  { id: 'principle', en: 'Principle', fa: 'پرینسیپل' },
  { id: 'protopie', en: 'ProtoPie', fa: 'پروتوپای' },
  { id: 'miro', en: 'Miro', fa: 'میرو' },
  { id: 'zeplin', en: 'Zeplin', fa: 'زپلین' },
  { id: 'notion', en: 'Notion', fa: 'نوشن' },
  { id: 'canva', en: 'Canva', fa: 'کانوا' },
  { id: 'storybook', en: 'Storybook', fa: 'استوری‌بوک' },
  { id: 'marvel', en: 'Marvel', fa: 'مارول' },
  { id: 'ai', en: 'AI Design Tools', fa: 'ابزارهای طراحی با هوش مصنوعی' },
] as const

export type ToolId = (typeof TOOLS)[number]['id']

export const roleById = Object.fromEntries(ROLES.map((r) => [r.id, r])) as Record<RoleId, (typeof ROLES)[number]>
export const skillById = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<SkillId, (typeof SKILLS)[number]>
export const toolById = Object.fromEntries(TOOLS.map((t) => [t.id, t])) as Record<ToolId, (typeof TOOLS)[number]>

export const MIN_SKILLS = 3
export const MAX_SKILLS = 8
export const MAX_TOOLS = 10
