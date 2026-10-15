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
  Trash2,
  UserCheck,
  User,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const generalNavItems = [
  { path: '/', icon: Home, labelKey: 'dashboard' },
  { path: '/survey', icon: FileText, labelKey: 'new_survey' },
  { path: '/families', icon: Users, labelKey: 'families' },
  { path: '/mohallas', icon: MapPin, labelKey: 'mohallas' },
  { path: '/castes', icon: UsersRound, labelKey: 'castes' },
  { path: '/reports', icon: BarChart3, labelKey: 'reports' },
  { path: '/search', icon: Search, labelKey: 'search' },
  { path: '/profile', icon: User, labelKey: 'profile' },
];

const adminNavItems = [
  { path: '/admin', icon: ShieldCheck, labelKey: 'admin_panel' },
  { path: '/admin/villages', icon: Building2, labelKey: 'village_management' },
  { path: '/users', icon: UserCheck, labelKey: 'user_management' },
  { path: '/deleted-records', icon: Trash2, labelKey: 'deleted_records' },
  { path: '/settings', icon: Settings, labelKey: 'settings' },
];

export function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const { darkMode, language, t } = useData();
  const { isAdmin } = useAuth();

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
      border-r flex flex-col justify-between
    `}>
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="VillagePulse Logo" 
              className="w-10 h-10 object-contain rounded-xl shadow-xs" 
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">VillagePulse</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Village Survey System</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-8.5rem)] scrollbar-hide">
          {/* General Survey Items (Available to all authenticated users) */}
          {generalNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              end={item.path === '/'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium
                ${isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-md shadow-emerald-500/25 translate-x-1 font-semibold'
                  : darkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800/80 hover:translate-x-0.5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:translate-x-0.5'
                }
              `}
            >
              <item.icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}

          {/* Secure Admin Section (Strictly restricted to Admin role) */}
          {isAdmin && (
            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-800">
              <div className="px-3 pb-2 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {language === 'hi' ? 'प्रशासनिक नियंत्रण' : 'Admin Controls'}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  ADMIN
                </span>
              </div>

              <div className="space-y-1">
                {adminNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleLinkClick}
                    end={item.path === '/admin'}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium
                      ${isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 translate-x-1 font-semibold'
                        : darkMode
                          ? 'text-gray-400 hover:text-white hover:bg-gray-800/80 hover:translate-x-0.5'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:translate-x-0.5'
                      }
                    `}
                  >
                    <item.icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Footer Branding */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p className="font-semibold">VillagePulse v2.0</p>
          <p className="mt-0.5 text-[10px]">Smart Village Survey & Family Records</p>
        </div>
      </div>
    </aside>
  );
}
