import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  Feather,
} from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { FamilyIdCardModal } from '../../components/FamilyIdCardModal';

export function FamilyDetailScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { getFamilyById, deleteFamily } = useData();
  const { isAdmin } = useAuth();
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const [idCardModalVisible, setIdCardModalVisible] = React.useState(false);

  const family = getFamilyById(id);

  if (!family) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={[styles.notFoundText, { color: colors.textPrimary }]}>
          {language === 'hi' ? 'परिवार रिकॉर्ड नहीं मिला' : 'Family Record Not Found'}
        </Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{t('back', 'Go Back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const members = Array.isArray(family.members) ? family.members : [];
  const isBpl = family.bplStatus === 'BPL' || family.category === 'BPL' || family.category === 'SC';

  const handleCall = () => {
    if (family.mobile) {
      Linking.openURL(`tel:${family.mobile}`);
    } else {
      Alert.alert(
        language === 'hi' ? 'मोबाइल नंबर उपलब्ध नहीं है' : 'No Contact Number',
        language === 'hi' ? 'इस परिवार के लिए कोई संपर्क नंबर दर्ज नहीं है।' : 'No mobile number was recorded for this household.'
      );
    }
  };

  const handleShare = async () => {
    try {
      const summary = `*VillagePulse Family Dossier*\nFamily ID: ${family.id}\nHead: ${family.familyHeadNameHindi || family.familyHeadNameEnglish}\nVillage: ${family.village}\nMohalla: ${family.mohalla}\nJan Aadhaar: ${family.janAadhaarNumber || 'N/A'}\nMembers: ${members.length}`;
      await Share.share({ message: summary });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      language === 'hi' ? 'रिकॉर्ड रीसायकल बिन में भेजें (Soft Delete)' : 'Send to Recycle Bin',
      language === 'hi'
        ? `क्या आप परिवार ${family.id} का रिकॉर्ड रीसायकल बिन (Deleted Records) में भेजना चाहते हैं?\n\nआप इसे एडमिन पैनल से बाद में कभी भी पुनर्स्थापित (Restore) कर सकते हैं।`
        : `Move family ${family.id} record to the Recycle Bin?\n\nAdministrators can restore it at any time from the Recycle Bin panel.`,
      [
        { text: t('cancel', 'रद्द करें'), style: 'cancel' },
        {
          text: language === 'hi' ? 'रीसायकल बिन में भेजें' : 'Move to Trash',
          style: 'destructive',
          onPress: async () => {
            await deleteFamily(family.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top App Bar */}
      <View style={[styles.appBar, { backgroundColor: isDark ? '#064E3B' : colors.primary }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>{t('familyDetailTitle', 'Family Dossier')}</Text>
        <View style={styles.appBarActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIdCardModalVisible(true)}
            accessibilityLabel="Digital ID Card"
          >
            <MaterialCommunityIcons name="qrcode" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('DataPrint', { familyId: family.id })}
          >
            <Ionicons name="print-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('EditSurvey', { id: family.id })}
          >
            <Feather name="edit-2" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Dossier Card */}
        <View style={[styles.dossierCard, SHADOWS.md, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.dossierTop}>
            <View style={[styles.idChip, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.idChipText, { color: colors.primaryDark }]}>{family.id}</Text>
            </View>
            <View style={styles.badgeRow}>
              {isBpl && (
                <View style={styles.bplPill}>
                  <Text style={styles.bplPillText}>BPL</Text>
                </View>
              )}
              <View style={[styles.categoryPill, { backgroundColor: isDark ? colors.background : colors.surfaceSubtle }]}>
                <Text style={[styles.categoryPillText, { color: colors.textSecondary }]}>{family.caste || 'Caste'}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.headTitle, { color: colors.textPrimary }]}>
            {family.familyHeadNameHindi || family.familyHeadNameEnglish}
          </Text>
          {family.familyHeadNameEnglish && family.familyHeadNameHindi && (
            <Text style={[styles.headSubtitle, { color: colors.textSecondary }]}>{family.familyHeadNameEnglish}</Text>
          )}

          {family.fatherName ? (
            <View style={styles.infoLine}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                {language === 'hi' ? 'पिता/पति:' : 'Father / Husband:'}
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {family.fatherNameHindi || family.fatherNameEnglish || family.fatherName}
              </Text>
            </View>
          ) : null}

          <View style={styles.infoLine}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
              {language === 'hi' ? 'गाँव:' : 'Village:'}
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{family.village || 'समोड़ी (Samodi)'}</Text>
          </View>

          <View style={styles.infoLine}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
              {language === 'hi' ? 'मोहल्ला:' : 'Mohalla:'}
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{family.mohalla || 'Main Mohalla'}</Text>
          </View>

          {family.houseNumber ? (
            <View style={styles.infoLine}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                {language === 'hi' ? 'मकान संख्या:' : 'House No:'}
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{family.houseNumber}</Text>
            </View>
          ) : null}

          {/* Quick Call Button */}
          {family.mobile && (
            <TouchableOpacity style={[styles.callActionBar, { backgroundColor: colors.primary }]} onPress={handleCall} activeOpacity={0.8}>
              <Ionicons name="call" size={18} color="#FFFFFF" />
              <Text style={styles.callActionBarText}>
                {language === 'hi' ? 'कॉल करें ' : 'Call '}{family.mobile}
              </Text>
            </TouchableOpacity>
          )}

          {/* Digital Family ID Card with QR Action */}
          <TouchableOpacity
            style={[styles.idCardActionBtn, { backgroundColor: isDark ? '#064E3B' : colors.primaryLight }]}
            onPress={() => setIdCardModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="badge-account-horizontal" size={20} color={isDark ? '#34D399' : colors.primaryDark} />
            <Text style={[styles.idCardActionText, { color: isDark ? '#34D399' : colors.primaryDark }]}>
              {language === 'hi' ? 'डिजिटल पहचान पत्र व QR कोड (Digital ID Card)' : 'Digital Family ID Card & QR'}
            </Text>
          </TouchableOpacity>

          {/* Print Dossier Quick Action */}
          <TouchableOpacity
            style={[styles.printActionBar, { backgroundColor: isDark ? colors.surface : colors.primaryLight, borderColor: colors.primary }]}
            onPress={() => navigation.navigate('DataPrint', { familyId: family.id })}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={[styles.printActionBarText, { color: colors.primary }]}>
              {language === 'hi' ? 'विस्तृत डॉसियर प्रिंट करें (Print Dossier)' : 'Print Detailed Dossier'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Government Identity Documents */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="card-account-details" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {language === 'hi' ? 'शासकीय दस्तावेज़ (Govt Documents)' : 'Government Documents'}
          </Text>
        </View>

        <View style={[styles.sectionCard, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.docRow}>
            <View style={styles.docLeft}>
              <Text style={[styles.docLabel, { color: colors.textMuted }]}>Jan Aadhaar (जन आधार)</Text>
              <Text style={[styles.docValue, { color: colors.textPrimary }]}>
                {family.janAadhaarNumber || family.janAadhaar || (language === 'hi' ? 'उपलब्ध नहीं' : 'Not Available')}
              </Text>
            </View>
            <MaterialCommunityIcons name="card-bulleted" size={24} color={colors.primary} />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          <View style={styles.docRow}>
            <View style={styles.docLeft}>
              <Text style={[styles.docLabel, { color: colors.textMuted }]}>Ration Card (राशन कार्ड)</Text>
              <Text style={[styles.docValue, { color: colors.textPrimary }]}>
                {family.rationCardNumber || family.rationCard || (language === 'hi' ? 'उपलब्ध नहीं' : 'Not Available')}
              </Text>
            </View>
            <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.accent} />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          <View style={styles.docRow}>
            <View style={styles.docLeft}>
              <Text style={[styles.docLabel, { color: colors.textMuted }]}>Voter ID (मतदाता पहचान पत्र)</Text>
              <Text style={[styles.docValue, { color: colors.textPrimary }]}>
                {family.voterId || (language === 'hi' ? 'दर्ज नहीं' : 'Not Recorded')}
              </Text>
            </View>
            <Ionicons name="finger-print-outline" size={24} color={colors.info} />
          </View>
        </View>

        {/* Socio-Economic & Bank Info */}
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="rupee-sign" size={16} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {language === 'hi' ? 'आर्थिक एवं आवास विवरण' : 'Socio-Economic & Amenities'}
          </Text>
        </View>

        <View style={[styles.sectionCard, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={[styles.colLabel, { color: colors.textMuted }]}>{language === 'hi' ? 'श्रेणी' : 'Category'}</Text>
              <Text style={[styles.colValue, { color: colors.textPrimary }]}>{family.category || 'General'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={[styles.colLabel, { color: colors.textMuted }]}>{language === 'hi' ? 'मासिक आय' : 'Monthly Income'}</Text>
              <Text style={[styles.colValue, { color: colors.textPrimary }]}>
                {family.monthlyIncome ? `₹ ${family.monthlyIncome}` : (language === 'hi' ? 'दर्ज नहीं' : 'Not Stated')}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={[styles.colLabel, { color: colors.textMuted }]}>{language === 'hi' ? 'मकान प्रकार' : 'House Type'}</Text>
              <Text style={[styles.colValue, { color: colors.textPrimary }]}>{family.houseType || 'Pucca'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={[styles.colLabel, { color: colors.textMuted }]}>{language === 'hi' ? 'व्यवसाय' : 'Occupation'}</Text>
              <Text style={[styles.colValue, { color: colors.textPrimary }]}>{family.occupation || 'Agriculture'}</Text>
            </View>
          </View>

          {/* Amenities Grid */}
          <View style={styles.amenitiesContainer}>
            <View style={[styles.amenityPill, { backgroundColor: isDark ? colors.background : colors.surfaceSubtle }, family.waterConnection && { backgroundColor: colors.primaryLight }]}>
              <Ionicons
                name="water-outline"
                size={16}
                color={family.waterConnection ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.amenityText, { color: colors.textSecondary }]}>{language === 'hi' ? 'जल (Water)' : 'Water'}</Text>
            </View>
            <View style={[styles.amenityPill, { backgroundColor: isDark ? colors.background : colors.surfaceSubtle }, family.electricityConnection && { backgroundColor: colors.primaryLight }]}>
              <Ionicons
                name="flash-outline"
                size={16}
                color={family.electricityConnection ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.amenityText, { color: colors.textSecondary }]}>{language === 'hi' ? 'विद्युत (Power)' : 'Electricity'}</Text>
            </View>
            <View style={[styles.amenityPill, { backgroundColor: isDark ? colors.background : colors.surfaceSubtle }, family.toilet && { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons
                name="toilet"
                size={16}
                color={family.toilet ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.amenityText, { color: colors.textSecondary }]}>{language === 'hi' ? 'शौचालय' : 'Toilet'}</Text>
            </View>
            <View style={[styles.amenityPill, { backgroundColor: isDark ? colors.background : colors.surfaceSubtle }, family.gasConnection && { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons
                name="gas-cylinder"
                size={16}
                color={family.gasConnection ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.amenityText, { color: colors.textSecondary }]}>{language === 'hi' ? 'गैस कनेक्शन' : 'Gas'}</Text>
            </View>
          </View>
        </View>

        {/* Family Members Section */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="account-group" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {language === 'hi' ? `परिवार के सदस्य (${members.length})` : `Family Members (${members.length})`}
          </Text>
        </View>

        {members.length > 0 ? (
          members.map((member, index) => (
            <View key={member.id || index} style={[styles.memberCard, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <View style={styles.memberTop}>
                <View style={[styles.memberAvatar, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.avatarInitial, { color: colors.primaryDark }]}>
                    {(member.name || member.nameEnglish || 'M').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                    {member.nameHindi || member.nameEnglish || member.name}
                  </Text>
                  <Text style={[styles.memberRelation, { color: colors.textSecondary }]}>
                    {member.relation || 'Member'} • {member.gender || 'Male'} • {member.age || '—'} {language === 'hi' ? 'वर्ष' : 'yrs'}
                  </Text>
                </View>
              </View>

              <View style={styles.memberMetaRow}>
                {member.education ? (
                  <View style={[styles.memberMetaBadge, { backgroundColor: isDark ? colors.background : colors.surfaceSubtle }]}>
                    <Ionicons name="school-outline" size={13} color={colors.textSecondary} />
                    <Text style={[styles.memberMetaText, { color: colors.textSecondary }]}>{member.education}</Text>
                  </View>
                ) : null}
                {member.occupation ? (
                  <View style={[styles.memberMetaBadge, { backgroundColor: isDark ? colors.background : colors.surfaceSubtle }]}>
                    <Ionicons name="briefcase-outline" size={13} color={colors.textSecondary} />
                    <Text style={[styles.memberMetaText, { color: colors.textSecondary }]}>{member.occupation}</Text>
                  </View>
                ) : null}
                {member.maritalStatus ? (
                  <View style={[styles.memberMetaBadge, { backgroundColor: isDark ? colors.background : colors.surfaceSubtle }]}>
                    <Ionicons name="heart-outline" size={13} color={colors.textSecondary} />
                    <Text style={[styles.memberMetaText, { color: colors.textSecondary }]}>{member.maritalStatus}</Text>
                  </View>
                ) : null}
                {member.mobile ? (
                  <TouchableOpacity
                    style={[styles.memberMetaBadge, { backgroundColor: isDark ? '#064E3B' : '#E8F5E9', borderColor: colors.primary, borderWidth: 1 }]}
                    onPress={() => Linking.openURL(`tel:${member.mobile}`)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="call" size={13} color={colors.primary} />
                    <Text style={[styles.memberMetaText, { color: colors.primary, fontWeight: '700' }]}>{member.mobile}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {member.aadhaarNumber ? (
                <Text style={[styles.memberAadhaar, { color: colors.textMuted }]}>Aadhaar: {member.aadhaarNumber}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <View style={styles.emptyMembersBox}>
            <Text style={[styles.emptyMembersText, { color: colors.textMuted }]}>
              {language === 'hi' ? 'कोई सदस्य विवरण दर्ज नहीं है' : 'No individual members recorded'}
            </Text>
          </View>
        )}

        {/* Surveyor Metadata */}
        <View style={[styles.surveyorMetaCard, SHADOWS.sm, { backgroundColor: isDark ? colors.surface : colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
          <Text style={[styles.metaCardTitle, { color: colors.textSecondary }]}>
            {language === 'hi' ? 'सर्वेक्षण ऑडिट विवरण' : 'Survey Audit Details'}
          </Text>
          <Text style={[styles.metaCardText, { color: colors.textMuted }]}>
            {language === 'hi' ? 'सर्वेक्षक:' : 'Surveyor:'} {family.surveyorName || (language === 'hi' ? 'पंचायत फील्ड स्टाफ' : 'Panchayat Staff')}
          </Text>
          <Text style={[styles.metaCardText, { color: colors.textMuted }]}>
            {language === 'hi' ? 'दिनांक:' : 'Date:'} {family.surveyDate ? new Date(family.surveyDate).toLocaleDateString() : 'Recorded'}
          </Text>
          {family.location && (
            <Text style={[styles.metaCardText, { color: colors.textMuted }]}>
              GPS: {family.location.latitude?.toFixed(4)}, {family.location.longitude?.toFixed(4)}
            </Text>
          )}
        </View>

        {/* Delete Record (Admin Only) */}
        {isAdmin && (
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: isDark ? '#450A0A' : '#FEE2E2' }]}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={[styles.deleteBtnText, { color: colors.danger }]}>
              {language === 'hi' ? 'सर्वेक्षण रिकॉर्ड हटाएं (Delete)' : 'Delete Survey Record'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Digital Family ID Card Modal */}
      <FamilyIdCardModal
        visible={idCardModalVisible}
        onClose={() => setIdCardModalVisible(false)}
        family={family}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  backBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: SIZES.radiusMd,
  },
  backBtnText: {
    color: COLORS.surface,
    fontWeight: '700',
  },
  appBar: {
    backgroundColor: COLORS.primary,
    paddingTop: 45,
    paddingHorizontal: SIZES.lg,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.surface,
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    paddingBottom: 60,
  },
  dossierCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 20,
  },
  dossierTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  idChip: {
    backgroundColor: COLORS.primarySubtle,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: SIZES.radiusSm,
  },
  idChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  bplPill: {
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  bplPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.danger,
  },
  categoryPill: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  headTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 12,
  },
  infoLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  callActionBar: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    marginTop: 16,
    gap: 8,
  },
  callActionBarText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  printActionBar: {
    backgroundColor: COLORS.primarySubtle,
    borderWidth: 1,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: SIZES.radiusMd,
    marginTop: 10,
    gap: 8,
  },
  idCardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    marginTop: 12,
    gap: 8,
  },
  idCardActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  printActionBarText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 18,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  docLeft: {
    flex: 1,
  },
  docLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  docValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceSubtle,
    marginVertical: 10,
  },
  twoColRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  col: {
    flex: 1,
  },
  colLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  colValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  amenityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surfaceSubtle,
  },
  amenityActive: {
    backgroundColor: COLORS.primarySubtle,
  },
  amenityText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  memberCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 10,
  },
  memberTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  memberRelation: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  memberMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  memberMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceSubtle,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  memberMetaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  memberAadhaar: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  emptyMembersBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyMembersText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  surveyorMetaCard: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: SIZES.radiusMd,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  metaCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  metaCardText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    marginTop: 24,
    gap: 8,
  },
  deleteBtnText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});
