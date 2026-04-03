import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  Inbox, 
  ArrowRight, 
  User, 
  Calendar, 
  Hash, 
  AlertTriangle,
  RefreshCw,
  Search,
  ShieldCheck
} from 'lucide-react';
import Pagination from '../../components/Pagination';

const DeptInbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 9; // Grid of 3x3

  useEffect(() => {
    fetchInbox();
  }, [currentPage]);

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents/inbox', {
        params: {
          page: currentPage,
          limit: itemsPerPage
        }
      });
      setDocuments(response.data.data || []);
      setTotalItems(response.data.total || 0);
      setError('');
    } catch (err) {

      setError('Failed to fetch inbox documents');
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };


  const handlePickup = async (id) => {
    try {
      await api.post(`/documents/${id}/pickup`);
      // Success: redirect to document detail
      navigate(`/worker/document/${id}`);
    } catch (err) {
      if (err.response?.status === 409) {
        // Race condition: someone else picked it up
        alert('This document was just picked up by a colleague.');
        fetchInbox(); // Refresh the list
      } else {
        alert(err.response?.data?.message || 'Failed to pick up document');
      }
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.outward_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (doc.sender_department_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Department Inbox</h2>
          <p className="text-gray-600">Unclaimed documents waiting for action.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter inbox..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchInbox();
            }}
            disabled={isRefreshing}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center">
          <AlertTriangle className="text-red-400 mr-3" size={20} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-500">Loading inbox...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow border border-dashed border-gray-300">
          <Inbox size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium text-lg">Your inbox is empty</p>
          <p className="text-gray-400 text-sm">New documents will appear here when dispatched to your department.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-1">
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider border border-blue-100 w-fit">
                      OUT: {doc.outward_number || 'PENDING'}
                    </span>
                    {doc.inward_number && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider border border-emerald-100 w-fit">
                        IN: {doc.inward_number}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center text-[10px] font-bold text-gray-400 uppercase">
                    <Calendar size={12} className="mr-1 opacity-50" />
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                  {doc.subject}
                </h3>
                
                {doc.is_restricted && (
                  <span className="flex items-center text-[10px] font-black bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 w-fit mt-2">
                    <ShieldCheck size={12} className="mr-1" /> RESTRICTED
                  </span>
                )}
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <ArrowRight size={14} className="mr-2 text-gray-400" />
                    <span className="font-medium">From:</span>
                    <span className="ml-1 text-indigo-700 font-bold">{doc.sender_department_name}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User size={14} className="mr-2 text-gray-400" />
                    <span className="font-medium">By:</span>
                    <span className="ml-1 text-slate-800 font-bold">{doc.sender_name}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 border-t border-gray-100">
                {(() => {
                  const isRestrictedForMe = doc.is_restricted && doc.restricted_to_user_id !== user?.id;
                  return (
                    <button
                      onClick={() => !isRestrictedForMe && handlePickup(doc.id)}
                      disabled={isRestrictedForMe}
                      className={`w-full font-bold py-2 rounded-lg transition-colors flex items-center justify-center shadow-sm ${
                        isRestrictedForMe 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {isRestrictedForMe ? (
                        <span className="flex items-center">
                          <ShieldCheck size={16} className="mr-2" /> Restricted
                        </span>
                      ) : 'Pick Up Document'}
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        total={totalItems}
        page={currentPage}
        limit={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>

  );
};

export default DeptInbox;
