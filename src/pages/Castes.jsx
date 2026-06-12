import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';

export function Castes() {
  const navigate = useNavigate();
  const { castes, families, addCaste, deleteCaste, darkMode } = useData();
  const { addToast } = useToast();
  const [newCaste, setNewCaste] = useState('');

  const casteStats = castes.map(caste => {
    const casteFamilies = families.filter(f => f.caste === caste);
    const population = casteFamilies.reduce((sum, f) => sum + f.members.length, 0);
    return {
      name: caste,
      families: casteFamilies.length,
      population
    };
  });

  const handleAdd = () => {
    if (newCaste.trim() && !castes.includes(newCaste.trim())) {
      addCaste(newCaste.trim());
      setNewCaste('');
      addToast('Caste added successfully!', 'success');
    }
  };

  const handleDelete = (caste) => {
    if (confirm(`Are you sure you want to delete "${caste}"?`)) {
      deleteCaste(caste);
      addToast('Caste deleted successfully!', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Castes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Total {castes.length} castes</p>
        </div>
      </div>

      {/* Add New */}
      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter caste name..."
            value={newCaste}
            onChange={(e) => setNewCaste(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className={`
              flex-1 px-4 py-3 rounded-xl border outline-none
              ${darkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
              }
            `}
          />
          <button
            onClick={handleAdd}
            disabled={!newCaste.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {casteStats.map((caste) => (
          <div
            key={caste.name}
            className={`p-6 rounded-2xl border cursor-pointer transition-all hover:shadow-lg ${darkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}
            onClick={() => navigate(`/search?caste=${encodeURIComponent(caste.name)}`)}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(caste.name);
                }}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{caste.name}</h3>
            <div className="mt-4 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Families</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{caste.families}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Population</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{caste.population}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {castes.length === 0 && (
        <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <p className="text-gray-500 dark:text-gray-400">No castes found</p>
        </div>
      )}
    </div>
  );
}
