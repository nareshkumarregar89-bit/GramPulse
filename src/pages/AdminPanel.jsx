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
  Activity,
  AlertCircle,
  XCircle,
  Shield,
  Mail
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
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
  const { allUsers = [], currentUser, userProfile, deleteUserByAdmin, toggleUserStatus } = useAuth();
  const { addToast } = useToast();
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Overall dynamic metrics
  const totalVillages = villageRecords.length;
  const activeVillages = activeVillageRecords.length;
  const totalFamilies = allFamilies.length;
  const totalPopulation = allFamilies.reduce((sum, f) => sum + (f.members?.length || 0), 0);
  const activeSurveyors = allUsers.filter(u => u.role === 'surveyor' && u.status !== 'inactive').length;
  const totalAdmins = allUsers.filter(u => u.role === 'admin').length;

  // Filtered users for quick admin management
  const displayedUsers = allUsers.filter(u => {
    if (!userSearchTerm.trim()) return true;
    const q = userSearchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (userToDelete.uid === currentUser?.uid) {
      addToast(language === 'hi' ? 'आप स्वयं के खाते को नहीं हटा सकते।' : 'You cannot delete your own account.', 'error');
      setUserToDelete(null);
      return;
    }
    if (userToDelete.uid === 'sJwiZZ6cf8Ze8YAmMMK8T1FwF232') {
      addToast(language === 'hi' ? 'सुपर एडमिन खाता नहीं हटाया जा सकता।' : 'Super Admin account cannot be deleted.', 'error');
      setUserToDelete(null);
      return;
    }

    try {
      setIsDeletingUser(true);
      await deleteUserByAdmin(userToDelete.uid, userToDelete);
      addToast(
        language === 'hi' 
          ? `यूज़र "${userToDelete.name || userToDelete.email}" सफलतापूर्वक हटा दिया गया!` 
          : `User "${userToDelete.name || userToDelete.email}" deleted successfully!`,
        'success'
      );
      setUserToDelete(null);
    } catch (err) {
      console.error('Delete user error in AdminPanel:', err);
      addToast(
        err.message || (language === 'hi' ? 'यूज़र हटाने में त्रुटि हुई।' : 'Failed to delete user.'),
        'error'
      );
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (user) => {
    if (user.uid === currentUser?.uid) {
      addToast(language === 'hi' ? 'आप स्वयं के खाते को निष्क्रिय नहीं कर सकते।' : 'You cannot deactivate your own account.', 'error');
      return;
    }
    try {
      const next = await toggleUserStatus(user.uid, user.status || 'active');
      addToast(
        language === 'hi' 
          ? `यूज़र "${user.name || user.email}" ${next === 'active' ? 'सक्रिय' : 'निष्क्रिय'} किया गया!` 
          : `User "${user.name || user.email}" marked as ${next}!`,
        'success'
      );
    } catch (err) {
      console.error('Toggle status error:', err);
      addToast(language === 'hi' ? 'स्थिति बदलने में त्रुटि हुई।' : 'Failed to update user status.', 'error');
    }
  };

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

      {/* SECTION 2: Surveyor & User Accounts Management (Quick Admin Control) */}
      <div className={`p-6 rounded-3xl border transition-all ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {language === 'hi' ? 'सर्वेयर एवं यूज़र प्रबंधन (Surveyor & User Control)' : 'Surveyor & User Accounts Control'}
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {language === 'hi'
                ? 'सिस्टम उपयोगकर्ताओं की सूची, गाँव आवंटन, स्थिति नियंत्रण और यूज़र विलोपन (Delete User)'
                : 'System user directory, live status, village assignments, and direct user deletion'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick search input */}
            <div className="relative w-44 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'hi' ? 'यूज़र खोजें...' : 'Search users...'}
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none ${
                  darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              />
            </div>

            <button
              onClick={() => navigate('/users')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors whitespace-nowrap shrink-0"
            >
              <span>{language === 'hi' ? 'सभी यूज़र' : 'Manage All'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Users Cards / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedUsers.length === 0 ? (
            <div className="col-span-full p-8 text-center text-xs text-gray-500 dark:text-gray-400">
              {language === 'hi' ? 'कोई यूज़र नहीं मिला।' : 'No users match your search.'}
            </div>
          ) : (
            displayedUsers.map((user) => {
              const surveyCount = allFamilies.filter(f => f.surveyorId === user.uid || f.createdBy === user.uid).length;
              const isUserActive = user.status !== 'inactive';
              const isSelf = user.uid === currentUser?.uid;
              const isSuperAdmin = user.uid === 'sJwiZZ6cf8Ze8YAmMMK8T1FwF232';

              return (
                <div
                  key={user.uid}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    darkMode ? 'bg-gray-800/40 border-gray-800 hover:border-gray-700' : 'bg-gray-50/70 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-gray-900 dark:text-white truncate flex items-center gap-1">
                            <span>{user.name || 'Unnamed User'}</span>
                            {isSelf && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 font-bold">
                                {language === 'hi' ? 'आप' : 'You'}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase shrink-0 ${
                        user.role === 'admin'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        {user.role === 'admin' ? (language === 'hi' ? 'एडमिन' : 'Admin') : (language === 'hi' ? 'सर्वेयर' : 'Surveyor')}
                      </span>
                    </div>

                    {/* Stats & status row */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                        {language === 'hi' ? 'दर्ज परिवार:' : 'Surveys:'} <strong className="text-gray-800 dark:text-gray-200">{surveyCount}</strong>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        disabled={isSelf}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${
                          isUserActive
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        } ${isSelf ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80 active:scale-95'}`}
                      >
                        {isUserActive ? (language === 'hi' ? 'सक्रिय' : 'Active') : (language === 'hi' ? 'निष्क्रिय' : 'Inactive')}
                      </button>
                    </div>

                    {/* Assigned Villages */}
                    <div className="text-[11px] pt-1">
                      <span className="text-gray-400 block mb-1">
                        {language === 'hi' ? 'आवंटित गाँव:' : 'Villages:'}
                      </span>
                      {user.role === 'admin' ? (
                        <span className="text-gray-500 italic text-[10px]">
                          {language === 'hi' ? 'सभी गाँव (Global Access)' : 'All Villages'}
                        </span>
                      ) : (user.assignedVillages && user.assignedVillages.length > 0) ? (
                        <div className="flex flex-wrap gap-1">
                          {user.assignedVillages.map(v => (
                            <span 
                              key={v}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-amber-500 italic text-[10px]">
                          {language === 'hi' ? 'कोई गाँव नहीं' : 'None'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons (Manage & Direct Delete User) */}
                  <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-gray-200 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => navigate('/users')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>{language === 'hi' ? 'विवरण' : 'Edit Details'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserToDelete(user)}
                      disabled={isSelf || isSuperAdmin}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isSelf || isSuperAdmin
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-40'
                          : 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:text-red-700 active:scale-95'
                      }`}
                      title={language === 'hi' ? 'यूज़र हटाएं' : 'Delete User'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'यूज़र हटाएं' : 'Delete User'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 3: Administrative Command Center Modules with 3D Depth */}
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

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 space-y-4 transition-all ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5" />
                <span>{language === 'hi' ? 'यूज़र खाता हटाएं' : 'Delete User Account'}</span>
              </h2>
              <button 
                onClick={() => setUserToDelete(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {language === 'hi' ? 'चेतावनी: यह कार्रवाई स्थायी है!' : 'Warning: Permanent Deletion!'}
                  </p>
                  <p className="mt-1 text-red-600 dark:text-red-300">
                    {language === 'hi'
                      ? 'इस यूज़र का खाता और सिस्टम एक्सेस हटा दिया जाएगा। वे दोबारा लॉगिन नहीं कर सकेंगे।'
                      : 'This user account and permissions will be permanently revoked from cloud servers.'}
                  </p>
                </div>
              </div>

              {/* User summary preview */}
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {userToDelete.name?.charAt(0)?.toUpperCase() || userToDelete.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{userToDelete.name || 'Unnamed User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userToDelete.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {userToDelete.role || 'surveyor'}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {allFamilies.filter(f => f.surveyorId === userToDelete.uid || f.createdBy === userToDelete.uid).length} {language === 'hi' ? 'सर्वे रिकॉर्ड्स' : 'survey records'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl border text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={handleDeleteUser}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isDeletingUser
                    ? (language === 'hi' ? 'हटा रहे हैं...' : 'Deleting...')
                    : (language === 'hi' ? 'हाँ, यूज़र हटाएं' : 'Yes, Delete User')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
