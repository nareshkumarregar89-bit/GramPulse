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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SHADOWS, SIZES } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

export function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { t, isHindi } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg(isHindi ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
      return;
    }
    if (mobile && mobile.replace(/\D/g, '').length !== 10) {
      setErrorMsg(isHindi ? 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg(isHindi ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(isHindi ? 'दोनों पासवर्ड मेल नहीं खाते।' : 'Passwords do not match.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await register(email.trim(), password, name.trim(), mobile.trim());
      Alert.alert(
        isHindi ? 'पंजीकरण सफल (Submitted for Approval)' : 'Registration Submitted for Approval',
        isHindi
          ? 'आपका सर्वेक्षक खाता सफलतापूर्वक बना दिया गया है!\n\nव्यवस्थापक (Admin) द्वारा खाता स्वीकृत और गाँव आवंटित किए जाने के बाद आप सर्वेक्षण दर्ज कर सकेंगे।'
          : 'Your surveyor account has been created!\n\nYou will be able to access census features once an Administrator approves your account and assigns a village.',
        [{ text: isHindi ? 'ठीक है (OK)' : 'OK' }]
      );
    } catch (err) {
      setErrorMsg(err.message || (isHindi ? 'पंजीकरण विफल। कृपया पुनः प्रयास करें।' : 'Registration failed. Please try again.'));
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
        {/* Top Header */}
        <View style={[styles.topBar, { backgroundColor: isDarkMode ? '#022C22' : colors.primary }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('registerTitle', 'Surveyor Registration')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.heading, { color: colors.textPrimary }]}>
                {t('registerTitle', 'New Surveyor Registration')}
              </Text>
              <Text style={[styles.subheading, { color: colors.textSecondary }]}>
                {t('registerSub', 'पंचायत क्षेत्र सर्वेक्षक आधिकारिक खाता')}
              </Text>
            </View>
          </View>

          {Boolean(errorMsg) && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight || '#FEE2E2', borderColor: '#FCA5A5' }]}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              {t('fullName', 'Full Name (पूरा नाम)')} *
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              <Ionicons name="person-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder={isHindi ? 'उदा. नरेश कुमार' : 'e.g. Naresh Kumar'}
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              {t('officialEmail', 'Official Email (ईमेल आईडी)')} *
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

          {/* Mobile */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              {t('mobileNumber', 'Mobile Number (मोबाइल नंबर)')}
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              <Ionicons name="call-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="9876543210"
                placeholderTextColor={colors.textMuted}
                value={mobile}
                onChangeText={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              {t('password', 'Password (पासवर्ड)')} *
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              {t('confirmPassword', 'Confirm Password (पासवर्ड की पुष्टि करें)')} *
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }, SHADOWS.sm, isSubmitting && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {t('registerSubmitBtn', 'पंजीकरण अनुरोध भेजें (Register)')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Switch to Login */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
              {t('alreadyHaveAccount', 'Already registered?')}{' '}
              <Text style={[styles.loginLinkBold, { color: colors.primary }]}>
                {t('loginBtn', 'Login here')}
              </Text>
            </Text>
          </TouchableOpacity>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 48 : 38,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
  },
  subheading: {
    fontSize: 12,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    marginBottom: 16,
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
  submitBtn: {
    paddingVertical: 14,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loginLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  loginLinkText: {
    fontSize: 13,
  },
  loginLinkBold: {
    fontWeight: '700',
  },
});
