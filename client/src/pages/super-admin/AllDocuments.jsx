import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import { 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  User, 
  ChevronRight,
  Download,
  AlertCircle,
  ArrowRight,
  History as HistoryIcon,
  RefreshCw,
  FileText,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';
import Pagination from '../../components/Pagination';

const AllDocuments = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    department_id: '',
    status: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, [currentPage]);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchDocuments(), fetchDepartments()]);
    setLoading(false);
  };

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.department_id) params.append('department_id', filters.department_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('q', filters.search);
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);
      
      const response = await api.get(`/documents?${params.toString()}`);
      setDocuments(response.data.data || []);
      setTotalItems(response.data.total || 0);
      setError('');
    } catch (err) {
      setError('System Registry: Failed to retrieve official records.');
    }
  };


  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchDocuments();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">System-Wide Correspondence</h2>
          <p className="text-slate-500 font-medium">Master registry of all official communications and departmental movements.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={fetchDocuments}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            title="Reload Registry"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin text-indigo-600' : 'text-slate-600'} />
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <form onSubmit={handleApplyFilters} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
        <div className="relative flex-[2] w-full">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Search Registry</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              name="search"
              placeholder="Subject, Outward No, Inward No..." 
              className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none w-full transition-all text-sm font-bold"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Department</label>
          <select 
            name="department_id"
            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none cursor-pointer font-bold"
            value={filters.department_id}
            onChange={handleFilterChange}
          >
            <option value="">All Units</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Workflow Status</label>
          <select 
            name="status"
            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none cursor-pointer font-bold"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            <option value="in_transit">In Transit</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_progress">In Progress</option>
            <option value="forwarded">Forwarded</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button 
          type="submit"
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-black text-sm uppercase tracking-widest"
        >
          Query
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center rounded-r-2xl">
          <AlertCircle className="text-red-400 mr-3" size={20} />
          <p className="text-sm text-red-700 font-black uppercase tracking-tight">{error}</p>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Official Record</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Logistics Path</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Status</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registry identifiers</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="px-8 py-24 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Scanning System Database...</td></tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-32 text-center">
                    <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <HistoryIcon size={40} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Records Found</p>
                    <p className="text-slate-300 text-[10px] mt-1 font-bold uppercase">Adjust your parameters or query the main registry again.</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr 
                    key={doc.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer" 
                    onClick={() => navigate(`/admin/document/${doc.id}`)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mr-4 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                          {doc.is_restricted ? <ShieldAlert size={20} /> : <FileText size={20} />}
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{doc.subject}</div>
                          <div className="flex items-center text-[10px] text-slate-400 mt-1 font-black uppercase tracking-tighter">
                            <Calendar size={12} className="mr-1.5 opacity-60" />
                            {new Date(doc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            <span className="mx-2 opacity-30">•</span>
                            <User size={12} className="mr-1.5 opacity-60" />
                            {doc.creator_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center text-[10px] text-slate-600 font-black uppercase tracking-tighter">
                        <span className="bg-slate-100 px-2 py-1 rounded-lg">{doc.sender_department_name}</span>
                        <ArrowRight size={14} className="mx-2 text-slate-300" />
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-100">{doc.receiver_department_name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">
                        {doc.assignee_name ? (
                          <span className="flex items-center"><User size={10} className="mr-1" /> Custody: {doc.assignee_name}</span>
                        ) : (
                          <span className="flex items-center italic text-amber-500">In Transit / Pending Pickup</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        {doc.outward_number && (
                          <span className="text-[10px] font-mono font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 w-fit tracking-tighter">
                            OUT: {doc.outward_number}
                          </span>
                        )}
                        {doc.inward_number && (
                          <span className="text-[10px] font-mono font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 w-fit tracking-tighter">
                            IN: {doc.inward_number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="inline-flex items-center p-2.5 text-slate-300 group-hover:text-indigo-600 group-hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent group-hover:border-slate-100">
                        <ChevronRight size={20} />
                      </button>
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

export default AllDocuments;
