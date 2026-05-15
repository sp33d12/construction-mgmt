import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { useProject } from '../../contexts/ProjectContext';
import { t } from '../../i18n';
import Modal from '../../components/Modal';

const DEFAULT = { contractor_name: '', job_description: '', project_id: '', amount: '', payment_status: 'pending', contract_date: '', currency: 'IQD' };

export default function Contractors() {
  const { canEdit } = useAuth();
  const { lang } = useLang();
  const project = useProject();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(DEFAULT);

  const fetch = async () => {
    const qs = project?.id ? `?project_id=${project.id}` : '';
    const [c, p] = await Promise.all([api.get(`/finance/contractors${qs}`), api.get('/projects')]);
    setItems(c.data); setProjects(p.data); setLoading(false);
  };
  useEffect(() => { fetch(); }, [project?.id]);

  const openCreate = () => { setEditItem(null); setForm(DEFAULT); setShowModal(true); };
  const openEdit = item => { setEditItem(item); setForm({ ...item, project_id: item.project_id||'', amount: item.amount||'', contract_date: item.contract_date?.slice(0,10)||'' }); setShowModal(true); };
  const handleSubmit = async e => { e.preventDefault(); const data={...form,project_id:form.project_id||null,amount:form.amount||null,contract_date:form.contract_date||null}; if(editItem) await api.put(`/finance/contractors/${editItem.id}`,data); else await api.post('/finance/contractors',data); setShowModal(false); fetch(); };
  const handleDelete = async id => { if(!confirm(t(lang,'confirmDelete'))) return; await api.delete(`/finance/contractors/${id}`); fetch(); };

  if (loading) return <div className="text-center py-20 text-slate-400">{t(lang,'loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canEdit && <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"><span>+</span> {t(lang,'add')}</button>}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{[t(lang,'contractorName'),t(lang,'jobDescription'),t(lang,'project'),t(lang,'amount'),t(lang,'contractDate'),t(lang,'status'),t(lang,'actions')].map(h=><th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(item=>(
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.contractor_name}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{item.job_description||'—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.project_name||'—'}</td>
                  <td className="px-4 py-3 font-medium">{item.amount ? `${Number(item.amount).toLocaleString()} ${item.currency === 'USD' ? '$' : 'د.ع'}` : '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.contract_date?.slice(0,10)||'—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.payment_status==='paid'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{item.payment_status==='paid'?t(lang,'paid'):t(lang,'pending')}</span></td>
                  <td className="px-4 py-3">{canEdit&&<div className="flex gap-2"><button onClick={()=>openEdit(item)} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">✏️</button><button onClick={()=>handleDelete(item.id)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg">🗑️</button></div>}</td>
                </tr>
              ))}
              {items.length===0&&<tr><td colSpan={7} className="text-center py-12 text-slate-400">{t(lang,'noData')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editItem?t(lang,'edit'):t(lang,'add')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t(lang,'contractorName')} required><input value={form.contractor_name} onChange={e=>setForm(f=>({...f,contractor_name:e.target.value}))} className="input" required /></Field>
            <Field label={t(lang,'amount')}>
              <div className="flex gap-2">
                <input type="number" min="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} className="input flex-1" />
                <select value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))} className="input w-24">
                  <option value="IQD">د.ع IQD</option>
                  <option value="USD">$ USD</option>
                </select>
              </div>
            </Field>
            <Field label={t(lang,'project')}>
              <select value={form.project_id} onChange={e=>setForm(f=>({...f,project_id:e.target.value}))} className="input">
                <option value="">—</option>
                {projects.map(p=><option key={p.id} value={p.id}>{p.name_ar}</option>)}
              </select>
            </Field>
            <Field label={t(lang,'contractDate')}><input type="date" value={form.contract_date} onChange={e=>setForm(f=>({...f,contract_date:e.target.value}))} className="input" /></Field>
            <Field label={t(lang,'status')}>
              <select value={form.payment_status} onChange={e=>setForm(f=>({...f,payment_status:e.target.value}))} className="input">
                <option value="pending">{t(lang,'pending')}</option>
                <option value="paid">{t(lang,'paid')}</option>
              </select>
            </Field>
          </div>
          <Field label={t(lang,'jobDescription')}><textarea rows={2} value={form.job_description} onChange={e=>setForm(f=>({...f,job_description:e.target.value}))} className="input resize-none" /></Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">{t(lang,'save')}</button>
            <button type="button" onClick={()=>setShowModal(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold">{t(lang,'cancel')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
function Field({label,children,required}){return <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}{required&&<span className="text-red-500 ms-1">*</span>}</label>{children}</div>;}
