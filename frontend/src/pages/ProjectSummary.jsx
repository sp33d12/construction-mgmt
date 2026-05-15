import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useProject } from '../contexts/ProjectContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n';

const STAGE_META = {
  planning:   { ar: 'التخطيط',  en: 'Planning',   fill: '#94a3b8', bg: 'bg-slate-100',   text: 'text-slate-600'   },
  foundation: { ar: 'الأساسات', en: 'Foundation', fill: '#f59e0b', bg: 'bg-amber-100',   text: 'text-amber-700'   },
  structure:  { ar: 'الهيكل',   en: 'Structure',  fill: '#3b82f6', bg: 'bg-blue-100',    text: 'text-blue-700'    },
  finishing:  { ar: 'التشطيب',  en: 'Finishing',  fill: '#a855f7', bg: 'bg-purple-100',  text: 'text-purple-700'  },
  handover:   { ar: 'التسليم',  en: 'Handover',   fill: '#10b981', bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

const STAGES_ORDER = ['planning', 'foundation', 'structure', 'finishing', 'handover'];

function fmtMoney(v) {
  if (!v || v === 0) return '0';
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} مليار`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)} م`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)} ك`;
  return Number(v).toLocaleString('ar-IQ');
}

// ── Stage progress strip ──────────────────────────────────────────────────────
function StageStrip({ stage, lang }) {
  const current = STAGES_ORDER.indexOf(stage);
  return (
    <div className="flex items-center gap-1">
      {STAGES_ORDER.map((s, i) => {
        const meta = STAGE_META[s];
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${
              done   ? 'bg-blue-500' :
              active ? 'opacity-100' : 'bg-slate-200'
            }`} style={active ? { background: meta.fill } : {}} />
            {i < STAGES_ORDER.length - 1 && <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${done ? 'bg-blue-500' : 'bg-slate-200'}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, onClick }) {
  const colors = {
    blue:    'from-blue-500/10 to-blue-500/5 border-blue-500/20',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
    amber:   'from-amber-500/10 to-amber-500/5 border-amber-500/20',
    red:     'from-red-500/10 to-red-500/5 border-red-500/20',
    purple:  'from-purple-500/10 to-purple-500/5 border-purple-500/20',
    sky:     'from-sky-500/10 to-sky-500/5 border-sky-500/20',
  };
  const iconBg = {
    blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500',
    red: 'bg-red-500', purple: 'bg-purple-500', sky: 'bg-sky-500',
  };
  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
    >
      <div className={`w-11 h-11 ${iconBg[color]} rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
        <p className="text-lg font-black text-slate-800 leading-tight truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Mini financial bar ────────────────────────────────────────────────────────
function FinanceBar({ label, value, total, color, lang }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  const colorMap = {
    emerald: { bar: '#10b981', bg: '#d1fae5' },
    amber:   { bar: '#f59e0b', bg: '#fef3c7' },
    red:     { bar: '#ef4444', bg: '#fee2e2' },
    blue:    { bar: '#3b82f6', bg: '#dbeafe' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-500">{label}</span>
        <span className="font-bold text-slate-700">{fmtMoney(value)} <span className="text-slate-400 font-normal">{lang === 'ar' ? 'د.ع' : 'IQD'}</span></span>
      </div>
      <div className="h-2 rounded-full" style={{ background: c.bg }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%`, background: c.bar }} />
      </div>
    </div>
  );
}

// ── Recent reports list ───────────────────────────────────────────────────────
function RecentReports({ reports, lang }) {
  if (!reports.length) return (
    <p className="text-sm text-slate-400 py-4 text-center">{lang === 'ar' ? 'لا توجد تقارير بعد' : 'No reports yet'}</p>
  );
  return (
    <div className="space-y-2">
      {reports.slice(0, 4).map(r => (
        <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">📋</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">
              {r.accomplished || (lang === 'ar' ? 'تقرير يومي' : 'Daily Report')}
            </p>
            <p className="text-[10px] text-slate-400">{r.report_date?.slice(0, 10)} · {r.worker_count ? `${r.worker_count} ${lang === 'ar' ? 'عامل' : 'workers'}` : ''}</p>
          </div>
          {r.weather && <span className="text-lg flex-shrink-0">{r.weather.split(' ')[0]}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProjectSummary() {
  const project = useProject();
  const { lang } = useLang();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!project?.id) return;
    const qs = `?project_id=${project.id}`;
    Promise.all([
      api.get(`/finance/salaries${qs}`).catch(() => ({ data: [] })),
      api.get(`/finance/funds${qs}`).catch(() => ({ data: [] })),
      api.get(`/finance/contractors${qs}`).catch(() => ({ data: [] })),
      api.get(`/warehouse${qs}`).catch(() => ({ data: [] })),
      api.get(`/reports${qs}`).catch(() => ({ data: [] })),
    ]).then(([sal, funds, con, wh, rep]) => {
      const salaries     = sal.data   || [];
      const fundsData    = funds.data || [];
      const contractors  = con.data   || [];
      const materials    = wh.data    || [];
      const reports      = rep.data   || [];

      // Salaries
      const unpaidSal   = salaries.filter(s => !s.paid);
      const unpaidCount = unpaidSal.length;
      const unpaidIQD   = unpaidSal.filter(s => s.currency !== 'USD').reduce((s, i) => s + Number(i.monthly_salary || 0), 0);

      // Funds
      const receivedIQD = fundsData.filter(f => f.status === 'received' && f.currency !== 'USD').reduce((s, i) => s + Number(i.amount || 0), 0);
      const pendingIQD  = fundsData.filter(f => f.status === 'pending'  && f.currency !== 'USD').reduce((s, i) => s + Number(i.amount || 0), 0);

      // Contractors
      const pendingCon  = contractors.filter(c => c.payment_status === 'pending');
      const pendingConIQD = pendingCon.filter(c => c.currency !== 'USD').reduce((s, i) => s + Number(i.amount || 0), 0);

      // Warehouse
      const lowStock    = materials.filter(m => m.low_stock).length;

      // Reports — sort by date desc
      const sortedRep   = [...reports].sort((a, b) => new Date(b.report_date) - new Date(a.report_date));
      const lastReport  = sortedRep[0];
      const totalWorkers = lastReport?.worker_count || 0;

      setData({ unpaidCount, unpaidIQD, receivedIQD, pendingIQD, pendingConIQD, pendingConCount: pendingCon.length, lowStock, totalMaterials: materials.length, reports: sortedRep, totalReports: reports.length, lastReport, totalWorkers });
      setLoading(false);
    });
  }, [project?.id]);

  if (!project) return <div className="text-center py-20 text-slate-400">{t(lang, 'loading')}</div>;
  if (loading)  return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  const meta = STAGE_META[project.stage] || STAGE_META.planning;
  const budget = Number(project.budget || 0);
  const maxFin = Math.max(budget, data.receivedIQD, data.pendingIQD, 1);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* ── Project header card ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Colour strip */}
        <div className="h-1.5" style={{ background: meta.fill }} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-slate-800 leading-tight">{project.name_ar}</h1>
              {project.name_en && <p className="text-slate-400 text-sm mt-0.5">{project.name_en}</p>}
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-semibold flex-shrink-0 ${meta.bg} ${meta.text}`}>
              {lang === 'ar' ? meta.ar : meta.en}
            </span>
          </div>

          {/* Meta info row */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500 mb-4">
            {project.location     && <span>📍 {project.location}</span>}
            {project.start_date   && <span>📅 {project.start_date.slice(0, 10)}</span>}
            {(project.engineer_name_ar || project.engineer_name) && <span>👷 {project.engineer_name_ar || project.engineer_name}</span>}
            {budget > 0           && <span>💰 {fmtMoney(budget)} {lang === 'ar' ? 'د.ع' : 'IQD'}</span>}
          </div>

          {/* Progress */}
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-500 font-medium">{t(lang, 'progress')}</span>
              <span className="font-black text-base" style={{ color: meta.fill }}>{project.progress}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${project.progress}%`, background: meta.fill }} />
            </div>
          </div>
          <StageStrip stage={project.stage} lang={lang} />
        </div>
      </div>

      {/* ── Quick stats grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          icon="📋" color="blue"
          label={lang === 'ar' ? 'التقارير اليومية' : 'Daily Reports'}
          value={data.totalReports}
          sub={data.lastReport ? `${lang === 'ar' ? 'آخر تقرير' : 'Last'}: ${data.lastReport.report_date?.slice(0, 10)}` : (lang === 'ar' ? 'لا توجد تقارير' : 'No reports')}
          onClick={() => navigate(`/project/${project.id}/reports`)}
        />
        <StatCard
          icon={data.unpaidCount > 0 ? '⚠️' : '✅'} color={data.unpaidCount > 0 ? 'amber' : 'emerald'}
          label={lang === 'ar' ? 'الرواتب غير المدفوعة' : 'Unpaid Salaries'}
          value={data.unpaidCount}
          sub={data.unpaidIQD > 0 ? `${fmtMoney(data.unpaidIQD)} د.ع` : (lang === 'ar' ? 'لا شيء معلق' : 'All clear')}
          onClick={() => navigate(`/project/${project.id}/finance`)}
        />
        <StatCard
          icon={data.lowStock > 0 ? '⚠️' : '🏭'} color={data.lowStock > 0 ? 'red' : 'sky'}
          label={lang === 'ar' ? 'المخزن' : 'Warehouse'}
          value={`${data.totalMaterials} ${lang === 'ar' ? 'مادة' : 'items'}`}
          sub={data.lowStock > 0 ? `${data.lowStock} ${lang === 'ar' ? 'منخفضة' : 'low stock'}` : (lang === 'ar' ? 'المخزون جيد' : 'Stock OK')}
          onClick={() => navigate(`/project/${project.id}/warehouse`)}
        />
        <StatCard
          icon="📥" color="emerald"
          label={lang === 'ar' ? 'أموال مستلمة' : 'Received Funds'}
          value={`${fmtMoney(data.receivedIQD)} د.ع`}
          onClick={() => navigate(`/project/${project.id}/finance`)}
        />
        <StatCard
          icon="🔧" color={data.pendingConCount > 0 ? 'amber' : 'emerald'}
          label={lang === 'ar' ? 'مقاولون معلقون' : 'Pending Contractors'}
          value={data.pendingConCount}
          sub={data.pendingConIQD > 0 ? `${fmtMoney(data.pendingConIQD)} د.ع` : undefined}
          onClick={() => navigate(`/project/${project.id}/finance`)}
        />
        <StatCard
          icon="👷" color="purple"
          label={lang === 'ar' ? 'عمال (آخر تقرير)' : 'Workers (last report)'}
          value={data.totalWorkers || '—'}
          onClick={() => navigate(`/project/${project.id}/reports`)}
        />
      </div>

      {/* ── Bottom two columns ───────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Financial overview */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-5 rounded-full bg-emerald-500 block" />
            <p className="text-sm font-bold text-slate-700">{lang === 'ar' ? 'الوضع المالي' : 'Financial Status'}</p>
          </div>
          <div className="space-y-4">
            {budget > 0 && (
              <FinanceBar label={lang === 'ar' ? 'الميزانية' : 'Budget'} value={budget} total={budget} color="blue" lang={lang} />
            )}
            <FinanceBar label={lang === 'ar' ? 'أموال مستلمة' : 'Received'} value={data.receivedIQD} total={Math.max(budget, data.receivedIQD, data.pendingIQD, 1)} color="emerald" lang={lang} />
            <FinanceBar label={lang === 'ar' ? 'أموال معلقة' : 'Pending Funds'} value={data.pendingIQD} total={Math.max(budget, data.receivedIQD, data.pendingIQD, 1)} color="amber" lang={lang} />
            {data.pendingConIQD > 0 && (
              <FinanceBar label={lang === 'ar' ? 'مقاولون معلقون' : 'Contractors'} value={data.pendingConIQD} total={Math.max(budget, data.receivedIQD, data.pendingIQD, data.pendingConIQD, 1)} color="red" lang={lang} />
            )}
          </div>
        </div>

        {/* Recent reports */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-blue-500 block" />
              <p className="text-sm font-bold text-slate-700">{lang === 'ar' ? 'آخر التقارير' : 'Recent Reports'}</p>
            </div>
            <button
              onClick={() => navigate(`/project/${project.id}/reports`)}
              className="text-xs text-blue-500 hover:text-blue-700 font-medium"
            >
              {lang === 'ar' ? 'عرض الكل ←' : 'View all →'}
            </button>
          </div>
          <RecentReports reports={data.reports} lang={lang} />
        </div>

      </div>
    </div>
  );
}
