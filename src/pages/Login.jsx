import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  Shield, 
  ShieldAlert, 
  Clock, 
  CheckCircle2,
  KeyRound,
  X 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export function Login() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback state
  const [error, setError] = useState('');
  const [pendingNotice, setPendingNotice] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Forgot Password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState({ type: '', message: '' });

  const { login, signup, signInWithGoogle, sendUserPasswordReset, authError } = useAuth();
  const { darkMode, setDarkMode, language, setLanguage } = useData();
  const navigate = useNavigate();

  // Reset Password Handler
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetStatus({ type: '', message: '' });

    if (!resetEmail.trim()) {
      setResetStatus({
        type: 'error',
        message: language === 'hi' ? 'कृपया अपनी ईमेल आईडी दर्ज करें।' : 'Please enter your email address.'
      });
      return;
    }

    try {
      setIsResetLoading(true);
      await sendUserPasswordReset(resetEmail.trim());
      setResetStatus({
        type: 'success',
        message: language === 'hi'
          ? `पासवर्ड रीसेट लिंक आपके ईमेल (${resetEmail.trim()}) पर भेज दिया गया है! कृपया अपना इनबॉक्स और स्पैम फ़ोल्डर चेक करें।`
          : `Password reset link has been sent to ${resetEmail.trim()}! Please check your inbox and spam folder.`
      });
    } catch (err) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setResetStatus({
          type: 'error',
          message: language === 'hi' ? 'इस ईमेल आईडी से कोई खाता पंजीकृत नहीं है।' : 'No account found with this email address.'
        });
      } else if (err.code === 'auth/invalid-email') {
        setResetStatus({
          type: 'error',
          message: language === 'hi' ? 'अमान्य ईमेल आईडी। कृपया सही ईमेल दर्ज करें।' : 'Invalid email address.'
        });
      } else {
        setResetStatus({
          type: 'error',
          message: err.message || (language === 'hi' ? 'ईमेल भेजने में विफल। कृपया पुनः प्रयास करें।' : 'Failed to send reset email.')
        });
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  // Reset feedback when switching tabs
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError('');
    setPendingNotice(false);
    setSuccessMessage('');
  };

  // Google Sign-In / Registration
  const handleGoogleSignIn = async () => {
    setError('');
    setPendingNotice(false);
    setSuccessMessage('');
    try {
      setIsGoogleLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (err.message === 'ACCOUNT_PENDING') {
        setPendingNotice(true);
      } else if (err.message === 'ACCOUNT_INACTIVE') {
        setError(
          language === 'hi'
            ? 'यह खाता व्यवस्थापक (Admin) द्वारा निष्क्रिय (Deactivated) कर दिया गया है।'
            : 'This account has been deactivated by the administrator.'
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setError(
          language === 'hi'
            ? 'Firebase Console में Google Sign-in सक्षम (Enable) नहीं है। कृपया Firebase Console में Authentication -> Sign-in method में Google चालू करें।'
            : 'Google Sign-In is not enabled in Firebase Console. Please enable it in Authentication -> Sign-in method.'
        );
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(
          language === 'hi'
            ? 'यह डोमेन Firebase Authorized Domains में नहीं है। कृपया Firebase Console में इसे जोड़ें।'
            : 'This domain is not authorized in Firebase Console. Add it under Authorized Domains.'
        );
      } else {
        setError(err.message || 'Google sign-in failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPendingNotice(false);
    setSuccessMessage('');

    if (!loginEmail || !loginPassword) {
      setError(language === 'hi' ? 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें।' : 'Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      await login(loginEmail.trim(), loginPassword);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      if (err.message === 'ACCOUNT_PENDING') {
        setPendingNotice(true);
      } else if (err.message === 'ACCOUNT_INACTIVE') {
        setError(
          language === 'hi'
            ? 'आपका खाता व्यवस्थापक (Admin) द्वारा निष्क्रिय (Deactivated) कर दिया गया है।'
            : 'Your account has been deactivated by the administrator.'
        );
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError(language === 'hi' ? 'गलत ईमेल या पासवर्ड। कृपया पुनः प्रयास करें।' : 'Invalid email or password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError(language === 'hi' ? 'अमान्य ईमेल आईडी। कृपया सही ईमेल दर्ज करें।' : 'Invalid email address format.');
      } else if (err.code === 'auth/too-many-requests') {
        setError(language === 'hi' ? 'अत्यधिक प्रयास। कृपया थोड़ी देर बाद पुनः प्रयास करें।' : 'Too many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPendingNotice(false);
    setSuccessMessage('');

    if (!signupName.trim()) {
      setError(language === 'hi' ? 'कृपया अपना पूरा नाम दर्ज करें।' : 'Please enter your full name.');
      return;
    }
    if (!signupEmail.trim()) {
      setError(language === 'hi' ? 'कृपया अपना ईमेल दर्ज करें।' : 'Please enter your email.');
      return;
    }
    if (signupPassword.length < 6) {
      setError(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setError(language === 'hi' ? 'पासवर्ड और पासवर्ड पुष्टि मेल नहीं खाते।' : 'Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      await signup(signupEmail.trim(), signupPassword, signupName.trim());
      
      // Successfully registered and pending admin approval
      setSuccessMessage(
        language === 'hi'
          ? '🎉 आपका खाता सफलतापूर्वक बन गया है! सुरक्षा कारणों से, एडमिन द्वारा स्वीकृत (Approve) किए जाने के बाद आप लॉगिन कर सकेंगे।'
          : '🎉 Account registered successfully! For security, access will be granted once approved by the administrator.'
      );
      
      // Populate login email and switch to login tab
      setLoginEmail(signupEmail.trim());
      setLoginPassword('');
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setActiveTab('login');
    } catch (err) {
      console.error('Sign Up error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError(
          language === 'hi'
            ? 'यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें।'
            : 'This email is already registered. Please sign in instead.'
        );
      } else if (err.code === 'auth/weak-password') {
        setError(
          language === 'hi'
            ? 'पासवर्ड बहुत कमजोर है। कृपया कम से कम 6 अक्षरों का मजबूत पासवर्ड रखें।'
            : 'Password is too weak. Please use at least 6 characters.'
        );
      } else if (err.code === 'auth/invalid-email') {
        setError(
          language === 'hi'
            ? 'अमान्य ईमेल आईडी। कृपया सही ईमेल दर्ज करें।'
            : 'Invalid email address.'
        );
      } else {
        setError(err.message || 'Registration failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
      darkMode ? 'bg-gray-950 text-white' : 'bg-gradient-to-br from-green-50 via-gray-50 to-indigo-50 text-gray-900'
    }`}>
      {/* Top right quick controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-2xs ${
            darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-800'
          }`}
        >
          {language === 'en' ? 'हिन्दी' : 'English'}
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-xl border text-xs transition-colors shadow-2xs ${
            darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-800'
          }`}
          aria-label="Toggle Theme"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="w-full max-w-md my-8">
        {/* Card */}
        <div className={`p-6 sm:p-8 rounded-3xl shadow-2xl border transition-all ${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <img 
              src="/logo.png" 
              alt="VillagePulse Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto object-contain drop-shadow-lg mb-3" 
            />
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-green-600 to-indigo-600 bg-clip-text text-transparent">
              VillagePulse
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {language === 'hi' ? 'ग्राम सर्वेक्षण प्रबंधन पोर्टल' : 'Village Survey Management Portal'}
            </p>
          </div>

          {/* Mode Switch Tabs (Login / Sign Up) */}
          <div className={`flex rounded-2xl p-1 mb-6 border ${
            darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-100 border-gray-200'
          }`}>
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-green-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{language === 'hi' ? 'लॉगिन (Sign In)' : 'Sign In'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch('signup')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'signup'
                  ? 'bg-gradient-to-r from-green-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'hi' ? 'साइन अप (Sign Up)' : 'Sign Up'}</span>
            </button>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Pending Approval Notice */}
          {pendingNotice && (
            <div className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-start gap-2.5 leading-relaxed">
              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {language === 'hi' ? 'खाता अप्रूवल की प्रतीक्षा में है' : 'Account Pending Approval'}
                </p>
                <p className="mt-1 text-xs opacity-90">
                  {language === 'hi'
                    ? 'आपका खाता सफलतापूर्वक पंजीकृत है, लेकिन सुरक्षा कारणों से अभी व्यवस्थापक (Admin) की स्वीकृति की प्रतीक्षा में है। व्यवस्थापक द्वारा अप्रूव किए जाने के बाद आप पोर्टल में लॉगिन कर सकेंगे।'
                    : 'Your account is registered but awaiting administrator approval. You will be able to access the portal once approved.'}
                </p>
              </div>
            </div>
          )}

          {/* General Error Alert */}
          {(error || (authError && authError !== 'ACCOUNT_PENDING' && authError !== 'ACCOUNT_INACTIVE')) && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-500" />
              <span>{error || authError}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  {language === 'hi' ? 'ईमेल आईडी' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={language === 'hi' ? 'अपना ईमेल दर्ज करें' : 'name@villagepulse.com'}
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                      darkMode
                        ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {language === 'hi' ? 'पासवर्ड' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(loginEmail || '');
                      setResetStatus({ type: '', message: '' });
                      setIsForgotPasswordOpen(true);
                    }}
                    className="text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline transition-colors"
                  >
                    {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm outline-none transition-all ${
                      darkMode
                        ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-green-600 to-indigo-600 hover:from-green-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-green-500/25 active:scale-98 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{language === 'hi' ? 'लॉगिन करें (Sign In)' : 'Sign In'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: SIGN UP FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder={language === 'hi' ? 'उदा. राहुल शर्मा' : 'e.g. Rahul Sharma'}
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      darkMode
                        ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'hi' ? 'ईमेल आईडी' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder={language === 'hi' ? 'name@villagepulse.com' : 'name@villagepulse.com'}
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      darkMode
                        ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'hi' ? 'नया पासवर्ड बनाएं (कम से कम 6 अक्षर)' : 'Create New Password (min 6 characters)'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      darkMode
                        ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label="Toggle password visibility"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  {language === 'hi' 
                    ? '💡 नोट: यह पासवर्ड इस वेबसाइट के लिए नया बनेगा (अपने असली Gmail का पासवर्ड डालने की आवश्यकता नहीं है)।' 
                    : '💡 Note: Create a new password for this website. Do not enter your real email password.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'hi' ? 'पासवर्ड की दोबारा पुष्टि करें' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      darkMode
                        ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] leading-relaxed flex items-center gap-2">
                <Shield className="w-4 h-4 shrink-0 text-indigo-500" />
                <span>
                  {language === 'hi' 
                    ? 'सुरक्षा नियम: नया खाता बनने के बाद एडमिन द्वारा स्वीकृत (Approve) होने पर ही सक्रिय होगा।' 
                    : 'Security notice: New surveyor accounts will be activated upon administrator approval.'}
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-600 to-indigo-600 hover:from-green-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-green-500/25 active:scale-98 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{language === 'hi' ? 'खाता बनाएं (Create Account)' : 'Create Account'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className={`px-3 font-semibold text-gray-500 dark:text-gray-400 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                {language === 'hi' ? 'या Google के साथ' : 'Or continue with'}
              </span>
            </div>
          </div>

          {/* Google Sign-in / Sign-up Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-98 disabled:opacity-50 ${
              darkMode
                ? 'bg-gray-800/80 hover:bg-gray-700/80 border-gray-700 text-white shadow-xs'
                : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700 shadow-xs hover:border-gray-400'
            }`}
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {activeTab === 'login'
                    ? (language === 'hi' ? 'Google से लॉगिन करें' : 'Sign in with Google')
                    : (language === 'hi' ? 'Google से साइन अप करें' : 'Sign up with Google')}
                </span>
              </>
            )}
          </button>

          {/* Quick Switch Link at bottom */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 text-center">
            {activeTab === 'login' ? (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'hi' ? 'क्या आपका कोई खाता नहीं है?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signup')}
                  className="font-bold text-green-600 dark:text-green-400 hover:underline inline-flex items-center gap-1"
                >
                  {language === 'hi' ? 'नया खाता बनाएं (Sign Up)' : 'Create an Account'}
                </button>
              </p>
            ) : (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'hi' ? 'पहले से खाता मौजूद है?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  {language === 'hi' ? 'लॉगिन करें (Sign In)' : 'Sign In'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-6 sm:p-7 rounded-3xl border shadow-2xl transition-all ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">
                    {language === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset Password'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {language === 'hi' ? 'पंजीकृत ईमेल पर रीसेट लिंक प्राप्त करें' : 'Get password reset link on registered email'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetStatus.message && (
              <div className={`mb-4 p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 leading-relaxed ${
                resetStatus.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
              }`}>
                {resetStatus.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                )}
                <span>{resetStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  {language === 'hi' ? 'पंजीकृत ईमेल आईडी' : 'Registered Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@villagepulse.com"
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                      darkMode
                        ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                  {language === 'hi'
                    ? 'हम इस ईमेल पर एक सुरक्षित पासवर्ड रीसेट लिंक भेजेंगे जिससे आप नया पासवर्ड बना सकेंगे।'
                    : "We'll send a secure password reset link to this email address."}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                    darkMode
                      ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {language === 'hi' ? 'रद्द करें (Cancel)' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isResetLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-600 to-indigo-600 hover:from-green-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isResetLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>{language === 'hi' ? 'रीसेट लिंक भेजें' : 'Send Reset Link'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
