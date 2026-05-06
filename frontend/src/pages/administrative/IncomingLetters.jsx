import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { t } from '../../i18n';
import Modal from '../../components/Modal';

const DEFAULT = { reference_number: '', letter_date: '', sender: '', subject: '', project_id: '' };

export default function IncomingLetters() {
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
    const [l, p] = await Promise.all([api.get('/admin/incoming'), api.get('/projects')]);
    setItems(l.data); setProjects(p.data); setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditItem(null); setForm(DEFAULT); setShowModal(true); };
  const openEdit = item => { setEditItem(item); setForm({ ...item, project_id: item.project_id||'', letter_date: item.letter_date?.slice(0,10)||'' }); setShowModal(true); };
  const handleSubmit = async e => { e.preventDefault(); const data={...form,project_id:form.project_id||null,letter_date:form.letter_date||null}; if(editItem) await api.put(`/admin/incoming/${editItem.id}`,data); else await api.post('/admin/incoming',data); setShowModal(false); fetch(); };
  const handleDelete = async id => { if(!confirm(t(lang,'confirmDelete'))) return; await api.delete(`/admin/incoming/${id}`); fetch(); };

  const filtered = items.filter(i => (i.sender||'').includes(search) || (i.subject||'').includes(search) || (i.reference_number||'').includes(search));

  if (loading) return <div className="text-center py-20 text-slate-400">{t(lang,'loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t(lang,'search')} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm" />
        {canEdit && <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"><span>+</span> {t(lang,'add')}</button>}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{[t(lang,'refNumber'),t(lang,'letterDate'),t(lang,'sender'),t(lang,'subject'),t(lang,'project'),t(lang,'actions')].map(h=><th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(item=>(
                <tr key={item.id}>
                  <td className="px-4 py-3 font-mono text-slate-700">{item.reference_number||'—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.letter_date?.slice(0,10)||'—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.sender||'—'}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{item.subject||'—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.project_name||'—'}</td>
                  <td className="px-4 py-3">{canEdit&&<div className="flex gap-2"><button onClick={()=>openEdit(item)} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">✏️</button><button onClick={()=>handleDelete(item.id)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg">🗑️</button></div>}</td>
                </tr>
              ))}
              {filtered.length===0&&<tr><td colSpan={6} className="text-center py-12 text-slate-400">{t(lang,'noData')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editItem?t(lang,'edit'):t(lang,'add')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t(lang,'refNumber')}><input value={form.reference_number} onChange={e=>setForm(f=>({...f,reference_number:e.target.value}))} className="input" /></Field>
            <Field label={t(lang,'letterDate')}><input type="date" value={form.letter_date} onChange={e=>setForm(f=>({...f,letter_date:e.target.value}))} className="input" /></Field>
            <Field label={t(lang,'sender')} required><input value={form.sender} onChange={e=>setForm(f=>({...f,sender:e.target.value}))} className="input" required /></Field>
            <Field label={t(lang,'project')}>
              <select value={form.project_id} onChange={e=>setForm(f=>({...f,project_id:e.target.value}))} className="input">
                <option value="">—</option>
                {projects.map(p=><option key={p.id} value={p.id}>{p.name_ar}</option>)}
              </select>
            </Field>
          </div>
          <Field label={t(lang,'subject')} required><textarea rows={3} value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} className="input resize-none" required /></Field>
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
