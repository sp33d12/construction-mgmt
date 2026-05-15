import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { useProject } from '../../contexts/ProjectContext';
import { t } from '../../i18n';
import Modal from '../../components/Modal';
import SignaturePad from '../../components/SignaturePad';

const WEATHER = ['☀️ مشمس', '⛅ غائم جزئياً', '☁️ غائم', '🌧️ ممطر', '💨 رياح', '🌪️ عاصفة', '❄️ بارد'];
const DEFAULT = { project_id: '', report_date: new Date().toISOString().slice(0,10), weather: '', worker_count: '', accomplished: '', tomorrow_plan: '', lead_worker: '', signature_data: '' };

export default function Reports() {
  const { canEdit } = useAuth();
  const { lang } = useLang();
  const project = useProject();
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ ...DEFAULT, project_id: project?.id || '' });
  const [filterProject, setFilterProject] = useState(project?.id || '');

  const fetch = async () => {
    const pid = project?.id || filterProject;
    const params = pid ? `?project_id=${pid}` : '';
    const [r, p] = await Promise.all([api.get(`/reports${params}`), api.get('/projects')]);
    setReports(r.data);
    setProjects(p.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [filterProject, project?.id]);

  const openCreate = () => { setEditItem(null); setForm(DEFAULT); setShowModal(true); };
  const openEdit = item => {
    setEditItem(item);
    setForm({ ...item, report_date: item.report_date?.slice(0,10) || '', worker_count: item.worker_count || '', project_id: item.project_id || '' });
    setShowModal(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const data = { ...form, worker_count: form.worker_count || null, project_id: form.project_id || null };
    if (editItem) await api.put(`/reports/${editItem.id}`, data);
    else await api.post('/reports', data);
    setShowModal(false);
    fetch();
  };

  const handleDelete = async id => {
    if (!confirm(t(lang, 'confirmDelete'))) return;
    await api.delete(`/reports/${id}`);
    fetch();
  };

  if (loading) return <div className="text-center py-20 text-slate-400">{t(lang, 'loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm">
          <option value="">{lang === 'ar' ? 'كل المشاريع' : 'All Projects'}</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
        </select>
        {canEdit && (
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors">
            <span>+</span> {t(lang, 'add')}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {[t(lang,'reportDate'), t(lang,'project'), t(lang,'weather'), t(lang,'workerCount'), t(lang,'leadWorker'), t(lang,'actions')].map(h => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map(r => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.report_date?.slice(0,10)}</td>
                  <td className="px-4 py-3 text-slate-600">{r.project_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{r.weather || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{r.worker_count ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{r.lead_worker || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setViewReport(r)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">{lang === 'ar' ? 'عرض' : 'View'}</button>
                      {canEdit && (
                        <>
                          <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">✏️</button>
                          <button onClick={() => handleDelete(r.id)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">🗑️</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">{t(lang, 'noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? t(lang, 'edit') : t(lang, 'add')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t(lang, 'project')} required>
              <select value={form.project_id} onChange={e => setForm(f => ({...f, project_id: e.target.value}))} className="input" required>
                <option value="">— {lang === 'ar' ? 'اختر' : 'Select'} —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
              </select>
            </Field>
            <Field label={t(lang, 'reportDate')} required>
              <input type="date" value={form.report_date} onChange={e => setForm(f => ({...f, report_date: e.target.value}))} className="input" required />
            </Field>
            <Field label={t(lang, 'weather')}>
              <select value={form.weather} onChange={e => setForm(f => ({...f, weather: e.target.value}))} className="input">
                <option value="">—</option>
                {WEATHER.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </Field>
            <Field label={t(lang, 'workerCount')}>
              <input type="number" min="0" value={form.worker_count} onChange={e => setForm(f => ({...f, worker_count: e.target.value}))} className="input" />
            </Field>
            <Field label={t(lang, 'leadWorker')}>
              <input value={form.lead_worker} onChange={e => setForm(f => ({...f, lead_worker: e.target.value}))} className="input" />
            </Field>
          </div>
          <Field label={t(lang, 'accomplished')}>
            <textarea rows={3} value={form.accomplished} onChange={e => setForm(f => ({...f, accomplished: e.target.value}))} className="input resize-none" />
          </Field>
          <Field label={t(lang, 'tomorrowPlan')}>
            <textarea rows={3} value={form.tomorrow_plan} onChange={e => setForm(f => ({...f, tomorrow_plan: e.target.value}))} className="input resize-none" />
          </Field>
          <Field label={t(lang, 'signature')}>
            <SignaturePad value={form.signature_data} onChange={v => setForm(f => ({...f, signature_data: v}))} />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors">{t(lang, 'save')}</button>
            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors">{t(lang, 'cancel')}</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewReport} onClose={() => setViewReport(null)} title={`${t(lang, 'dailyReports')} — ${viewReport?.report_date?.slice(0,10)}`} size="lg">
        {viewReport && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Info label={t(lang, 'project')} value={viewReport.project_name} />
              <Info label={t(lang, 'weather')} value={viewReport.weather} />
              <Info label={t(lang, 'workerCount')} value={viewReport.worker_count} />
              <Info label={t(lang, 'leadWorker')} value={viewReport.lead_worker} />
            </div>
            {viewReport.accomplished && <InfoBlock label={t(lang, 'accomplished')} value={viewReport.accomplished} />}
            {viewReport.tomorrow_plan && <InfoBlock label={t(lang, 'tomorrowPlan')} value={viewReport.tomorrow_plan} />}
            {viewReport.signature_data && (
              <div>
                <p className="text-xs text-slate-500 mb-2">{t(lang, 'signature')}</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <img src={viewReport.signature_data} alt="signature" className="max-h-32 w-full object-contain bg-white" />
                </div>
              </div>
            )}
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
  return <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-400 mb-0.5">{label}</p><p className="font-semibold text-slate-700">{value || '—'}</p></div>;
}
function InfoBlock({ label, value }) {
  return <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-400 mb-1">{label}</p><p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{value}</p></div>;
}
