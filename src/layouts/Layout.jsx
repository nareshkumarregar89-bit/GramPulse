import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { BottomNavigation } from './BottomNavigation';
import { useData } from '../contexts/DataContext';
import { FlaskConical, X } from 'lucide-react';

export function Layout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { darkMode, language, showDummyData, setShowDummyData } = useData();

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

        {/* Demo Mode Active Banner */}
        {showDummyData && (
          <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/30 px-3.5 sm:px-4 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 shadow-2xs backdrop-blur-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FlaskConical className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">
                {language === 'hi'
                  ? 'डेमो मोड: डमी डेटा दिख रहा है। असली डेटा सुरक्षित है।'
                  : 'Demo Mode: Viewing dummy data preview. Real database is safe.'}
              </span>
            </div>
            <button
              onClick={() => setShowDummyData(false)}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 font-bold text-xs transition-all active:scale-95"
            >
              <span>{language === 'hi' ? 'डमी डेटा छिपाएं' : 'Hide'}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <main className="p-3.5 sm:p-5 md:p-6 pb-28 md:pb-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
