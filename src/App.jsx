import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  AlertTriangle,
  Circle,
  Flame,
  TrendingDown,
  TrendingUp,
  MessageCircle,
  Building2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const SHEET_CITIES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZUqnpDkpLFZOzW-ugkrc11ZtcLMt6AM4ea7ExhBIKPF6TAMKBwExkbs8Hf_JaRhoWtIukhfMz0Fq/pub?gid=0&single=true&output=csv";
const SHEET_TAGS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZUqnpDkpLFZOzW-ugkrc11ZtcLMt6AM4ea7ExhBIKPF6TAMKBwExkbs8Hf_JaRhoWtIukhfMz0Fq/pub?gid=1012171845&single=true&output=csv";
const SHEET_CATEGORIES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZUqnpDkpLFZOzW-ugkrc11ZtcLMt6AM4ea7ExhBIKPF6TAMKBwExkbs8Hf_JaRhoWtIukhfMz0Fq/pub?gid=1153249344&single=true&output=csv";
const SHEET_COMMENTS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZUqnpDkpLFZOzW-ugkrc11ZtcLMt6AM4ea7ExhBIKPF6TAMKBwExkbs8Hf_JaRhoWtIukhfMz0Fq/pub?gid=1000952147&single=true&output=csv";
const SHEET_DAILY_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZUqnpDkpLFZOzW-ugkrc11ZtcLMt6AM4ea7ExhBIKPF6TAMKBwExkbs8Hf_JaRhoWtIukhfMz0Fq/pub?gid=1628769736&single=true&output=csv";
const SHEET_DAILY_ISSUES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZUqnpDkpLFZOzW-ugkrc11ZtcLMt6AM4ea7ExhBIKPF6TAMKBwExkbs8Hf_JaRhoWtIukhfMz0Fq/pub?gid=1058088689&single=true&output=csv";
const TABS = ["رتبه‌بندی شهرها", "تفکیک مشکلات", "روند زمانی", "مقایسه دوبه‌دو"];
const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const YEARS = Array.from({ length: 11 }, (_, i) => 1395 + i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const CATEGORY_COLORS = {
  "عملکرد رستوران": "bg-rose-400",
  "دلیوری": "bg-pink-400",
  "پشتیبانی": "bg-violet-400",
  "عملکرد پلتفرم": "bg-amber-400",
  "پیدا نکردن رستوران موردنظر": "bg-emerald-400",
};
const ISSUE_LINE_COLORS = ["#ec4899", "#f43f5e", "#f59e0b", "#8b5cf6", "#10b981"];

// --- Persian digit helpers (used EVERYWHERE a number/date is shown) ---
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
function faStr(input) {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[d]);
}
function fa(n, opts) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return Number(n).toLocaleString("fa-IR", opts);
}
function faFixed(n, digits = 2) {
  return fa(n, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function scoreColor(v, mid = 70) {
  if (v >= mid + 10) return "text-emerald-600";
  if (v >= mid - 10) return "text-amber-600";
  return "text-rose-600";
}
function shortDate(d) {
  return faStr(d ? d.slice(5) : d);
}
function fetchCsv(url) {
  return fetch(url)
    .then((res) => res.text())
    .then((csvText) => Papa.parse(csvText, { header: true, skipEmptyLines: true }).data);
}

function jalaliToGregorian(jy, jm, jd) {
  jy = jy + 1595;
  let days = -355668 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const salA = [0, 31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 1; gm <= 12; gm++) {
    if (gd <= salA[gm]) break;
    gd -= salA[gm];
  }
  return new Date(gy, gm - 1, gd);
}

function FilterBar({ range, setRange, preset, setPreset, maxDataDate }) {
  const applyPreset = (key, months) => {
    setPreset(key);
    if (key === "all") {
      setRange({ fromY: 1395, fromM: 1, fromD: 1, toY: 1405, toM: 12, toD: 29 });
      return;
    }
    const to = maxDataDate || new Date();
    const from = new Date(to);
    from.setMonth(from.getMonth() - months);
    setRange({ fromY: 1395, fromM: 1, fromD: 1, toY: 1405, toM: 12, toD: 29, gregFrom: from, gregTo: to });
  };
  const setField = (field, value) => {
    setPreset(null);
    setRange((r) => ({ ...r, [field]: Number(value), gregFrom: undefined, gregTo: undefined }));
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-4 py-3 mb-4 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="font-medium text-gray-700">بازه‌ی تحلیل</span>
        <span>از</span>
        <select value={range.fromY} onChange={(e) => setField("fromY", e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-1.5 py-1">
          {YEARS.map((y) => <option key={y} value={y}>{faStr(y)}</option>)}
        </select>
        <select value={range.fromM} onChange={(e) => setField("fromM", e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-1.5 py-1">
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select value={range.fromD} onChange={(e) => setField("fromD", e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-1.5 py-1">
          {DAYS.map((d) => <option key={d} value={d}>{faStr(d)}</option>)}
        </select>
        <span>تا</span>
        <select value={range.toY} onChange={(e) => setField("toY", e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-1.5 py-1">
          {YEARS.map((y) => <option key={y} value={y}>{faStr(y)}</option>)}
        </select>
        <select value={range.toM} onChange={(e) => setField("toM", e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-1.5 py-1">
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select value={range.toD} onChange={(e) => setField("toD", e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-1.5 py-1">
          {DAYS.map((d) => <option key={d} value={d}>{faStr(d)}</option>)}
        </select>
        <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 mr-1" />
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => applyPreset("3m", 3)} className={`px-3 py-1.5 text-xs rounded-full ${preset === "3m" ? "bg-pink-50 text-pink-600 font-medium" : "text-gray-500 hover:bg-gray-50"}`}>۳ ماه</button>
        <button onClick={() => applyPreset("6m", 6)} className={`px-3 py-1.5 text-xs rounded-full ${preset === "6m" ? "bg-pink-50 text-pink-600 font-medium" : "text-gray-500 hover:bg-gray-50"}`}>۶ ماه</button>
        <button onClick={() => applyPreset("12m", 12)} className={`px-3 py-1.5 text-xs rounded-full ${preset === "12m" ? "bg-pink-50 text-pink-600 font-medium" : "text-gray-500 hover:bg-gray-50"}`}>۱۲ ماه</button>
        <button onClick={() => applyPreset("all", 0)} className={`px-3 py-1.5 text-xs rounded-full ${preset === "all" ? "bg-pink-50 text-pink-600 font-medium" : "text-gray-500 hover:bg-gray-50"}`}>کل</button>
      </div>
    </div>
  );
}

export default function App() {
  const [cities, setCities] = useState([]);
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [daily, setDaily] = useState([]);
  const [dailyIssues, setDailyIssues] = useState([]);
  const [tab, setTab] = useState(0);
  const [sortKey, setSortKey] = useState("deliverySat");
  const [cityA, setCityA] = useState("");
  const [cityB, setCityB] = useState("");
  const [preset, setPreset] = useState("all");
  const [range, setRange] = useState({ fromY: 1395, fromM: 1, fromD: 1, toY: 1405, toM: 12, toD: 29 });

  useEffect(() => {
    fetchCsv(SHEET_CITIES_URL)
      .then((data) => {
        const parsed = data.map((r) => ({
          name: r["شهر"],
          deliverySat: Number(r["رضایت ارسال"]),
          orderScore: Number(r["امتیاز سفارش"]),
          pos: Number(r["درصد مثبت"]),
          neu: Number(r["درصد خنثی"]),
          neg: Number(r["درصد منفی"]),
          reviews: Number(r["تعداد نظرات"]),
          alert: Number(r["سیگنال هشدار"]) || 0,
        }));
        setCities(parsed);
        const byReviews = [...parsed].sort((a, b) => b.reviews - a.reviews);
        if (byReviews[0]) setCityA(byReviews[0].name);
        if (byReviews[1]) setCityB(byReviews[1].name);
      })
      .catch((err) => console.error("خطا در خواندن شیت شهرها:", err));

    fetchCsv(SHEET_TAGS_URL)
      .then((data) => setTags(data.map((r) => ({ label: r["label"], category: r["category"], subcode: r["subcode"], count: Number(r["تعداد"]) })).filter((t) => t.label)))
      .catch((err) => console.error("خطا در خواندن شیت Tags:", err));

    fetchCsv(SHEET_CATEGORIES_URL)
      .then((data) => setCategories(data.map((r) => ({ category: r["دسته"], count: Number(r["تعداد"]) })).filter((c) => c.category)))
      .catch((err) => console.error("خطا در خواندن شیت Categories:", err));

    fetchCsv(SHEET_COMMENTS_URL)
      .then((data) => setComments(data.map((r) => ({
        date: (r["تاریخ"] || "").slice(0, 10),
        city: r["شهر"],
        text: r["نظر"],
        tags: (r["برچسب‌ها"] || "").split("،").map((t) => t.trim()).filter(Boolean),
      })).filter((c) => c.text)))
      .catch((err) => console.error("خطا در خواندن شیت Comments:", err));

    fetchCsv(SHEET_DAILY_URL)
      .then((data) => setDaily(data.map((r) => ({
        date: r["تاریخ"],
        reviews: Number(r["تعداد نظرات"]),
        avgScore: Number(r["میانگین امتیاز"]),
        positive: Number(r["مثبت"]),
        negative: Number(r["منفی"]),
      }))))
      .catch((err) => console.error("خطا در خواندن شیت Daily:", err));

    fetchCsv(SHEET_DAILY_ISSUES_URL)
      .then((data) => setDailyIssues(data))
      .catch((err) => console.error("خطا در خواندن شیت DailyIssues:", err));
  }, []);

  const maxDataDate = useMemo(() => {
    if (daily.length === 0) return null;
    return new Date(Math.max(...daily.map((d) => new Date(d.date).getTime())));
  }, [daily]);

  const { fromDate, toDate } = useMemo(() => {
    if (range.gregFrom && range.gregTo) return { fromDate: range.gregFrom, toDate: range.gregTo };
    return {
      fromDate: jalaliToGregorian(range.fromY, range.fromM, range.fromD),
      toDate: jalaliToGregorian(range.toY, range.toM, range.toD),
    };
  }, [range]);

  const filteredDaily = useMemo(
    () => daily.filter((d) => { const t = new Date(d.date).getTime(); return t >= fromDate.getTime() && t <= toDate.getTime(); }),
    [daily, fromDate, toDate]
  );
  const filteredDailyIssues = useMemo(
    () => dailyIssues.filter((d) => { const t = new Date(d["تاریخ"]).getTime(); return t >= fromDate.getTime() && t <= toDate.getTime(); }),
    [dailyIssues, fromDate, toDate]
  );

  const rows = useMemo(() => [...cities].sort((a, b) => b[sortKey] - a[sortKey]), [cities, sortKey]);

  const kpis = useMemo(() => {
    if (cities.length === 0) return null;
    const worstIssueCity = [...cities].sort((a, b) => b.alert - a.alert)[0];
    const mostReviewed = [...cities].sort((a, b) => b.reviews - a.reviews)[0];
    const lowest = [...cities].sort((a, b) => a.deliverySat - b.deliverySat)[0];
    const highest = [...cities].sort((a, b) => b.deliverySat - a.deliverySat)[0];
    return { worstIssueCity, mostReviewed, lowest, highest };
  }, [cities]);

  const topTags = useMemo(() => [...tags].sort((a, b) => b.count - a.count).slice(0, 10), [tags]);
  const maxTopTagCount = useMemo(() => Math.max(1, ...topTags.map((t) => t.count)), [topTags]);
  const allTagsSorted = useMemo(() => [...tags].sort((a, b) => b.count - a.count), [tags]);
  const maxAllTagCount = useMemo(() => Math.max(1, ...allTagsSorted.map((t) => t.count)), [allTagsSorted]);
  const issueLineKeys = useMemo(() => (dailyIssues.length > 0 ? Object.keys(dailyIssues[0]).filter((k) => k !== "تاریخ") : []), [dailyIssues]);

  const dataA = useMemo(() => cities.find((c) => c.name === cityA), [cities, cityA]);
  const dataB = useMemo(() => cities.find((c) => c.name === cityB), [cities, cityB]);
  const radarData = useMemo(() => {
    if (!dataA || !dataB) return [];
    const alertScore = (c) => Math.max(0, 100 - (c.alert / Math.max(1, c.reviews)) * 1000);
    return [
      { metric: "رضایت ارسال", A: dataA.deliverySat, B: dataB.deliverySat },
      { metric: "امتیاز سفارش", A: Math.round(dataA.orderScore * 20), B: Math.round(dataB.orderScore * 20) },
      { metric: "درصد مثبت", A: dataA.pos, B: dataB.pos },
      { metric: "کم‌بودن نارضایتی", A: 100 - dataA.neg, B: 100 - dataB.neg },
      { metric: "کم‌بودن هشدار", A: Math.round(alertScore(dataA)), B: Math.round(alertScore(dataB)) },
    ];
  }, [dataA, dataB]);

  if (cities.length === 0) {
    return <div dir="rtl" className="min-h-screen bg-white text-gray-400 flex items-center justify-center">در حال خواندن دیتا از گوگل‌شیت...</div>;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-600 flex items-center justify-center text-white font-bold text-sm">اف</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-gray-900">داشبورد نظرسنجی بعد از سفارش</h1>
                <span className="text-pink-600 font-bold text-base">اسنپ‌فود</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{faStr(cities.length)} شهر · داده‌ها روزانه به‌روزرسانی می‌شوند</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
            <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
            آخرین به‌روزرسانی: امروز
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-5 gap-4 mb-6">
          <KpiCard icon={AlertTriangle} label="داغ‌ترین مشکل ارسال" value={kpis.worstIssueCity.name} sub={`${fa(kpis.worstIssueCity.alert)} هشدار`} accent="pink" />
          <KpiCard icon={MessageCircle} label="پرحجم‌ترین بازخورد" value={kpis.mostReviewed.name} sub={`${fa(kpis.mostReviewed.reviews)} نظر`} accent="gray" />
          <KpiCard icon={TrendingDown} label="پایین‌ترین رضایت ارسال" value={`${fa(kpis.lowest.deliverySat)}%`} sub={kpis.lowest.name} accent="rose" />
          <KpiCard icon={TrendingUp} label="بالاترین رضایت ارسال" value={`${fa(kpis.highest.deliverySat)}%`} sub={kpis.highest.name} accent="emerald" />
          <KpiCard icon={Building2} label="شهرهای رصدشده" value={fa(cities.length)} sub="در حال جمع‌آوری" accent="gray" />
        </div>

        <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1 mb-4">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className={`px-4 py-1.5 text-sm rounded-full transition-colors ${tab === i ? "bg-white text-pink-600 font-medium shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t}
            </button>
          ))}
        </div>

        <FilterBar range={range} setRange={setRange} preset={preset} setPreset={setPreset} maxDataDate={maxDataDate} />

        {tab === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">رتبه‌بندی شهرها</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                مرتب‌سازی بر اساس
                <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700">
                  <option value="deliverySat">رضایت ارسال</option>
                  <option value="orderScore">امتیاز سفارش</option>
                  <option value="reviews">تعداد نظرات</option>
                  <option value="alert">هشدار</option>
                </select>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gray-100">
                  <th className="text-right py-2 font-normal">#</th>
                  <th className="text-right py-2 font-normal">شهر</th>
                  <th className="text-right py-2 font-normal">رضایت ارسال</th>
                  <th className="text-right py-2 font-normal">امتیاز سفارش</th>
                  <th className="text-right py-2 font-normal">توزیع احساسات کامنت‌ها</th>
                  <th className="text-right py-2 font-normal">تعداد نظرات</th>
                  <th className="text-right py-2 font-normal">سیگنال هشدار</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => (
                  <tr key={c.name} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                    <td className="py-3 text-gray-400">{faStr(i + 1)}</td>
                    <td className="py-3 text-gray-900 font-medium">{c.name}</td>
                    <td className={`py-3 font-mono ${scoreColor(c.deliverySat)}`}>{fa(c.deliverySat)}%</td>
                    <td className="py-3 font-mono text-gray-700">★ {faFixed(c.orderScore, 2)}</td>
                    <td className="py-3 w-40">
                      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                        <div className="bg-emerald-400" style={{ width: `${c.pos}%` }} />
                        <div className="bg-gray-300" style={{ width: `${c.neu}%` }} />
                        <div className="bg-rose-400" style={{ width: `${c.neg}%` }} />
                      </div>
                    </td>
                    <td className="py-3 text-gray-500 font-mono">{fa(c.reviews)}</td>
                    <td className="py-3">
                      {c.alert > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-full px-2 py-0.5">
                          <AlertTriangle className="w-3 h-3" /> {fa(c.alert)}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-1">مشکلات نظرسنجی — نمای کلی</h2>
              <p className="text-xs text-gray-400 mb-4">پرتکرارترین مشکلات در همه‌ی شهرها</p>
              <div className="space-y-2.5">
                {topTags.map((t) => (
                  <div key={t.subcode} className="flex items-center gap-3">
                    <div className="w-16 shrink-0 text-xs text-gray-500 font-mono">{fa(t.count)}</div>
                    <div className="flex-1 h-6 bg-gray-50 rounded-md overflow-hidden">
                      <div className={`h-full rounded-md ${CATEGORY_COLORS[t.category] || "bg-gray-400"}`} style={{ width: `${(t.count / maxTopTagCount) * 100}%` }} />
                    </div>
                    <div className="w-64 shrink-0 text-sm text-gray-700">{t.label} <span className="text-gray-400">({t.category})</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-4">دسته‌بندی مشکلات</h2>
                <div className="space-y-3">
                  {categories.map((c) => (
                    <div key={c.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[c.category] || "bg-gray-400"}`} />
                        <span className="text-sm text-gray-700">{c.category}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 font-mono">{fa(c.count)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-4">تگ‌های مشکل — اسنپ‌فود</h2>
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {allTagsSorted.map((t) => (
                    <div key={t.subcode} className="flex items-center gap-2">
                      <div className="w-12 shrink-0 text-xs text-gray-500 font-mono">{fa(t.count)}</div>
                      <div className="flex-1 h-5 bg-gray-50 rounded-md overflow-hidden">
                        <div className={`h-full rounded-md ${CATEGORY_COLORS[t.category] || "bg-gray-400"}`} style={{ width: `${(t.count / maxAllTagCount) * 100}%` }} />
                      </div>
                      <div className="w-40 shrink-0 text-xs text-gray-700">{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-1">نمونه نظرات منفی — اسنپ‌فود</h2>
              <p className="text-xs text-gray-400 mb-4">آخرین نظرات منفی ثبت‌شده به همراه برچسب‌های مرتبط</p>
              <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
                {comments.map((c, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-400">{c.city}</span>
                      <span className="text-xs text-gray-300 font-mono">{faStr(c.date)}</span>
                    </div>
                    <p className="text-sm text-gray-800 mb-2">{c.text}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-full px-2 py-0.5">{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-1">حجم بازخورد</h2>
                <p className="text-xs text-gray-400 mb-4">تعداد نظرات ثبت‌شده در هر روز</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={filteredDaily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => faStr(v)} />
                    <Tooltip labelFormatter={shortDate} formatter={(v) => faStr(v)} />
                    <Bar dataKey="reviews" name="تعداد نظرات" fill="#f472b6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-1">روند امتیاز</h2>
                <p className="text-xs text-gray-400 mb-4">میانگین امتیاز سفارش در هر روز</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={filteredDaily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => faStr(v)} />
                    <Tooltip labelFormatter={shortDate} formatter={(v) => faStr(v)} />
                    <Line type="monotone" dataKey="avgScore" name="میانگین امتیاز" stroke="#ec4899" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-1">روند احساسات</h2>
              <p className="text-xs text-gray-400 mb-4">تعداد پاسخ‌های مثبت / منفی در هر روز</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={filteredDaily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => faStr(v)} />
                  <Tooltip labelFormatter={shortDate} formatter={(v) => faStr(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="positive" name="مثبت" stroke="#10b981" fill="#10b98122" strokeWidth={2} />
                  <Area type="monotone" dataKey="negative" name="منفی" stroke="#f43f5e" fill="#f43f5e22" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-1">روند مشکلات</h2>
              <p className="text-xs text-gray-400 mb-4">۵ مشکل پرتکرار در طول زمان</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={filteredDailyIssues}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="تاریخ" tickFormatter={shortDate} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => faStr(v)} />
                  <Tooltip labelFormatter={shortDate} formatter={(v) => faStr(v)} />
                  <Legend />
                  {issueLineKeys.map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={ISSUE_LINE_COLORS[i % ISSUE_LINE_COLORS.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-sm text-gray-500">مقایسه</span>
                <select value={cityA} onChange={(e) => setCityA(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-pink-600 font-medium">
                  {cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <span className="text-sm text-gray-500">در برابر</span>
                <select value={cityB} onChange={(e) => setCityB(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 font-medium">
                  {cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              {dataA && dataB && (
                <div className="grid grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#f3f4f6" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <PolarRadiusAxis tick={{ fontSize: 10, fill: "#d1d5db" }} domain={[0, 100]} tickFormatter={(v) => faStr(v)} />
                      <Radar name={cityA} dataKey="A" stroke="#ec4899" fill="#ec489933" strokeWidth={2} />
                      <Radar name={cityB} dataKey="B" stroke="#6b7280" fill="#6b728033" strokeWidth={2} />
                      <Legend />
                      <Tooltip formatter={(v) => faStr(v)} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <table className="w-full text-sm self-center">
                    <thead>
                      <tr className="text-gray-400 text-xs border-b border-gray-100">
                        <th className="text-right py-2 font-normal">{cityA}</th>
                        <th className="text-center py-2 font-normal">متریک</th>
                        <th className="text-left py-2 font-normal">{cityB}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <CompareRow label="رضایت ارسال" a={`${fa(dataA.deliverySat)}%`} b={`${fa(dataB.deliverySat)}%`} />
                      <CompareRow label="امتیاز سفارش" a={faFixed(dataA.orderScore, 2)} b={faFixed(dataB.orderScore, 2)} />
                      <CompareRow label="درصد مثبت" a={`${fa(dataA.pos)}%`} b={`${fa(dataB.pos)}%`} />
                      <CompareRow label="درصد منفی" a={`${fa(dataA.neg)}%`} b={`${fa(dataB.neg)}%`} />
                      <CompareRow label="تعداد نظرات" a={fa(dataA.reviews)} b={fa(dataB.reviews)} />
                      <CompareRow label="سیگنال هشدار" a={fa(dataA.alert)} b={fa(dataB.alert)} />
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CompareRow({ label, a, b }) {
  return (
    <tr className="border-b border-gray-50">
      <td className="py-2.5 text-gray-900 font-mono">{a}</td>
      <td className="py-2.5 text-center text-gray-400 text-xs">{label}</td>
      <td className="py-2.5 text-gray-700 font-mono text-left">{b}</td>
    </tr>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  const styles = {
    pink: { bar: "bg-pink-500", text: "text-pink-600", iconBg: "bg-pink-50", iconText: "text-pink-600" },
    gray: { bar: "bg-gray-400", text: "text-gray-700", iconBg: "bg-gray-100", iconText: "text-gray-500" },
    rose: { bar: "bg-rose-400", text: "text-rose-600", iconBg: "bg-rose-50", iconText: "text-rose-600" },
    emerald: { bar: "bg-emerald-400", text: "text-emerald-600", iconBg: "bg-emerald-50", iconText: "text-emerald-600" },
  }[accent];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-1 h-full ${styles.bar}`} />
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-400">{label}</div>
        <div className={`w-7 h-7 rounded-lg ${styles.iconBg} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${styles.iconText}`} />
        </div>
      </div>
      <div className={`text-lg font-bold mb-1 ${styles.text}`}>{value}</div>
      <div className="text-xs text-gray-400">{sub}</div>
    </div>
  );
}
