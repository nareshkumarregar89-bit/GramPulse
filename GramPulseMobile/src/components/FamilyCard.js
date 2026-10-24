import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SHADOWS, SIZES } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export function FamilyCard({ family, onPress }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const memberCount = Array.isArray(family.members) ? family.members.length : 1;
  const isBpl = family.bplStatus === 'BPL' || family.category === 'BPL' || family.category === 'SC';

  const handleCall = (e) => {
    e.stopPropagation?.();
    if (family.mobile) {
      Linking.openURL(`tel:${family.mobile}`);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {/* Top Row: ID & Badges */}
      <View style={styles.topRow}>
        <View style={[styles.idBadge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
          <Text style={[styles.idText, { color: colors.primary }]}>{family.id}</Text>
        </View>

        <View style={styles.badgesGroup}>
          {isBpl && (
            <View style={[styles.bplBadge, { backgroundColor: colors.dangerLight || '#FEE2E2' }]}>
              <Text style={[styles.bplText, { color: colors.danger }]}>BPL</Text>
            </View>
          )}
          <View style={[styles.casteBadge, { backgroundColor: colors.primarySubtle }]}>
            <Text style={[styles.casteText, { color: colors.primary }]}>{family.caste || 'Caste'}</Text>
          </View>
        </View>
      </View>

      {/* Head Name */}
      <View style={styles.mainInfo}>
        <Text style={[styles.headName, { color: colors.textPrimary }]} numberOfLines={1}>
          {family.familyHeadNameHindi || family.familyHeadNameEnglish || family.familyHeadName}
        </Text>
        {family.familyHeadNameEnglish && family.familyHeadNameHindi && (
          <Text style={[styles.headNameEn, { color: colors.textSecondary }]} numberOfLines={1}>
            {family.familyHeadNameEnglish}
          </Text>
        )}
        {family.fatherName ? (
          <Text style={[styles.fatherName, { color: colors.textMuted }]} numberOfLines={1}>
            {family.fatherNameHindi || family.fatherNameEnglish || family.fatherName}
          </Text>
        ) : null}
      </View>

      {/* Details Row: Mohalla & Village */}
      <View style={[styles.metaRow, { borderTopColor: colors.surfaceSubtle }]}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
            {family.mohalla || 'Main Mohalla'}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="account-group-outline" size={15} color={colors.primary} />
          <Text style={[styles.membersCount, { color: colors.primary }]}>
            {memberCount} {t('membersCount', 'सदस्य')}
          </Text>
        </View>
      </View>

      {/* Bottom Action Footer */}
      <View style={styles.footerRow}>
        <View style={[styles.villageBadge, { backgroundColor: colors.surfaceSubtle }]}>
          <Text style={[styles.villageText, { color: colors.textSecondary }]} numberOfLines={1}>
            {family.village || 'समोड़ी (Samodi)'}
          </Text>
        </View>

        <View style={styles.actionGroup}>
          {family.mobile ? (
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: colors.primarySubtle }]}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={14} color={colors.primary} />
              <Text style={[styles.callText, { color: colors.primary }]}>{family.mobile}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.arrowBox}>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginVertical: 6,
    marginHorizontal: SIZES.lg,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  idBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
  },
  idText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bplBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  bplText: {
    fontSize: 10,
    fontWeight: '800',
  },
  casteBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  casteText: {
    fontSize: 10,
    fontWeight: '700',
  },
  mainInfo: {
    marginVertical: 4,
  },
  headName: {
    fontSize: 16,
    fontWeight: '800',
  },
  headNameEn: {
    fontSize: 13,
    fontWeight: '500',
  },
  fatherName: {
    fontSize: 12,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  membersCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  villageBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: SIZES.radiusSm,
    maxWidth: '55%',
  },
  villageText: {
    fontSize: 11,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: SIZES.radiusFull,
    gap: 5,
  },
  callText: {
    fontSize: 12,
    fontWeight: '600',
  },
  arrowBox: {
    padding: 2,
  },
});
