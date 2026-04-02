import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  Inbox, 
  FileText, 
  Clock, 
  PlusCircle, 
  ChevronRight,
  TrendingUp,
  FileEdit,
  History as HistoryIcon,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

const AssistantDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    inbox_count: 0,
    draft_count: 0,
    active_count: 0,
    recent_docs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [inboxRes, mineRes, draftsRes] = await Promise.all([
        api.get('/documents/inbox'),
        api.get('/documents/mine'),
        api.get('/drafts')
      ]);

      const inboxData = inboxRes.data.data || [];
      const myDocs = mineRes.data.data || [];
      const drafts = draftsRes.data.data || [];
      
      setStats({
        inbox_count: inboxData.length,
        draft_count: drafts.filter(d => d.created_by === user.id).length,
        active_count: myDocs.filter(d => ['picked_up', 'in_progress'].includes(d.status)).length,
        recent_docs: myDocs.slice(0, 5)
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Dept Inbox', value: stats.inbox_count, icon: <Inbox size={24} />, color: 'bg-blue-500', path: '/assistant/inbox', desc: 'Registry' },
    { label: 'My Drafts', value: stats.draft_count, icon: <FileEdit size={24} />, color: 'bg-indigo-500', path: '/assistant/drafts', desc: 'Saved works' },
    { label: 'My Active', value: stats.active_count, icon: <Clock size={24} />, color: 'bg-orange-500', path: '/assistant/my-documents', desc: 'Assigned' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-indigo-950 tracking-tight">
            {user?.position_title || 'Assistant Dashboard'}
          </h2>
          <p className="text-slate-500 mt-1">Operational support for <strong>{user?.officer_name || 'Assigned Officer'}</strong>.</p>
        </div>
        <Link 
          to="/assistant/compose"
          className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 hover:-translate-y-0.5"
        >
          <PlusCircle size={20} className="mr-2" />
          Create Draft
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, i) => (
          <Link key={i} to={card.path} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-100 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-2xl text-white shadow-lg shadow-slate-100`}>
                {card.icon}
              </div>
              <TrendingUp size={16} className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{card.label}</h3>
            <div className="flex items-baseline space-x-2 mt-1">
              <p className="text-4xl font-black text-slate-900">{loading ? '...' : card.value}</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Work */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Ongoing Correspondence</h3>
            <Link to="/assistant/my-documents" className="text-[10px] font-black text-indigo-600 hover:underline flex items-center uppercase tracking-[0.2em]">
              Full History <ChevronRight size={14} />
            </Link>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest animate-pulse">Loading Operations...</div>
            ) : stats.recent_docs.length === 0 ? (
              <div className="p-20 text-center text-slate-400 italic font-medium">No recent documents assigned or created.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {stats.recent_docs.map((doc) => (
                  <Link 
                    key={doc.id} 
                    to={`/assistant/document/${doc.id}`}
                    className="p-6 hover:bg-slate-50/80 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-5 min-w-0">
                      <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
                        <FileText size={22} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{doc.subject}</p>
                        <div className="flex items-center text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-tighter">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{doc.outward_number || doc.inward_number || 'SYSTEM'}</span>
                          <span className="mx-2 opacity-30">|</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <StatusBadge status={doc.status} />
                      <ChevronRight size={20} className="text-slate-200 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Operational Guidance */}
        <div className="space-y-6">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Operational Flow</h3>
          <div className="bg-indigo-950 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-indigo-400 mb-6 border-b border-white/10 pb-4">Standard Workflow</h4>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <div className="bg-white/10 rounded-xl p-1.5 mr-4 mt-0.5 group-hover:scale-110 transition-transform"><UserCheck size={14} className="text-emerald-400" /></div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Select <span className="font-black text-white underline decoration-indigo-500 decoration-2 underline-offset-4">Behalf Of</span> in the composer to link your draft to the Officer.
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="bg-white/10 rounded-xl p-1.5 mr-4 mt-0.5 group-hover:scale-110 transition-transform"><PlusCircle size={14} className="text-amber-400" /></div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Submit your drafts for review. Check for <span className="font-black text-white underline decoration-amber-500 decoration-2 underline-offset-4">Revision Notes</span> if sent back.
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="bg-white/10 rounded-xl p-1.5 mr-4 mt-0.5 group-hover:scale-110 transition-transform"><ShieldCheck size={14} className="text-blue-400" /></div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    If authorized, use <span className="font-black text-white underline decoration-blue-500 decoration-2 underline-offset-4">OTP Dispatch</span> to send documents immediately.
                  </p>
                </li>
              </ul>
            </div>
            <ShieldCheck size={120} className="absolute -right-8 -bottom-8 text-indigo-900/50" />
          </div>
          
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm transition-all hover:bg-slate-50">
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4">Assigned Reporting</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
              You are currently reporting to <strong>{user?.officer_name || 'N/A'}</strong>. All "behalf" documents will route to their review inbox.
            </p>
            <div className="flex items-center text-[10px] font-black text-indigo-600 uppercase tracking-widest cursor-pointer hover:underline">
              <HistoryIcon size={14} className="mr-2" />
              View Action Audit Logs
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantDashboard;
