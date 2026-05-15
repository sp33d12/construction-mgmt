import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useProject } from '../contexts/ProjectContext';
import { t } from '../i18n';

// Sub-nav items inside a project
const PROJECT_NAV = [
  {
    section: 'works', icon: '⚙️',
    items: [
      { path: 'reports', label: 'dailyReports', icon: '📋' },
    ]
  },
  {
    section: 'finance', icon: '💰',
    items: [
      { path: 'salaries',    label: 'salaries',      icon: '💰' },
      { path: 'funds',       label: 'incomingFunds', icon: '📥' },
      { path: 'contractors', label: 'contractors',   icon: '🔧' },
    ]
  },
  {
    section: 'warehouse', icon: '🏭',
    items: [
      { path: 'warehouse', label: 'warehouse', icon: '🏭' },
    ]
  },
  {
    section: 'administrative', icon: '📁',
    items: [
      { path: 'admin/outgoing', label: 'outgoingLetters', icon: '📤' },
      { path: 'admin/incoming', label: 'incomingLetters', icon: '📨' },
      { path: 'admin/orders',   label: 'adminOrders',     icon: '📄' },
    ]
  },
];

function NavContent({ onClose }) {
  const { user, isEngineer } = useAuth();
  const { lang } = useLang();
  const project = useProject();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-slate-900 w-64">
      {/* Logo */}
      <button
        onClick={() => { navigate('/'); onClose(); }}
        className="p-5 border-b border-slate-700/50 flex items-center gap-3 hover:bg-slate-800 transition-colors text-start w-full"
      >
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">م</div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight">نظام إدارة</p>
          <p className="text-slate-400 text-xs">المشاريع الإنشائية</p>
        </div>
      </button>

      {/* User badge */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <div className="bg-slate-800 rounded-xl px-3 py-2">
          <p className="text-white text-sm font-medium truncate">{user?.fullNameAr || user?.fullName}</p>
          <p className="text-blue-400 text-xs">{t(lang, user?.role || '')}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">

        {/* الرئيسية — always shown */}
        <NavLink
          to="/"
          end
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              isActive
                ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`
          }
        >
          <span className="text-base w-5 text-center flex-shrink-0">⊞</span>
          <span>{t(lang, 'dashboard')}</span>
        </NavLink>

        {/* Project sub-nav — only shown when inside a project */}
        {project && (
          <>
            {/* Project name header */}
            <div className="mx-2 mt-4 mb-2 bg-blue-600/20 border border-blue-500/30 rounded-xl px-3 py-2">
              <p className="text-blue-300 text-xs font-semibold mb-0.5">{lang === 'ar' ? 'المشروع الحالي' : 'Current Project'}</p>
              <p className="text-white text-sm font-bold truncate">{project.name_ar}</p>
            </div>

            {PROJECT_NAV.map(group => (
              <div key={group.section}>
                {/* Section label */}
                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 pt-3 pb-1">
                  {t(lang, group.section)}
                </p>
                {group.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={`/project/${project.id}/${item.path}`}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`
                    }
                  >
                    <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{t(lang, item.label)}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </>
        )}

        {/* Activity log for engineers */}
        {isEngineer && (
          <>
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 pt-4 pb-1">
              {lang === 'ar' ? 'النشاط' : 'Activity'}
            </p>
            <NavLink
              to="/activity"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <span className="text-base w-5 text-center flex-shrink-0">📊</span>
              <span>{t(lang, 'activityLog')}</span>
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  const { lang } = useLang();
  const isRTL = lang === 'ar';

  return (
    <>
      {/* Mobile overlay */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${open ? '' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
        <div className={`absolute top-0 bottom-0 transition-transform duration-300 ${isRTL ? 'right-0' : 'left-0'} ${open ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}`}>
          <NavContent onClose={onClose} />
        </div>
      </div>

      {/* Desktop push sidebar */}
      <aside className={`hidden lg:block flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${open ? 'w-64' : 'w-0'}`}>
        <div className="w-64 h-full">
          <NavContent onClose={() => {}} />
        </div>
      </aside>
    </>
  );
}
