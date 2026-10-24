import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';

export function FamilyCard({ family, onPress }) {
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
      style={[styles.card, SHADOWS.sm]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {/* Top Row: ID & Badges */}
      <View style={styles.topRow}>
        <View style={styles.idBadge}>
          <Text style={styles.idText}>{family.id}</Text>
        </View>

        <View style={styles.badgesGroup}>
          {isBpl && (
            <View style={styles.bplBadge}>
              <Text style={styles.bplText}>BPL</Text>
            </View>
          )}
          <View style={styles.casteBadge}>
            <Text style={styles.casteText}>{family.caste || 'Caste'}</Text>
          </View>
        </View>
      </View>

      {/* Head Name */}
      <View style={styles.mainInfo}>
        <Text style={styles.headName} numberOfLines={1}>
          {family.familyHeadNameHindi || family.familyHeadNameEnglish || family.familyHeadName}
        </Text>
        {family.familyHeadNameEnglish && family.familyHeadNameHindi && (
          <Text style={styles.headNameEn} numberOfLines={1}>
            {family.familyHeadNameEnglish}
          </Text>
        )}
        {family.fatherName ? (
          <Text style={styles.fatherName} numberOfLines={1}>
            पिता/पति: {family.fatherNameHindi || family.fatherNameEnglish || family.fatherName}
          </Text>
        ) : null}
      </View>

      {/* Details Row: Mohalla & Village */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {family.mohalla || 'Main Mohalla'}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="account-group-outline" size={15} color={COLORS.primary} />
          <Text style={styles.membersCount}>
            {memberCount} {memberCount === 1 ? 'सदस्य' : 'सदस्य'}
          </Text>
        </View>
      </View>

      {/* Bottom Action Footer */}
      <View style={styles.footerRow}>
        <View style={styles.villageBadge}>
          <Text style={styles.villageText} numberOfLines={1}>
            {family.village || 'समोड़ी (Samodi)'}
          </Text>
        </View>

        <View style={styles.actionGroup}>
          {family.mobile ? (
            <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.7}>
              <Ionicons name="call" size={14} color={COLORS.primary} />
              <Text style={styles.callText}>{family.mobile}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.arrowBox}>
              <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginVertical: 6,
    marginHorizontal: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  idBadge: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  idText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bplBadge: {
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  bplText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.danger,
  },
  casteBadge: {
    backgroundColor: COLORS.primarySubtle,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  casteText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  mainInfo: {
    marginVertical: 4,
  },
  headName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headNameEn: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  fatherName: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceSubtle,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  membersCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  villageBadge: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: SIZES.radiusSm,
    maxWidth: '55%',
  },
  villageText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySubtle,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: SIZES.radiusFull,
    gap: 5,
  },
  callText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  arrowBox: {
    padding: 2,
  },
});
