import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useProject } from '../contexts/ProjectContext';
import { t } from '../i18n';
import Modal from '../components/Modal';

const DEFAULT = { material_name: '', unit: '', quantity: 0, min_quantity: 0, unit_price: '', project_id: '' };
const UNITS_AR = ['كيس', 'طن', 'متر مكعب', 'قطعة', 'لتر', 'متر طولي', 'كيلوغرام', 'رزمة'];

export default function Warehouse() {
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
  const [showLowOnly, setShowLowOnly] = useState(false);

  const fetch = async () => {
    const qs = project?.id ? `?project_id=${project.id}` : '';
    const [m, p] = await Promise.all([api.get(`/warehouse${qs}`), api.get('/projects')]);
    setItems(m.data); setProjects(p.data); setLoading(false);
  };
  useEffect(() => { fetch(); }, [project?.id]);

  const openCreate = () => { setEditItem(null); setForm(DEFAULT); setShowModal(true); };
  const openEdit = item => { setEditItem(item); setForm({ ...item, project_id: item.project_id||'', unit_price: item.unit_price||'' }); setShowModal(true); };
  const handleSubmit = async e => { e.preventDefault(); const data={...form,project_id:form.project_id||null,unit_price:form.unit_price||null}; if(editItem) await api.put(`/warehouse/${editItem.id}`,data); else await api.post('/warehouse',data); setShowModal(false); fetch(); };
  const handleDelete = async id => { if(!confirm(t(lang,'confirmDelete'))) return; await api.delete(`/warehouse/${id}`); fetch(); };

  const lowCount = items.filter(i => i.low_stock).length;

  let filtered = items.filter(i =>
    i.material_name.includes(search) || (i.project_name||'').includes(search)
  );
  if (showLowOnly) filtered = filtered.filter(i => i.low_stock);

  if (loading) return <div className="text-center py-20 text-slate-400">{t(lang, 'loading')}</div>;

  return (
    <div className="space-y-4">
      {lowCount > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-red-700">{lang === 'ar' ? `${lowCount} مادة وصلت للحد الأدنى` : `${lowCount} materials at low stock`}</p>
              <p className="text-red-500 text-sm">{lang === 'ar' ? 'يلزم إعادة تعبئة فورية' : 'Immediate replenishment required'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLowOnly(!showLowOnly)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${showLowOnly ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
          >
            {showLowOnly ? (lang === 'ar' ? 'عرض الكل' : 'Show All') : (lang === 'ar' ? 'عرض المنخفضة فقط' : 'Show Low Only')}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t(lang, 'search')} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm" />
        {canEdit && (
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors">
            <span>+</span> {t(lang, 'add')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {[t(lang,'materialName'), t(lang,'unit'), t(lang,'quantity'), t(lang,'minQuantity'), t(lang,'unitPrice'), t(lang,'project'), t(lang,'status'), t(lang,'actions')].map(h => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(item => (
                <tr key={item.id} className={item.low_stock ? 'bg-red-50/50' : ''}>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.material_name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.unit || '—'}</td>
                  <td className={`px-4 py-3 font-bold ${item.low_stock ? 'text-red-600' : 'text-slate-800'}`}>{Number(item.quantity).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500">{Number(item.min_quantity).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{item.unit_price ? `${Number(item.unit_price).toLocaleString()} ${t(lang,'currency')}` : '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.project_name || '—'}</td>
                  <td className="px-4 py-3">
                    {item.low_stock ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold">
                        <span>⚠️</span> {t(lang, 'lowStock')}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">✓ OK</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">✏️</button>
                        <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg">🗑️</button>
                      </div>
                    )}
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
            <Field label={t(lang,'materialName')} required><input value={form.material_name} onChange={e=>setForm(f=>({...f,material_name:e.target.value}))} className="input" required /></Field>
            <Field label={t(lang,'unit')}>
              <select value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} className="input">
                <option value="">—</option>
                {UNITS_AR.map(u=><option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
            <Field label={t(lang,'quantity')}><input type="number" min="0" step="0.01" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} className="input" /></Field>
            <Field label={t(lang,'minQuantity')}><input type="number" min="0" step="0.01" value={form.min_quantity} onChange={e=>setForm(f=>({...f,min_quantity:e.target.value}))} className="input" /></Field>
            <Field label={t(lang,'unitPrice')}><input type="number" min="0" step="0.01" value={form.unit_price} onChange={e=>setForm(f=>({...f,unit_price:e.target.value}))} className="input" /></Field>
            <Field label={t(lang,'project')}>
              <select value={form.project_id} onChange={e=>setForm(f=>({...f,project_id:e.target.value}))} className="input">
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
function Field({label,children,required}){return <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}{required&&<span className="text-red-500 ms-1">*</span>}</label>{children}</div>;}
