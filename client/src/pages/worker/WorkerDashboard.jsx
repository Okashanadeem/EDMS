import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Inbox, 
  FileText, 
  CheckCircle, 
  Clock, 
  PlusCircle, 
  ArrowRight,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    inbox_count: 0,
    active_count: 0,
    completed_count: 0,
    recent_docs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [inboxRes, mineRes] = await Promise.all([
        api.get('/documents/inbox'),
        api.get('/documents/mine')
      ]);

      const myDocs = mineRes.data;
      setStats({
        inbox_count: inboxRes.data.length,
        active_count: myDocs.filter(d => ['picked_up', 'in_progress'].includes(d.status)).length,
        completed_count: myDocs.filter(d => d.status === 'completed').length,
        recent_docs: myDocs.slice(0, 5)
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Dept Inbox', value: stats.inbox_count, icon: <Inbox size={24} />, color: 'bg-blue-500', path: '/worker/inbox', desc: 'Unclaimed docs' },
    { label: 'My Active', value: stats.active_count, icon: <Clock size={24} />, color: 'bg-orange-500', path: '/worker/my-documents', desc: 'Assigned to you' },
    { label: 'Completed', value: stats.completed_count, icon: <CheckCircle size={24} />, color: 'bg-green-500', path: '/worker/my-documents', desc: 'Finalized by you' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Worker Dashboard</h2>
          <p className="text-gray-500 mt-1">Overview of your tasks and departmental documents.</p>
        </div>
        <Link 
          to="/worker/create"
          className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <PlusCircle size={20} className="mr-2" />
          Create Document
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, i) => (
          <Link key={i} to={card.path} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-xl text-white shadow-lg shadow-gray-100`}>
                {card.icon}
              </div>
              <TrendingUp size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
            </div>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">{card.label}</h3>
            <div className="flex items-baseline space-x-2 mt-1">
              <p className="text-3xl font-black text-gray-900">{loading ? '...' : card.value}</p>
              <p className="text-xs text-gray-400 font-medium">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Work */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-lg">Your Recent Documents</h3>
            <Link to="/worker/my-documents" className="text-xs font-bold text-indigo-600 hover:underline flex items-center uppercase tracking-wider">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-gray-400">Loading documents...</div>
            ) : stats.recent_docs.length === 0 ? (
              <div className="p-10 text-center text-gray-400 italic">No recent activity. Click "Create Document" to start.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {stats.recent_docs.map((doc) => (
                  <Link 
                    key={doc.id} 
                    to={`/worker/document/${doc.id}`}
                    className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-white transition-colors">
                        <FileText size={20} className="text-gray-400 group-hover:text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{doc.subject}</p>
                        <div className="flex items-center text-[10px] text-gray-400 mt-1 font-bold">
                          <span className="font-mono">{doc.outward_number || doc.inward_number}</span>
                          <span className="mx-2 text-gray-300">|</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <StatusBadge status={doc.status} />
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Tips */}
        <div className="space-y-6">
          <h3 className="font-bold text-gray-800 text-lg">System Guidance</h3>
          <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-bold text-sm uppercase tracking-widest text-indigo-300 mb-4">Document Workflow</h4>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-indigo-800 rounded-full p-1 mr-3 mt-0.5"><CheckCircle size={12} /></div>
                  <p className="text-xs text-indigo-100 leading-relaxed">
                    Check the <span className="font-bold text-white">Inbox</span> for new incoming documents for your department.
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="bg-indigo-800 rounded-full p-1 mr-3 mt-0.5"><CheckCircle size={12} /></div>
                  <p className="text-xs text-indigo-100 leading-relaxed">
                    Once <span className="font-bold text-white">Picked Up</span>, a document belongs to you. No one else can process it.
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="bg-indigo-800 rounded-full p-1 mr-3 mt-0.5"><CheckCircle size={12} /></div>
                  <p className="text-xs text-indigo-100 leading-relaxed">
                    Use <span className="font-bold text-white">Forward</span> to send a document to another department for their action.
                  </p>
                </li>
              </ul>
            </div>
            <Inbox size={120} className="absolute -right-8 -bottom-8 text-indigo-800/50" />
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h4 className="font-bold text-gray-800 text-sm mb-4">Need Help?</h4>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              If you encounter technical issues or need access to more departments, contact your Super Admin.
            </p>
            <div className="flex items-center text-xs font-bold text-indigo-600">
              <History size={14} className="mr-2" />
              View full audit trail in details
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
