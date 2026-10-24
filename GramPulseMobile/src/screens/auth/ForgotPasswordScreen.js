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

export function ForgotPasswordScreen({ navigation }) {
  const { sendPasswordReset } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { t, isHindi } = useLanguage();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Firebase Official Email Password Reset
  const handleEmailReset = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg(
        isHindi
          ? 'कृपया अपनी आधिकारिक ईमेल आईडी दर्ज करें।'
          : 'Please enter your registered official email address.'
      );
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      await sendPasswordReset(cleanEmail);
      setSuccessMsg(
        isHindi
          ? `पासवर्ड रीसेट लिंक आपके ईमेल (${cleanEmail}) पर भेज दिया गया है। कृपया अपना इनबॉक्स और स्पैम फ़ोल्डर चेक करें।`
          : `A password reset link has been dispatched to ${cleanEmail}. Please check your inbox and spam folders.`
      );
    } catch (err) {
      setErrorMsg(
        err.message ||
          (isHindi
            ? 'रीसेट लिंक भेजने में विफल। कृपया दर्ज की गई ईमेल जांचें।'
            : 'Failed to dispatch reset link. Please verify your email.')
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
        {/* Top Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: isDarkMode ? '#022C22' : colors.primary }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>{t('forgotTitle', 'Forgot Password')}</Text>
          <Text style={styles.heroSubtitle}>
            {isHindi ? 'पासवर्ड रीसेट लिंक प्राप्त करें' : 'Recover your account password via email'}
          </Text>
        </View>

        {/* Card */}
        <View style={[styles.card, SHADOWS.md, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>
            {isHindi ? 'पासवर्ड रीसेट (Official Account)' : 'Reset Official Account Password'}
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            {isHindi
              ? 'अपना पंजीकृत आधिकारिक ईमेल दर्ज करें। पासवर्ड बदलने का सुरक्षित लिंक सीधे आपके इनबॉक्स में भेजा जाएगा।'
              : 'Enter your registered official email address. A secure recovery link will be sent directly to your inbox.'}
          </Text>

          {/* Feedback Messages */}
          {Boolean(errorMsg) && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight || '#FEE2E2', borderColor: '#FCA5A5' }]}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {Boolean(successMsg) && (
            <View style={[styles.successBox, { backgroundColor: colors.successLight || '#F0FDF4', borderColor: '#86EFAC' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#15803D" />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              {t('officialEmail', 'Official Email (आधिकारिक ईमेल)')} *
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
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Send Reset Link Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }, SHADOWS.sm, isSubmitting && { opacity: 0.7 }]}
            onPress={handleEmailReset}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>
                  {t('sendResetLinkBtn', 'पासवर्ड रीसेट लिंक भेजें (Send Link)')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Back to Login Button */}
          <TouchableOpacity
            style={[styles.backToLoginBtn, { borderColor: colors.cardBorder, backgroundColor: colors.surfaceSubtle }]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={16} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.backToLoginText, { color: colors.primary }]}>
              {t('backToLogin', 'लॉगिन पर वापस जाएँ')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Help Notice */}
        <View style={[styles.securityNotice, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={[styles.securityNoticeText, { color: colors.textSecondary }]}>
            {isHindi
              ? 'सुरक्षा कारणों से, मोबाइल एसएमएस ओटीपी को अक्षम रखा गया है। पासवर्ड केवल आधिकारिक सत्यापित ईमेल के माध्यम से ही रीसेट किया जा सकता है।'
              : 'For security and reliability, mobile OTP authentication is disabled. Password resets are conducted exclusively through verified official email.'}
          </Text>
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
    paddingBottom: 40,
  },
  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: 28,
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 42,
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 3,
  },
  card: {
    marginHorizontal: SIZES.lg,
    marginTop: -16,
    borderRadius: SIZES.radiusLg,
    padding: 22,
    borderWidth: 1,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '500',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#15803D',
    fontWeight: '600',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
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
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: SIZES.radiusMd,
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  backToLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    marginTop: 12,
  },
  backToLoginText: {
    fontSize: 13,
    fontWeight: '700',
  },
  securityNotice: {
    marginHorizontal: SIZES.lg,
    marginTop: 18,
    borderRadius: SIZES.radiusMd,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  securityNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
