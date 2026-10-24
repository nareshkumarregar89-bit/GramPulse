import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SHADOWS, SIZES } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { FamilyCard } from '../../components/FamilyCard';

export function DashboardScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const { t, isHindi } = useLanguage();
  const { stats, filteredFamilies, selectedVillage, loading, refreshData, hasAccess } = useData();
  const { currentUser, userProfile, isAdmin, isPending, isUnassigned } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (typeof refreshData === 'function') {
      await refreshData();
    }
    setRefreshing(false);
  }, [refreshData]);

  const recentSurveys = filteredFamilies.slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showVillagePicker={true}
        onSearchPress={() => navigation.navigate('Search')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Pending Approval / Unassigned Village Notice Banner */}
        {isPending ? (
          <View style={[styles.warningBanner, { backgroundColor: colors.warningLight || '#FEF3C7', borderColor: '#FDE68A' }]}>
            <MaterialCommunityIcons name="clock-alert-outline" size={24} color="#D97706" />
            <View style={styles.warningBannerTextWrap}>
              <Text style={styles.warningBannerTitle}>{t('approvalPending', 'खाता सत्यापन लंबित (Approval Pending)')}</Text>
              <Text style={styles.warningBannerDesc}>
                {t('approvalPendingDesc', 'आपका खाता अभी व्यवस्थापक (Admin) की स्वीकृति की प्रतीक्षा कर रहा है। व्यवस्थापक द्वारा स्वीकृति और गाँव आवंटन के बाद आपको डेटा दिखाई देगा।')}
              </Text>
            </View>
          </View>
        ) : isUnassigned && !isAdmin ? (
          <View style={[styles.warningBanner, { backgroundColor: colors.infoLight || '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <MaterialCommunityIcons name="map-marker-alert-outline" size={24} color="#2563EB" />
            <View style={styles.warningBannerTextWrap}>
              <Text style={[styles.warningBannerTitle, { color: '#1E40AF' }]}>
                {t('allocationPending', 'गाँव आवंटन प्रतीक्षित (Allocation Pending)')}
              </Text>
              <Text style={[styles.warningBannerDesc, { color: '#1E3A8A' }]}>
                {t('allocationPendingDesc', 'आपको अभी तक कोई गाँव (समोड़ी या कोटड़ी) आवंटित नहीं किया गया है। कृपया व्यवस्थापक (Admin) से गाँव आवंटन हेतु संपर्क करें।')}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Welcome Greeting Banner */}
        <View style={[styles.bannerCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.bannerLeft}>
            <Text style={[styles.welcomeGreeting, { color: colors.textPrimary }]}>
              {t('welcome', 'नमस्ते')}, {userProfile?.name || currentUser?.displayName || t('surveyor', 'Surveyor')}
            </Text>
            <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>
              {selectedVillage === 'All'
                ? t('allPanchayatData', 'सभी ग्राम पंचायत सर्वेक्षण डेटा')
                : `${selectedVillage} • ${t('digitalFamilyRecord', 'डिजिटल परिवार रिकॉर्ड')}`}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: colors.primarySubtle }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.statusPillText, { color: colors.primary }]}>
                {isAdmin ? t('superAdmin', 'Super Administrator') : t('surveyor', 'Surveyor')}
              </Text>
            </View>
          </View>
          <View style={[styles.bannerBadge, { backgroundColor: colors.primarySubtle }]}>
            <MaterialCommunityIcons name="shield-check" size={28} color={colors.primary} />
          </View>
        </View>

        {/* Primary KPI Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('censusOverview', 'Census Overview (सर्वेक्षण सांख्यिकी)')}
          </Text>
        </View>

        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <StatCard
              title={t('totalFamilies', 'Total Families')}
              titleHi={isHindi ? 'कुल परिवार' : 'Households'}
              value={stats.totalFamilies}
              icon="home-group"
              color={colors.primary}
              bgColor={colors.primarySubtle}
            />
            <StatCard
              title={t('population', 'Population')}
              titleHi={isHindi ? 'कुल जनसंख्या' : 'Individuals'}
              value={stats.totalPopulation}
              icon="account-group"
              color={colors.info}
              bgColor={colors.infoLight}
            />
          </View>

          <View style={styles.kpiRow}>
            <StatCard
              title={t('maleFemale', 'Male / Female')}
              titleHi={isHindi ? 'पुरुष / महिला' : 'Gender Ratio'}
              value={`${stats.maleCount} / ${stats.femaleCount}`}
              icon="gender-male-female"
              color="#A855F7"
              bgColor={isDarkMode ? '#3B0764' : '#F3E8FF'}
            />
            <StatCard
              title={t('bplHouseholds', 'BPL Households')}
              titleHi={isHindi ? 'बीपीएल परिवार' : 'Ration Support'}
              value={stats.bplCount}
              icon="card-account-details-star"
              color={colors.danger}
              bgColor={colors.dangerLight}
            />
          </View>
        </View>

        {/* Quick Action Dock */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('quickActions', 'Quick Actions (त्वरित कार्य)')}
          </Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: isDarkMode ? '#064E3B' : colors.primarySubtle, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Survey')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.primary }]}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              {t('actionNewSurvey', 'New Survey')}
            </Text>
            <Text style={[styles.actionSub, { color: colors.textSecondary }]}>
              {t('actionNewSurveySub', 'नया परिवार जोड़ें')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: isDarkMode ? '#14532D' : '#F0FDF4', borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('DataPrint')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#16A34A' }]}>
              <Ionicons name="print-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              {t('actionDataPrint', 'Data Print')}
            </Text>
            <Text style={[styles.actionSub, { color: colors.textSecondary }]}>
              {t('actionDataPrintSub', 'पीडीएफ व डॉसियर')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: isDarkMode ? '#1E3A8A' : colors.infoLight, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.info }]}>
              <Ionicons name="search" size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              {t('actionSearch', 'Search Data')}
            </Text>
            <Text style={[styles.actionSub, { color: colors.textSecondary }]}>
              {t('actionSearchSub', 'आईडी / नाम से खोजें')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: isDarkMode ? '#3B0764' : '#F3E8FF', borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('FamiliesTab')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#A855F7' }]}>
              <Ionicons name="list" size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              {t('actionDirectory', 'Directory')}
            </Text>
            <Text style={[styles.actionSub, { color: colors.textSecondary }]}>
              {t('actionDirectorySub', 'परिवार सूची देखें')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Admin Control Banner (If Admin) */}
        {isAdmin && (
          <View style={{ paddingHorizontal: SIZES.lg, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.adminActionCard, { backgroundColor: colors.surface, borderColor: '#6366F1' }]}
              onPress={() => navigation.navigate('AdminUserManagement')}
              activeOpacity={0.85}
            >
              <View style={styles.adminActionLeft}>
                <View style={[styles.adminActionIcon, { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' }]}>
                  <MaterialCommunityIcons name="shield-account" size={24} color="#6366F1" />
                </View>
                <View>
                  <Text style={[styles.adminActionTitle, { color: colors.textPrimary }]}>
                    {t('adminControlPanel', 'Admin Control Panel (प्रबंधन)')}
                  </Text>
                  <Text style={[styles.adminActionSub, { color: colors.textSecondary }]}>
                    {t('adminControlDesc', 'नए सर्वेक्षकों को अनुमति दें एवं गाँव आवंटित करें')}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>
        )}

        {/* Caste Breakdown Horizontal Bar */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('casteDistribution', 'Caste Distribution (जातिगत विवरण)')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Analytics')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>{t('viewAll', 'View All')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.casteScroll}>
          {Object.entries(stats.casteMap).map(([caste, count]) => (
            <View key={caste} style={[styles.casteChip, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <View style={[styles.casteDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.casteName, { color: colors.textPrimary }]}>{caste}</Text>
              <View style={[styles.casteBadge, { backgroundColor: colors.primarySubtle }]}>
                <Text style={[styles.casteCount, { color: colors.primary }]}>{count}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Recent Household Surveys */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('recentSurveys', 'Recent Surveys (हाल के सर्वेक्षण)')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('FamiliesTab')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              {t('viewAll', 'View All')} ({filteredFamilies.length})
            </Text>
          </TouchableOpacity>
        </View>

        {recentSurveys.length > 0 ? (
          recentSurveys.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              onPress={() => navigation.navigate('FamilyDetail', { id: family.id })}
            />
          ))
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <MaterialCommunityIcons
              name={!hasAccess && !isAdmin ? 'shield-lock-outline' : 'folder-open-outline'}
              size={40}
              color={!hasAccess && !isAdmin ? '#D97706' : colors.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {!hasAccess && !isAdmin
                ? (isHindi ? 'डेटा एक्सेस अभी उपलब्ध नहीं है' : 'Data Access Pending')
                : t('noSurveysYet', 'इस गाँव में अभी तक कोई परिवार दर्ज नहीं है')}
            </Text>
            {!hasAccess && !isAdmin ? (
              <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                {isPending
                  ? t('approvalPendingDesc', 'आपका सर्वेक्षक खाता अभी व्यवस्थापक की स्वीकृति की प्रतीक्षा कर रहा है।')
                  : t('allocationPendingDesc', 'प्रशासनिक रूप से कार्यक्षेत्र गाँव आवंटित होने के बाद ही परिवार दिखेंगे।')}
              </Text>
            ) : (
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Survey')}
              >
                <Text style={styles.emptyBtnText}>
                  {t('actionNewSurvey', 'Record First Survey')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
    paddingBottom: 90,
  },
  bannerCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.md,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  bannerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  welcomeGreeting: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primarySubtle,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: SIZES.radiusFull,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  bannerBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  kpiGrid: {
    paddingHorizontal: SIZES.lg,
    gap: 10,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionGrid: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    gap: 10,
  },
  actionCard: {
    flex: 1,
    padding: 12,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  actionSub: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  casteScroll: {
    paddingHorizontal: SIZES.lg,
    gap: 8,
  },
  casteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 8,
  },
  casteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  casteName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  casteBadge: {
    backgroundColor: COLORS.primarySubtle,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: SIZES.radiusFull,
  },
  casteCount: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  emptyBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: SIZES.radiusMd,
  },
  emptyBtnText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: SIZES.radiusMd,
    padding: 14,
    marginHorizontal: SIZES.lg,
    marginBottom: 14,
    gap: 12,
  },
  warningBannerTextWrap: {
    flex: 1,
  },
  warningBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  warningBannerDesc: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },
  adminActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: SIZES.radiusMd,
    padding: 14,
  },
  adminActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  adminActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3730A3',
  },
  adminActionSub: {
    fontSize: 11,
    color: '#6366F1',
    marginTop: 2,
  },
});
