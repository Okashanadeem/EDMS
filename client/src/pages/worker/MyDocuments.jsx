import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import { 
  Search, 
  Filter, 
  FileText, 
  Calendar, 
  ArrowRight,
  ChevronRight,
  History as HistoryIcon
} from 'lucide-react';

const MyDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, assigned, created

  useEffect(() => {
    fetchMyDocuments();
  }, []);

  const fetchMyDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents/mine');
      setDocuments(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch your documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.outward_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.inward_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // In a real app, 'mine' endpoint would return metadata about relation. 
    // For now we filter based on existence of numbers or status
    if (filter === 'assigned') return matchesSearch && doc.assigned_to;
    if (filter === 'created') return matchesSearch && !doc.inward_number; // Simplified logic
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Documents</h2>
          <p className="text-gray-600">Documents you've created or are currently processing.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by subject or number..." 
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Documents</option>
            <option value="assigned">Assigned to Me</option>
            <option value="created">Created by Me</option>
          </select>
          <button 
            onClick={fetchMyDocuments}
            className="p-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <HistoryIcon size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Document Info</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Numbers</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Routing</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">Loading your documents...</td></tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No documents found</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/worker/document/${doc.id}`)}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900 line-clamp-1">{doc.subject}</div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <Calendar size={12} className="mr-1" />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {doc.outward_number && (
                          <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 w-fit">
                            OUT: {doc.outward_number}
                          </span>
                        )}
                        {doc.inward_number && (
                          <span className="text-[10px] font-mono font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100 w-fit">
                            IN: {doc.inward_number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs text-gray-600">
                        <span className="font-semibold">{doc.sender_department_name}</span>
                        <ArrowRight size={12} className="mx-2 text-gray-400" />
                        <span className="font-semibold">{doc.receiver_department_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link 
                        to={`/worker/document/${doc.id}`}
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-900 font-bold text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View <ChevronRight size={16} />
                      </Link>
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

export default MyDocuments;
