import { useState, useEffect } from 'react';
import api from '../api/client';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n';

const ACTION_ICONS = { create: '➕', update: '✏️', delete: '🗑️' };
const ACTION_COLORS = { create: 'bg-emerald-100 text-emerald-700', update: 'bg-blue-100 text-blue-700', delete: 'bg-red-100 text-red-700' };

export default function ActivityLog() {
  const { lang } = useLang();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/activity').then(r => { setLogs(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    !filter ||
    (l.description || '').includes(filter) ||
    (l.user_name || '').includes(filter) ||
    (l.entity_type || '').includes(filter)
  );

  if (loading) return <div className="text-center py-20 text-slate-400">{t(lang, 'loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder={t(lang, 'search')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
        />
        <span className="px-4 py-2.5 bg-slate-100 rounded-xl text-sm text-slate-600 font-medium">
          {filtered.length} {lang === 'ar' ? 'سجل' : 'records'}
        </span>
      </div>

      <div className="space-y-2">
        {filtered.map(log => (
          <div key={log.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600'}`}>
              {ACTION_ICONS[log.action] || '📝'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 font-medium leading-tight">{log.description || `${log.action} ${log.entity_type}`}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                <span className="text-xs text-slate-400">👤 {log.user_name || '—'}</span>
                <span className="text-xs text-slate-400">🗂 {log.entity_type}</span>
                <span className="text-xs text-slate-400">
                  🕐 {new Date(log.created_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">{t(lang, 'noData')}</div>
        )}
      </div>
    </div>
  );
}
