import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n';
import Modal from '../components/Modal';
import StageTracker from '../components/StageTracker';

const STAGES = ['planning', 'foundation', 'structure', 'finishing', 'handover'];
const DEFAULT = { name_ar: '', name_en: '', location: '', engineer_id: '', start_date: '', budget: '', progress: 0, stage: 'planning', status: 'active' };

const STAGE_META = {
  planning:   { ar: 'التخطيط',   en: 'Planning',    fill: '#94a3b8', bg: 'bg-slate-100',   text: 'text-slate-600'   },
  foundation: { ar: 'الأساسات',  en: 'Foundation',  fill: '#f59e0b', bg: 'bg-amber-100',   text: 'text-amber-700'   },
  structure:  { ar: 'الهيكل',    en: 'Structure',   fill: '#3b82f6', bg: 'bg-blue-100',    text: 'text-blue-700'    },
  finishing:  { ar: 'التشطيب',   en: 'Finishing',   fill: '#a855f7', bg: 'bg-purple-100',  text: 'text-purple-700'  },
  handover:   { ar: 'التسليم',   en: 'Handover',    fill: '#10b981', bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

// ── Chart 1: Projects by Stage (CSS conic donut) ─────────────────────────────
function StagesChart({ byStage, lang }) {
  const data = STAGES
    .map(s => ({ stage: s, count: parseInt(byStage.find(r => r.stage === s)?.count || 0), ...STAGE_META[s] }))
    .filter(d => d.count > 0);
  const total = data.reduce((s, d) => s + d.count, 0);

  let pct = 0;
  const stops = total > 0
    ? data.map(d => {
        const start = pct;
        pct += (d.count / total) * 100;
        return `${d.fill} ${start.toFixed(1)}% ${pct.toFixed(1)}%`;
      }).join(', ')
    : '#e2e8f0 0% 100%';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
        {lang === 'ar' ? 'مراحل المشاريع' : 'Project Stages'}
      </p>
      <div className="flex items-center gap-5 flex-1">
        {/* Donut */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${stops})` }} />
          <div className="absolute inset-[22px] bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
            <span className="text-2xl font-black text-slate-800 leading-none">{total}</span>
            <span className="text-[9px] text-slate-400 mt-0.5">{lang === 'ar' ? 'مشروع' : 'projects'}</span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex-1 space-y-2 min-w-0">
          {STAGES.map(s => {
            const meta = STAGE_META[s];
            const count = parseInt(byStage.find(r => r.stage === s)?.count || 0);
            return (
              <div key={s} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: meta.fill }} />
                <span className="text-xs text-slate-500 flex-1 truncate">{lang === 'ar' ? meta.ar : meta.en}</span>
                <span className="text-xs font-bold text-slate-700 w-4 text-end">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Chart 2: Financial Overview (horizontal bar chart) ───────────────────────
function FinanceChart({ funds, contractors, rate, lang }) {
  const receivedTotal  = Math.round(funds.receivedIQD + funds.receivedUSD * rate);
  const pendingFunds   = Math.round(funds.pendingIQD  + funds.pendingUSD  * rate);
  const pendingContr   = Math.round(contractors.pendingIQD + contractors.pendingUSD * rate);
  const maxVal = Math.max(receivedTotal, pendingFunds, pendingContr, 1);

  const fmt = v => v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}م`
    : v >= 1_000
    ? `${(v / 1_000).toFixed(0)}ك`
    : String(v);

  const bars = [
    { label: lang === 'ar' ? 'أموال مستلمة'    : 'Received Funds',       value: receivedTotal, color: 'bg-emerald-500', light: 'bg-emerald-50', dot: 'bg-emerald-500' },
    { label: lang === 'ar' ? 'أموال معلقة'      : 'Pending Funds',        value: pendingFunds,  color: 'bg-amber-400',  light: 'bg-amber-50',  dot: 'bg-amber-400'  },
    { label: lang === 'ar' ? 'مقاولون (معلق)'  : 'Contractors (pending)', value: pendingContr,  color: 'bg-red-400',    light: 'bg-red-50',    dot: 'bg-red-400'    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
        {lang === 'ar' ? 'الوضع المالي' : 'Financial Overview'}
      </p>
      <div className="flex-1 flex flex-col justify-center space-y-4">
        {bars.map(b => (
          <div key={b.label}>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${b.dot}`} />
                <span className="text-xs text-slate-500">{b.label}</span>
              </div>
              <span className="text-xs font-bold text-slate-700">{fmt(b.value)} {lang === 'ar' ? 'د.ع' : 'IQD'}</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${b.color} rounded-full transition-all duration-700`}
                style={{ width: `${(b.value / maxVal) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chart 3: Warehouse + Salaries status ─────────────────────────────────────
function StatusChart({ salaries, materials, lang }) {
  const goodStock = materials.total - materials.lowStock;
  const warehousePct = materials.total > 0 ? Math.round((goodStock / materials.total) * 100) : 100;

  const stops = `#10b981 0% ${warehousePct}%, ${materials.lowStock > 0 ? '#fca5a5' : '#e2e8f0'} ${warehousePct}% 100%`;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
        {lang === 'ar' ? 'لمحة سريعة' : 'Quick Status'}
      </p>
      <div className="flex-1 flex flex-col justify-center gap-4">

        {/* Warehouse ring */}
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 flex-shrink-0">
            <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${stops})` }} />
            <div className="absolute inset-[10px] bg-white rounded-full flex items-center justify-center">
              <span className="text-[10px] font-black text-slate-700">{warehousePct}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">{lang === 'ar' ? 'المخزن' : 'Warehouse'}</p>
            <p className="text-xs text-slate-400">{materials.total} {lang === 'ar' ? 'مادة' : 'items'}</p>
            {materials.lowStock > 0
              ? <p className="text-xs text-red-500 font-semibold">{materials.lowStock} {lang === 'ar' ? 'منخفضة' : 'low stock'}</p>
              : <p className="text-xs text-emerald-600 font-semibold">{lang === 'ar' ? 'المخزون جيد' : 'Stock OK'}</p>
            }
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Salaries */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${salaries.unpaidCount > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
            <span className="text-2xl leading-none">{salaries.unpaidCount > 0 ? '⚠️' : '✅'}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">{lang === 'ar' ? 'الرواتب' : 'Salaries'}</p>
            {salaries.unpaidCount > 0
              ? <p className="text-xs text-amber-600 font-semibold">{salaries.unpaidCount} {lang === 'ar' ? 'راتب غير مدفوع' : 'unpaid'}</p>
              : <p className="text-xs text-emerald-600 font-semibold">{lang === 'ar' ? 'جميعها مدفوعة' : 'All paid'}</p>
            }
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { canEdit } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(DEFAULT);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');

  const fetchAll = async () => {
    const [p, u, s] = await Promise.all([
      api.get('/projects'),
      api.get('/users'),
      api.get('/dashboard').catch(() => ({ data: null })),
    ]);
    setProjects(p.data);
    setEngineers(u.data);
    setStats(s.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditItem(null); setForm(DEFAULT); setShowModal(true); };
  const openEdit = (e, item) => {
    e.stopPropagation();
    setEditItem(item);
    setForm({ ...item, engineer_id: item.engineer_id||'', budget: item.budget||'', start_date: item.start_date?.slice(0,10)||'' });
    setShowModal(true);
  };
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm(t(lang, 'confirmDelete'))) return;
    await api.delete(`/projects/${id}`); fetchAll();
  };
  const handleSubmit = async e => {
    e.preventDefault();
    const data = { ...form, engineer_id: form.engineer_id||null, budget: form.budget||null, start_date: form.start_date||null };
    if (editItem) await api.put(`/projects/${editItem.id}`, data);
    else await api.post('/projects', data);
    setShowModal(false); fetchAll();
  };

  const filtered = projects.filter(p =>
    p.name_ar.includes(search) || p.name_en.toLowerCase().includes(search.toLowerCase()) || (p.location||'').includes(search)
  );

  if (loading) return <div className="text-center py-20 text-slate-400">{t(lang, 'loading')}</div>;

  const rate = stats?.exchangeRate || parseFloat(localStorage.getItem('exchangeRate') || '1310');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">{t(lang, 'dashboard')}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length} {lang === 'ar' ? 'مشروع' : 'projects'}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t(lang, 'search')}
            className="w-44 sm:w-56 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          {canEdit && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              <span className="text-lg leading-none">+</span>
              <span className="hidden sm:inline">{t(lang, 'add')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 3 Charts ─────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StagesChart byStage={stats.projectsByStage || []} lang={lang} />
          <FinanceChart funds={stats.funds} contractors={stats.contractors} rate={rate} lang={lang} />
          <StatusChart salaries={stats.salaries} materials={stats.materials} lang={lang} />
        </div>
      )}

      {/* ── Projects grid ─────────────────────────────────────────── */}
      {!canEdit && (
        <p className="text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm">
          {t(lang, 'viewOnly')}
        </p>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => {
          const meta = STAGE_META[p.stage] || STAGE_META.planning;
          return (
            <div
              key={p.id}
              onClick={() => navigate(`/project/${p.id}/reports`)}
              className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
            >
              {/* Color accent strip */}
              <div className="h-1.5 w-full" style={{ background: meta.fill }} />

              <div className="p-4 flex-1 flex flex-col">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-base leading-tight truncate group-hover:text-blue-600 transition-colors">
                      {p.name_ar}
                    </h3>
                    <p className="text-slate-400 text-xs truncate mt-0.5">{p.name_en}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${meta.bg} ${meta.text}`}>
                    {lang === 'ar' ? meta.ar : meta.en}
                  </span>
                </div>

                {/* Location */}
                {p.location && (
                  <p className="text-slate-500 text-xs mb-3 flex items-center gap-1">
                    <span>📍</span> {p.location}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">{t(lang, 'progress')}</span>
                    <span className="font-bold" style={{ color: meta.fill }}>{p.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${p.progress}%`, background: meta.fill }}
                    />
                  </div>
                </div>

                {/* Stage tracker */}
                <div className="mb-3">
                  <StageTracker stage={p.stage} />
                </div>

                {/* Budget */}
                {p.budget && (
                  <p className="text-xs text-slate-500 mt-auto">
                    💰 {Number(p.budget).toLocaleString('ar-IQ')} {t(lang, 'currency')}
                  </p>
                )}
              </div>

              {/* Card footer */}
              <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between bg-slate-50/60">
                <span className="text-xs text-blue-600 font-semibold group-hover:underline">
                  {lang === 'ar' ? 'فتح المشروع ←' : 'Open Project →'}
                </span>
                {canEdit && (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => openEdit(e, p)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm transition-all text-xs"
                    >✏️</button>
                    <button
                      onClick={e => handleDelete(e, p.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-white hover:shadow-sm transition-all text-xs"
                    >🗑️</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <span className="text-5xl">🏗</span>
            <p className="text-lg font-semibold">{t(lang, 'noData')}</p>
            {canEdit && (
              <button onClick={openCreate} className="mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors">
                + {lang === 'ar' ? 'أضف أول مشروع' : 'Add First Project'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ───────────────────────────────────── */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? t(lang,'edit') : t(lang,'add')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t(lang,'projectNameAr')} required><input value={form.name_ar} onChange={e=>setForm(f=>({...f,name_ar:e.target.value}))} className="input" required /></Field>
            <Field label={t(lang,'projectNameEn')} required><input value={form.name_en} onChange={e=>setForm(f=>({...f,name_en:e.target.value}))} className="input" required /></Field>
            <Field label={t(lang,'location')}><input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} className="input" /></Field>
            <Field label={t(lang,'startDate')}><input type="date" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} className="input" /></Field>
            <Field label={t(lang,'budget')}><input type="number" value={form.budget} onChange={e=>setForm(f=>({...f,budget:e.target.value}))} className="input" min="0" /></Field>
            <Field label={t(lang,'progress')+' (%)'}><input type="number" value={form.progress} onChange={e=>setForm(f=>({...f,progress:e.target.value}))} className="input" min="0" max="100" /></Field>
            <Field label={t(lang,'stage')}>
              <select value={form.stage} onChange={e=>setForm(f=>({...f,stage:e.target.value}))} className="input">
                {STAGES.map(s=><option key={s} value={s}>{t(lang,`stages.${s}`)}</option>)}
              </select>
            </Field>
            <Field label={t(lang,'engineer')}>
              <select value={form.engineer_id} onChange={e=>setForm(f=>({...f,engineer_id:e.target.value}))} className="input">
                <option value="">— {lang==='ar'?'اختر':'Select'} —</option>
                {engineers.map(u=><option key={u.id} value={u.id}>{u.full_name_ar||u.full_name}</option>)}
              </select>
            </Field>
            <Field label={t(lang,'status')}>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="input">
                <option value="active">{lang==='ar'?'نشط':'Active'}</option>
                <option value="completed">{lang==='ar'?'مكتمل':'Completed'}</option>
                <option value="paused">{lang==='ar'?'متوقف':'Paused'}</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">{t(lang,'save')}</button>
            <button type="button" onClick={()=>setShowModal(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold">{t(lang,'cancel')}</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

function Field({label,children,required}){
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ms-1">*</span>}
      </label>
      {children}
    </div>
  );
}
