import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n';
import Sidebar from './Sidebar';
import Header from './Header';

const TITLES = {
  '/': 'dashboard', '/works/projects': 'projects', '/works/reports': 'dailyReports',
  '/finance/salaries': 'salaries', '/finance/funds': 'incomingFunds',
  '/finance/contractors': 'contractors', '/warehouse': 'warehouse',
  '/admin/outgoing': 'outgoingLetters', '/admin/incoming': 'incomingLetters',
  '/admin/orders': 'adminOrders', '/activity': 'activityLog',
};

export default function Layout() {
  // Start open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { lang } = useLang();
  const location = useLocation();
  const titleKey = TITLES[location.pathname] || 'dashboard';

  return (
    /*
     * Full-screen flex row.
     * CSS `dir` on <html> makes the flex row RTL automatically:
     *   Arabic (RTL) → Sidebar on RIGHT, content on LEFT
     *   English (LTR) → Sidebar on LEFT, content on RIGHT
     * On desktop the sidebar is IN the flow (no overlay → no overlap).
     * On mobile it becomes a fixed overlay with backdrop.
     */
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={t(lang, titleKey)}
          sidebarOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(v => !v)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
