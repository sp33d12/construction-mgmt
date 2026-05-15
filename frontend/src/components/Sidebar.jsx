import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useProject } from '../contexts/ProjectContext';
import { t } from '../i18n';

// Project-scoped sub-navigation
const PROJECT_NAV = [
  {
    section: 'works', icon: '⚙️',
    items: [
      { path: 'reports', label: 'dailyReports', icon: '📋' },
    ],
  },
  {
    section: 'finance', icon: '📑',
    items: [
      { path: 'finance', label: 'finance', icon: '📑' },
    ],
  },
  {
    section: 'warehouse', icon: '🏭',
    items: [
      { path: 'warehouse', label: 'warehouse', icon: '🏭' },
    ],
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

// Reusable nav link
function SideLink({ to, icon, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
          isActive
            ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/30'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`
      }
    >
      <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function SectionLabel({ text }) {
  return (
    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.12em] px-3 pt-4 pb-1">
      {text}
    </p>
  );
}

function NavContent({ onClose }) {
  const { user } = useAuth();
  const { lang } = useLang();
  const project = useProject();
  const navigate = useNavigate();
  const location = useLocation();

  // Track which accordion sections are open
  const [openSections, setOpenSections] = useState(() => {
    // Auto-open the section that matches the current URL
    const path = location.pathname;
    const initial = {};
    PROJECT_NAV.forEach(g => {
      initial[g.section] = g.items.some(i => path.includes(i.path));
    });
    return initial;
  });

  const toggleSection = section =>
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));

  return (
    <div className="flex flex-col h-full bg-slate-900 w-64">

      {/* ── Logo ───────────────────────────────────────────────── */}
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

      {/* ── User badge ─────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <div className="bg-slate-800 rounded-xl px-3 py-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">
            {(user?.fullNameAr || user?.fullName || '?')[0]}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.fullNameAr || user?.fullName}</p>
            <p className="text-blue-400 text-[10px]">{t(lang, user?.role || '')}</p>
          </div>
        </div>
      </div>

      {/* ── Nav ────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">

        {/* ── Global links (always visible) ─────────────────── */}
        <SectionLabel text={lang === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'} />

        <SideLink to="/" end icon="🏠" label={lang === 'ar' ? 'الرئيسية' : 'Home'} onClick={onClose} />
        <SideLink to="/overview" icon="📊" label={lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'} onClick={onClose} />
        <SideLink to="/activity" icon="📜" label={lang === 'ar' ? 'سجل النشاط' : 'Activity Log'} onClick={onClose} />

        {/* ── Project sub-nav (only when inside a project) ──── */}
        {project && (
          <>
            {/* Project header badge */}
            <div className="mx-1 mt-5 mb-1">
              <div className="bg-blue-600/15 border border-blue-500/25 rounded-xl px-3 py-2.5">
                <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                  {lang === 'ar' ? 'المشروع الحالي' : 'Current Project'}
                </p>
                <p className="text-white text-sm font-bold truncate leading-snug">{project.name_ar}</p>
                {project.name_en && <p className="text-slate-400 text-[10px] truncate">{project.name_en}</p>}
              </div>
            </div>

            <div className="mt-2 space-y-1">
              {PROJECT_NAV.map(group => {
                const isOpen = openSections[group.section];
                const hasActive = group.items.some(i =>
                  location.pathname.includes(`/project/${project.id}/${i.path}`)
                );
                return (
                  <div key={group.section} className="rounded-xl overflow-hidden">
                    {/* Section accordion button */}
                    <button
                      onClick={() => toggleSection(group.section)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-all rounded-xl ${
                        hasActive
                          ? 'bg-blue-600/20 text-blue-300'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-base w-5 text-center flex-shrink-0">{group.icon}</span>
                      <span className="flex-1 text-start">{t(lang, group.section)}</span>
                      <span className={`text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        ▾
                      </span>
                    </button>

                    {/* Sub-items */}
                    {isOpen && (
                      <div className="mt-0.5 ms-3 ps-3 border-s border-slate-700/60 space-y-0.5 pb-1">
                        {group.items.map(item => (
                          <NavLink
                            key={item.path}
                            to={`/project/${project.id}/${item.path}`}
                            onClick={onClose}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                                isActive
                                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/30'
                                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                              }`
                            }
                          >
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span>{t(lang, item.label)}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Back to projects */}
            <div className="pt-3 px-1">
              <button
                onClick={() => { navigate('/'); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-800 hover:text-slate-300 text-xs transition-all"
              >
                <span>←</span>
                <span>{lang === 'ar' ? 'العودة للمشاريع' : 'Back to Projects'}</span>
              </button>
            </div>
          </>
        )}
      </nav>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-slate-700/50 flex-shrink-0">
        <p className="text-slate-600 text-[10px] text-center">
          {lang === 'ar' ? 'نظام إدارة المشاريع الإنشائية' : 'Construction Management System'}
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
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
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
