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
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export function LoginScreen({ navigation }) {
  const { login, loginDemoAdmin, loginDemoSurveyor, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Brand Banner */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="home-city" size={42} color={COLORS.surface} />
          </View>
          <Text style={styles.heroTitle}>VillagePulse</Text>
          <Text style={styles.heroSubtitle}>विलेज पल्स • Rural Census & Family Dossier</Text>
          <View style={styles.govBadge}>
            <Text style={styles.govBadgeText}>Panchayat Survey System</Text>
          </View>
        </View>

        {/* Login Card */}
        <View style={[styles.card, SHADOWS.md]}>
          <Text style={styles.cardHeader}>Surveyor & Admin Login</Text>
          <Text style={styles.cardSub}>Sign in to access and record village surveys</Text>

          {Boolean(errorMsg || authError) && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>{errorMsg || authError}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
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
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password (पासवर्ड)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, SHADOWS.sm]}
            onPress={handleLogin}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Login to Dashboard</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.surface} />
              </>
            )}
          </TouchableOpacity>

          {/* Demo Shortcuts */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>QUICK DEMO ACCESS</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={styles.demoBtnAdmin}
              onPress={loginDemoAdmin}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="shield-crown" size={18} color={COLORS.accent} />
              <Text style={styles.demoBtnAdminText}>Demo Admin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoBtnSurveyor}
              onPress={loginDemoSurveyor}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="clipboard-account" size={18} color={COLORS.primary} />
              <Text style={styles.demoBtnSurveyorText}>Demo Surveyor</Text>
            </TouchableOpacity>
          </View>

          {/* Switch to Register */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerLinkText}>
              New Surveyor? <Text style={styles.registerLinkBold}>Create an Account</Text>
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  heroSection: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.surface,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '500',
  },
  govBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusFull,
  },
  govBadgeText: {
    fontSize: 11,
    color: COLORS.surface,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    marginHorizontal: 20,
    marginTop: -20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    padding: 10,
    borderRadius: SIZES.radiusSm,
    gap: 8,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    gap: 10,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: SIZES.radiusMd,
    marginTop: 10,
    gap: 8,
  },
  submitBtnText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  demoBtnAdmin: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.accentLight,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  demoBtnAdminText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  demoBtnSurveyor: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primarySubtle,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  demoBtnSurveyorText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerLinkText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  registerLinkBold: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
