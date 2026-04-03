import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import AuditTimeline from '../../components/AuditTimeline';
import { 
  ArrowLeft, ArrowRight, Download, Play, CheckCircle, Send, User, 
  Building2, Calendar, AlertCircle, Clock, FileText, Lock, Link as LinkIcon, Users,
  Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Forward modal state
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [forwardData, setForwardData] = useState({ to_department_id: '', note: '' });

  useEffect(() => {
    fetchDocumentDetail();
    fetchDepartments();
  }, [id]);

  const fetchDocumentDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documents/${id}`);
      setDocData(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch document details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data.filter(d => d.is_active && d.id !== user?.department_id));
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const handleAction = async (action) => {
    try {
      setIsActionLoading(true);
      await api.post(`/documents/${id}/${action}`);
      toast.success(`Action: ${action} successful`);
      fetchDocumentDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} document`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleForward = async (e) => {
    e.preventDefault();
    try {
      setIsActionLoading(true);
      await api.post(`/documents/${id}/forward`, forwardData);
      toast.success('Document forwarded to target registry.');
      setIsForwardModalOpen(false);
      fetchDocumentDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to forward document');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsActionLoading(true);
      const response = await api.get(`/documents/${id}/pdf`, {
        responseType: 'blob'
      });
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `official-letter-${id}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Official letter generated.');
    } catch (err) {
      toast.error('Failed to generate PDF letter.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsActionLoading(true);
      const response = await api.get(`/documents/${id}/attachment`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a'); 
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `attachment-${id}`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename=(?:"([^"]+)"|([^;]+))/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1] || fileNameMatch[2];
        }
      }
      
      link.setAttribute('download', fileName);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Attachment downloaded.');
    } catch (err) {
      toast.error('Failed to download attachment');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-500 font-bold tracking-tight">Accessing Document Repository...</p>
      </div>
    );
  }

  if (error || !docData) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-8 rounded-2xl shadow-sm">
        <div className="flex items-center">
          <AlertCircle className="text-red-400 mr-4" size={32} />
          <div>
            <h3 className="text-lg font-bold text-red-800">Authorization / System Error</h3>
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

  const isAssignedToMe = docData.assigned_to === user?.id;
  const canIPickup = docData.status === 'in_transit' && 
    (docData.receiver_department_id === user?.department_id || 
     (docData.cc && docData.cc.some(r => r.department_id === user?.department_id)));

  const rolePath = user.role === 'super_admin' ? 'admin' : user.role;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-500 hover:text-slate-900 font-bold transition-colors text-sm group"
        >
          <div className="bg-white p-2 rounded-lg border border-slate-200 mr-3 group-hover:border-slate-400 transition-all">
            <ArrowLeft size={18} />
          </div>
          Return to Registry
        </button>
        
        <div className="flex gap-3">
          {canIPickup && (
            <button 
              onClick={() => handleAction('pickup')}
              disabled={isActionLoading}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center transition-all"
            >
              <User size={18} className="mr-2" /> Pick Up Document
            </button>
          )}
          {isAssignedToMe && docData.status === 'picked_up' && (
            <button 
              onClick={() => handleAction('start')}
              disabled={isActionLoading}
              className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-100 flex items-center transition-all"
            >
              <Play size={18} className="mr-2" /> Start Processing
            </button>
          )}
          {isAssignedToMe && docData.status === 'in_progress' && (
            <>
              <button 
                onClick={() => setIsForwardModalOpen(true)}
                disabled={isActionLoading}
                className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-100 flex items-center transition-all"
              >
                <Send size={18} className="mr-2" /> Forward Leg
              </button>
              <button 
                onClick={() => handleAction('complete')}
                disabled={isActionLoading}
                className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center transition-all"
              >
                <CheckCircle size={18} className="mr-2" /> Mark Completed
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="bg-slate-50/50 border-b border-slate-100 px-10 py-10">
              <div className="flex justify-between items-start mb-6">
                <StatusBadge status={docData.status} />
                <div className="flex flex-col items-end gap-2">
                  {docData.outward_number && (
                    <span className="text-[10px] font-black font-mono bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200 tracking-wider">
                      OUT: {docData.outward_number}
                    </span>
                  )}
                  {docData.inward_number && (
                    <span className="text-[10px] font-black font-mono bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 tracking-wider">
                      IN: {docData.inward_number}
                    </span>
                  )}
                </div>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                {docData.subject}
              </h2>
              {docData.is_restricted && (
                <div className="inline-flex items-center bg-amber-50 text-amber-700 px-3 py-1 rounded-lg text-xs font-black border border-amber-100 uppercase tracking-widest">
                  <Lock size={14} className="mr-2" /> This document is restricted
                </div>
              )}
            </div>

            <div className="p-10 min-h-[600px]">
              {docData.is_redacted ? (
                <div className="bg-slate-50 rounded-3xl p-12 text-center border border-dashed border-slate-200">
                  <Lock size={48} className="mx-auto text-slate-200 mb-4" />
                  <h3 className="text-lg font-bold text-slate-800">Restricted Content</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2">
                    The body and attachments of this document are restricted to a designated authorized user only.
                  </p>
                </div>
              ) : (
                <div className="prose prose-slate lg:prose-lg max-w-none">
                  {docData.body_html ? (
                    <div dangerouslySetInnerHTML={{ __html: docData.body_html }} />
                  ) : (
                    <p className="whitespace-pre-wrap">{docData.body || 'No description provided.'}</p>
                  )}
                </div>
              )}

              <div className="mt-16 pt-8 border-t border-slate-100 flex flex-wrap gap-6">
                {docData.file_path && !docData.is_redacted && (
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">File Attachment</h4>
                    <div 
                      onClick={handleDownload}
                      className="inline-flex items-center p-5 bg-white rounded-2xl border-2 border-slate-100 hover:border-indigo-200 transition-all group cursor-pointer shadow-sm"
                    >
                      <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 mr-4 group-hover:bg-indigo-100 transition-colors">
                        <FileText size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">
                          {docData.display_filename || docData.file_path.split(/[\/\\]/).pop()}
                        </p>
                        <button className="text-xs text-indigo-600 font-bold flex items-center mt-1 group-hover:text-indigo-800">
                          <Download size={14} className="mr-1" /> Request Download
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Official Document</h4>
                  <div 
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center p-5 bg-white rounded-2xl border-2 border-slate-100 hover:border-emerald-200 transition-all group cursor-pointer shadow-sm"
                  >
                    <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 mr-4 group-hover:bg-emerald-100 transition-colors">
                      <Printer size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">
                        Official Letter (PDF)
                      </p>
                      <button className="text-xs text-emerald-600 font-bold flex items-center mt-1 group-hover:text-emerald-800">
                        <Printer size={14} className="mr-1" /> Generate Letter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {docData.references && docData.references.length > 0 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center">
                <LinkIcon size={12} className="mr-2" /> Associated References
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docData.references.map(ref => (
                  <Link 
                    key={ref.id} 
                    to={`/${rolePath}/document/${ref.id}`}
                    className="flex items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all group"
                  >
                    <div className="bg-white p-2 rounded-lg border border-slate-200 mr-3 text-slate-400 group-hover:text-indigo-500 group-hover:border-indigo-100 transition-all">
                      <FileText size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-slate-800 truncate">{ref.subject}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{ref.outward_number || 'Internal Ref'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 pb-4">Correspondence Meta</h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mr-4">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Origin Dept</p>
                  <p className="text-sm font-bold text-slate-800">{docData.sender_department_name}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 mr-4">
                  <ArrowRight size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Target Dept</p>
                  <p className="text-sm font-bold text-slate-800">{docData.receiver_department_name}</p>
                </div>
              </div>

              {docData.cc && docData.cc.length > 0 && (
                <div className="flex items-start">
                  <div className="bg-slate-50 p-2 rounded-lg text-slate-600 mr-4">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Carbon Copy (CC)</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {docData.cc.map(r => (
                        <span key={r.id} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          {r.department_name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 mr-4">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ownership</p>
                  <p className="text-sm font-bold text-slate-800">{docData.assignee_name || 'Department Inbox'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-slate-50 p-2 rounded-lg text-slate-400 mr-4">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Dispatch Date</p>
                  <p className="text-sm font-bold text-slate-800">{new Date(docData.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 pb-4">Audit Footprint</h3>
            <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <AuditTimeline logs={docData.audit_logs} />
            </div>
          </div>
        </div>
      </div>

      {isForwardModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsForwardModalOpen(false)}>
              <div className="absolute inset-0 bg-slate-900 opacity-75 backdrop-blur-sm"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleForward}>
                <div className="bg-white px-8 pt-8 pb-8">
                  <div className="bg-purple-100 p-3 rounded-2xl text-purple-600 w-fit mb-6">
                    <Send size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Forward Leg</h3>
                  <p className="text-slate-500 text-sm mb-8">Move this document to another department's registry for processing.</p>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Registry Destination</label>
                      <select 
                        required 
                        className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all text-sm"
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
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Transit Note</label>
                      <textarea 
                        rows={4}
                        required
                        className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all resize-none text-sm"
                        placeholder="Context for the receiving department..."
                        value={forwardData.note}
                        onChange={(e) => setForwardData({...forwardData, note: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-8 py-6 flex flex-row-reverse gap-3">
                  <button type="submit" disabled={isActionLoading} className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-black text-sm hover:bg-purple-700 transition-all shadow-lg shadow-indigo-100">
                    {isActionLoading ? 'Processing...' : 'Confirm Forward'}
                  </button>
                  <button type="button" onClick={() => setIsForwardModalOpen(false)} className="flex-1 bg-white text-slate-600 py-3 rounded-xl font-black text-sm border border-slate-200 hover:bg-slate-100 transition-all">
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
