import type { L10n } from './taxonomy'

export type Country = { code: string; en: string; fa: string; atlas: string; flag: string }
export type City = {
  id: string
  en: string
  fa: string
  country: string // ISO code
  lat: number // approximate city centre — the only location we ever store
  lng: number
}

const C = (code: string, en: string, fa: string, atlas = en): Country => ({
  code,
  en,
  fa,
  atlas,
  flag: String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))),
})

export const COUNTRIES: Country[] = [
  C('IR', 'Iran', 'ایران'),
  C('DE', 'Germany', 'آلمان'),
  C('NL', 'Netherlands', 'هلند'),
  C('CA', 'Canada', 'کانادا'),
  C('AE', 'United Arab Emirates', 'امارات', 'United Arab Emirates'),
  C('TR', 'Türkiye', 'ترکیه', 'Turkey'),
  C('GB', 'United Kingdom', 'بریتانیا'),
  C('FR', 'France', 'فرانسه'),
  C('SE', 'Sweden', 'سوئد'),
  C('AU', 'Australia', 'استرالیا'),
  C('US', 'United States', 'آمریکا', 'United States of America'),
  C('IT', 'Italy', 'ایتالیا'),
  C('ES', 'Spain', 'اسپانیا'),
  C('PT', 'Portugal', 'پرتغال'),
  C('AT', 'Austria', 'اتریش'),
  C('CH', 'Switzerland', 'سوئیس'),
  C('DK', 'Denmark', 'دانمارک'),
  C('NO', 'Norway', 'نروژ'),
  C('FI', 'Finland', 'فنلاند'),
  C('BE', 'Belgium', 'بلژیک'),
  C('IE', 'Ireland', 'ایرلند'),
  C('PL', 'Poland', 'لهستان'),
  C('CZ', 'Czechia', 'چک'),
  C('HU', 'Hungary', 'مجارستان'),
  C('GR', 'Greece', 'یونان'),
  C('AM', 'Armenia', 'ارمنستان'),
  C('GE', 'Georgia', 'گرجستان'),
  C('AZ', 'Azerbaijan', 'جمهوری آذربایجان'),
  C('IQ', 'Iraq', 'عراق'),
  C('QA', 'Qatar', 'قطر'),
  C('OM', 'Oman', 'عمان'),
  C('SA', 'Saudi Arabia', 'عربستان'),
  C('IN', 'India', 'هند'),
  C('MY', 'Malaysia', 'مالزی'),
  C('SG', 'Singapore', 'سنگاپور'),
  C('JP', 'Japan', 'ژاپن'),
  C('KR', 'South Korea', 'کره جنوبی'),
  C('CN', 'China', 'چین'),
  C('AF', 'Afghanistan', 'افغانستان'),
  C('TJ', 'Tajikistan', 'تاجیکستان'),
  C('NZ', 'New Zealand', 'نیوزیلند'),
  C('BR', 'Brazil', 'برزیل'),
  C('MX', 'Mexico', 'مکزیک'),
  C('AR', 'Argentina', 'آرژانتین'),
  C('EE', 'Estonia', 'استونی'),
  C('LU', 'Luxembourg', 'لوکزامبورگ'),
  C('CY', 'Cyprus', 'قبرس'),
  C('UA', 'Ukraine', 'اوکراین'),
  C('ZA', 'South Africa', 'آفریقای جنوبی'),
  C('EG', 'Egypt', 'مصر'),
  C('TH', 'Thailand', 'تایلند'),
  C('ID', 'Indonesia', 'اندونزی'),
  C('LT', 'Lithuania', 'لیتوانی'),
  C('LV', 'Latvia', 'لتونی'),
  C('RO', 'Romania', 'رومانی'),
  C('RS', 'Serbia', 'صربستان'),
  C('KZ', 'Kazakhstan', 'قزاقستان'),
  C('UZ', 'Uzbekistan', 'ازبکستان'),
  C('CL', 'Chile', 'شیلی'),
  C('CO', 'Colombia', 'کلمبیا'),
]

export const countryByCode: Record<string, Country> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]))

// name|countryCode|lat|lng|persian name
const RAW = `Tehran|IR|35.6892|51.389|تهران
Shiraz|IR|29.5918|52.5837|شیراز
Tabriz|IR|38.08|46.2919|تبریز
Mashhad|IR|36.2605|59.6168|مشهد
Isfahan|IR|32.6546|51.668|اصفهان
Karaj|IR|35.8327|50.9915|کرج
Rasht|IR|37.2808|49.5832|رشت
Kerman|IR|30.2839|57.0834|کرمان
Yazd|IR|31.8974|54.3569|یزد
Qom|IR|34.6399|50.8759|قم
Ahvaz|IR|31.3183|48.6706|اهواز
Kermanshah|IR|34.3142|47.065|کرمانشاه
Urmia|IR|37.5527|45.0761|ارومیه
Hamedan|IR|34.7992|48.515|همدان
Sari|IR|36.5633|53.0601|ساری
Gorgan|IR|36.8456|54.4393|گرگان
Kish|IR|26.5578|53.9807|کیش
Bandar Abbas|IR|27.1832|56.2666|بندرعباس
Zanjan|IR|36.6736|48.4787|زنجان
Qazvin|IR|36.2797|50.0049|قزوین
Arak|IR|34.0954|49.7013|اراک
Eslamshahr|IR|35.5449|51.2044|اسلامشهر
Shahriar|IR|35.6597|51.0587|شهریار
Robat Karim|IR|35.4844|51.0836|رباط‌کریم
Varamin|IR|35.3255|51.6452|ورامین
Pakdasht|IR|35.4756|51.6797|پاکدشت
Damavand|IR|35.7178|52.0672|دماوند
Firuzkuh|IR|35.7564|52.7708|فیروزکوه
Rey|IR|35.5768|51.4321|ری
Qods|IR|35.7219|51.1027|قدس
Malard|IR|35.6636|50.9761|ملارد
Pardis|IR|35.7597|51.7911|پردیس
Pishva|IR|35.3062|51.7304|پیشوا
Fardis|IR|35.7267|50.9858|فردیس
Nazarabad|IR|35.9508|50.6108|نظرآباد
Hashtgerd|IR|35.9614|50.6853|هشتگرد
Taleqan|IR|36.1667|50.75|طالقان
Eshtehard|IR|35.7278|50.3547|اشتهارد
Neyshabur|IR|36.2133|58.7958|نیشابور
Sabzevar|IR|36.2126|57.6819|سبزوار
Torbat-e Heydarieh|IR|35.2727|59.219|تربت حیدریه
Torbat-e Jam|IR|35.2438|60.6231|تربت جام
Quchan|IR|37.1057|58.5095|قوچان
Kashmar|IR|35.2378|58.4658|کاشمر
Gonabad|IR|34.3529|58.6836|گناباد
Chenaran|IR|36.6431|59.121|چناران
Fariman|IR|35.7002|59.8511|فریمان
Taybad|IR|34.7422|60.7767|تایباد
Sarakhs|IR|36.5449|61.1577|سرخس
Bardaskan|IR|35.2589|57.9877|بردسکن
Khaf|IR|34.5644|60.1489|خواف
Dargaz|IR|37.4406|59.1075|درگز
Birjand|IR|32.8649|59.2262|بیرجند
Qaen|IR|33.7267|59.1808|قائن
Ferdows|IR|34.0217|58.1683|فردوس
Nehbandan|IR|31.5372|60.0489|نهبندان
Tabas|IR|33.5959|56.9236|طبس
Sarayan|IR|33.8577|58.5236|سرایان
Sarbisheh|IR|32.5686|59.7772|سربیشه
Boshrooyeh|IR|33.8564|57.4288|بشرویه
Bojnord|IR|37.4747|57.3291|بجنورد
Shirvan|IR|37.4066|57.9294|شیروان
Esfarayen|IR|37.0765|57.5107|اسفراین
Jajarm|IR|36.9572|56.3833|جاجرم
Faruj|IR|37.2306|58.2178|فاروج
Kashan|IR|33.985|51.4364|کاشان
Najafabad|IR|32.6345|51.3668|نجف‌آباد
Khomeyni Shahr|IR|32.7017|51.5164|خمینی‌شهر
Shahreza|IR|32.0089|51.8676|شهرضا
Falavarjan|IR|32.5822|51.5|فلاورجان
Golpayegan|IR|33.4614|50.2908|گلپایگان
Naein|IR|32.8595|53.0918|نایین
Ardestan|IR|33.3761|52.3728|اردستان
Semirom|IR|31.4167|51.5667|سمیرم
Mobarakeh|IR|32.35|51.5|مبارکه
Fereydunshahr|IR|32.9333|50.1167|فریدون‌شهر
Natanz|IR|33.5124|51.9155|نطنز
Khansar|IR|33.2647|50.3181|خوانسار
Marvdasht|IR|29.8733|52.8078|مرودشت
Kazerun|IR|29.6194|51.6539|کازرون
Jahrom|IR|28.5|53.5601|جهرم
Fasa|IR|28.9383|53.6467|فسا
Lar|IR|27.6783|54.3376|لار
Firuzabad|IR|28.8474|52.5686|فیروزآباد
Darab|IR|28.75|54.5464|داراب
Estahban|IR|29.1315|54.0367|استهبان
Abadeh|IR|31.1611|52.6556|آباده
Neyriz|IR|29.1958|54.3306|نی‌ریز
Eqlid|IR|30.8996|52.6884|اقلید
Sepidan|IR|30.2667|51.9667|سپیدان
Mamasani|IR|30.05|51.6|ممسنی
Abadan|IR|30.3392|48.3043|آبادان
Khorramshahr|IR|30.4344|48.1789|خرمشهر
Dezful|IR|32.3814|48.4058|دزفول
Andimeshk|IR|32.4611|48.3583|اندیمشک
Shush|IR|32.1942|48.2436|شوش
Shushtar|IR|32.0447|48.8556|شوشتر
Behbahan|IR|30.5959|50.2417|بهبهان
Masjed Soleyman|IR|31.9364|49.3039|مسجدسلیمان
Ramhormoz|IR|31.2803|49.6042|رامهرمز
Izeh|IR|31.8319|49.8664|ایذه
Bandar Mahshahr|IR|30.5589|49.1972|بندر ماهشهر
Susangerd|IR|31.5614|48.1844|سوسنگرد
Omidiyeh|IR|30.75|49.5333|امیدیه
Baghmalek|IR|31.5333|49.85|باغ‌ملک
Rafsanjan|IR|30.4067|55.9939|رفسنجان
Sirjan|IR|29.4519|55.6814|سیرجان
Jiroft|IR|28.6753|57.7256|جیرفت
Bam|IR|29.106|58.357|بم
Zarand|IR|30.8123|56.5636|زرند
Bardsir|IR|29.9333|56.5833|بردسیر
Shahr-e Babak|IR|30.1189|55.1189|شهربابک
Kahnooj|IR|27.9531|57.7133|کهنوج
Baft|IR|29.2333|56.6|بافت
Meybod|IR|32.25|54.0167|میبد
Ardakan|IR|32.31|54.0175|اردکان
Bafgh|IR|31.6|55.4|بافق
Abarkuh|IR|31.1333|53.2833|ابرکوه
Mehriz|IR|31.5833|54.4333|مهریز
Taft|IR|31.75|54.2|تفت
Bandar-e Anzali|IR|37.4739|49.4614|بندر انزلی
Lahijan|IR|37.2078|50.0089|لاهیجان
Langarud|IR|37.2003|50.1517|لنگرود
Astara|IR|38.4257|48.8697|آستارا
Talesh|IR|37.7911|48.9114|تالش
Rudsar|IR|37.1364|50.2864|رودسر
Fuman|IR|37.2249|49.3122|فومن
Astaneh-ye Ashrafiyeh|IR|37.2633|49.9481|آستانه اشرفیه
Rudbar|IR|36.8175|49.4258|رودبار
Sowme'eh Sara|IR|37.3186|49.3236|صومعه‌سرا
Masal|IR|37.35|49.0167|ماسال
Shaft|IR|37.15|49.2833|شفت
Babol|IR|36.5513|52.6786|بابل
Amol|IR|36.4696|52.3512|آمل
Qaem Shahr|IR|36.4598|52.8583|قائم‌شهر
Behshahr|IR|36.6928|53.5497|بهشهر
Chalus|IR|36.6564|51.4189|چالوس
Nowshahr|IR|36.6503|51.4964|نوشهر
Ramsar|IR|36.9042|50.6608|رامسر
Tonekabon|IR|36.8189|50.8747|تنکابن
Babolsar|IR|36.6989|52.6511|بابلسر
Neka|IR|36.65|53.2989|نکا
Fereydunkenar|IR|36.6919|52.5222|فریدونکنار
Juybar|IR|36.6383|52.9083|جویبار
Savadkuh|IR|36.1|53.0833|سوادکوه
Gonbad-e Kavus|IR|37.25|55.1667|گنبد کاووس
Aliabad-e Katul|IR|36.9|54.8667|علی‌آباد کتول
Bandar-e Torkaman|IR|36.9|54.0833|بندر ترکمن
Kordkuy|IR|36.7667|54.1|کردکوی
Azadshahr|IR|37.0947|55.1739|آزادشهر
Minoodasht|IR|37.2|55.4667|مینودشت
Ramian|IR|37.0333|55.15|رامیان
Kalaleh|IR|37.3833|55.5|کلاله
Ardabil|IR|38.2498|48.2933|اردبیل
Meshgin Shahr|IR|38.3833|47.6833|مشگین‌شهر
Khalkhal|IR|37.6217|48.5342|خلخال
Germi|IR|38.5333|48.05|گرمی
Parsabad|IR|39.6497|47.9186|پارس‌آباد
Bilasavar|IR|39.4419|48.0619|بیله‌سوار
Namin|IR|38.4167|48.4833|نمین
Nir|IR|38.0333|47.9833|نیر
Maragheh|IR|37.3931|46.2397|مراغه
Marand|IR|38.4322|45.7717|مرند
Mianeh|IR|37.4256|47.7128|میانه
Ahar|IR|38.4783|47.0736|اهر
Bonab|IR|37.3333|46.05|بناب
Sarab|IR|37.9414|47.5364|سراب
Shabestar|IR|38.1917|45.7222|شبستر
Jolfa|IR|38.9333|45.6333|جلفا
Osku|IR|37.9333|46.1|اسکو
Khoy|IR|38.55|44.9522|خوی
Salmas|IR|38.1961|44.7656|سلماس
Mahabad|IR|36.7628|45.7219|مهاباد
Miandoab|IR|36.9689|46.1058|میاندوآب
Bukan|IR|36.5228|46.2072|بوکان
Naqadeh|IR|36.9553|45.3856|نقده
Piranshahr|IR|36.7|45.15|پیرانشهر
Sardasht|IR|36.1594|45.4839|سردشت
Poldasht|IR|39.35|45.05|پلدشت
Chaldoran|IR|39.05|44.3|چالدران
Abhar|IR|36.15|49.2167|ابهر
Khorramdarreh|IR|36.2|49.1833|خرمدره
Mahneshan|IR|36.7333|47.9667|ماه‌نشان
Tarom|IR|36.8|48.9|طارم
Khodabandeh|IR|36.1|48.5833|خدابنده
Takestan|IR|36.0667|49.7|تاکستان
Abyek|IR|36.05|50.5333|آبیک
Malayer|IR|34.2967|48.8194|ملایر
Nahavand|IR|34.19|48.3739|نهاوند
Tuyserkan|IR|34.55|48.4667|تویسرکان
Asadabad|IR|34.7833|48.1167|اسدآباد
Bahar|IR|34.9|48.4419|بهار
Kabudarahang|IR|35.2167|48.7333|کبودراهنگ
Razan|IR|35.3833|49.05|رزن
Islamabad-e Gharb|IR|34.1167|46.5333|اسلام‌آباد غرب
Sonqor|IR|34.7869|47.6014|سنقر
Sarpol-e Zahab|IR|34.4589|45.8583|سرپل ذهاب
Kangavar|IR|34.5044|47.9664|کنگاور
Harsin|IR|34.2667|47.5833|هرسین
Paveh|IR|35.0483|46.3567|پاوه
Javanrud|IR|34.8067|46.4886|جوانرود
Qasr-e Shirin|IR|34.5147|45.5789|قصرشیرین
Ravansar|IR|34.7167|46.65|روانسر
Khorramabad|IR|33.4878|48.3558|خرم‌آباد
Borujerd|IR|33.8972|48.7517|بروجرد
Dorud|IR|33.4919|49.0611|دورود
Aligudarz|IR|33.4008|49.6944|الیگودرز
Kuhdasht|IR|33.5333|47.6167|کوهدشت
Azna|IR|33.45|49.4333|ازنا
Ilam|IR|33.6374|46.4227|ایلام
Dehloran|IR|32.6941|47.2679|دهلران
Abdanan|IR|32.9928|47.4192|آبدانان
Ivan|IR|33.8|46.3|ایوان
Mehran|IR|33.1222|46.1652|مهران
Darrehshahr|IR|33.15|47.3833|دره‌شهر
Shahrekord|IR|32.3256|50.8644|شهرکرد
Borujen|IR|31.9683|51.2989|بروجن
Farsan|IR|32.2833|50.5667|فارسان
Lordegan|IR|31.5081|50.8286|لردگان
Ardal|IR|32.3167|50.6833|اردل
Yasuj|IR|30.6682|51.5881|یاسوج
Dehdasht|IR|30.7803|50.5697|دهدشت
Gachsaran|IR|30.3586|50.7981|گچساران
Choram|IR|30.65|50.8333|چرام
Bushehr|IR|28.9684|50.8385|بوشهر
Borazjan|IR|29.2667|51.2167|برازجان
Genaveh|IR|29.5811|50.5178|گناوه
Kangan|IR|27.8386|52.0644|کنگان
Deylam|IR|30.05|50.2|دیلم
Asaluyeh|IR|27.4767|52.6103|عسلویه
Khormoj|IR|28.8664|51.3742|خورموج
Ahram|IR|28.85|51.15|اهرم
Minab|IR|27.1467|57.0801|میناب
Bandar Lengeh|IR|26.5581|54.8817|بندر لنگه
Qeshm|IR|26.9581|56.2719|قشم
Bastak|IR|27.2|54.3667|بستک
Jask|IR|25.6383|57.7742|جاسک
Sirik|IR|26.4547|57.0847|بندر سیریک
Haji Abad|IR|27.4167|55.9|حاجی‌آباد
Rudan|IR|27.4667|57.1667|رودان
Parsian|IR|27.75|52.9|پارسیان
Bandar Khamir|IR|26.9333|55.5833|بندر خمیر
Zahedan|IR|29.4963|60.8629|زاهدان
Zabol|IR|31.0298|61.5006|زابل
Chabahar|IR|25.2919|60.643|چابهار
Iranshahr|IR|27.2025|60.6848|ایرانشهر
Khash|IR|28.2211|61.2158|خاش
Saravan|IR|27.3833|62.3333|سراوان
Nikshahr|IR|26.2231|60.2153|نیک‌شهر
Konarak|IR|25.3597|60.3969|کنارک
Sarbaz|IR|26.65|61.2|سرباز
Semnan|IR|35.5729|53.3971|سمنان
Shahrud|IR|36.4182|54.9763|شاهرود
Damghan|IR|36.1683|54.348|دامغان
Garmsar|IR|35.2229|52.3401|گرمسار
Mahdishahr|IR|35.6833|53.35|مهدی‌شهر
Sorkheh|IR|35.4667|53.2|سرخه
Saveh|IR|35.0213|50.3566|ساوه
Khomein|IR|33.6392|50.0781|خمین
Mahallat|IR|33.9075|50.4661|محلات
Tafresh|IR|34.6919|50.0083|تفرش
Delijan|IR|33.9908|50.6839|دلیجان
Ashtian|IR|34.5333|50.0|آشتیان
Komijan|IR|34.7167|49.3167|کمیجان
Shazand|IR|33.9236|49.4067|شازند
Berlin|DE|52.52|13.405|برلین
Hamburg|DE|53.5511|9.9937|هامبورگ
Munich|DE|48.1351|11.582|مونیخ
Frankfurt|DE|50.1109|8.6821|فرانکفورت
Cologne|DE|50.9375|6.9603|کلن
Düsseldorf|DE|51.2277|6.7735|دوسلدورف
Stuttgart|DE|48.7758|9.1829|اشتوتگارت
Leipzig|DE|51.3397|12.3731|لایپزیگ
Hanover|DE|52.3759|9.732|هانوفر
Dortmund|DE|51.5136|7.4653|دورتموند
Bremen|DE|53.0793|8.8017|برمن
Amsterdam|NL|52.3676|4.9041|آمستردام
Rotterdam|NL|51.9244|4.4777|روتردام
The Hague|NL|52.0705|4.3007|لاهه
Utrecht|NL|52.0907|5.1214|اوترخت
Eindhoven|NL|51.4416|5.4697|آیندهوون
Groningen|NL|53.2194|6.5665|خرونینگن
Toronto|CA|43.6532|-79.3832|تورنتو
Vancouver|CA|49.2827|-123.1207|ونکوور
Montreal|CA|45.5017|-73.5673|مونترال
Ottawa|CA|45.4215|-75.6972|اتاوا
Calgary|CA|51.0447|-114.0719|کلگری
Edmonton|CA|53.5461|-113.4938|ادمونتون
Waterloo|CA|43.4643|-80.5204|واترلو
Richmond Hill|CA|43.8828|-79.4403|ریچموند هیل
North Vancouver|CA|49.32|-123.0724|نورث ونکوور
Halifax|CA|44.6488|-63.5752|هلیفکس
Winnipeg|CA|49.8951|-97.1384|وینیپگ
Dubai|AE|25.2048|55.2708|دبی
Abu Dhabi|AE|24.4539|54.3773|ابوظبی
Sharjah|AE|25.3463|55.4209|شارجه
Istanbul|TR|41.0082|28.9784|استانبول
Ankara|TR|39.9334|32.8597|آنکارا
Izmir|TR|38.4237|27.1428|ازمیر
Antalya|TR|36.8969|30.7133|آنتالیا
Van|TR|38.5012|43.373|وان
London|GB|51.5074|-0.1278|لندن
Manchester|GB|53.4808|-2.2426|منچستر
Birmingham|GB|52.4862|-1.8904|بیرمنگام
Edinburgh|GB|55.9533|-3.1883|ادینبرو
Glasgow|GB|55.8642|-4.2518|گلاسگو
Bristol|GB|51.4545|-2.5879|بریستول
Cambridge|GB|52.2053|0.1218|کمبریج
Oxford|GB|51.752|-1.2577|آکسفورد
Leeds|GB|53.8008|-1.5491|لیدز
Paris|FR|48.8566|2.3522|پاریس
Lyon|FR|45.764|4.8357|لیون
Marseille|FR|43.2965|5.3698|مارسی
Toulouse|FR|43.6047|1.4442|تولوز
Bordeaux|FR|44.8378|-0.5792|بوردو
Nice|FR|43.7102|7.262|نیس
Stockholm|SE|59.3293|18.0686|استکهلم
Gothenburg|SE|57.7089|11.9746|گوتنبرگ
Malmö|SE|55.605|13.0038|مالمو
Uppsala|SE|59.8586|17.6389|اوپسالا
Sydney|AU|-33.8688|151.2093|سیدنی
Melbourne|AU|-37.8136|144.9631|ملبورن
Brisbane|AU|-27.4698|153.0251|بریزبن
Perth|AU|-31.9505|115.8605|پرت
Adelaide|AU|-34.9285|138.6007|آدلاید
Canberra|AU|-35.2809|149.13|کانبرا
San Francisco|US|37.7749|-122.4194|سان‌فرانسیسکو
New York|US|40.7128|-74.006|نیویورک
Los Angeles|US|34.0522|-118.2437|لس‌آنجلس
Seattle|US|47.6062|-122.3321|سیاتل
Austin|US|30.2672|-97.7431|آستین
Boston|US|42.3601|-71.0589|بوستون
Chicago|US|41.8781|-87.6298|شیکاگو
Washington|US|38.9072|-77.0369|واشنگتن
San Jose|US|37.3382|-121.8863|سن‌خوزه
San Diego|US|32.7157|-117.1611|سن‌دیگو
Irvine|US|33.6846|-117.8265|اروایــن
Torrance|US|33.8358|-118.3406|تورنس
Houston|US|29.7604|-95.3698|هیوستون
Dallas|US|32.7767|-96.797|دالاس
Atlanta|US|33.749|-84.388|آتلانتا
Miami|US|25.7617|-80.1918|میامی
Denver|US|39.7392|-104.9903|دنور
Portland|US|45.5152|-122.6784|پورتلند
Philadelphia|US|39.9526|-75.1652|فیلادلفیا
Brooklyn|US|40.6782|-73.9442|بروکلین
Oakland|US|37.8044|-122.2712|اوکلند
Palo Alto|US|37.4419|-122.143|پالو آلتو
Mountain View|US|37.3861|-122.0839|مانتین ویو
Minneapolis|US|44.9778|-93.265|مینیاپولیس
Phoenix|US|33.4484|-112.074|فینیکس
Toronto (Ohio)|US|40.4642|-80.6009|تورنتو (اوهایو)
Torino|IT|45.0703|7.6869|تورین
Milan|IT|45.4642|9.19|میلان
Rome|IT|41.9028|12.4964|رم
Bologna|IT|44.4949|11.3426|بولونیا
Florence|IT|43.7696|11.2558|فلورانس
Naples|IT|40.8518|14.2681|ناپل
Padua|IT|45.4064|11.8768|پادوا
Madrid|ES|40.4168|-3.7038|مادرید
Barcelona|ES|41.3874|2.1686|بارسلونا
Valencia|ES|39.4699|-0.3763|والنسیا
Málaga|ES|36.7213|-4.4214|مالاگا
Seville|ES|37.3891|-5.9845|سویل
Torrevieja|ES|37.9787|-0.6822|تورِویخا
Lisbon|PT|38.7223|-9.1393|لیسبون
Porto|PT|41.1579|-8.6291|پورتو
Vienna|AT|48.2082|16.3738|وین
Graz|AT|47.0707|15.4395|گراتس
Salzburg|AT|47.8095|13.055|سالزبورگ
Zurich|CH|47.3769|8.5417|زوریخ
Geneva|CH|46.2044|6.1432|ژنو
Basel|CH|47.5596|7.5886|بازل
Lausanne|CH|46.5197|6.6323|لوزان
Copenhagen|DK|55.6761|12.5683|کپنهاگ
Aarhus|DK|56.1629|10.2039|آرهوس
Oslo|NO|59.9139|10.7522|اسلو
Bergen|NO|60.3913|5.3221|برگن
Trondheim|NO|63.4305|10.3951|تروندهایم
Helsinki|FI|60.1699|24.9384|هلسینکی
Espoo|FI|60.2055|24.6559|اسپو
Tampere|FI|61.4978|23.761|تامپره
Brussels|BE|50.8503|4.3517|بروکسل
Antwerp|BE|51.2194|4.4025|آنتورپ
Ghent|BE|51.0543|3.7174|گنت
Dublin|IE|53.3498|-6.2603|دوبلین
Cork|IE|51.8985|-8.4756|کورک
Warsaw|PL|52.2297|21.0122|ورشو
Kraków|PL|50.0647|19.945|کراکوف
Wrocław|PL|51.1079|17.0385|وروتسواف
Prague|CZ|50.0755|14.4378|پراگ
Brno|CZ|49.1951|16.6068|برنو
Budapest|HU|47.4979|19.0402|بوداپست
Athens|GR|37.9838|23.7275|آتن
Thessaloniki|GR|40.6401|22.9444|تسالونیکی
Yerevan|AM|40.1792|44.4991|ایروان
Tbilisi|GE|41.7151|44.8271|تفلیس
Batumi|GE|41.6168|41.6367|باتومی
Baku|AZ|40.4093|49.8671|باکو
Erbil|IQ|36.1901|44.0091|اربیل
Sulaymaniyah|IQ|35.5613|45.4302|سلیمانیه
Baghdad|IQ|33.3152|44.3661|بغداد
Najaf|IQ|31.9958|44.3107|نجف
Karbala|IQ|32.616|44.0249|کربلا
Basra|IQ|30.5085|47.7804|بصره
Mosul|IQ|36.335|43.1189|موصل
Kirkuk|IQ|35.4681|44.3922|کرکوک
Nasiriyah|IQ|31.0439|46.2586|ناصریه
Diwaniyah|IQ|31.9889|44.9247|دیوانیه
Kut|IQ|32.5122|45.8181|کوت
Amarah|IQ|31.8352|47.1442|عماره
Fallujah|IQ|33.3489|43.7867|فلوجه
Ramadi|IQ|33.4197|43.3049|رمادی
Samarra|IQ|34.1983|43.8742|سامرا
Duhok|IQ|36.8617|42.9922|دهوک
Doha|QA|25.2854|51.531|دوحه
Muscat|OM|23.588|58.3829|مسقط
Riyadh|SA|24.7136|46.6753|ریاض
Jeddah|SA|21.4858|39.1925|جده
Bangalore|IN|12.9716|77.5946|بنگلور
Mumbai|IN|19.076|72.8777|بمبئی
New Delhi|IN|28.6139|77.209|دهلی نو
Kuala Lumpur|MY|3.139|101.6869|کوالالامپور
Penang|MY|5.4164|100.3327|پنانگ
Singapore|SG|1.3521|103.8198|سنگاپور
Tokyo|JP|35.6762|139.6503|توکیو
Osaka|JP|34.6937|135.5023|اوساکا
Seoul|KR|37.5665|126.978|سئول
Shanghai|CN|31.2304|121.4737|شانگهای
Beijing|CN|39.9042|116.4074|پکن
Shenzhen|CN|22.5431|114.0579|شنژن
Hong Kong|CN|22.3193|114.1694|هنگ‌کنگ
Kabul|AF|34.5553|69.2075|کابل
Herat|AF|34.3529|62.204|هرات
Mazar-i-Sharif|AF|36.709|67.1109|مزار شریف
Dushanbe|TJ|38.5598|68.787|دوشنبه
Khujand|TJ|40.2826|69.6224|خجند
Auckland|NZ|-36.8485|174.7633|اوکلند (نیوزیلند)
Wellington|NZ|-41.2865|174.7762|ولینگتون
Christchurch|NZ|-43.532|172.6306|کرایست‌چرچ
São Paulo|BR|-23.5505|-46.6333|سائوپائولو
Rio de Janeiro|BR|-22.9068|-43.1729|ریودوژانیرو
Mexico City|MX|19.4326|-99.1332|مکزیکوسیتی
Buenos Aires|AR|-34.6037|-58.3816|بوئنوس آیرس
Tallinn|EE|59.437|24.7536|تالین
Tartu|EE|58.378|26.729|تارتو
Luxembourg|LU|49.6116|6.1319|لوکزامبورگ
Limassol|CY|34.7071|33.0226|لیماسول
Nicosia|CY|35.1856|33.3823|نیکوزیا
Kyiv|UA|50.4501|30.5234|کی‌یف
Cape Town|ZA|-33.9249|18.4241|کیپ‌تاون
Johannesburg|ZA|-26.2041|28.0473|ژوهانسبورگ
Cairo|EG|30.0444|31.2357|قاهره
Bangkok|TH|13.7563|100.5018|بانکوک
Chiang Mai|TH|18.7883|98.9853|چیانگ‌مای
Bali|ID|-8.4095|115.1889|بالی
Jakarta|ID|-6.2088|106.8456|جاکارتا
Vilnius|LT|54.6872|25.2797|ویلنیوس
Riga|LV|56.9496|24.1052|ریگا
Bucharest|RO|44.4268|26.1025|بخارست
Belgrade|RS|44.7866|20.4489|بلگراد
Almaty|KZ|43.222|76.8512|آلماتی
Tashkent|UZ|41.2995|69.2401|تاشکند
Samarkand|UZ|39.6542|66.9597|سمرقند
Santiago|CL|-33.4489|-70.6693|سانتیاگو
Bogotá|CO|4.711|-74.0721|بوگوتا
Medellín|CO|6.2442|-75.5812|مدلین`

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const CITIES: City[] = RAW.split('\n').map((line) => {
  const [en, country, lat, lng, fa] = line.split('|')
  return { id: `${slug(en)}-${country.toLowerCase()}`, en, fa: fa.replace(/ـ/g, ''), country, lat: +lat, lng: +lng }
})

export const cityById: Record<string, City> = Object.fromEntries(CITIES.map((c) => [c.id, c]))

export const cityName = (c: City, l: keyof L10n) => c[l]
export const countryName = (code: string, l: keyof L10n) => countryByCode[code]?.[l] ?? code

/** Normalise for forgiving matching: strip accents, lower-case, unify Persian/Arabic letters. */
export const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ًͯ-ٟ‌]/g, '')
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[آأإ]/g, 'ا')
    .trim()

/** City autocomplete: prefix matches on city names rank first, then word-prefix, then country, then substring. */
export function searchCities(query: string, limit = 6): City[] {
  const q = norm(query)
  if (!q) return []
  const scored: { c: City; s: number }[] = []
  for (const c of CITIES) {
    const en = norm(c.en)
    const fa = norm(c.fa)
    const country = countryByCode[c.country]
    const cn = norm(country?.en ?? '') + ' ' + norm(country?.fa ?? '')
    let s = 0
    if (en === q || fa === q) s = 100
    else if (en.startsWith(q) || fa.startsWith(q)) s = 80 - en.length / 10
    else if (en.split(/[\s-]/).some((w) => w.startsWith(q)) || fa.split(/\s/).some((w) => w.startsWith(q))) s = 60
    else if (q.length >= 3 && cn.includes(q)) s = 30
    else if (q.length >= 3 && (en.includes(q) || fa.includes(q))) s = 20
    if (s) scored.push({ c, s })
  }
  return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.c)
}
