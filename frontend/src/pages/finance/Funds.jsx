import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { useProject } from '../../contexts/ProjectContext';
import { t } from '../../i18n';
import Modal from '../../components/Modal';

const DEFAULT = { source: '', amount: '', fund_date: '', project_id: '', status: 'pending', notes: '', currency: 'IQD' };

export default function Funds() {
  const { canEdit } = useAuth();
  const { lang } = useLang();
  const project = useProject();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ ...DEFAULT, project_id: project?.id || '' });

  const fetch = async () => {
    const qs = project?.id ? `?project_id=${project.id}` : '';
    const [f, p] = await Promise.all([api.get(`/finance/funds${qs}`), api.get('/projects')]);
    setItems(f.data); setProjects(p.data); setLoading(false);
  };
  useEffect(() => { fetch(); }, [project?.id]);

  const openCreate = () => { setEditItem(null); setForm(DEFAULT); setShowModal(true); };
  const openEdit = item => { setEditItem(item); setForm({ ...item, fund_date: item.fund_date?.slice(0,10)||'', project_id: item.project_id||'', amount: item.amount||'' }); setShowModal(true); };
  const handleSubmit = async e => { e.preventDefault(); const data={...form,project_id:form.project_id||null,amount:form.amount||null,fund_date:form.fund_date||null}; if(editItem) await api.put(`/finance/funds/${editItem.id}`,data); else await api.post('/finance/funds',data); setShowModal(false); fetch(); };
  const handleDelete = async id => { if(!confirm(t(lang,'confirmDelete'))) return; await api.delete(`/finance/funds/${id}`); fetch(); };

  // Split totals by currency
  const receivedIQD = items.filter(i=>i.status==='received'&&(i.currency==='IQD'||!i.currency)).reduce((s,i)=>s+Number(i.amount||0),0);
  const receivedUSD = items.filter(i=>i.status==='received'&&i.currency==='USD').reduce((s,i)=>s+Number(i.amount||0),0);
  const pendingIQD  = items.filter(i=>i.status==='pending' &&(i.currency==='IQD'||!i.currency)).reduce((s,i)=>s+Number(i.amount||0),0);
  const pendingUSD  = items.filter(i=>i.status==='pending' &&i.currency==='USD').reduce((s,i)=>s+Number(i.amount||0),0);

  if (loading) return <div className="text-center py-20 text-slate-400">{t(lang,'loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Received */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
          <p className="text-xs text-emerald-600 font-semibold">{lang==='ar'?'إجمالي المستلم':'Total Received'}</p>
          {receivedIQD > 0 && (
            <p className="text-2xl font-black text-emerald-700">{receivedIQD.toLocaleString('ar-IQ')} <span className="text-base font-bold">د.ع</span></p>
          )}
          {receivedUSD > 0 && (
            <p className="text-2xl font-black text-emerald-700">$ {receivedUSD.toLocaleString('en-US')}</p>
          )}
          {receivedIQD === 0 && receivedUSD === 0 && (
            <p className="text-2xl font-black text-emerald-700">0 <span className="text-base font-bold">د.ع</span></p>
          )}
        </div>
        {/* Pending */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
          <p className="text-xs text-amber-600 font-semibold">{lang==='ar'?'قيد الاستلام':'Pending'}</p>
          {pendingIQD > 0 && (
            <p className="text-2xl font-black text-amber-700">{pendingIQD.toLocaleString('ar-IQ')} <span className="text-base font-bold">د.ع</span></p>
          )}
          {pendingUSD > 0 && (
            <p className="text-2xl font-black text-amber-700">$ {pendingUSD.toLocaleString('en-US')}</p>
          )}
          {pendingIQD === 0 && pendingUSD === 0 && (
            <p className="text-2xl font-black text-amber-700">0 <span className="text-base font-bold">د.ع</span></p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        {canEdit && <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"><span>+</span> {t(lang,'add')}</button>}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{[t(lang,'source'),t(lang,'amount'),t(lang,'date'),t(lang,'project'),t(lang,'status'),t(lang,'notes'),t(lang,'actions')].map(h=><th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(item=>(
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.source}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{Number(item.amount||0).toLocaleString()} {item.currency === 'USD' ? '$' : 'د.ع'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.fund_date?.slice(0,10)||'—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.project_name||'—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status==='received'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{item.status==='received'?t(lang,'received'):t(lang,'pending')}</span></td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{item.notes||'—'}</td>
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
            <Field label={t(lang,'source')} required><input value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))} className="input" required /></Field>
            <Field label={t(lang,'amount')} required>
              <div className="flex gap-2">
                <input type="number" min="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} className="input flex-1" required />
                <select value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))} className="input w-24">
                  <option value="IQD">د.ع IQD</option>
                  <option value="USD">$ USD</option>
                </select>
              </div>
            </Field>
            <Field label={t(lang,'date')}><input type="date" value={form.fund_date} onChange={e=>setForm(f=>({...f,fund_date:e.target.value}))} className="input" /></Field>
            <Field label={t(lang,'project')}>
              <select value={form.project_id} onChange={e=>setForm(f=>({...f,project_id:e.target.value}))} className="input">
                <option value="">—</option>
                {projects.map(p=><option key={p.id} value={p.id}>{p.name_ar}</option>)}
              </select>
            </Field>
            <Field label={t(lang,'status')}>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="input">
                <option value="pending">{t(lang,'pending')}</option>
                <option value="received">{t(lang,'received')}</option>
              </select>
            </Field>
          </div>
          <Field label={t(lang,'notes')}><textarea rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="input resize-none" /></Field>
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
