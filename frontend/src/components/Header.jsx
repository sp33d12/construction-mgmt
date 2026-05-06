import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n';

export default function Header({ onToggle, sidebarOpen, title }) {
  const { logout } = useAuth();
  const { lang, toggle } = useLang();

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 shadow-sm z-10">
      {/* Left/Right area: toggle + title */}
      <div className="flex items-center gap-3">
        {/* Sidebar toggle button — always visible */}
        <button
          onClick={onToggle}
          title={sidebarOpen ? 'إخفاء القائمة' : 'إظهار القائمة'}
          className={`
            w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl
            transition-all duration-200
            ${sidebarOpen
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }
          `}
        >
          {/* Animated hamburger → X */}
          <span className={`block h-0.5 rounded-full bg-current transition-all duration-300 ${sidebarOpen ? 'w-5 translate-y-2 rotate-45' : 'w-5'}`} />
          <span className={`block h-0.5 rounded-full bg-current transition-all duration-300 ${sidebarOpen ? 'w-0 opacity-0' : 'w-4'}`} />
          <span className={`block h-0.5 rounded-full bg-current transition-all duration-300 ${sidebarOpen ? 'w-5 -translate-y-2 -rotate-45' : 'w-5'}`} />
        </button>

        <h1 className="font-bold text-slate-800 text-base lg:text-lg">{title}</h1>
      </div>

      {/* Right area: lang toggle + logout */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {lang === 'ar' ? 'EN' : 'ع'}
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-sm font-medium transition-colors"
        >
          <span>🚪</span>
          <span className="hidden sm:inline">{t(lang, 'logout')}</span>
        </button>
      </div>
    </header>
  );
}
