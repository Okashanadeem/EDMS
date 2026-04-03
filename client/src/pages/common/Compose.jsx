import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import RichTextEditor from '../../components/RichTextEditor';
import CcBccSelector from '../../components/CcBccSelector';
import ReferenceSearch from '../../components/ReferenceSearch';
import RestrictionSelector from '../../components/RestrictionSelector';
import OtpModal from '../../components/OtpModal';
import { Send, Save, AlertCircle, FileText, X, Paperclip, UserCheck, ShieldCheck } from 'lucide-react';

const Compose = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [receiverDeptId, setReceiverDeptId] = useState('');
  const [selectedCC, setSelectedCC] = useState([]);
  const [selectedBCC, setSelectedBCC] = useState([]);
  const [selectedRefs, setSelectedRefs] = useState([]);
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictedTo, setRestrictedTo] = useState(null);
  const [behalfOfOfficerId, setBehalfOfOfficerId] = useState(user?.officer_id || '');
  const [file, setFile] = useState(null);
  const [stagedFile, setStagedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState(id || null);
  const [existingFile, setExistingFile] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    fetchDepartments();
    if (id) fetchDraftDetails();
  }, [id]);

  const handleFileSelection = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setStagedFile(selectedFile);
    const type = selectedFile.type;
    const objectUrl = URL.createObjectURL(selectedFile);
    setFilePreview({ url: objectUrl, type, name: selectedFile.name });
    setIsAttachmentModalOpen(true);
    
    // Reset the input value so the same file can be selected again if cancelled
    e.target.value = '';
  };

  const confirmAttachment = () => {
    setFile(stagedFile);
    setIsAttachmentModalOpen(false);
  };

  const cancelAttachment = () => {
    setStagedFile(null);
    setFilePreview(null);
    setIsAttachmentModalOpen(false);
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.data.filter(d => d.is_active));
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const fetchDraftDetails = async () => {
    try {
      const res = await api.get(`/drafts`);
      const draft = res.data.data.find(d => d.id === parseInt(id));
      if (draft) {
        setSubject(draft.subject);
        setBodyHtml(draft.body_html || '');
        setReceiverDeptId(draft.receiver_department_id || '');
        setIsRestricted(draft.is_restricted);
        setRestrictedTo(draft.restricted_to_user_id);
        setBehalfOfOfficerId(draft.behalf_of_officer_id || '');
        setSelectedCC(draft.cc || []);
        setSelectedBCC(draft.bcc || []);
        setSelectedRefs(draft.references || []);
        setActiveDraftId(draft.id);
        setExistingFile(draft.file_path);

        // Restriction logic: Assistant can't edit if submitted and no revision note
        if (user.role === 'assistant' && draft.draft_submitted_at && !draft.draft_revision_note) {
          setIsReadOnly(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch draft details');
    }
  };

  const handleAction = async (action) => {
    setError('');
    setSuccessMsg('');
    
    if (!subject || !receiverDeptId) {
      return setError('Subject and Target Department are required.');
    }

    const isDraft = action === 'draft';
    const isAssistantSubmit = action === 'dispatch' && user.role === 'assistant';
    
    isDraft ? setSaveLoading(true) : setLoading(true);

    try {
      const payload = {
        subject,
        body_html: bodyHtml,
        receiver_department_id: receiverDeptId,
        cc: JSON.stringify(selectedCC),
        bcc: JSON.stringify(selectedBCC),
        references: JSON.stringify(selectedRefs.map(r => r.id)),
        is_restricted: isRestricted,
        restricted_to_user_id: restrictedTo,
        behalf_of_officer_id: (user.role === 'assistant') ? (behalfOfOfficerId || user.officer_id) : null,
        behalf_of_position_id: (user.role === 'assistant') ? (user.officer_position_id || null) : null
      };

      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== undefined) {
          formData.append(key, payload[key]);
        }
      });
      if (file) formData.append('file', file);

      if (isDraft || isAssistantSubmit) {
        let response;
        if (activeDraftId) {
          response = await api.patch(`/drafts/${activeDraftId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          response = await api.post('/drafts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
        
        const draftId = activeDraftId || response.data.data.id;
        setActiveDraftId(draftId);

        if (isAssistantSubmit) {
          await api.post(`/drafts/${draftId}/submit`);
          setSuccessMsg('Draft submitted to officer successfully.');
          setTimeout(() => navigate('/assistant/drafts'), 1500);
        } else {
          setSuccessMsg('Draft saved successfully.');
          if (!id) {
             const newPath = window.location.pathname.endsWith('/compose') 
                ? `${window.location.pathname}/${draftId}`
                : window.location.pathname.replace(/\/compose\/.*$/, `/compose/${draftId}`);
             navigate(newPath, { replace: true });
          }
        }
      } else {
        // Direct Dispatch (Worker/Officer)
        const response = await api.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const rolePath = user.role === 'super_admin' ? 'admin' : user.role;
        navigate(`/${rolePath}/document/${response.data.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      isDraft ? setSaveLoading(false) : setLoading(false);
    }
  };

  const handleDelegatedSend = async () => {
    if (!subject || !receiverDeptId) return setError('Subject and Target Department are required.');
    
    setSaveLoading(true);
    try {
      const payload = {
        subject, body_html: bodyHtml, receiver_department_id: receiverDeptId,
        cc: JSON.stringify(selectedCC), bcc: JSON.stringify(selectedBCC), 
        references: JSON.stringify(selectedRefs.map(r => r.id)),
        is_restricted: isRestricted, restricted_to_user_id: restrictedTo,
        behalf_of_officer_id: behalfOfOfficerId || user.officer_id
      };

      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== undefined) {
          formData.append(key, payload[key]);
        }
      });
      if (file) formData.append('file', file);

      let response;
      if (activeDraftId) {
        response = await api.patch(`/drafts/${activeDraftId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post('/drafts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      const draftId = activeDraftId || response.data.data.id;
      setActiveDraftId(draftId);
      setIsOtpModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to prepare draft for delegated sending');
    } finally {
      setSaveLoading(false);
    }
  };

  const onOtpSuccess = (data) => {
    navigate(`/assistant/document/${data.id}`);
  };

  const handleCancel = async () => {
    if (!activeDraftId) {
      // Unsaved local draft, just navigate away
      const rolePath = user.role === 'super_admin' ? 'admin' : user.role;
      return navigate(`/${rolePath}/dashboard`);
    }

    if (window.confirm('Are you sure you want to discard this draft? This will permanently delete the saved draft and any attachments.')) {
      try {
        await api.delete(`/drafts/${activeDraftId}`);
        const rolePath = user.role === 'super_admin' ? 'admin' : user.role;
        navigate(`/${rolePath}/dashboard`);
      } catch (err) {
        setError('Failed to delete draft. Please try again.');
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-[1600px] mx-auto">

      <div className="w-full lg:w-1/3 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Metadata</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correspondence Info</span>
          </div>

          <div className="space-y-4">
            {isReadOnly && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl flex items-center text-xs text-amber-700 font-bold mb-4">
                <ShieldCheck className="mr-3" size={20} />
                This draft is under review and cannot be modified.
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Subject</label>
              <input 
                type="text" 
                disabled={isReadOnly}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-60" 
                placeholder="Enter subject..." 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Primary Receiver</label>
              <select 
                disabled={isReadOnly}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-60" 
                value={receiverDeptId} 
                onChange={(e) => setReceiverDeptId(e.target.value)}
              >
                <option value="">Select Department...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <hr className="border-slate-100" />
            <div className={isReadOnly ? 'pointer-events-none opacity-60' : ''}>
              <CcBccSelector selectedCC={selectedCC} setSelectedCC={setSelectedCC} selectedBCC={selectedBCC} setSelectedBCC={setSelectedBCC} />
            </div>
            <hr className="border-slate-100" />
            <div className={isReadOnly ? 'pointer-events-none opacity-60' : ''}>
              <ReferenceSearch selectedRefs={selectedRefs} setSelectedRefs={setSelectedRefs} />
            </div>
            <hr className="border-slate-100" />
            <div className={isReadOnly ? 'pointer-events-none opacity-60' : ''}>
              <RestrictionSelector isRestricted={isRestricted} setIsRestricted={setIsRestricted} restrictedTo={restrictedTo} setRestrictedTo={setRestrictedTo} />
            </div>

            {user?.role === 'assistant' && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <div className="flex items-center mb-2 text-indigo-700">
                  <UserCheck size={16} className="mr-2" />
                  <p className="text-xs font-bold uppercase tracking-wider">Sending Authority</p>
                </div>
                <input type="text" readOnly className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700" value={user.officer_name || 'Your Assigned Officer'} />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attachment</label>
              <div className={`relative group ${isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <input 
                  type="file" 
                  disabled={isReadOnly}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
                  onChange={handleFileSelection} 
                />
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center group-hover:border-indigo-400">
                  {file ? (
                    <div className="flex items-center justify-center text-xs font-bold text-indigo-600"><FileText size={16} className="mr-2" /> {file.name}</div>
                  ) : existingFile ? (
                    <div className="flex items-center justify-center text-xs font-bold text-emerald-600"><Paperclip size={16} className="mr-2" /> Current Attachment</div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400"><Paperclip size={20} className="mb-1" /><span className="text-[10px] font-bold uppercase tracking-tighter">Upload File</span></div>
                  )}
                </div>
              </div>
            </div>

            {filePreview && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center"><h4 className="text-[10px] font-black text-slate-400 uppercase">New File Preview</h4><button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700 p-1"><X size={14} /></button></div>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  {filePreview.type.startsWith('image/') ? <img src={filePreview.url} alt="Preview" className="w-full h-auto max-h-64 object-contain mx-auto" /> : <div className="flex flex-col items-center py-8"><FileText size={48} className="text-indigo-200 mb-2" /><p className="text-[10px] font-bold text-indigo-600">PDF LOADED</p></div>}
                </div>
              </div>
            )}

            {!filePreview && existingFile && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saved Attachment</h4>
                  {!isReadOnly && <button onClick={() => setExistingFile(null)} className="text-red-500 hover:text-red-700 p-1"><X size={14} /></button>}
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white p-4 flex flex-col items-center">
                   <FileText size={32} className="text-indigo-400 mb-2" />
                   <button 
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await api.get(`/documents/${activeDraftId}/attachment`, { responseType: 'blob' });
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        const contentDisposition = response.headers['content-disposition'];
                        let fileName = 'attachment';
                        if (contentDisposition) {
                          // Handle both filename="name.ext" and filename=name.ext
                          const fileNameMatch = contentDisposition.match(/filename=(?:"([^"]+)"|([^;]+))/);
                          if (fileNameMatch) {
                            fileName = fileNameMatch[1] || fileNameMatch[2];
                          }
                        }
                        link.setAttribute('download', fileName);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                      } catch (err) {
                        alert('Failed to download attachment');
                      }
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-tighter"
                   >
                     Download Saved Attachment
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-xl flex items-center text-xs text-red-700 font-bold"><AlertCircle className="mr-3" size={20} />{error}</div>}
        {successMsg && <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-xl flex items-center text-xs text-emerald-700 font-bold"><UserCheck className="mr-3" size={20} />{successMsg}</div>}

        {!isReadOnly && (
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleCancel}
              className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold text-xs hover:bg-red-100 transition-all flex items-center justify-center border border-red-100"
            >
              <X size={16} className="mr-2" /> Discard / Cancel
            </button>
            <div className="flex gap-3">
              <button onClick={() => handleAction('draft')} disabled={saveLoading} className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 shadow-sm flex items-center justify-center">

                <Save size={18} className="mr-2" /> Save Draft
              </button>
              <button onClick={() => handleAction('dispatch')} disabled={loading} className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center">
                {loading ? 'Processing...' : (user?.role === 'assistant' ? <><Send size={18} className="mr-2" /> Submit to Officer</> : <><Send size={18} className="mr-2" /> Dispatch Now</>)}
              </button>
            </div>
            {user?.role === 'assistant' && user?.can_send_on_behalf && (
              <button onClick={handleDelegatedSend} disabled={saveLoading || loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs hover:bg-black transition-all flex items-center justify-center border-2 border-indigo-500/30">
                <ShieldCheck size={16} className="mr-2 text-indigo-400" /> Authorized Dispatch (OTP Path)
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[800px]">
        <RichTextEditor content={bodyHtml} onChange={setBodyHtml} readOnly={isReadOnly} />
      </div>

      <OtpModal isOpen={isOtpModalOpen} onClose={() => setIsOtpModalOpen(false)} documentId={activeDraftId} onSuccess={onOtpSuccess} />

      {/* Attachment Preview Modal */}
      {isAttachmentModalOpen && (
        <div className="fixed inset-0 z-[110] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={cancelAttachment}>
              <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-8 pt-8 pb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600 mr-4">
                      <Paperclip size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Verify Attachment</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{filePreview?.name}</p>
                    </div>
                  </div>
                  <button onClick={cancelAttachment} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center min-h-[300px] max-h-[500px]">
                  {filePreview?.type.startsWith('image/') ? (
                    <img src={filePreview.url} alt="Preview" className="max-w-full max-h-[500px] object-contain" />
                  ) : filePreview?.type === 'application/pdf' ? (
                    <iframe src={filePreview.url} title="PDF Preview" className="w-full h-[500px] border-none" />
                  ) : (
                    <div className="flex flex-col items-center py-12">
                      <FileText size={64} className="text-slate-200 mb-4" />
                      <p className="text-slate-500 font-bold">No visual preview available for this file type</p>
                      <p className="text-slate-400 text-xs mt-1">You can still attach it to the document.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 px-8 py-6 flex gap-3">
                <button 
                  onClick={confirmAttachment}
                  className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Yes, Attach File
                </button>
                <button 
                  onClick={cancelAttachment}
                  className="flex-1 bg-white text-slate-600 py-3.5 rounded-2xl font-black text-sm border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compose;
