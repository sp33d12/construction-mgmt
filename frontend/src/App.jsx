import { BrowserRouter, Routes, Route, Navigate, useMatch, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import { ProjectContext } from './contexts/ProjectContext';
import api from './api/client';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Overview from './pages/Overview';
import Reports from './pages/works/Reports';
import Finance from './pages/finance/Finance';
import Warehouse from './pages/Warehouse';
import OutgoingLetters from './pages/administrative/OutgoingLetters';
import IncomingLetters from './pages/administrative/IncomingLetters';
import AdminOrders from './pages/administrative/AdminOrders';
import ActivityLog from './pages/ActivityLog';
import ProjectSummary from './pages/ProjectSummary';

/**
 * Wraps the entire Layout (sidebar + page) with project context.
 * Uses useMatch so BOTH the sidebar and the page content see the same project.
 * This is placed inside BrowserRouter so useMatch works correctly.
 */
function ProjectAwareLayout() {
  const match = useMatch('/project/:projectId/*');
  const projectId = match?.params?.projectId;
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (projectId) {
      api.get(`/projects/${projectId}`)
        .then(r => setProject(r.data))
        .catch(() => setProject(null));
    } else {
      setProject(null);
    }
  }, [projectId]);

  return (
    <ProjectContext.Provider value={project}>
      <Layout />
    </ProjectContext.Provider>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center text-slate-500">جاري التحميل...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* All protected pages live inside ProjectAwareLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ProjectAwareLayout />
          </ProtectedRoute>
        }
      >
        {/* Global pages */}
        <Route index          element={<Dashboard />} />
        <Route path="overview" element={<Overview />} />
        <Route path="activity" element={<ActivityLog />} />

        {/* Project-scoped pages — context already provided by ProjectAwareLayout */}
        <Route path="project/:projectId">
          <Route index                  element={<ProjectSummary />} />
          <Route path="reports"         element={<Reports />} />
          <Route path="finance"         element={<Finance />} />
          <Route path="warehouse"       element={<Warehouse />} />
          <Route path="admin/outgoing"  element={<OutgoingLetters />} />
          <Route path="admin/incoming"  element={<IncomingLetters />} />
          <Route path="admin/orders"    element={<AdminOrders />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}
