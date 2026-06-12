import { NavLink } from 'react-router-dom';
import {
  Home,
  FileText,
  Users,
  MapPin,
  UsersRound,
  BarChart3,
  Search,
  Settings,
  Menu,
  Trash2
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const navItems = [
  { path: '/', icon: Home, labelKey: 'dashboard' },
  { path: '/survey', icon: FileText, labelKey: 'new_survey' },
  { path: '/families', icon: Users, labelKey: 'families' },
  { path: '/deleted-records', icon: Trash2, labelKey: 'deleted_records' },
  { path: '/mohallas', icon: MapPin, labelKey: 'mohallas' },
  { path: '/castes', icon: UsersRound, labelKey: 'castes' },
  { path: '/reports', icon: BarChart3, labelKey: 'reports' },
  { path: '/search', icon: Search, labelKey: 'search' },
  { path: '/settings', icon: Settings, labelKey: 'settings' },
];

export function Sidebar({ isMobileOpen, setIsMobileSidebarOpen }) {
  const { darkMode, t } = useData();

  const handleLinkClick = () => {
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <aside className={`
      fixed top-0 left-0 z-40 w-64 h-screen transition-transform
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
      ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
      border-r
    `}>
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <div className="w-5 h-5 text-white font-bold text-lg">G</div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">GramPulse</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Village Survey System</p>
          </div>
        </div>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleLinkClick}
            end={item.path === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-base font-medium
              ${isActive
                ? 'bg-gradient-to-r from-green-500 to-indigo-600 text-white shadow-lg shadow-green-500/25'
                : darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            <item.icon className="w-5 h-5" />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>© 2026 GramPulse</p>
          <p className="mt-1">Smart Village Survey & Family Records</p>
        </div>
      </div>
    </aside>
  );
}
