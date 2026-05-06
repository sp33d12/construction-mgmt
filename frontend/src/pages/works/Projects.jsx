import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { t } from '../../i18n';
import Modal from '../../components/Modal';
import StageTracker from '../../components/StageTracker';

const STAGES = ['planning', 'foundation', 'structure', 'finishing', 'handover'];
const DEFAULT = { name_ar: '', name_en: '', location: '', engineer_id: '', start_date: '', budget: '', progress: 0, stage: 'planning', status: 'active' };

export default function Projects() {
  const { canEdit } = useAuth();
  const { lang } = useLang();
  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(DEFAULT);
  const [detailProject, setDetailProject] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [search, setSearch] = useState('');

  const fetch = async () => {
    const [p, u] = await Promise.all([api.get('/projects'), api.get('/users')]);
    setProjects(p.data);
    setEngineers(u.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditItem(null); setForm(DEFAULT); setShowModal(true); };
  const openEdit = item => { setEditItem(item); setForm({ ...item, engineer_id: item.engineer_id || '', budget: item.budget || '', start_date: item.start_date?.slice(0,10) || '' }); setShowModal(true); };

  const handleSubmit = async e => {
    e.preventDefault();
    const data = { ...form, engineer_id: form.engineer_id || null, budget: form.budget || null, start_date: form.start_date || null };
    if (editItem) await api.put(`/projects/${editItem.id}`, data);
    else await api.post('/projects', data);
    setShowModal(false);
    fetch();
  };

  const handleDelete = async id => {
    if (!confirm(t(lang, 'confirmDelete'))) return;
    await api.delete(`/projects/${id}`);
    fetch();
  };

  const openDetail = async p => {
    const { data } = await api.get(`/projects/${p.id}`);
    setDetailProject(data);
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    await api.post(`/projects/${detailProject.id}/tasks`, { task_name: newTask });
    setNewTask('');
    const { data } = await api.get(`/projects/${detailProject.id}`);
    setDetailProject(data);
  };

  const toggleTask = async (task) => {
    await api.put(`/projects/${detailProject.id}/tasks/${task.id}`, { completed: !task.completed });
    const { data } = await api.get(`/projects/${detailProject.id}`);
    setDetailProject(data);
  };

  const deleteTask = async (taskId) => {
    await api.delete(`/projects/${detailProject.id}/tasks/${taskId}`);
    const { data } = await api.get(`/projects/${detailProject.id}`);
    setDetailProject(data);
  };

  const filtered = projects.filter(p =>
    p.name_ar.includes(search) || p.name_en.toLowerCase().includes(search.toLowerCase()) || (p.location || '').includes(search)
  );

  const stageColors = { planning:'bg-slate-100 text-slate-600', foundation:'bg-amber-100 text-amber-700', structure:'bg-blue-100 text-blue-700', finishing:'bg-purple-100 text-purple-700', handover:'bg-emerald-100 text-emerald-700' };

  if (loading) return <div className="text-center py-20 text-slate-400">{t(lang, 'loading')}</div>;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t(lang, 'search')} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm" />
        {canEdit && (
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">
            <span>+</span> {t(lang, 'add')}
          </button>
        )}
      </div>

      {!canEdit && <p className="text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm">{t(lang, 'viewOnly')}</p>}

      {/* Cards grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{p.name_ar}</h3>
                  <p className="text-slate-400 text-xs truncate">{p.name_en}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ms-2 ${stageColors[p.stage]}`}>
                  {t(lang, `stages.${p.stage}`)}
                </span>
              </div>

              {p.location && <p className="text-slate-500 text-sm mb-3">📍 {p.location}</p>}

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{t(lang, 'progress')}</span>
                  <span className="font-bold text-blue-600">{p.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                </div>
              </div>

              {/* Stage Tracker */}
              <div className="mb-3"><StageTracker stage={p.stage} /></div>

              {p.budget && (
                <p className="text-sm text-slate-500">
                  💰 {Number(p.budget).toLocaleString('ar-IQ')} {t(lang, 'currency')}
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 px-4 py-3 flex gap-2">
              <button onClick={() => openDetail(p)} className="flex-1 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                {lang === 'ar' ? 'التفاصيل' : 'Details'}
              </button>
              {canEdit && (
                <>
                  <button onClick={() => openEdit(p)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">✏️</button>
                  <button onClick={() => handleDelete(p.id)} className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">🗑️</button>
                </>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">{t(lang, 'noData')}</div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? t(lang, 'edit') : t(lang, 'add')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t(lang, 'projectNameAr')} required>
              <input value={form.name_ar} onChange={e => setForm(f => ({...f, name_ar: e.target.value}))} className="input" required />
            </Field>
            <Field label={t(lang, 'projectNameEn')} required>
              <input value={form.name_en} onChange={e => setForm(f => ({...f, name_en: e.target.value}))} className="input" required />
            </Field>
            <Field label={t(lang, 'location')}>
              <input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} className="input" />
            </Field>
            <Field label={t(lang, 'startDate')}>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} className="input" />
            </Field>
            <Field label={t(lang, 'budget')}>
              <input type="number" value={form.budget} onChange={e => setForm(f => ({...f, budget: e.target.value}))} className="input" min="0" />
            </Field>
            <Field label={t(lang, 'progress') + ' (%)'}>
              <input type="number" value={form.progress} onChange={e => setForm(f => ({...f, progress: e.target.value}))} className="input" min="0" max="100" />
            </Field>
            <Field label={t(lang, 'stage')}>
              <select value={form.stage} onChange={e => setForm(f => ({...f, stage: e.target.value}))} className="input">
                {STAGES.map(s => <option key={s} value={s}>{t(lang, `stages.${s}`)}</option>)}
              </select>
            </Field>
            <Field label={t(lang, 'engineer')}>
              <select value={form.engineer_id} onChange={e => setForm(f => ({...f, engineer_id: e.target.value}))} className="input">
                <option value="">— {lang === 'ar' ? 'اختر مهندساً' : 'Select engineer'} —</option>
                {engineers.map(u => <option key={u.id} value={u.id}>{u.full_name_ar || u.full_name}</option>)}
              </select>
            </Field>
            <Field label={t(lang, 'status')}>
              <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className="input">
                <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
                <option value="completed">{lang === 'ar' ? 'مكتمل' : 'Completed'}</option>
                <option value="paused">{lang === 'ar' ? 'متوقف' : 'Paused'}</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors">{t(lang, 'save')}</button>
            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors">{t(lang, 'cancel')}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailProject} onClose={() => setDetailProject(null)} title={detailProject?.name_ar} size="lg">
        {detailProject && (
          <div className="space-y-4">
            <StageTracker stage={detailProject.stage} />
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Info label={t(lang, 'location')} value={detailProject.location} />
              <Info label={t(lang, 'startDate')} value={detailProject.start_date?.slice(0,10)} />
              <Info label={t(lang, 'budget')} value={detailProject.budget ? `${Number(detailProject.budget).toLocaleString()} ${t(lang, 'currency')}` : '—'} />
              <Info label={t(lang, 'progress')} value={`${detailProject.progress}%`} />
              <Info label={t(lang, 'engineer')} value={detailProject.engineer_name_ar || detailProject.engineer_name} />
            </div>

            <div>
              <h3 className="font-bold text-slate-700 mb-3">{t(lang, 'tasks')}</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {detailProject.tasks?.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                    <input type="checkbox" checked={task.completed} onChange={() => canEdit && toggleTask(task)} disabled={!canEdit} className="w-4 h-4 accent-blue-600" />
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.task_name}</span>
                    {canEdit && <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>}
                  </div>
                ))}
                {detailProject.tasks?.length === 0 && <p className="text-slate-400 text-sm">{t(lang, 'noData')}</p>}
              </div>
              {canEdit && (
                <div className="flex gap-2 mt-3">
                  <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder={t(lang, 'addTask')} className="input flex-1 text-sm" />
                  <button onClick={addTask} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">+</button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}{required && <span className="text-red-500 ms-1">*</span>}</label>
      {children}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="font-semibold text-slate-700">{value || '—'}</p>
    </div>
  );
}
