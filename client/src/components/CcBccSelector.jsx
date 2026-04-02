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
        setDepartments(res.data.data || []);
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

    // Convert both to numbers for comparison if they aren't already
    const dId = Number(deptId);
    const currentNorm = current.map(Number);
    const otherNorm = other.map(Number);

    if (currentNorm.includes(dId)) {
      setter(currentNorm.filter(id => id !== dId));
    } else {
      if (!otherNorm.includes(dId)) {
        setter([...currentNorm, dId]);
      }
    }
  };

  const getDeptName = (id) => departments.find(d => Number(d.id) === Number(id))?.name || id;

  return (
    <div className="space-y-4">
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'cc' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('cc')}
        >
          CC ({selectedCC.length})
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'bcc' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('bcc')}
        >
          BCC ({selectedBCC.length})
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
        {departments.map(dept => {
          const isSelected = (activeTab === 'cc' ? selectedCC : selectedBCC).map(Number).includes(Number(dept.id));
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => toggleDept(dept.id, activeTab)}
              className={`text-left px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
            >
              {dept.name}
            </button>
          );
        })}
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
