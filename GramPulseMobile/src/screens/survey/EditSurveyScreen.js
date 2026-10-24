import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { useData } from '../../contexts/DataContext';

export function EditSurveyScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { getFamilyById, updateFamily, castes, mohallas } = useData();

  const family = getFamilyById(id);

  const [headNameEn, setHeadNameEn] = useState('');
  const [headNameHi, setHeadNameHi] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [mobile, setMobile] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [mohalla, setMohalla] = useState('');
  const [caste, setCaste] = useState('');
  const [janAadhaar, setJanAadhaar] = useState('');
  const [rationCard, setRationCard] = useState('');
  const [bplStatus, setBplStatus] = useState('APL');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (family) {
      setHeadNameEn(family.familyHeadNameEnglish || family.familyHeadName || '');
      setHeadNameHi(family.familyHeadNameHindi || '');
      setFatherName(family.fatherNameHindi || family.fatherNameEnglish || family.fatherName || '');
      setMobile(family.mobile || '');
      setHouseNumber(family.houseNumber || '');
      setMohalla(family.mohalla || mohallas[0]);
      setCaste(family.caste || castes[0]);
      setJanAadhaar(family.janAadhaarNumber || family.janAadhaar || '');
      setRationCard(family.rationCardNumber || family.rationCard || '');
      setBplStatus(family.bplStatus || 'APL');
      setMonthlyIncome(family.monthlyIncome || '');
    }
  }, [family]);

  if (!family) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Family record not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const displayHead = headNameHi.trim()
        ? headNameEn.trim()
          ? `${headNameEn.trim()} (${headNameHi.trim()})`
          : headNameHi.trim()
        : headNameEn.trim();

      await updateFamily(family.id, {
        familyHeadName: displayHead,
        familyHeadNameEnglish: headNameEn.trim(),
        familyHeadNameHindi: headNameHi.trim(),
        fatherName: fatherName.trim(),
        mobile: mobile.trim(),
        houseNumber: houseNumber.trim(),
        mohalla,
        caste,
        janAadhaarNumber: janAadhaar.trim(),
        rationCardNumber: rationCard.trim(),
        bplStatus,
        monthlyIncome: monthlyIncome.trim(),
      });

      Alert.alert('Updated', 'Household survey updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update record.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Survey ({family.id})</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, SHADOWS.sm]}>
          <Text style={styles.fieldLabel}>Head of Family (हिन्दी)</Text>
          <TextInput
            style={styles.input}
            value={headNameHi}
            onChangeText={setHeadNameHi}
            placeholder="नाम दर्ज करें"
          />

          <Text style={styles.fieldLabel}>Head of Family (English)</Text>
          <TextInput
            style={styles.input}
            value={headNameEn}
            onChangeText={setHeadNameEn}
            placeholder="Enter Name"
          />

          <Text style={styles.fieldLabel}>Father / Husband Name</Text>
          <TextInput
            style={styles.input}
            value={fatherName}
            onChangeText={setFatherName}
            placeholder="पिता/पति का नाम"
          />

          <Text style={styles.fieldLabel}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            placeholder="Mobile number"
            keyboardType="phone-pad"
          />

          <Text style={styles.fieldLabel}>House Number</Text>
          <TextInput
            style={styles.input}
            value={houseNumber}
            onChangeText={setHouseNumber}
            placeholder="House Number"
          />

          <Text style={styles.fieldLabel}>Jan Aadhaar Card</Text>
          <TextInput
            style={styles.input}
            value={janAadhaar}
            onChangeText={setJanAadhaar}
            placeholder="10-digit Jan Aadhaar"
            keyboardType="number-pad"
          />

          <Text style={styles.fieldLabel}>Ration Card Number</Text>
          <TextInput
            style={styles.input}
            value={rationCard}
            onChangeText={setRationCard}
            placeholder="Ration Card"
            keyboardType="number-pad"
          />

          <Text style={styles.fieldLabel}>Monthly Income (₹)</Text>
          <TextInput
            style={styles.input}
            value={monthlyIncome}
            onChangeText={setMonthlyIncome}
            placeholder="e.g. 15000"
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.saveBtn, SHADOWS.sm]}
            onPress={handleUpdate}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <Text style={styles.saveBtnText}>Save Updates</Text>
            )}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: SIZES.radiusMd,
  },
  backBtnText: {
    color: COLORS.surface,
    fontWeight: '700',
  },
  topBar: {
    backgroundColor: COLORS.primary,
    paddingTop: 45,
    paddingHorizontal: SIZES.lg,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.surface,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SIZES.lg,
    paddingBottom: 50,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
