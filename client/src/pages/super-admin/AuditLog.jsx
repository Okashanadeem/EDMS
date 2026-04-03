import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  History, 
  Search, 
  Filter, 
  User, 
  Tag, 
  Calendar,
  Download,
  AlertCircle,
  RefreshCw,
  Clock,
  Info
} from 'lucide-react';
import Pagination from '../../components/Pagination';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    actor_id: '',
    from: '',
    to: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);

      const response = await api.get(`/audit?${params.toString()}`);
      setLogs(response.data.data || []);
      setTotalItems(response.data.total || 0);
      setError('');
    } catch (err) {
      setError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };


  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const getActionColor = (action) => {
    if (action.includes('created')) return 'text-blue-600 bg-blue-50 border-blue-100';
    if (action.includes('deleted') || action.includes('deactivated')) return 'text-red-600 bg-red-50 border-red-100';
    if (action.includes('updated') || action.includes('reset')) return 'text-orange-600 bg-orange-50 border-orange-100';
    if (action.includes('picked_up')) return 'text-yellow-600 bg-yellow-50 border-yellow-100';
    if (action.includes('completed')) return 'text-green-600 bg-green-50 border-green-100';
    return 'text-gray-600 bg-gray-50 border-gray-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">System Audit Log</h2>
          <p className="text-gray-500 text-sm">Traceable record of all critical system actions.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setIsRefreshing(true);
              fetchLogs();
            }}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm font-bold text-gray-700"
          >
            <RefreshCw size={18} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={fetchLogs}
            className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md font-bold text-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Action Type</label>
          <select 
            name="action"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
            value={filters.action}
            onChange={handleFilterChange}
          >
            <option value="">All Actions</option>
            <option value="document.created">Document Created</option>
            <option value="document.picked_up">Document Picked Up</option>
            <option value="document.started">Document Started</option>
            <option value="document.forwarded">Document Forwarded</option>
            <option value="document.completed">Document Completed</option>
            <option value="user.created">User Created</option>
            <option value="user.password_reset">Password Reset</option>
            <option value="department.created">Department Created</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Entity</label>
          <select 
            name="entity_type"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
            value={filters.entity_type}
            onChange={handleFilterChange}
          >
            <option value="">All Entities</option>
            <option value="document">Document</option>
            <option value="user">User</option>
            <option value="department">Department</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">From Date</label>
          <input 
            type="date"
            name="from"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            value={filters.from}
            onChange={handleFilterChange}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">To Date</label>
          <input 
            type="date"
            name="to"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            value={filters.to}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center rounded-lg">
          <AlertCircle className="text-red-400 mr-3" size={20} />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Audit Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Actor</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-20 text-center text-gray-400">Loading audit logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-20 text-center text-gray-400 italic">No audit records found.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs text-gray-900 font-bold">
                        <Clock size={14} className="mr-2 text-gray-400" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {log.action.replace(/\./g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs mr-3">
                          {log.actor_name?.charAt(0)}
                        </div>
                        <div className="text-sm font-bold text-gray-900">{log.actor_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600 max-w-md">
                        {log.metadata ? (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(log.metadata).map(([key, value]) => (
                              <span key={key} className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-medium text-gray-500 border border-gray-200">
                                <span className="font-bold text-gray-400 uppercase mr-1">{key.replace(/_/g, ' ')}:</span> {String(value)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300 italic">No additional metadata</span>
                        )}
                      </div>
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

export default AuditLog;
