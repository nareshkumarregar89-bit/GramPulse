import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, RefreshCw, X, ArrowUpCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export function UpdatePrompt() {
  const [isUpdating, setIsUpdating] = useState(false);
  const { darkMode, language } = useData();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        // Automatically check for new updates every 15 minutes
        const intervalId = setInterval(async () => {
          if (navigator.onLine) {
            try {
              await registration.update();
            } catch (err) {
              // Ignore background update check failures
            }
          }
        }, 15 * 60 * 1000);

        return () => clearInterval(intervalId);
      }
    },
    onRegisterError(error) {
      console.warn('PWA service worker registration issue:', error);
    },
  });

  // Also check for updates whenever user returns to the tab or app gains focus
  useEffect(() => {
    const handleCheckUpdate = () => {
      if (document.visibilityState === 'visible' && 'serviceWorker' in navigator && navigator.onLine) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) {
            reg.update().catch(() => {});
          }
        }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleCheckUpdate);
    window.addEventListener('focus', handleCheckUpdate);
    return () => {
      document.removeEventListener('visibilitychange', handleCheckUpdate);
      window.removeEventListener('focus', handleCheckUpdate);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    let reloaded = false;
    const triggerReload = () => {
      if (!reloaded) {
        reloaded = true;
        window.location.reload();
      }
    };

    try {
      // 1. Listen for immediate controllerchange when new service worker takes over
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', triggerReload);
      }

      // 2. Direct message to any waiting service worker to take control
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg?.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }).catch(() => {});
      }

      // 3. Call vite-plugin-pwa updateServiceWorker
      await updateServiceWorker(true);
    } catch (err) {
      console.warn('Update trigger warning:', err);
    } finally {
      // 4. Bulletproof Fallback: Guaranteed reload within 1200ms so it NEVER gets stuck on "Updating..."
      setTimeout(triggerReload, 1200);
    }
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) {
    return null;
  }

  const isHindi = language === 'hi';

  return (
    <div
      role="alert"
      aria-live="polite"
      className="no-print fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[99999] w-[94%] max-w-lg shadow-2xl rounded-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 transition-all"
      style={{
        backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.98)',
        borderColor: darkMode ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.35)',
        boxShadow: darkMode
          ? '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px -5px rgba(34, 197, 94, 0.25)'
          : '0 20px 40px -15px rgba(22, 163, 74, 0.25), 0 0 25px -5px rgba(34, 197, 94, 0.2)'
      }}
    >
      <div className="p-4 sm:p-5 flex items-start gap-3.5">
        {/* Glow Icon */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center text-white shrink-0 shadow-lg shadow-green-500/30">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20">
              <ArrowUpCircle className="w-3 h-3" />
              {isHindi ? 'नया वर्शन उपलब्ध' : 'New Update'}
            </span>
          </div>

          <h4 className={`text-base font-bold mt-1 leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {isHindi ? 'विलेजपल्स का नया अपडेट तैयार है!' : 'A new version of VillagePulse is ready!'}
          </h4>

          <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {isHindi
              ? 'बिना रिफ्रेश किए नए फीचर्स और सुधार पाने के लिए अभी अपडेट करें।'
              : 'Update now to experience the latest features and performance enhancements without manual refresh.'}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 mt-3.5">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 active:scale-95 transition-all shadow-md shadow-green-600/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating
                ? (isHindi ? 'अपडेट हो रहा है...' : 'Updating...')
                : (isHindi ? 'अभी अपडेट करें' : 'Update Now')}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              disabled={isUpdating}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {isHindi ? 'बाद में' : 'Later'}
            </button>
          </div>
        </div>

        {/* Close Icon Button */}
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isUpdating}
          className={`shrink-0 p-1 rounded-lg transition-colors ${
            darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Close notification"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
