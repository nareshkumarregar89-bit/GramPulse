import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  RotateCcw, 
  X, 
  Search, 
  Building2, 
  MapPin, 
  Users, 
  Phone, 
  Calendar, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldAlert, 
  FileText, 
  Sparkles, 
  Clock, 
  XCircle,
  Home,
  UserCheck,
  CreditCard,
  Layers
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { TiltCard } from '../components/TiltCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { EmptyState3D } from '../components/EmptyState3D';

export function DeletedRecords() {
  const navigate = useNavigate();
  const { 
    deletedFamilies = [], 
    restoreFamily, 
    permanentlyDeleteFamily, 
    restoreAllFamilies,
    permanentlyDeleteAllFamilies,
    villages = [],
    activeVillageRecords = [],
    isFamilyInVillage,
    t, 
    darkMode, 
    language 
  } = useData();
  const { currentUser, isReadOnly } = useAuth();
  const { addToast } = useToast();

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'members'
  
  // Expanded cards for seeing full members list
  const [expandedCardIds, setExpandedCardIds] = useState(new Set());

  // Modal states
  const [familyToPermanentlyDelete, setFamilyToPermanentlyDelete] = useState(null);
  const [isConfirmingEmptyTrash, setIsConfirmingEmptyTrash] = useState(false);
  const [isConfirmingRestoreAll, setIsConfirmingRestoreAll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Toggle card expansion
  const toggleCardExpansion = (id) => {
    setExpandedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Dynamic statistics
  const totalDeletedCount = deletedFamilies.length;
  const totalAffectedMembers = useMemo(() => {
    return deletedFamilies.reduce((sum, f) => sum + (f.members?.length || 0), 0);
  }, [deletedFamilies]);

  const uniqueVillagesCount = useMemo(() => {
    const vSet = new Set(deletedFamilies.map(f => f.village).filter(Boolean));
    return vSet.size;
  }, [deletedFamilies]);

  // Filtered & sorted records
  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return deletedFamilies
      .filter((family) => {
        // Search filter
        const headEn = (family.familyHeadNameEnglish || '').toLowerCase();
        const headHi = (family.familyHeadNameHindi || '').toLowerCase();
        const fatherEn = (family.fatherHusbandNameEnglish || '').toLowerCase();
        const fatherHi = (family.fatherHusbandNameHindi || '').toLowerCase();
        const mobile = (family.mobile || '').toLowerCase();
        const mohalla = (family.mohalla || '').toLowerCase();
        const caste = (family.caste || '').toLowerCase();
        const village = (family.village || '').toLowerCase();
        const ration = (family.rationCardNumber || '').toLowerCase();
        const aadhaar = (family.aadhaarNumber || '').toLowerCase();

        const matchesSearch = 
          !q ||
          headEn.includes(q) ||
          headHi.includes(q) ||
          fatherEn.includes(q) ||
          fatherHi.includes(q) ||
          mobile.includes(q) ||
          mohalla.includes(q) ||
          caste.includes(q) ||
          village.includes(q) ||
          ration.includes(q) ||
          aadhaar.includes(q);

        // Village filter
        const matchesVillage = 
          selectedVillageFilter === 'all' || 
          (isFamilyInVillage 
            ? isFamilyInVillage(family, selectedVillageFilter) 
            : family.village === selectedVillageFilter);

        return matchesSearch && matchesVillage;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.deletedAt || 0).getTime() - new Date(b.deletedAt || 0).getTime();
        }
        if (sortBy === 'members') {
          return (b.members?.length || 0) - (a.members?.length || 0);
        }
        return 0;
      });
  }, [deletedFamilies, searchQuery, selectedVillageFilter, sortBy, isFamilyInVillage]);

  // Single restore handler
  const handleRestore = async (family) => {
    try {
      await restoreFamily(family.id);
      addToast(
        language === 'hi' 
          ? `परिवार "${family.familyHeadNameHindi || family.familyHeadNameEnglish}" सफलतापूर्वक पुनर्स्थापित किया गया!` 
          : `Family "${family.familyHeadNameEnglish || family.familyHeadNameHindi}" restored successfully!`,
        'success'
      );
    } catch (err) {
      console.error('Error restoring family:', err);
      addToast(language === 'hi' ? 'रिकॉर्ड पुनर्स्थापित करने में त्रुटि।' : 'Failed to restore record.', 'error');
    }
  };

  // Single permanent delete confirm
  const handleConfirmPermanentDelete = async () => {
    if (!familyToPermanentlyDelete) return;
    try {
      setIsProcessing(true);
      await permanentlyDeleteFamily(familyToPermanentlyDelete.id);
      addToast(
        language === 'hi' 
          ? 'रिकॉर्ड डेटाबेस से हमेशा के लिए हटा दिया गया।' 
          : 'Record permanently deleted from cloud database.',
        'success'
      );
      setFamilyToPermanentlyDelete(null);
    } catch (err) {
      console.error('Error permanently deleting:', err);
      addToast(language === 'hi' ? 'हटाने में त्रुटि हुई।' : 'Failed to delete record.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Restore All handler
  const handleRestoreAll = async () => {
    try {
      setIsProcessing(true);
      if (restoreAllFamilies) {
        await restoreAllFamilies();
      } else {
        for (const fam of deletedFamilies) {
          await restoreFamily(fam.id);
        }
      }
      addToast(
        language === 'hi' 
          ? 'सभी हटाए गए रिकॉर्ड्स सफलतापूर्वक पुनर्स्थापित किए गए!' 
          : 'All deleted records restored successfully!',
        'success'
      );
      setIsConfirmingRestoreAll(false);
    } catch (err) {
      console.error('Error restoring all:', err);
      addToast(language === 'hi' ? 'सभी को पुनर्स्थापित करने में विफलता।' : 'Failed to restore all records.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Empty Trash handler
  const handleEmptyTrash = async () => {
    try {
      setIsProcessing(true);
      if (permanentlyDeleteAllFamilies) {
        await permanentlyDeleteAllFamilies();
      } else {
        for (const fam of deletedFamilies) {
          await permanentlyDeleteFamily(fam.id);
        }
      }
      addToast(
        language === 'hi' 
          ? 'रीसायकल बिन सफलतापूर्वक खाली कर दी गई।' 
          : 'Recycle bin emptied successfully.',
        'success'
      );
      setIsConfirmingEmptyTrash(false);
    } catch (err) {
      console.error('Error emptying trash:', err);
      addToast(language === 'hi' ? 'कचरा खाली करने में त्रुटि।' : 'Failed to empty recycle bin.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date cleanly
  const formatDeletionDate = (dateString) => {
    if (!dateString) return language === 'hi' ? 'हाल ही में' : 'Recently';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Top Header Card */}
      <div className={`p-5 sm:p-7 rounded-3xl border relative overflow-hidden transition-all shadow-3d-card ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-rose-950/20 to-gray-900 border-rose-900/30' 
          : 'bg-gradient-to-br from-rose-50/80 via-white to-amber-50/50 border-rose-100 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'सुरक्षित रीसायकल बिन' : 'Protected Archive'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-600 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{totalDeletedCount} {language === 'hi' ? 'रिकॉर्ड्स' : 'Records'}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {language === 'hi' ? 'हटाए गए परिवार रिकॉर्ड्स' : 'Deleted Survey Records Archive'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
              {language === 'hi' 
                ? 'आकस्मिक विलोपन से सुरक्षित ऑडिट ट्रेल: हटाए गए परिवारों का विवरण देखें, एक क्लिक में पुनर्स्थापित करें या स्थायी रूप से मिटाएं।' 
                : 'Accidental deletion safety net: inspect archived family dossiers, restore with one tap, or permanently purge.'}
            </p>
          </div>

          {/* Top Quick Batch Actions */}
          {!isReadOnly && totalDeletedCount > 0 && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => setIsConfirmingRestoreAll(true)}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{language === 'hi' ? 'सभी वापस लाएं' : 'Restore All'}</span>
              </button>

              <button
                onClick={() => setIsConfirmingEmptyTrash(true)}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 hover:bg-red-100 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>{language === 'hi' ? 'बिन खाली करें' : 'Empty Bin'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Ribbon with 3D TiltCards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        <TiltCard
          maxTilt={5}
          scale={1.02}
          className={`p-4 sm:p-5 rounded-2xl border shadow-3d-card transition-all ${
            darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {language === 'hi' ? 'हटाए गए परिवार' : 'Deleted Families'}
            </span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 mt-2">
            <AnimatedCounter value={totalDeletedCount} />
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {language === 'hi' ? 'क्लाउड आर्काइव में संरक्षित' : 'Safely held in cloud bin'}
          </p>
        </TiltCard>

        <TiltCard
          maxTilt={5}
          scale={1.02}
          className={`p-4 sm:p-5 rounded-2xl border shadow-3d-card transition-all ${
            darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {language === 'hi' ? 'प्रभावित सदस्य' : 'Affected Members'}
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
            <AnimatedCounter value={totalAffectedMembers} />
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {language === 'hi' ? 'सदस्यों का पूर्ण डेटा उपलब्ध' : 'Member profiles preserved'}
          </p>
        </TiltCard>

        <TiltCard
          maxTilt={5}
          scale={1.02}
          className={`p-4 sm:p-5 rounded-2xl border shadow-3d-card transition-all col-span-2 lg:col-span-1 ${
            darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {language === 'hi' ? 'प्रभावित गाँव' : 'Impacted Villages'}
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">
            <AnimatedCounter value={uniqueVillagesCount} />
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {language === 'hi' ? 'समोड़ी, कोटड़ी इत्यादि' : 'Samodi, Kotdi, etc.'}
          </p>
        </TiltCard>
      </div>

      {/* Search and Filters Bar (Ergonomic for Mobile) */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-3 transition-all ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-2xs'
      }`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'hi' ? 'नाम, मोबाइल, आधार, मोहल्ला या जाति से खोजें...' : 'Search by name, mobile, mohalla, caste...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-9 py-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-all ${
                darkMode ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              } focus:border-red-500/50`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Village Filter & Sort by Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={selectedVillageFilter}
              onChange={(e) => setSelectedVillageFilter(e.target.value)}
              className={`flex-1 sm:flex-none text-xs px-3 py-2.5 rounded-xl border outline-none font-semibold transition-all ${
                darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="all">{language === 'hi' ? 'सभी गाँव' : 'All Villages'}</option>
              {villages.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`flex-1 sm:flex-none text-xs px-3 py-2.5 rounded-xl border outline-none font-semibold transition-all ${
                darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="newest">{language === 'hi' ? 'हाल ही में हटाया (Newest)' : 'Newest Deleted'}</option>
              <option value="oldest">{language === 'hi' ? 'पहले का हटाया (Oldest)' : 'Oldest Deleted'}</option>
              <option value="members">{language === 'hi' ? 'अधिक सदस्य (Members)' : 'Most Members'}</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(searchQuery || selectedVillageFilter !== 'all') && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-800 text-gray-500">
            <span>
              {language === 'hi' ? 'फ़िल्टर परिणाम:' : 'Filtered Results:'} <strong className="text-gray-900 dark:text-white font-bold">{filteredRecords.length}</strong> {language === 'hi' ? 'रिकॉर्ड्स मिले' : 'found'}
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedVillageFilter('all');
              }}
              className="text-red-500 hover:text-red-600 font-bold hover:underline"
            >
              {language === 'hi' ? 'फ़िल्टर साफ़ करें' : 'Reset Filters'}
            </button>
          </div>
        )}
      </div>

      {/* Main Records Display */}
      {deletedFamilies.length === 0 ? (
        <EmptyState3D
          title={language === 'hi' ? 'रीसायकल बिन बिल्कुल खाली है' : 'Recycle Bin is Clean'}
          description={language === 'hi' 
            ? 'कोई हटाया गया परिवार रिकॉर्ड नहीं है। सभी रिकॉर्ड सक्रिय सर्वेक्षण डेटाबेस में सुरक्षित हैं।' 
            : 'No deleted records found. All family dossiers are safely preserved in the active survey database.'}
          actionLabel={language === 'hi' ? 'सक्रिय परिवार रिकॉर्ड्स देखें' : 'View Active Families'}
          onAction={() => navigate('/families')}
        />
      ) : filteredRecords.length === 0 ? (
        <div className={`p-10 rounded-3xl border text-center ${
          darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {language === 'hi' ? 'कोई मेल खाता रिकॉर्ड नहीं मिला' : 'No Matching Deleted Records'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            {language === 'hi' 
              ? `"${searchQuery}" के लिए कोई हटाया गया रिकॉर्ड उपलब्ध नहीं है।` 
              : `No deleted family records matched "${searchQuery}".`}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedVillageFilter('all');
            }}
            className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold hover:underline"
          >
            {language === 'hi' ? 'सभी रिकॉर्ड्स देखें' : 'Clear Filters & Show All'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((family) => {
            const isExpanded = expandedCardIds.has(family.id);
            const headNameEn = family.familyHeadNameEnglish;
            const headNameHi = family.familyHeadNameHindi;
            const fatherName = family.fatherHusbandNameHindi || family.fatherHusbandNameEnglish;
            const memberCount = family.members?.length || 0;

            const categoryBadgeColor = 
              family.category === 'BPL'
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                : family.category === 'Antyodaya'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';

            return (
              <div
                key={family.id}
                className={`p-4 sm:p-6 rounded-3xl border transition-all shadow-3d-card relative overflow-hidden group ${
                  darkMode 
                    ? 'bg-gray-900/90 border-gray-800 hover:border-gray-700' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Subtle soft red left accent indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-500 via-rose-500 to-amber-500" />

                <div className="space-y-4">
                  {/* Card Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Family Head Avatar */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 via-rose-600 to-amber-600 flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
                        {headNameEn?.charAt(0)?.toUpperCase() || headNameHi?.charAt(0) || 'F'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white leading-tight">
                            {language === 'hi' ? (headNameHi || headNameEn) : (headNameEn || headNameHi || 'Unnamed Head')}
                          </h2>
                          {(headNameEn && headNameHi) && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
                              {language === 'hi' ? headNameEn : headNameHi}
                            </span>
                          )}
                        </div>

                        {fatherName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {language === 'hi' ? 'पिता/पति:' : 'Father/Husband:'} <span className="font-semibold text-gray-700 dark:text-gray-300">{fatherName}</span>
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1 flex-wrap font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-red-400" />
                            <span>{language === 'hi' ? 'हटाया गया:' : 'Deleted:'} {formatDeletionDate(family.deletedAt)}</span>
                          </span>
                          {family.deletedByName && (
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <span>• {language === 'hi' ? 'द्वारा:' : 'By:'}</span>
                              <strong className="text-gray-700 dark:text-gray-300">{family.deletedByName}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Category & Status Badges */}
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${categoryBadgeColor}`}>
                        {family.category || 'General'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                        <Trash2 className="w-3 h-3" />
                        <span>{language === 'hi' ? 'आर्काइव' : 'Archived'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Metadata Chips Wrap (Mobile-Friendly Pill Badges) */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {family.village && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-teal-500" />
                        <span>{family.village}</span>
                      </span>
                    )}

                    {family.mohalla && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{family.mohalla}</span>
                      </span>
                    )}

                    {family.caste && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold">
                        <Users className="w-3.5 h-3.5 text-purple-500" />
                        <span>{family.caste}</span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">
                      <span>{memberCount} {language === 'hi' ? 'सदस्य' : 'Members'}</span>
                    </span>

                    {family.mobile && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{family.mobile}</span>
                      </span>
                    )}
                  </div>

                  {/* Expand / Collapse Details Drawer Toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleCardExpansion(family.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline py-1"
                    >
                      <span>
                        {isExpanded 
                          ? (language === 'hi' ? 'सदस्यों का विवरण छिपाएं' : 'Hide Member Details') 
                          : (language === 'hi' ? `सभी ${memberCount} सदस्यों का विवरण देखें` : `View all ${memberCount} members & dossier`)}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Collapsible Members and Dossier Details */}
                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 space-y-3 animate-fadeIn text-xs">
                        {/* Member Table/List */}
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-indigo-500" />
                            <span>{language === 'hi' ? 'परिवार के सदस्य:' : 'Family Members:'}</span>
                          </p>

                          {family.members && family.members.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {family.members.map((m, mIdx) => (
                                <div 
                                  key={mIdx} 
                                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                                    darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200 shadow-2xs'
                                  }`}
                                >
                                  <div>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                      {language === 'hi' ? (m.nameHindi || m.nameEnglish || m.name) : (m.nameEnglish || m.nameHindi || m.name)}
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                      {m.relation || 'Member'} • {m.gender || '-'} • {m.age ? `${m.age} yr` : '-'}
                                    </p>
                                  </div>
                                  {m.education && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                                      {m.education}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 italic">
                              {language === 'hi' ? 'कोई सदस्य प्रविष्टि नहीं' : 'No member entries'}
                            </p>
                          )}
                        </div>

                        {/* Government IDs row */}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700/60 flex flex-wrap gap-3 text-[11px] text-gray-500">
                          {family.rationCardNumber && (
                            <span>{language === 'hi' ? 'राशन कार्ड:' : 'Ration Card:'} <strong className="text-gray-800 dark:text-gray-200 font-mono">{family.rationCardNumber}</strong></span>
                          )}
                          {family.aadhaarNumber && (
                            <span>{language === 'hi' ? 'आधार:' : 'Aadhaar:'} <strong className="text-gray-800 dark:text-gray-200 font-mono">•••• {family.aadhaarNumber.slice(-4)}</strong></span>
                          )}
                          {family.houseNumber && (
                            <span>{language === 'hi' ? 'मकान क्र.:' : 'House No:'} <strong className="text-gray-800 dark:text-gray-200">{family.houseNumber}</strong></span>
                          )}
                          {family.monthlyIncome && (
                            <span>{language === 'hi' ? 'मासिक आय:' : 'Monthly Income:'} <strong className="text-gray-800 dark:text-gray-200">₹{family.monthlyIncome}</strong></span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile & Desktop Action Buttons (Large, Touch-Friendly, Buttery Smooth) */}
                  {!isReadOnly && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800/80">
                      <button
                        type="button"
                        onClick={() => handleRestore(family)}
                        className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/15 transition-all duration-200 active:scale-95"
                      >
                        <RotateCcw className="w-4 h-4 shrink-0" />
                        <span>{language === 'hi' ? 'रिकॉर्ड वापस लाएं' : 'Restore Record'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFamilyToPermanentlyDelete(family)}
                        className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        <span>{language === 'hi' ? 'स्थायी रूप से हटाएं' : 'Permanently Delete'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Confirm Permanent Delete (Single Family) */}
      {familyToPermanentlyDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 space-y-4 transition-all ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{language === 'hi' ? 'स्थायी रूप से विलोपन की पुष्टि' : 'Permanently Delete Record'}</span>
              </h2>
              <button 
                onClick={() => setFamilyToPermanentlyDelete(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {language === 'hi' ? 'यह कार्रवाई पूर्ववत नहीं की जा सकती!' : 'This action is irreversible!'}
                  </p>
                  <p className="mt-1 text-red-600 dark:text-red-300 leading-relaxed">
                    {language === 'hi' 
                      ? 'परिवार का संपूर्ण रिकॉर्ड, सभी सदस्यों की जानकारी और सरकारी डेटा क्लाउड डेटाबेस से स्थायी रूप से नष्ट हो जाएगा।' 
                      : 'The entire family survey dossier, member profiles, and associated records will be permanently erased from cloud servers.'}
                  </p>
                </div>
              </div>

              {/* Family details summary preview */}
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <p className="font-extrabold text-sm text-gray-900 dark:text-white">
                  {familyToPermanentlyDelete.familyHeadNameHindi || familyToPermanentlyDelete.familyHeadNameEnglish || 'Unknown'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {language === 'hi' ? 'गाँव:' : 'Village:'} {familyToPermanentlyDelete.village || '-'} • {language === 'hi' ? 'मोहल्ला:' : 'Mohalla:'} {familyToPermanentlyDelete.mohalla || '-'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {language === 'hi' ? 'कुल सदस्य:' : 'Total Members:'} {familyToPermanentlyDelete.members?.length || 0}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setFamilyToPermanentlyDelete(null)}
                className="px-4 py-2.5 rounded-xl border text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmPermanentDelete}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isProcessing 
                    ? (language === 'hi' ? 'हटा रहे हैं...' : 'Deleting...') 
                    : (language === 'hi' ? 'हाँ, हमेशा के लिए हटाएं' : 'Yes, Delete Permanently')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Empty Trash (All Families) */}
      {isConfirmingEmptyTrash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 space-y-4 transition-all ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5 shrink-0" />
                <span>{language === 'hi' ? 'रीसायकल बिन खाली करें' : 'Empty Entire Recycle Bin'}</span>
              </h2>
              <button 
                onClick={() => setIsConfirmingEmptyTrash(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {language === 'hi'
                ? `क्या आप वाकई सभी ${totalDeletedCount} हटाए गए परिवारों को डेटाबेस से स्थायी रूप से हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं होगी।`
                : `Are you sure you want to permanently delete all ${totalDeletedCount} archived family records? This action cannot be reversed.`}
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsConfirmingEmptyTrash(false)}
                className="px-4 py-2.5 rounded-xl border text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleEmptyTrash}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isProcessing 
                    ? (language === 'hi' ? 'खाली कर रहे हैं...' : 'Purging...') 
                    : (language === 'hi' ? 'हाँ, बिन खाली करें' : 'Yes, Empty All')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirm Restore All */}
      {isConfirmingRestoreAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 space-y-4 transition-all ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <RotateCcw className="w-5 h-5 shrink-0" />
                <span>{language === 'hi' ? 'सभी रिकॉर्ड पुनर्स्थापित करें' : 'Restore All Records'}</span>
              </h2>
              <button 
                onClick={() => setIsConfirmingRestoreAll(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {language === 'hi'
                ? `क्या आप सभी ${totalDeletedCount} परिवारों को सक्रिय सर्वेक्षण सूची में वापस पुनर्स्थापित करना चाहते हैं?`
                : `Are you sure you want to restore all ${totalDeletedCount} families back into the active survey database?`}
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsConfirmingRestoreAll(false)}
                className="px-4 py-2.5 rounded-xl border text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRestoreAll}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  {isProcessing 
                    ? (language === 'hi' ? 'पुनर्स्थापित कर रहे हैं...' : 'Restoring...') 
                    : (language === 'hi' ? 'हाँ, सभी वापस लाएं' : 'Yes, Restore All')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
