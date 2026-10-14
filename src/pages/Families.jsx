import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Edit,
  Trash2,
  Printer,
  Plus,
  Search,
  FileSpreadsheet,
  Building2,
  UserCheck
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { ExcelImportModal } from '../components/ExcelImportModal';

export function Families() {
  const navigate = useNavigate();
  const { 
    families, 
    deleteFamily, 
    darkMode, 
    t, 
    language, 
    villages, 
    selectedVillage, 
    setSelectedVillage 
  } = useData();
  const { isAdmin, assignedVillages } = useAuth();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const filteredFamilies = families.filter(family =>
    (family.familyHeadNameEnglish && family.familyHeadNameEnglish.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (family.familyHeadNameHindi && family.familyHeadNameHindi.includes(searchQuery)) ||
    (family.mobile && family.mobile.includes(searchQuery)) ||
    (family.mohalla && family.mohalla.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (family.caste && family.caste.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (family.village && family.village.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = (id) => {
    if (confirm(language === 'hi' ? 'क्या आप निश्चित रूप से इस परिवार को हटाना चाहते हैं?' : 'Are you sure you want to delete this family?')) {
      deleteFamily(id);
      addToast(language === 'hi' ? 'परिवार सफलतापूर्वक हटा दिया गया!' : 'Family deleted successfully!', 'success');
    }
  };

  const handlePrint = (family) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${family.familyHeadNameEnglish || family.familyHeadNameHindi || family.familyHeadName || 'Family'} - Family Details</title>
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
            <p><span class="label">Village:</span> ${family.village || 'N/A'}</p>
            <p><span class="label">Family Head:</span> ${family.familyHeadNameEnglish || family.familyHeadNameHindi || family.familyHeadName || '-'}</p>
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('families')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'hi' 
              ? `कुल ${filteredFamilies.length} परिवार पंजीकृत हैं` 
              : `Total ${filteredFamilies.length} families registered`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Village Filter: Dropdown for Admin, Fixed Badge for Surveyor */}
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className={`text-xs md:text-sm px-3 py-2 rounded-xl border outline-none font-medium transition-colors ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                <option value="all">{t('all_villages')}</option>
                {villages.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-xs md:text-sm font-semibold">
                {assignedVillages?.join(', ') || 'रामपुरा'}
              </span>
            </div>
          )}

          {/* Search box */}
          <div className="relative flex-1 sm:w-56 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'hi' ? 'नाम, गाँव, मोबाइल से खोजें...' : 'Search by name, village, mobile...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2 rounded-xl border outline-none text-xs md:text-sm
                ${darkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                }
              `}
            />
          </div>

          {/* Excel Import Button */}
          <button
            type="button"
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-semibold shadow-md transition-all shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('import_excel')}</span>
          </button>

          {/* Add Family Button */}
          <button
            onClick={() => navigate('/survey')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-indigo-600 hover:from-green-600 hover:to-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'hi' ? 'नया परिवार' : 'Add Family'}</span>
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className={`hidden md:block rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <table className="w-full">
          <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('family_head')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('village')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('mohalla')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('caste')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('mobile')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('members')}</th>
              {isAdmin && (
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{language === 'hi' ? 'सर्वेयर' : 'Surveyor'}</th>
              )}
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredFamilies.map((family) => (
              <tr key={family.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                      {(family.familyHeadNameEnglish || family.familyHeadNameHindi || 'U').charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {language === 'en' ? family.familyHeadNameEnglish : family.familyHeadNameHindi}
                      </p>
                      {family.familyHeadNameEnglish && family.familyHeadNameHindi && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {language === 'en' ? family.familyHeadNameHindi : family.familyHeadNameEnglish}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{family.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                    <Building2 className="w-3 h-3" />
                    <span>{family.village || 'रामपुरा'}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">{family.mohalla}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">{family.caste}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">{family.mobile}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${darkMode ? 'bg-gray-800 text-white' : 'bg-green-50 text-green-700'}`}>
                    {family.members.length} {language === 'hi' ? 'सदस्य' : 'members'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                      <span>{family.surveyorName || family.surveyorEmail?.split('@')[0] || 'Admin'}</span>
                    </span>
                  </td>
                )}
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
                  {(family.familyHeadNameEnglish || family.familyHeadNameHindi || 'U').charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {language === 'en' ? family.familyHeadNameEnglish : family.familyHeadNameHindi}
                  </p>
                  {family.familyHeadNameEnglish && family.familyHeadNameHindi && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {language === 'en' ? family.familyHeadNameHindi : family.familyHeadNameEnglish}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400 font-mono">{family.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                      {family.village || 'रामपुरा'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('mohalla')}</p>
                <p className="font-medium text-gray-900 dark:text-white mt-0.5">{family.mohalla}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('caste')}</p>
                <p className="font-medium text-gray-900 dark:text-white mt-0.5">{family.caste}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('mobile')}</p>
                <p className="font-medium text-gray-900 dark:text-white mt-0.5">{family.mobile}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('members')}</p>
                <p className="font-medium text-gray-900 dark:text-white mt-0.5">{family.members.length} {language === 'hi' ? 'सदस्य' : 'members'}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => navigate(`/families/${family.id}`)}
                className="flex-1 py-2 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                {language === 'hi' ? 'देखें' : 'View'}
              </button>
              <button
                onClick={() => navigate(`/survey/${family.id}`)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${darkMode ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-900'}`}
              >
                {language === 'hi' ? 'संपादित करें' : 'Edit'}
              </button>
              <button
                onClick={() => handleDelete(family.id)}
                className="p-2 text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredFamilies.length === 0 && (
        <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <p className="text-gray-500 dark:text-gray-400">
            {language === 'hi' ? 'कोई परिवार रिकॉर्ड नहीं मिला' : 'No families found'}
          </p>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />
    </div>
  );
}
