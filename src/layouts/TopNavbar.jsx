import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Bell,
  Moon,
  Sun,
  Search,
  User,
  LogOut,
  Building2,
  Shield,
  RefreshCw,
  CloudUpload,
  WifiOff
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { UserProfileModal } from '../components/UserProfileModal';
import { getUniqueAssignedVillageNames } from '../utils/villageUtils';

export function TopNavbar({ setIsMobileSidebarOpen }) {
  const { 
    darkMode, 
    setDarkMode, 
    language, 
    setLanguage, 
    families, 
    t, 
    villages, 
    activeVillageRecords = [],
    selectedVillage, 
    setSelectedVillage,
    isOnline,
    offlineQueueCount,
    syncOfflineSurveys
  } = useData();
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const assignedVillageDisplayList = getUniqueAssignedVillageNames(userProfile, activeVillageRecords, language);
  const assignedVillageDisplayText = assignedVillageDisplayList.join(', ');

  const handleRefresh = () => {
    if (isRefreshing) return;

    // Safety check: Warn user if refreshing while on a survey form to prevent accidental data loss
    if (window.location.pathname.startsWith('/survey')) {
      const confirmMsg = language === 'hi'
        ? 'क्या आप पेज रिफ्रेश करना चाहते हैं? यदि आपने कोई नया डेटा भरा है और सेव नहीं किया है, तो वह खो सकता है।'
        : 'Are you sure you want to refresh? Any unsaved survey inputs may be lost.';
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    setIsRefreshing(true);
    // Smooth transition with immediate feedback before reloading current route
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/search');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const userInitial = userProfile?.name?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || 'U';
  const displayName = userProfile?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'User');

  return (
    <>
      <header className={`
        sticky top-0 z-30 h-16 px-3.5 sm:px-4 md:px-6 flex items-center justify-between border-b transition-colors duration-200
        ${darkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'}
        backdrop-blur-md
      `}>
        {/* Left Section: Menu button + Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-2 -ml-1 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open sidebar navigation"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="flex md:hidden items-center gap-2">
            <img src="/logo.png" alt="VillagePulse" className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg shadow-xs" />
            <span className="font-bold text-base tracking-tight text-gray-900 dark:text-white">VillagePulse</span>
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'hi' ? 'परिवार, सदस्य खोजें...' : 'Search families, members...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2 rounded-xl border outline-none text-sm transition-all
                ${darkMode
                  ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-400 focus:border-green-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-green-500'
                }
              `}
            />
          </form>
        </div>

        {/* Right Section: Controls & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          {/* Village Display: Dropdown for Admin, Fixed Badge for Surveyor (Desktop/Tablet) */}
          {isAdmin ? (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border bg-gray-50/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700">
              <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="text-xs bg-transparent border-none outline-none font-medium cursor-pointer text-gray-800 dark:text-gray-200"
              >
                <option value="all" className={darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>
                  {language === 'hi' ? 'सभी गाँव' : 'All Villages'}
                </option>
                {villages.map(v => (
                  <option key={v} value={v} className={darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
              assignedVillageDisplayList.length > 0
                ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-800 dark:text-indigo-200'
                : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300'
            }`}>
              <Building2 className={`w-3.5 h-3.5 shrink-0 ${
                assignedVillageDisplayList.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-500 animate-pulse'
              }`} />
              <span className="text-xs font-semibold">
                {assignedVillageDisplayList.length > 0
                  ? `${language === 'hi' ? 'गाँव:' : 'Village:'} ${assignedVillageDisplayText}`
                  : (language === 'hi' ? 'गाँव: प्रतीक्षारत (Unassigned)' : 'Village: Awaiting Assignment')}
              </span>
            </div>
          )}

          {/* Refresh Button - Desktop (Icon + Text) & Mobile (Accessible 44x44 Icon Button) */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label={language === 'hi' ? 'पेज रिफ्रेश करें' : 'Refresh page'}
            title={language === 'hi' ? 'पेज रिफ्रेश करें' : 'Refresh page'}
            className={`
              group relative flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold
              border transition-all duration-200 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
              ${isRefreshing ? 'opacity-75 cursor-wait' : 'cursor-pointer'}
              ${darkMode 
                ? 'bg-gray-800/80 hover:bg-gray-700/90 border-gray-700 hover:border-blue-500/40 text-blue-300 hover:text-white shadow-2xs' 
                : 'bg-blue-50/70 hover:bg-blue-100/80 border-blue-200/80 hover:border-blue-300 text-blue-700 hover:text-blue-900 shadow-2xs'
              }
            `}
          >
            <RefreshCw 
              className={`w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform duration-500 ${
                isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'
              }`} 
            />
            <span className="hidden sm:inline tracking-tight font-medium">
              {language === 'hi' ? 'रिफ्रेश' : 'Refresh'}
            </span>
          </button>

          {/* OFFLINE / AUTO-SYNC STATUS BADGE */}
          <div className="flex items-center">
            {!isOnline ? (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold animate-pulse"
                title={language === 'hi' ? 'इंटरनेट बंद है। सर्वे सुरक्षित रूप से ऑफ़लाइन सेव होंगे।' : 'Offline: Surveys are safely saved locally'}
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'hi' ? 'ऑफ़लाइन' : 'Offline'}</span>
                {offlineQueueCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                    {offlineQueueCount}
                  </span>
                )}
              </div>
            ) : offlineQueueCount > 0 ? (
              <button
                type="button"
                onClick={async () => {
                  setIsSyncing(true);
                  await syncOfflineSurveys();
                  setIsSyncing(false);
                }}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all disabled:opacity-75"
                title={language === 'hi' ? 'ऑफ़लाइन सर्वे तुरंत सिंक करें' : 'Sync pending offline surveys now'}
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                <span>{language === 'hi' ? `${offlineQueueCount} सिंक करें` : `Sync (${offlineQueueCount})`}</span>
              </button>
            ) : (
              <div 
                className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-xl text-emerald-600 dark:text-emerald-400 text-[11px] font-medium"
                title="क्लाउड से जुड़ा हुआ है (Online)"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px]">ऑनलाइन</span>
              </div>
            )}
          </div>



          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            title={language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
            className={`
              px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border
              ${darkMode 
                ? 'bg-gray-800/80 border-gray-700 hover:bg-gray-700 text-gray-200' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
              }
            `}
          >
            {language === 'en' ? 'EN' : 'HI'}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`
              p-2 rounded-xl transition-all border
              ${darkMode 
                ? 'bg-gray-800/80 border-gray-700 hover:bg-gray-700 text-amber-400' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'
              }
            `}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Profile Trigger Button (Avatar Card) */}
          {currentUser && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className={`
                  flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-2xl border transition-all duration-200
                  ${darkMode 
                    ? 'bg-gray-800/80 hover:bg-gray-700/90 border-gray-700' 
                    : 'bg-gray-50/90 hover:bg-gray-100/90 border-gray-200 shadow-2xs'
                  }
                  active:scale-95
                `}
                title={language === 'hi' ? 'प्रोफ़ाइल विवरण देखें' : 'View Profile Details'}
              >
                {/* Avatar with status indicator */}
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 via-emerald-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                    {userInitial}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full" />
                </div>

                {/* Name & Role (Visible on desktop/tablet) */}
                <div className="hidden sm:block text-left pr-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[100px] md:max-w-[130px]">
                    {displayName}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wide px-1 rounded ${
                      isAdmin 
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {isAdmin ? 'Admin' : 'Surveyor'}
                    </span>
                  </div>
                </div>
              </button>

              {/* Direct Logout Button (Desktop only) */}
              <button
                onClick={logout}
                title={language === 'hi' ? 'लॉगआउट' : 'Logout'}
                className={`hidden md:flex p-2 rounded-xl transition-all border ${
                  darkMode 
                    ? 'border-gray-800 hover:bg-red-500/20 hover:border-red-500/40 text-red-400' 
                    : 'border-gray-200 hover:bg-red-50 hover:border-red-200 text-red-600'
                }`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* User Profile View Card / Modal */}
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </>
  );
}
