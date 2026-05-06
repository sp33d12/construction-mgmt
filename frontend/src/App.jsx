import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/works/Projects';
import Reports from './pages/works/Reports';
import Salaries from './pages/finance/Salaries';
import Funds from './pages/finance/Funds';
import Contractors from './pages/finance/Contractors';
import Warehouse from './pages/Warehouse';
import OutgoingLetters from './pages/administrative/OutgoingLetters';
import IncomingLetters from './pages/administrative/IncomingLetters';
import AdminOrders from './pages/administrative/AdminOrders';
import ActivityLog from './pages/ActivityLog';

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
        <Route index element={<Dashboard />} />
        <Route path="works/projects" element={<Projects />} />
        <Route path="works/reports" element={<Reports />} />
        <Route path="finance/salaries" element={<Salaries />} />
        <Route path="finance/funds" element={<Funds />} />
        <Route path="finance/contractors" element={<Contractors />} />
        <Route path="warehouse" element={<Warehouse />} />
        <Route path="admin/outgoing" element={<OutgoingLetters />} />
        <Route path="admin/incoming" element={<IncomingLetters />} />
        <Route path="admin/orders" element={<AdminOrders />} />
        <Route path="activity" element={<ActivityLog />} />
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
