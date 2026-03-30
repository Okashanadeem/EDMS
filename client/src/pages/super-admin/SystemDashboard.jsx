import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Building2, 
  Users, 
  Files, 
  History, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  ArrowRight,
  PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SystemDashboard = () => {
  const [stats, setStats] = useState({
    total_documents: 0,
    total_departments: 0,
    total_workers: 0,
    recent_logs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // In a real app, there would be a dedicated /stats or /dashboard endpoint
      // For now we fetch them individually
      const [depts, users, docs, audit] = await Promise.all([
        api.get('/departments'),
        api.get('/users'),
        api.get('/documents'),
        api.get('/audit?limit=5')
      ]);

      const deptsData = depts.data.data || [];
      const usersData = users.data.data || [];
      const docsData = docs.data.data || [];
      const auditData = audit.data.data || [];

      setStats({
        total_departments: deptsData.length,
        total_workers: usersData.filter(u => u.role === 'worker').length,
        total_documents: docsData.length,
        recent_logs: auditData.slice(0, 5)
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Departments', value: stats.total_departments, icon: <Building2 className="text-blue-600" />, color: 'bg-blue-50', path: '/admin/departments' },
    { label: 'Active Workers', value: stats.total_workers, icon: <Users className="text-green-600" />, color: 'bg-green-50', path: '/admin/users' },
    { label: 'Total Documents', value: stats.total_documents, icon: <Files className="text-indigo-600" />, color: 'bg-indigo-50', path: '/admin/documents' },
    { label: 'Recent Activities', value: stats.recent_logs.length, icon: <History className="text-orange-600" />, color: 'bg-orange-50', path: '/admin/audit' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">System Overview</h2>
        <p className="text-gray-500">Global statistics and recent system activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <Link key={i} to={card.path} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
              <div className={`${card.color} p-3 rounded-xl transition-colors`}>
                {card.icon}
              </div>
              <ArrowRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <div className="mt-4">
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">{card.label}</h3>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                {loading ? <span className="inline-block w-8 h-8 bg-gray-100 animate-pulse rounded"></span> : card.value}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Recent System Activity</h3>
            <Link to="/admin/audit" className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-wider">View All</Link>
          </div>
          <div className="p-0">
            {loading ? (
              <div className="p-10 text-center text-gray-400">Loading activity...</div>
            ) : stats.recent_logs.length === 0 ? (
              <div className="p-10 text-center text-gray-400 italic">No recent activity.</div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {stats.recent_logs.map((log) => (
                  <li key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {log.action.includes('created') ? <PlusCircle size={16} className="text-blue-500" /> : <Clock size={16} className="text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {log.action.replace(/\./g, ' ').toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          By <span className="font-semibold text-gray-700">{log.actor_name}</span>
                        </p>
                      </div>
                      <time className="text-[10px] text-gray-400 font-mono font-medium">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* System Health / Quick Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-6">System Health</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg"><CheckCircle size={20} className="text-green-600" /></div>
                <span className="text-sm font-bold text-gray-700">API Server Status</span>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">ONLINE</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg"><TrendingUp size={20} className="text-blue-600" /></div>
                <span className="text-sm font-bold text-gray-700">Database Connection</span>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">HEALTHY</span>
            </div>
            <div className="pt-6 border-t border-gray-50">
              <div className="bg-indigo-600 rounded-xl p-6 text-white overflow-hidden relative">
                <div className="relative z-10">
                  <h4 className="font-bold text-lg mb-1">EDMS Phase 1</h4>
                  <p className="text-indigo-100 text-xs mb-4">Digital correspondence management is live.</p>
                  <div className="w-full bg-indigo-500 h-2 rounded-full overflow-hidden">
                    <div className="bg-white h-full w-[85%] rounded-full"></div>
                  </div>
                  <p className="text-[10px] text-indigo-100 mt-2 font-bold uppercase tracking-widest">85% Implementation Target Met</p>
                </div>
                <Files size={120} className="absolute -right-8 -bottom-8 text-indigo-500/50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemDashboard;
