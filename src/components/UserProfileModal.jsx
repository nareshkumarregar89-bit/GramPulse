import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  User,
  Mail,
  Shield,
  Building2,
  CheckCircle2,
  Copy,
  Check,
  LogOut,
  Moon,
  Sun,
  Languages,
  FileText,
  Users,
  KeyRound,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { getUniqueAssignedVillageNames } from '../utils/villageUtils';

export function UserProfileModal({ isOpen, onClose }) {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const { darkMode, setDarkMode, language, setLanguage, allFamilies, families, activeVillageRecords = [] } = useData();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [copiedField, setCopiedField] = useState('');

  if (!isOpen || !currentUser) return null;

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast(
      language === 'hi' 
        ? `${fieldName} क्लिपबोर्ड पर कॉपी हो गया!` 
        : `${fieldName} copied to clipboard!`, 
      'info'
    );
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleLogout = async () => {
    try {
      onClose();
      await logout();
      addToast(language === 'hi' ? 'सफलतापूर्वक लॉगआउट हुए!' : 'Logged out successfully!', 'success');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      addToast(language === 'hi' ? 'लॉगआउट विफल हुआ।' : 'Failed to logout.', 'error');
    }
  };

  // User details
  const name = userProfile?.name || currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'User');
  const email = currentUser.email || userProfile?.email || 'No email';
  const role = userProfile?.role || (isAdmin ? 'admin' : 'surveyor');
  const roleLabel = role === 'admin' 
    ? (language === 'hi' ? 'सुपर एडमिन (Super Admin)' : 'Super Admin')
    : (language === 'hi' ? 'गाँव सर्वेयर (Village Surveyor)' : 'Village Surveyor');
  const uniqueAssignedVillages = getUniqueAssignedVillageNames(userProfile, activeVillageRecords, language);
  const initial = name.charAt(0).toUpperCase();

  // Statistics (Village-wide shared access & personal submissions)
  const userFamilies = (allFamilies || []).filter(
    f => f.surveyorId === currentUser.uid || f.surveyorEmail === currentUser.email || f.createdBy === currentUser.uid
  );
  const accessibleVillageSurveys = (allFamilies || []).length;
  const personalSurveysCount = userFamilies.length;
  const totalMembersCount = (allFamilies || []).reduce(
    (acc, f) => acc + (f.members?.length || 0), 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Backdrop overlay dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal / Card Container */}
      <div 
        className={`
          relative w-full sm:max-w-md md:max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border
          ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'}
          z-10 transition-all duration-300
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Profile Banner */}
        <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-indigo-600 p-6 pt-7 text-white shrink-0">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/35 text-white transition-all backdrop-blur-xs"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User Avatar & Name */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white text-green-700 font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-lg border-2 border-white/40">
                {initial}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 border-2 border-white rounded-full flex items-center justify-center shadow-xs">
                <span className="w-2 h-2 bg-emerald-800 rounded-full animate-ping" />
              </span>
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-xs ${
                  isAdmin 
                    ? 'bg-amber-400 text-amber-950' 
                    : 'bg-white/20 text-white backdrop-blur-xs'
                }`}>
                  <Shield className="w-3 h-3" />
                  {isAdmin ? 'Admin' : 'Surveyor'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-100 bg-white/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  {language === 'hi' ? 'सक्रिय खाता' : 'Active Account'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5 truncate">
                {name}
              </h2>
              <p className="text-xs sm:text-sm text-green-100/90 truncate font-mono">
                {email}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Profile Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 scrollbar-thin">
          
          {/* Surveyor Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-gray-800/60 border-gray-700/80' : 'bg-emerald-50/60 border-emerald-100'}`}>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                <FileText className="w-4 h-4" />
                <span>{isAdmin ? (language === 'hi' ? 'कुल सर्वे' : 'Total Surveys') : (language === 'hi' ? 'गाँव के कुल सर्वे' : 'Village Survey Access')}</span>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {accessibleVillageSurveys}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {language === 'hi' ? 'साझा गाँव अधिकार' : 'Accessible village records'}
              </p>
            </div>

            {!isAdmin && (
              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-gray-800/60 border-gray-700/80' : 'bg-teal-50/60 border-teal-100'}`}>
                <div className="flex items-center gap-2 text-xs font-medium text-teal-600 dark:text-teal-400 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'hi' ? 'व्यक्तिगत सबमिशन' : 'My Submissions'}</span>
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {personalSurveysCount}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {language === 'hi' ? 'आपके द्वारा दर्ज' : 'Submitted by you'}
                </p>
              </div>
            )}

            <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-gray-800/60 border-gray-700/80' : 'bg-indigo-50/60 border-indigo-100'}`}>
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                <Users className="w-4 h-4" />
                <span>{language === 'hi' ? 'कुल सदस्य' : 'Total Members'}</span>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {totalMembersCount}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {language === 'hi' ? 'नागरिक रिकॉर्ड' : 'Citizens recorded'}
              </p>
            </div>
          </div>

          {/* User Identification Section */}
          <div className={`p-4 rounded-2xl border space-y-3.5 ${darkMode ? 'bg-gray-800/40 border-gray-700/80' : 'bg-gray-50/80 border-gray-200/80'}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {language === 'hi' ? 'खाता विवरण (User Details)' : 'User Details'}
            </h3>

            {/* Email */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-2 rounded-xl shrink-0 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600 shadow-xs'}`}>
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{language === 'hi' ? 'ईमेल आईडी' : 'Email Address'}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{email}</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(email, 'Email')}
                className={`p-2 rounded-xl transition-all ${
                  copiedField === 'Email' 
                    ? 'bg-green-500 text-white' 
                    : darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-white text-gray-500'
                }`}
                title="Copy Email"
              >
                {copiedField === 'Email' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* User ID (UID) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-2 rounded-xl shrink-0 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600 shadow-xs'}`}>
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{language === 'hi' ? 'यूज़र आईडी (UID)' : 'User UID'}</p>
                  <p className="text-xs font-mono font-medium text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">{currentUser.uid}</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(currentUser.uid, 'UID')}
                className={`p-2 rounded-xl transition-all ${
                  copiedField === 'UID' 
                    ? 'bg-green-500 text-white' 
                    : darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-white text-gray-500'
                }`}
                title="Copy UID"
              >
                {copiedField === 'UID' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Role & Permissions */}
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl shrink-0 ${darkMode ? 'bg-gray-700 text-amber-400' : 'bg-white text-amber-600 shadow-xs'}`}>
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{language === 'hi' ? 'भूमिका एवं अधिकार' : 'Role & Access'}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{roleLabel}</p>
              </div>
            </div>

            {/* Assigned Villages */}
            <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {isAdmin 
                    ? (language === 'hi' ? 'सिस्टम अधिकार:' : 'System Access:') 
                    : (language === 'hi' ? 'आवंटित गाँव (Assigned Villages):' : 'Assigned Villages:')}
                </span>
              </div>
              
              {isAdmin ? (
                <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/50">
                  <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    {language === 'hi' 
                      ? '🌐 सभी गाँवों का पूर्ण प्रबंधन, एक्सेल इम्पोर्ट एवं सर्वेयर आवंटन अधिकार प्राप्त है।' 
                      : '🌐 Full global access across all villages, Excel import & Surveyor management.'}
                  </p>
                </div>
              ) : uniqueAssignedVillages.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {uniqueAssignedVillages.map((village) => (
                    <span 
                      key={village}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                    >
                      <Building2 className="w-3 h-3" />
                      {village}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                  {language === 'hi' ? 'कोई गाँव आवंटित नहीं है। कृपया एडमिन से संपर्क करें।' : 'No village assigned yet. Contact administrator.'}
                </p>
              )}
            </div>
          </div>

          {/* Quick Preferences: Theme & Language */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                darkMode 
                  ? 'bg-gray-800/80 border-gray-700 hover:bg-gray-700' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                <div>
                  <p className="text-xs font-semibold">{darkMode ? 'Dark Mode' : 'Light Mode'}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{darkMode ? 'Active' : 'Off'}</p>
                </div>
              </div>
              <span className={`w-8 h-4 rounded-full p-0.5 transition-colors ${darkMode ? 'bg-green-500' : 'bg-gray-300'}`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </span>
            </button>

            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className={`p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                darkMode 
                  ? 'bg-gray-800/80 border-gray-700 hover:bg-gray-700' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-xs font-semibold">{language === 'hi' ? 'हिंदी (HI)' : 'English (EN)'}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{language === 'hi' ? 'बदलें' : 'Switch'}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-green-600 dark:text-green-400">
                {language === 'hi' ? 'HI' : 'EN'}
              </span>
            </button>
          </div>

          {/* Quick Shortcuts */}
          {isAdmin ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onClose();
                  navigate('/users');
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>{language === 'hi' ? 'यूज़र प्रबंधन' : 'Manage Users'}</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate('/settings');
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === 'hi' ? 'गाँव सेटिंग्स' : 'Village Settings'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onClose();
                navigate('/survey');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-green-500 to-indigo-600 text-white shadow-sm hover:shadow-md transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>{language === 'hi' ? 'नया सर्वे शुरू करें' : 'Start New Survey'}</span>
            </button>
          )}

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-sm border border-red-200 dark:border-red-900/50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>{language === 'hi' ? 'खाते से लॉगआउट करें' : 'Logout of Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
