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
  PlusCircle,
  FileText,
  AlertCircle,
  ChevronRight,
  Send,
  Inbox
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SystemDashboard = () => {
  const [stats, setStats] = useState({
    total_documents: 0,
    total_departments: 0,
    total_workers: 0,
    recent_logs: [],
    status_counts: {
      in_transit: 0,
      picked_up: 0,
      in_progress: 0,
      forwarded: 0,
      completed: 0
    },
    top_departments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [depts, users, docs, audit] = await Promise.all([
        api.get('/departments'),
        api.get('/users'),
        api.get('/documents'),
        api.get('/audit?limit=8')
      ]);

      const deptsData = depts.data.data || [];
      const usersData = users.data.data || [];
      const docsData = docs.data.data || [];
      const auditData = audit.data.data || [];

      // Calculate status distribution
      const counts = { in_transit: 0, picked_up: 0, in_progress: 0, forwarded: 0, completed: 0 };
      docsData.forEach(d => {
        if (counts[d.status] !== undefined) counts[d.status]++;
      });

      // Calculate department activity (Top 5)
      const deptActivity = deptsData.map(dept => {
        const sent = docsData.filter(d => d.sender_department_id === dept.id).length;
        const received = docsData.filter(d => d.receiver_department_id === dept.id).length;
        return { name: dept.name, code: dept.code, total: sent + received, sent, received };
      }).sort((a, b) => b.total - a.total).slice(0, 5);

      setStats({
        total_departments: deptsData.length,
        total_workers: usersData.filter(u => u.role === 'worker').length,
        total_documents: docsData.length,
        recent_logs: auditData,
        status_counts: counts,
        top_departments: deptActivity
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Files', value: stats.total_documents, icon: <Files size={24} className="text-indigo-600" />, color: 'bg-indigo-50', path: '/admin/documents' },
    { label: 'Pending Inbox', value: stats.status_counts.in_transit, icon: <Inbox size={24} className="text-amber-600" />, color: 'bg-amber-50', path: '/admin/documents?status=in_transit' },
    { label: 'In Processing', value: stats.status_counts.in_progress + stats.status_counts.picked_up, icon: <TrendingUp size={24} className="text-blue-600" />, color: 'bg-blue-50', path: '/admin/documents?status=in_progress' },
    { label: 'Completed', value: stats.status_counts.completed, icon: <CheckCircle size={24} className="text-emerald-600" />, color: 'bg-emerald-50', path: '/admin/documents?status=completed' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Command Dashboard</h2>
          <p className="text-gray-500 text-sm">Police Department Correspondence Monitoring System</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Date</p>
          <p className="text-sm font-bold text-gray-700">{new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <Link key={i} to={card.path} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex justify-between items-center relative z-10">
              <div>
                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{card.label}</h3>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  {loading ? '...' : card.value}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-xl`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors">
              VIEW DETAILED REPORT <ChevronRight size={12} className="ml-1" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document Status Distribution */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center">
                <FileText size={18} className="mr-2 text-indigo-500" />
                Department Activity Overview
              </h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Traffic Volume</span>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-xl"></div>)}
                </div>
              ) : stats.top_departments.length === 0 ? (
                <div className="text-center py-10 text-gray-400 italic text-sm">No department activity recorded yet.</div>
              ) : (
                <div className="space-y-6">
                  {stats.top_departments.map((dept, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div className="flex items-baseline space-x-2">
                          <span className="text-sm font-bold text-gray-800">{dept.name}</span>
                          <span className="text-[10px] font-mono font-bold text-gray-400">{dept.code}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-600">{dept.total} Total Documents</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full flex overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full transition-all duration-1000" 
                          style={{ width: `${(dept.sent / stats.total_documents) * 100}%` }}
                          title={`Sent: ${dept.sent}`}
                        ></div>
                        <div 
                          className="bg-amber-400 h-full transition-all duration-1000" 
                          style={{ width: `${(dept.received / stats.total_documents) * 100}%` }}
                          title={`Received: ${dept.received}`}
                        ></div>
                      </div>
                      <div className="flex gap-4 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                        <div className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-1"></div> OUTWARD: {dept.sent}</div>
                        <div className="flex items-center"><div className="w-2 h-2 bg-amber-400 rounded-full mr-1"></div> INWARD: {dept.received}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center">
                <History size={18} className="mr-2 text-indigo-500" />
                Recent System Audit Trail
              </h3>
              <Link to="/admin/audit" className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Full History</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-50">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Officer</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.recent_logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-[11px] font-mono text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="text-xs font-bold text-gray-800">{log.actor_name}</div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
                          log.action.includes('created') ? 'text-blue-600 bg-blue-50 border-blue-100' :
                          log.action.includes('completed') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                          'text-gray-500 bg-gray-50 border-gray-100'
                        }`}>
                          {log.action.replace('document.', '')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Personnel Summary</h3>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-3xl font-black">{stats.total_workers}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Registered Officers</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                  <Users size={24} className="text-indigo-400" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Total Departments</span>
                  <span className="font-bold">{stats.total_departments}</span>
                </div>
                <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-full"></div>
                </div>
              </div>
              <Link to="/admin/users" className="mt-8 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold flex items-center justify-center transition-colors">
                MANAGE PERSONNEL <ArrowRight size={14} className="ml-2" />
              </Link>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Building2 size={140} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center">
              <AlertCircle size={18} className="mr-2 text-amber-500" />
              Critical Attention
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xl font-black text-amber-700">{stats.status_counts.in_transit}</p>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Unclaimed in Inboxes</p>
                <p className="text-[9px] text-amber-500 mt-1 italic">Requires department pickup</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xl font-black text-indigo-700">{stats.status_counts.in_progress}</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Under Active Review</p>
                <p className="text-[9px] text-indigo-500 mt-1 italic">Currently assigned to officers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemDashboard;
