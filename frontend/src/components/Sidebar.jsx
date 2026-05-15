import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n';

const NAV = [
  { to: '/', label: 'dashboard', icon: '⊞', exact: true },
  { to: '/works/projects',      label: 'projects',        icon: '🏗' },
  { to: '/works/reports',       label: 'dailyReports',    icon: '📋' },
  { to: '/finance/salaries',    label: 'salaries',        icon: '💰' },
  { to: '/finance/funds',       label: 'incomingFunds',   icon: '📥' },
  { to: '/finance/contractors', label: 'contractors',     icon: '🔧' },
  { to: '/warehouse',           label: 'warehouse',       icon: '🏭' },
  { to: '/admin/outgoing',      label: 'outgoingLetters', icon: '📤' },
  { to: '/admin/incoming',      label: 'incomingLetters', icon: '📨' },
  { to: '/admin/orders',        label: 'adminOrders',     icon: '📄' },
];

function NavContent({ onClose }) {
  const { user, isEngineer } = useAuth();
  const { lang } = useLang();
  const items = isEngineer ? [...NAV, { to: '/activity', label: 'activityLog', icon: '📊' }] : NAV;

  return (
    <div className="flex flex-col h-full bg-slate-900 w-64">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">م</div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight">نظام إدارة</p>
            <p className="text-slate-400 text-xs">المشاريع الإنشائية</p>
          </div>
        </div>
      </div>

      {/* User badge */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <div className="bg-slate-800 rounded-xl px-3 py-2">
          <p className="text-white text-sm font-medium truncate">{user?.fullNameAr || user?.fullName}</p>
          <p className="text-blue-400 text-xs">{t(lang, user?.role || '')}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item, i) => {
          if (item.section) {
            return (
              <p key={i} className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 pt-4 pb-1">
                {t(lang, item.section)}
              </p>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
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
          );
        })}
      </nav>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  const { lang } = useLang();
  const isRTL = lang === 'ar';

  return (
    <>
      {/* ── MOBILE: fixed overlay (slides in/out) ── */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${open ? '' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
        {/* Panel */}
        <div className={`absolute top-0 bottom-0 transition-transform duration-300
          ${isRTL ? 'right-0' : 'left-0'}
          ${open ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}
        `}>
          <NavContent onClose={onClose} />
        </div>
      </div>

      {/* ── DESKTOP: part of flex flow (push layout, zero overlap) ── */}
      {/*
       * The outer <aside> transitions its WIDTH between 256 px and 0.
       * overflow-hidden clips the inner w-64 content during animation.
       * flex-shrink-0 prevents the main area from squishing the sidebar.
       * The inner div keeps w-64 constant so text doesn't reflow/squish.
       */}
      <aside
        className={`
          hidden lg:block flex-shrink-0 overflow-hidden
          transition-all duration-300 ease-in-out
          ${open ? 'w-64' : 'w-0'}
        `}
      >
        <div className="w-64 h-full">
          <NavContent onClose={() => {}} />
        </div>
      </aside>
    </>
  );
}
