import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Edit,
  Trash2,
  Printer,
  Plus,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';

export function Families() {
  const navigate = useNavigate();
  const { families, deleteFamily, darkMode } = useData();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFamilies = families.filter(family =>
    family.familyHeadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    family.mobile.includes(searchQuery) ||
    family.mohalla.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this family?')) {
      deleteFamily(id);
      addToast('Family deleted successfully!', 'success');
    }
  };

  const handlePrint = (family) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${family.familyHeadName} - Family Details</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #16a34a; }
            .section { margin: 20px 0; padding: 20px; background: #f0fdf4; border-radius: 8px; }
            .label { font-weight: bold; color: #374151; }
          </style>
        </head>
        <body>
          <h1>GramPulse - Family Details</h1>
          <div class="section">
            <h2>Family Information</h2>
            <p><span class="label">Family ID:</span> ${family.id}</p>
            <p><span class="label">Family Head:</span> ${family.familyHeadName}</p>
            <p><span class="label">Mobile:</span> ${family.mobile}</p>
            <p><span class="label">Mohalla:</span> ${family.mohalla}</p>
            <p><span class="label">Caste:</span> ${family.caste}</p>
          </div>
          <div class="section">
            <h2>Family Members (${family.members.length})</h2>
            ${family.members.map(m => `<p><span class="label">${m.name}:</span> ${m.age} years, ${m.gender}, ${m.relation}</p>`).join('')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Families</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Total {filteredFamilies.length} families registered</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search families..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2 rounded-xl border outline-none
                ${darkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                }
              `}
            />
          </div>
          <button
            onClick={() => navigate('/survey')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Family
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className={`hidden md:block rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <table className="w-full">
          <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Family Head</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Mohalla</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Caste</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Mobile</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Members</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredFamilies.map((family) => (
              <tr key={family.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {family.familyHeadName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{family.familyHeadName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{family.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{family.mohalla}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{family.caste}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{family.mobile}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-sm font-medium ${darkMode ? 'bg-gray-800 text-white' : 'bg-green-50 text-green-700'}`}>
                    {family.members.length} members
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigate(`/families/${family.id}`)}
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/survey/${family.id}`)}
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePrint(family)}
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                      title="Print"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(family.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredFamilies.map((family) => (
          <div
            key={family.id}
            className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {family.familyHeadName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{family.familyHeadName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{family.id}</p>
                </div>
              </div>
              <div className="relative">
                {/* Mobile dropdown could be added here */}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Mohalla</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{family.mohalla}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Caste</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{family.caste}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Mobile</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{family.mobile}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Members</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{family.members.length}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => navigate(`/families/${family.id}`)}
                className="flex-1 py-2 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl text-sm font-medium"
              >
                View
              </button>
              <button
                onClick={() => navigate(`/survey/${family.id}`)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border ${darkMode ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-900'}`}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredFamilies.length === 0 && (
        <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <p className="text-gray-500 dark:text-gray-400">No families found</p>
        </div>
      )}
    </div>
  );
}
