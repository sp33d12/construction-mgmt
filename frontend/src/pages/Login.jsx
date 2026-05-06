import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { lang, toggle } = useLang();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch {
      setError(lang === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center text-white font-black text-3xl mb-4 shadow-lg shadow-blue-200">
              م
            </div>
            <h1 className="text-2xl font-black text-slate-800">{t(lang, 'appName')}</h1>
            <p className="text-slate-400 text-sm mt-1">{t(lang, 'login')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t(lang, 'username')}</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 transition-all"
                placeholder="admin / pm / engineer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t(lang, 'password')}</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 transition-all"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200"
            >
              {loading ? '...' : t(lang, 'loginBtn')}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-600 mb-2">{lang === 'ar' ? 'المستخدمون الافتراضيون (كلمة المرور: admin123)' : 'Default users (password: admin123)'}</p>
            <p>👔 admin — {t(lang, 'general_manager')}</p>
            <p>📋 pm — {t(lang, 'project_manager')}</p>
            <p>⛑️ engineer — {t(lang, 'field_engineer')}</p>
          </div>

          <div className="text-center mt-4">
            <button onClick={toggle} className="text-slate-400 text-sm hover:text-slate-600 transition-colors">
              {lang === 'ar' ? 'English' : 'عربي'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
