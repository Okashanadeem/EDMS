import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowUpDown
} from 'lucide-react';

const AllDocuments = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    department_id: '',
    status: '',
    from_date: '',
    to_date: ''
  });

  useEffect(() => {
    fetchDocuments();
    fetchDepartments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.department_id) params.append('department_id', filters.department_id);
      if (filters.status) params.append('status', filters.status);
      
      const response = await api.get(`/documents?${params.toString()}`);
      setDocuments(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
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

  const filteredDocs = documents.filter(doc => 
    doc.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
    doc.outward_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
    doc.inward_number?.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">System Documents</h2>
        <button 
          onClick={fetchDocuments}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-bold text-sm"
        >
          Apply Filters
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="md:col-span-1 lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              name="search"
              placeholder="Search by subject or document number..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full text-sm"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <select 
              name="department_id"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
              value={filters.department_id}
              onChange={handleFilterChange}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <select 
              name="status"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
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
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center rounded-lg">
          <AlertCircle className="text-red-400 mr-3" size={20} />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Document</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Departments</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Numbers</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-20 text-center text-gray-400">Loading documents...</td></tr>
              ) : filteredDocs.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-20 text-center text-gray-400 italic">No documents found matching filters.</td></tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => navigate(`/worker/document/${doc.id}`)}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{doc.subject}</div>
                      <div className="flex items-center text-[10px] text-gray-400 mt-1 font-bold">
                        <Calendar size={10} className="mr-1" />
                        {new Date(doc.created_at).toLocaleDateString()}
                        <span className="mx-2">•</span>
                        <User size={10} className="mr-1" />
                        {doc.sender_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-bold text-gray-700">{doc.sender_department_name}</span>
                        <ArrowUpDown size={10} className="text-gray-300" />
                        <span className="font-bold text-gray-700">{doc.receiver_department_name}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {doc.assigned_worker_name ? `Assigned to: ${doc.assigned_worker_name}` : 'Unclaimed'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {doc.outward_number && (
                          <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 w-fit">
                            OUT: {doc.outward_number}
                          </span>
                        )}
                        {doc.inward_number && (
                          <span className="text-[9px] font-mono font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 w-fit">
                            IN: {doc.inward_number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-300 group-hover:text-indigo-600 transition-colors p-1">
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
    </div>
  );
};

export default AllDocuments;
