import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X } from 'lucide-react';

const CcBccSelector = ({ selectedCC, setSelectedCC, selectedBCC, setSelectedBCC }) => {
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState('cc');

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/departments');
        setDepartments(res.data.data);
      } catch (err) {
        console.error('Failed to fetch departments');
      }
    };
    fetchDepts();
  }, []);

  const toggleDept = (deptId, type) => {
    const setter = type === 'cc' ? setSelectedCC : setSelectedBCC;
    const current = type === 'cc' ? selectedCC : selectedBCC;
    const other = type === 'cc' ? selectedBCC : selectedCC;

    if (current.includes(deptId)) {
      setter(current.filter(id => id !== deptId));
    } else {
      // Ensure a dept isn't in both CC and BCC
      if (!other.includes(deptId)) {
        setter([...current, deptId]);
      }
    }
  };

  const getDeptName = (id) => departments.find(d => d.id === id)?.name || id;

  return (
    <div className="space-y-4">
      <div className="flex border-b border-slate-200">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'cc' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('cc')}
        >
          CC Departments ({selectedCC.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'bcc' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('bcc')}
        >
          BCC Departments ({selectedBCC.length})
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
        {departments.map(dept => (
          <button
            key={dept.id}
            onClick={() => toggleDept(dept.id, activeTab)}
            className={`text-left px-3 py-2 rounded-lg text-xs transition-all border ${
              (activeTab === 'cc' ? selectedCC : selectedBCC).includes(dept.id)
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
            }`}
          >
            {dept.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedCC.map(id => (
          <span key={`cc-${id}`} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold flex items-center">
            CC: {getDeptName(id)}
            <X size={12} className="ml-1 cursor-pointer" onClick={() => toggleDept(id, 'cc')} />
          </span>
        ))}
        {selectedBCC.map(id => (
          <span key={`bcc-${id}`} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-[10px] font-bold flex items-center">
            BCC: {getDeptName(id)}
            <X size={12} className="ml-1 cursor-pointer" onClick={() => toggleDept(id, 'bcc')} />
          </span>
        ))}
      </div>
    </div>
  );
};

export default CcBccSelector;
