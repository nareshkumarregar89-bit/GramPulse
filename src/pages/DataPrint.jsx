import { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  RotateCw,
  Search,
  Building2,
  Users,
  CheckCircle2,
  X,
  FileText,
  Filter,
  Check,
  LayoutTemplate,
  ChevronDown
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  resolveVillageId,
  getVillageDisplayName,
  isFamilyInVillageRecord,
  getUniqueAssignedVillageNames
} from '../utils/villageUtils';

export function DataPrint() {
  const {
    families: contextFamilies = [],
    allFamilies = [],
    activeVillageRecords = [],
    activeVillages = [],
    selectedVillage: globalSelectedVillage,
    mohallas = [],
    castes = [],
    darkMode,
    language = 'en',
    t
  } = useData();

  const {
    currentUser,
    userProfile,
    isAdmin,
    assignedVillages = [],
    assignedVillageIds = []
  } = useAuth();

  const { addToast } = useToast();

  // State
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMohalla, setSelectedMohalla] = useState('all');
  const [selectedCaste, setSelectedCaste] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'verified'
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Derive authorized villages for current user
  const authorizedVillageOptions = useMemo(() => {
    if (isAdmin) {
      const list = activeVillageRecords.map(v => ({
        id: v.id,
        name: v.name || `${v.nameHindi} (${v.nameEnglish})`,
        nameHindi: v.nameHindi || v.name,
        nameEnglish: v.nameEnglish || v.name
      }));
      return list;
    }

    // Surveyor: Strictly restricted to assigned villages
    const vIds = (assignedVillageIds && assignedVillageIds.length > 0)
      ? assignedVillageIds
      : (userProfile?.assignedVillageIds || []);

    const userVillagesList = userProfile?.assignedVillages || assignedVillages || [];

    const matched = activeVillageRecords.filter(v => {
      const vId = (v.id || '').toLowerCase();
      if (vIds.some(id => String(id).toLowerCase() === vId)) return true;
      const vName = (v.name || '').toLowerCase();
      return userVillagesList.some(uv => {
        if (!uv) return false;
        const clean = String(uv).toLowerCase();
        return clean.includes(vId) || vName.includes(clean);
      });
    });

    if (matched.length > 0) {
      return matched.map(v => ({
        id: v.id,
        name: v.name || `${v.nameHindi} (${v.nameEnglish})`,
        nameHindi: v.nameHindi || v.name,
        nameEnglish: v.nameEnglish || v.name
      }));
    }

    // Fallback: create options from userVillagesList directly
    return userVillagesList.map((uv, idx) => ({
      id: resolveVillageId(uv, activeVillageRecords) || `assigned-${idx}`,
      name: uv,
      nameHindi: uv,
      nameEnglish: uv
    }));
  }, [isAdmin, activeVillageRecords, assignedVillageIds, userProfile, assignedVillages]);

  // Set initial selected village
  useEffect(() => {
    if (isAdmin) {
      if (globalSelectedVillage && globalSelectedVillage !== 'all') {
        setSelectedVillage(globalSelectedVillage);
      } else {
        setSelectedVillage('all');
      }
    } else {
      // Surveyor: If assigned exactly 1 village, lock to that village
      if (authorizedVillageOptions.length === 1) {
        setSelectedVillage(authorizedVillageOptions[0].name);
      } else if (authorizedVillageOptions.length > 1) {
        setSelectedVillage('all'); // all assigned villages
      } else {
        setSelectedVillage('none');
      }
    }
  }, [isAdmin, globalSelectedVillage, authorizedVillageOptions]);

  // Base pool of families according to strict role authorization
  const authorizedFamilies = useMemo(() => {
    const sourcePool = allFamilies.length > 0 ? allFamilies : contextFamilies;

    if (isAdmin) {
      return sourcePool;
    }

    // Surveyor: Can access all records belonging to their assigned villages (including records entered by others)
    if (!authorizedVillageOptions || authorizedVillageOptions.length === 0) {
      return [];
    }

    const assignedIds = authorizedVillageOptions.map(v => (v.id || '').toLowerCase());
    const assignedNames = authorizedVillageOptions.map(v => (v.name || '').toLowerCase());

    return sourcePool.filter(f => {
      const fVid = resolveVillageId(f.villageId || f.village, activeVillageRecords);
      if (fVid && assignedIds.includes(fVid.toLowerCase())) return true;
      const fVName = (f.village || '').toLowerCase();
      return assignedNames.some(an => an && (fVName.includes(an) || an.includes(fVName)));
    });
  }, [isAdmin, allFamilies, contextFamilies, authorizedVillageOptions, activeVillageRecords]);

  // Filtered families based on active controls
  const displayedFamilies = useMemo(() => {
    let result = authorizedFamilies;

    // 1. Village Filter
    if (selectedVillage && selectedVillage !== 'all') {
      result = result.filter(f => isFamilyInVillageRecord(f, selectedVillage, activeVillageRecords));
    }

    // 2. Search Query (Family ID, Head Name, Member Names, Mobile, Mohalla, Caste)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(f => {
        const idMatch = f.id && f.id.toLowerCase().includes(q);
        const headMatch =
          (f.familyHeadName && f.familyHeadName.toLowerCase().includes(q)) ||
          (f.familyHeadNameEnglish && f.familyHeadNameEnglish.toLowerCase().includes(q)) ||
          (f.familyHeadNameHindi && f.familyHeadNameHindi.toLowerCase().includes(q));
        const mobileMatch = f.mobile && f.mobile.includes(q);
        const mohallaMatch = f.mohalla && f.mohalla.toLowerCase().includes(q);
        const casteMatch = f.caste && f.caste.toLowerCase().includes(q);
        const villageMatch = f.village && f.village.toLowerCase().includes(q);
        const memberMatch = Array.isArray(f.members) && f.members.some(m => {
          const mName = (m.name || m.nameEnglish || m.nameHindi || '').toLowerCase();
          return mName.includes(q);
        });

        return idMatch || headMatch || mobileMatch || mohallaMatch || casteMatch || villageMatch || memberMatch;
      });
    }

    // 3. Mohalla Filter
    if (selectedMohalla && selectedMohalla !== 'all') {
      result = result.filter(f => f.mohalla && f.mohalla.trim().toLowerCase() === selectedMohalla.trim().toLowerCase());
    }

    // 4. Caste Filter
    if (selectedCaste && selectedCaste !== 'all') {
      result = result.filter(f => f.caste && f.caste.trim().toLowerCase() === selectedCaste.trim().toLowerCase());
    }

    // 5. Verification Status Filter
    if (statusFilter === 'verified') {
      result = result.filter(f => f.status === 'verified' || f.isVerified === true || !f.needsVillageReview);
    }

    return result;
  }, [authorizedFamilies, selectedVillage, searchQuery, selectedMohalla, selectedCaste, statusFilter, activeVillageRecords]);

  // Aggregate statistics
  const totalFamiliesCount = displayedFamilies.length;
  const totalCitizensCount = useMemo(() => {
    return displayedFamilies.reduce((sum, f) => {
      const mCount = Array.isArray(f.members) && f.members.length > 0 ? f.members.length : (f.totalMembers || 1);
      return sum + mCount;
    }, 0);
  }, [displayedFamilies]);

  // Logged-in surveyor / admin name
  const generatedByName = useMemo(() => {
    return userProfile?.name || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Naresh Kumar Regar');
  }, [userProfile, currentUser]);

  // Active village display name
  const villageDisplayName = useMemo(() => {
    if (selectedVillage === 'all' || !selectedVillage) {
      return isAdmin ? 'All Villages' : (authorizedVillageOptions.length === 1 ? authorizedVillageOptions[0].name : 'All Assigned Villages');
    }
    return getVillageDisplayName(selectedVillage, activeVillageRecords, language) || selectedVillage;
  }, [selectedVillage, isAdmin, authorizedVillageOptions, activeVillageRecords, language]);

  // Timestamp
  const reportDateTime = useMemo(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr}, ${timeStr}`;
  }, []);

  // Safe Refresh handler
  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setIsLoading(true);

    setTimeout(() => {
      setIsRefreshing(false);
      setIsLoading(false);
      if (addToast) {
        addToast(
          language === 'hi' ? 'डेटा सफलतापूर्वक रीफ्रेश किया गया' : 'Report data refreshed successfully',
          'success'
        );
      }
    }, 400);
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedMohalla('all');
    setSelectedCaste('all');
    setStatusFilter('all');
    if (isAdmin) {
      setSelectedVillage('all');
    } else if (authorizedVillageOptions.length > 1) {
      setSelectedVillage('all');
    }
  };

  const hasActiveFilters = searchQuery || selectedMohalla !== 'all' || selectedCaste !== 'all' || statusFilter !== 'all' || (isAdmin && selectedVillage !== 'all');

  return (
    <>
      {/* Dynamic Print CSS for chosen Orientation & Standard A4 Dimensions */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 ${orientation};
          margin: 10mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, aside, nav, .topbar, .sidebar, .bottom-nav, button, input, select {
            display: none !important;
          }
          .md\\:ml-64 {
            margin-left: 0 !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .print-report-container {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          .print-table thead {
            display: table-header-group !important;
          }
          .print-table tfoot {
            display: table-footer-group !important;
          }
          .print-table tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-table th, .print-table td {
            vertical-align: top !important;
            overflow-wrap: anywhere !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}} />

      <div className="space-y-6">
        {/* ================= SCREEN CONTROLS & TOOLBAR (HIDDEN IN PRINT) ================= */}
        <div className="no-print space-y-4">
          {/* Page Heading & Actions Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {language === 'hi' ? 'विलेजपल्स — डेटा प्रिंट' : 'VillagePulse — Data Print'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    {language === 'hi'
                      ? 'आधिकारिक परिवार सर्वेक्षण रिपोर्ट देखें, फ़िल्टर करें और A4 मानक में प्रिंट करें।'
                      : 'View, filter, preview, and print official family survey reports with A4 print formatting.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons: Refresh, Orientation & Print */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Orientation Selector */}
              <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
                    orientation === 'portrait'
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="A4 Portrait Print (Vertical)"
                >
                  <LayoutTemplate className="w-3.5 h-3.5 rotate-90" />
                  <span>A4 Portrait</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
                    orientation === 'landscape'
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="A4 Landscape Print (Horizontal)"
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>A4 Landscape</span>
                </button>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 min-h-[44px] min-w-[44px] rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-95 transition-all shadow-xs"
                title="Refresh report data"
                aria-label="Refresh report data"
              >
                <RotateCw className={`w-4 h-4 text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{language === 'hi' ? 'रीफ्रेश' : 'Refresh'}</span>
              </button>

              {/* Prominent Print Report Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 min-h-[44px] rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-900 active:scale-98 shadow-md shadow-blue-600/25 transition-all"
                title="Open browser print dialog"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'hi' ? 'प्रिंट रिपोर्ट (A4)' : 'Print Report (A4)'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Filters Panel */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* 1. Village Filter */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'hi' ? 'गाँव' : 'Village'}</span>
                </label>
                <select
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                  disabled={!isAdmin && authorizedVillageOptions.length <= 1}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  {isAdmin && (
                    <option value="all">
                      {language === 'hi' ? 'सभी गाँव (All Villages)' : 'All Villages'}
                    </option>
                  )}
                  {!isAdmin && authorizedVillageOptions.length > 1 && (
                    <option value="all">
                      {language === 'hi' ? 'सभी अधिकृत गाँव' : 'All Authorized Villages'}
                    </option>
                  )}
                  {authorizedVillageOptions.map((v) => (
                    <option key={v.id || v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Text Search Input */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'hi' ? 'खोजें (ID / मुखिया / सदस्य / मोबाइल)' : 'Search (ID / Head / Member / Mobile)'}</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'hi' ? 'परिवार ID, मुखिया, सदस्य का नाम या मोबाइल दर्ज करें...' : 'Search by Family ID, Head, Member name or Mobile...'}
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Mohalla Filter */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {language === 'hi' ? 'मोहल्ला' : 'Mohalla'}
                </label>
                <select
                  value={selectedMohalla}
                  onChange={(e) => setSelectedMohalla(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{language === 'hi' ? 'सभी मोहल्ले' : 'All Mohallas'}</option>
                  {mohallas.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* 4. Caste Filter */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {language === 'hi' ? 'जाति' : 'Caste'}
                </label>
                <select
                  value={selectedCaste}
                  onChange={(e) => setSelectedCaste(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{language === 'hi' ? 'सभी जातियां' : 'All Castes'}</option>
                  {castes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Summary & Clear Action */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span className="font-semibold">
                  {language === 'hi' ? 'प्रदर्शित रिकॉर्ड:' : 'Showing:'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                  {totalFamiliesCount} {language === 'hi' ? 'परिवार' : 'Families'}
                </span>
                <span>•</span>
                <span className="font-bold text-slate-900 dark:text-white bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                  {totalCitizensCount} {language === 'hi' ? 'नागरिक' : 'Citizens'}
                </span>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'फ़िल्टर हटाएं' : 'Clear Filters'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= OFFICIAL REPORT PREVIEW & PRINT DOCUMENT ================= */}
        <div className="print-report-container bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <RotateCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {language === 'hi' ? 'सर्वेक्षण डेटा लोड हो रहा है...' : 'Loading VillagePulse family records...'}
              </p>
            </div>
          ) : displayedFamilies.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'कोई परिवार रिकॉर्ड नहीं मिला' : 'No Family Records Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {language === 'hi'
                  ? 'वर्तमान में चुने गए फ़िल्टर या खोज के अनुरूप कोई परिवार उपलब्ध नहीं है।'
                  : 'No families match the currently selected village, mohalla, caste, or search criteria.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-2 inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                >
                  <span>{language === 'hi' ? 'सभी फ़िल्टर साफ़ करें' : 'Clear All Filters'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* ---------------- 1. COMPACT REPORT HEADER ---------------- */}
              <div className="border-b-2 border-slate-900 pb-2.5">
                {/* Title & Brand */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo.png"
                      alt="VillagePulse"
                      className="w-10 h-10 object-contain rounded-sm shrink-0"
                    />
                    <div>
                      <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-950 leading-tight">
                        VILLAGEPULSE — FAMILY & VILLAGE SURVEY REPORT
                      </h1>
                      <p className="text-[11px] font-bold text-slate-700 tracking-wide">
                        Digital Family Survey Register & Citizen Demographic Record
                      </p>
                    </div>
                  </div>
                </div>

                {/* Combined Single Horizontal Info Panel (Desktop & Print: 1 single row) */}
                <div className="bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-900 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                  {/* 1. Date */}
                  <div className="px-1.5 py-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block leading-tight">Date:</span>
                    <span className="font-bold text-slate-900 text-[11px] truncate block">{reportDateTime}</span>
                  </div>

                  {/* 2. Village */}
                  <div className="px-1.5 py-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block leading-tight">Village:</span>
                    <span className="font-bold text-slate-900 text-[11px] truncate block" title={villageDisplayName}>
                      {villageDisplayName}
                    </span>
                  </div>

                  {/* 3. Total Families */}
                  <div className="px-1.5 py-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block leading-tight">Total Families:</span>
                    <span className="font-black text-slate-950 text-sm block leading-tight">{totalFamiliesCount}</span>
                  </div>

                  {/* 4. Total Citizens */}
                  <div className="px-1.5 py-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block leading-tight">Total Citizens:</span>
                    <span className="font-black text-indigo-950 text-sm block leading-tight">{totalCitizensCount}</span>
                  </div>

                  {/* 5. Generated By */}
                  <div className="px-1.5 py-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block leading-tight">Generated By:</span>
                    <span className="font-bold text-slate-900 text-[11px] truncate block" title={generatedByName}>
                      {generatedByName}
                    </span>
                  </div>

                  {/* 6. Status */}
                  <div className="px-1.5 py-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block leading-tight">Status:</span>
                    <span className="font-bold text-emerald-800 text-[11px] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span>Verified Records</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* ---------------- 2. PROFESSIONAL FAMILY TABLE ---------------- */}
              {/* Responsive scroll container on screen; completely natural on print */}
              <div className="overflow-x-auto">
                <table className="print-table w-full text-[11px] leading-tight border-collapse border border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-900">
                      <th className="border border-slate-700 px-1.5 py-1.5 text-center w-8">#</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-left w-20">Family ID</th>
                      <th className="border border-slate-700 px-2.5 py-1.5 text-left min-w-[210px]">
                        Family Head & Family Members
                      </th>
                      <th className="border border-slate-700 px-2 py-1.5 text-left min-w-[120px]">Father / Husband</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-left min-w-[110px]">Village</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-left min-w-[100px]">Mohalla</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-left min-w-[85px]">Caste</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-left min-w-[95px]">Mobile</th>
                      <th className="border border-slate-700 px-1.5 py-1.5 text-center w-14">Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedFamilies.map((fam, index) => {
                      // Family Head name
                      const headName =
                        fam.familyHeadName ||
                        fam.familyHeadNameEnglish ||
                        fam.familyHeadNameHindi ||
                        fam.members?.[0]?.name ||
                        '-';

                      // Father / Husband name
                      const fatherHusband =
                        fam.fatherName ||
                        fam.fatherNameEnglish ||
                        fam.fatherNameHindi ||
                        fam.father_husband ||
                        fam.members?.find(m => (m.relation || '').toLowerCase() === 'husband')?.name ||
                        '-';

                      // Total members count
                      const membersCount =
                        Array.isArray(fam.members) && fam.members.length > 0
                          ? fam.members.length
                          : (fam.totalMembers || 1);

                      // Extract other family members underneath the head (excluding the head)
                      let otherMembers = [];
                      if (Array.isArray(fam.members) && fam.members.length > 0) {
                        const headRelIndex = fam.members.findIndex(m => {
                          const r = (m.relation || '').toLowerCase().trim();
                          return r === 'head' || r === 'self' || r === 'मुखिया' || r === 'स्वयं';
                        });

                        if (headRelIndex !== -1) {
                          otherMembers = fam.members.filter((_, idx) => idx !== headRelIndex);
                        } else {
                          // Filter out if member name exactly matches head name or first item matches
                          otherMembers = fam.members.filter((m, idx) => {
                            if (idx === 0) return false;
                            if (m.name && m.name === fam.familyHeadName) return false;
                            return true;
                          });
                        }
                      }

                      return (
                        <tr
                          key={fam.id || index}
                          className={index % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                        >
                          {/* 1. # */}
                          <td className="border border-slate-700 px-1.5 py-1.5 text-center font-semibold text-slate-800">
                            {index + 1}
                          </td>

                          {/* 2. Family ID */}
                          <td className="border border-slate-700 px-2 py-1.5 font-mono font-bold text-slate-900 text-[10px]">
                            {fam.id}
                          </td>

                          {/* 3. Family Head & Family Members (Single Cell) */}
                          <td className="border border-slate-700 px-2.5 py-1.5 text-slate-900">
                            {/* Family Head in Bold */}
                            <div className="font-bold text-slate-950 text-[11px] leading-snug">
                              {headName}
                            </div>

                            {/* All Other Members Underneath, Each on a Separate Line */}
                            {otherMembers.length > 0 && (
                              <div className="mt-1 space-y-0.5 border-t border-slate-200 pt-0.5">
                                {otherMembers.map((m, mIdx) => {
                                  const mName = m.name || m.nameEnglish || m.nameHindi || 'Member';
                                  const mRelation = m.relation && m.relation.toLowerCase() !== 'member' ? `(${m.relation})` : '';
                                  return (
                                    <div
                                      key={m.id || mIdx}
                                      className="text-[10px] text-slate-700 leading-tight"
                                    >
                                      <span>{mName}</span>
                                      {mRelation && (
                                        <span className="text-[9px] text-slate-500 ml-1 font-normal">
                                          {mRelation}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          {/* 4. Father / Husband */}
                          <td className="border border-slate-700 px-2 py-1.5 text-slate-800">
                            {fatherHusband}
                          </td>

                          {/* 5. Village */}
                          <td className="border border-slate-700 px-2 py-1.5 text-slate-800">
                            {fam.village || villageDisplayName}
                          </td>

                          {/* 6. Mohalla */}
                          <td className="border border-slate-700 px-2 py-1.5 text-slate-800">
                            {fam.mohalla || '-'}
                          </td>

                          {/* 7. Caste */}
                          <td className="border border-slate-700 px-2 py-1.5 text-slate-800">
                            {fam.caste || '-'}
                          </td>

                          {/* 8. Mobile */}
                          <td className="border border-slate-700 px-2 py-1.5 font-mono text-[10px] text-slate-800">
                            {fam.mobile || '-'}
                          </td>

                          {/* 9. Members Count */}
                          <td className="border border-slate-700 px-1.5 py-1.5 text-center font-bold text-slate-950">
                            {membersCount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
