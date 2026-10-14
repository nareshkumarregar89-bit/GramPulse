import { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Users, 
  UserCheck, 
  Power, 
  Layers, 
  ArrowRight,
  Info,
  ShieldCheck
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { TiltCard } from '../components/TiltCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { EmptyState3D } from '../components/EmptyState3D';

export function VillageManagement() {
  const { 
    villageRecords = [], 
    activeVillageRecords = [], 
    allFamilies = [], 
    addVillageRecord, 
    updateVillageRecord, 
    toggleVillageStatus, 
    deleteVillageRecord, 
    isFamilyInVillage, 
    darkMode, 
    language 
  } = useData();
  const { allUsers = [] } = useAuth();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState(null);
  const [deleteWarningData, setDeleteWarningData] = useState(null); // { village, associatedCount }
  const [confirmDeleteVillage, setConfirmDeleteVillage] = useState(null); // village object ready to delete

  // Add form state
  const [formData, setFormData] = useState({
    nameEnglish: '',
    nameHindi: '',
    status: 'active'
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered villages list
  const filteredVillages = villageRecords.filter(v => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q || 
      (v.nameEnglish && v.nameEnglish.toLowerCase().includes(q)) || 
      (v.nameHindi && v.nameHindi.includes(q)) ||
      (v.name && v.name.toLowerCase().includes(q));

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && v.status === 'active') || 
      (statusFilter === 'inactive' && v.status === 'inactive');

    return matchesSearch && matchesStatus;
  });

  // Calculate dynamic summary stats
  const totalVillagesCount = villageRecords.length;
  const activeVillagesCount = villageRecords.filter(v => v.status === 'active').length;
  const inactiveVillagesCount = villageRecords.filter(v => v.status === 'inactive').length;
  const totalSurveyedFamilies = allFamilies.length;

  // Handle Add Village submission
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.nameEnglish.trim() || !formData.nameHindi.trim()) {
      setFormError(language === 'hi' ? 'कृपया अंग्रेजी और हिंदी दोनों नाम दर्ज करें।' : 'Please enter both English and Hindi names.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addVillageRecord(formData);
      addToast(
        language === 'hi' 
          ? `गाँव "${formData.nameHindi}" सफलतापूर्वक जोड़ा गया!` 
          : `Village "${formData.nameEnglish}" added successfully!`,
        'success'
      );
      setIsAddModalOpen(false);
      setFormData({ nameEnglish: '', nameHindi: '', status: 'active' });
    } catch (err) {
      setFormError(err.message || 'Failed to add village');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Village submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingVillage) return;

    try {
      setIsSubmitting(true);
      await updateVillageRecord(editingVillage.id, {
        nameEnglish: editingVillage.nameEnglish,
        nameHindi: editingVillage.nameHindi,
        status: editingVillage.status
      });
      addToast(
        language === 'hi' 
          ? 'गाँव का विवरण सफलतापूर्वक अपडेट हुआ!' 
          : 'Village updated successfully!',
        'success'
      );
      setEditingVillage(null);
    } catch (err) {
      addToast(err.message || 'Failed to update village', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Toggle (Active / Inactive)
  const handleToggle = async (v) => {
    try {
      const next = await toggleVillageStatus(v.id);
      addToast(
        language === 'hi'
          ? `गाँव को ${next === 'active' ? 'सक्रिय' : 'निष्क्रिय'} कर दिया गया!`
          : `Village marked as ${next}!`,
        'success'
      );
    } catch (err) {
      addToast(err.message || 'Failed to change status', 'error');
    }
  };

  // Handle Delete button click with associated records safety check
  const handleDeleteClick = (village) => {
    // Count associated families
    const associatedFamilies = allFamilies.filter(f => isFamilyInVillage(f, village.id));
    
    if (associatedFamilies.length > 0) {
      // Village has records - deletion is blocked, show explanation & offer deactivation
      setDeleteWarningData({
        village,
        associatedCount: associatedFamilies.length
      });
    } else {
      // 0 records - safe to confirm deletion
      setConfirmDeleteVillage(village);
    }
  };

  // Confirm delete when 0 records exist
  const handleExecuteDelete = async () => {
    if (!confirmDeleteVillage) return;
    try {
      await deleteVillageRecord(confirmDeleteVillage.id);
      addToast(
        language === 'hi' ? 'गाँव स्थायी रूप से हटा दिया गया!' : 'Village deleted permanently!',
        'success'
      );
      setConfirmDeleteVillage(null);
    } catch (err) {
      addToast(err.message || 'Failed to delete village', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {language === 'hi' ? 'गाँव प्रबंधन (Village Management)' : 'Village Management'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {language === 'hi' 
                  ? 'नए गाँव जोड़ें, संपादित करें, सक्रिय/निष्क्रिय करें और सर्वेयर आवंटन देखें' 
                  : 'Add new villages, edit, activate/deactivate, and oversee surveyor distribution'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setFormData({ nameEnglish: '', nameHindi: '', status: 'active' });
            setFormError('');
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-indigo-600 hover:from-green-600 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'hi' ? 'नया गाँव जोड़ें' : 'Add New Village'}</span>
        </button>
      </div>

      {/* KPI Stats Overview */}
      {/* KPI Stats Overview with 3D Depth */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TiltCard 
          maxTilt={6}
          perspective={850}
          scale={1.02}
          className={`p-4 rounded-2xl border shadow-3d-card transition-all ${darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between transform-z-20">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {language === 'hi' ? 'कुल गाँव' : 'Total Villages'}
            </span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1.5 transform-z-20">
            <AnimatedCounter value={totalVillagesCount} />
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {language === 'hi' ? 'डेटाबेस में पंजीकृत' : 'Registered in database'}
          </p>
        </TiltCard>

        <TiltCard 
          maxTilt={6}
          perspective={850}
          scale={1.02}
          className={`p-4 rounded-2xl border shadow-3d-card transition-all ${darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between transform-z-20">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {language === 'hi' ? 'सक्रिय गाँव' : 'Active Villages'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-extrabold text-green-600 dark:text-green-400 mt-1.5 transform-z-20">
            <AnimatedCounter value={activeVillagesCount} />
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {language === 'hi' ? 'सर्वेक्षण हेतु उपलब्ध' : 'Available for active survey'}
          </p>
        </TiltCard>

        <TiltCard 
          maxTilt={6}
          perspective={850}
          scale={1.02}
          className={`p-4 rounded-2xl border shadow-3d-card transition-all ${darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between transform-z-20">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {language === 'hi' ? 'निष्क्रिय गाँव' : 'Deactivated'}
            </span>
            <Power className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1.5 transform-z-20">
            <AnimatedCounter value={inactiveVillagesCount} />
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {language === 'hi' ? 'रिकॉर्ड्स सुरक्षित, फॉर्म से छिपे' : 'Data preserved, hidden from form'}
          </p>
        </TiltCard>

        <TiltCard 
          maxTilt={6}
          perspective={850}
          scale={1.02}
          className={`p-4 rounded-2xl border shadow-3d-card transition-all ${darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between transform-z-20">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {language === 'hi' ? 'कुल सर्वे रिकॉर्ड' : 'Total Families'}
            </span>
            <Users className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1.5 transform-z-20">
            <AnimatedCounter value={totalSurveyedFamilies} />
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {language === 'hi' ? 'सभी गाँवों के कुल परिवार' : 'Surveyed across all villages'}
          </p>
        </TiltCard>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={language === 'hi' ? 'गाँव खोजें (हिंदी या अंग्रेजी में)...' : 'Search village by Hindi or English name...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs sm:text-sm outline-none ${
              darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500 whitespace-nowrap">{language === 'hi' ? 'स्थिति:' : 'Status:'}</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`text-xs px-3 py-2 rounded-xl border outline-none font-medium ${
              darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <option value="all">{language === 'hi' ? 'सभी गाँव' : 'All Villages'}</option>
            <option value="active">{language === 'hi' ? 'केवल सक्रिय (Active Only)' : 'Active Only'}</option>
            <option value="inactive">{language === 'hi' ? 'केवल निष्क्रिय (Inactive Only)' : 'Inactive Only'}</option>
          </select>
        </div>
      </div>

      {/* Villages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVillages.map((village) => {
          const isActive = village.status === 'active';
          
          // Dynamic Village Statistics from real database data:
          const villageFamilies = allFamilies.filter(f => isFamilyInVillage(f, village.id));
          const totalFamiliesCount = villageFamilies.length;
          const totalPopulation = villageFamilies.reduce((sum, f) => sum + (f.members?.length || 0), 0);
          
          // Assigned Surveyors
          const assignedSurveyors = allUsers.filter(u => 
            u.role === 'surveyor' && 
            u.assignedVillages && 
            u.assignedVillages.some(av => isFamilyInVillage({ village: av }, village.id))
          );

          return (
            <TiltCard 
              key={village.id}
              maxTilt={5}
              scale={1.015}
              className={`rounded-2xl border shadow-3d-card transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200 shadow-xs'
              } ${!isActive ? 'opacity-75' : ''}`}
            >
              {/* Card Header */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 transform-z-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {village.nameHindi}
                      </h2>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                        {village.nameEnglish}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 font-mono">
                      ID: {village.id}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                    isActive 
                      ? 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30' 
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  }`}>
                    {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                    <span>{isActive ? (language === 'hi' ? 'सक्रिय' : 'Active') : (language === 'hi' ? 'निष्क्रिय' : 'Inactive')}</span>
                  </span>
                </div>
              </div>

              {/* Card Body: Dynamic Statistics */}
              <div className="p-5 space-y-4 flex-1 transform-z-10">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-800/40 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                    <span className="text-[10px] text-gray-400 block font-medium uppercase">
                      {language === 'hi' ? 'कुल परिवार' : 'Families'}
                    </span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white mt-1 block">
                      <AnimatedCounter value={totalFamiliesCount} />
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-800/40 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                    <span className="text-[10px] text-gray-400 block font-medium uppercase">
                      {language === 'hi' ? 'कुल जनसंख्या' : 'Population'}
                    </span>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
                      <AnimatedCounter value={totalPopulation} />
                    </span>
                  </div>
                </div>

                {/* Empty state or survey notice */}
                {totalFamiliesCount === 0 && (
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>{language === 'hi' ? 'कोई सर्वे रिकॉर्ड नहीं • सर्वे हेतु तैयार' : 'No survey records yet • Ready for surveying'}</span>
                  </div>
                )}

                {/* Assigned Surveyors */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{language === 'hi' ? 'आवंटित सर्वेयर:' : 'Assigned Surveyors:'}</span>
                    </span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      {assignedSurveyors.length}
                    </span>
                  </div>

                  {assignedSurveyors.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {assignedSurveyors.map(u => (
                        <span 
                          key={u.uid}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span>{u.name || u.email?.split('@')[0]}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-500 dark:text-amber-400 italic">
                      {language === 'hi' ? 'कोई सर्वेयर आवंटित नहीं है' : 'No surveyor assigned yet'}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer: Action Buttons */}
              <div className={`p-4 border-t flex items-center justify-between gap-2 ${
                darkMode ? 'bg-gray-800/30 border-gray-800' : 'bg-gray-50/70 border-gray-100'
              }`}>
                {/* Active/Inactive Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(village)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                    isActive 
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                      : 'bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400'
                  }`}
                  title={isActive ? 'Deactivate village' : 'Activate village'}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isActive ? (language === 'hi' ? 'निष्क्रिय करें' : 'Deactivate') : (language === 'hi' ? 'सक्रिय करें' : 'Activate')}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => setEditingVillage(village)}
                    className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors active:scale-90"
                    title={language === 'hi' ? 'गाँव विवरण संपादित करें' : 'Edit Village Details'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete Button (Protected with safety check) */}
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(village)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors active:scale-90"
                    title={language === 'hi' ? 'गाँव हटाएं' : 'Delete Village'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </TiltCard>
          );
        })}
      </div>

      {filteredVillages.length === 0 && (
        <EmptyState3D
          title={language === 'hi' ? 'कोई गाँव नहीं मिला' : 'No villages found'}
          description={language === 'hi' ? 'अपने खोज मापदंड बदलें या नया गाँव जोड़ें।' : 'Try adjusting your search or add a new village.'}
          actionLabel={language === 'hi' ? 'नया गाँव जोड़ें' : 'Add New Village'}
          onAction={() => {
            setFormData({ nameEnglish: '', nameHindi: '', status: 'active' });
            setFormError('');
            setIsAddModalOpen(true);
          }}
        />
      )}

      {/* MODAL 1: Add New Village */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 space-y-4 transition-all ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-500" />
                <span>{language === 'hi' ? 'नया गाँव जोड़ें' : 'Add New Village'}</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {language === 'hi' ? 'गाँव का नाम (English) *' : 'Village Name (English) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samodi, Kotdi, Deoli"
                  value={formData.nameEnglish}
                  onChange={(e) => setFormData(p => ({ ...p, nameEnglish: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {language === 'hi' ? 'गाँव का नाम (हिंदी) *' : 'Village Name (Hindi) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. समोड़ी, कोटड़ी, देवली"
                  value={formData.nameHindi}
                  onChange={(e) => setFormData(p => ({ ...p, nameHindi: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {language === 'hi' ? 'स्थिति (Initial Status)' : 'Initial Status'}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="active">{language === 'hi' ? 'सक्रिय (Active)' : 'Active'}</option>
                  <option value="inactive">{language === 'hi' ? 'निष्क्रिय (Inactive)' : 'Inactive'}</option>
                </select>
              </div>

              {/* Preview */}
              {(formData.nameHindi || formData.nameEnglish) && (
                <div className={`p-3 rounded-xl border text-[11px] ${
                  darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-indigo-50/50 border-indigo-100 text-indigo-900'
                }`}>
                  <span className="font-semibold block mb-0.5 text-gray-500 dark:text-gray-400">
                    {language === 'hi' ? 'फॉर्म और डैशबोर्ड में दृश्यमान रूप:' : 'Display Format in Forms & Dashboard:'}
                  </span>
                  <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                    {formData.nameHindi || 'गाँव'} ({formData.nameEnglish || 'Village'})
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-gray-600 dark:text-gray-300 font-semibold"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-green-600 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? (language === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...') : (language === 'hi' ? 'गाँव जोड़ें' : 'Add Village')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Village */}
      {editingVillage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 space-y-4 transition-all ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-500" />
                <span>{language === 'hi' ? 'गाँव संपादित करें' : 'Edit Village Details'}</span>
              </h2>
              <button onClick={() => setEditingVillage(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {language === 'hi' ? 'गाँव का नाम (English) *' : 'Village Name (English) *'}
                </label>
                <input
                  type="text"
                  required
                  value={editingVillage.nameEnglish}
                  onChange={(e) => setEditingVillage(p => ({ ...p, nameEnglish: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {language === 'hi' ? 'गाँव का नाम (हिंदी) *' : 'Village Name (Hindi) *'}
                </label>
                <input
                  type="text"
                  required
                  value={editingVillage.nameHindi}
                  onChange={(e) => setEditingVillage(p => ({ ...p, nameHindi: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {language === 'hi' ? 'स्थिति (Status)' : 'Status'}
                </label>
                <select
                  value={editingVillage.status || 'active'}
                  onChange={(e) => setEditingVillage(p => ({ ...p, status: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="active">{language === 'hi' ? 'सक्रिय (Active)' : 'Active'}</option>
                  <option value="inactive">{language === 'hi' ? 'निष्क्रिय (Inactive)' : 'Inactive'}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingVillage(null)}
                  className="px-4 py-2 rounded-xl border text-gray-600 dark:text-gray-300 font-semibold"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-green-600 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? (language === 'hi' ? 'अपडेट हो रहा है...' : 'Updating...') : (language === 'hi' ? 'बदलाव सहेजें' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Deletion Warning Dialog (Records Exist) */}
      {deleteWarningData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 space-y-4 ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold">
                {language === 'hi' ? 'गाँव स्थायी रूप से नहीं हटाया जा सकता' : 'Cannot Delete Village Permanently'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'hi'
                  ? `गाँव "${deleteWarningData.village.nameHindi}" से जुड़े ${deleteWarningData.associatedCount} परिवार सर्वे रिकॉर्ड डेटाबेस में मौजूद हैं। स्थायी रूप से हटाने से डेटा नष्ट हो जाएगा।`
                  : `There are ${deleteWarningData.associatedCount} family survey records associated with "${deleteWarningData.village.nameEnglish}". Deleting it would compromise survey data integrity.`}
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}>
              <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
              <span>
                {language === 'hi'
                  ? 'सुरक्षित विकल्प: आप इसे "निष्क्रिय" कर सकते हैं जिससे यह ड्रॉपडाउन से हट जाएगा और सभी पुराने रिकॉर्ड्स सुरक्षित रहेंगे।'
                  : 'Safe Alternative: Deactivate this village instead. It will be hidden from survey forms while keeping all historical records intact.'}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteWarningData(null)}
                className="flex-1 py-2.5 rounded-xl border text-gray-600 dark:text-gray-300 font-semibold text-xs"
              >
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await toggleVillageStatus(deleteWarningData.village.id);
                  addToast(
                    language === 'hi' ? 'गाँव सुरक्षित रूप से निष्क्रिय कर दिया गया!' : 'Village safely deactivated!',
                    'success'
                  );
                  setDeleteWarningData(null);
                }}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-xs transition-all shadow-md"
              >
                {language === 'hi' ? 'गाँव निष्क्रिय करें' : 'Deactivate Village'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Confirmation Dialog for 0-record village deletion */}
      {confirmDeleteVillage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 space-y-4 ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold">
                {language === 'hi' ? 'गाँव स्थायी रूप से हटाएं?' : 'Delete Village Permanently?'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'hi'
                  ? `क्या आप निश्चित रूप से "${confirmDeleteVillage.nameHindi} (${confirmDeleteVillage.nameEnglish})" को हमेशा के लिए हटाना चाहते हैं? यह क्रिया वापस नहीं की जा सकती।`
                  : `Are you sure you want to permanently delete "${confirmDeleteVillage.nameEnglish}"? This action cannot be undone.`}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteVillage(null)}
                className="flex-1 py-2.5 rounded-xl border text-gray-600 dark:text-gray-300 font-semibold text-xs"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-xs transition-all shadow-md"
              >
                {language === 'hi' ? 'हाँ, स्थायी रूप से हटाएं' : 'Confirm Permanent Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
