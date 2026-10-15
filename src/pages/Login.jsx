import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, LogIn, Shield, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, signInWithGoogle, authError } = useAuth();
  const { darkMode, setDarkMode, language, setLanguage } = useData();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      setIsGoogleLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (err.code === 'auth/operation-not-allowed') {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(language === 'hi' ? 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें।' : 'Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError(language === 'hi' ? 'गलत ईमेल या पासवर्ड। कृपया पुनः प्रयास करें।' : 'Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError(language === 'hi' ? 'अत्यधिक प्रयास। कृपया थोड़ी देर बाद पुनः प्रयास करें।' : 'Too many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please check credentials.');
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
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
            darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-100'
          }`}
        >
          {language === 'en' ? 'हिन्दी' : 'English'}
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-xl border text-xs transition-colors ${
            darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-100'
          }`}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Card */}
        <div className={`p-8 rounded-3xl shadow-2xl border transition-all ${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <img 
              src="/logo.png" 
              alt="VillagePulse Logo" 
              className="w-20 h-20 mx-auto object-contain drop-shadow-lg mb-4" 
            />
            <h1 className="text-2xl font-bold tracking-tight">VillagePulse</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {language === 'hi' ? 'ग्राम सर्वेक्षण प्रबंधन पोर्टल' : 'Village Survey Management Portal'}
            </p>
          </div>

          {/* Error Message */}
          {(error || authError) && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0" />
              <span>{error || authError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                {language === 'hi' ? 'ईमेल आईडी' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'hi' ? 'अपना ईमेल दर्ज करें' : 'name@villagepulse.com'}
                  required
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                    darkMode
                      ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                {language === 'hi' ? 'पासवर्ड' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full pl-11 pr-11 py-3 rounded-xl border text-sm outline-none transition-all ${
                    darkMode
                      ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-green-600 to-indigo-600 hover:from-green-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-green-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{language === 'hi' ? 'लॉगिन करें' : 'Sign In'}</span>
                </>
              )}
            </button>
          </form>

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

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-semibold text-sm transition-all duration-200 active:scale-98 disabled:opacity-50 ${
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
                <span>{language === 'hi' ? 'Google से लॉगिन करें' : 'Sign in with Google'}</span>
              </>
            )}
          </button>

          {/* Footer note */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'hi'
                ? 'अधिकृत सर्वेयर और एडमिन एक्सेस के लिए।'
                : 'Authorized Surveyor & Administrator Access Only.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
