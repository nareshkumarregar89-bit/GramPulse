import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { useData } from '../../contexts/DataContext';
import { Header } from '../../components/Header';
import { FamilyCard } from '../../components/FamilyCard';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function FamiliesListScreen({ navigation }) {
  const { filteredFamilies, castes, mohallas, loading, refreshData, hasAccess } = useData();
  const { isAdmin, isPending } = useAuth();
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMohalla, setSelectedMohalla] = useState('All');
  const [selectedCaste, setSelectedCaste] = useState('All');

  // Multi-field filtered search
  const displayFamilies = useMemo(() => {
    return filteredFamilies.filter((f) => {
      // Mohalla filter
      if (selectedMohalla !== 'All' && f.mohalla !== selectedMohalla) {
        return false;
      }
      // Caste filter
      if (selectedCaste !== 'All' && f.caste !== selectedCaste) {
        return false;
      }
      // Query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const headEn = (f.familyHeadNameEnglish || '').toLowerCase();
      const headHi = (f.familyHeadNameHindi || '').toLowerCase();
      const head = (f.familyHeadName || '').toLowerCase();
      const father = (f.fatherName || f.fatherNameEnglish || '').toLowerCase();
      const id = (f.id || '').toLowerCase();
      const janAadhaar = (f.janAadhaarNumber || f.janAadhaar || '').toLowerCase();
      const ration = (f.rationCardNumber || f.rationCard || '').toLowerCase();
      const mobile = (f.mobile || '').toLowerCase();

      return (
        headEn.includes(q) ||
        headHi.includes(q) ||
        head.includes(q) ||
        father.includes(q) ||
        id.includes(q) ||
        janAadhaar.includes(q) ||
        ration.includes(q) ||
        mobile.includes(q)
      );
    });
  }, [filteredFamilies, searchQuery, selectedMohalla, selectedCaste]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('familiesListTitle', 'Family Directory')} showVillagePicker={true} />

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={t('searchFamilyPlaceholder', 'Search by Name, Jan Aadhaar, Mobile...')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mohalla Filter Chips */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          <TouchableOpacity
            style={[
              styles.chip,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              selectedMohalla === 'All' && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setSelectedMohalla('All')}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.textSecondary },
                selectedMohalla === 'All' && styles.chipTextActive,
              ]}
            >
              {t('allMohallas', 'All Mohallas')}
            </Text>
          </TouchableOpacity>
          {mohallas.map((m) => {
            const isAct = selectedMohalla === m;
            return (
              <TouchableOpacity
                key={m}
                style={[
                  styles.chip,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                  isAct && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setSelectedMohalla(isAct ? 'All' : m)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: colors.textSecondary },
                    isAct && styles.chipTextActive,
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Header Counter */}
      <View style={styles.resultsBar}>
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {language === 'hi' ? 'दिखाए जा रहे: ' : 'Showing '}
          <Text style={[styles.countBold, { color: colors.primary }]}>{displayFamilies.length}</Text>
          {language === 'hi' ? ' परिवार' : ' Families'}
        </Text>
        {(selectedMohalla !== 'All' || selectedCaste !== 'All' || searchQuery) && (
          <TouchableOpacity
            onPress={() => {
              setSelectedMohalla('All');
              setSelectedCaste('All');
              setSearchQuery('');
            }}
          >
            <Text style={[styles.clearFilterText, { color: colors.danger }]}>{t('resetFilters', 'Reset Filters')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Family Cards FlatList */}
      <FlatList
        data={displayFamilies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FamilyCard
            family={item}
            onPress={() => navigation.navigate('FamilyDetail', { id: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshData}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name={!hasAccess && !isAdmin ? 'shield-lock-outline' : 'search'}
              size={48}
              color={!hasAccess && !isAdmin ? '#D97706' : colors.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {!hasAccess && !isAdmin
                ? t('approvalPending', 'डेटा एक्सेस अभी उपलब्ध नहीं है')
                : t('noFamiliesFound', 'कोई परिवार रिकॉर्ड नहीं मिला')}
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted, textAlign: 'center' }]}>
              {!hasAccess && !isAdmin
                ? isPending
                  ? t('approvalPendingDesc', 'आपके खाते की व्यवस्थापक द्वारा स्वीकृति लंबित है।')
                  : t('allocationPendingDesc', 'प्रशासनिक रूप से गाँव आवंटित होने के बाद ही परिवार सूची दिखाई देगी।')
                : t('noFamiliesSub', 'फ़िल्टर बदलें या दूसरा खोज शब्द दर्ज करें')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchSection: {
    paddingHorizontal: SIZES.lg,
    marginTop: -16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  filtersSection: {
    marginTop: 12,
  },
  chipsScroll: {
    paddingHorizontal: SIZES.lg,
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.surface,
  },
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    marginTop: 12,
    marginBottom: 6,
  },
  resultsCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  countBold: {
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  listContent: {
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
