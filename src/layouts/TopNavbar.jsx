import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Bell,
  Moon,
  Sun,
  Search,
  User
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

export function TopNavbar({ setIsMobileSidebarOpen }) {
  const { darkMode, setDarkMode, language, setLanguage, families, t } = useData();
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

        <div className={`
          hidden md:flex items-center gap-3 px-3 py-2 rounded-xl
          ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}
        `}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
            AD
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Surveyor</p>
          </div>
        </div>
      </div>
    </header>
  );
}
