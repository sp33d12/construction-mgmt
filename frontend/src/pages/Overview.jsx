import { useState, useEffect } from 'react';
import api from '../api/client';
import { useLang } from '../contexts/LangContext';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const STAGE_META = {
  planning:   { ar: 'التخطيط',   en: 'Planning',    fill: '#94a3b8' },
  foundation: { ar: 'الأساسات',  en: 'Foundation',  fill: '#f59e0b' },
  structure:  { ar: 'الهيكل',    en: 'Structure',   fill: '#3b82f6' },
  finishing:  { ar: 'التشطيب',   en: 'Finishing',   fill: '#a855f7' },
  handover:   { ar: 'التسليم',   en: 'Handover',    fill: '#10b981' },
};
const STAGES = ['planning','foundation','structure','finishing','handover'];

function fmtMoney(v) {
  if (v >= 1_000_000_000) return `${(v/1_000_000_000).toFixed(1)} مليار`;
  if (v >= 1_000_000)     return `${(v/1_000_000).toFixed(1)} م`;
  if (v >= 1_000)         return `${(v/1_000).toFixed(0)} ك`;
  return String(Math.round(v));
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart 1 — Donut: Projects by Stage
// ─────────────────────────────────────────────────────────────────────────────
function StagesDonut({ byStage, lang }) {
  const data = STAGES.map(s => ({
    stage: s, ...STAGE_META[s],
    count: parseInt(byStage.find(r => r.stage === s)?.count || 0),
  }));
  const total = data.reduce((s, d) => s + d.count, 0);

  let pct = 0;
  const stops = total > 0
    ? data.filter(d => d.count > 0).map(d => {
        const start = pct;
        pct += (d.count / total) * 100;
        return `${d.fill} ${start.toFixed(1)}% ${pct.toFixed(1)}%`;
      }).join(', ')
    : '#e2e8f0 0% 100%';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-2 h-5 rounded-full bg-blue-500 block" />
        <p className="text-sm font-bold text-slate-700">{lang === 'ar' ? 'مراحل المشاريع' : 'Project Stages'}</p>
      </div>
      <div className="flex items-center gap-6 flex-1">
        {/* Donut */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <div className="w-full h-full rounded-full shadow-inner" style={{ background: `conic-gradient(${stops})` }} />
          <div className="absolute inset-[26px] bg-white rounded-full flex flex-col items-center justify-center shadow">
            <span className="text-2xl font-black text-slate-800 leading-none">{total}</span>
            <span className="text-[9px] text-slate-400 mt-0.5 font-medium">{lang === 'ar' ? 'مشروع' : 'projects'}</span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex-1 space-y-2.5 min-w-0">
          {data.map(d => (
            <div key={d.stage} className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
              <span className="text-xs text-slate-500 flex-1 truncate">{lang === 'ar' ? d.ar : d.en}</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${d.count > 0 ? 'bg-slate-100 text-slate-700' : 'text-slate-300'}`}>
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart 2 — Horizontal bars: Financial Overview
// ─────────────────────────────────────────────────────────────────────────────
function FinanceBars({ funds, contractors, rate, lang }) {
  const received = Math.round(funds.receivedIQD + funds.receivedUSD * rate);
  const pending  = Math.round(funds.pendingIQD  + funds.pendingUSD  * rate);
  const contr    = Math.round(contractors.pendingIQD + contractors.pendingUSD * rate);
  const max      = Math.max(received, pending, contr, 1);

  const bars = [
    { label: lang === 'ar' ? 'أموال مستلمة'      : 'Received Funds',        val: received, pct: (received/max)*100, color: '#10b981', light: '#d1fae5' },
    { label: lang === 'ar' ? 'أموال قيد الانتظار' : 'Pending Funds',         val: pending,  pct: (pending/max)*100,  color: '#f59e0b', light: '#fef3c7' },
    { label: lang === 'ar' ? 'مقاولون (معلق)'    : 'Contractors (pending)', val: contr,    pct: (contr/max)*100,    color: '#ef4444', light: '#fee2e2' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-2 h-5 rounded-full bg-emerald-500 block" />
        <p className="text-sm font-bold text-slate-700">{lang === 'ar' ? 'الوضع المالي' : 'Financial Overview'}</p>
      </div>
      <div className="flex-1 flex flex-col justify-center space-y-5">
        {bars.map(b => (
          <div key={b.label}>
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs text-slate-500 font-medium">{b.label}</span>
              <span className="text-sm font-black text-slate-800">
                {fmtMoney(b.val)} <span className="text-[10px] font-medium text-slate-400">{lang === 'ar' ? 'د.ع' : 'IQD'}</span>
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: b.light }}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.max(b.pct, b.val > 0 ? 4 : 0)}%`, background: b.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart 3 — Status widgets: Warehouse + Salaries
// ─────────────────────────────────────────────────────────────────────────────
function StatusWidgets({ salaries, materials, activeProjects, lang }) {
  const goodPct = materials.total > 0 ? Math.round((materials.total - materials.lowStock) / materials.total * 100) : 100;
  const wStops  = `#10b981 0% ${goodPct}%, ${materials.lowStock > 0 ? '#fca5a5' : '#d1fae5'} ${goodPct}% 100%`;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-2 h-5 rounded-full bg-purple-500 block" />
        <p className="text-sm font-bold text-slate-700">{lang === 'ar' ? 'لمحة عامة' : 'Quick Stats'}</p>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-4">

        {/* Active projects */}
        <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
            {activeProjects}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{lang === 'ar' ? 'مشاريع نشطة' : 'Active Projects'}</p>
            <p className="text-xs text-slate-400">{lang === 'ar' ? 'قيد التنفيذ حالياً' : 'Currently in progress'}</p>
          </div>
        </div>

        {/* Warehouse ring */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
          <div className="relative w-10 h-10 flex-shrink-0">
            <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${wStops})` }} />
            <div className="absolute inset-[7px] bg-white rounded-full flex items-center justify-center">
              <span className="text-[8px] font-black text-slate-700">{goodPct}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">{lang === 'ar' ? 'المخزن' : 'Warehouse'}</p>
            <p className="text-xs text-slate-400">{materials.total} {lang === 'ar' ? 'مادة' : 'items'}</p>
            {materials.lowStock > 0
              ? <p className="text-xs text-red-500 font-semibold">{materials.lowStock} {lang === 'ar' ? 'منخفضة' : 'low'}</p>
              : <p className="text-xs text-emerald-600 font-semibold">{lang === 'ar' ? 'مخزون جيد ✓' : 'Stock OK ✓'}</p>
            }
          </div>
        </div>

        {/* Salaries */}
        <div className={`flex items-center gap-4 p-3 rounded-xl ${salaries.unpaidCount > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${salaries.unpaidCount > 0 ? 'bg-amber-100' : 'bg-emerald-100'}`}>
            {salaries.unpaidCount > 0 ? '⚠️' : '✅'}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{lang === 'ar' ? 'الرواتب' : 'Salaries'}</p>
            {salaries.unpaidCount > 0
              ? <p className="text-xs text-amber-600 font-semibold">{salaries.unpaidCount} {lang === 'ar' ? 'راتب غير مدفوع' : 'unpaid salaries'}</p>
              : <p className="text-xs text-emerald-600 font-semibold">{lang === 'ar' ? 'جميعها مدفوعة' : 'All paid'}</p>
            }
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Overview Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Overview() {
  const { lang } = useLang();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(s => { setStats(s.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date().toLocaleDateString(lang === 'ar' ? 'ar-IQ' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    </div>
  );

  if (!stats) return (
    <div className="text-center py-20 text-slate-400">
      {lang === 'ar' ? 'تعذّر تحميل البيانات' : 'Failed to load data'}
    </div>
  );

  const rate = stats.exchangeRate || 1310;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">{now}</p>
        </div>
        {/* Quick KPI badges */}
        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100">
            🏗 {stats.activeProjects} {lang === 'ar' ? 'نشط' : 'active'}
          </span>
          {stats.materials?.lowStock > 0 && (
            <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 animate-pulse">
              ⚠️ {stats.materials.lowStock} {lang === 'ar' ? 'مخزون منخفض' : 'low stock'}
            </span>
          )}
          {stats.salaries?.unpaidCount > 0 && (
            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100">
              💰 {stats.salaries.unpaidCount} {lang === 'ar' ? 'راتب معلق' : 'unpaid'}
            </span>
          )}
        </div>
      </div>

      {/* ── 3 Charts ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
        <StagesDonut  byStage={stats.projectsByStage || []} lang={lang} />
        <FinanceBars  funds={stats.funds} contractors={stats.contractors} rate={rate} lang={lang} />
        <StatusWidgets salaries={stats.salaries} materials={stats.materials} activeProjects={stats.activeProjects} lang={lang} />
      </div>

    </div>
  );
}
