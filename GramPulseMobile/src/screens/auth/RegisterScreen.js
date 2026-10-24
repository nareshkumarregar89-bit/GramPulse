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
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { villagesList } from '../../constants/villages';

export function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedVillage, setSelectedVillage] = useState(villagesList[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await register(email, password, name, selectedVillage);
      Alert.alert('Registration Successful', 'Welcome to VillagePulse! Your account is active.');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Try again.');
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
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.surface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Surveyor Registration</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.heading}>Create Surveyor Account</Text>
          <Text style={styles.subheading}>Register as an official Panchayat Field Surveyor</Text>

          {Boolean(errorMsg) && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name (पूरा नाम)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Official Email (ईमेल)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.textInput}
                placeholder="ramesh@villagepulse.gov.in"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Assigned Village Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Primary Village (आवंटित गाँव)</Text>
            <View style={styles.villagePickerRow}>
              {villagesList.map((v) => {
                const isSelected = selectedVillage === v;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[styles.villageChip, isSelected && styles.villageChipActive]}
                    onPress={() => setSelectedVillage(v)}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color={isSelected ? COLORS.primary : COLORS.textMuted}
                    />
                    <Text
                      style={[styles.villageChipText, isSelected && styles.villageChipTextActive]}
                    >
                      {v}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password (पासवर्ड - कम से कम 6 अक्षर)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password (पासवर्ड दोबारा दर्ज करें)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.submitBtn, SHADOWS.sm]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <Text style={styles.submitBtnText}>Register Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
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
    paddingBottom: 40,
  },
  topBar: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.surface,
  },
  content: {
    padding: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    padding: 10,
    borderRadius: SIZES.radiusSm,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
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
  villagePickerRow: {
    flexDirection: 'column',
    gap: 8,
  },
  villageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 10,
  },
  villageChipActive: {
    backgroundColor: COLORS.primarySubtle,
    borderColor: COLORS.primaryLight,
  },
  villageChipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  villageChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: SIZES.radiusMd,
    marginTop: 10,
  },
  submitBtnText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginLinkBold: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
