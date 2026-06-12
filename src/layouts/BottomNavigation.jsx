import { NavLink } from 'react-router-dom';
import {
  Home,
  FileText,
  Users,
  Search,
  User
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/survey', icon: FileText, label: 'Survey' },
  { path: '/families', icon: Users, label: 'Families' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/settings', icon: User, label: 'Profile' },
];

export function BottomNavigation() {
  const { darkMode } = useData();

  return (
    <nav className={`
      fixed bottom-0 left-0 right-0 z-40 md:hidden
      ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
      border-t
    `}>
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `
              flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all
              ${isActive
                ? 'text-green-500'
                : 'text-gray-500'
              }
            `}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
