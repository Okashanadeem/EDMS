import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Search,
  Filter,
  Users as UsersIcon,
  Send,
  UserCheck as UserCheckIcon,
  ShieldCheck,
  X,
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import SignatureManager from '../../components/SignatureManager';

const UserManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [posCurrentPage, setPosCurrentPage] = useState(1);
  const [totalPositions, setTotalPositions] = useState(0);
  const posItemsPerPage = 10;
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingPosition, setEditingPosition] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [newlyCreatedUser, setNewlyCreatedUser] = useState(null);
  
  // Tabs
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'positions'

  // Form states
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    position_id: '',
    role: 'worker', 
    department_id: '',
    officer_id: '',
    can_send_on_behalf: false
  });

  const [posFormData, setPosFormData] = useState({
    title: '',
    role: 'worker',
    department_id: '',
    parent_id: '',
    can_send_on_behalf: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState(searchParams.get('department') || '');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchDepartments(), fetchAllPositions()]);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else fetchPositions();
  }, [activeTab, currentPage, posCurrentPage, departmentFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users?page=${currentPage}&limit=${itemsPerPage}&department_id=${departmentFilter}`);
      setUsers(response.data.data || []);
      setTotalItems(response.data.total || 0);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPositions = async () => {
    try {
      const response = await api.get(`/users/positions?limit=1000`);
      setPositions(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch all positions');
    }
  };

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/positions?page=${posCurrentPage}&limit=${posItemsPerPage}&department_id=${departmentFilter}`);
      if (activeTab === 'positions') {
        setPositions(response.data.data || []);
        setTotalPositions(response.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch positions');
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

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = { ...formData };
      
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, payload);
        setIsModalOpen(false);
        setEditingUser(null);
      } else {
        const response = await api.post('/users', payload);
        setNewlyCreatedUser(response.data.user);
        setGeneratedPassword(response.data.temporaryPassword);
        setIsModalOpen(false);
        setIsPasswordModalOpen(true);
      }
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePositionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPosition) {
        await api.patch(`/users/positions/${editingPosition.id}`, posFormData);
      } else {
        await api.post('/users/positions', posFormData);
      }
      setIsPositionModalOpen(false);
      setEditingPosition(null);
      fetchPositions();
    } catch (err) {
      setError('Failed to save position');
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

  const handleSignatureSuccess = (newPath) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, signature_path: newPath } : u));
      setEditingUser({ ...editingUser, signature_path: newPath });
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.department_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === '' || String(u.department_id) === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Identity & Hierarchy</h2>
          <p className="text-slate-500 text-sm">Manage organizational positions and personnel assignments.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Personnel
          </button>
          <button 
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'positions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Positions
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none min-w-[160px]"
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                if (e.target.value) setSearchParams({ department: e.target.value });
                else setSearchParams({});
              }}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {activeTab === 'users' ? (
            <button
              onClick={() => {
                setEditingUser(null);
                setFormData({ 
                  name: '', email: '', position_id: '',
                  role: 'worker', department_id: departmentFilter || '', 
                  officer_id: '', can_send_on_behalf: false 
                });
                setIsModalOpen(true);
              }}
              className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg shadow-indigo-100"
            >
              <Plus size={20} className="mr-2" />
              Add Personnel
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingPosition(null);
                setPosFormData({ title: '', role: 'worker', department_id: departmentFilter || '', parent_id: '', can_send_on_behalf: false });
                setIsPositionModalOpen(true);
              }}
              className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg shadow-indigo-100"
            >
              <Plus size={20} className="mr-2" />
              Create Position
            </button>
          )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center rounded-r-xl">
          <AlertCircle className="text-red-400 mr-3" size={20} />
          <p className="text-sm text-red-700 font-bold">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'users' ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Seat</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">System Role</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Unit</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Synchronizing Data...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-400">No personnel records found.</td></tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mr-3 font-bold group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all uppercase">
                              {u.name.substring(0, 2)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">{u.name}</div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {u.position_title ? (
                            <div className="flex items-center text-indigo-600 font-bold text-sm">
                              <Briefcase size={14} className="mr-2" />
                              {u.position_title}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Unassigned (Fallback: {u.role})</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                            u.role === 'officer' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            u.role === 'assistant' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                            {u.role === 'officer' && <ShieldCheck size={12} className="mr-1.5" />}
                            {u.role === 'assistant' && <UsersIcon size={12} className="mr-1.5" />}
                            {u.role === 'worker' && <Briefcase size={12} className="mr-1.5" />}
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700">
                          {u.department_name || 'System Administration'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            u.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleResetPassword(u.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Reset Credentials">
                              <Key size={18} />
                            </button>
                            <button onClick={() => {
                              setEditingUser(u);
                              setFormData({ 
                                name: u.name, 
                                email: u.email, 
                                position_id: u.position_id || '',
                                role: u.role, 
                                department_id: u.department_id || '',
                                officer_id: u.officer_id || '',
                                can_send_on_behalf: u.can_send_on_behalf || false
                              });
                              setIsModalOpen(true);
                            }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Profile">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleToggleStatus(u)} className={`p-2 rounded-lg transition-all ${u.is_active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={u.is_active ? 'Suspend' : 'Reinstate'}>
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
            <Pagination
              total={totalItems}
              page={currentPage}
              limit={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Position Title</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Hierarchy</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissions</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {positions.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400">No organizational positions defined.</td></tr>
                  ) : (
                    positions.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center font-bold text-slate-800 text-sm">
                            <Briefcase size={16} className="text-indigo-400 mr-3" />
                            {p.title}
                            <span className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded text-[9px] uppercase tracking-tighter text-slate-500">{p.role}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">
                          {p.parent_title ? (
                            <div className="flex items-center">
                              Reports to <ChevronRight size={12} className="mx-1" /> {p.parent_title}
                            </div>
                          ) : (
                            <span className="text-slate-300">Independent</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700">{p.department_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {p.can_send_on_behalf && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">Delegated Send</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button onClick={() => {
                              setEditingPosition(p);
                              setPosFormData({
                                title: p.title,
                                role: p.role,
                                department_id: p.department_id,
                                parent_id: p.parent_id || '',
                                can_send_on_behalf: p.can_send_on_behalf
                              });
                              setIsPositionModalOpen(true);
                            }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                              <Edit2 size={18} />
                            </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              total={totalPositions}
              page={posCurrentPage}
              limit={posItemsPerPage}
              onPageChange={setPosCurrentPage}
            />
          </>
        )}
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-slate-900 opacity-75 backdrop-blur-sm"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleUserSubmit}>
                <div className="bg-white px-8 pt-8 pb-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingUser ? 'Assign Personnel' : 'Add Personnel'}</h3>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
                  </div>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Legal Name</label>
                        <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                        <input type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                      </div>
                    </div>

                    <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <div className="flex items-center text-indigo-700 mb-4">
                        <Briefcase size={18} className="mr-2" />
                        <p className="text-xs font-black uppercase tracking-wider">Seat Assignment</p>
                      </div>
                      <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Select Functional Position</label>
                      <select 
                        required
                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold text-slate-700 shadow-sm" 
                        value={formData.position_id} 
                        onChange={(e) => {
                          const posId = e.target.value;
                          const selectedPos = positions.find(p => String(p.id) === String(posId));
                          setFormData({
                            ...formData, 
                            position_id: posId,
                            role: selectedPos ? selectedPos.role : formData.role
                          });
                        }}
                      >
                        <option value="">-- Choose Position --</option>
                        {positions.map(p => <option key={p.id} value={p.id}>{p.title} ({p.department_name})</option>)}
                      </select>
                      <p className="mt-3 text-[10px] text-indigo-400 font-medium italic">
                        The user will automatically inherit the Role, Department, and Reporting Lines defined for this position.
                      </p>
                    </div>

                    {/* Show signature upload if it's an existing user AND the selected position role is officer/admin */}
                    {editingUser && (formData.role === 'officer' || formData.role === 'super_admin') ? (
                      <div className="mt-8 pt-8 border-t border-slate-100">
                        <div className="flex items-center text-slate-800 mb-4">
                          <ShieldCheck size={18} className="mr-2 text-blue-500" />
                          <p className="text-xs font-black uppercase tracking-widest">Signature Intelligence</p>
                        </div>
                        <SignatureManager 
                          userId={editingUser.id} 
                          currentSignature={editingUser.signature_path} 
                          onUploadSuccess={handleSignatureSuccess}
                        />
                      </div>
                    ) : !editingUser && (formData.role === 'officer' || formData.role === 'super_admin') ? (
                      <div className="mt-8 pt-8 border-t border-slate-100 bg-amber-50/50 p-4 rounded-xl border border-dashed border-amber-200">
                        <p className="text-xs text-amber-700 font-medium text-center italic">
                          Signature can be uploaded after the user account is created.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="bg-slate-50 px-8 py-6 flex flex-row-reverse gap-3">
                  <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50">
                    {isSubmitting ? 'Processing...' : 'Save Record'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white text-slate-600 py-3 rounded-xl font-black text-sm border border-slate-200 hover:bg-slate-100 transition-all">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Position Modal */}
      {isPositionModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
             <div className="fixed inset-0 bg-slate-900 opacity-75 backdrop-blur-sm" onClick={() => setIsPositionModalOpen(false)}></div>
             <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-10">
              <form onSubmit={handlePositionSubmit}>
                <div className="bg-white px-8 pt-8 pb-8">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-6">{editingPosition ? 'Edit Position' : 'Define Position'}</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Functional Title</label>
                      <input placeholder="e.g. Director CID" type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" value={posFormData.title} onChange={(e) => setPosFormData({...posFormData, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Default Role</label>
                        <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={posFormData.role} onChange={(e) => setPosFormData({...posFormData, role: e.target.value})}>
                          <option value="worker">Worker</option>
                          <option value="officer">Officer</option>
                          <option value="assistant">Assistant</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Home Department</label>
                        <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={posFormData.department_id} onChange={(e) => setPosFormData({...posFormData, department_id: e.target.value})}>
                          <option value="">Select Unit</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reports To (Position)</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={posFormData.parent_id} onChange={(e) => setPosFormData({...posFormData, parent_id: e.target.value})}>
                        <option value="">Independent</option>
                        {positions.filter(p => p.id !== editingPosition?.id).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                      <div>
                        <p className="text-xs font-bold text-indigo-700">Delegated OTP Sending</p>
                        <p className="text-[10px] text-indigo-400">Allow assistants assigned to this seat to dispatch on behalf.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPosFormData({...posFormData, can_send_on_behalf: !posFormData.can_send_on_behalf})}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${posFormData.can_send_on_behalf ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${posFormData.can_send_on_behalf ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-8 py-6 flex flex-row-reverse gap-3">
                  <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Save Position</button>
                  <button type="button" onClick={() => setIsPositionModalOpen(false)} className="flex-1 bg-white text-slate-600 py-3 rounded-xl font-black text-sm border border-slate-200 hover:bg-slate-100">Cancel</button>
                </div>
              </form>
             </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-slate-900 opacity-75 backdrop-blur-sm"></div>
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl transform transition-all max-w-md w-full z-50 p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-600 mb-6 shadow-sm">
                  <Check className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Access Authorized</h3>
                <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                  The account for <strong>{newlyCreatedUser?.name}</strong> has been created and indexed in the registry.
                </p>

                <div className="flex items-center justify-center space-x-2 text-emerald-600 bg-emerald-50 py-2 px-4 rounded-full w-fit mx-auto mb-8 border border-emerald-100">
                  <Send size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Notification Dispatched</span>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 relative group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">One-Time Password</span>
                    <button onClick={copyToClipboard} className="text-indigo-600 hover:text-indigo-800 flex items-center text-[10px] font-black uppercase tracking-widest bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-100">
                      {copied ? <><Check size={12} className="mr-1" /> Copied</> : <><Copy size={12} className="mr-1" /> Copy</>}
                    </button>
                  </div>
                  <div className="text-3xl font-mono font-black tracking-[0.3em] text-slate-800 text-center py-2">
                    {generatedPassword}
                  </div>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-400 p-5 text-left mb-8 rounded-r-2xl">
                  <div className="flex">
                    <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                    <div className="ml-4">
                      <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1 underline">Security Protocol</p>
                      <p className="text-xs text-amber-700 font-bold leading-relaxed">
                        Copy this credential now. It is never stored in plaintext and will not be displayed again.
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
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-xs"
                >
                  Confirm & Dismiss
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
