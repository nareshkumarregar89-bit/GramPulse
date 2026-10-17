import { useState, useMemo } from 'react';
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
  UserCheck,
  CheckCircle2,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { PrintDataModal } from '../components/PrintDataModal';
import { PrintDocument } from '../components/PrintDocument';
import { getUniqueAssignedVillageNames } from '../utils/villageUtils';

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
  const { isAdmin, assignedVillages, currentUser, userProfile, isReadOnly } = useAuth();
  const { addToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activePrintTarget, setActivePrintTarget] = useState(null); // null = all / selected
  const [selectedIds, setSelectedIds] = useState(new Set());

  const displayVillageNames = useMemo(() => {
    const list = getUniqueAssignedVillageNames(userProfile || assignedVillages, villages, language);
    return list.join(', ');
  }, [userProfile, assignedVillages, villages, language]);

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
      // If deleted item was selected, remove from set
      if (selectedIds.has(id)) {
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }
  };

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredFamilies.length && filteredFamilies.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFamilies.map(f => f.id)));
    }
  };

  const selectedFamiliesList = filteredFamilies.filter(f => selectedIds.has(f.id));

  // Open Print Modal for single family or batch
  const handleOpenPrintModal = (targetFamily = null) => {
    setActivePrintTarget(targetFamily);
    setIsPrintModalOpen(true);
  };

  const currentPrintedFamilies = activePrintTarget 
    ? [activePrintTarget] 
    : (selectedIds.size > 0 ? selectedFamiliesList : filteredFamilies);

  const printedBy = userProfile?.name || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'VillagePulse Officer');

  return (
    <>
      {/* SCREEN UI - HIDDEN DURING PRINTING */}
      <div className="space-y-6 no-print">
        {/* Page Header */}
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
                  {displayVillageNames || (language === 'hi' ? 'समोड़ी' : 'Samodi')}
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

            {/* PRINT DATA BUTTON */}
            <button
              type="button"
              onClick={() => handleOpenPrintModal(null)}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold shadow-md transition-all shrink-0 active:scale-95"
              title={language === 'hi' ? 'डेटा प्रिंट करें' : 'Print Data'}
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'hi' ? 'डेटा प्रिंट करें' : 'Print Data'}</span>
              {selectedIds.size > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                  {selectedIds.size}
                </span>
              )}
            </button>

            {/* Excel Import Button */}
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setIsExcelModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-semibold shadow-md transition-all shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{t('import_excel')}</span>
              </button>
            )}

            {/* Add Family Button */}
            {!isReadOnly && (
              <button
                onClick={() => navigate('/survey')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-indigo-600 hover:from-green-600 hover:to-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold shadow-md transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'hi' ? 'नया परिवार' : 'Add Family'}</span>
              </button>
            )}

            {isReadOnly && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold">
                <span>{language === 'hi' ? 'केवल अवलोकन' : 'View-Only'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Floating / Sticky Multi-Selection Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-indigo-600 text-white shadow-xl animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-indigo-200 shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-bold">
                  {language === 'hi' 
                    ? `${selectedIds.size} परिवार चयनित हैं` 
                    : `${selectedIds.size} families selected`}
                </p>
                <p className="text-[11px] text-indigo-100 hidden sm:block">
                  {language === 'hi' 
                    ? 'आप केवल चयनित परिवारों को प्रिंट कर सकते हैं' 
                    : 'You can print only selected family records'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 rounded-xl border border-white/30 hover:bg-white/10 text-xs font-semibold text-white transition-all"
              >
                {language === 'hi' ? 'चयन हटाएं' : 'Clear'}
              </button>
              <button
                type="button"
                onClick={() => handleOpenPrintModal(null)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white text-indigo-700 font-bold text-xs sm:text-sm hover:bg-indigo-50 shadow-sm transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'hi' ? `चयनित प्रिंट (${selectedIds.size})` : `Print Selected (${selectedIds.size})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className={`hidden md:block rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <table className="w-full">
            <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
              <tr>
                {/* Select All Checkbox */}
                <th className="px-4 py-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredFamilies.length > 0 && selectedIds.size === filteredFamilies.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title={language === 'hi' ? 'सभी चुनें / हटाएं' : 'Select / Deselect all'}
                  />
                </th>
                <th className="text-left px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('family_head')}</th>
                <th className="text-left px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('village')}</th>
                <th className="text-left px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('mohalla')}</th>
                <th className="text-left px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('caste')}</th>
                <th className="text-left px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('mobile')}</th>
                <th className="text-left px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('members')}</th>
                {isAdmin && (
                  <th className="text-left px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">{language === 'hi' ? 'सर्वेयर' : 'Surveyor'}</th>
                )}
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredFamilies.map((family) => {
                const isSelected = selectedIds.has(family.id);

                return (
                  <tr 
                    key={family.id} 
                    className={`transition-colors ${
                      isSelected 
                        ? (darkMode ? 'bg-indigo-950/30' : 'bg-indigo-50/70') 
                        : (darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50')
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(family.id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4">
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
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                        <Building2 className="w-3 h-3" />
                        <span>{family.village || '-'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300 text-sm">{family.mohalla}</td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300 text-sm">{family.caste}</td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300 text-sm">{family.mobile}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${darkMode ? 'bg-gray-800 text-white' : 'bg-green-50 text-green-700'}`}>
                        {family.members?.length || 0} {language === 'hi' ? 'सदस्य' : 'members'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                          <span>{family.surveyorName || family.surveyorEmail?.split('@')[0] || 'Admin'}</span>
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/families/${family.id}`)}
                          className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                          title={language === 'hi' ? 'विवरण देखें' : 'View Details'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Direct Print Dossier Button */}
                        <button
                          onClick={() => handleOpenPrintModal(family)}
                          className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-indigo-950/50 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-600'}`}
                          title={language === 'hi' ? 'परिवार प्रपत्र प्रिंट करें' : 'Print Family Dossier'}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/survey/${family.id}`)}
                          className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                          title={language === 'hi' ? 'संपादित करें' : 'Edit'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!isReadOnly && (
                          <button
                            onClick={() => handleDelete(family.id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title={language === 'hi' ? 'हटाएं' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredFamilies.map((family) => {
            const isSelected = selectedIds.has(family.id);

            return (
              <div
                key={family.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? (darkMode ? 'bg-indigo-950/30 border-indigo-700' : 'bg-indigo-50/70 border-indigo-300')
                    : (darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(family.id)}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
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
                          {family.village || '-'}
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
                    <p className="font-medium text-gray-900 dark:text-white mt-0.5">{family.members?.length || 0} {language === 'hi' ? 'सदस्य' : 'members'}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
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
                  {/* Direct Print Button Mobile */}
                  <button
                    onClick={() => handleOpenPrintModal(family)}
                    className={`p-2 rounded-xl border ${darkMode ? 'border-gray-700 text-indigo-400 hover:bg-gray-800' : 'border-gray-200 text-indigo-600 hover:bg-gray-100'}`}
                    title={language === 'hi' ? 'प्रिंट' : 'Print'}
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleDelete(family.id)}
                      className="p-2 text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                      title={language === 'hi' ? 'हटाएं' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredFamilies.length === 0 && (
          <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <p className="text-gray-500 dark:text-gray-400">
              {!isAdmin && (!assignedVillages || assignedVillages.length === 0)
                ? (language === 'hi' 
                    ? 'गाँव आवंटन प्रतीक्षारत: व्यवस्थापक द्वारा गाँव आवंटित किए जाने के बाद आपके गाँव के परिवार यहाँ दिखाई देंगे।'
                    : 'Awaiting Village Assignment: Family records will appear here once an administrator assigns a village to your account.')
                : (language === 'hi' ? 'कोई परिवार रिकॉर्ड नहीं मिला' : 'No families found')}
            </p>
          </div>
        )}

        {/* Excel Import Modal */}
        <ExcelImportModal
          isOpen={isExcelModalOpen}
          onClose={() => setIsExcelModalOpen(false)}
        />

        {/* Print Data Modal with live preview & format options */}
        <PrintDataModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setActivePrintTarget(null);
          }}
          families={currentPrintedFamilies}
          selectedFamilies={selectedFamiliesList}
          selectedVillage={selectedVillage}
          currentUser={currentUser}
          userProfile={userProfile}
          language={language}
        />
      </div>

      {/* Fallback print container only if print triggered without modal */}
      {!isPrintModalOpen && activePrintTarget && (
        <div className="print-only">
          <PrintDocument
            families={currentPrintedFamilies}
            format="dossier"
            village={selectedVillage}
            printedBy={printedBy}
            language={language}
          />
        </div>
      )}
    </>
  );
}
