import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { useData } from '../../contexts/DataContext';
import { Header } from '../../components/Header';

export function AnalyticsScreen() {
  const { stats, selectedVillage } = useData();

  const totalPop = stats.totalPopulation || 1;
  const malePercent = Math.round((stats.maleCount / totalPop) * 100);
  const femalePercent = 100 - malePercent;

  const totalFam = stats.totalFamilies || 1;
  const bplPercent = Math.round((stats.bplCount / totalFam) * 100);
  const aplPercent = 100 - bplPercent;

  const casteArray = Object.entries(stats.casteMap).sort((a, b) => b[1] - a[1]);
  const mohallaArray = Object.entries(stats.mohallaMap).sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.container}>
      <Header title="Village Demographics" showVillagePicker={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Village Summary Header */}
        <View style={[styles.villageCard, SHADOWS.sm]}>
          <Text style={styles.villageTitle}>
            {selectedVillage === 'All' ? 'All Gram Panchayats' : selectedVillage}
          </Text>
          <Text style={styles.villageSub}>
            Census & Demographic Analytics ({stats.totalFamilies} Families • {stats.totalPopulation} Residents)
          </Text>
        </View>

        {/* Gender Breakdown Section */}
        <View style={[styles.card, SHADOWS.sm]}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="gender-male-female" size={22} color={COLORS.primary} />
            <Text style={styles.cardHeaderTitle}>Gender Distribution (लिंगानुपात)</Text>
          </View>

          <View style={styles.genderStatsRow}>
            <View style={styles.genderItem}>
              <Text style={styles.genderCount}>{stats.maleCount}</Text>
              <Text style={styles.genderLabel}>Male (पुरुष)</Text>
              <Text style={styles.genderPercent}>{malePercent}%</Text>
            </View>
            <View style={styles.genderDivider} />
            <View style={styles.genderItem}>
              <Text style={styles.genderCount}>{stats.femaleCount}</Text>
              <Text style={styles.genderLabel}>Female (महिला)</Text>
              <Text style={styles.genderPercent}>{femalePercent}%</Text>
            </View>
          </View>

          {/* Visual Ratio Bar */}
          <View style={styles.ratioBarContainer}>
            <View style={[styles.ratioBarLeft, { flex: malePercent || 1 }]} />
            <View style={[styles.ratioBarRight, { flex: femalePercent || 1 }]} />
          </View>
        </View>

        {/* Economic / BPL Status */}
        <View style={[styles.card, SHADOWS.sm]}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="card-account-details-outline" size={22} color={COLORS.danger} />
            <Text style={styles.cardHeaderTitle}>Economic Classification (आर्थिक स्थिति)</Text>
          </View>

          <View style={styles.bplStatsRow}>
            <View style={styles.bplCol}>
              <Text style={[styles.bplCount, { color: COLORS.danger }]}>{stats.bplCount}</Text>
              <Text style={styles.bplLabel}>BPL Households</Text>
              <Text style={styles.bplSub}>{bplPercent}% of village</Text>
            </View>
            <View style={styles.bplCol}>
              <Text style={[styles.bplCount, { color: COLORS.info }]}>{totalFam - stats.bplCount}</Text>
              <Text style={styles.bplLabel}>APL / Other</Text>
              <Text style={styles.bplSub}>{aplPercent}% of village</Text>
            </View>
          </View>
        </View>

        {/* Caste Breakdown */}
        <View style={[styles.card, SHADOWS.sm]}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="account-group" size={22} color={COLORS.scBadge} />
            <Text style={styles.cardHeaderTitle}>Caste Breakdown (जातिवार विवरण)</Text>
          </View>

          {casteArray.map(([caste, count]) => {
            const pct = Math.round((count / totalFam) * 100);
            return (
              <View key={caste} style={styles.barItem}>
                <View style={styles.barItemTop}>
                  <Text style={styles.barItemLabel}>{caste}</Text>
                  <Text style={styles.barItemValue}>
                    {count} Families ({pct}%)
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: COLORS.primary }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Mohalla Distribution */}
        <View style={[styles.card, SHADOWS.sm]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="location-outline" size={22} color={COLORS.accent} />
            <Text style={styles.cardHeaderTitle}>Mohalla Demographics (मोहल्लावार)</Text>
          </View>

          {mohallaArray.map(([mohalla, count]) => {
            const pct = Math.round((count / totalFam) * 100);
            return (
              <View key={mohalla} style={styles.barItem}>
                <View style={styles.barItemTop}>
                  <Text style={styles.barItemLabel}>{mohalla}</Text>
                  <Text style={styles.barItemValue}>
                    {count} Households ({pct}%)
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: COLORS.accent }]} />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.lg,
    paddingBottom: 90,
  },
  villageCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  villageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  villageSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  genderStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  genderItem: {
    alignItems: 'center',
  },
  genderCount: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  genderLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  genderPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  genderDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.cardBorder,
  },
  ratioBarContainer: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: COLORS.surfaceSubtle,
  },
  ratioBarLeft: {
    backgroundColor: COLORS.info,
  },
  ratioBarRight: {
    backgroundColor: COLORS.scBadge,
  },
  bplStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  bplCol: {
    alignItems: 'center',
  },
  bplCount: {
    fontSize: 22,
    fontWeight: '800',
  },
  bplLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bplSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  barItem: {
    marginVertical: 6,
  },
  barItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barItemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  barItemValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceSubtle,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
