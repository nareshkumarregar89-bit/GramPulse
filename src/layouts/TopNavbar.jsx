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
  LogOut
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

export function TopNavbar({ setIsMobileSidebarOpen }) {
  const { darkMode, setDarkMode, language, setLanguage, families, t } = useData();
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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

  return (
    <header className={`
      sticky top-0 z-30 h-16 px-4 md:px-6 flex items-center justify-between border-b
      ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
    `}>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex md:hidden items-center gap-2">
          <img src="/logo.png" alt="GramPulse" className="w-8 h-8 object-contain rounded-lg shadow-sm" />
          <span className="font-bold text-base text-gray-900 dark:text-white">GramPulse</span>
        </div>
        <form onSubmit={handleSearch} className="hidden md:flex relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search families, members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`
              w-full pl-10 pr-4 py-2 rounded-xl border outline-none
              ${darkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-green-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-green-500'
              }
            `}
          />
        </form>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          className={`
            p-2 rounded-xl transition-all
            ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}
          `}
        >
          <Bell className="w-5 h-5" />
        </button>

        <button
          onClick={toggleLanguage}
          className={`
            px-3 py-2 rounded-xl transition-all font-semibold
            ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}
          `}
        >
          {language === 'en' ? 'EN' : 'HI'}
        </button>

        <button
          onClick={toggleDarkMode}
          className={`
            p-2 rounded-xl transition-all
            ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}
          `}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {currentUser && (
          <div className="flex items-center gap-2">
            <div className={`
              flex items-center gap-2.5 px-3 py-1.5 rounded-xl border
              ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50 border-gray-200'}
            `}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                {userProfile?.name?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">
                  {userProfile?.name || currentUser?.email?.split('@')[0]}
                </p>
                <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  isAdmin 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                }`}>
                  {isAdmin ? (language === 'hi' ? 'एडमिन' : 'Admin') : (language === 'hi' ? 'सर्वेयर' : 'Surveyor')}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title={language === 'hi' ? 'लॉगआउट' : 'Logout'}
              className={`p-2 rounded-xl transition-all ${
                darkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
