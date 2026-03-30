import React from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Files, 
  History, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

const SuperAdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { label: 'Departments', icon: <Building2 size={20} />, path: '/admin/departments' },
    { label: 'Users', icon: <Users size={20} />, path: '/admin/users' },
    { label: 'All Documents', icon: <Files size={20} />, path: '/admin/documents' },
    { label: 'Audit Log', icon: <History size={20} />, path: '/admin/audit' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between">
          {isSidebarOpen && <span className="font-bold text-xl tracking-wider">EDMS ADMIN</span>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-slate-800 rounded"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 mt-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center p-4 hover:bg-slate-800 transition-colors group"
            >
              <span className="text-slate-400 group-hover:text-white">{item.icon}</span>
              {isSidebarOpen && <span className="ml-4">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-2 hover:bg-red-900/20 text-red-400 rounded transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-4">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-gray-800">
            Welcome, {user?.name}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              Super Admin
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
