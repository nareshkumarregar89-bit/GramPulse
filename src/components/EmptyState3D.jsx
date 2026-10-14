import { useData } from '../contexts/DataContext';
import { Search, FolderOpen, Plus } from 'lucide-react';

export function EmptyState3D({
  title,
  description,
  actionLabel,
  onAction,
  icon: CustomIcon
}) {
  const { darkMode, language } = useData();

  return (
    <div className={`p-8 sm:p-12 text-center rounded-3xl border transition-all duration-300 ${
      darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white/80 border-gray-200 shadow-xs'
    }`}>
      {/* 3D Isometric Empty State Illustration */}
      <div className="relative w-36 h-36 mx-auto mb-4 flex items-center justify-center">
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full drop-shadow-lg select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base isometric platform */}
          <path d="M80 30 L140 65 L80 100 L20 65 Z" fill={darkMode ? '#1e293b' : '#f1f5f9'} />
          <path d="M20 65 L80 100 L80 110 L20 75 Z" fill={darkMode ? '#0f172a' : '#e2e8f0'} />
          <path d="M80 100 L140 65 L140 75 L80 110 Z" fill={darkMode ? '#090d16' : '#cbd5e1'} />

          {/* Floating Isometric Empty Folder / Document */}
          <g className="animate-float-slow">
            <path d="M55 45 L105 15 L125 35 L75 65 Z" fill={darkMode ? '#334155' : '#94a3b8'} opacity="0.8" />
            <path d="M50 50 L100 20 L120 40 L70 70 Z" fill={darkMode ? '#475569' : '#cbd5e1'} />
            <path d="M45 55 L95 25 L115 45 L65 75 Z" fill="#10b981" />
            <path d="M60 52 L90 35" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M65 60 L85 49" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Isometric Search Lens */}
          <g className="animate-float-delayed">
            <circle cx="105" cy="85" r="16" stroke="#6366f1" strokeWidth="3" fill="rgba(99, 102, 241, 0.15)" />
            <line x1="117" y1="97" x2="132" y2="112" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
            <circle cx="101" cy="81" r="3" fill="white" opacity="0.7" />
          </g>
        </svg>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
        {title || (language === 'hi' ? 'कोई रिकॉर्ड नहीं मिला' : 'No Survey Records Found')}
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
        {description || (language === 'hi' 
          ? 'वर्तमान फ़िल्टर या गाँव के लिए कोई प्रविष्टि उपलब्ध नहीं है।' 
          : 'No data entries match the selected filter or village criteria.')}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all active:scale-95"
        >
          {CustomIcon ? <CustomIcon className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
