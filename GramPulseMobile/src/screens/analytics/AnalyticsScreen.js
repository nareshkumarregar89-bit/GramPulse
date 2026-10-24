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
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

export function AnalyticsScreen() {
  const { stats, selectedVillage, hasAccess } = useData();
  const { isAdmin } = useAuth();
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();

  const totalPop = stats.totalPopulation || (hasAccess ? 1 : 0);
  const malePercent = totalPop > 0 ? Math.round((stats.maleCount / totalPop) * 100) : 0;
  const femalePercent = totalPop > 0 ? 100 - malePercent : 0;

  const totalFam = stats.totalFamilies || (hasAccess ? 1 : 0);
  const bplPercent = totalFam > 0 ? Math.round((stats.bplCount / totalFam) * 100) : 0;
  const aplPercent = totalFam > 0 ? 100 - bplPercent : 0;

  const casteArray = Object.entries(stats.casteMap).sort((a, b) => b[1] - a[1]);
  const mohallaArray = Object.entries(stats.mohallaMap).sort((a, b) => b[1] - a[1]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('analyticsTitle', 'Village Demographics')} showVillagePicker={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Authorization Restriction Notice */}
        {!hasAccess && !isAdmin && (
          <View style={[styles.villageCard, { backgroundColor: isDark ? '#451A03' : '#FEF3C7', borderColor: isDark ? '#78350F' : '#FDE68A', marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="shield-lock-outline" size={24} color="#D97706" />
              <Text style={{ fontSize: 14, fontWeight: '800', color: isDark ? '#FDE68A' : '#92400E' }}>
                {t('approvalPending', 'डेटा एक्सेस लंबित (Access Restricted)')}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: isDark ? '#FBBF24' : '#B45309', marginTop: 4, lineHeight: 18 }}>
              {t('approvalPendingDesc', 'सर्वेक्षण एवं जनसांख्यिकी आँकड़े केवल व्यवस्थापक द्वारा खाता स्वीकृत एवं गाँव आवंटित किए जाने के बाद दिखाई देंगे।')}
            </Text>
          </View>
        )}

        {/* Village Summary Header */}
        <View style={[styles.villageCard, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.villageTitle, { color: colors.textPrimary }]}>
            {selectedVillage === 'All' ? (language === 'hi' ? 'सभी ग्राम पंचायतें (All Villages)' : 'All Gram Panchayats') : selectedVillage}
          </Text>
          <Text style={[styles.villageSub, { color: colors.textSecondary }]}>
            {language === 'hi'
              ? `जनसांख्यिकी विश्लेषण (${stats.totalFamilies} परिवार • ${stats.totalPopulation} कुल जनसंख्या)`
              : `Census & Demographic Analytics (${stats.totalFamilies} Families • ${stats.totalPopulation} Residents)`}
          </Text>
        </View>

        {/* Gender Breakdown Section */}
        <View style={[styles.card, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="gender-male-female" size={22} color={colors.primary} />
            <Text style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}>
              {language === 'hi' ? 'लिंगानुपात (Gender Distribution)' : 'Gender Distribution'}
            </Text>
          </View>

          <View style={styles.genderStatsRow}>
            <View style={styles.genderItem}>
              <Text style={[styles.genderCount, { color: colors.textPrimary }]}>{stats.maleCount}</Text>
              <Text style={[styles.genderLabel, { color: colors.textSecondary }]}>
                {t('male', 'Male')} {language === 'hi' ? '(पुरुष)' : ''}
              </Text>
              <Text style={[styles.genderPercent, { color: colors.primary }]}>{malePercent}%</Text>
            </View>
            <View style={[styles.genderDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.genderItem}>
              <Text style={[styles.genderCount, { color: colors.textPrimary }]}>{stats.femaleCount}</Text>
              <Text style={[styles.genderLabel, { color: colors.textSecondary }]}>
                {t('female', 'Female')} {language === 'hi' ? '(महिला)' : ''}
              </Text>
              <Text style={[styles.genderPercent, { color: colors.primary }]}>{femalePercent}%</Text>
            </View>
          </View>

          {/* Visual Ratio Bar */}
          <View style={[styles.ratioBarContainer, { backgroundColor: isDark ? colors.background : colors.surfaceSubtle }]}>
            <View style={[styles.ratioBarLeft, { flex: malePercent || 1, backgroundColor: colors.info }]} />
            <View style={[styles.ratioBarRight, { flex: femalePercent || 1, backgroundColor: colors.accent }]} />
          </View>
        </View>

        {/* Economic / BPL Status */}
        <View style={[styles.card, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="card-account-details-outline" size={22} color={colors.danger} />
            <Text style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}>
              {language === 'hi' ? 'आर्थिक स्थिति (Economic Classification)' : 'Economic Classification'}
            </Text>
          </View>

          <View style={styles.bplStatsRow}>
            <View style={styles.bplCol}>
              <Text style={[styles.bplCount, { color: colors.danger }]}>{stats.bplCount}</Text>
              <Text style={[styles.bplLabel, { color: colors.textSecondary }]}>
                {language === 'hi' ? 'बीपीएल परिवार (BPL)' : 'BPL Households'}
              </Text>
              <Text style={[styles.bplSub, { color: colors.textMuted }]}>
                {bplPercent}% {language === 'hi' ? 'गाँव का' : 'of village'}
              </Text>
            </View>
            <View style={styles.bplCol}>
              <Text style={[styles.bplCount, { color: colors.info }]}>{totalFam - stats.bplCount}</Text>
              <Text style={[styles.bplLabel, { color: colors.textSecondary }]}>
                {language === 'hi' ? 'सामान्य / अन्य (APL)' : 'APL / Other'}
              </Text>
              <Text style={[styles.bplSub, { color: colors.textMuted }]}>
                {aplPercent}% {language === 'hi' ? 'गाँव का' : 'of village'}
              </Text>
            </View>
          </View>
        </View>

        {/* Caste Breakdown */}
        <View style={[styles.card, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="account-group" size={22} color={colors.primary} />
            <Text style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}>
              {language === 'hi' ? 'जातिवार विवरण (Caste Breakdown)' : 'Caste Breakdown'}
            </Text>
          </View>

          {casteArray.map(([caste, count]) => {
            const pct = Math.round((count / totalFam) * 100);
            return (
              <View key={caste} style={styles.barItem}>
                <View style={styles.barItemTop}>
                  <Text style={[styles.barItemLabel, { color: colors.textPrimary }]}>{caste}</Text>
                  <Text style={[styles.barItemValue, { color: colors.textSecondary }]}>
                    {count} {language === 'hi' ? 'परिवार' : 'Families'} ({pct}%)
                  </Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: isDark ? colors.background : colors.surfaceSubtle }]}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Mohalla Distribution */}
        <View style={[styles.card, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="location-outline" size={22} color={colors.accent} />
            <Text style={[styles.cardHeaderTitle, { color: colors.textPrimary }]}>
              {language === 'hi' ? 'मोहल्लावार विवरण (Mohalla Distribution)' : 'Mohalla Demographics'}
            </Text>
          </View>

          {mohallaArray.map(([mohalla, count]) => {
            const pct = Math.round((count / totalFam) * 100);
            return (
              <View key={mohalla} style={styles.barItem}>
                <View style={styles.barItemTop}>
                  <Text style={[styles.barItemLabel, { color: colors.textPrimary }]}>{mohalla}</Text>
                  <Text style={[styles.barItemValue, { color: colors.textSecondary }]}>
                    {count} {language === 'hi' ? 'परिवार' : 'Households'} ({pct}%)
                  </Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: isDark ? colors.background : colors.surfaceSubtle }]}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: colors.accent }]} />
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
