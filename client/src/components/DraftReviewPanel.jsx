import React, { useState } from 'react';
import { CheckCircle, RotateCcw, MessageSquare, User, Calendar } from 'lucide-react';

const DraftReviewPanel = ({ draft, onApprove, onRevise, isProcessing }) => {
  const [revisionNote, setRevisionNote] = useState('');
  const [showReviseInput, setShowReviseInput] = useState(false);

  if (!draft) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Review Draft</h3>
        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
          Awaiting Action
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center text-xs text-slate-500">
          <User size={14} className="mr-2 opacity-50" />
          <span>Submitted by: <strong>{draft.submitter_name || draft.creator_name}</strong></span>
        </div>
        <div className="flex items-center text-xs text-slate-500 justify-end">
          <Calendar size={14} className="mr-2 opacity-50" />
          <span>On: {new Date(draft.draft_submitted_at || draft.updated_at).toLocaleString()}</span>
        </div>
      </div>

      {!showReviseInput ? (
        <div className="flex gap-3">
          <button
            onClick={onApprove}
            disabled={isProcessing}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center shadow-lg shadow-emerald-100"
          >
            <CheckCircle size={18} className="mr-2" />
            Approve & Dispatch
          </button>
          <button
            onClick={() => setShowReviseInput(true)}
            disabled={isProcessing}
            className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center shadow-sm"
          >
            <RotateCcw size={18} className="mr-2" />
            Request Revision
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
              <MessageSquare size={12} className="mr-1" /> Revision Instructions
            </label>
            <textarea
              className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
              rows={4}
              placeholder="Tell the assistant what needs to be changed..."
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onRevise(revisionNote)}
              disabled={isProcessing || !revisionNote.trim()}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center shadow-lg shadow-amber-100"
            >
              Send Back to Assistant
            </button>
            <button
              onClick={() => setShowReviseInput(false)}
              className="px-6 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-300 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftReviewPanel;
