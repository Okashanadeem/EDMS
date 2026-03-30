import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Key, 
  UserX, 
  UserCheck, 
  AlertCircle,
  Copy,
  Check,
  Search
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [newlyCreatedUser, setNewlyCreatedUser] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    role: 'worker', 
    department_id: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      const depts = response.data.data || [];
      setDepartments(depts.filter(d => d.is_active));
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, formData);
        setIsModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const response = await api.post('/users', formData);
        setNewlyCreatedUser(response.data.user);
        setGeneratedPassword(response.data.temporaryPassword);
        setIsModalOpen(false);
        setIsPasswordModalOpen(true);
        fetchUsers();
      }
      setFormData({ name: '', email: '', role: 'worker', department_id: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (id) => {
    if (window.confirm('Are you sure you want to reset this user\'s password?')) {
      try {
        const response = await api.patch(`/users/${id}/reset-password`);
        setNewlyCreatedUser(response.data.user);
        setGeneratedPassword(response.data.temporaryPassword);
        setIsPasswordModalOpen(true);
      } catch (err) {
        setError('Failed to reset password');
      }
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.patch(`/users/${user.id}`, { is_active: !user.is_active });
      fetchUsers();
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ name: '', email: '', role: 'worker', department_id: '' });
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0"
          >
            <Plus size={20} className="mr-2" />
            Add Worker
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center">
          <AlertCircle className="text-red-400 mr-3" size={20} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">No users found.</td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{u.department_name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleResetPassword(u.id)} className="text-orange-600 hover:text-orange-900" title="Reset Password">
                          <Key size={18} />
                        </button>
                        <button onClick={() => {
                          setEditingUser(u);
                          setFormData({ name: u.name, email: u.email, role: u.role, department_id: u.department_id || '' });
                          setIsModalOpen(true);
                        }} className="text-blue-600 hover:text-blue-900" title="Edit User">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleToggleStatus(u)} className={`${u.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`} title={u.is_active ? 'Deactivate' : 'Activate'}>
                          {u.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{editingUser ? 'Edit User' : 'Add New Worker'}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Address</label>
                      <input type="email" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department</label>
                      <select required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={formData.department_id} onChange={(e) => setFormData({...formData, department_id: e.target.value})}>
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" disabled={isSubmitting} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                    {isSubmitting ? 'Saving...' : 'Save User'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 opacity-75"></div>
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl transform transition-all max-w-md w-full z-50 p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Credentials Generated</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Successfully created account for <span className="font-semibold text-gray-700">{newlyCreatedUser?.name}</span>.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Temporary Password</span>
                    <button onClick={copyToClipboard} className="text-blue-600 hover:text-blue-800 flex items-center text-xs font-medium">
                      {copied ? <><Check size={14} className="mr-1" /> Copied</> : <><Copy size={14} className="mr-1" /> Copy</>}
                    </button>
                  </div>
                  <div className="text-xl font-mono font-bold tracking-wider text-gray-800 bg-white p-3 rounded border border-gray-200 text-center">
                    {generatedPassword}
                  </div>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 text-left mb-6">
                  <div className="flex">
                    <AlertCircle className="text-amber-400 shrink-0" size={20} />
                    <div className="ml-3">
                      <p className="text-xs text-amber-700 font-medium">
                        IMPORTANT: Copy this password now. It will not be shown again. Share it with the user through a secure channel.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setGeneratedPassword('');
                    setNewlyCreatedUser(null);
                  }}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-gray-900 text-base font-medium text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
