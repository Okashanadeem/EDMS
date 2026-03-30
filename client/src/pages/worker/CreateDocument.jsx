import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Send, Paperclip, AlertCircle, FileText, X } from 'lucide-react';

const CreateDocument = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    receiver_department_id: '',
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.filter(d => d.is_active));
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('subject', formData.subject);
      data.append('body', formData.body);
      data.append('receiver_department_id', formData.receiver_department_id);
      if (file) {
        data.append('file', file);
      }

      const response = await api.post('/documents', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Redirect to the newly created document detail or "My Documents"
      navigate(`/worker/document/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size exceeds 10MB limit');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create & Dispatch Document</h2>
        <p className="text-gray-600">Compose a new correspondence to send to another department.</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 flex items-center">
          <AlertCircle className="text-red-400 mr-3" size={20} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Receiver Department */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target Department <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.receiver_department_id}
              onChange={(e) => setFormData({ ...formData, receiver_department_id: e.target.value })}
            >
              <option value="">Select a department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={500}
              placeholder="Enter document subject..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description / Body
            </label>
            <textarea
              rows={8}
              placeholder="Enter document details or notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            />
          </div>

          {/* File Attachment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attachment (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-400 transition-colors">
              <div className="space-y-1 text-center">
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileText className="h-10 w-10 text-indigo-500 mb-2" />
                    <div className="flex text-sm text-gray-600 font-medium">
                      <span>{file.name}</span>
                      <button 
                        type="button" 
                        onClick={() => setFile(null)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <>
                    <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input 
                          type="file" 
                          className="sr-only" 
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOC, Images up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/worker/dashboard')}
            className="px-6 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 mr-4 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Dispatching...
              </>
            ) : (
              <>
                <Send size={18} className="mr-2" />
                Dispatch Document
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDocument;
