import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, X, Link as LinkIcon } from 'lucide-react';

const ReferenceSearch = ({ selectedRefs, setSelectedRefs }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (query.length < 3) return setResults([]);
      setIsSearching(true);
      try {
        const res = await api.get(`/documents?q=${query}`);
        // Filtering out already selected
        const filtered = res.data.data.filter(doc => !selectedRefs.some(r => r.id === doc.id));
        setResults(filtered);
      } catch (err) {
        console.error('Search failed');
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(search, 500);
    return () => clearTimeout(timer);
  }, [query, selectedRefs]);

  const addRef = (doc) => {
    setSelectedRefs([...selectedRefs, doc]);
    setQuery('');
    setResults([]);
  };

  const removeRef = (id) => {
    setSelectedRefs(selectedRefs.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          placeholder="Search documents by subject or number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {results.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {results.map(doc => (
            <button
              key={doc.id}
              onClick={() => addRef(doc)}
              className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0"
            >
              <p className="text-xs font-bold text-slate-800">{doc.subject}</p>
              <p className="text-[10px] text-slate-500">{doc.outward_number || 'No Number'}</p>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {selectedRefs.map(doc => (
          <span key={`ref-${doc.id}`} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-[10px] font-bold flex items-center border border-indigo-100">
            <LinkIcon size={10} className="mr-1" />
            REF: {doc.outward_number || doc.subject.substring(0, 15) + '...'}
            <X size={12} className="ml-1 cursor-pointer hover:text-red-500" onClick={() => removeRef(doc.id)} />
          </span>
        ))}
      </div>
    </div>
  );
};

export default ReferenceSearch;
