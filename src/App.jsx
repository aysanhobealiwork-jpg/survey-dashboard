import { useEffect, useMemo, useState, useRef } from "react";
import Papa from "papaparse";
import {
  AlertTriangle, Circle, TrendingDown, TrendingUp, MessageCircle, Building2, ShieldCheck,
  Filter, ChevronDown, Search, Sun, Moon, Languages,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const SHEET_CITIES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZUqnpDkpLFZOzW-ugkrc11ZtcLMt6AM4ea7ExhBIKPF6TAMKBwExkbs8Hf_JaRhoWtIukhfMz0Fq/pub?gid=0&single=true&output=csv";
const SHEET_TAGS_BY_CITY_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZUqnpDkpLFZOzW-ugkrc11ZtcLMt6AM4ea7ExhBIKPF6TAMKBwExkbs8Hf_JaRhoWtIukhfMz0Fq/pub?gid=1012171845&single=true&output=csv";
const SHEET_CATEGORIES_BY_CITY_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZUqnpDkpLFZOzW-ugkrc11ZtcLMt6AM4ea7ExhBIKPF6TAMKBwExkbs8Hf_JaRhoWtIukhfMz0Fq/pub?gid=1153249344&single=true&output=csv";
const SHEET_COMMENTS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZUqnpDkpLFZOzW-ugkrc11ZtcLMt6AM4ea7ExhBIKPF6TAMKBwExkbs8Hf_JaRhoWtIukhfMz0Fq/pub?gid=1000952147&single=true&output=csv";
const SHEET_DAILY_BY_CITY_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZUqnpDkpLFZOzW-ugkrc11ZtcLMt6AM4ea7ExhBIKPF6TAMKBwExkbs8Hf_JaRhoWtIukhfMz0Fq/pub?gid=1628769736&single=true&output=csv";
const SHEET_DAILY_ISSUES_BY_CITY_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZUqnpDkpLFZOzW-ugkrc11ZtcLMt6AM4ea7ExhBIKPF6TAMKBwExkbs8Hf_JaRhoWtIukhfMz0Fq/pub?gid=1058088689&single=true&output=csv";

const CATEGORY_COLORS = {
  "عملکرد رستوران": "bg-rose-400", "دلیوری": "bg-pink-400", "پشتیبانی": "bg-violet-400",
  "عملکرد پلتفرم": "bg-amber-400", "پیدا نکردن رستوران موردنظر": "bg-emerald-400",
};
const ISSUE_LINE_COLORS = ["#ec4899", "#f43f5e", "#f59e0b", "#8b5cf6", "#10b981"];
const MONTHS = { fa: ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"], en: ["Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar", "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand"] };
const YEARS = Array.from({ length: 11 }, (_, i) => 1395 + i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const MIN_REVIEWS_OPTIONS = [
  { value: 0, fa: "همه", en: "All" }, { value: 50, fa: "≥ ۵۰ نظر", en: "≥ 50 reviews" },
  { value: 100, fa: "≥ ۱۰۰ نظر", en: "≥ 100 reviews" }, { value: 200, fa: "≥ ۲۰۰ نظر", en: "≥ 200 reviews" },
  { value: 500, fa: "≥ ۵۰۰ نظر", en: "≥ 500 reviews" }, { value: 1000, fa: "≥ ۱۰۰۰ نظر", en: "≥ 1000 reviews" },
];

const CITY_TIER_MAP = {
  "تهران": 0, "اصفهان": 1, "تبریز": 1, "کرج": 1, "مشهد": 1, "شیراز": 1, "اهواز": 1, "قم": 1,
  "رشت": 2, "ارومیه": 2, "همدان": 2, "قزوین": 2, "کرمانشاه": 2, "بوشهر": 2, "کرمان": 2,
  "بندرعباس": 2, "اراک": 2, "یزد": 2, "شهر ری": 2, "اردبیل": 2, "ساری": 2, "سنندج": 2,
  "گرگان": 2, "اسلامشهر": 2, "خرم آباد": 2, "زاهدان": 2, "زنجان": 2,
};
function getOfficialTier(cityName) { return CITY_TIER_MAP[cityName] ?? 3; }

const CITY_EN = {
  "تهران": "Tehran", "مشهد": "Mashhad", "اصفهان": "Isfahan", "کرج": "Karaj", "شیراز": "Shiraz",
  "تبریز": "Tabriz", "قم": "Qom", "اهواز": "Ahvaz", "کرمانشاه": "Kermanshah", "ارومیه": "Urmia",
  "رشت": "Rasht", "زاهدان": "Zahedan", "همدان": "Hamedan", "کرمان": "Kerman", "یزد": "Yazd",
  "اردبیل": "Ardabil", "بندرعباس": "Bandar Abbas", "اراک": "Arak", "اسلامشهر": "Eslamshahr",
  "زنجان": "Zanjan", "سنندج": "Sanandaj", "قزوین": "Qazvin", "خرم آباد": "Khorramabad",
  "گرگان": "Gorgan", "ساری": "Sari", "شهر ری": "Shahr-e Rey", "بوشهر": "Bushehr", "بجنورد": "Bojnord",
  "بیرجند": "Birjand", "ایلام": "Ilam", "یاسوج": "Yasuj", "شهرکرد": "Shahrekord", "سمنان": "Semnan",
  "قائمشهر": "Qaemshahr", "ملارد": "Malard", "پاکدشت": "Pakdasht", "شهریار": "Shahriar",
  "رباط کریم": "Robat Karim", "ورامین": "Varamin", "پردیس": "Pardis", "اندیشه": "Andisheh",
  "فردیس": "Fardis", "نظرآباد": "Nazarabad", "ساوه": "Saveh", "قرچک": "Qarchak", "کاشان": "Kashan",
  "نجف آباد": "Najafabad", "خمینی شهر": "Khomeinishahr", "شاهین شهر": "Shahin Shahr", "دزفول": "Dezful",
  "آبادان": "Abadan", "خرمشهر": "Khorramshahr", "بهبهان": "Behbahan", "بندر ماهشهر": "Bandar Mahshahr",
  "اندیمشک": "Andimeshk", "ایذه": "Izeh", "مرودشت": "Marvdasht", "جهرم": "Jahrom", "فسا": "Fasa",
  "کازرون": "Kazerun", "لار": "Lar", "نی‌ریز": "Neyriz", "میناب": "Minab", "قشم": "Qeshm",
  "بندرلنگه": "Bandar Lengeh", "سیرجان": "Sirjan", "رفسنجان": "Rafsanjan", "بم": "Bam",
  "زرند": "Zarand", "جیرفت": "Jiroft", "نیشابور": "Neyshabur", "سبزوار": "Sabzevar",
  "کاشمر": "Kashmar", "تربت حیدریه": "Torbat-e Heydarieh", "قوچان": "Quchan", "میاندوآب": "Miandoab",
  "خوی": "Khoy", "مراغه": "Maragheh", "مرند": "Marand", "اهر": "Ahar", "میانه": "Mianeh",
  "بناب": "Bonab", "سراب": "Sarab", "ابهر": "Abhar", "خدابنده": "Khodabandeh", "لاهیجان": "Lahijan",
  "رودسر": "Rudsar", "لنگرود": "Langarud", "آستارا": "Astara", "تالش": "Talesh",
  "صومعه سرا": "Someh Sara", "بندر انزلی": "Bandar Anzali", "آمل": "Amol", "بابل": "Babol",
  "چالوس": "Chalus", "نوشهر": "Nowshahr", "تنکابن": "Tonekabon", "رامسر": "Ramsar",
  "بهشهر": "Behshahr", "نکا": "Neka", "ساوجبلاغ": "Savojbolagh", "هشتگرد": "Hashtgerd",
  "طالقان": "Taleghan", "دماوند": "Damavand", "فیروزکوه": "Firuzkuh", "پیشوا": "Pishva",
  "کهریزک": "Kahrizak", "بهارستان": "Baharestan", "چابهار": "Chabahar", "زابل": "Zabol",
  "خاش": "Khash", "ایرانشهر": "Iranshahr", "سراوان": "Saravan", "دهلران": "Dehloran",
  "آبدانان": "Abdanan", "ایوان": "Eyvan", "مهران": "Mehran",
  "ماسال": "Masal", "کردستان": "Kordestan", "محمدیه": "Mohammadiye", "سقز": "Saghez",
  "خوانسار": "Khansar", "شاندیز": "Shandiz", "سلماس": "Salmas", "جاجرود": "Jajrud",
  "نمک آبرود": "Namakabrod", "درگز": "Dargaz", "گلپایگان": "Golpayegan", "اردکان یزد": "Ardakan",
  "امیدیه": "Omidiyeh", "تاکستان": "Takestan", "حسن آباد": "Hasanabad", "سنگر": "Sangar",
  "کنگاور": "Kangavar", "الیگودرز": "Aligudarz", "تایباد": "Taybad", "دهدشت": "Dehdasht",
  "الوند": "Alvand", "صبا شهر": "Sabashahr", "رویان": "Royan", "کمال شهر": "Kamalshahr",
  "ایزدشهر": "Izadshahr", "خلخال": "Khalkhal", "هشتپر": "Hashtpar", "مهاباد": "Mahabad",
  "سرخس": "Sarakhs", "مشگین شهر": "Meshginshahr", "آباده": "Abadeh", "سرپل ذهاب": "Sarpol-e Zahab",
  "تفت": "Taft", "بندر ترکمن": "Bandar-e Torkman", "شریف آباد": "Sharifabad", "ازنا": "Azna",
  "بوکان": "Bukan", "بندر گز": "Bandar Gaz", "منجیل": "Manjil", "کامیاران": "Kamyaran",
  "داراب": "Darab", "رامهرمز": "Ramhormoz", "فریدونکنار": "Fereydunkenar", "محمود آباد": "Mahmudabad",
  "شیروان": "Shirvan", "بندر گناوه": "Bandar Ganaveh", "علی آباد کتول": "Ali Abad",
  "آران و بیدگل": "Aran va Bidgol", "پارس آباد": "Parsabad", "صالحیه": "Salehiye",
  "گناباد": "Gonabad", "باقر شهر": "Baqershahr", "آستانه اشرفیه": "Astaneh-ye Ashrafiyeh",
  "بروجرد": "Borujerd", "کیش": "Kish", "سلمان شهر": "Salman Shahr", "تربت جام": "Torbat-e-Jam",
  "آزادشهر": "Azadshahr", "اسلام آباد غرب": "Eslamabad-e-Gharb", "سهند": "Sahand",
  "چناران": "Chenaran", "قروه": "Qorveh", "قائم‌ شهر": "Qaem Shahr", "خمین": "Khomeyn",
  "درود": "Dorud", "نور": "Nur", "مریوان": "Marivan", "دوگنبدان": "Dogonbadan", "طرقبه": "Torghabeh",
  "نورآباد": "Nurabad", "برازجان": "Borazjan", "سرخ رود": "Sorkhrud", "سربندر": "Sarbandar",
  "گرمدره": "Garmdareh", "سپاهان شهر": "Sepahan Shahr", "نسیم شهر": "Nasimshahr", "ماهدشت": "Mahdasht",
  "دامغان": "Damghan", "صدرا": "Sadra", "فولادشهر": "Fuladshahr", "بروجن": "Borujen",
  "بابلسر": "Babolsar", "گلبهار": "Golbahar", "لرستان": "Lorestan", "آبیک": "Abyek", "پرند": "Parand",
  "شهرضا": "Shahreza", "زرین شهر": "Zarrinshahr", "سرعین": "Sareyn", "چهاردانگه": "Chahar Dangeh",
  "شاهرود": "Shahrud", "ملایر": "Malayer", "لواسان": "Lavasan", "میبد": "Meybod", "رودهن": "Rudehen",
  "کوهدشت": "Kuhdasht", "فلاورجان": "Falavarjan", "کردکوی": "Kordkuy", "عباس آباد": "Abbasabad",
  "باغستان": "Baghestan", "فردوسیه": "Ferdosiyeh", "گنبد کاووس": "Gonbad-e Kavus", "محلات": "Mahallat",
  "طبس": "Tabas", "شهر قدس": "Qods", "بومهن": "Bumehen", "مبارکه": "Mobarakeh", "اسفراین": "Esfarayen",
  "مسجد سلیمان": "Masjedsoleyman", "گرمسار": "Garmsar", "فومن": "Fuman", "قاین": "Qaen",
  "فشم": "Fasham", "بانه": "Baneh", "نهاوند": "Nahavand", "شوشتر": "Shushtar", "نقده": "Naqadeh",
  "شوش": "Shush", "چهارمحال بختیاری": "Chaharmahal and Bakhtiari", "کلارآباد": "Kelarabad",
  "لردگان": "Lordegan", "بافت": "Baft", "بندر کنگان": "Bandar Kangan", "احمد آباد": "Ahmadabad",
  "اسکو": "Osku",
};
function cityLabel(name, lang) { return lang === "en" ? (CITY_EN[name] || name) : name; }

function getCredibility(reviews, lang) {
  if (reviews >= 200) return { label: lang === "en" ? "High" : "بالا", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (reviews >= 50) return { label: lang === "en" ? "Medium" : "متوسط", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: lang === "en" ? "Low" : "پایین", cls: "bg-rose-50 text-rose-700 border-rose-200" };
}

const CATEGORY_EN = { "دلیوری": "Delivery", "پشتیبانی": "Support", "عملکرد پلتفرم": "Platform Performance", "عملکرد رستوران": "Restaurant Performance", "پیدا نکردن رستوران موردنظر": "Restaurant Not Found" };
function catLabel(cat, lang) { return lang === "en" ? (CATEGORY_EN[cat] || cat) : cat; }

const TAG_EN = {
  "تأخیر در تحویل": "Delivery delay", "رفتار نامناسب پیک": "Courier misconduct", "آسیب به سفارش حین تحویل": "Damage during delivery",
  "سرد رسیدن غذا": "Food arrived cold", "تأخیر پیک در قبول سفارش": "Courier pickup delay", "هزینه بالای تحویل": "High delivery fee",
  "کیفیت پایین غذا": "Low food quality", "بسته‌بندی ضعیف": "Poor packaging", "قیمت با کیفیت همخوانی ندارد": "Price doesn't match quality",
  "زمان طولانی آماده‌سازی غذا": "Long prep time", "عدم تطابق سفارش با آنچه دریافت شد": "Order mismatch", "سایر": "Other",
};
function tagLabel(label, lang) { return lang === "en" ? (TAG_EN[label] || label) : label; }

const STR = {
  fa: {
    title: "نظرسنجی بعد از سفارش در", brand: "اسنپ‌فود", citiesSuffix: "شهر", updateNote: "داده‌ها روزانه به‌روزرسانی می‌شوند",
    credFilterActive: (n) => `فیلتر اعتبار فعال (≥ ${n})`, lastUpdate: "آخرین به‌روزرسانی: امروز",
    kpiHotIssue: "داغ‌ترین مشکل ارسال", alertsSuffix: "هشدار", kpiMostFeedback: "پرحجم‌ترین بازخورد", reviewsSuffix: "نظر",
    kpiLowestSat: "پایین‌ترین رضایت ارسال", kpiHighestSat: "بالاترین رضایت ارسال", kpiCitiesTracked: "شهرهای رصدشده",
    collecting: "در حال جمع‌آوری", withMinReviews: (n) => `با حداقل ${n} نظر`,
    tabs: ["رتبه‌بندی شهرها", "تفکیک مشکلات", "روند زمانی", "مقایسه دوبه‌دو"],
    analysisRange: "بازه‌ی تحلیل", from: "از", to: "تا", preset3: "۳ ماه", preset6: "۶ ماه", preset12: "۱۲ ماه", presetAll: "کل",
    filterTitle: "فیلتر شهر، Tier و اعتبار", minReviewsLabel: "حداقل تعداد نظرات (اعتبار)", tierLabel: "Tier", clear: "پاک کردن",
    filterCity: "فیلتر شهر", allCities: "همه شهرها", citiesSelected: (n) => `${n} شهر انتخاب شده`, searchCity: "جستجوی شهر...",
    selectAll: "انتخاب همه", cityNotFound: "شهری یافت نشد", filterActiveNote: " · دیتای فیلترشده بر اساس شهرهای انتخابی",
    ranking: "رتبه‌بندی شهرها", noCitiesMatch: "هیچ شهری با فیلترهای فعلی پیدا نشد. فیلتر حداقل نظرات یا Tier را تغییر دهید.",
    sortBy: "مرتب‌سازی بر اساس", sortDeliverySat: "رضایت ارسال", sortOrderScore: "امتیاز سفارش", sortReviews: "تعداد نظرات", sortAlert: "هشدار",
    colRank: "#", colCity: "شهر", colTier: "Tier", colDeliverySat: "رضایت ارسال", colOrderScore: "امتیاز سفارش",
    colSentiment: "توزیع احساسات", colReviews: "تعداد نظرات", colCred: "اعتبار", colAlert: "سیگنال هشدار",
    issuesOverview: "مشکلات نظرسنجی — نمای کلی", issuesOverviewSub: "پرتکرارترین مشکلات", categoryBreakdown: "دسته‌بندی مشکلات", tagsFor: "تگ‌های مشکل — اسنپ‌فود",
    negComments: "نمونه نظرات منفی — اسنپ‌فود", negCommentsSub: "آخرین نظرات منفی ثبت‌شده به همراه برچسب‌های مرتبط",
    filteredByCity: " · فیلتر شده بر اساس شهرهای انتخابی", noCommentsMatch: "نظری با فیلتر فعلی یافت نشد.",
    volumeTitle: "حجم بازخورد", volumeSub: "تعداد نظرات ثبت‌شده در هر روز", scoreTrend: "روند امتیاز", scoreTrendSub: "میانگین امتیاز سفارش در هر روز",
    sentimentTrend: "روند احساسات", sentimentTrendSub: "تعداد پاسخ‌های مثبت / منفی در هر روز", issueTrend: "روند مشکلات", issueTrendSub: "۵ مشکل پرتکرار در طول زمان",
    positive: "مثبت", negative: "منفی", compare: "مقایسه", vs: "در برابر", metric: "متریک", loading: "در حال خواندن دیتا از گوگل‌شیت...",
    metricDeliverySat: "رضایت ارسال", metricOrderScore: "امتیاز سفارش", metricPositive: "درصد مثبت", metricNegative: "درصد منفی",
    metricLowNeg: "کم‌بودن نارضایتی", metricLowAlert: "کم‌بودن هشدار", metricTier: "Tier",
  },
  en: {
    title: "Post-Order Survey on", brand: "Snapp Food", citiesSuffix: "cities", updateNote: "Data updates daily",
    credFilterActive: (n) => `Credibility filter active (≥ ${n})`, lastUpdate: "Last updated: today",
    kpiHotIssue: "Hottest delivery issue", alertsSuffix: "alerts", kpiMostFeedback: "Most feedback volume", reviewsSuffix: "reviews",
    kpiLowestSat: "Lowest delivery satisfaction", kpiHighestSat: "Highest delivery satisfaction", kpiCitiesTracked: "Cities tracked",
    collecting: "Collecting", withMinReviews: (n) => `With ≥ ${n} reviews`,
    tabs: ["City Ranking", "Issue Breakdown", "Trend Over Time", "Compare Cities"],
    analysisRange: "Analysis range", from: "From", to: "To", preset3: "3mo", preset6: "6mo", preset12: "12mo", presetAll: "All",
    filterTitle: "Filter by city, Tier & credibility", minReviewsLabel: "Min. review count (credibility)", tierLabel: "Tier", clear: "Clear",
    filterCity: "Filter city", allCities: "All cities", citiesSelected: (n) => `${n} cities selected`, searchCity: "Search city...",
    selectAll: "Select all", cityNotFound: "No city found", filterActiveNote: " · data filtered by selected cities",
    ranking: "City Ranking", noCitiesMatch: "No city matches the current filters. Try changing the min-review or Tier filter.",
    sortBy: "Sort by", sortDeliverySat: "Delivery satisfaction", sortOrderScore: "Order score", sortReviews: "Review count", sortAlert: "Alerts",
    colRank: "#", colCity: "City", colTier: "Tier", colDeliverySat: "Delivery satisfaction", colOrderScore: "Order score",
    colSentiment: "Sentiment split", colReviews: "Reviews", colCred: "Credibility", colAlert: "Alert signal",
    issuesOverview: "Issues — Overview", issuesOverviewSub: "Most frequent issues", categoryBreakdown: "Issue categories", tagsFor: "Issue tags — Snapp Food",
    negComments: "Negative comment samples — Snapp Food", negCommentsSub: "Latest negative comments with related tags",
    filteredByCity: " · filtered by selected cities", noCommentsMatch: "No comment matches the current filter.",
    volumeTitle: "Feedback volume", volumeSub: "Reviews logged per day", scoreTrend: "Score trend", scoreTrendSub: "Average order score per day",
    sentimentTrend: "Sentiment trend", sentimentTrendSub: "Positive / negative responses per day", issueTrend: "Issue trend", issueTrendSub: "Top 5 recurring issues over time",
    positive: "Positive", negative: "Negative", compare: "Compare", vs: "vs", metric: "Metric", loading: "Loading data from Google Sheets...",
    metricDeliverySat: "Delivery satisfaction", metricOrderScore: "Order score", metricPositive: "Positive %", metricNegative: "Negative %",
    metricLowNeg: "Low dissatisfaction", metricLowAlert: "Low alert rate", metricTier: "Tier",
  },
};

function useTheme(dark) {
  return dark
    ? { bg: "bg-zinc-950", card: "bg-zinc-900", border: "border-zinc-800", text: "text-zinc-100", textMuted: "text-zinc-400", textFaint: "text-zinc-600", input: "bg-zinc-800 border-zinc-700 text-zinc-200", rowAlt: "bg-zinc-800/30", rowBorder: "border-zinc-800/60", chipBg: "bg-zinc-800", pillActive: "bg-zinc-800 text-pink-400", pillInactive: "text-zinc-500 hover:text-zinc-300" }
    : { bg: "bg-gray-50", card: "bg-white", border: "border-gray-100", text: "text-gray-900", textMuted: "text-gray-500", textFaint: "text-gray-300", input: "bg-gray-50 border-gray-200 text-gray-700", rowAlt: "bg-gray-50/40", rowBorder: "border-gray-50", chipBg: "bg-gray-50", pillActive: "bg-white text-pink-600 shadow-sm", pillInactive: "text-gray-500 hover:text-gray-700" };
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
function digitsStr(s, lang) { if (lang === "en") return String(s); return String(s).replace(/[0-9]/g, (d) => FA_DIGITS[d]); }
function numStr(n, lang, opts) { if (n === undefined || n === null || Number.isNaN(n)) return "—"; return Number(n).toLocaleString(lang === "en" ? "en-US" : "fa-IR", opts); }
function scoreColor(v, mid = 70) { if (v >= mid + 10) return "text-emerald-500"; if (v >= mid - 10) return "text-amber-500"; return "text-rose-500"; }
function shortDate(d, lang) { return digitsStr(d ? d.slice(5) : d, lang); }
function fetchCsv(url) { return fetch(url).then((res) => res.text()).then((csvText) => Papa.parse(csvText, { header: true, skipEmptyLines: true }).data); }
function jalaliToGregorian(jy, jm, jd) {
  jy = jy + 1595;
  let days = -355668 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++; }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  let gd = days + 1;
  const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const salA = [0, 31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 1; gm <= 12; gm++) { if (gd <= salA[gm]) break; gd -= salA[gm]; }
  return new Date(gy, gm - 1, gd);
}

// --- re-aggregation helpers: collapse per-city rows into the shape used by the UI, optionally filtered to a set of cities ---
function aggTags(rows, citySet) {
  const filtered = citySet.size === 0 ? rows : rows.filter((r) => citySet.has(r["شهر"]));
  const map = new Map();
  for (const r of filtered) {
    const key = r["subcode"];
    if (!map.has(key)) map.set(key, { label: r["label"], category: r["category"], subcode: key, count: 0 });
    map.get(key).count += Number(r["تعداد"]) || 0;
  }
  return Array.from(map.values());
}
function aggCategories(rows, citySet) {
  const filtered = citySet.size === 0 ? rows : rows.filter((r) => citySet.has(r["شهر"]));
  const map = new Map();
  for (const r of filtered) {
    const key = r["category"];
    if (!map.has(key)) map.set(key, { category: key, count: 0 });
    map.get(key).count += Number(r["تعداد"]) || 0;
  }
  return Array.from(map.values());
}
function aggDaily(rows, citySet) {
  const filtered = citySet.size === 0 ? rows : rows.filter((r) => citySet.has(r["شهر"]));
  const map = new Map();
  for (const r of filtered) {
    const d = r["تاریخ"];
    if (!map.has(d)) map.set(d, { date: d, reviews: 0, positive: 0, negative: 0, scoreWeighted: 0 });
    const e = map.get(d);
    const rev = Number(r["تعداد نظرات"]) || 0;
    e.reviews += rev;
    e.positive += Number(r["مثبت"]) || 0;
    e.negative += Number(r["منفی"]) || 0;
    e.scoreWeighted += (Number(r["میانگین امتیاز"]) || 0) * rev;
  }
  return Array.from(map.values())
    .map((e) => ({ date: e.date, reviews: e.reviews, avgScore: e.reviews ? e.scoreWeighted / e.reviews : 0, positive: e.positive, negative: e.negative }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}
function aggDailyIssues(rows, citySet, labelKeys) {
  const filtered = citySet.size === 0 ? rows : rows.filter((r) => citySet.has(r["شهر"]));
  const map = new Map();
  for (const r of filtered) {
    const d = r["تاریخ"];
    if (!map.has(d)) map.set(d, { "تاریخ": d, ...Object.fromEntries(labelKeys.map((k) => [k, 0])) });
    const e = map.get(d);
    for (const k of labelKeys) e[k] += Number(r[k]) || 0;
  }
  return Array.from(map.values()).sort((a, b) => (a["تاریخ"] < b["تاریخ"] ? -1 : 1));
}

function FilterBar({ range, setRange, preset, setPreset, maxDataDate, lang, t, th }) {
  const applyPreset = (key, months) => {
    setPreset(key);
    if (key === "all") { setRange({ fromY: 1395, fromM: 1, fromD: 1, toY: 1405, toM: 12, toD: 29 }); return; }
    const to = maxDataDate || new Date();
    const from = new Date(to);
    from.setMonth(from.getMonth() - months);
    setRange({ fromY: 1395, fromM: 1, fromD: 1, toY: 1405, toM: 12, toD: 29, gregFrom: from, gregTo: to });
  };
  const setField = (field, value) => { setPreset(null); setRange((r) => ({ ...r, [field]: Number(value), gregFrom: undefined, gregTo: undefined })); };
  const months = MONTHS[lang];
  return (
    <div className={`${th.card} border ${th.border} rounded-2xl shadow-sm px-4 py-3 mb-3 flex items-center justify-between flex-wrap gap-3`}>
      <div className={`flex items-center gap-2 text-xs ${th.textMuted}`}>
        <span className={`font-medium ${th.text}`}>{t.analysisRange}</span>
        <span>{t.from}</span>
        <select value={range.fromY} onChange={(e) => setField("fromY", e.target.value)} className={`${th.input} border rounded px-1.5 py-1`}>{YEARS.map((y) => <option key={y} value={y}>{digitsStr(y, lang)}</option>)}</select>
        <select value={range.fromM} onChange={(e) => setField("fromM", e.target.value)} className={`${th.input} border rounded px-1.5 py-1`}>{months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
        <select value={range.fromD} onChange={(e) => setField("fromD", e.target.value)} className={`${th.input} border rounded px-1.5 py-1`}>{DAYS.map((d) => <option key={d} value={d}>{digitsStr(d, lang)}</option>)}</select>
        <span>{t.to}</span>
        <select value={range.toY} onChange={(e) => setField("toY", e.target.value)} className={`${th.input} border rounded px-1.5 py-1`}>{YEARS.map((y) => <option key={y} value={y}>{digitsStr(y, lang)}</option>)}</select>
        <select value={range.toM} onChange={(e) => setField("toM", e.target.value)} className={`${th.input} border rounded px-1.5 py-1`}>{months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
        <select value={range.toD} onChange={(e) => setField("toD", e.target.value)} className={`${th.input} border rounded px-1.5 py-1`}>{DAYS.map((d) => <option key={d} value={d}>{digitsStr(d, lang)}</option>)}</select>
        <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 ms-1" />
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => applyPreset("3m", 3)} className={`px-3 py-1.5 text-xs rounded-full font-medium ${preset === "3m" ? "bg-pink-50 text-pink-600" : th.pillInactive}`}>{t.preset3}</button>
        <button onClick={() => applyPreset("6m", 6)} className={`px-3 py-1.5 text-xs rounded-full font-medium ${preset === "6m" ? "bg-pink-50 text-pink-600" : th.pillInactive}`}>{t.preset6}</button>
        <button onClick={() => applyPreset("12m", 12)} className={`px-3 py-1.5 text-xs rounded-full font-medium ${preset === "12m" ? "bg-pink-50 text-pink-600" : th.pillInactive}`}>{t.preset12}</button>
        <button onClick={() => applyPreset("all", 0)} className={`px-3 py-1.5 text-xs rounded-full font-medium ${preset === "all" ? "bg-pink-50 text-pink-600" : th.pillInactive}`}>{t.presetAll}</button>
      </div>
    </div>
  );
}

function CityDropdown({ availableCities, selectedCities, setSelectedCities, lang, t, th }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return availableCities;
    return availableCities.filter((c) => c.name.includes(q) || cityLabel(c.name, lang).toLowerCase().includes(q.toLowerCase()));
  }, [availableCities, search, lang]);
  const toggle = (name) => setSelectedCities((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  const selectAll = () => setSelectedCities(availableCities.map((c) => c.name));
  const clearAll = () => setSelectedCities([]);
  const label = selectedCities.length === 0 ? t.allCities : selectedCities.length === 1 ? cityLabel(selectedCities[0], lang) : t.citiesSelected(digitsStr(selectedCities.length, lang));
  return (
    <div className="relative min-w-[220px]" ref={ref}>
      <label className={`text-xs ${th.textMuted} mb-1 block`}>{t.filterCity}</label>
      <button type="button" onClick={() => setOpen((v) => !v)} className={`w-full flex items-center justify-between gap-2 ${th.input} border rounded-lg px-3 py-1.5 text-sm hover:border-pink-300 transition-colors`}>
        <span className="truncate">{label}</span>
        <ChevronDown className={`w-4 h-4 ${th.textMuted} transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`absolute z-50 mt-1 w-full min-w-[260px] ${th.card} border ${th.border} rounded-xl shadow-lg overflow-hidden`}>
          <div className={`p-2 border-b ${th.border}`}>
            <div className="relative">
              <Search className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${th.textMuted}`} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchCity} className={`w-full ${th.input} border rounded-lg pr-8 pl-2 py-1.5 text-sm focus:outline-none focus:border-pink-300`} autoFocus />
            </div>
          </div>
          <div className={`flex items-center justify-between px-3 py-1.5 border-b ${th.border} text-xs`}>
            <button onClick={selectAll} className="text-pink-600 hover:text-pink-700">{t.selectAll}</button>
            <button onClick={clearAll} className={`${th.textMuted} hover:opacity-80`}>{t.clear}</button>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className={`px-3 py-4 text-center text-xs ${th.textMuted}`}>{t.cityNotFound}</div>
            ) : (
              filtered.map((c) => {
                const checked = selectedCities.includes(c.name);
                return (
                  <label key={c.name} className={`flex items-center gap-2 px-3 py-1.5 hover:${th.rowAlt} cursor-pointer text-sm`}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(c.name)} className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                    <span className={`flex-1 truncate ${th.text}`}>{cityLabel(c.name, lang)}</span>
                    <span className={`text-[10px] ${th.textMuted}`}>Tier {digitsStr(c.tier, lang)}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CityTierFilter({ cities, selectedCities, setSelectedCities, selectedTiers, setSelectedTiers, minReviews, setMinReviews, lang, t, th }) {
  const toggleTier = (tier) => setSelectedTiers((prev) => (prev.includes(tier) ? prev.filter((x) => x !== tier) : [...prev, tier]));
  const availableCities = useMemo(() => (selectedTiers.length === 0 ? cities : cities.filter((c) => selectedTiers.includes(c.tier))), [cities, selectedTiers]);
  useEffect(() => {
    if (selectedTiers.length === 0) return;
    setSelectedCities((prev) => prev.filter((name) => { const city = cities.find((c) => c.name === name); return city && selectedTiers.includes(city.tier); }));
  }, [selectedTiers, cities, setSelectedCities]);
  return (
    <div className={`${th.card} border ${th.border} rounded-2xl shadow-sm px-4 py-3 mb-4`}>
      <div className={`flex items-center gap-2 mb-3 text-xs ${th.textMuted}`}>
        <Filter className="w-3.5 h-3.5" />
        <span className={`font-medium ${th.text}`}>{t.filterTitle}</span>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className={`text-xs ${th.textMuted}`}>{t.minReviewsLabel}</label>
          <select value={minReviews} onChange={(e) => setMinReviews(Number(e.target.value))} className={`${th.input} border rounded-lg px-2.5 py-1.5 text-sm min-w-[140px]`}>
            {MIN_REVIEWS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o[lang]}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={`text-xs ${th.textMuted}`}>{t.tierLabel}</label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0, 1, 2, 3].map((tr) => (
              <button key={tr} onClick={() => toggleTier(tr)} className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${selectedTiers.includes(tr) ? "bg-pink-50 text-pink-600 border-pink-200 font-medium" : `${th.chipBg} ${th.textMuted} ${th.border} hover:opacity-80`}`}>Tier {digitsStr(tr, lang)}</button>
            ))}
            {selectedTiers.length > 0 && <button onClick={() => setSelectedTiers([])} className={`text-xs ${th.textMuted} hover:opacity-80 px-1`}>{t.clear}</button>}
          </div>
        </div>
        <CityDropdown availableCities={availableCities} selectedCities={selectedCities} setSelectedCities={setSelectedCities} lang={lang} t={t} th={th} />
      </div>
    </div>
  );
}

export default function App() {
  const [cities, setCities] = useState([]);
  const [tagsByCity, setTagsByCity] = useState([]);
  const [categoriesByCity, setCategoriesByCity] = useState([]);
  const [comments, setComments] = useState([]);
  const [dailyByCity, setDailyByCity] = useState([]);
  const [dailyIssuesByCity, setDailyIssuesByCity] = useState([]);
  const [tab, setTab] = useState(0);
  const [sortKey, setSortKey] = useState("deliverySat");
  const [cityA, setCityA] = useState("");
  const [cityB, setCityB] = useState("");
  const [preset, setPreset] = useState("all");
  const [range, setRange] = useState({ fromY: 1395, fromM: 1, fromD: 1, toY: 1405, toM: 12, toD: 29 });
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedTiers, setSelectedTiers] = useState([]);
  const [minReviews, setMinReviews] = useState(50);
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState("fa");

  const th = useTheme(dark);
  const t = STR[lang];
  const dir = lang === "en" ? "ltr" : "rtl";
  const citySet = useMemo(() => new Set(selectedCities), [selectedCities]);

  useEffect(() => {
    fetchCsv(SHEET_CITIES_URL).then((data) => {
      const parsed = data.map((r) => {
        const reviews = Number(r["تعداد نظرات"]) || 0;
        const name = r["شهر"];
        return { name, deliverySat: Number(r["رضایت ارسال"]), orderScore: Number(r["امتیاز سفارش"]), pos: Number(r["درصد مثبت"]), neu: Number(r["درصد خنثی"]), neg: Number(r["درصد منفی"]), reviews, alert: Number(r["سیگنال هشدار"]) || 0, tier: getOfficialTier(name) };
      });
      setCities(parsed);
      const byReviews = [...parsed].sort((a, b) => b.reviews - a.reviews);
      if (byReviews[0]) setCityA(byReviews[0].name);
      if (byReviews[1]) setCityB(byReviews[1].name);
    }).catch((err) => console.error("خطا در خواندن شیت شهرها:", err));

    fetchCsv(SHEET_TAGS_BY_CITY_URL).then((data) => setTagsByCity(data.filter((r) => r["label"]))).catch((err) => console.error("خطا در خواندن شیت tags_by_city:", err));
    fetchCsv(SHEET_CATEGORIES_BY_CITY_URL).then((data) => setCategoriesByCity(data.filter((r) => r["category"]))).catch((err) => console.error("خطا در خواندن شیت categories_by_city:", err));
    fetchCsv(SHEET_COMMENTS_URL).then((data) => setComments(data.map((r) => ({ date: (r["تاریخ"] || "").slice(0, 10), city: r["شهر"], text: r["نظر"], tags: (r["برچسب‌ها"] || "").split("،").map((x) => x.trim()).filter(Boolean) })).filter((c) => c.text))).catch((err) => console.error("خطا در خواندن شیت Comments:", err));
    fetchCsv(SHEET_DAILY_BY_CITY_URL).then((data) => setDailyByCity(data.filter((r) => r["تاریخ"]))).catch((err) => console.error("خطا در خواندن شیت daily_by_city:", err));
    fetchCsv(SHEET_DAILY_ISSUES_BY_CITY_URL).then((data) => setDailyIssuesByCity(data.filter((r) => r["تاریخ"]))).catch((err) => console.error("خطا در خواندن شیت daily_issues_by_city:", err));
  }, []);

  // re-aggregated (filtered by selected cities) derived datasets used across ALL tabs
  const tags = useMemo(() => aggTags(tagsByCity, citySet), [tagsByCity, citySet]);
  const categories = useMemo(() => aggCategories(categoriesByCity, citySet), [categoriesByCity, citySet]);
  const daily = useMemo(() => aggDaily(dailyByCity, citySet), [dailyByCity, citySet]);
  const issueLineKeys = useMemo(() => (dailyIssuesByCity.length > 0 ? Object.keys(dailyIssuesByCity[0]).filter((k) => k !== "شهر" && k !== "تاریخ") : []), [dailyIssuesByCity]);
  const dailyIssues = useMemo(() => aggDailyIssues(dailyIssuesByCity, citySet, issueLineKeys), [dailyIssuesByCity, citySet, issueLineKeys]);

  const maxDataDate = useMemo(() => (daily.length === 0 ? null : new Date(Math.max(...daily.map((d) => new Date(d.date).getTime())))), [daily]);
  const { fromDate, toDate } = useMemo(() => {
    if (range.gregFrom && range.gregTo) return { fromDate: range.gregFrom, toDate: range.gregTo };
    return { fromDate: jalaliToGregorian(range.fromY, range.fromM, range.fromD), toDate: jalaliToGregorian(range.toY, range.toM, range.toD) };
  }, [range]);
  const filteredDaily = useMemo(() => daily.filter((d) => { const x = new Date(d.date).getTime(); return x >= fromDate.getTime() && x <= toDate.getTime(); }), [daily, fromDate, toDate]);
  const filteredDailyIssues = useMemo(() => dailyIssues.filter((d) => { const x = new Date(d["تاریخ"]).getTime(); return x >= fromDate.getTime() && x <= toDate.getTime(); }), [dailyIssues, fromDate, toDate]);

  const filteredCities = useMemo(() => cities.filter((c) => {
    if (c.reviews < minReviews) return false;
    if (selectedTiers.length > 0 && !selectedTiers.includes(c.tier)) return false;
    if (selectedCities.length > 0 && !selectedCities.includes(c.name)) return false;
    return true;
  }), [cities, minReviews, selectedTiers, selectedCities]);

  const rows = useMemo(() => [...filteredCities].sort((a, b) => { const diff = b[sortKey] - a[sortKey]; return diff !== 0 ? diff : b.reviews - a.reviews; }), [filteredCities, sortKey]);

  const kpis = useMemo(() => {
    const source = filteredCities.length > 0 ? filteredCities : cities;
    if (source.length === 0) return null;
    return {
      worstIssueCity: [...source].sort((a, b) => b.alert - a.alert)[0], mostReviewed: [...source].sort((a, b) => b.reviews - a.reviews)[0],
      lowest: [...source].sort((a, b) => a.deliverySat - b.deliverySat)[0], highest: [...source].sort((a, b) => b.deliverySat - a.deliverySat)[0], count: source.length,
    };
  }, [filteredCities, cities]);

  const topTags = useMemo(() => [...tags].sort((a, b) => b.count - a.count).slice(0, 10), [tags]);
  const maxTopTagCount = useMemo(() => Math.max(1, ...topTags.map((x) => x.count)), [topTags]);
  const allTagsSorted = useMemo(() => [...tags].sort((a, b) => b.count - a.count), [tags]);
  const maxAllTagCount = useMemo(() => Math.max(1, ...allTagsSorted.map((x) => x.count)), [allTagsSorted]);

  const filteredComments = useMemo(() => (selectedCities.length === 0 ? comments : comments.filter((c) => selectedCities.includes(c.city))), [comments, selectedCities]);

  const dataA = useMemo(() => cities.find((c) => c.name === cityA), [cities, cityA]);
  const dataB = useMemo(() => cities.find((c) => c.name === cityB), [cities, cityB]);
  const radarData = useMemo(() => {
    if (!dataA || !dataB) return [];
    const alertScore = (c) => Math.max(0, 100 - (c.alert / Math.max(1, c.reviews)) * 1000);
    return [
      { metric: t.metricDeliverySat, A: dataA.deliverySat, B: dataB.deliverySat },
      { metric: t.metricOrderScore, A: Math.round(dataA.orderScore * 20), B: Math.round(dataB.orderScore * 20) },
      { metric: t.metricPositive, A: dataA.pos, B: dataB.pos },
      { metric: t.metricLowNeg, A: 100 - dataA.neg, B: 100 - dataB.neg },
      { metric: t.metricLowAlert, A: Math.round(alertScore(dataA)), B: Math.round(alertScore(dataB)) },
    ];
  }, [dataA, dataB, t]);

  const comparisonCities = filteredCities.length > 0 ? filteredCities : cities;

  if (cities.length === 0) {
    return <div dir={dir} className={`min-h-screen ${dark ? "bg-zinc-950 text-zinc-500" : "bg-white text-gray-400"} flex items-center justify-center`}>{t.loading}</div>;
  }

  const axisTick = { fontSize: 11, fill: dark ? "#71717a" : "#9ca3af" };
  const gridStroke = dark ? "#27272a" : "#f3f4f6";

  return (
    <div dir={dir} className={`min-h-screen ${th.bg} ${th.text} font-sans`}>
      <div className={`${th.card} border-b ${th.border}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-600 flex items-center justify-center text-white font-bold text-sm">SF</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-base font-bold ${th.text}`}>{t.title}</h1>
                <span className="text-pink-600 font-bold text-base">{t.brand}</span>
              </div>
              <p className={`text-xs ${th.textMuted} mt-0.5`}>
                {digitsStr(kpis?.count ?? cities.length, lang)} {t.citiesSuffix} · {t.updateNote}
                {minReviews > 0 && <span className="text-pink-500">{" · "}{t.credFilterActive(digitsStr(minReviews, lang))}</span>}
                {selectedCities.length > 0 && <span className="text-pink-500">{t.filterActiveNote}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(lang === "fa" ? "en" : "fa")} className={`flex items-center gap-1.5 text-xs ${th.textMuted} ${th.chipBg} border ${th.border} rounded-full px-3 py-1.5`}><Languages className="w-3.5 h-3.5" /> {lang === "fa" ? "EN" : "فا"}</button>
            <button onClick={() => setDark(!dark)} className={`flex items-center gap-1.5 text-xs ${th.textMuted} ${th.chipBg} border ${th.border} rounded-full px-3 py-1.5`}>{dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}</button>
            <div className={`flex items-center gap-1.5 text-xs ${th.textMuted} ${th.chipBg} border ${th.border} rounded-full px-3 py-1.5`}><Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" /> {t.lastUpdate}</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-5 gap-4 mb-6">
          <KpiCard th={th} icon={AlertTriangle} label={t.kpiHotIssue} value={cityLabel(kpis.worstIssueCity.name, lang)} sub={`${numStr(kpis.worstIssueCity.alert, lang)} ${t.alertsSuffix}`} accent="pink" />
          <KpiCard th={th} icon={MessageCircle} label={t.kpiMostFeedback} value={cityLabel(kpis.mostReviewed.name, lang)} sub={`${numStr(kpis.mostReviewed.reviews, lang)} ${t.reviewsSuffix}`} accent="gray" />
          <KpiCard th={th} icon={TrendingDown} label={t.kpiLowestSat} value={`${numStr(kpis.lowest.deliverySat, lang)}%`} sub={cityLabel(kpis.lowest.name, lang)} accent="rose" />
          <KpiCard th={th} icon={TrendingUp} label={t.kpiHighestSat} value={`${numStr(kpis.highest.deliverySat, lang)}%`} sub={cityLabel(kpis.highest.name, lang)} accent="emerald" />
          <KpiCard th={th} icon={Building2} label={t.kpiCitiesTracked} value={numStr(kpis.count, lang)} sub={minReviews > 0 ? t.withMinReviews(digitsStr(minReviews, lang)) : t.collecting} accent="gray" />
        </div>

        <div className={`inline-flex items-center gap-1 ${dark ? "bg-zinc-900" : "bg-gray-100"} rounded-full p-1 mb-4`}>
          {t.tabs.map((label, i) => <button key={label} onClick={() => setTab(i)} className={`px-4 py-1.5 text-sm rounded-full font-medium transition-colors ${tab === i ? th.pillActive : th.pillInactive}`}>{label}</button>)}
        </div>

        <FilterBar range={range} setRange={setRange} preset={preset} setPreset={setPreset} maxDataDate={maxDataDate} lang={lang} t={t} th={th} />
        <CityTierFilter cities={cities} selectedCities={selectedCities} setSelectedCities={setSelectedCities} selectedTiers={selectedTiers} setSelectedTiers={setSelectedTiers} minReviews={minReviews} setMinReviews={setMinReviews} lang={lang} t={t} th={th} />

        {tab === 0 && (
          <div className={`${th.card} border ${th.border} rounded-2xl shadow-sm p-5`}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2"><h2 className={`text-sm font-bold ${th.text}`}>{t.ranking}</h2><span className={`text-xs ${th.textMuted}`}>({digitsStr(rows.length, lang)})</span></div>
              <div className={`flex items-center gap-2 text-xs ${th.textMuted}`}>
                {t.sortBy}
                <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className={`${th.input} border rounded-lg px-2 py-1`}>
                  <option value="deliverySat">{t.sortDeliverySat}</option><option value="orderScore">{t.sortOrderScore}</option>
                  <option value="reviews">{t.sortReviews}</option><option value="alert">{t.sortAlert}</option>
                </select>
              </div>
            </div>
            {rows.length === 0 ? (
              <div className={`text-center py-12 ${th.textMuted} text-sm`}>{t.noCitiesMatch}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${th.textMuted} text-xs border-b ${th.border}`}>
                      <th className="text-start py-2 font-normal">{t.colRank}</th><th className="text-start py-2 font-normal">{t.colCity}</th>
                      <th className="text-start py-2 font-normal">{t.colTier}</th><th className="text-start py-2 font-normal">{t.colDeliverySat}</th>
                      <th className="text-start py-2 font-normal">{t.colOrderScore}</th><th className="text-start py-2 font-normal">{t.colSentiment}</th>
                      <th className="text-start py-2 font-normal">{t.colReviews}</th><th className="text-start py-2 font-normal">{t.colCred}</th><th className="text-start py-2 font-normal">{t.colAlert}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c, i) => {
                      const cred = getCredibility(c.reviews, lang);
                      return (
                        <tr key={c.name} className={`border-b ${th.rowBorder} hover:${th.rowAlt} ${i % 2 === 1 ? th.rowAlt : ""}`}>
                          <td className={`py-3 ${th.textMuted}`}>{digitsStr(i + 1, lang)}</td>
                          <td className={`py-3 ${th.text} font-medium`}>{cityLabel(c.name, lang)}</td>
                          <td className="py-3"><span className={`text-xs ${th.chipBg} ${th.textMuted} rounded-full px-2 py-0.5`}>Tier {digitsStr(c.tier, lang)}</span></td>
                          <td className={`py-3 font-mono ${scoreColor(c.deliverySat)}`}>{numStr(c.deliverySat, lang)}%</td>
                          <td className={`py-3 font-mono ${th.text}`}>★ {numStr(c.orderScore, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-3 w-36">
                            <div className={`flex h-2 rounded-full overflow-hidden ${dark ? "bg-zinc-800" : "bg-gray-100"}`}>
                              <div className="bg-emerald-400" style={{ width: `${c.pos}%` }} /><div className={dark ? "bg-zinc-600" : "bg-gray-300"} style={{ width: `${c.neu}%` }} /><div className="bg-rose-400" style={{ width: `${c.neg}%` }} />
                            </div>
                          </td>
                          <td className={`py-3 ${th.textMuted} font-mono`}>{numStr(c.reviews, lang)}</td>
                          <td className="py-3"><span className={`inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5 ${cred.cls}`}><ShieldCheck className="w-3 h-3" />{cred.label}</span></td>
                          <td className="py-3">{c.alert > 0 ? <span className="inline-flex items-center gap-1 text-xs bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-full px-2 py-0.5"><AlertTriangle className="w-3 h-3" /> {numStr(c.alert, lang)}</span> : <span className={`${th.textFaint} text-xs`}>—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 1 && (
          <div className="space-y-4">
            <div className={`${th.card} border ${th.border} rounded-2xl shadow-sm p-5`}>
              <h2 className={`text-sm font-bold ${th.text} mb-1`}>{t.issuesOverview}</h2>
              <p className={`text-xs ${th.textMuted} mb-4`}>{t.issuesOverviewSub}</p>
              <div className="space-y-2.5">
                {topTags.map((x) => (
                  <div key={x.subcode} className="flex items-center gap-3">
                    <div className={`w-16 shrink-0 text-xs ${th.textMuted} font-mono`}>{numStr(x.count, lang)}</div>
                    <div className={`flex-1 h-6 ${dark ? "bg-zinc-800" : "bg-gray-50"} rounded-md overflow-hidden`}><div className={`h-full rounded-md ${CATEGORY_COLORS[x.category] || "bg-gray-400"}`} style={{ width: `${(x.count / maxTopTagCount) * 100}%` }} /></div>
                    <div className={`w-64 shrink-0 text-sm ${th.text}`}>{tagLabel(x.label, lang)} <span className={th.textMuted}>({catLabel(x.category, lang)})</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              <div className={`col-span-2 ${th.card} border ${th.border} rounded-2xl shadow-sm p-5`}>
                <h2 className={`text-sm font-bold ${th.text} mb-4`}>{t.categoryBreakdown}</h2>
                <div className="space-y-3">
                  {categories.map((c) => (
                    <div key={c.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[c.category] || "bg-gray-400"}`} /><span className={`text-sm ${th.text}`}>{catLabel(c.category, lang)}</span></div>
                      <span className={`text-sm font-bold ${th.text} font-mono`}>{numStr(c.count, lang)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`col-span-3 ${th.card} border ${th.border} rounded-2xl shadow-sm p-5`}>
                <h2 className={`text-sm font-bold ${th.text} mb-4`}>{t.tagsFor}</h2>
                <div className="space-y-2.5 max-h-80 overflow-y-auto pe-1">
                  {allTagsSorted.map((x) => (
                    <div key={x.subcode} className="flex items-center gap-2">
                      <div className={`w-12 shrink-0 text-xs ${th.textMuted} font-mono`}>{numStr(x.count, lang)}</div>
                      <div className={`flex-1 h-5 ${dark ? "bg-zinc-800" : "bg-gray-50"} rounded-md overflow-hidden`}><div className={`h-full rounded-md ${CATEGORY_COLORS[x.category] || "bg-gray-400"}`} style={{ width: `${(x.count / maxAllTagCount) * 100}%` }} /></div>
                      <div className={`w-40 shrink-0 text-xs ${th.text}`}>{tagLabel(x.label, lang)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={`${th.card} border ${th.border} rounded-2xl shadow-sm p-5`}>
              <h2 className={`text-sm font-bold ${th.text} mb-1`}>{t.negComments}</h2>
              <p className={`text-xs ${th.textMuted} mb-4`}>{t.negCommentsSub}{selectedCities.length > 0 && <span className="text-pink-500">{t.filteredByCity}</span>}</p>
              <div className="max-h-96 overflow-y-auto space-y-3 pe-1">
                {filteredComments.length === 0 ? <div className={`text-center py-8 ${th.textMuted} text-sm`}>{t.noCommentsMatch}</div> : filteredComments.map((c, i) => (
                  <div key={i} className={`border ${th.border} rounded-xl p-3`}>
                    <div className="flex items-center justify-between mb-1.5"><span className={`text-xs ${th.textMuted}`}>{cityLabel(c.city, lang)}</span><span className={`text-xs ${th.textFaint} font-mono`}>{digitsStr(c.date, lang)}</span></div>
                    <p className={`text-sm ${th.text} mb-2`}>{c.text}</p>
                    <div className="flex flex-wrap gap-1.5">{c.tags.map((tag) => <span key={tag} className="text-xs bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-full px-2 py-0.5">{tagLabel(tag, lang)}</span>)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className={`${th.card} border ${th.border} rounded-2xl shadow-sm p-5`}>
                <h2 className={`text-sm font-bold ${th.text} mb-1`}>{t.volumeTitle}</h2>
                <p className={`text-xs ${th.textMuted} mb-4`}>{t.volumeSub}</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={filteredDaily}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} /><XAxis dataKey="date" tickFormatter={(d) => shortDate(d, lang)} tick={axisTick} />
                    <YAxis tick={axisTick} tickFormatter={(v) => digitsStr(v, lang)} /><Tooltip labelFormatter={(d) => shortDate(d, lang)} formatter={(v) => digitsStr(v, lang)} />
                    <Bar dataKey="reviews" name={t.colReviews} fill="#f472b6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className={`${th.card} border ${th.border} rounded-2xl shadow-sm p-5`}>
                <h2 className={`text-sm font-bold ${th.text} mb-1`}>{t.scoreTrend}</h2>
                <p className={`text-xs ${th.textMuted} mb-4`}>{t.scoreTrendSub}</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={filteredDaily}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} /><XAxis dataKey="date" tickFormatter={(d) => shortDate(d, lang)} tick={axisTick} />
                    <YAxis domain={[1, 5]} tick={axisTick} tickFormatter={(v) => digitsStr(v, lang)} /><Tooltip labelFormatter={(d) => shortDate(d, lang)} formatter={(v) => digitsStr(v, lang)} />
                    <Line type="monotone" dataKey="avgScore" name={t.scoreTrend} stroke="#ec4899" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={`${th.card} border ${th.border} rounded-2xl shadow-sm p-5`}>
              <h2 className={`text-sm font-bold ${th.text} mb-1`}>{t.sentimentTrend}</h2>
              <p className={`text-xs ${th.textMuted} mb-4`}>{t.sentimentTrendSub}</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={filteredDaily}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} /><XAxis dataKey="date" tickFormatter={(d) => shortDate(d, lang)} tick={axisTick} />
                  <YAxis tick={axisTick} tickFormatter={(v) => digitsStr(v, lang)} /><Tooltip labelFormatter={(d) => shortDate(d, lang)} formatter={(v) => digitsStr(v, lang)} /><Legend />
                  <Area type="monotone" dataKey="positive" name={t.positive} stroke="#10b981" fill="#10b98122" strokeWidth={2} />
                  <Area type="monotone" dataKey="negative" name={t.negative} stroke="#f43f5e" fill="#f43f5e22" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className={`${th.card} border ${th.border} rounded-2xl shadow-sm p-5`}>
              <h2 className={`text-sm font-bold ${th.text} mb-1`}>{t.issueTrend}</h2>
              <p className={`text-xs ${th.textMuted} mb-4`}>{t.issueTrendSub}</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={filteredDailyIssues}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} /><XAxis dataKey="تاریخ" tickFormatter={(d) => shortDate(d, lang)} tick={axisTick} />
                  <YAxis tick={axisTick} tickFormatter={(v) => digitsStr(v, lang)} /><Tooltip labelFormatter={(d) => shortDate(d, lang)} formatter={(v) => digitsStr(v, lang)} /><Legend />
                  {issueLineKeys.map((key, i) => <Line key={key} type="monotone" dataKey={key} name={tagLabel(key, lang)} stroke={ISSUE_LINE_COLORS[i % ISSUE_LINE_COLORS.length]} strokeWidth={2} dot={false} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div className={`${th.card} border ${th.border} rounded-2xl shadow-sm p-5`}>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className={`text-sm ${th.textMuted}`}>{t.compare}</span>
              <select value={cityA} onChange={(e) => setCityA(e.target.value)} className={`${th.input} border rounded-lg px-3 py-1.5 text-sm text-pink-600 font-medium`}>{comparisonCities.map((c) => <option key={c.name} value={c.name}>{cityLabel(c.name, lang)}</option>)}</select>
              <span className={`text-sm ${th.textMuted}`}>{t.vs}</span>
              <select value={cityB} onChange={(e) => setCityB(e.target.value)} className={`${th.input} border rounded-lg px-3 py-1.5 text-sm font-medium`}>{comparisonCities.map((c) => <option key={c.name} value={c.name}>{cityLabel(c.name, lang)}</option>)}</select>
            </div>
            {dataA && dataB && (
              <div className="grid grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={gridStroke} /><PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: dark ? "#a1a1aa" : "#6b7280" }} />
                    <PolarRadiusAxis tick={{ fontSize: 10, fill: dark ? "#52525b" : "#d1d5db" }} domain={[0, 100]} tickFormatter={(v) => digitsStr(v, lang)} />
                    <Radar name={cityLabel(cityA, lang)} dataKey="A" stroke="#ec4899" fill="#ec489933" strokeWidth={2} /><Radar name={cityLabel(cityB, lang)} dataKey="B" stroke="#6b7280" fill="#6b728033" strokeWidth={2} />
                    <Legend /><Tooltip formatter={(v) => digitsStr(v, lang)} />
                  </RadarChart>
                </ResponsiveContainer>
                <table className="w-full text-sm self-center">
                  <thead><tr className={`${th.textMuted} text-xs border-b ${th.border}`}><th className="text-start py-2 font-normal">{cityLabel(cityA, lang)}</th><th className="text-center py-2 font-normal">{t.metric}</th><th className="text-end py-2 font-normal">{cityLabel(cityB, lang)}</th></tr></thead>
                  <tbody>
                    <CompareRow th={th} label={t.metricDeliverySat} a={`${numStr(dataA.deliverySat, lang)}%`} b={`${numStr(dataB.deliverySat, lang)}%`} />
                    <CompareRow th={th} label={t.metricOrderScore} a={numStr(dataA.orderScore, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} b={numStr(dataB.orderScore, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                    <CompareRow th={th} label={t.metricPositive} a={`${numStr(dataA.pos, lang)}%`} b={`${numStr(dataB.pos, lang)}%`} />
                    <CompareRow th={th} label={t.metricNegative} a={`${numStr(dataA.neg, lang)}%`} b={`${numStr(dataB.neg, lang)}%`} />
                    <CompareRow th={th} label={t.colReviews} a={numStr(dataA.reviews, lang)} b={numStr(dataB.reviews, lang)} />
                    <CompareRow th={th} label={t.metricTier} a={`Tier ${digitsStr(dataA.tier, lang)}`} b={`Tier ${digitsStr(dataB.tier, lang)}`} />
                    <CompareRow th={th} label={t.colAlert} a={numStr(dataA.alert, lang)} b={numStr(dataB.alert, lang)} />
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CompareRow({ th, label, a, b }) {
  return (<tr className={`border-b ${th.rowBorder}`}><td className={`py-2.5 ${th.text} font-mono`}>{a}</td><td className={`py-2.5 text-center ${th.textMuted} text-xs`}>{label}</td><td className={`py-2.5 ${th.text} font-mono text-end`}>{b}</td></tr>);
}
function KpiCard({ th, icon: Icon, label, value, sub, accent }) {
  const styles = {
    pink: { bar: "bg-pink-500", text: "text-pink-500", iconBg: "bg-pink-500/10", iconText: "text-pink-500" },
    gray: { bar: "bg-gray-400", text: th.text, iconBg: th.chipBg, iconText: th.textMuted },
    rose: { bar: "bg-rose-400", text: "text-rose-500", iconBg: "bg-rose-500/10", iconText: "text-rose-500" },
    emerald: { bar: "bg-emerald-400", text: "text-emerald-500", iconBg: "bg-emerald-500/10", iconText: "text-emerald-500" },
  }[accent];
  return (
    <div className={`${th.card} border ${th.border} rounded-2xl shadow-sm p-4 relative overflow-hidden`}>
      <div className={`absolute top-0 end-0 w-1 h-full ${styles.bar}`} />
      <div className="flex items-center justify-between mb-3"><div className={`text-xs ${th.textMuted}`}>{label}</div><div className={`w-7 h-7 rounded-lg ${styles.iconBg} flex items-center justify-center`}><Icon className={`w-3.5 h-3.5 ${styles.iconText}`} /></div></div>
      <div className={`text-lg font-bold mb-1 ${styles.text}`}>{value}</div>
      <div className={`text-xs ${th.textMuted}`}>{sub}</div>
    </div>
  );
}
