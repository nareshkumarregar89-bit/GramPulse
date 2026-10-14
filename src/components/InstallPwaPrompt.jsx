import { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const { darkMode, language } = useData();

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      return;
    }

    const handler = (e) => {
      // Prevent browser's default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user previously dismissed today
      const dismissed = localStorage.getItem('pwa_dismissed_at');
      if (!dismissed || Date.now() - parseInt(dismissed, 10) > 24 * 60 * 60 * 1000) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_dismissed_at', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className={`no-print fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 p-4 rounded-2xl shadow-2xl border transition-all animate-bounce-subtle ${
      darkMode ? 'bg-gray-900/95 border-gray-700 text-white backdrop-blur-md' : 'bg-white/95 border-green-200 text-gray-900 backdrop-blur-md'
    }`}>
      <div className="flex items-start gap-3">
        <img 
          src="/logo.png" 
          alt="GramPulse" 
          className="w-12 h-12 rounded-xl object-contain shrink-0 shadow-md bg-white/10 p-0.5" 
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm md:text-base">
            {language === 'hi' ? 'फ़ोन में GramPulse ऐप इंस्टॉल करें' : 'Install GramPulse App'}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {language === 'hi'
              ? 'बिना ब्राउज़र के सीधे होम स्क्रीन से तेज़ और ऑफ़लाइन चलाएं।'
              : 'Fast, full-screen access directly from your phone home screen.'}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              {language === 'hi' ? 'अभी इंस्टॉल करें' : 'Install Now'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {language === 'hi' ? 'बाद में' : 'Later'}
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
