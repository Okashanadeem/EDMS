import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import AuditTimeline from '../../components/AuditTimeline';
import { 
  ArrowLeft,
  ArrowRight,
  Download, 
  Play, 
  CheckCircle, 
  Send, 
  User, 
  Building2,
  Calendar,
  Hash,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Forward modal state
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [forwardData, setForwardData] = useState({ to_department_id: '', note: '' });

  useEffect(() => {
    fetchDocumentDetail();
    if (user?.role === 'worker') {
      fetchDepartments();
    }
  }, [id]);

  const fetchDocumentDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documents/${id}`);
      setDocument(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch document details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.filter(d => d.is_active && d.id !== user.department_id));
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const handleAction = async (action) => {
    try {
      setIsActionLoading(true);
      await api.post(`/documents/${id}/${action}`);
      fetchDocumentDetail(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} document`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleForward = async (e) => {
    e.preventDefault();
    try {
      setIsActionLoading(true);
      await api.post(`/documents/${id}/forward`, forwardData);
      setIsForwardModalOpen(false);
      fetchDocumentDetail();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to forward document');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-500 font-medium tracking-tight">Loading document details...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-8 rounded-lg shadow">
        <div className="flex items-center">
          <AlertCircle className="text-red-400 mr-4" size={32} />
          <div>
            <h3 className="text-lg font-bold text-red-800">Error Occurred</h3>
            <p className="text-red-700">{error || 'Document not found or access denied.'}</p>
          </div>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="mt-6 flex items-center text-red-800 font-bold hover:underline"
        >
          <ArrowLeft size={16} className="mr-2" /> Go Back
        </button>
      </div>
    );
  }

  const isAssigned = document.assigned_to === user?.id;
  const canPickup = document.status === 'in_transit' && document.receiver_department_id === user?.department_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" /> Back to List
        </button>
        <div className="flex gap-3">
          {canPickup && (
            <button 
              onClick={() => handleAction('pickup')}
              disabled={isActionLoading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md flex items-center transition-all"
            >
              <User size={18} className="mr-2" /> Pick Up
            </button>
          )}
          {isAssigned && document.status === 'picked_up' && (
            <button 
              onClick={() => handleAction('start')}
              disabled={isActionLoading}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 shadow-md flex items-center transition-all"
            >
              <Play size={18} className="mr-2" /> Start Processing
            </button>
          )}
          {isAssigned && document.status === 'in_progress' && (
            <>
              <button 
                onClick={() => setIsForwardModalOpen(true)}
                disabled={isActionLoading}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 shadow-md flex items-center transition-all"
              >
                <Send size={18} className="mr-2" /> Forward
              </button>
              <button 
                onClick={() => handleAction('complete')}
                disabled={isActionLoading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow-md flex items-center transition-all"
              >
                <CheckCircle size={18} className="mr-2" /> Complete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-8 py-6">
              <div className="flex justify-between items-start mb-4">
                <StatusBadge status={document.status} />
                <div className="flex flex-col items-end gap-2 text-xs font-mono font-bold">
                  {document.outward_number && (
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-100">
                      OUT: {document.outward_number}
                    </span>
                  )}
                  {document.inward_number && (
                    <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded border border-green-100">
                      IN: {document.inward_number}
                    </span>
                  )}
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {document.subject}
              </h2>
            </div>
            <div className="p-8">
              <div className="prose max-w-none text-gray-800 whitespace-pre-wrap font-sans text-lg leading-relaxed">
                {document.body || <p className="text-gray-400 italic">No description provided.</p>}
              </div>

              {document.file_path && (
                <div className="mt-10 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Attachment</h4>
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200 w-fit group cursor-pointer">
                    <FileText size={32} className="text-indigo-500 mr-4" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {document.file_path.split(/[\/\\]/).pop()}
                      </p>
                      <button className="text-xs text-indigo-600 font-bold flex items-center mt-1">
                        <Download size={14} className="mr-1" /> Download Attachment
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Document Details</h3>
            <div className="space-y-5">
              <div className="flex items-start">
                <Building2 size={18} className="text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Sender Dept</p>
                  <p className="text-sm font-bold text-gray-900">{document.sender_department_name}</p>
                </div>
              </div>
              <div className="flex items-start">
                <ArrowRight size={18} className="text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Receiver Dept</p>
                  <p className="text-sm font-bold text-gray-900">{document.receiver_department_name}</p>
                </div>
              </div>
              <div className="flex items-start">
                <User size={18} className="text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Assigned To</p>
                  <p className="text-sm font-bold text-gray-900">{document.assigned_worker_name || 'Unclaimed'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar size={18} className="text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Created At</p>
                  <p className="text-sm font-bold text-gray-900">{new Date(document.created_at).toLocaleString()}</p>
                </div>
              </div>
              {document.picked_up_at && (
                <div className="flex items-start">
                  <Clock size={18} className="text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Picked Up At</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(document.picked_up_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Audit Timeline</h3>
            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              <AuditTimeline logs={document.audit_logs} />
            </div>
          </div>
        </div>
      </div>

      {/* Forward Modal */}
      {isForwardModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsForwardModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleForward}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-6">Forward Document</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Target Department</label>
                      <select 
                        required 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={forwardData.to_department_id}
                        onChange={(e) => setForwardData({...forwardData, to_department_id: e.target.value})}
                      >
                        <option value="">Select Target Department...</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Forwarding Note</label>
                      <textarea 
                        rows={4}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                        placeholder="Why is this document being forwarded?"
                        value={forwardData.note}
                        onChange={(e) => setForwardData({...forwardData, note: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse">
                  <button type="submit" disabled={isActionLoading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 ml-3 transition-colors shadow-md">
                    {isActionLoading ? 'Processing...' : 'Confirm Forward'}
                  </button>
                  <button type="button" onClick={() => setIsForwardModalOpen(false)} className="bg-white text-gray-700 px-6 py-2 rounded-lg font-bold border border-gray-300 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentDetail;
