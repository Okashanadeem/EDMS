import React, { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Inbox, 
  FileText, 
  LogOut,
  Menu,
  X,
  ShieldCheck,
  History as HistoryIcon
} from 'lucide-react';

const WorkerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/worker/dashboard' },
    { label: 'Compose', icon: <PlusCircle size={20} />, path: '/worker/compose' },
    { label: 'Drafts', icon: <FileText size={20} />, path: '/worker/drafts' },
    { label: 'Department Inbox', icon: <Inbox size={20} />, path: '/worker/inbox' },
    { label: 'My Documents', icon: <FileText size={20} />, path: '/worker/my-documents' },
    { label: 'History', icon: <HistoryIcon size={20} />, path: '/worker/history' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-indigo-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between">
          {isSidebarOpen && <span className="font-bold text-xl tracking-wider">EDMS</span>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-indigo-800 rounded"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 mt-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center p-4 hover:bg-indigo-800 transition-colors group"
            >
              <span className="text-indigo-400 group-hover:text-white">{item.icon}</span>
              {isSidebarOpen && <span className="ml-4">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-800 space-y-2">
          {isSidebarOpen && (
            <div className="mb-4 text-indigo-300 px-2 text-xs">
              <p className="font-semibold uppercase tracking-wider">Department</p>
              <p className="text-sm mt-1">{user?.department_name || 'Assigned Dept'}</p>
            </div>
          )}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center w-full p-2 hover:bg-indigo-800 text-indigo-300 rounded transition-colors text-sm"
          >
            <ShieldCheck size={20} />
            {isSidebarOpen && <span className="ml-4">Security</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-2 hover:bg-red-900/20 text-red-400 rounded transition-colors text-sm"
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
            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
              Worker
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </div>
  );
};

export default WorkerLayout;
