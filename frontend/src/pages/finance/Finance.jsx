import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { useProject } from '../../contexts/ProjectContext';
import { t } from '../../i18n';
import Modal from '../../components/Modal';

// ─────────────────────────────────────────────────────────────────────────────
// Field helper
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ms-1">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SalariesTab
// ─────────────────────────────────────────────────────────────────────────────
const SAL_DEFAULT = { employee_name: '', role: '', department: '', monthly_salary: '', currency: 'IQD', month_year: '', project_id: '', paid: false };

function SalariesTab({ project, projects, lang, canEdit }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ ...SAL_DEFAULT, project_id: project?.id || '' });
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    const qs = project?.id ? `?project_id=${project.id}` : '';
    const res = await api.get(`/finance/salaries${qs}`);
    setItems(res.data);
    setLoading(false);
  };
  useEffect(() => { fetchItems(); }, [project?.id]);

  const openCreate = () => { setEditItem(null); setForm({ ...SAL_DEFAULT, project_id: project?.id || '' }); setShowModal(true); };
  const openEdit = item => {
    setEditItem(item);
    setForm({ ...item, project_id: item.project_id || '', monthly_salary: item.monthly_salary || '', month_year: item.month_year || '' });
    setShowModal(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const data = { ...form, project_id: form.project_id || null, monthly_salary: form.monthly_salary || null };
    if (editItem) await api.put(`/finance/salaries/${editItem.id}`, data);
    else await api.post('/finance/salaries', data);
    setShowModal(false);
    fetchItems();
  };

  const handleDelete = async id => {
    if (!confirm(t(lang, 'confirmDelete'))) return;
    await api.delete(`/finance/salaries/${id}`);
    fetchItems();
  };

  const markPaid = async item => {
    await api.put(`/finance/salaries/${item.id}`, { ...item, paid: true, project_id: item.project_id || null });
    fetchItems();
  };

  const filtered = items.filter(i =>
    i.employee_name.includes(search) ||
    (i.department || '').includes(search) ||
    (i.role || '').includes(search)
  );
  const totalUnpaid = filtered.filter(i => !i.paid).reduce((s, i) => s + Number(i.monthly_salary || 0), 0);

  if (loading) return <div className="text-center py-16 text-slate-400">{t(lang, 'loading')}</div>;

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t(lang, 'search')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            <span>+</span> {t(lang, 'add')}
          </button>
        )}
      </div>

      {/* Unpaid total banner */}
      {totalUnpaid > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm">
          {lang === 'ar' ? 'إجمالي الرواتب غير المدفوعة: ' : 'Total unpaid salaries: '}
          <strong>{totalUnpaid.toLocaleString('ar-IQ')} د.ع</strong>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['اسم الموظف', 'الدور', 'القسم', 'الراتب', 'الشهر', 'المشروع', 'الحالة', 'الإجراءات'].map(h => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.employee_name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.role || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.department || '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {item.monthly_salary ? `${Number(item.monthly_salary).toLocaleString()} ${item.currency === 'USD' ? '$' : 'د.ع'}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.month_year || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.project_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {item.paid ? t(lang, 'paid') : t(lang, 'unpaid')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {canEdit && !item.paid && (
                        <button
                          onClick={() => markPaid(item)}
                          className="px-2.5 py-1 text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap font-medium"
                        >
                          ✓ {t(lang, 'markPaid')}
                        </button>
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
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">{t(lang, 'noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? t(lang, 'edit') : t(lang, 'add')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t(lang, 'employeeName')} required>
              <input value={form.employee_name} onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} className="input" required />
            </Field>
            <Field label={t(lang, 'role')}>
              <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input" />
            </Field>
            <Field label={t(lang, 'department')}>
              <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="input" />
            </Field>
            <Field label={t(lang, 'monthlySalary')}>
              <div className="flex gap-2">
                <input
                  type="number" min="0"
                  value={form.monthly_salary}
                  onChange={e => setForm(f => ({ ...f, monthly_salary: e.target.value }))}
                  className="input flex-1"
                />
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="input w-24">
                  <option value="IQD">د.ع IQD</option>
                  <option value="USD">$ USD</option>
                </select>
              </div>
            </Field>
            <Field label={t(lang, 'monthYear')}>
              <input type="month" value={form.month_year} onChange={e => setForm(f => ({ ...f, month_year: e.target.value }))} className="input" />
            </Field>
            <Field label={t(lang, 'project')}>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="input">
                <option value="">—</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
              </select>
            </Field>
          </div>
          <Field label={t(lang, 'status')}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.paid}
                onChange={e => setForm(f => ({ ...f, paid: e.target.checked }))}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm text-slate-700">{t(lang, 'paid')}</span>
            </label>
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">{t(lang, 'save')}</button>
            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold">{t(lang, 'cancel')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FundsTab
// ─────────────────────────────────────────────────────────────────────────────
const FUND_DEFAULT = { source: '', amount: '', currency: 'IQD', fund_date: '', project_id: '', status: 'pending', notes: '' };

function FundsTab({ project, projects, lang, canEdit }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ ...FUND_DEFAULT, project_id: project?.id || '' });
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    const qs = project?.id ? `?project_id=${project.id}` : '';
    const res = await api.get(`/finance/funds${qs}`);
    setItems(res.data);
    setLoading(false);
  };
  useEffect(() => { fetchItems(); }, [project?.id]);

  const openCreate = () => { setEditItem(null); setForm({ ...FUND_DEFAULT, project_id: project?.id || '' }); setShowModal(true); };
  const openEdit = item => {
    setEditItem(item);
    setForm({ ...item, fund_date: item.fund_date?.slice(0, 10) || '', project_id: item.project_id || '', amount: item.amount || '' });
    setShowModal(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const data = { ...form, project_id: form.project_id || null, amount: form.amount || null, fund_date: form.fund_date || null };
    if (editItem) await api.put(`/finance/funds/${editItem.id}`, data);
    else await api.post('/finance/funds', data);
    setShowModal(false);
    fetchItems();
  };

  const handleDelete = async id => {
    if (!confirm(t(lang, 'confirmDelete'))) return;
    await api.delete(`/finance/funds/${id}`);
    fetchItems();
  };

  const filtered = items.filter(i =>
    (i.source || '').includes(search) ||
    (i.notes || '').includes(search)
  );

  if (loading) return <div className="text-center py-16 text-slate-400">{t(lang, 'loading')}</div>;

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t(lang, 'search')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
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
                {['المصدر', 'المبلغ', 'التاريخ', 'المشروع', 'الحالة', 'ملاحظات', 'الإجراءات'].map(h => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.source}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {Number(item.amount || 0).toLocaleString()} {item.currency === 'USD' ? '$' : 'د.ع'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.fund_date?.slice(0, 10) || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.project_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.status === 'received' ? t(lang, 'received') : t(lang, 'pending')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{item.notes || '—'}</td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(item)} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">✏️</button>
                        <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg">🗑️</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">{t(lang, 'noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? t(lang, 'edit') : t(lang, 'add')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t(lang, 'source')} required>
              <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="input" required />
            </Field>
            <Field label={t(lang, 'amount')} required>
              <div className="flex gap-2">
                <input
                  type="number" min="0"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="input flex-1"
                  required
                />
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="input w-24">
                  <option value="IQD">د.ع IQD</option>
                  <option value="USD">$ USD</option>
                </select>
              </div>
            </Field>
            <Field label={t(lang, 'date')}>
              <input type="date" value={form.fund_date} onChange={e => setForm(f => ({ ...f, fund_date: e.target.value }))} className="input" />
            </Field>
            <Field label={t(lang, 'project')}>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="input">
                <option value="">—</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
              </select>
            </Field>
            <Field label={t(lang, 'status')}>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input">
                <option value="pending">{t(lang, 'pending')}</option>
                <option value="received">{t(lang, 'received')}</option>
              </select>
            </Field>
          </div>
          <Field label={t(lang, 'notes')}>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input resize-none" />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">{t(lang, 'save')}</button>
            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold">{t(lang, 'cancel')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ContractorsTab
// ─────────────────────────────────────────────────────────────────────────────
const CON_DEFAULT = { contractor_name: '', job_description: '', amount: '', currency: 'IQD', contract_date: '', project_id: '', payment_status: 'pending' };

function ContractorsTab({ project, projects, lang, canEdit }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ ...CON_DEFAULT, project_id: project?.id || '' });
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    const qs = project?.id ? `?project_id=${project.id}` : '';
    const res = await api.get(`/finance/contractors${qs}`);
    setItems(res.data);
    setLoading(false);
  };
  useEffect(() => { fetchItems(); }, [project?.id]);

  const openCreate = () => { setEditItem(null); setForm({ ...CON_DEFAULT, project_id: project?.id || '' }); setShowModal(true); };
  const openEdit = item => {
    setEditItem(item);
    setForm({ ...item, project_id: item.project_id || '', amount: item.amount || '', contract_date: item.contract_date?.slice(0, 10) || '' });
    setShowModal(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const data = { ...form, project_id: form.project_id || null, amount: form.amount || null, contract_date: form.contract_date || null };
    if (editItem) await api.put(`/finance/contractors/${editItem.id}`, data);
    else await api.post('/finance/contractors', data);
    setShowModal(false);
    fetchItems();
  };

  const handleDelete = async id => {
    if (!confirm(t(lang, 'confirmDelete'))) return;
    await api.delete(`/finance/contractors/${id}`);
    fetchItems();
  };

  const filtered = items.filter(i =>
    (i.contractor_name || '').includes(search) ||
    (i.job_description || '').includes(search)
  );

  if (loading) return <div className="text-center py-16 text-slate-400">{t(lang, 'loading')}</div>;

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t(lang, 'search')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
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
                {['المقاول', 'العمل', 'المشروع', 'المبلغ', 'التاريخ', 'الحالة', 'الإجراءات'].map(h => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.contractor_name}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{item.job_description || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.project_name || '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {item.amount ? `${Number(item.amount).toLocaleString()} ${item.currency === 'USD' ? '$' : 'د.ع'}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.contract_date?.slice(0, 10) || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.payment_status === 'paid' ? t(lang, 'paid') : t(lang, 'pending')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(item)} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">✏️</button>
                        <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg">🗑️</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">{t(lang, 'noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? t(lang, 'edit') : t(lang, 'add')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t(lang, 'contractorName')} required>
              <input value={form.contractor_name} onChange={e => setForm(f => ({ ...f, contractor_name: e.target.value }))} className="input" required />
            </Field>
            <Field label={t(lang, 'amount')}>
              <div className="flex gap-2">
                <input
                  type="number" min="0"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="input flex-1"
                />
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="input w-24">
                  <option value="IQD">د.ع IQD</option>
                  <option value="USD">$ USD</option>
                </select>
              </div>
            </Field>
            <Field label={t(lang, 'contractDate')}>
              <input type="date" value={form.contract_date} onChange={e => setForm(f => ({ ...f, contract_date: e.target.value }))} className="input" />
            </Field>
            <Field label={t(lang, 'project')}>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="input">
                <option value="">—</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
              </select>
            </Field>
            <Field label={t(lang, 'status')}>
              <select value={form.payment_status} onChange={e => setForm(f => ({ ...f, payment_status: e.target.value }))} className="input">
                <option value="pending">{t(lang, 'pending')}</option>
                <option value="paid">{t(lang, 'paid')}</option>
              </select>
            </Field>
          </div>
          <Field label={t(lang, 'jobDescription')}>
            <textarea rows={2} value={form.job_description} onChange={e => setForm(f => ({ ...f, job_description: e.target.value }))} className="input resize-none" />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">{t(lang, 'save')}</button>
            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold">{t(lang, 'cancel')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Finance — main page
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'salaries',    icon: '💰', label: 'الرواتب' },
  { id: 'funds',       icon: '📥', label: 'الأموال الواردة' },
  { id: 'contractors', icon: '🔧', label: 'المقاولون' },
];

export default function Finance() {
  const { canEdit } = useAuth();
  const { lang } = useLang();
  const project = useProject();

  const [activeTab, setActiveTab] = useState('salaries');
  const [projects, setProjects] = useState([]);

  // Summary state
  const [summary, setSummary] = useState({
    unpaidCount: 0, unpaidTotal: 0,
    receivedTotal: 0,
    pendingContractors: 0,
  });

  useEffect(() => {
    // Fetch projects list once
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});

    // Fetch summary data
    const qs = project?.id ? `?project_id=${project.id}` : '';
    Promise.all([
      api.get(`/finance/salaries${qs}`).catch(() => ({ data: [] })),
      api.get(`/finance/funds${qs}`).catch(() => ({ data: [] })),
      api.get(`/finance/contractors${qs}`).catch(() => ({ data: [] })),
    ]).then(([salRes, fundsRes, conRes]) => {
      const salaries = salRes.data || [];
      const funds = fundsRes.data || [];
      const contractors = conRes.data || [];

      const unpaid = salaries.filter(s => !s.paid);
      const unpaidCount = unpaid.length;
      const unpaidTotal = unpaid.reduce((s, i) => s + (i.currency === 'IQD' ? Number(i.monthly_salary || 0) : 0), 0);

      const receivedTotal = funds
        .filter(f => f.status === 'received')
        .reduce((s, i) => s + (i.currency === 'IQD' ? Number(i.amount || 0) : 0), 0);

      const pendingContractors = contractors
        .filter(c => c.payment_status === 'pending')
        .reduce((s, i) => s + (i.currency === 'IQD' ? Number(i.amount || 0) : 0), 0);

      setSummary({ unpaidCount, unpaidTotal, receivedTotal, pendingContractors });
    });
  }, [project?.id]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            {lang === 'ar' ? 'الإدارة المالية' : 'Finance Management'}
          </h1>
          {project && (
            <p className="text-sm text-slate-400 mt-0.5">{project.name_ar}</p>
          )}
        </div>
      </div>

      {/* ── KPI Summary Bar ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Unpaid Salaries */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">💰</div>
          <div className="min-w-0">
            <p className="text-xs text-amber-600 font-semibold mb-0.5">رواتب غير مدفوعة</p>
            <p className="text-xl font-black text-amber-700 leading-tight">{summary.unpaidCount} <span className="text-sm font-semibold">موظف</span></p>
            {summary.unpaidTotal > 0 && (
              <p className="text-xs text-amber-500 mt-0.5">{summary.unpaidTotal.toLocaleString('ar-IQ')} د.ع</p>
            )}
          </div>
        </div>

        {/* Received Funds */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📥</div>
          <div className="min-w-0">
            <p className="text-xs text-emerald-600 font-semibold mb-0.5">أموال مستلمة</p>
            <p className="text-xl font-black text-emerald-700 leading-tight truncate">
              {summary.receivedTotal.toLocaleString('ar-IQ')}
            </p>
            <p className="text-xs text-emerald-500 mt-0.5">د.ع IQD</p>
          </div>
        </div>

        {/* Pending Contractors */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🔧</div>
          <div className="min-w-0">
            <p className="text-xs text-red-500 font-semibold mb-0.5">مقاولون معلقون</p>
            <p className="text-xl font-black text-red-600 leading-tight truncate">
              {summary.pendingContractors.toLocaleString('ar-IQ')}
            </p>
            <p className="text-xs text-red-400 mt-0.5">د.ع IQD</p>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ───────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ───────────────────────────────────────────── */}
      <div>
        {activeTab === 'salaries' && (
          <SalariesTab project={project} projects={projects} lang={lang} canEdit={canEdit} />
        )}
        {activeTab === 'funds' && (
          <FundsTab project={project} projects={projects} lang={lang} canEdit={canEdit} />
        )}
        {activeTab === 'contractors' && (
          <ContractorsTab project={project} projects={projects} lang={lang} canEdit={canEdit} />
        )}
      </div>
    </div>
  );
}
