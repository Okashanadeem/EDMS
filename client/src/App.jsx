import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import SuperAdminLayout from './layouts/SuperAdminLayout';
import WorkerLayout from './layouts/WorkerLayout';
import OfficerLayout from './layouts/OfficerLayout';
import AssistantLayout from './layouts/AssistantLayout';

// Admin Pages
import Departments from './pages/super-admin/Departments';
import UserManagement from './pages/super-admin/UserManagement';
import SystemDashboard from './pages/super-admin/SystemDashboard';
import AllDocuments from './pages/super-admin/AllDocuments';
import AuditLog from './pages/super-admin/AuditLog';

// Common Pages (Phase 1.1)
import Compose from './pages/common/Compose';
import Drafts from './pages/common/Drafts';
import DocumentDetail from './pages/common/DocumentDetail';

// Role Specific Dashboards
import WorkerDashboard from './pages/worker/WorkerDashboard';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import AssistantDashboard from './pages/assistant/AssistantDashboard';
import DeptInbox from './pages/worker/DeptInbox';
import CorrespondenceHistory from './pages/common/CorrespondenceHistory';
import DepartmentHistory from './pages/common/DepartmentHistory';

// Basic Login Component
const LoginPage = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const path = user.role === 'super_admin' ? 'admin' : user.role;
      navigate(`/${path}/dashboard`, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    if (!result.success) setError(result.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
            <span className="text-white font-black text-3xl">E</span>
          </div>
          <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">EDMS Portal</h2>
          <p className="mt-2 text-sm font-medium text-slate-500 uppercase tracking-widest">Correspondence Management</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 border-l-4 border-red-400 p-4 text-xs font-bold text-red-700">{error}</div>}
          <div className="space-y-4">
            <input
              type="email" required
              className="block w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Email Address"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password" required
              className="block w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit" disabled={isSubmitting}
            className="w-full flex justify-center py-4 px-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

const RoleRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user) return null;
  const path = user.role === 'super_admin' ? 'admin' : user.role;
  return <Navigate to={`/${path}/dashboard`} replace />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Super Admin */}
      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route element={<SuperAdminLayout />}>
          <Route path="/admin/dashboard" element={<SystemDashboard />} />
          <Route path="/admin/departments" element={<Departments />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/documents" element={<AllDocuments />} />
          <Route path="/admin/audit" element={<AuditLog />} />
          <Route path="/admin/document/:id" element={<DocumentDetail />} />
        </Route>
      </Route>

      {/* Worker */}
      <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
        <Route element={<WorkerLayout />}>
          <Route path="/worker/dashboard" element={<WorkerDashboard />} />
          <Route path="/worker/compose" element={<Compose />} />
          <Route path="/worker/compose/:id" element={<Compose />} />
          <Route path="/worker/drafts" element={<Drafts />} />
          <Route path="/worker/inbox" element={<DeptInbox />} />
          <Route path="/worker/my-documents" element={<CorrespondenceHistory />} />
          <Route path="/worker/history" element={<DepartmentHistory />} />
          <Route path="/worker/document/:id" element={<DocumentDetail />} />
        </Route>
      </Route>

      {/* Officer */}
      <Route element={<ProtectedRoute allowedRoles={['officer']} />}>
        <Route element={<OfficerLayout />}>
          <Route path="/officer/dashboard" element={<OfficerDashboard />} />
          <Route path="/officer/compose" element={<Compose />} />
          <Route path="/officer/compose/:id" element={<Compose />} />
          <Route path="/officer/drafts" element={<Drafts />} />
          <Route path="/officer/inbox" element={<DeptInbox role="officer" />} />
          <Route path="/officer/my-documents" element={<CorrespondenceHistory />} />
          <Route path="/officer/history" element={<DepartmentHistory />} />
          <Route path="/officer/document/:id" element={<DocumentDetail />} />
        </Route>
      </Route>

      {/* Assistant */}
      <Route element={<ProtectedRoute allowedRoles={['assistant']} />}>
        <Route element={<AssistantLayout />}>
          <Route path="/assistant/dashboard" element={<AssistantDashboard />} />
          <Route path="/assistant/compose" element={<Compose />} />
          <Route path="/assistant/compose/:id" element={<Compose />} />
          <Route path="/assistant/drafts" element={<Drafts />} />
          <Route path="/assistant/inbox" element={<DeptInbox role="assistant" />} />
          <Route path="/assistant/my-documents" element={<CorrespondenceHistory />} />
          <Route path="/assistant/history" element={<DepartmentHistory />} />
          <Route path="/assistant/document/:id" element={<DocumentDetail />} />
        </Route>
      </Route>

      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
};

export default App;
