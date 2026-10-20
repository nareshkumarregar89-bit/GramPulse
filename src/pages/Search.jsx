import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Eye, Edit, Trash2, Users, Building2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getUniqueAssignedVillageNames, isFamilyInVillageRecord } from '../utils/villageUtils';

export function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { families, villages, mohallas, castes, deleteFamily, darkMode, activeVillageRecords = [], language } = useData();
  const { isAdmin, assignedVillages, userProfile, isReadOnly } = useAuth();
  const { addToast } = useToast();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    village: searchParams.get('village') || '',
    mohalla: searchParams.get('mohalla') || '',
    caste: searchParams.get('caste') || '',
    category: ''
  });

  const uniqueAssigned = getUniqueAssignedVillageNames(userProfile || assignedVillages, activeVillageRecords, language);
  const availableVillages = isAdmin ? villages : (uniqueAssigned.length > 0 ? uniqueAssigned : villages);

  useEffect(() => {
    const v = searchParams.get('village');
    const m = searchParams.get('mohalla');
    const c = searchParams.get('caste');
    const q = searchParams.get('q');
    if (v !== null || m !== null || c !== null) {
      setFilters(prev => ({
        ...prev,
        village: v !== null ? v : prev.village,
        mohalla: m !== null ? m : prev.mohalla,
        caste: c !== null ? c : prev.caste
      }));
    }
    if (q !== null) setQuery(q);
  }, [searchParams]);

  const filteredFamilies = families.filter(family => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || (
      (family.familyHeadName && family.familyHeadName.toLowerCase().includes(q)) ||
      (family.familyHeadNameEnglish && family.familyHeadNameEnglish.toLowerCase().includes(q)) ||
      (family.familyHeadNameHindi && family.familyHeadNameHindi.includes(query.trim())) ||
      (family.mobile && family.mobile.includes(query.trim())) ||
      (family.mohalla && family.mohalla.toLowerCase().includes(q)) ||
      (family.caste && family.caste.toLowerCase().includes(q)) ||
      family.aadhaarNumber?.includes(query.trim()) ||
      family.janAadhaarNumber?.includes(query.trim()) ||
      family.rationCardNumber?.includes(query.trim()) ||
      family.bankName?.toLowerCase().includes(q) ||
      family.accountNumber?.includes(query.trim()) ||
      (family.village && family.village.toLowerCase().includes(q)) ||
      (family.id && family.id.toLowerCase().includes(q)) ||
      family.members?.some(m => 
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.nameEnglish && m.nameEnglish.toLowerCase().includes(q)) ||
        (m.nameHindi && m.nameHindi.includes(query.trim()))
      )
    );

    const matchesVillage = !filters.village || filters.village === 'all' || isFamilyInVillageRecord(family, filters.village, activeVillageRecords);
    const matchesMohalla = !filters.mohalla || filters.mohalla === 'all' || (family.mohalla && family.mohalla.trim().toLowerCase() === filters.mohalla.trim().toLowerCase());
    const matchesCaste = !filters.caste || filters.caste === 'all' || (family.caste && family.caste.trim().toLowerCase() === filters.caste.trim().toLowerCase());
    const matchesCategory = !filters.category || filters.category === 'all' || (family.category && family.category.trim().toLowerCase() === filters.category.trim().toLowerCase());

    return matchesQuery && matchesVillage && matchesMohalla && matchesCaste && matchesCategory;
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
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Village</label>
            <select
              value={filters.village}
              onChange={(e) => setFilters(f => ({ ...f, village: e.target.value }))}
              className={`
                w-full px-4 py-3 rounded-xl border outline-none
                ${darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
                }
              `}
            >
              <option value="">{language === 'hi' ? 'सभी गाँव' : 'All Villages'}</option>
              {availableVillages.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
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
                  {(family.familyHeadNameEnglish || family.familyHeadNameHindi || family.familyHeadName || 'F').charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {family.familyHeadNameEnglish || family.familyHeadNameHindi || family.familyHeadName || 'Unknown'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{family.id}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      <Building2 className="w-2.5 h-2.5" />
                      {family.village || '-'}
                    </span>
                  </div>
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
                {!isReadOnly && (
                  <button
                    onClick={() => handleDelete(family.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
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
