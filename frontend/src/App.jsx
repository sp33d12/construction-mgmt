import { BrowserRouter, Routes, Route, Navigate, useParams, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import { ProjectContext } from './contexts/ProjectContext';
import api from './api/client';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reports from './pages/works/Reports';
import Salaries from './pages/finance/Salaries';
import Funds from './pages/finance/Funds';
import Contractors from './pages/finance/Contractors';
import Warehouse from './pages/Warehouse';
import OutgoingLetters from './pages/administrative/OutgoingLetters';
import IncomingLetters from './pages/administrative/IncomingLetters';
import AdminOrders from './pages/administrative/AdminOrders';
import ActivityLog from './pages/ActivityLog';
import Overview from './pages/Overview';

// Loads the project from API and provides it via context to nested routes
function ProjectProvider() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (projectId) {
      api.get(`/projects/${projectId}`)
        .then(r => setProject(r.data))
        .catch(() => setProject(null));
    }
  }, [projectId]);

  return (
    <ProjectContext.Provider value={project}>
      <Outlet />
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
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Dashboard — shows all projects */}
        <Route index element={<Dashboard />} />

        {/* Project-scoped routes — all pages filtered to one project */}
        <Route path="project/:projectId" element={<ProjectProvider />}>
          <Route index element={<Navigate to="reports" replace />} />
          <Route path="reports"           element={<Reports />} />
          <Route path="salaries"          element={<Salaries />} />
          <Route path="funds"             element={<Funds />} />
          <Route path="contractors"       element={<Contractors />} />
          <Route path="warehouse"         element={<Warehouse />} />
          <Route path="admin/outgoing"    element={<OutgoingLetters />} />
          <Route path="admin/incoming"    element={<IncomingLetters />} />
          <Route path="admin/orders"      element={<AdminOrders />} />
        </Route>

        {/* Global pages (not project-scoped) */}
        <Route path="overview"  element={<Overview />} />
        <Route path="activity"  element={<ActivityLog />} />
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
