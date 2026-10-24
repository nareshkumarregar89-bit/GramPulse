import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SHADOWS, SIZES } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

export function LoginScreen({ navigation }) {
  const { login, authError } = useAuth();
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  const { t, isHindi, toggleLanguage } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMsg(
        isHindi
          ? 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें।'
          : 'Please enter both your email address and password.'
      );
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setErrorMsg(
        err.message ||
          (isHindi
            ? 'लॉगिन विफल। कृपया अपनी क्रेडेंशियल जांचें।'
            : 'Login failed. Please check your credentials.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Brand Banner with Official Logo */}
        <View style={[styles.heroSection, { backgroundColor: isDarkMode ? '#022C22' : colors.primary }]}>
          {/* Top Quick Controls: Language & Theme */}
          <View style={styles.topControlRow}>
            <TouchableOpacity
              style={styles.langTogglePill}
              onPress={toggleLanguage}
              activeOpacity={0.75}
            >
              <Ionicons name="globe-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.langTogglePillText}>{isHindi ? 'हिंदी' : 'English'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.themeToggleBtn}
              onPress={toggleDarkMode}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isDarkMode ? 'sunny' : 'moon'}
                size={16}
                color={isDarkMode ? '#FBBF24' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>

          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>VillagePulse</Text>
          <Text style={styles.heroSubtitle}>
            {isHindi ? 'विलेज पल्स • Rural Census & Family Dossier' : 'VillagePulse • Rural Census & Household Intelligence'}
          </Text>
          <View style={styles.govBadge}>
            <Text style={styles.govBadgeText}>Official Panchayat Survey Portal</Text>
          </View>
        </View>

        {/* Login Card */}
        <View style={[styles.card, SHADOWS.md, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>
            {t('loginTitle', 'Surveyor & Admin Login')}
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            {t('loginSub', 'अपने आधिकारिक खाते से लॉगिन करें')}
          </Text>

          {Boolean(errorMsg || authError) && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight || '#FEE2E2', borderColor: '#FCA5A5' }]}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg || authError}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              {t('officialEmail', 'Official Email (आधिकारिक ईमेल)')}
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="name@villagepulse.gov.in"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              {t('password', 'Password (पासवर्ड)')}
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}
          >
            <Text style={[styles.forgotBtnText, { color: colors.primary }]}>
              {t('forgotPassword', 'Forgot Password? (पासवर्ड भूल गए?)')}
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }, SHADOWS.sm, isSubmitting && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {t('loginBtn', 'Login to Dashboard (लॉगिन करें)')}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
          </View>

          {/* Switch to Register */}
          <TouchableOpacity
            style={[styles.registerLink, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={[styles.registerLinkText, { color: colors.textSecondary }]}>
              {t('dontHaveAccount', 'New Surveyor?')}{' '}
              <Text style={[styles.registerLinkBold, { color: colors.primary }]}>
                {t('registerHere', 'Register for Approval (साइन अप)')}
              </Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.securityNoticeText, { color: colors.textMuted }]}>
              Security & Audit Enabled • End-to-End Encrypted Survey Access
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 52 : 42,
    paddingBottom: 35,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  langTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  langTogglePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  themeToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 3,
    fontWeight: '500',
    textAlign: 'center',
  },
  govBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusFull,
  },
  govBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 18,
    marginTop: -16,
    borderRadius: SIZES.radiusLg,
    padding: 22,
    borderWidth: 1,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: 2,
  },
  forgotBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: SIZES.radiusMd,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
  },
  registerLinkText: {
    fontSize: 13,
  },
  registerLinkBold: {
    fontWeight: '700',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  securityNoticeText: {
    fontSize: 10,
    textAlign: 'center',
  },
});
