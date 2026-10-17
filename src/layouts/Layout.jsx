import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { BottomNavigation } from './BottomNavigation';
import { useData } from '../contexts/DataContext';

export function Layout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { darkMode } = useData();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-200`}>
      <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />
      
      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div className="md:ml-64">
        <TopNavbar setIsMobileSidebarOpen={setIsMobileSidebarOpen} />

        <main className="p-3.5 sm:p-5 md:p-6 pb-28 md:pb-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
