import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Lock, Unlock, User } from 'lucide-react';

const RestrictionSelector = ({ isRestricted, setIsRestricted, restrictedTo, setRestrictedTo }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isRestricted) {
      const fetchUsers = async () => {
        try {
          const res = await api.get('/users');
          setUsers(res.data.data);
        } catch (err) {
          console.error('Failed to fetch users');
        }
      };
      fetchUsers();
    }
  }, [isRestricted]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg mr-3 ${isRestricted ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
            {isRestricted ? <Lock size={18} /> : <Unlock size={18} />}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Access Restriction</p>
            <p className="text-[10px] text-slate-500">
              {isRestricted ? 'Only designated user can open' : 'Visible to whole department'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsRestricted(!isRestricted)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isRestricted ? 'bg-amber-500' : 'bg-slate-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRestricted ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {isRestricted && (
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Permitted User</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User size={14} />
            </div>
            <input
              type="text"
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="max-h-32 overflow-y-auto border border-slate-100 rounded-xl">
            {filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => setRestrictedTo(user.id)}
                className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                  restrictedTo === user.id ? 'bg-amber-50 text-amber-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                {user.name} ({user.department_name || 'No Dept'})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestrictionSelector;
