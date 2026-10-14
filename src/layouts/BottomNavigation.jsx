import { NavLink } from 'react-router-dom';
import {
  Home,
  FileText,
  Users,
  Search,
  BarChart3,
  UserCheck,
  Settings
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

export function BottomNavigation() {
  const { darkMode, t, language } = useData();
  const { isAdmin } = useAuth();

  const navItems = [
    { 
      path: '/', 
      icon: Home, 
      label: language === 'hi' ? 'होम' : 'Home' 
    },
    { 
      path: '/survey', 
      icon: FileText, 
      label: language === 'hi' ? 'सर्वे' : 'Survey' 
    },
    { 
      path: '/families', 
      icon: Users, 
      label: language === 'hi' ? 'परिवार' : 'Families' 
    },
    { 
      path: '/search', 
      icon: Search, 
      label: language === 'hi' ? 'खोज' : 'Search' 
    },
    { 
      path: isAdmin ? '/users' : '/reports', 
      icon: isAdmin ? UserCheck : BarChart3, 
      label: isAdmin 
        ? (language === 'hi' ? 'यूज़र्स' : 'Users') 
        : (language === 'hi' ? 'रिपोर्ट्स' : 'Reports') 
    },
  ];

  return (
    <nav className={`
      fixed bottom-0 left-0 right-0 z-40 md:hidden
      backdrop-blur-xl border-t transition-colors duration-200
      ${darkMode ? 'bg-gray-900/95 border-gray-800/80 shadow-2xl shadow-black' : 'bg-white/95 border-gray-200/80 shadow-lg shadow-gray-200'}
      pb-[env(safe-area-inset-bottom)]
    `}>
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl transition-all duration-200 flex-1
              ${isActive
                ? 'text-green-600 dark:text-green-400 font-semibold'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-800'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-green-500/15 scale-105' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] leading-tight truncate font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-green-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
