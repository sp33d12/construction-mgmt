import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useProject } from '../contexts/ProjectContext';
import { t } from '../i18n';

// Section accent colours
const SECTION_STYLE = {
  works:          { dot: 'bg-amber-400',   text: 'text-amber-300',   ring: 'ring-amber-400/20',   bg: 'bg-amber-400/8'   },
  finance:        { dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'ring-emerald-400/20', bg: 'bg-emerald-400/8' },
  warehouse:      { dot: 'bg-sky-400',     text: 'text-sky-300',     ring: 'ring-sky-400/20',     bg: 'bg-sky-400/8'     },
  administrative: { dot: 'bg-purple-400',  text: 'text-purple-300',  ring: 'ring-purple-400/20',  bg: 'bg-purple-400/8'  },
};

const PROJECT_NAV = [
  {
    section: 'works', icon: '⚙️',
    items: [{ path: 'reports', label: 'dailyReports', icon: '📋' }],
  },
  {
    section: 'finance', icon: '📑',
    items: [{ path: 'finance', label: 'finance', icon: '📑' }],
  },
  {
    section: 'warehouse', icon: '🏭',
    items: [{ path: 'warehouse', label: 'warehouse', icon: '🏭' }],
  },
  {
    section: 'administrative', icon: '📁',
    items: [
      { path: 'admin/outgoing', label: 'outgoingLetters', icon: '📤' },
      { path: 'admin/incoming', label: 'incomingLetters', icon: '📨' },
      { path: 'admin/orders',   label: 'adminOrders',     icon: '📄' },
    ],
  },
];

function NavContent({ onClose }) {
  const { user } = useAuth();
  const { lang } = useLang();
  const project = useProject();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-slate-900 w-64">

      {/* ── Logo ───────────────────────────────────────────── */}
      <button
        onClick={() => { navigate('/'); onClose(); }}
        className="p-5 border-b border-slate-700/50 flex items-center gap-3 hover:bg-slate-800/60 transition-colors text-start w-full flex-shrink-0"
      >
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-lg shadow-blue-900/40">م</div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight">نظام إدارة</p>
          <p className="text-slate-500 text-[11px]">المشاريع الإنشائية</p>
        </div>
      </button>

      {/* ── User badge ─────────────────────────────────────── */}
      <div className="px-3 py-2.5 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2.5 py-2 bg-slate-800/60 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 text-xs font-bold flex-shrink-0">
            {(user?.fullNameAr || user?.fullName || '?')[0]}
          </div>
          <div className="min-w-0">
            <p className="text-slate-200 text-xs font-semibold truncate leading-tight">{user?.fullNameAr || user?.fullName}</p>
            <p className="text-slate-500 text-[10px]">{t(lang, user?.role || '')}</p>
          </div>
        </div>
      </div>

      {/* ── Nav ────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">

        {/* Global links */}
        <p className="text-slate-600 text-[9px] font-bold uppercase tracking-[0.15em] px-2 pt-1 pb-2">
          {lang === 'ar' ? 'الرئيسية' : 'Main'}
        </p>

        <NavLink to="/" end onClick={onClose}
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
          <span className="w-5 text-center text-base">🏠</span>
          <span>{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
        </NavLink>

        <NavLink to="/overview" onClick={onClose}
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
          <span className="w-5 text-center text-base">📊</span>
          <span>{lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</span>
        </NavLink>

        <NavLink to="/activity" onClick={onClose}
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
          <span className="w-5 text-center text-base">📜</span>
          <span>{lang === 'ar' ? 'سجل النشاط' : 'Activity Log'}</span>
        </NavLink>

        {/* Project nav */}
        {project && (
          <>
            {/* Current project badge */}
            <div className="mt-4 mb-3 mx-0.5">
              <div className="bg-gradient-to-b from-blue-600/20 to-blue-600/10 border border-blue-500/20 rounded-2xl px-3.5 py-3">
                <p className="text-blue-400/70 text-[9px] font-bold uppercase tracking-[0.15em] mb-1">
                  {lang === 'ar' ? 'المشروع الحالي' : 'Current Project'}
                </p>
                <p className="text-white text-sm font-bold leading-snug truncate">{project.name_ar}</p>
                {project.name_en && (
                  <p className="text-slate-500 text-[10px] truncate mt-0.5">{project.name_en}</p>
                )}
              </div>
            </div>

            {/* Summary link */}
            <NavLink
              to={`/project/${project.id}`}
              end
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/40'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`
              }
            >
              <span className="text-base flex-shrink-0">📊</span>
              <span className="truncate">{lang === 'ar' ? 'ملخص المشروع' : 'Summary'}</span>
            </NavLink>

            {/* 4 sections — card style */}
            <div className="space-y-1.5 pt-1">
              {PROJECT_NAV.map(group => {
                const style = SECTION_STYLE[group.section];
                return (
                  <div key={group.section} className={`rounded-xl ring-1 ${style.ring} overflow-hidden`}>
                    {/* Section header */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 ${style.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                      <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${style.text}`}>
                        {t(lang, group.section)}
                      </p>
                    </div>

                    {/* Sub-links */}
                    <div className="p-1 space-y-0.5">
                      {group.items.map(item => (
                        <NavLink
                          key={item.path}
                          to={`/project/${project.id}/${item.path}`}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                              isActive
                                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/30'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`
                          }
                        >
                          <span className="text-sm flex-shrink-0">{item.icon}</span>
                          <span className="truncate">{t(lang, item.label)}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back button */}
            <div className="pt-4">
              <button
                onClick={() => { navigate('/'); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-800 hover:text-slate-300 text-xs font-medium transition-all border border-slate-700/50 hover:border-slate-600"
              >
                <span className="text-base">←</span>
                <span>{lang === 'ar' ? 'العودة للمشاريع' : 'Back to Projects'}</span>
              </button>
            </div>
          </>
        )}
      </nav>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-slate-700/50 flex-shrink-0">
        <p className="text-slate-700 text-[9px] text-center tracking-wide">
          {lang === 'ar' ? '© نظام إدارة المشاريع' : '© Construction Mgmt'}
        </p>
      </div>
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
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
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
