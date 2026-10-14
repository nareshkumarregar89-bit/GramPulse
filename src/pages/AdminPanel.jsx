import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  UserCheck, 
  FileText, 
  BarChart3, 
  Settings, 
  Trash2, 
  ShieldCheck, 
  Plus, 
  ArrowUpRight, 
  CheckCircle2, 
  Printer, 
  Download, 
  Search, 
  Layers,
  ChevronRight,
  Sparkles,
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  Activity
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { TiltCard } from '../components/TiltCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { EmptyState3D } from '../components/EmptyState3D';

export function AdminPanel() {
  const navigate = useNavigate();
  const { 
    allFamilies = [], 
    villageRecords = [], 
    activeVillageRecords = [], 
    isFamilyInVillage, 
    setSelectedVillage, 
    darkMode, 
    language 
  } = useData();
  const { allUsers = [], currentUser, userProfile } = useAuth();
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Overall dynamic metrics
  const totalVillages = villageRecords.length;
  const activeVillages = activeVillageRecords.length;
  const totalFamilies = allFamilies.length;
  const totalPopulation = allFamilies.reduce((sum, f) => sum + (f.members?.length || 0), 0);
  const activeSurveyors = allUsers.filter(u => u.role === 'surveyor' && u.status !== 'inactive').length;
  const totalAdmins = allUsers.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-8">
      {/* Admin Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all shadow-3d-card ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-indigo-950/40 to-gray-900 border-indigo-900/40' 
          : 'bg-gradient-to-br from-indigo-50/90 via-white to-emerald-50/60 border-indigo-100 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'सुरक्षित व्यवस्थापक पैनल' : 'Secure Admin Command Center'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>{language === 'hi' ? 'लाइव डेटाबेस' : 'Live Cloud Sync'}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {language === 'hi' ? 'ग्रामपल्स प्रशासन एवं नियंत्रण कक्ष' : 'GramPulse System Administration'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
              {language === 'hi'
                ? 'गाँवों, सर्वेक्षणकर्ता खातों, डेटा संग्रह, गोपनीयता नियंत्रण और रिपोर्टिंग का समग्र प्रबंधन करें।'
                : 'Centralized administration for village lifecycle, surveyor deployments, survey dossiers, and system permissions.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/admin/villages')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              <span>{language === 'hi' ? 'गाँव प्रबंधित करें' : 'Manage Villages'}</span>
            </button>

            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{language === 'hi' ? 'एक्सेल आयात' : 'Import Excel'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Ribbon with 3D TiltCards and Animated Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TiltCard
          maxTilt={6}
          perspective={850}
          scale={1.02}
          className={`p-5 rounded-2xl border shadow-3d-card transition-all ${
            darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between transform-z-20">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {language === 'hi' ? 'सक्रिय गाँव' : 'Active Villages'}
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-3 transform-z-20">
            <AnimatedCounter value={activeVillages} /> <span className="text-xs font-medium text-gray-400">/ {totalVillages}</span>
          </p>
          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-1">
            {language === 'hi' ? 'समोड़ी, कोटड़ी सक्रिय' : 'Samodi & Kotdi active'}
          </p>
        </TiltCard>

        <TiltCard
          maxTilt={6}
          perspective={850}
          scale={1.02}
          className={`p-5 rounded-2xl border shadow-3d-card transition-all ${
            darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between transform-z-20">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {language === 'hi' ? 'कुल परिवार' : 'Total Families'}
            </span>
            <div className="p-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-3 transform-z-20">
            <AnimatedCounter value={totalFamilies} />
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {language === 'hi' ? 'सर्वेक्षण डेटाबेस में सुरक्षित' : 'Real-time verified records'}
          </p>
        </TiltCard>

        <TiltCard
          maxTilt={6}
          perspective={850}
          scale={1.02}
          className={`p-5 rounded-2xl border shadow-3d-card transition-all ${
            darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between transform-z-20">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {language === 'hi' ? 'कुल जनसंख्या' : 'Total Population'}
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-2xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-3 transform-z-20">
            <AnimatedCounter value={totalPopulation} />
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {language === 'hi' ? 'सभी पंजीकृत सदस्य' : 'All registered members'}
          </p>
        </TiltCard>

        <TiltCard
          maxTilt={6}
          perspective={850}
          scale={1.02}
          className={`p-5 rounded-2xl border shadow-3d-card transition-all ${
            darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between transform-z-20">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {language === 'hi' ? 'सक्रिय सर्वेयर' : 'Field Surveyors'}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-3 transform-z-20">
            <AnimatedCounter value={activeSurveyors} />
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {language === 'hi' ? 'गाँव-वार आवंटित' : 'Assigned to villages'}
          </p>
        </TiltCard>
      </div>

      {/* SECTION 1: Dynamic Village-wise Family & Surveyor Distribution Dashboard */}
      <div className={`p-6 rounded-3xl border transition-all ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <span>
                {language === 'hi' 
                  ? 'गाँव-वार परिवार एवं सर्वेयर स्थिति (Village-wise Distribution)' 
                  : 'Village-wise Family & Surveyor Distribution'}
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {language === 'hi'
                ? 'समोड़ी एवं कोटड़ी (और भविष्य में जोड़े गए सक्रिय गाँव) का वास्तविक डेटाबेस विश्लेषण'
                : 'Real-time database statistics for Samodi, Kotdi, and active villages'}
            </p>
          </div>

          <button
            onClick={() => navigate('/admin/villages')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>{language === 'hi' ? 'गाँव प्रबंधित करें' : 'Manage All Villages'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Village Cards Grid with 3D Depth */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeVillageRecords.map((village, idx) => {
            const villageFamilies = allFamilies.filter(f => isFamilyInVillage(f, village.id));
            const familyCount = villageFamilies.length;
            const population = villageFamilies.reduce((sum, f) => sum + (f.members?.length || 0), 0);
            const males = villageFamilies.reduce((sum, f) => sum + f.members.filter(m => m.gender === 'Male').length, 0);
            const females = villageFamilies.reduce((sum, f) => sum + f.members.filter(m => m.gender === 'Female').length, 0);

            // Assigned Surveyors
            const assignedSurveyors = allUsers.filter(u => 
              u.role === 'surveyor' && 
              u.assignedVillages && 
              u.assignedVillages.some(av => isFamilyInVillage({ village: av }, village.id))
            );

            // Category breakdown
            const bpl = villageFamilies.filter(f => f.category === 'BPL').length;
            const apl = villageFamilies.filter(f => f.category === 'APL').length;
            const antyodaya = villageFamilies.filter(f => f.category === 'Antyodaya').length;

            // Survey coverage percentage
            const percentOfTotal = allFamilies.length > 0 
              ? Math.round((villageFamilies.length / allFamilies.length) * 100) 
              : 0;

            const isSamodi = (village.nameEnglish || village.id || '').toLowerCase().includes('samodi');
            const accentGradient = isSamodi
              ? 'from-emerald-500 to-teal-600'
              : idx % 2 === 0
                ? 'from-emerald-500 to-teal-600'
                : 'from-indigo-500 to-purple-600';

            const accentBorder = isSamodi 
              ? 'border-emerald-500/25 hover:border-emerald-500/50' 
              : 'border-indigo-500/25 hover:border-indigo-500/50';

            return (
              <TiltCard
                key={village.id}
                maxTilt={6}
                perspective={900}
                scale={1.02}
                className={`p-5 rounded-2xl border shadow-3d-card transition-all duration-200 flex flex-col justify-between ${accentBorder} ${
                  darkMode ? 'bg-gray-800/50' : 'bg-gray-50/80'
                }`}
              >
                <div>
                  {/* Subtle top gradient accent */}
                  <div className={`h-1.5 w-full rounded-full bg-gradient-to-r ${accentGradient} mb-3.5`} />

                  {/* Village Header */}
                  <div className="flex items-start justify-between gap-2 transform-z-10">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-extrabold text-gray-900 dark:text-white">
                          {village.nameHindi}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                          {village.nameEnglish}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                        ID: {village.id}
                      </p>
                    </div>

                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      {language === 'hi' ? 'सक्रिय' : 'Active'}
                    </span>
                  </div>

                  {/* Village Metric Highlights with Animated Counters */}
                  <div className="grid grid-cols-2 gap-2.5 my-3.5 transform-z-10">
                    <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100 shadow-2xs'}`}>
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        {language === 'hi' ? 'कुल परिवार' : 'Families'}
                      </span>
                      <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-0.5">
                        <AnimatedCounter value={familyCount} />
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100 shadow-2xs'}`}>
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        {language === 'hi' ? 'कुल जनसंख्या' : 'Population'}
                      </span>
                      <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        <AnimatedCounter value={population} />
                      </p>
                    </div>
                  </div>

                  {/* Animated Survey Completion / Coverage Bar */}
                  <div className="my-3 space-y-1 transform-z-10">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                        {language === 'hi' ? 'सर्वेक्षण शेयर (Share):' : 'Survey Share:'}
                      </span>
                      <span className="font-bold text-gray-700 dark:text-gray-300">{percentOfTotal}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${accentGradient} progress-shimmer transition-all duration-700`}
                        style={{ width: `${Math.max(percentOfTotal, 5)}%` }}
                      />
                    </div>
                  </div>

                  {/* Demographic mini stats */}
                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 mb-3.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">{language === 'hi' ? 'लिंग अनुपात (M / F):' : 'Gender (M / F):'}</span>
                      <span className="font-semibold">{males} / {females}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">{language === 'hi' ? 'श्रेणी (BPL / APL / Antyodaya):' : 'Categories:'}</span>
                      <span className="font-semibold">{bpl} / {apl} / {antyodaya}</span>
                    </div>
                  </div>

                  {/* Assigned Surveyors */}
                  <div className="pt-2.5 border-t border-gray-200 dark:border-gray-700/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{language === 'hi' ? 'आवंटित सर्वेयर:' : 'Assigned Surveyors:'}</span>
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">{assignedSurveyors.length}</span>
                    </div>

                    {assignedSurveyors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {assignedSurveyors.map(u => (
                          <span 
                            key={u.uid}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold"
                          >
                            {u.name || u.email?.split('@')[0]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-500 italic">
                        {language === 'hi' ? 'कोई सर्वेयर आवंटित नहीं' : 'No surveyor assigned'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Village Quick Link */}
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/60 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedVillage(village.name);
                      navigate('/families');
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>{language === 'hi' ? 'रिकॉर्ड्स देखें' : 'View Records'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => navigate('/admin/villages')}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                  >
                    {language === 'hi' ? 'प्रबंधन' : 'Manage'}
                  </button>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Administrative Command Center Modules with 3D Depth */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          <span>{language === 'hi' ? 'प्रशासनिक मॉड्यूल (Administrative Modules)' : 'Administrative Modules'}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Village Management */}
          <TiltCard 
            onClick={() => navigate('/admin/villages')}
            maxTilt={5}
            scale={1.02}
            className={`p-6 rounded-3xl border cursor-pointer shadow-3d-card transition-all duration-200 ${
              darkMode ? 'bg-gray-900/90 border-gray-800 hover:border-indigo-500/50' : 'bg-white border-gray-200 hover:border-indigo-300'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-2xs transform-z-20">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-between transform-z-10">
              <span>{language === 'hi' ? 'गाँव प्रबंधन' : 'Village Management'}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-normal">
              {language === 'hi'
                ? 'समोड़ी, कोटड़ी और भविष्य के नए गाँव जोड़ें, नाम बदलें, सक्रिय/निष्क्रिय करें।'
                : 'Add, edit, activate/deactivate villages dynamically without source code modification.'}
            </p>
          </TiltCard>

          {/* Card 2: Surveyor Management */}
          <TiltCard 
            onClick={() => navigate('/users')}
            maxTilt={5}
            scale={1.02}
            className={`p-6 rounded-3xl border cursor-pointer shadow-3d-card transition-all duration-200 ${
              darkMode ? 'bg-gray-900/90 border-gray-800 hover:border-emerald-500/50' : 'bg-white border-gray-200 hover:border-emerald-300'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-2xs transform-z-20">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-between transform-z-10">
              <span>{language === 'hi' ? 'सर्वेयर एवं यूज़र प्रबंधन' : 'Surveyor & User Roles'}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-normal">
              {language === 'hi'
                ? 'सर्वेयर खाते बनाएं, गाँव आवंटित करें, पासवर्ड रीसेट और एक्टिव/इनएक्टिव नियंत्रित करें।'
                : 'Create surveyor accounts, assign village boundaries, reset passwords, and manage permissions.'}
            </p>
          </TiltCard>

          {/* Card 3: Family Survey Records & Dossier Printing */}
          <TiltCard 
            onClick={() => navigate('/families')}
            maxTilt={5}
            scale={1.02}
            className={`p-6 rounded-3xl border cursor-pointer shadow-3d-card transition-all duration-200 ${
              darkMode ? 'bg-gray-900/90 border-gray-800 hover:border-teal-500/50' : 'bg-white border-gray-200 hover:border-teal-300'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 shadow-2xs transform-z-20">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-between transform-z-10">
              <span>{language === 'hi' ? 'सर्वे रिकॉर्ड्स एवं प्रिंटिंग' : 'Survey Records & Printing'}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-normal">
              {language === 'hi'
                ? 'सभी गाँवों के परिवारों का संपूर्ण रिकॉर्ड देखें, खोजें और A4 प्रिंट या पीडीएफ तैयार करें।'
                : 'Inspect all family profiles, search across fields, and trigger batch or individual A4 dossier printing.'}
            </p>
          </TiltCard>

          {/* Card 4: Reports & Analytics */}
          <TiltCard 
            onClick={() => navigate('/reports')}
            maxTilt={5}
            scale={1.02}
            className={`p-6 rounded-3xl border cursor-pointer shadow-3d-card transition-all duration-200 ${
              darkMode ? 'bg-gray-900/90 border-gray-800 hover:border-amber-500/50' : 'bg-white border-gray-200 hover:border-amber-300'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 shadow-2xs transform-z-20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-between transform-z-10">
              <span>{language === 'hi' ? 'डेटा विश्लेषण एवं रिपोर्टें' : 'Analytics & Reports'}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-normal">
              {language === 'hi'
                ? 'जाति-वार, मोहल्ला-वार और श्रेणी-वार ग्राफ्स, सांख्यिकी और संपूर्ण रिपोर्ट एक्सेल/पीडीएफ।'
                : 'Interactive demographic graphs, category statistics, and full survey report generation.'}
            </p>
          </TiltCard>

          {/* Card 5: Deleted Records Archive */}
          <TiltCard 
            onClick={() => navigate('/deleted-records')}
            maxTilt={5}
            scale={1.02}
            className={`p-6 rounded-3xl border cursor-pointer shadow-3d-card transition-all duration-200 ${
              darkMode ? 'bg-gray-900/90 border-gray-800 hover:border-red-500/50' : 'bg-white border-gray-200 hover:border-red-300'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 shadow-2xs transform-z-20">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-between transform-z-10">
              <span>{language === 'hi' ? 'हटाए गए रिकॉर्ड (Archive)' : 'Deleted Records Archive'}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-normal">
              {language === 'hi'
                ? 'आकस्मिक विलोपन से सुरक्षित: हटाए गए रिकॉर्ड्स देखें, तुरंत पुनर्स्थापित करें या नष्ट करें।'
                : 'Protected audit bin: review soft-deleted records, restore with single click, or permanently purge.'}
            </p>
          </TiltCard>

          {/* Card 6: System Settings & Backups */}
          <TiltCard 
            onClick={() => navigate('/settings')}
            maxTilt={5}
            scale={1.02}
            className={`p-6 rounded-3xl border cursor-pointer shadow-3d-card transition-all duration-200 ${
              darkMode ? 'bg-gray-900/90 border-gray-800 hover:border-purple-500/50' : 'bg-white border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 shadow-2xs transform-z-20">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-between transform-z-10">
              <span>{language === 'hi' ? 'सिस्टम सेटिंग्स एवं बैकअप' : 'System Settings & Backups'}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed font-normal">
              {language === 'hi'
                ? 'मोहल्ला व जाति मास्टर सूचियाँ, पूर्ण डेटाबेस JSON बैकअप और डेटा रीसेट नियंत्रण।'
                : 'Configure master mohallas, castes, trigger complete database JSON backups and restore.'}
            </p>
          </TiltCard>
        </div>
      </div>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />
    </div>
  );
}
