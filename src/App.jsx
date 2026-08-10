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

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLZUqnpDkpLFZOzW-ugkrc11ZtcLMt6AM4ea7ExhBIKPF6TAMKBwExkbs8Hf_JaRhoWtIukhfMz0Fq/pub?gid=0&single=true&output=csv";

const TABS = ["رتبه‌بندی شهرها", "تفکیک مشکلات", "روند زمانی", "مقایسه دوبه‌دو"];

function scoreColor(v, mid = 70) {
  if (v >= mid + 10) return "text-emerald-600";
  if (v >= mid - 10) return "text-amber-600";
  return "text-rose-600";
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
      <div dir="rtl" className="min-h-screen bg-white text-gray-400 flex items-center justify-center">
        در حال خواندن دیتا از گوگل‌شیت...
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-600 flex items-center justify-center text-white font-bold text-sm">
              اف
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-gray-900">داشبورد نظرسنجی بعد از سفارش</h1>
                <span className="text-pink-600 font-bold text-base">اسنپ‌فود</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{cities.length} شهر · داده‌ها روزانه به‌روزرسانی می‌شوند</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
            <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
            آخرین به‌روزرسانی: امروز
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* KPI row */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <KpiCard icon={AlertTriangle} label="داغ‌ترین مشکل ارسال" value={kpis.worstIssueCity.name} sub={`${kpis.worstIssueCity.alert} هشدار`} accent="pink" />
          <KpiCard icon={MessageCircle} label="پرحجم‌ترین بازخورد" value={kpis.mostReviewed.name} sub={`${kpis.mostReviewed.reviews.toLocaleString("fa-IR")} نظر`} accent="gray" />
          <KpiCard icon={TrendingDown} label="پایین‌ترین رضایت ارسال" value={`${kpis.lowest.deliverySat}%`} sub={kpis.lowest.name} accent="rose" />
          <KpiCard icon={TrendingUp} label="بالاترین رضایت ارسال" value={`${kpis.highest.deliverySat}%`} sub={kpis.highest.name} accent="emerald" />
          <KpiCard icon={Building2} label="شهرهای رصدشده" value={cities.length} sub="در حال جمع‌آوری" accent="gray" />
        </div>

        {/* Tabs (segmented pill control) */}
        <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1 mb-4">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                tab === i
                  ? "bg-white text-pink-600 font-medium shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          {tab === 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900">رتبه‌بندی شهرها</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  مرتب‌سازی بر اساس
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700"
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
                      <td className="py-3 text-gray-400">{i + 1}</td>
                      <td className="py-3 text-gray-900 font-medium">{c.name}</td>
                      <td className={`py-3 font-mono ${scoreColor(c.deliverySat)}`}>{c.deliverySat}%</td>
                      <td className="py-3 font-mono text-gray-700">★ {c.orderScore.toFixed(2)}</td>
                      <td className="py-3 w-40">
                        <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                          <div className="bg-emerald-400" style={{ width: `${c.pos}%` }} />
                          <div className="bg-gray-300" style={{ width: `${c.neu}%` }} />
                          <div className="bg-rose-400" style={{ width: `${c.neg}%` }} />
                        </div>
                      </td>
                      <td className="py-3 text-gray-500 font-mono">{c.reviews.toLocaleString("fa-IR")}</td>
                      <td className="py-3">
                        {c.alert > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-full px-2 py-0.5">
                            <AlertTriangle className="w-3 h-3" /> {c.alert}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300 text-sm gap-2">
              <Flame className="w-6 h-6" />
              این بخش («{TABS[tab]}») در نسخه بعدی اضافه می‌شود
            </div>
          )}
        </div>
      </div>
    </div>
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
