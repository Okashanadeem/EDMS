import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  FileEdit, 
  Search, 
  Clock, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  FileText,
  User,
  ExternalLink
} from 'lucide-react';
import DraftReviewPanel from '../../components/DraftReviewPanel';

const Drafts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mine');
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDrafts();
  }, []);

  useEffect(() => {
    if (user?.role === 'officer' && drafts.length > 0) {
      const hasReviewDrafts = drafts.some(d => 
        (Number(d.behalf_of_officer_id) === Number(user.id) || 
         (d.behalf_of_position_id && Number(d.behalf_of_position_id) === Number(user.position_id))) 
        && d.draft_submitted_at
      );
      if (hasReviewDrafts) setActiveTab('review');
    }
  }, [drafts, user]);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/drafts');
      setDrafts(res.data.data);
    } catch (err) {
      console.error('Failed to fetch drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this draft?')) return;
    try {
      await api.delete(`/drafts/${id}`);
      setDrafts(drafts.filter(d => d.id !== id));
      if (selectedDraft?.id === id) setSelectedDraft(null);
    } catch (err) {
      alert('Failed to delete draft');
    }
  };

  const handleApprove = async () => {
    if (!selectedDraft) return;
    setActionLoading(true);
    try {
      const response = await api.post(`/drafts/${selectedDraft.id}/approve`);
      // The backend approveDraft returns finalDoc which includes the ID
      const finalDoc = response.data.data;
      navigate(`/${rolePath}/document/${finalDoc.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevise = async (note) => {
    if (!selectedDraft) return;
    setActionLoading(true);
    try {
      await api.post(`/drafts/${selectedDraft.id}/revise`, { note });
      alert('Revision request sent back to assistant.');
      fetchDrafts();
      setSelectedDraft(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Revision request failed');
    } finally {
      setActionLoading(false);
    }
  };

  const myDrafts = drafts.filter(d => Number(d.created_by) === Number(user.id));
  const submittedDrafts = drafts.filter(d => 
    (Number(d.behalf_of_officer_id) === Number(user.id) || 
     (d.behalf_of_position_id && Number(d.behalf_of_position_id) === Number(user.position_id))) 
    && d.draft_submitted_at
  );

  const displayDrafts = activeTab === 'mine' ? myDrafts : submittedDrafts;

  const getStatusInfo = (draft) => {
    if (draft.behalf_approved) return { label: 'Approved', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    if (draft.draft_revision_note) return { label: 'Revision Required', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    if (draft.draft_submitted_at) return { label: 'Submitted', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
    return { label: 'Draft', color: 'text-slate-500 bg-slate-50 border-slate-100' };
  };

  const rolePath = user.role === 'super_admin' ? 'admin' : user.role;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Drafts Management</h1>
          <p className="text-slate-500 mt-1">Review your saved documents or drafts awaiting your approval.</p>
        </div>
        <button
          onClick={() => navigate(`/${rolePath}/compose`)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all flex items-center"
        >
          <FileEdit size={18} className="mr-2" /> Compose New
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* List Section */}
        <div className="flex-1 space-y-6">
          {/* Tabs */}
          {user.role === 'officer' && (
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
              <button
                onClick={() => setActiveTab('mine')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'mine' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                My Drafts ({myDrafts.length})
              </button>
              <button
                onClick={() => setActiveTab('review')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'review' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Pending Review ({submittedDrafts.length})
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading drafts...</div>
          ) : displayDrafts.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-20 px-10 text-center">
              <FileText size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No drafts found</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
                {activeTab === 'mine' ? "You haven't saved any drafts yet." : "No assistant-submitted drafts are currently pending."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayDrafts.map(draft => {
                const status = getStatusInfo(draft);
                return (
                  <div
                    key={draft.id}
                    onClick={() => setSelectedDraft(draft)}
                    className={`group bg-white border-2 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${selectedDraft?.id === draft.id ? 'border-indigo-500 shadow-indigo-50 shadow-lg' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${status.color}`}>
                        {status.label}
                      </span>
                      <div className="flex gap-2">
                        {!(user.role === 'assistant' && draft.draft_submitted_at && !draft.draft_revision_note) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/${rolePath}/compose/${draft.id}`); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit Content"
                          >
                            <FileEdit size={16} />
                          </button>
                        )}
                        {draft.created_by === user.id && !(user.role === 'assistant' && draft.draft_submitted_at && !draft.draft_revision_note) && (
                          <button
                            onClick={(e) => handleDelete(draft.id, e)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Draft"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 leading-snug mb-2 line-clamp-2">{draft.subject}</h3>
                    
                    <div className="flex items-center text-slate-400 text-[10px] font-bold uppercase tracking-tighter">
                      <Clock size={12} className="mr-1" />
                      Updated: {new Date(draft.updated_at).toLocaleDateString()}
                    </div>

                    {activeTab === 'review' && (
                      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center text-xs font-bold text-slate-600">
                          <User size={14} className="mr-1 opacity-50" />
                          {draft.submitter_name}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">Assistant</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview / Action Side */}
        <div className="w-full lg:w-1/3">
          <div className="sticky top-8 space-y-6">
            {selectedDraft ? (
              <div className="space-y-6">
                {activeTab === 'review' && (
                  <DraftReviewPanel 
                    draft={selectedDraft} 
                    onApprove={handleApprove} 
                    onRevise={handleRevise}
                    isProcessing={actionLoading}
                  />
                )}

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center">
                      <FileText size={18} className="mr-2 text-indigo-600" />
                      Content Preview
                    </h3>
                  </div>
                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div 
                      className="prose prose-sm max-w-none prose-slate"
                      dangerouslySetInnerHTML={{ __html: selectedDraft.body_html || '<p class="text-slate-400 italic">No content available.</p>' }}
                    />
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      onClick={() => navigate(`/${rolePath}/compose/${selectedDraft.id}`)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-center mx-auto"
                    >
                      <ExternalLink size={12} className="mr-1" /> Open in Full Editor
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                <FileText size={32} className="mx-auto text-slate-200 mb-3" />
                <p className="text-sm font-bold text-slate-400">Select a draft to preview or take action.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Drafts;
