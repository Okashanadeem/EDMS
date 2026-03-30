import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import WorkerLayout from './layouts/WorkerLayout';
import Departments from './pages/super-admin/Departments';
import UserManagement from './pages/super-admin/UserManagement';
import SystemDashboard from './pages/super-admin/SystemDashboard';
import AllDocuments from './pages/super-admin/AllDocuments';
import AuditLog from './pages/super-admin/AuditLog';
import CreateDocument from './pages/worker/CreateDocument';
import DeptInbox from './pages/worker/DeptInbox';
import MyDocuments from './pages/worker/MyDocuments';
import DocumentDetail from './pages/worker/DocumentDetail';
import WorkerDashboard from './pages/worker/WorkerDashboard';

// Basic Login Component
const LoginPage = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // If already authenticated, redirect to appropriate dashboard
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'super_admin' ? '/admin/dashboard' : '/worker/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    const result = await login(email, password);
    setIsSubmitting(false);
    
    if (result.success) {
      const redirectPath = result.user.role === 'super_admin' ? '/admin/dashboard' : '/worker/dashboard';
      navigate(redirectPath, { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            EDMS Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your document dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                placeholder="superadmin@edms.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RoleRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  return user.role === 'super_admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/worker/dashboard" replace />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Super Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route element={<SuperAdminLayout />}>
          <Route path="/admin/dashboard" element={<SystemDashboard />} />
          <Route path="/admin/departments" element={<Departments />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/documents" element={<AllDocuments />} />
          <Route path="/admin/audit" element={<AuditLog />} />
        </Route>
      </Route>

      {/* Worker Routes */}
      <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
        <Route element={<WorkerLayout />}>
          <Route path="/worker/dashboard" element={<WorkerDashboard />} />
          <Route path="/worker/inbox" element={<DeptInbox />} />
          <Route path="/worker/create" element={<CreateDocument />} />
          <Route path="/worker/my-documents" element={<MyDocuments />} />
          <Route path="/worker/document/:id" element={<DocumentDetail />} />
        </Route>
      </Route>

      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
};

export default App;
