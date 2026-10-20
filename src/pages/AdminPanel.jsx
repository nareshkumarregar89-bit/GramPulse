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
  Mail,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { TiltCard } from '../components/TiltCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { EmptyState3D } from '../components/EmptyState3D';
import { getUniqueAssignedVillageNames } from '../utils/villageUtils';

export function AdminPanel() {
  const navigate = useNavigate();
  const { 
    allFamilies = [], 
    villageRecords = [], 
    activeVillageRecords = [], 
    isFamilyInVillage, 
    setSelectedVillage, 
    clearAllSurveyData,
    loadStandard142Families,
    needsReviewFamilies = [],
    migrateMissingVillageIds,
    resolveUncertainRecordVillage,
    darkMode, 
    language 
  } = useData();
  const { allUsers = [], currentUser, userProfile, deleteUserByAdmin, toggleUserStatus, assignVillageToUser } = useAuth();
  const { addToast } = useToast();
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Unassigned user assignment modal state
  const [userToAssignVillage, setUserToAssignVillage] = useState(null);
  const [selectedVillageForAssign, setSelectedVillageForAssign] = useState('');
  const [isAssigningVillage, setIsAssigningVillage] = useState(false);
  const [isWipingData, setIsWipingData] = useState(false);

  // Village ID Migration & Uncertain Review State
  const [isMigratingVillageIds, setIsMigratingVillageIds] = useState(false);
  const [recordToResolveVillage, setRecordToResolveVillage] = useState(null);
  const [selectedVillageForResolve, setSelectedVillageForResolve] = useState('');
  const [isResolvingVillage, setIsResolvingVillage] = useState(false);

  const handleMigrateVillageIds = async () => {
    try {
      setIsMigratingVillageIds(true);
      const res = await migrateMissingVillageIds();
      addToast(
        language === 'hi'
          ? `विलेज आईडी माइग्रेशन संपन्न: ${res.migratedCount} रिकॉर्ड्स स्वतः अपडेट किए गए, ${res.reviewCount} समीक्षा हेतु चिन्हित। (${res.alreadyValidCount} पहले से सही)`
          : `Village ID migration completed: ${res.migratedCount} updated, ${res.reviewCount} flagged for review. (${res.alreadyValidCount} already valid)`,
        res.reviewCount > 0 ? 'warning' : 'success'
      );
    } catch (err) {
      console.error('Migration error:', err);
      addToast(err.message || 'Migration failed.', 'error');
    } finally {
      setIsMigratingVillageIds(false);
    }
  };

  const handleConfirmResolveRecordVillage = async () => {
    if (!recordToResolveVillage || !selectedVillageForResolve) return;
    try {
      setIsResolvingVillage(true);
      await resolveUncertainRecordVillage(recordToResolveVillage.id, selectedVillageForResolve);
      addToast(
        language === 'hi'
          ? `रिकॉर्ड "${recordToResolveVillage.familyHeadName || recordToResolveVillage.id}" को सत्यापित गाँव आवंटित किया गया!`
          : `Verified village assigned to record "${recordToResolveVillage.familyHeadName || recordToResolveVillage.id}"!`,
        'success'
      );
      setRecordToResolveVillage(null);
      setSelectedVillageForResolve('');
    } catch (err) {
      console.error('Resolve record village error:', err);
      addToast(err.message || 'Failed to assign village to record.', 'error');
    } finally {
      setIsResolvingVillage(false);
    }
  };

  const handleClearAllData = async () => {
    const confirmMsg = language === 'hi'
      ? 'सावधानी: क्या आप वाकई डेटाबेस और ऐप से सभी (डमी / पुराने) परिवार रिकॉर्ड हटाना चाहते हैं? इसके बाद आप नया असली डेटा अपलोड कर सकेंगे।'
      : 'Caution: Are you sure you want to permanently delete all survey/family records from the database? This action cannot be undone.';

    if (window.confirm(confirmMsg)) {
      try {
        setIsWipingData(true);
        const res = await clearAllSurveyData();
        addToast(
          language === 'hi'
            ? `सफलतापूर्वक डेटाबेस साफ़ हुआ! (${res.count || 0} रिकॉर्ड हटाए गए)`
            : `All survey data wiped successfully! (${res.count || 0} records deleted)`,
          'success'
        );
      } catch (err) {
        console.error('Failed to wipe data:', err);
        addToast(err.message || 'Failed to wipe data', 'error');
      } finally {
        setIsWipingData(false);
      }
    }
  };

  const [isRestoring142, setIsRestoring142] = useState(false);

  const handleRestore142 = async () => {
    const confirmMsg = language === 'hi'
      ? 'क्या आप पुराना डेटा साफ़ करके ठीक 227 प्रामाणिक परिवारों (FAM-0001 से FAM-0227) का स्वच्छ डेटाबेस लोड करना चाहते हैं?'
      : 'Do you want to clean old/duplicate records and load the exact 227 survey families (FAM-0001 to FAM-0227)?';
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsRestoring142(true);
      await loadStandard142Families();
      addToast(
        language === 'hi'
          ? 'सफलतापूर्वक 227 प्रामाणिक परिवार लोड हो गए!'
          : 'Successfully restored 227 survey families!',
        'success'
      );
    } catch (err) {
      console.error('Failed to restore 227 families:', err);
      addToast(err.message || 'Failed to restore 227 families', 'error');
    } finally {
      setIsRestoring142(false);
    }
  };

  // Overall dynamic metrics
  const totalVillages = villageRecords.length;
  const activeVillages = activeVillageRecords.length;
  const totalFamilies = allFamilies.length;
  const totalPopulation = allFamilies.reduce((sum, f) => sum + (f.members?.length || 0), 0);
  const activeSurveyors = allUsers.filter(u => u.role === 'surveyor' && u.status !== 'inactive').length;
  const totalAdmins = allUsers.filter(u => u.role === 'admin').length;

  // Unassigned users awaiting village assignment
  const unassignedUsers = allUsers.filter(u => 
    u.role !== 'admin' && 
    (!u.assignedVillages || u.assignedVillages.length === 0)
  );

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

  // Handle Village Assignment to User
  const handleConfirmAssignVillage = async () => {
    if (!userToAssignVillage) return;
    if (!selectedVillageForAssign) {
      addToast(language === 'hi' ? 'कृपया एक गाँव चुनें।' : 'Please select a village to assign.', 'error');
      return;
    }

    try {
      setIsAssigningVillage(true);
      const villageObj = activeVillageRecords.find(v => v.id === selectedVillageForAssign || v.name === selectedVillageForAssign) || selectedVillageForAssign;
      const res = await assignVillageToUser(userToAssignVillage.uid, villageObj);
      const villageDisplayName = res?.villageName || (typeof villageObj === 'object' ? (villageObj.nameEnglish || villageObj.name) : selectedVillageForAssign);

      addToast(
        language === 'hi'
          ? `${villageDisplayName} सफलतापूर्वक आवंटित किया गया। अब आप ${villageDisplayName} के सभी सर्वे रिकॉर्ड्स देख सकते हैं।`
          : `${villageDisplayName} assigned successfully. You can now access all ${villageDisplayName} survey records.`,
        'success'
      );
      setUserToAssignVillage(null);
      setSelectedVillageForAssign('');
    } catch (err) {
      console.error('Assign village error:', err);
      addToast(err.message || 'Failed to assign village.', 'error');
    } finally {
      setIsAssigningVillage(false);
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
              {language === 'hi' ? 'विलेजपल्स प्रशासन एवं नियंत्रण कक्ष' : 'VillagePulse System Administration'}
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

            <button
              onClick={handleMigrateVillageIds}
              disabled={isMigratingVillageIds}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 disabled:opacity-50"
              title={language === 'hi' ? 'गाँव आईडी सत्यापित एवं माइग्रेट करें' : 'Verify & Migrate Village IDs'}
            >
              <RefreshCw className={`w-4 h-4 ${isMigratingVillageIds ? 'animate-spin' : ''}`} />
              <span>{isMigratingVillageIds
                ? (language === 'hi' ? 'जाँच हो रही है...' : 'Verifying...')
                : (language === 'hi' ? 'गाँव आईडी सत्यापन' : 'Verify Village IDs')}
              </span>
            </button>

            <button
              onClick={handleRestore142}
              disabled={isRestoring142}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 disabled:opacity-50"
              title={language === 'hi' ? '227 प्रामाणिक सर्वे परिवार लोड करें' : 'Load clean 227 survey families'}
            >
              <Sparkles className={`w-4 h-4 ${isRestoring142 ? 'animate-spin' : ''}`} />
              <span>{isRestoring142
                ? (language === 'hi' ? 'लोड हो रहे हैं...' : 'Loading...')
                : (language === 'hi' ? '227 परिवार रीस्टोर' : 'Restore 227 Families')}
              </span>
            </button>

            <button
              onClick={handleClearAllData}
              disabled={isWipingData}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 disabled:opacity-50"
              title={language === 'hi' ? 'डेटाबेस से सभी परिवार साफ़ करें' : 'Wipe all survey families from database'}
            >
              <Trash2 className={`w-4 h-4 ${isWipingData ? 'animate-spin' : ''}`} />
              <span>{isWipingData 
                ? (language === 'hi' ? 'साफ़ हो रहा है...' : 'Wiping...') 
                : (language === 'hi' ? 'सर्वे डेटा मिटाएं' : 'Wipe Survey Data')}
              </span>
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

      {/* Flagged Uncertain Village Records for Admin Review */}
      {needsReviewFamilies.length > 0 && (
        <div className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-amber-950/30 border-amber-800/60' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-amber-200/60 dark:border-amber-800/40">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
                <AlertCircle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>
                    {language === 'hi' 
                      ? `${needsReviewFamilies.length} सर्वे रिकॉर्ड्स में गाँव की समीक्षा आवश्यक` 
                      : `${needsReviewFamilies.length} Survey Records Awaiting Village Association Review`}
                  </span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    {language === 'hi' ? 'समीक्षा आवश्यक' : 'Review Required'}
                  </span>
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  {language === 'hi'
                    ? 'सुरक्षा नियम: पुराने या अनिश्चित रिकॉर्ड्स के गाँव का स्वतः अनुमान नहीं लगाया जाता। कृपया प्रत्येक रिकॉर्ड का सही गाँव सत्यापित कर असाइन करें।'
                    : 'Security Rule: Records with uncertain or missing village associations are never guessed. Please verify and assign the legitimate village.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {needsReviewFamilies.slice(0, 6).map((family) => (
              <div
                key={family.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-amber-200/50 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {family.familyHeadName || family.id}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                      {family.village || 'No Village'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    {family.members?.length || 0} {language === 'hi' ? 'सदस्य' : 'members'} | {family.caste || 'N/A'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                    ID: {family.id}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  <button
                    onClick={() => {
                      setRecordToResolveVillage(family);
                      setSelectedVillageForResolve(activeVillageRecords[0]?.id || 'samodi');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all active:scale-95"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'गाँव असाइन करें' : 'Assign Village'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          {needsReviewFamilies.length > 6 && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-3 text-right">
              {language === 'hi'
                ? `+ ${needsReviewFamilies.length - 6} और रिकॉर्ड समीक्षा हेतु शेष हैं`
                : `+ ${needsReviewFamilies.length - 6} more records pending verification`}
            </p>
          )}
        </div>
      )}

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

      {/* SECTION 1.5: Unassigned Users Awaiting Village Assignment */}
      <div className={`p-6 rounded-3xl border transition-all ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>{language === 'hi' ? 'गाँव आवंटन प्रतीक्षारत यूज़र (Unassigned Users)' : 'Unassigned Users (Awaiting Village)'}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  unassignedUsers.length > 0 
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25' 
                    : 'bg-green-500/10 text-green-600 dark:text-green-400'
                }`}>
                  {unassignedUsers.length} {language === 'hi' ? 'प्रतीक्षारत' : 'Awaiting Assignment'}
                </span>
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {language === 'hi'
                ? 'वे नए पंजीकृत सर्वेयर जिन्हें अभी तक कोई गाँव आवंटित नहीं किया गया है। उन्हें सर्वेक्षण शुरू करने के लिए यहाँ से गाँव आवंटित करें।'
                : 'Surveyor accounts created without a village assignment. Assign an active village below to grant survey capabilities.'}
            </p>
          </div>
        </div>

        {unassignedUsers.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border ${darkMode ? 'bg-gray-800/40 border-gray-800' : 'bg-gray-50/70 border-gray-200'}`}>
            <CheckCircle2 className="w-10 h-10 mx-auto text-green-500 mb-2 opacity-80" />
            <p className="font-semibold text-sm text-gray-900 dark:text-white">
              {language === 'hi' ? 'सभी सर्वेयर यूज़र्स को गाँव आवंटित हैं!' : 'All surveyors currently have active village assignments!'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {language === 'hi' ? 'कोई भी नया यूज़र प्रतीक्षारत नहीं है।' : 'No unassigned users awaiting approval.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unassignedUsers.map((user) => {
              const isSelf = user.uid === currentUser?.uid;
              const isSuperAdmin = user.uid === 'sJwiZZ6cf8Ze8YAmMMK8T1FwF232';
              const isUserActive = user.status !== 'inactive';

              return (
                <div
                  key={user.uid}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    darkMode ? 'bg-amber-950/15 border-amber-900/40' : 'bg-amber-50/50 border-amber-200/70'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                            {user.name || 'Unnamed Surveyor'}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase shrink-0 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        {language === 'hi' ? 'प्रतीक्षारत' : 'Unassigned'}
                      </span>
                    </div>

                    <div className="text-[11px] space-y-1 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">UID:</span>
                        <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 truncate max-w-[140px]" title={user.uid}>
                          {user.uid}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">{language === 'hi' ? 'स्थिति:' : 'Status:'}</span>
                        <span className={`text-[10px] font-semibold ${isUserActive ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                          {isUserActive ? (language === 'hi' ? 'सक्रिय खाता' : 'Active Account') : (language === 'hi' ? 'निष्क्रिय' : 'Inactive')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 mt-3 border-t border-amber-200/50 dark:border-amber-900/30">
                    <button
                      type="button"
                      onClick={() => {
                        setUserToAssignVillage(user);
                        setSelectedVillageForAssign(activeVillageRecords[0]?.id || activeVillageRecords[0]?.name || '');
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 text-white text-xs font-semibold shadow-xs hover:shadow-sm active:scale-95 transition-all"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'गाँव आवंटित करें' : 'Assign Village'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserToDelete(user)}
                      disabled={isSelf || isSuperAdmin}
                      className="p-1.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title={language === 'hi' ? 'यूज़र हटाएं' : 'Delete User'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                      ) : (() => {
                        const uniqueVillages = getUniqueAssignedVillageNames(user, activeVillageRecords, language);
                        return uniqueVillages.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {uniqueVillages.map(v => (
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
                        );
                      })()}
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

      {/* Assign Village Modal */}
      {userToAssignVillage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 space-y-4 transition-all ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <MapPin className="w-5 h-5" />
                <span>{language === 'hi' ? 'गाँव आवंटित करें (Assign Village)' : 'Assign Village to Surveyor'}</span>
              </h2>
              <button 
                onClick={() => setUserToAssignVillage(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* User preview */}
              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                  {userToAssignVillage.name || 'Unnamed Surveyor'}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs truncate mt-0.5">
                  {userToAssignVillage.email}
                </p>
                <p className="font-mono text-[10px] text-gray-400 mt-1 truncate">
                  UID: {userToAssignVillage.uid}
                </p>
              </div>

              {/* Village Selector */}
              <div>
                <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  {language === 'hi' ? 'सक्रिय गाँव चुनें *' : 'Select Active Village *'}
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {activeVillageRecords.map((v) => {
                    const isSelected = selectedVillageForAssign === v.id || selectedVillageForAssign === v.name;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVillageForAssign(v.id || v.name)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 shadow-xs'
                            : (darkMode ? 'bg-gray-800/40 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300')
                        }`}
                      >
                        <div className="min-w-0">
                          <p className={`font-bold text-xs ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                            {v.nameHindi || v.name}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {v.nameEnglish} • <span className="font-mono text-[10px]">ID: {v.id}</span>
                          </p>
                        </div>
                        <input
                          type="radio"
                          name="assignedVillage"
                          checked={isSelected}
                          onChange={() => setSelectedVillageForAssign(v.id || v.name)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 text-[11px] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500" />
                <span>
                  {language === 'hi'
                    ? 'गाँव आवंटित होते ही यह यूज़र तुरंत सक्रिय हो जाएगा और केवल इस गाँव के सर्वेक्षण रिकॉर्ड्स दर्ज व देख सकेगा।'
                    : 'Once assigned, this surveyor will be active and strictly permitted to survey and view records for this village.'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                disabled={isAssigningVillage}
                onClick={() => setUserToAssignVillage(null)}
                className="px-4 py-2.5 rounded-xl border text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isAssigningVillage || !selectedVillageForAssign}
                onClick={handleConfirmAssignVillage}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <MapPin className="w-4 h-4" />
                <span>
                  {isAssigningVillage
                    ? (language === 'hi' ? 'आवंटित कर रहे हैं...' : 'Assigning...')
                    : (language === 'hi' ? 'गाँव आवंटित करें' : 'Confirm Assignment')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal — Complete Account Removal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 space-y-4 transition-all ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5" />
                <span>{language === 'hi' ? 'यूज़र खाता स्थायी रूप से हटाएं' : 'Complete Account Removal'}</span>
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
                <div className="space-y-1">
                  <p className="font-bold">
                    {language === 'hi' ? 'फ़ायरबेस प्रमाणीकरण एवं डेटाबेस विलोपन' : 'Firebase Authentication & Database Removal'}
                  </p>
                  <p className="text-red-600 dark:text-red-300 leading-relaxed">
                    {language === 'hi'
                      ? 'इस यूज़र का खाता Firebase Authentication से हटा दिया जाएगा, सभी सत्र (Sessions) रद्द कर दिए जाएंगे और सिस्टम एक्सेस स्थायी रूप से समाप्त हो जाएगा।'
                      : 'This user account will be permanently removed from Firebase Authentication. All active refresh tokens/sessions will be revoked.'}
                  </p>
                </div>
              </div>

              {/* User summary preview */}
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {userToDelete.name?.charAt(0)?.toUpperCase() || userToDelete.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{userToDelete.name || 'Unnamed User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userToDelete.email}</p>
                    <p className="font-mono text-[10px] text-gray-400 truncate mt-0.5">UID: {userToDelete.uid}</p>
                    <div className="flex items-center gap-2 mt-1.5">
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

              {/* Data retention assurance notice */}
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <span>
                  {language === 'hi'
                    ? 'डेटा सुरक्षा गारंटी: इस यूज़र द्वारा पूर्व में दर्ज किए गए सभी परिवार एवं सर्वेक्षण रिकॉर्ड्स ऑडिट व रिपोर्टिंग के लिए डेटाबेस में पूरी तरह सुरक्षित रहेंगे।'
                    : 'Data Retention Assurance: All historical family records and surveys submitted by this user will remain fully preserved for audit integrity.'}
                </span>
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
                    ? (language === 'hi' ? 'हटा रहे हैं...' : 'Deleting Account...')
                    : (language === 'hi' ? 'हाँ, खाता हटाएं' : 'Yes, Delete Account')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Village to Uncertain Record Modal */}
      {recordToResolveVillage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 space-y-4 transition-all ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <MapPin className="w-5 h-5" />
                <span>{language === 'hi' ? 'सर्वे रिकॉर्ड को गाँव असाइन करें' : 'Verify & Assign Village to Record'}</span>
              </h2>
              <button 
                onClick={() => setRecordToResolveVillage(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <p className="font-bold text-sm text-gray-900 dark:text-white">
                  {recordToResolveVillage.familyHeadName || recordToResolveVillage.id}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono truncate">
                  Record ID: {recordToResolveVillage.id}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-600 dark:text-gray-300">
                  <span>Current Raw Village: <strong className="text-amber-600">{recordToResolveVillage.village || 'Empty'}</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  {language === 'hi' ? 'सत्यापित गाँव चुनें:' : 'Select Verified Village:'}
                </label>
                <select
                  value={selectedVillageForResolve}
                  onChange={(e) => setSelectedVillageForResolve(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">{language === 'hi' ? '-- गाँव चुनें --' : '-- Select Village --'}</option>
                  {activeVillageRecords.map((v) => (
                    <option key={v.id} value={v.id}>
                      {language === 'hi' ? (v.nameHindi || v.name) : (v.nameEnglish || v.name)} ({v.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <span>
                  {language === 'hi'
                    ? 'गाँव आवंटित करने पर यह रिकॉर्ड उस गाँव के सभी प्राधिकृत सर्वेयरों को तुरंत स्वचालित रूप से दिखाई देने लगेगा।'
                    : 'Assigning a village immediately grants access to all surveyors authorized for this village.'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                disabled={isResolvingVillage}
                onClick={() => setRecordToResolveVillage(null)}
                className="px-4 py-2.5 rounded-xl border text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isResolvingVillage || !selectedVillageForResolve}
                onClick={handleConfirmResolveRecordVillage}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <MapPin className="w-4 h-4" />
                <span>
                  {isResolvingVillage
                    ? (language === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...')
                    : (language === 'hi' ? 'सत्यापित करें एवं सहेजें' : 'Confirm Village')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
