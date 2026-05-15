import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n';
import Modal from '../components/Modal';
import StageTracker from '../components/StageTracker';

const STAGES = ['planning','foundation','structure','finishing','handover'];
const DEFAULT = { name_ar:'', name_en:'', location:'', engineer_id:'', start_date:'', budget:'', progress:0, stage:'planning', status:'active' };

const STAGE_META = {
  planning:   { ar:'التخطيط',  en:'Planning',    fill:'#94a3b8', bg:'bg-slate-100',   text:'text-slate-600'   },
  foundation: { ar:'الأساسات', en:'Foundation',  fill:'#f59e0b', bg:'bg-amber-100',   text:'text-amber-700'   },
  structure:  { ar:'الهيكل',   en:'Structure',   fill:'#3b82f6', bg:'bg-blue-100',    text:'text-blue-700'    },
  finishing:  { ar:'التشطيب',  en:'Finishing',   fill:'#a855f7', bg:'bg-purple-100',  text:'text-purple-700'  },
  handover:   { ar:'التسليم',  en:'Handover',    fill:'#10b981', bg:'bg-emerald-100', text:'text-emerald-700' },
};

const STATUS_FILTERS = [
  { id: 'all',       label: 'الكل',    icon: null  },
  { id: 'active',    label: 'نشط',     icon: '🟢'  },
  { id: 'completed', label: 'مكتمل',   icon: '✅'  },
  { id: 'paused',    label: 'متوقف',   icon: '⏸'  },
];

const STATUS_DOT = {
  active:    'bg-green-500',
  completed: 'bg-emerald-500',
  paused:    'bg-slate-400',
};

export default function Dashboard() {
  const { canEdit } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();

  const [projects,     setProjects]     = useState([]);
  const [engineers,    setEngineers]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [form,         setForm]         = useState(DEFAULT);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchAll = async () => {
    const [p, u] = await Promise.all([api.get('/projects'), api.get('/users')]);
    setProjects(p.data); setEngineers(u.data); setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditItem(null); setForm(DEFAULT); setShowModal(true); };
  const openEdit   = (e, item) => {
    e.stopPropagation();
    setEditItem(item);
    setForm({ ...item, engineer_id: item.engineer_id||'', budget: item.budget||'', start_date: item.start_date?.slice(0,10)||'' });
    setShowModal(true);
  };
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm(t(lang,'confirmDelete'))) return;
    await api.delete(`/projects/${id}`); fetchAll();
  };
  const handleSubmit = async e => {
    e.preventDefault();
    const data = { ...form, engineer_id:form.engineer_id||null, budget:form.budget||null, start_date:form.start_date||null };
    if (editItem) await api.put(`/projects/${editItem.id}`, data);
    else await api.post('/projects', data);
    setShowModal(false); fetchAll();
  };

  // Compute stats from raw projects array
  const totalCount     = projects.length;
  const activeCount    = projects.filter(p => p.status === 'active').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const pausedCount    = projects.filter(p => p.status === 'paused').length;

  // Apply search + status filter
  const filtered = projects.filter(p => {
    const matchSearch = (
      p.name_ar.includes(search) ||
      p.name_en.toLowerCase().includes(search.toLowerCase()) ||
      (p.location||'').includes(search)
    );
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="text-center py-20 text-slate-400">{t(lang,'loading')}</div>;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-slate-800">{t(lang,'projects')}</h1>
            {/* Inline stat pills */}
            <div className="flex gap-2 flex-wrap">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
                {totalCount} {lang === 'ar' ? 'إجمالي' : 'total'}
              </span>
              {activeCount > 0 && (
                <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
                  🟢 {activeCount} {lang === 'ar' ? 'نشط' : 'active'}
                </span>
              )}
              {completedCount > 0 && (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                  ✅ {completedCount} {lang === 'ar' ? 'مكتمل' : 'done'}
                </span>
              )}
              {pausedCount > 0 && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold border border-slate-200">
                  ⏸ {pausedCount} {lang === 'ar' ? 'متوقف' : 'paused'}
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length} {lang === 'ar' ? 'مشروع معروض' : 'projects shown'}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t(lang,'search')}
            className="w-44 sm:w-56 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          {canEdit && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              <span className="text-lg leading-none">+</span>
              <span className="hidden sm:inline">{t(lang,'add')}</span>
            </button>
          )}
        </div>
      </div>

      {!canEdit && (
        <p className="text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm">
          {t(lang,'viewOnly')}
        </p>
      )}

      {/* ── Status filter chips ─────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
              statusFilter === f.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {f.icon && <span>{f.icon}</span>}
            <span>{lang === 'ar' ? f.label : (f.id === 'all' ? 'All' : f.id.charAt(0).toUpperCase() + f.id.slice(1))}</span>
          </button>
        ))}
      </div>

      {/* ── Projects grid ─────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => {
          const meta = STAGE_META[p.stage] || STAGE_META.planning;
          const statusDot = STATUS_DOT[p.status] || 'bg-slate-400';
          return (
            <div
              key={p.id}
              onClick={() => navigate(`/project/${p.id}`)}
              className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col"
            >
              {/* Stage color strip */}
              <div className="h-1.5 w-full" style={{ background: meta.fill }} />

              <div className="p-4 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-base leading-tight truncate group-hover:text-blue-600 transition-colors">
                      {p.name_ar}
                    </h3>
                    <p className="text-slate-400 text-xs truncate mt-0.5">{p.name_en}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${meta.bg} ${meta.text}`}>
                    {lang==='ar' ? meta.ar : meta.en}
                  </span>
                </div>

                {/* Location */}
                {p.location && (
                  <p className="text-slate-500 text-xs mb-2 flex items-center gap-1">
                    <span>📍</span> {p.location}
                  </p>
                )}

                {/* Engineer name */}
                {p.engineer_name_ar && (
                  <p className="text-slate-500 text-xs mb-2 flex items-center gap-1">
                    <span>👷</span> {p.engineer_name_ar}
                  </p>
                )}

                {/* Start date */}
                {p.start_date && (
                  <p className="text-slate-400 text-xs mb-3 flex items-center gap-1">
                    <span>📅</span> {p.start_date?.slice(0,10)}
                  </p>
                )}

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">{t(lang,'progress')}</span>
                    <span className="font-bold" style={{ color: meta.fill }}>{p.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width:`${p.progress}%`, background: meta.fill }}
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
                    💰 {Number(p.budget).toLocaleString('ar-IQ')} {t(lang,'currency')}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2">
                  {/* Status dot */}
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`} />
                  <span className="text-xs text-blue-600 font-semibold group-hover:underline">
                    {lang==='ar' ? 'فتح المشروع ←' : 'Open Project →'}
                  </span>
                </div>
                {canEdit && (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={e => openEdit(e,p)} className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm transition-all text-xs">✏️</button>
                    <button onClick={e => handleDelete(e,p.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-white hover:shadow-sm transition-all text-xs">🗑️</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <span className="text-5xl">🏗</span>
            <p className="text-lg font-semibold">{t(lang,'noData')}</p>
            {canEdit && statusFilter === 'all' && (
              <button onClick={openCreate} className="mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors">
                + {lang==='ar' ? 'أضف أول مشروع' : 'Add First Project'}
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
