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
  const { login } = useAuth();
  const { darkMode, setDarkMode, language, setLanguage } = useData();
  const navigate = useNavigate();

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
              alt="GramPulse Logo" 
              className="w-20 h-20 mx-auto object-contain drop-shadow-lg mb-4" 
            />
            <h1 className="text-2xl font-bold tracking-tight">GramPulse</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {language === 'hi' ? 'ग्राम सर्वेक्षण प्रबंधन पोर्टल' : 'Village Survey Management Portal'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0" />
              <span>{error}</span>
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
                  placeholder={language === 'hi' ? 'अपना ईमेल दर्ज करें' : 'name@grampulse.com'}
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
