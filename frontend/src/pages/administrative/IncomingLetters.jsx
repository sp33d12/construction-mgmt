import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { useProject } from '../../contexts/ProjectContext';
import { t } from '../../i18n';
import Modal from '../../components/Modal';

const DEFAULT = { reference_number: '', letter_date: '', sender: '', subject: '', project_id: '', file_data: '', file_name: '', file_type: '' };

function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = e => resolve({ data: e.target.result, name: file.name, type: file.type });
    reader.readAsDataURL(file);
  });
}

function FilePreview({ file_data, file_name, file_type }) {
  if (!file_data) return (
    <div className="h-40 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2">
      <span className="text-4xl">📄</span>
      <span className="text-xs">{file_name ? file_name : 'لا يوجد ملف'}</span>
    </div>
  );
  if (file_type?.startsWith('image/')) return (
    <img src={file_data} alt={file_name} className="h-40 w-full object-cover rounded-xl bg-slate-100" />
  );
  return (
    <div className="h-40 bg-emerald-50 rounded-xl flex flex-col items-center justify-center gap-2 border border-emerald-100">
      <span className="text-5xl">📨</span>
      <span className="text-xs text-emerald-600 font-semibold px-2 text-center truncate w-full text-center">{file_name}</span>
    </div>
  );
}

function downloadFile(file_data, file_name) {
  const a = document.createElement('a');
  a.href = file_data;
  a.download = file_name || 'document';
  a.click();
}

export default function IncomingLetters() {
  const { canEdit } = useAuth();
  const { lang } = useLang();
  const project = useProject();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(DEFAULT);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    const qs = project?.id ? `?project_id=${project.id}` : '';
    const [l, p] = await Promise.all([api.get(`/admin/incoming${qs}`), api.get('/projects')]);
    setItems(l.data); setProjects(p.data); setLoading(false);
  };
  useEffect(() => { fetchData(); }, [project?.id]);

  const openCreate = () => { setEditItem(null); setForm(DEFAULT); setShowModal(true); };
  const openEdit = item => {
    setEditItem(item);
    setForm({ ...item, project_id: item.project_id||'', letter_date: item.letter_date?.slice(0,10)||'', file_data: '', file_name: '', file_type: '' });
    setShowModal(true);
  };

  const handleFile = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const { data, name, type } = await readFile(file);
    setForm(f => ({ ...f, file_data: data, file_name: name, file_type: type }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const data = { ...form, project_id: form.project_id||null, letter_date: form.letter_date||null,
      file_data: form.file_data||null, file_name: form.file_name||null, file_type: form.file_type||null };
    if (editItem) await api.put(`/admin/incoming/${editItem.id}`, data);
    else await api.post('/admin/incoming', data);
    setShowModal(false); fetchData();
  };

  const handleDelete = async id => {
    if (!confirm(t(lang,'confirmDelete'))) return;
    await api.delete(`/admin/incoming/${id}`); fetchData();
  };

  const filtered = items.filter(i =>
    (i.sender||'').includes(search) || (i.subject||'').includes(search) || (i.reference_number||'').includes(search)
  );

  if (loading) return <div className="text-center py-20 text-slate-400">{t(lang,'loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t(lang,'search')} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm" />
        {canEdit && <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm"><span>+</span> {t(lang,'add')}</button>}
      </div>

      {filtered.length === 0 && <div className="text-center py-16 text-slate-400">{t(lang,'noData')}</div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-3 pb-0">
              <FilePreview file_data={item.file_data} file_name={item.file_name} file_type={item.file_type} />
            </div>
            <div className="p-4 flex-1 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{item.reference_number||'—'}</span>
                <span className="text-xs text-slate-400">{item.letter_date?.slice(0,10)||'—'}</span>
              </div>
              <p className="font-bold text-slate-800 text-sm mt-1 line-clamp-2">{item.subject||'—'}</p>
              <p className="text-xs text-slate-500">📨 {item.sender||'—'}</p>
              {item.project_name && <p className="text-xs text-blue-500">🏗 {item.project_name}</p>}
            </div>
            <div className="px-4 pb-4 flex gap-2 flex-wrap">
              {item.file_data && <>
                <button onClick={() => window.open(item.file_data,'_blank')} className="flex-1 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-colors">👁 {lang==='ar'?'عرض':'View'}</button>
                <button onClick={() => downloadFile(item.file_data, item.file_name)} className="flex-1 py-1.5 text-xs bg-emerald-50 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-100 transition-colors">⬇ {lang==='ar'?'تحميل':'Download'}</button>
              </>}
              {canEdit && <>
                <button onClick={() => openEdit(item)} className="py-1.5 px-3 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">✏️</button>
                <button onClick={() => handleDelete(item.id)} className="py-1.5 px-3 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">🗑️</button>
              </>}
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? t(lang,'edit') : t(lang,'add')}>
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
          <Field label={lang==='ar'?'الملف (PDF أو صورة)':'File (PDF or Image)'}>
            <input type="file" accept=".pdf,image/*" onChange={handleFile} className="input text-sm" />
            {editItem?.file_name && !form.file_data && <p className="text-xs text-slate-400 mt-1">الملف الحالي: {editItem.file_name}</p>}
            {form.file_data && <p className="text-xs text-emerald-600 mt-1">✓ {form.file_name}</p>}
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">{t(lang,'save')}</button>
            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold">{t(lang,'cancel')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
function Field({label,children,required}){return <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}{required&&<span className="text-red-500 ms-1">*</span>}</label>{children}</div>;}
