import React, { useState, useEffect } from 'react';
import { ShieldCheck, Send, X, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/axios';

const OtpModal = ({ isOpen, onClose, documentId, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const [isRequested, setIsRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  useEffect(() => {
    let timer;
    if (isRequested && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRequested, timeLeft]);

  if (!isOpen) return null;

  const handleRequest = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/otp/request', { document_id: documentId });
      setIsRequested(true);
      setTimeLeft(600);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/otp/verify', { document_id: documentId, otp });
      onSuccess(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-slate-900 opacity-75 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;

        <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-white px-8 pt-8 pb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
                <ShieldCheck size={24} />
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-2">Delegated Authorization</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              To send this document on behalf of the Officer, a one-time verification code is required.
            </p>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-xl flex items-center">
                <AlertCircle className="text-red-400 mr-2" size={18} />
                <p className="text-xs text-red-700 font-bold">{error}</p>
              </div>
            )}

            {!isRequested ? (
              <button
                onClick={handleRequest}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center"
              >
                {loading ? 'Processing...' : <><Send size={18} className="mr-2" /> Send OTP to Officer Email</>}
              </button>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enter 6-Digit Code</span>
                  <span className={`text-[10px] font-black flex items-center ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                    <Clock size={12} className="mr-1" /> EXPIRES IN {formatTime(timeLeft)}
                  </span>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-5 text-center text-3xl font-black tracking-[1em] focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6 || timeLeft === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center"
                  >
                    {loading ? 'Verifying...' : 'Confirm & Dispatch'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRequest}
                    className="w-full mt-4 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    Didn't receive code? Resend
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpModal;
