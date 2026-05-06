import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { t } from '../../i18n';
import Modal from '../../components/Modal';

const DEFAULT = { employee_name: '', role: '', department: '', monthly_salary: '', month_year: '', project_id: '', paid: false, currency: 'IQD' };

export default function Salaries() {
  const { canEdit } = useAuth();
  const { lang } = useLang();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(DEFAULT);
  const [search, setSearch] = useState('');

  const fetch = async () => {
    const [s, p] = await Promise.all([api.get('/finance/salaries'), api.get('/projects')]);
    setItems(s.data); setProjects(p.data); setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditItem(null); setForm(DEFAULT); setShowModal(true); };
  const openEdit = item => { setEditItem(item); setForm({ ...item, project_id: item.project_id || '', monthly_salary: item.monthly_salary || '' }); setShowModal(true); };

  const handleSubmit = async e => {
    e.preventDefault();
    const data = { ...form, project_id: form.project_id || null, monthly_salary: form.monthly_salary || null };
    if (editItem) await api.put(`/finance/salaries/${editItem.id}`, data);
    else await api.post('/finance/salaries', data);
    setShowModal(false); fetch();
  };

  const handleDelete = async id => { if (!confirm(t(lang, 'confirmDelete'))) return; await api.delete(`/finance/salaries/${id}`); fetch(); };

  const markPaid = async item => {
    await api.put(`/finance/salaries/${item.id}`, { ...item, paid: true, project_id: item.project_id || null });
    fetch();
  };

  const filtered = items.filter(i => i.employee_name.includes(search) || (i.department || '').includes(search));
  const totalUnpaid = filtered.filter(i => !i.paid).reduce((s, i) => s + Number(i.monthly_salary || 0), 0);

  if (loading) return <div className="text-center py-20 text-slate-400">{t(lang, 'loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t(lang, 'search')} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm" />
        {canEdit && (
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors">
            <span>+</span> {t(lang, 'add')}
          </button>
        )}
      </div>

      {totalUnpaid > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm">
          {lang === 'ar' ? `إجمالي الرواتب غير المدفوعة: ` : 'Total unpaid salaries: '}
          <strong>{totalUnpaid.toLocaleString('ar-IQ')} د.ع</strong>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {[t(lang,'employeeName'), t(lang,'role'), t(lang,'department'), t(lang,'monthlySalary'), t(lang,'monthYear'), t(lang,'project'), t(lang,'status'), t(lang,'actions')].map(h => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.employee_name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.role || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.department || '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.monthly_salary ? `${Number(item.monthly_salary).toLocaleString()} ${item.currency === 'USD' ? '$' : 'د.ع'}` : '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.month_year || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.project_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {item.paid ? t(lang, 'paid') : t(lang, 'unpaid')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {canEdit && !item.paid && (
                        <button onClick={() => markPaid(item)} className="px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors whitespace-nowrap">✓ {t(lang, 'markPaid')}</button>
                      )}
                      {canEdit && (
                        <>
                          <button onClick={() => openEdit(item)} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">✏️</button>
                          <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg">🗑️</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-slate-400">{t(lang, 'noData')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? t(lang, 'edit') : t(lang, 'add')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t(lang,'employeeName')} required><input value={form.employee_name} onChange={e => setForm(f=>({...f,employee_name:e.target.value}))} className="input" required /></Field>
            <Field label={t(lang,'role')}><input value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))} className="input" /></Field>
            <Field label={t(lang,'department')}><input value={form.department} onChange={e => setForm(f=>({...f,department:e.target.value}))} className="input" /></Field>
            <Field label={t(lang,'monthlySalary')}>
              <div className="flex gap-2">
                <input type="number" min="0" value={form.monthly_salary} onChange={e => setForm(f=>({...f,monthly_salary:e.target.value}))} className="input flex-1" />
                <select value={form.currency} onChange={e => setForm(f=>({...f,currency:e.target.value}))} className="input w-24">
                  <option value="IQD">د.ع IQD</option>
                  <option value="USD">$ USD</option>
                </select>
              </div>
            </Field>
            <Field label={t(lang,'monthYear')}><input type="month" value={form.month_year} onChange={e => setForm(f=>({...f,month_year:e.target.value}))} className="input" /></Field>
            <Field label={t(lang,'project')}>
              <select value={form.project_id} onChange={e => setForm(f=>({...f,project_id:e.target.value}))} className="input">
                <option value="">—</option>
                {projects.map(p=><option key={p.id} value={p.id}>{p.name_ar}</option>)}
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

function Field({ label, children, required }) {
  return <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}{required&&<span className="text-red-500 ms-1">*</span>}</label>{children}</div>;
}
