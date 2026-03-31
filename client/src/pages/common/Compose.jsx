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
  const [filePreview, setFilePreview] = useState(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState(id || null);

  useEffect(() => {
    fetchDepartments();
    if (id) fetchDraftDetails();
  }, [id]);

  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const type = file.type;
    if (type.startsWith('image/') || type === 'application/pdf') {
      const objectUrl = URL.createObjectURL(file);
      setFilePreview({ url: objectUrl, type });
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [file]);

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
        setReceiverDeptId(draft.receiver_department_id);
        setIsRestricted(draft.is_restricted);
        setRestrictedTo(draft.restricted_to_user_id);
        setBehalfOfOfficerId(draft.behalf_of_officer_id);
        setActiveDraftId(draft.id);
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
        cc: selectedCC,
        bcc: selectedBCC,
        references: selectedRefs.map(r => r.id),
        is_restricted: isRestricted,
        restricted_to_user_id: restrictedTo,
        behalf_of_officer_id: (user.role === 'assistant' || behalfOfOfficerId) ? (behalfOfOfficerId || user.officer_id) : null
      };

      if (isDraft || isAssistantSubmit) {
        let response;
        if (activeDraftId) {
          response = await api.patch(`/drafts/${activeDraftId}`, payload);
        } else {
          response = await api.post('/drafts', payload);
        }
        
        const draftId = activeDraftId || response.data.data.id;
        setActiveDraftId(draftId);

        if (isAssistantSubmit) {
          await api.post(`/drafts/${draftId}/submit`);
          setSuccessMsg('Draft submitted to officer successfully.');
          setTimeout(() => navigate('/assistant/drafts'), 1500);
        } else {
          setSuccessMsg('Draft saved successfully.');
          if (!id) navigate(`${window.location.pathname}/${draftId}`, { replace: true });
        }
      } else {
        // Direct Dispatch (Worker/Officer)
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
          if (Array.isArray(payload[key])) {
            payload[key].forEach(item => formData.append(`${key}[]`, item));
          } else if (payload[key] !== null) {
            formData.append(key, payload[key]);
          }
        });
        if (file) formData.append('file', file);

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
        cc: selectedCC, bcc: selectedBCC, references: selectedRefs.map(r => r.id),
        is_restricted: isRestricted, restricted_to_user_id: restrictedTo,
        behalf_of_officer_id: behalfOfOfficerId || user.officer_id
      };

      let response;
      if (activeDraftId) {
        response = await api.patch(`/drafts/${activeDraftId}`, payload);
      } else {
        response = await api.post('/drafts', payload);
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
    setSuccessMsg('Authorized & Dispatched successfully.');
    setTimeout(() => navigate(`/assistant/document/${data.id}`), 1500);
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
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Subject</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="Enter subject..." value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Primary Receiver</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" value={receiverDeptId} onChange={(e) => setReceiverDeptId(e.target.value)}>
                <option value="">Select Department...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <hr className="border-slate-100" />
            <CcBccSelector selectedCC={selectedCC} setSelectedCC={setSelectedCC} selectedBCC={selectedBCC} setSelectedBCC={setSelectedBCC} />
            <hr className="border-slate-100" />
            <ReferenceSearch selectedRefs={selectedRefs} setSelectedRefs={setSelectedRefs} />
            <hr className="border-slate-100" />
            <RestrictionSelector isRestricted={isRestricted} setIsRestricted={setIsRestricted} restrictedTo={restrictedTo} setRestrictedTo={setRestrictedTo} />

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
              <div className="relative group cursor-pointer">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => setFile(e.target.files[0])} />
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center group-hover:border-indigo-400">
                  {file ? <div className="flex items-center justify-center text-xs font-bold text-indigo-600"><FileText size={16} className="mr-2" /> {file.name}</div> : <div className="flex flex-col items-center text-slate-400"><Paperclip size={20} className="mb-1" /><span className="text-[10px] font-bold uppercase tracking-tighter">Upload File</span></div>}
                </div>
              </div>
            </div>

            {filePreview && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center"><h4 className="text-[10px] font-black text-slate-400 uppercase">File Preview</h4><button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700 p-1"><X size={14} /></button></div>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  {filePreview.type.startsWith('image/') ? <img src={filePreview.url} alt="Preview" className="w-full h-auto max-h-64 object-contain mx-auto" /> : <div className="flex flex-col items-center py-8"><FileText size={48} className="text-indigo-200 mb-2" /><p className="text-[10px] font-bold text-indigo-600">PDF LOADED</p></div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-xl flex items-center text-xs text-red-700 font-bold"><AlertCircle className="mr-3" size={20} />{error}</div>}
        {successMsg && <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-xl flex items-center text-xs text-emerald-700 font-bold"><UserCheck className="mr-3" size={20} />{successMsg}</div>}

        <div className="flex flex-col gap-3">
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
      </div>

      <div className="flex-1 min-h-[800px]">
        <RichTextEditor content={bodyHtml} onChange={setBodyHtml} />
      </div>

      <OtpModal isOpen={isOtpModalOpen} onClose={() => setIsOtpModalOpen(false)} documentId={activeDraftId} onSuccess={onOtpSuccess} />
    </div>
  );
};

export default Compose;
