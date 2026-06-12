import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { BottomNavigation } from './BottomNavigation';
import { useData } from '../contexts/DataContext';

export function Layout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { darkMode } = useData();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />
      
      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div className="md:ml-64">
        <TopNavbar setIsMobileSidebarOpen={setIsMobileSidebarOpen} />
        <main className="p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
