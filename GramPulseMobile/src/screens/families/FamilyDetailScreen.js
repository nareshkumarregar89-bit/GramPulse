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
import { FamilyIdCardModal } from '../../components/FamilyIdCardModal';

export function FamilyDetailScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { getFamilyById, deleteFamily } = useData();
  const { isAdmin } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [idCardModalVisible, setIdCardModalVisible] = React.useState(false);

  const family = getFamilyById(id);

  if (!family) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={styles.notFoundText}>Family Record Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
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
      Alert.alert('No Contact Number', 'No mobile number was recorded for this household.');
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
      'रिकॉर्ड रीसायकल बिन में भेजें (Soft Delete)',
      `क्या आप परिवार ${family.id} का रिकॉर्ड रीसायकल बिन (Deleted Records) में भेजना चाहते हैं?\n\nआप इसे एडमिन पैनल से बाद में कभी भी पुनर्स्थापित (Restore) कर सकते हैं।`,
      [
        { text: 'रद्द करें', style: 'cancel' },
        {
          text: 'रीसायकल बिन में भेजें',
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
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.surface} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Family Dossier</Text>
        <View style={styles.appBarActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIdCardModalVisible(true)}
            accessibilityLabel="Digital ID Card"
          >
            <MaterialCommunityIcons name="qrcode" size={20} color={COLORS.surface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('DataPrint', { familyId: family.id })}
          >
            <Ionicons name="print-outline" size={20} color={COLORS.surface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={COLORS.surface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('EditSurvey', { id: family.id })}
          >
            <Feather name="edit-2" size={18} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Dossier Card */}
        <View style={[styles.dossierCard, SHADOWS.md]}>
          <View style={styles.dossierTop}>
            <View style={styles.idChip}>
              <Text style={styles.idChipText}>{family.id}</Text>
            </View>
            <View style={styles.badgeRow}>
              {isBpl && (
                <View style={styles.bplPill}>
                  <Text style={styles.bplPillText}>BPL</Text>
                </View>
              )}
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{family.caste || 'Caste'}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.headTitle}>
            {family.familyHeadNameHindi || family.familyHeadNameEnglish}
          </Text>
          {family.familyHeadNameEnglish && family.familyHeadNameHindi && (
            <Text style={styles.headSubtitle}>{family.familyHeadNameEnglish}</Text>
          )}

          {family.fatherName ? (
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>पिता/पति (Father/Husband):</Text>
              <Text style={styles.infoValue}>
                {family.fatherNameHindi || family.fatherNameEnglish || family.fatherName}
              </Text>
            </View>
          ) : null}

          <View style={styles.infoLine}>
            <Text style={styles.infoLabel}>गाँव (Village):</Text>
            <Text style={styles.infoValue}>{family.village || 'समोड़ी (Samodi)'}</Text>
          </View>

          <View style={styles.infoLine}>
            <Text style={styles.infoLabel}>मोहल्ला (Mohalla):</Text>
            <Text style={styles.infoValue}>{family.mohalla || 'Main Mohalla'}</Text>
          </View>

          {family.houseNumber ? (
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>मकान संख्या (House No):</Text>
              <Text style={styles.infoValue}>{family.houseNumber}</Text>
            </View>
          ) : null}

          {/* Quick Call Button */}
          {family.mobile && (
            <TouchableOpacity style={styles.callActionBar} onPress={handleCall} activeOpacity={0.8}>
              <Ionicons name="call" size={18} color={COLORS.surface} />
              <Text style={styles.callActionBarText}>Call {family.mobile}</Text>
            </TouchableOpacity>
          )}

          {/* Digital Family ID Card with QR Action */}
          <TouchableOpacity
            style={[styles.idCardActionBtn, { backgroundColor: isDarkMode ? '#064E3B' : colors.primaryLight }]}
            onPress={() => setIdCardModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="badge-account-horizontal" size={20} color={isDarkMode ? '#34D399' : colors.primaryDark} />
            <Text style={[styles.idCardActionText, { color: isDarkMode ? '#34D399' : colors.primaryDark }]}>
              डिजिटल पहचान पत्र व QR कोड (Digital ID Card)
            </Text>
          </TouchableOpacity>

          {/* Print Dossier Quick Action */}
          <TouchableOpacity
            style={styles.printActionBar}
            onPress={() => navigation.navigate('DataPrint', { familyId: family.id })}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
            <Text style={styles.printActionBarText}>Print Detailed Dossier (पीडीएफ / डॉसियर)</Text>
          </TouchableOpacity>
        </View>

        {/* Government Identity Documents */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="card-account-details" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Government Documents (दस्तावेज़)</Text>
        </View>

        <View style={[styles.sectionCard, SHADOWS.sm]}>
          <View style={styles.docRow}>
            <View style={styles.docLeft}>
              <Text style={styles.docLabel}>Jan Aadhaar (जन आधार)</Text>
              <Text style={styles.docValue}>
                {family.janAadhaarNumber || family.janAadhaar || 'Not Available'}
              </Text>
            </View>
            <MaterialCommunityIcons name="card-bulleted" size={24} color={COLORS.primary} />
          </View>

          <View style={styles.divider} />

          <View style={styles.docRow}>
            <View style={styles.docLeft}>
              <Text style={styles.docLabel}>Ration Card (राशन कार्ड)</Text>
              <Text style={styles.docValue}>
                {family.rationCardNumber || family.rationCard || 'Not Available'}
              </Text>
            </View>
            <MaterialCommunityIcons name="file-document-outline" size={24} color={COLORS.accent} />
          </View>

          <View style={styles.divider} />

          <View style={styles.docRow}>
            <View style={styles.docLeft}>
              <Text style={styles.docLabel}>Voter ID (मतदाता पहचान पत्र)</Text>
              <Text style={styles.docValue}>{family.voterId || 'Not Recorded'}</Text>
            </View>
            <Ionicons name="finger-print-outline" size={24} color={COLORS.info} />
          </View>
        </View>

        {/* Socio-Economic & Bank Info */}
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="rupee-sign" size={16} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Socio-Economic & Amenities</Text>
        </View>

        <View style={[styles.sectionCard, SHADOWS.sm]}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.colLabel}>Category</Text>
              <Text style={styles.colValue}>{family.category || 'General'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.colLabel}>Monthly Income</Text>
              <Text style={styles.colValue}>
                {family.monthlyIncome ? `₹ ${family.monthlyIncome}` : 'Not Stated'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.colLabel}>House Type</Text>
              <Text style={styles.colValue}>{family.houseType || 'Pucca'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.colLabel}>Occupation</Text>
              <Text style={styles.colValue}>{family.occupation || 'Agriculture'}</Text>
            </View>
          </View>

          {/* Amenities Grid */}
          <View style={styles.amenitiesContainer}>
            <View style={[styles.amenityPill, family.waterConnection && styles.amenityActive]}>
              <Ionicons
                name="water-outline"
                size={16}
                color={family.waterConnection ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={styles.amenityText}>Water</Text>
            </View>
            <View style={[styles.amenityPill, family.electricityConnection && styles.amenityActive]}>
              <Ionicons
                name="flash-outline"
                size={16}
                color={family.electricityConnection ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={styles.amenityText}>Electricity</Text>
            </View>
            <View style={[styles.amenityPill, family.toilet && styles.amenityActive]}>
              <MaterialCommunityIcons
                name="toilet"
                size={16}
                color={family.toilet ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={styles.amenityText}>Toilet</Text>
            </View>
            <View style={[styles.amenityPill, family.gasConnection && styles.amenityActive]}>
              <MaterialCommunityIcons
                name="gas-cylinder"
                size={16}
                color={family.gasConnection ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={styles.amenityText}>Gas</Text>
            </View>
          </View>
        </View>

        {/* Family Members Section */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>
            Family Members ({members.length} सदस्य)
          </Text>
        </View>

        {members.length > 0 ? (
          members.map((member, index) => (
            <View key={member.id || index} style={[styles.memberCard, SHADOWS.sm]}>
              <View style={styles.memberTop}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.avatarInitial}>
                    {(member.name || member.nameEnglish || 'M').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.nameHindi || member.nameEnglish || member.name}
                  </Text>
                  <Text style={styles.memberRelation}>
                    {member.relation || 'Member'} • {member.gender || 'Male'} • {member.age || '—'} वर्ष
                  </Text>
                </View>
              </View>

              <View style={styles.memberMetaRow}>
                {member.education ? (
                  <View style={styles.memberMetaBadge}>
                    <Ionicons name="school-outline" size={13} color={COLORS.textSecondary} />
                    <Text style={styles.memberMetaText}>{member.education}</Text>
                  </View>
                ) : null}
                {member.occupation ? (
                  <View style={styles.memberMetaBadge}>
                    <Ionicons name="briefcase-outline" size={13} color={COLORS.textSecondary} />
                    <Text style={styles.memberMetaText}>{member.occupation}</Text>
                  </View>
                ) : null}
                {member.maritalStatus ? (
                  <View style={styles.memberMetaBadge}>
                    <Ionicons name="heart-outline" size={13} color={COLORS.textSecondary} />
                    <Text style={styles.memberMetaText}>{member.maritalStatus}</Text>
                  </View>
                ) : null}
                {member.mobile ? (
                  <TouchableOpacity
                    style={[styles.memberMetaBadge, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9', borderWidth: 1 }]}
                    onPress={() => Linking.openURL(`tel:${member.mobile}`)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="call" size={13} color={COLORS.primary} />
                    <Text style={[styles.memberMetaText, { color: COLORS.primary, fontWeight: '700' }]}>{member.mobile}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {member.aadhaarNumber ? (
                <Text style={styles.memberAadhaar}>Aadhaar: {member.aadhaarNumber}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <View style={styles.emptyMembersBox}>
            <Text style={styles.emptyMembersText}>No individual members recorded</Text>
          </View>
        )}

        {/* Surveyor Metadata */}
        <View style={[styles.surveyorMetaCard, SHADOWS.sm]}>
          <Text style={styles.metaCardTitle}>Survey Audit Details</Text>
          <Text style={styles.metaCardText}>Surveyor: {family.surveyorName || 'Panchayat Staff'}</Text>
          <Text style={styles.metaCardText}>
            Date: {family.surveyDate ? new Date(family.surveyDate).toLocaleDateString() : 'Recorded'}
          </Text>
          {family.location && (
            <Text style={styles.metaCardText}>
              GPS: {family.location.latitude?.toFixed(4)}, {family.location.longitude?.toFixed(4)}
            </Text>
          )}
        </View>

        {/* Delete Record (Admin Only) */}
        {isAdmin && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text style={styles.deleteBtnText}>Delete Survey Record</Text>
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
