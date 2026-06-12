import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Eye, Edit, Trash2, Users } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';

export function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { families, mohallas, castes, deleteFamily, darkMode } = useData();
  const { addToast } = useToast();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    mohalla: searchParams.get('mohalla') || '',
    caste: searchParams.get('caste') || '',
    category: ''
  });

  const filteredFamilies = families.filter(family => {
    const matchesQuery = query === '' || (
      family.familyHeadName.toLowerCase().includes(query.toLowerCase()) ||
      family.mobile.includes(query) ||
      family.aadhaarNumber?.includes(query) ||
      family.janAadhaarNumber?.includes(query) ||
      family.rationCardNumber?.includes(query) ||
      family.bankName?.toLowerCase().includes(query.toLowerCase()) ||
      family.accountNumber?.includes(query) ||
      family.members.some(m => m.name.toLowerCase().includes(query.toLowerCase()))
    );

    const matchesMohalla = filters.mohalla === '' || family.mohalla === filters.mohalla;
    const matchesCaste = filters.caste === '' || family.caste === filters.caste;
    const matchesCategory = filters.category === '' || family.category === filters.category;

    return matchesQuery && matchesMohalla && matchesCaste && matchesCategory;
  });

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this family?')) {
      deleteFamily(id);
      addToast('Family deleted successfully!', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Search families across all records</p>
      </div>

      {/* Search Bar */}
      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, Aadhaar, account number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`
              w-full pl-12 pr-4 py-4 rounded-xl border outline-none text-lg
              ${darkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
              }
            `}
          />
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mohalla</label>
            <select
              value={filters.mohalla}
              onChange={(e) => setFilters(f => ({ ...f, mohalla: e.target.value }))}
              className={`
                w-full px-4 py-3 rounded-xl border outline-none
                ${darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
                }
              `}
            >
              <option value="">All Mohallas</option>
              {mohallas.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Caste</label>
            <select
              value={filters.caste}
              onChange={(e) => setFilters(f => ({ ...f, caste: e.target.value }))}
              className={`
                w-full px-4 py-3 rounded-xl border outline-none
                ${darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
                }
              `}
            >
              <option value="">All Castes</option>
              {castes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
              className={`
                w-full px-4 py-3 rounded-xl border outline-none
                ${darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
                }
              `}
            >
              <option value="">All Categories</option>
              <option value="BPL">BPL</option>
              <option value="APL">APL</option>
              <option value="Antyodaya">Antyodaya</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Found {filteredFamilies.length} result{filteredFamilies.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-4">
        {filteredFamilies.map(family => (
          <div
            key={family.id}
            className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                  {family.familyHeadName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{family.familyHeadName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{family.id}</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mobile</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{family.mobile}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mohalla</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{family.mohalla}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Caste</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{family.caste}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{family.members.length} members</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/families/${family.id}`)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(`/survey/${family.id}`)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(family.id)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredFamilies.length === 0 && (
          <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <p className="text-gray-500 dark:text-gray-400">No families found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
