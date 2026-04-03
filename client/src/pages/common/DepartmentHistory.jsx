import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { 
  Search, 
  Filter, 
  FileText, 
  Calendar, 
  ArrowRight,
  ChevronRight,
  History as HistoryIcon,
  Inbox,
  AlertCircle,
  User
} from 'lucide-react';
import Pagination from '../../components/Pagination';

const DepartmentHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, assigned, outgoing, incoming

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchHistory();
  }, [currentPage]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents/department', {
        params: {
          page: currentPage,
          limit: itemsPerPage
        }
      });
      setDocuments(response.data.data || []);
      setTotalItems(response.data.total || 0);
    } catch (err) {

      setError('Failed to fetch department history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.outward_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.inward_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'assigned') return matchesSearch && doc.assigned_to;
    if (filter === 'outgoing') return matchesSearch && doc.sender_department_id === user.department_id;
    if (filter === 'incoming') return matchesSearch && doc.receiver_department_id === user.department_id;
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Department History</h2>
          <p className="text-slate-500 font-medium">Archive of all documents handled by {user.department_name}.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search department records..." 
            className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <select 
                className="pl-10 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none cursor-pointer w-full"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Records</option>
                <option value="incoming">Incoming</option>
                <option value="outgoing">Outgoing</option>
                <option value="assigned">Picked Up</option>
              </select>
          </div>
          <button 
            onClick={fetchHistory}
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            title="Refresh History"
          >
            <HistoryIcon size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center rounded-r-xl">
          <AlertCircle className="text-red-400 mr-3" size={20} />
          <p className="text-sm text-red-700 font-bold">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Document / Date</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Official Numbers</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Movement / Handler</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Scanning Archives...</td></tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <Inbox size={40} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Records Found</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr 
                    key={doc.id} 
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group" 
                    onClick={() => navigate(`/${user.role}/document/${doc.id}`)}
                  >
                    <td className="px-6 py-6">
                      <div className="text-sm font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{doc.subject}</div>
                      <div className="text-[10px] text-slate-400 flex items-center mt-1.5 font-bold uppercase tracking-tight">
                        <Calendar size={12} className="mr-1.5 opacity-60" />
                        {new Date(doc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1.5">
                        {doc.outward_number && (
                          <span className="text-[10px] font-mono font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 w-fit">
                            OUT: {doc.outward_number}
                          </span>
                        )}
                        {doc.inward_number && (
                          <span className="text-[10px] font-mono font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 w-fit">
                            IN: {doc.inward_number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center text-[10px] text-slate-600 font-black uppercase tracking-tighter mb-1">
                        <span className="bg-slate-100 px-2 py-1 rounded-lg">{doc.sender_department_name}</span>
                        <ArrowRight size={14} className="mx-2 text-slate-300" />
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-100">{doc.receiver_department_name}</span>
                      </div>
                      <div className="flex items-center text-[10px] text-slate-400 font-bold">
                        <User size={12} className="mr-1 opacity-50" />
                        {doc.assignee_name ? (
                          <span className="text-slate-600">Handled by: <span className="text-indigo-600">{doc.assignee_name}</span></span>
                        ) : (
                          <span className="italic">Unclaimed</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap text-right">
                      <Link 
                        to={`/${user.role}/document/${doc.id}`}
                        className="inline-flex items-center p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ChevronRight size={20} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        total={totalItems}
        page={currentPage}
        limit={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>

  );
};

export default DepartmentHistory;
