import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n';

const NAV = [
  { to: '/works/reports',       label: 'dailyReports',    icon: '📋' },
  { to: '/finance/salaries',    label: 'salaries',        icon: '💰' },
  { to: '/finance/funds',       label: 'incomingFunds',   icon: '📥' },
  { to: '/finance/contractors', label: 'contractors',     icon: '🔧' },
  { to: '/warehouse',           label: 'warehouse',       icon: '🏭' },
  { to: '/admin/outgoing',      label: 'outgoingLetters', icon: '📤' },
  { to: '/admin/incoming',      label: 'incomingLetters', icon: '📨' },
  { to: '/admin/orders',        label: 'adminOrders',     icon: '📄' },
];

export default function Layout() {
  const { user, logout, isEngineer } = useAuth();
  const { lang, toggle } = useLang();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = isEngineer ? [...NAV, { to: '/activity', label: 'activityLog', icon: '📊' }] : NAV;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── TOP NAVBAR ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 h-14 gap-3">

          {/* Logo — click goes home */}
          <button onClick={() => { navigate('/'); setMobileOpen(false); }}
            className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm">م</div>
            <span className="hidden sm:block font-bold text-slate-800 text-sm leading-tight">
              {lang === 'ar' ? 'إدارة المشاريع' : 'Project Mgmt'}
            </span>
          </button>

          {/* Desktop nav links — scrollable */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto flex-1 mx-4">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0
                  ${isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`
                }>
                <span>{item.icon}</span>
                <span>{t(lang, item.label)}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right side: user + lang + logout + mobile menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="hidden sm:block text-xs text-slate-500 font-medium">
              {user?.fullNameAr || user?.fullName}
            </span>
            <button onClick={toggle}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>
            <button onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-medium transition-colors">
              <span>🚪</span>
              <span className="hidden sm:inline">{t(lang, 'logout')}</span>
            </button>
            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(v => !v)}
              className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
              <span className={`block h-0.5 w-5 bg-slate-600 rounded-full transition-all ${mobileOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
              <span className={`block h-0.5 w-4 bg-slate-600 rounded-full transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-5 bg-slate-600 rounded-full transition-all ${mobileOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 grid grid-cols-2 gap-2">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`
                }>
                <span>{item.icon}</span>
                <span>{t(lang, item.label)}</span>
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* ── PAGE CONTENT ───────────────────────────────────────── */}
      <main className="flex-1 p-4 lg:p-6 fade-in">
        <Outlet />
      </main>
    </div>
  );
}
