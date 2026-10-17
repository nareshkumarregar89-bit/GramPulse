import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  Plus,
  Search,
  User,
  Sparkles
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

export function BottomNavigation() {
  const { darkMode, language } = useData();

  const standardNav = [
    { 
      path: '/', 
      icon: Home, 
      label: language === 'hi' ? 'होम' : 'Home' 
    },
    { 
      path: '/families', 
      icon: Users, 
      label: language === 'hi' ? 'परिवार' : 'Families' 
    },
    // Center CTA: New Survey
    {
      path: '/survey',
      icon: Plus,
      label: language === 'hi' ? 'नया सर्वे' : 'New Survey',
      isCenterAction: true
    },
    { 
      path: '/search', 
      icon: Search, 
      label: language === 'hi' ? 'खोज' : 'Search' 
    },
    { 
      path: '/profile', 
      icon: User, 
      label: language === 'hi' ? 'प्रोफ़ाइल' : 'Profile' 
    },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 max-w-md mx-auto z-40 md:hidden mb-[env(safe-area-inset-bottom)] pointer-events-none select-none"
    >
      <div 
        className={`
          pointer-events-auto relative flex items-center justify-around px-2 py-1.5 rounded-2xl sm:rounded-3xl
          backdrop-blur-2xl transition-all duration-300
          border shadow-[0_10px_35px_-4px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_-4px_rgba(0,0,0,0.6)]
          ${darkMode 
            ? 'bg-gray-900/90 border-gray-800/80 text-gray-300 shadow-emerald-950/20' 
            : 'bg-white/90 border-gray-200/80 text-gray-600 shadow-emerald-500/10'
          }
        `}
      >
        {standardNav.map((item) => {
          if (item.isCenterAction) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  relative group flex flex-col items-center justify-center -translate-y-5 px-1 focus:outline-none
                `}
              >
                {({ isActive }) => (
                  <div className="flex flex-col items-center">
                    <div 
                      className={`
                        w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300
                        bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white
                        shadow-lg shadow-emerald-600/35 ring-4 transition-transform duration-200 active:scale-90
                        ${darkMode ? 'ring-gray-900' : 'ring-white'}
                        ${isActive ? 'scale-105 shadow-emerald-600/50' : 'group-hover:scale-105'}
                      `}
                    >
                      <Plus className={`w-6 h-6 stroke-[2.5] transition-transform duration-300 ${isActive ? 'rotate-90' : 'group-hover:rotate-45'}`} />
                    </div>
                    <span 
                      className={`
                        text-[10px] mt-1 font-bold tracking-tight transition-colors duration-200
                        ${isActive 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : darkMode ? 'text-gray-400' : 'text-gray-500'
                        }
                      `}
                    >
                      {item.label}
                    </span>
                  </div>
                )}
              </NavLink>
            );
          }

          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 flex-1
                active:scale-95 focus:outline-none
                ${isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-900'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div 
                    className={`
                      p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center
                      ${isActive 
                        ? 'bg-emerald-500/15 dark:bg-emerald-400/20 scale-105' 
                        : 'group-hover:bg-gray-100 dark:group-hover:bg-gray-800'
                      }
                    `}
                  >
                    <IconComponent className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  </div>
                  <span className="text-[10px] sm:text-[11px] leading-tight truncate font-medium mt-0.5 tracking-tight">
                    {item.label}
                  </span>
                  
                  {/* Subtle active pill dot */}
                  {isActive && (
                    <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
