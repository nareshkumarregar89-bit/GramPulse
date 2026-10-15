import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2,
  TrendingUp,
  MapPin
} from 'lucide-react';

export function IsometricVillageHero({ onOpenExcel }) {
  const { darkMode, language, t, activeVillageRecords = [], villages = [] } = useData();
  const { isAdmin, userProfile, currentUser } = useAuth();
  const navigate = useNavigate();

  const displayName = userProfile?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'User');
  const greeting = language === 'hi' ? 'नमस्ते,' : 'Welcome back,';

  return (
    <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-900/90 to-indigo-950/40 border-gray-800 shadow-xl shadow-black/20' 
        : 'bg-gradient-to-br from-emerald-50/70 via-white to-indigo-50/80 border-indigo-100/80 shadow-md shadow-indigo-500/5'
    }`}>
      {/* Layered Subtle Isometric Grid Pattern Background */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* Ambient Radial Gradient Lights */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl"
      />
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl"
      />

      <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Column: SaaS Welcome & Interactive Badges */}
        <div className="flex-1 max-w-2xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{language === 'hi' ? 'स्मार्ट विलेज डिजिटल सर्वे' : 'Smart Village Digital Hub'}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              <span>{activeVillageRecords.length > 0 ? activeVillageRecords.map(v => v.nameHindi || v.nameEnglish || v.name).join(' • ') : 'समोड़ी • कोटड़ी'}</span>
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
              {greeting} <span className="bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent">{displayName}</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2 max-w-xl font-normal leading-relaxed">
              {language === 'hi'
                ? 'विलेजपल्स सर्वे प्रणाली में आपका स्वागत है। ग्रामीण परिवार डेटा, जनसांख्यिकी और सामाजिक कल्याण रिकॉर्ड्स का सुचारू डिजिटल प्रबंधन।'
                : 'Empowering rural administration with real-time family demographics, transparent surveys, and community intelligence.'}
            </p>
          </div>

          {/* Quick Action Buttons with 3D Depth Feedback */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/survey')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t('new_survey')}</span>
            </button>

            {onOpenExcel && (
              <button
                onClick={onOpenExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all duration-200 active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('import_excel')}</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all duration-200 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{language === 'hi' ? 'व्यवस्थापक कक्ष' : 'Admin Hub'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: 3D Isometric Village Scene SVG */}
        <div className="relative shrink-0 w-full sm:w-80 lg:w-96 flex items-center justify-center">
          <div className="relative w-full max-w-[340px] aspect-square">
            {/* Floating Info Tag 1: Real-time Cloud Sync */}
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-gray-800/95 border border-emerald-500/30 shadow-lg shadow-black/5 backdrop-blur-sm animate-float-slow">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                {language === 'hi' ? 'लाइव सिंक' : 'Live Cloud Sync'}
              </span>
            </div>

            {/* Floating Info Tag 2: Verified Villages */}
            <div className="absolute bottom-4 right-2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-gray-800/95 border border-indigo-500/30 shadow-lg shadow-black/5 backdrop-blur-sm animate-float-delayed">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                {language === 'hi' ? 'समोड़ी • कोटड़ी' : 'Samodi & Kotdi'}
              </span>
            </div>

            {/* Isometric Smart Village SVG Scene */}
            <svg
              viewBox="0 0 400 360"
              className="w-full h-full drop-shadow-2xl select-none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Gradients for Isometric Surfaces */}
                <linearGradient id="groundGrad" x1="200" y1="100" x2="200" y2="350" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor={darkMode ? '#1e293b' : '#ecfdf5'} />
                  <stop offset="100%" stopColor={darkMode ? '#0f172a' : '#d1fae5'} />
                </linearGradient>

                <linearGradient id="bldgFront" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                <linearGradient id="bldgSide" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#065f46" />
                </linearGradient>

                <linearGradient id="bldgRoof" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>

                <linearGradient id="house2Roof" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>

                <linearGradient id="solarRoof" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>

                <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="12" stdDeviation="10" floodOpacity={darkMode ? '0.45' : '0.12'} />
                </filter>
              </defs>

              {/* Isometric Base Foundation (Plaza) */}
              <g filter="url(#shadow3d)">
                {/* Top Face */}
                <path d="M200 80 L360 170 L200 260 L40 170 Z" fill="url(#groundGrad)" />
                {/* Left Elevation Face */}
                <path d="M40 170 L200 260 L200 278 L40 188 Z" fill={darkMode ? '#0b1120' : '#a7f3d0'} />
                {/* Right Elevation Face */}
                <path d="M200 260 L360 170 L360 188 L200 278 Z" fill={darkMode ? '#070d17' : '#6ee7b7'} />
              </g>

              {/* Pathway / Road on Plaza */}
              <path d="M120 125 L280 215 L260 225 L100 135 Z" fill={darkMode ? '#334155' : '#cbd5e1'} opacity="0.6" />

              {/* Main Panchayat Smart Kendra Building (Center-Left) */}
              <g id="panchayat-kendra">
                {/* Shadow */}
                <path d="M140 170 L220 125 L260 148 L180 193 Z" fill="rgba(0,0,0,0.12)" />

                {/* Left Wall */}
                <path d="M140 170 L140 115 L190 85 L190 140 Z" fill="url(#bldgFront)" />
                {/* Right Wall */}
                <path d="M190 140 L190 85 L240 115 L240 170 Z" fill="url(#bldgSide)" />
                {/* Roof */}
                <path d="M140 115 L190 85 L240 115 L190 145 Z" fill="url(#bldgRoof)" />

                {/* Solar Panel Layer on Roof */}
                <path d="M158 112 L190 92 L222 112 L190 132 Z" fill="url(#solarRoof)" opacity="0.85" />
                <path d="M190 92 L190 132" stroke="#bae6fd" strokeWidth="1" />
                <path d="M174 102 L206 122" stroke="#bae6fd" strokeWidth="1" />

                {/* Door on Left Wall */}
                <path d="M155 160 L155 138 L170 130 L170 152 Z" fill="#047857" />
                {/* Windows on Right Wall */}
                <path d="M205 142 L205 130 L220 138 L220 150 Z" fill="#ecfdf5" opacity="0.9" />

                {/* Digital Pulse Beacon Antenna */}
                <line x1="190" y1="85" x2="190" y2="55" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="190" cy="55" r="4.5" fill="#10b981" />
                <circle cx="190" cy="55" r="9" stroke="#34d399" strokeWidth="1.5" opacity="0.6" className="animate-ping" style={{ transformOrigin: '190px 55px' }} />
              </g>

              {/* Second Smart Village House (Kotdi / Field Center - Right) */}
              <g id="village-house-2">
                {/* Left Wall */}
                <path d="M260 170 L260 135 L295 115 L295 150 Z" fill="#4338ca" />
                {/* Right Wall */}
                <path d="M295 150 L295 115 L330 135 L330 170 Z" fill="#3730a3" />
                {/* Roof */}
                <path d="M260 135 L295 115 L330 135 L295 155 Z" fill="url(#house2Roof)" />
                {/* Windows */}
                <path d="M272 154 L272 144 L284 138 L284 148 Z" fill="#e0e7ff" />
              </g>

              {/* Isometric Trees (Gramin Greenery) */}
              <g id="isometric-tree-1">
                {/* Trunk */}
                <line x1="90" y1="185" x2="90" y2="170" stroke="#78350f" strokeWidth="3" />
                {/* Foliage 3D spheres/cones */}
                <circle cx="90" cy="162" r="14" fill="#059669" />
                <circle cx="86" cy="158" r="10" fill="#10b981" />
              </g>

              <g id="isometric-tree-2">
                {/* Trunk */}
                <line x1="120" y1="210" x2="120" y2="195" stroke="#78350f" strokeWidth="3" />
                {/* Foliage */}
                <circle cx="120" cy="188" r="16" fill="#047857" />
                <circle cx="116" cy="184" r="12" fill="#34d399" />
              </g>

              <g id="isometric-tree-3">
                <line x1="320" y1="205" x2="320" y2="192" stroke="#78350f" strokeWidth="2.5" />
                <circle cx="320" cy="184" r="12" fill="#059669" />
                <circle cx="317" cy="180" r="8" fill="#10b981" />
              </g>

              {/* Isometric Digital Survey Tablet Floating Overlay */}
              <g id="floating-tablet" className="animate-float">
                <path d="M85 85 L145 50 L185 75 L125 110 Z" fill="#1e293b" />
                <path d="M90 85 L140 55 L175 75 L125 105 Z" fill="#0f172a" />
                {/* Tablet Screen Content */}
                <line x1="102" y1="80" x2="132" y2="63" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                <line x1="112" y1="88" x2="150" y2="67" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
                <line x1="120" y1="95" x2="145" y2="81" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                <circle cx="160" cy="72" r="3" fill="#10b981" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
