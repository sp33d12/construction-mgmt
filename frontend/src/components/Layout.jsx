import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout } = useAuth();
  const { lang, toggle } = useLang();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 flex-shrink-0 shadow-sm z-10">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <span className={`block h-0.5 w-5 bg-slate-600 rounded-full transition-all ${sidebarOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-4 bg-slate-600 rounded-full transition-all ${sidebarOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-slate-600 rounded-full transition-all ${sidebarOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
          </button>

          <div className="flex items-center gap-2">
            <button onClick={toggle}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>
            <button onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-medium transition-colors">
              <span>🚪</span>
              <span className="hidden sm:inline">{t(lang, 'logout')}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
