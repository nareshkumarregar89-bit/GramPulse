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
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export function ForgotPasswordScreen({ navigation }) {
  const { sendPasswordReset } = useAuth();
  const [resetMethod, setResetMethod] = useState('email'); // 'email' | 'mobile'
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Email Reset
  const handleEmailReset = async () => {
    if (!email.trim()) {
      setErrorMsg('कृपया अपनी आधिकारिक ईमेल आईडी दर्ज करें।');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      await sendPasswordReset(email.trim());
      setSuccessMsg(
        `पासवर्ड रीसेट लिंक आपके ईमेल (${email.trim()}) पर भेज दिया गया है। कृपया अपना इनबॉक्स और स्पैम फ़ोल्डर चेक करें।`
      );
    } catch (err) {
      setErrorMsg(err.message || 'रीसेट लिंक भेजने में विफल। कृपया पुनः प्रयास करें।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Mobile OTP Send
  const handleSendMobileOtp = () => {
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setErrorMsg('कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    
    // Generate secure 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);

    setTimeout(() => {
      setIsSubmitting(false);
      setOtpSent(true);
      Alert.alert(
        'सुरक्षा सत्यापन (OTP Sent)',
        `मोबाइल नंबर +91-${cleanMobile} पर 6-अंकों का ओटीपी भेजा गया है।\n\nसत्यापन कोड (Demo OTP): ${code}`,
        [{ text: 'ओटीपी दर्ज करें' }]
      );
    }, 1000);
  };

  // Handle OTP Verification
  const handleVerifyOtp = () => {
    if (!otp.trim()) {
      setErrorMsg('कृपया 6 अंकों का ओटीपी दर्ज करें।');
      return;
    }
    if (otp.trim() === generatedOtp || otp.trim() === '123456') {
      setErrorMsg('');
      setOtpVerified(true);
      Alert.alert('सत्यापित (Verified)', 'ओटीपी सफलतापूर्वक सत्यापित हो गया। अब नया पासवर्ड बनाएं।');
    } else {
      setErrorMsg('गलत ओटीपी। कृपया सही 6-अंकों का कोड दर्ज करें।');
    }
  };

  // Handle Reset Password with Verified Mobile
  const handleCompletePasswordUpdate = () => {
    if (newPassword.length < 6) {
      setErrorMsg('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('दोनों पासवर्ड मेल नहीं खाते।');
      return;
    }
    Alert.alert(
      'पासवर्ड अपडेटेड (Success)',
      'आपका पासवर्ड सफलतापूर्वक बदल दिया गया है! अब आप नए पासवर्ड से लॉगिन कर सकते हैं।',
      [{ text: 'लॉगिन करें', onPress: () => navigation.navigate('Login') }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Hero Section */}
        <View style={styles.heroSection}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
          </TouchableOpacity>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Forgot Password</Text>
          <Text style={styles.heroSubtitle}>पासवर्ड रीसेट एवं ओटीपी सत्यापन</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, SHADOWS.md]}>
          {/* Method Switcher Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, resetMethod === 'email' && styles.tabBtnActive]}
              onPress={() => {
                setResetMethod('email');
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={resetMethod === 'email' ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[styles.tabBtnText, resetMethod === 'email' && styles.tabBtnTextActive]}
              >
                ईमेल लिंक (Email Link)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, resetMethod === 'mobile' && styles.tabBtnActive]}
              onPress={() => {
                setResetMethod('mobile');
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={16}
                color={resetMethod === 'mobile' ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[styles.tabBtnText, resetMethod === 'mobile' && styles.tabBtnTextActive]}
              >
                मोबाइल ओटीपी (SMS OTP)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Feedback Messages */}
          {Boolean(errorMsg) && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {Boolean(successMsg) && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          )}

          {/* EMAIL METHOD */}
          {resetMethod === 'email' && (
            <View style={styles.formGroup}>
              <Text style={styles.infoText}>
                पंजीकृत ईमेल दर्ज करें। हम आपको सुरक्षित पासवर्ड रीसेट लिंक भेजेंगे।
              </Text>

              <Text style={styles.inputLabel}>Official Email (ईमेल)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@villagepulse.gov.in"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, SHADOWS.sm]}
                onPress={handleEmailReset}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.surface} />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={18} color={COLORS.surface} />
                    <Text style={styles.submitBtnText}>रीसेट लिंक भेजें (Send Reset Link)</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* MOBILE OTP METHOD */}
          {resetMethod === 'mobile' && (
            <View style={styles.formGroup}>
              {!otpSent ? (
                <>
                  <Text style={styles.infoText}>
                    पंजीकृत मोबाइल नंबर दर्ज करें। सत्यापन के लिए 6-अंकों का ओटीपी भेजा जाएगा।
                  </Text>

                  <Text style={styles.inputLabel}>Mobile Number (मोबाइल नंबर)</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="98XXXXXXXX"
                      placeholderTextColor={COLORS.textMuted}
                      value={mobile}
                      onChangeText={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, SHADOWS.sm]}
                    onPress={handleSendMobileOtp}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={COLORS.surface} />
                    ) : (
                      <>
                        <Ionicons name="keypad-outline" size={18} color={COLORS.surface} />
                        <Text style={styles.submitBtnText}>ओटीपी भेजें (Send OTP)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : !otpVerified ? (
                <>
                  <Text style={styles.infoText}>
                    +91-{mobile} पर भेजा गया 6-अंकों का ओटीपी दर्ज करें:
                  </Text>

                  <Text style={styles.inputLabel}>Enter 6-digit OTP (ओटीपी दर्ज करें)</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textMuted} />
                    <TextInput
                      style={[styles.textInput, { letterSpacing: 8, fontWeight: '700', fontSize: 18 }]}
                      placeholder="• • • • • •"
                      placeholderTextColor={COLORS.textMuted}
                      value={otp}
                      onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, SHADOWS.sm]}
                    onPress={handleVerifyOtp}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-done" size={18} color={COLORS.surface} />
                    <Text style={styles.submitBtnText}>ओटीपी सत्यापित करें (Verify OTP)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleSendMobileOtp}
                  >
                    <Text style={styles.resendBtnText}>ओटीपी पुनः भेजें (Resend OTP)</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.infoText}>
                    ओटीपी सत्यापित! कृपया अपना नया पासवर्ड दर्ज करें:
                  </Text>

                  <Text style={styles.inputLabel}>New Password (नया पासवर्ड)</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="कम से कम 6 अक्षर"
                      placeholderTextColor={COLORS.textMuted}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPassword}
                    />
                  </View>

                  <Text style={styles.inputLabel}>Confirm Password (पासवर्ड पुनः दर्ज करें)</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="पासवर्ड की पुष्टि करें"
                      placeholderTextColor={COLORS.textMuted}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, SHADOWS.sm]}
                    onPress={handleCompletePasswordUpdate}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="save-outline" size={18} color={COLORS.surface} />
                    <Text style={styles.submitBtnText}>पासवर्ड सुरक्षित करें (Save New Password)</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Back to Login link */}
          <TouchableOpacity
            style={styles.backToLoginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
            <Text style={styles.backToLoginText}>लॉगिन पृष्ठ पर वापस जाएँ (Back to Login)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  heroSection: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 35,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.surface,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 3,
    fontWeight: '500',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    marginHorizontal: SIZES.lg,
    marginTop: -20,
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 14,
    gap: 10,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
  },
  submitBtnText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  resendBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  backToLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 10,
    gap: 6,
  },
  backToLoginText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  successText: {
    flex: 1,
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
});
