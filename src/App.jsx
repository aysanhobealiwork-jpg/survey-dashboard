import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { AlertTriangle, Circle, Flame } from "lucide-react";

// یک لینک از "Publish to web" گوگل‌شیت اینجا بذار (فرمت CSV)
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZUqnpDkpLFZOzW-ugkrc11ZtcLMt6AM4ea7ExhBIKPF6TAMKBwExkbs8Hf_JaRhoWtIukhfMz0Fq/pub?gid=0&single=true&output=csv";

const TABS = ["رتبه‌بندی شهرها", "تفکیک مشکلات", "روند زمانی", "مقایسه دوبه‌دو"];

function scoreColor(v, mid = 70) {
  if (v >= mid + 10) return "text-emerald-400";
  if (v >= mid - 10) return "text-amber-400";
  return "text-rose-400";
}

export default function App() {
  const [cities, setCities] = useState([]);
  const [tab, setTab] = useState(0);
  const [sortKey, setSortKey] = useState("deliverySat");

  useEffect(() => {
    fetch(SHEET_CSV_URL)
      .then((res) => res.text())
      .then((csvText) => {
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        const rows = parsed.data.map((r) => ({
          name: r["شهر"],
          deliverySat: Number(r["رضایت ارسال"]),
          orderScore: Number(r["امتیاز سفارش"]),
          pos: Number(r["درصد مثبت"]),
          neu: Number(r["درصد خنثی"]),
          neg: Number(r["درصد منفی"]),
          reviews: Number(r["تعداد نظرات"]),
          alert: Number(r["سیگنال هشدار"]) || 0,
        }));
        setCities(rows);
      })
      .catch((err) => console.error("خطا در خواندن گوگل‌شیت:", err));
  }, []);

  const rows = useMemo(
    () => [...cities].sort((a, b) => b[sortKey] - a[sortKey]),
    [cities, sortKey]
  );

  const kpis = useMemo(() => {
    if (cities.length === 0) return null;
    const worstIssueCity = [...cities].sort((a, b) => b.alert - a.alert)[0];
    const mostReviewed = [...cities].sort((a, b) => b.reviews - a.reviews)[0];
    const lowest = [...cities].sort((a, b) => a.deliverySat - b.deliverySat)[0];
    const highest = [...cities].sort((a, b) => b.deliverySat - a.deliverySat)[0];
    return { worstIssueCity, mostReviewed, lowest, highest };
  }, [cities]);

  if (cities.length === 0) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
        در حال خواندن دیتا از گوگل‌شیت...
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">داشبورد نظرسنجی بعد از سفارش</h1>
            <span className="text-pink-400 font-bold">اسنپ‌فود</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{cities.length} شهر</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
          آخرین به‌روزرسانی: امروز
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <KpiCard label="داغ‌ترین مشکل ارسال" value={kpis.worstIssueCity.name} sub={`${kpis.worstIssueCity.alert} هشدار`} accent="amber" />
        <KpiCard label="پرحجم‌ترین بازخورد" value={kpis.mostReviewed.name} sub={`${kpis.mostReviewed.reviews.toLocaleString("fa-IR")} نظر`} accent="sky" />
        <KpiCard label="پایین‌ترین رضایت ارسال" value={`${kpis.lowest.deliverySat}%`} sub={kpis.lowest.name} accent="rose" />
        <KpiCard label="بالاترین رضایت ارسال" value={`${kpis.highest.deliverySat}%`} sub={kpis.highest.name} accent="emerald" />
        <KpiCard label="شهرهای رصدشده" value={cities.length} sub="در حال جمع‌آوری" accent="slate" />
      </div>

      <div className="flex gap-1 mb-4 border-b border-slate-800">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
              tab === i
                ? "bg-slate-900 text-amber-400 border border-slate-800 border-b-slate-900"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        {tab === 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">رتبه‌بندی شهرها</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                مرتب‌سازی بر اساس
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300"
                >
                  <option value="deliverySat">رضایت ارسال</option>
                  <option value="orderScore">امتیاز سفارش</option>
                  <option value="reviews">تعداد نظرات</option>
                  <option value="alert">هشدار</option>
                </select>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-slate-800">
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
                  <tr key={c.name} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="py-3 text-slate-500">{i + 1}</td>
                    <td className="py-3 text-white font-medium">{c.name}</td>
                    <td className={`py-3 font-mono ${scoreColor(c.deliverySat)}`}>{c.deliverySat}%</td>
                    <td className="py-3 font-mono text-slate-300">★ {c.orderScore.toFixed(2)}</td>
                    <td className="py-3 w-40">
                      <div className="flex h-2 rounded-full overflow-hidden bg-slate-800">
                        <div className="bg-emerald-500" style={{ width: `${c.pos}%` }} />
                        <div className="bg-slate-600" style={{ width: `${c.neu}%` }} />
                        <div className="bg-rose-500" style={{ width: `${c.neg}%` }} />
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 font-mono">{c.reviews.toLocaleString("fa-IR")}</td>
                    <td className="py-3">
                      {c.alert > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded px-2 py-0.5">
                          <AlertTriangle className="w-3 h-3" /> {c.alert}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600 text-sm gap-2">
            <Flame className="w-6 h-6" />
            این بخش («{TABS[tab]}») در نسخه بعدی اضافه می‌شود
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, accent }) {
  const bar = { amber: "bg-amber-400", sky: "bg-sky-400", rose: "bg-rose-400", emerald: "bg-emerald-400", slate: "bg-slate-500" }[accent];
  const text = { amber: "text-amber-400", sky: "text-sky-400", rose: "text-rose-400", emerald: "text-emerald-400", slate: "text-slate-300" }[accent];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="text-xs text-slate-500 mb-2">{label}</div>
      <div className={`text-lg font-bold mb-1 ${text}`}>{value}</div>
      <div className="text-xs text-slate-500 mb-3">{sub}</div>
      <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: "70%" }} />
      </div>
    </div>
  );
}