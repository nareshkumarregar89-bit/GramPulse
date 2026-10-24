import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { villagesList } from '../../constants/villages';

export function NewSurveyScreen({ navigation }) {
  const { addFamily, castes, mohallas, selectedVillage } = useData();
  const { currentUser } = useAuth();
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();

  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [village, setVillage] = useState(
    selectedVillage && selectedVillage !== 'All' ? selectedVillage : villagesList[0]
  );
  const [mohalla, setMohalla] = useState(mohallas[0]);
  const [caste, setCaste] = useState(castes[0]);
  const [headNameEn, setHeadNameEn] = useState('');
  const [headNameHi, setHeadNameHi] = useState('');
  const [fatherNameEn, setFatherNameEn] = useState('');
  const [fatherNameHi, setFatherNameHi] = useState('');
  const [mobile, setMobile] = useState('');
  const [houseNumber, setHouseNumber] = useState('');

  // Step 2 State: IDs & Socio-Economic
  const [janAadhaar, setJanAadhaar] = useState('');
  const [rationCard, setRationCard] = useState('');
  const [voterId, setVoterId] = useState('');
  const [bplStatus, setBplStatus] = useState('BPL');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [houseType, setHouseType] = useState('Pucca');
  const [waterConnection, setWaterConnection] = useState(true);
  const [electricityConnection, setElectricityConnection] = useState(true);
  const [toilet, setToilet] = useState(true);
  const [gasConnection, setGasConnection] = useState(true);

  // Step 3: Members State
  const [members, setMembers] = useState([
    {
      id: '1',
      name: '',
      gender: 'Male',
      relation: 'Head',
      age: '',
      education: 'Secondary',
      occupation: 'Agriculture',
      mobile: '',
      aadhaarNumber: '',
    },
  ]);

  // Member Handlers
  const addMemberRow = () => {
    setMembers([
      ...members,
      {
        id: String(Date.now()),
        name: '',
        gender: 'Female',
        relation: 'Wife',
        age: '',
        education: 'Primary',
        occupation: 'Homemaker',
        mobile: '',
        aadhaarNumber: '',
      },
    ]);
  };

  const updateMember = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const removeMember = (index) => {
    if (members.length === 1) {
      Alert.alert('Notice', 'At least 1 family member must be specified.');
      return;
    }
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated);
  };

  // Submit Handler
  const handleSaveSurvey = async () => {
    if (!headNameEn.trim() && !headNameHi.trim()) {
      Alert.alert('Required Field', 'Please enter the name of the Family Head.');
      setActiveStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const displayHead = headNameHi.trim()
        ? headNameEn.trim()
          ? `${headNameEn.trim()} (${headNameHi.trim()})`
          : headNameHi.trim()
        : headNameEn.trim();

      const newRecord = {
        village,
        mohalla,
        caste,
        familyHeadName: displayHead,
        familyHeadNameEnglish: headNameEn.trim(),
        familyHeadNameHindi: headNameHi.trim(),
        fatherName: fatherNameHi.trim() || fatherNameEn.trim(),
        fatherNameEnglish: fatherNameEn.trim(),
        fatherNameHindi: fatherNameHi.trim(),
        mobile: mobile.trim(),
        houseNumber: houseNumber.trim(),
        janAadhaarNumber: janAadhaar.trim(),
        rationCardNumber: rationCard.trim(),
        voterId: voterId.trim(),
        bplStatus,
        monthlyIncome: monthlyIncome.trim(),
        houseType,
        waterConnection,
        electricityConnection,
        toilet,
        gasConnection,
        members: members.map((m) => ({
          ...m,
          name: m.name || headNameEn || headNameHi || 'Member',
        })),
        surveyDate: new Date().toISOString(),
        location: {
          latitude: 25.3478 + (Math.random() - 0.5) * 0.01,
          longitude: 74.6399 + (Math.random() - 0.5) * 0.01,
        },
      };

      const saved = await addFamily(newRecord);
      Alert.alert(
        'Survey Saved Successfully! 🎉',
        `Household registered with Record ID: ${saved.id}`,
        [
          {
            text: 'View Family Dossier',
            onPress: () => navigation.replace('FamilyDetail', { id: saved.id }),
          },
          {
            text: 'Dashboard',
            onPress: () => navigation.navigate('DashboardTab'),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save household survey.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={[styles.topBar, { backgroundColor: isDark ? '#064E3B' : colors.primary }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'hi' ? 'नया परिवार सर्वेक्षण (New Survey)' : 'New Household Survey'}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Step Indicators */}
      <View style={[styles.stepTabs, { backgroundColor: colors.surface, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[styles.stepTab, activeStep === 1 && styles.stepTabActive]}
          onPress={() => setActiveStep(1)}
        >
          <Text style={[styles.stepNum, activeStep === 1 && styles.stepNumActive]}>1</Text>
          <Text style={[styles.stepLabel, { color: colors.textSecondary }, activeStep === 1 && styles.stepLabelActive]}>
            {t('step1', 'Basic')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stepTab, activeStep === 2 && styles.stepTabActive]}
          onPress={() => setActiveStep(2)}
        >
          <Text style={[styles.stepNum, activeStep === 2 && styles.stepNumActive]}>2</Text>
          <Text style={[styles.stepLabel, { color: colors.textSecondary }, activeStep === 2 && styles.stepLabelActive]}>
            {t('step2', 'IDs')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stepTab, activeStep === 3 && styles.stepTabActive]}
          onPress={() => setActiveStep(3)}
        >
          <Text style={[styles.stepNum, activeStep === 3 && styles.stepNumActive]}>3</Text>
          <Text style={[styles.stepLabel, { color: colors.textSecondary }, activeStep === 3 && styles.stepLabelActive]}>
            {t('step3', 'Members')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stepTab, activeStep === 4 && styles.stepTabActive]}
          onPress={() => setActiveStep(4)}
        >
          <Text style={[styles.stepNum, activeStep === 4 && styles.stepNumActive]}>4</Text>
          <Text style={[styles.stepLabel, { color: colors.textSecondary }, activeStep === 4 && styles.stepLabelActive]}>
            {t('step4', 'Submit')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* STEP 1: Basic Information */}
        {activeStep === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Household & Village Information</Text>

            {/* Village Selector */}
            <Text style={styles.fieldLabel}>Village (ग्राम पंचायत)</Text>
            <View style={styles.chipsRow}>
              {villagesList.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.choiceChip, village === v && styles.choiceChipActive]}
                  onPress={() => setVillage(v)}
                >
                  <Text style={[styles.choiceChipText, village === v && styles.choiceChipTextActive]}>
                    {v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mohalla Selector */}
            <Text style={styles.fieldLabel}>Mohalla (मोहल्ला / बस्ती)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
              {mohallas.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.choiceChip, mohalla === m && styles.choiceChipActive]}
                  onPress={() => setMohalla(m)}
                >
                  <Text style={[styles.choiceChipText, mohalla === m && styles.choiceChipTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Caste Selector */}
            <Text style={styles.fieldLabel}>Caste (जाति)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
              {castes.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.choiceChip, caste === c && styles.choiceChipActive]}
                  onPress={() => setCaste(c)}
                >
                  <Text style={[styles.choiceChipText, caste === c && styles.choiceChipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Head Name (Hindi & English) */}
            <Text style={styles.fieldLabel}>Head of Family (मुखिया का नाम - हिन्दी)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. मोहन लाल रेगर"
              placeholderTextColor={COLORS.textMuted}
              value={headNameHi}
              onChangeText={setHeadNameHi}
            />

            <Text style={styles.fieldLabel}>Head of Family (Name in English)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mohan Lal Regar"
              placeholderTextColor={COLORS.textMuted}
              value={headNameEn}
              onChangeText={setHeadNameEn}
            />

            {/* Father/Husband Name */}
            <Text style={styles.fieldLabel}>Father / Husband Name (पिता/पति का नाम)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. कालू राम रेगर"
              placeholderTextColor={COLORS.textMuted}
              value={fatherNameHi}
              onChangeText={setFatherNameHi}
            />

            {/* Mobile & House No */}
            <View style={styles.twoInputsRow}>
              <View style={styles.flexOne}>
                <Text style={styles.fieldLabel}>Mobile (मोबाइल)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="98290XXXXX"
                  placeholderTextColor={COLORS.textMuted}
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <View style={styles.flexOne}>
                <Text style={styles.fieldLabel}>House No. (मकान संख्या)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. H-12"
                  placeholderTextColor={COLORS.textMuted}
                  value={houseNumber}
                  onChangeText={setHouseNumber}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => setActiveStep(2)}>
              <Text style={styles.nextBtnText}>Continue to Documents (दस्तावेज़)</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: Government Documents & Socio-Economic */}
        {activeStep === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Government IDs & Socio-Economic</Text>

            <Text style={styles.fieldLabel}>Jan Aadhaar Card (10-Digit जन आधार)</Text>
            <TextInput
              style={styles.input}
              placeholder="7823901284"
              placeholderTextColor={COLORS.textMuted}
              value={janAadhaar}
              onChangeText={setJanAadhaar}
              keyboardType="number-pad"
              maxLength={10}
            />

            <Text style={styles.fieldLabel}>Ration Card (12-Digit राशन कार्ड)</Text>
            <TextInput
              style={styles.input}
              placeholder="083459102834"
              placeholderTextColor={COLORS.textMuted}
              value={rationCard}
              onChangeText={setRationCard}
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>Voter ID (मतदाता पहचान पत्र)</Text>
            <TextInput
              style={styles.input}
              placeholder="RJ/24/182/XXXXXX"
              placeholderTextColor={COLORS.textMuted}
              value={voterId}
              onChangeText={setVoterId}
            />

            {/* Economic Category */}
            <Text style={styles.fieldLabel}>Economic Status (आर्थिक श्रेणी)</Text>
            <View style={styles.chipsRow}>
              {['BPL', 'APL', 'Antyodaya'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.choiceChip, bplStatus === status && styles.choiceChipActive]}
                  onPress={() => setBplStatus(status)}
                >
                  <Text style={[styles.choiceChipText, bplStatus === status && styles.choiceChipTextActive]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Income & House Type */}
            <View style={styles.twoInputsRow}>
              <View style={styles.flexOne}>
                <Text style={styles.fieldLabel}>Monthly Income (मासिक आय)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="₹ 15,000"
                  placeholderTextColor={COLORS.textMuted}
                  value={monthlyIncome}
                  onChangeText={setMonthlyIncome}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.flexOne}>
                <Text style={styles.fieldLabel}>House Type (मकान प्रकार)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Pucca / Kutcha"
                  placeholderTextColor={COLORS.textMuted}
                  value={houseType}
                  onChangeText={setHouseType}
                />
              </View>
            </View>

            {/* Amenities Switches */}
            <Text style={styles.fieldLabel}>Household Amenities (सुविधाएँ)</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>नल कनेक्शन (Piped Water)</Text>
              <Switch
                value={waterConnection}
                onValueChange={setWaterConnection}
                trackColor={{ true: COLORS.primary }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>बिजली कनेक्शन (Electricity)</Text>
              <Switch
                value={electricityConnection}
                onValueChange={setElectricityConnection}
                trackColor={{ true: COLORS.primary }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>शौचालय (Sanitary Toilet)</Text>
              <Switch
                value={toilet}
                onValueChange={setToilet}
                trackColor={{ true: COLORS.primary }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>गैस कनेक्शन (LPG Ujjwala)</Text>
              <Switch
                value={gasConnection}
                onValueChange={setGasConnection}
                trackColor={{ true: COLORS.primary }}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backStepBtn} onPress={() => setActiveStep(1)}>
                <Text style={styles.backStepBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.nextBtn, styles.flexOne]} onPress={() => setActiveStep(3)}>
                <Text style={styles.nextBtnText}>Members (सदस्य)</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.surface} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: Family Members */}
        {activeStep === 3 && (
          <View style={styles.card}>
            <View style={styles.membersHeader}>
              <Text style={styles.cardTitle}>Family Members ({members.length})</Text>
              <TouchableOpacity style={styles.addMemberBtn} onPress={addMemberRow}>
                <Ionicons name="add" size={16} color={COLORS.surface} />
                <Text style={styles.addMemberBtnText}>Add Member</Text>
              </TouchableOpacity>
            </View>

            {members.map((member, index) => (
              <View key={member.id} style={styles.memberBox}>
                <View style={styles.memberBoxTop}>
                  <Text style={styles.memberBoxNum}>Member #{index + 1}</Text>
                  {members.length > 1 && (
                    <TouchableOpacity onPress={() => removeMember(index)}>
                      <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Full Name (नाम)"
                  placeholderTextColor={COLORS.textMuted}
                  value={member.name}
                  onChangeText={(val) => updateMember(index, 'name', val)}
                />

                <View style={styles.twoInputsRow}>
                  <View style={styles.flexOne}>
                    <TextInput
                      style={styles.input}
                      placeholder="Relation (e.g. Son, Wife)"
                      placeholderTextColor={COLORS.textMuted}
                      value={member.relation}
                      onChangeText={(val) => updateMember(index, 'relation', val)}
                    />
                  </View>
                  <View style={{ width: 80 }}>
                    <TextInput
                      style={styles.input}
                      placeholder="Age"
                      placeholderTextColor={COLORS.textMuted}
                      value={member.age}
                      onChangeText={(val) => updateMember(index, 'age', val)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ width: 90 }}>
                    <TextInput
                      style={styles.input}
                      placeholder="M / F"
                      placeholderTextColor={COLORS.textMuted}
                      value={member.gender}
                      onChangeText={(val) => updateMember(index, 'gender', val)}
                    />
                  </View>
                </View>

                <View style={styles.twoInputsRow}>
                  <View style={styles.flexOne}>
                    <TextInput
                      style={styles.input}
                      placeholder="Education (शिक्षा)"
                      placeholderTextColor={COLORS.textMuted}
                      value={member.education}
                      onChangeText={(val) => updateMember(index, 'education', val)}
                    />
                  </View>
                  <View style={styles.flexOne}>
                    <TextInput
                      style={styles.input}
                      placeholder="Occupation (व्यवसाय)"
                      placeholderTextColor={COLORS.textMuted}
                      value={member.occupation}
                      onChangeText={(val) => updateMember(index, 'occupation', val)}
                    />
                  </View>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Member Mobile (सदस्य का मोबाइल नंबर - 10 अंक)"
                  placeholderTextColor={COLORS.textMuted}
                  value={member.mobile}
                  onChangeText={(val) => updateMember(index, 'mobile', val.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            ))}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backStepBtn} onPress={() => setActiveStep(2)}>
                <Text style={styles.backStepBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.nextBtn, styles.flexOne]} onPress={() => setActiveStep(4)}>
                <Text style={styles.nextBtnText}>Review & Submit</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.surface} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 4: Review & Final Submission */}
        {activeStep === 4 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Final Review & Verification</Text>
            <Text style={styles.cardSub}>Check all details before submitting to Firestore</Text>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewHead}>
                {headNameHi || headNameEn || 'Family Head'}
              </Text>
              <Text style={styles.reviewSub}>
                {village} • {mohalla}
              </Text>
              <View style={styles.reviewDivider} />

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Caste / Category:</Text>
                <Text style={styles.reviewVal}>{caste} ({bplStatus})</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Contact Mobile:</Text>
                <Text style={styles.reviewVal}>{mobile || 'Not recorded'}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Jan Aadhaar ID:</Text>
                <Text style={styles.reviewVal}>{janAadhaar || 'Not recorded'}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Ration Card:</Text>
                <Text style={styles.reviewVal}>{rationCard || 'Not recorded'}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Family Members:</Text>
                <Text style={styles.reviewVal}>{members.length} People</Text>
              </View>
            </View>

            <View style={styles.gpsBox}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <View style={styles.flexOne}>
                <Text style={styles.gpsTitle}>Panchayat Geotagging</Text>
                <Text style={styles.gpsSub}>GPS coordinates will be automatically recorded</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitFinalBtn, SHADOWS.fab]}
              onPress={handleSaveSurvey}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.surface} />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color={COLORS.surface} />
                  <Text style={styles.submitFinalBtnText}>Submit & Synchronize</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backStepBtn} onPress={() => setActiveStep(3)}>
              <Text style={styles.backStepBtnText}>Back to Edit Members</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  stepTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSm,
  },
  stepTabActive: {
    backgroundColor: COLORS.primarySubtle,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSubtle,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  stepNumActive: {
    backgroundColor: COLORS.primary,
    color: COLORS.surface,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  stepLabelActive: {
    color: COLORS.primaryDark,
  },
  scrollContent: {
    padding: SIZES.lg,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 14,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  horizontalChips: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  choiceChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginRight: 8,
  },
  choiceChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  choiceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  choiceChipTextActive: {
    color: COLORS.surface,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  twoInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flexOne: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceSubtle,
  },
  switchLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: SIZES.radiusMd,
    marginTop: 20,
    gap: 8,
  },
  nextBtnText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backStepBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  backStepBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusFull,
    gap: 4,
  },
  addMemberBtnText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  memberBox: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: SIZES.radiusMd,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  memberBoxTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberBoxNum: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  reviewCard: {
    backgroundColor: COLORS.primarySubtle,
    borderRadius: SIZES.radiusMd,
    padding: 16,
    marginBottom: 16,
  },
  reviewHead: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  reviewSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: COLORS.primaryLight,
    marginVertical: 10,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  reviewLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  reviewVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  gpsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceSubtle,
    padding: 14,
    borderRadius: SIZES.radiusMd,
    marginBottom: 16,
  },
  gpsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  gpsSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  submitFinalBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: SIZES.radiusMd,
    gap: 10,
  },
  submitFinalBtnText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '800',
  },
});
