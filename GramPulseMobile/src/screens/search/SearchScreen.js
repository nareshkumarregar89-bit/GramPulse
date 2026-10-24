import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FamilyCard } from '../../components/FamilyCard';

export function SearchScreen({ navigation }) {
  const { filteredFamilies } = useData();
  const { colors, isDarkMode } = useTheme();
  const [query, setQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // 'all' | 'janAadhaar' | 'name' | 'mobile'

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    return filteredFamilies.filter((f) => {
      const headEn = (f.familyHeadNameEnglish || '').toLowerCase();
      const headHi = (f.familyHeadNameHindi || '').toLowerCase();
      const head = (f.familyHeadName || '').toLowerCase();
      const father = (f.fatherName || f.fatherNameEnglish || '').toLowerCase();
      const id = (f.id || '').toLowerCase();
      const jan = (f.janAadhaarNumber || f.janAadhaar || '').toLowerCase();
      const ration = (f.rationCardNumber || f.rationCard || '').toLowerCase();
      const mobile = (f.mobile || '').toLowerCase();
      const house = (f.houseNumber || '').toLowerCase();

      if (searchFilter === 'janAadhaar') {
        return jan.includes(q);
      }
      if (searchFilter === 'name') {
        return headEn.includes(q) || headHi.includes(q) || head.includes(q) || father.includes(q);
      }
      if (searchFilter === 'mobile') {
        return mobile.includes(q);
      }

      return (
        headEn.includes(q) ||
        headHi.includes(q) ||
        head.includes(q) ||
        father.includes(q) ||
        id.includes(q) ||
        jan.includes(q) ||
        ration.includes(q) ||
        mobile.includes(q) ||
        house.includes(q)
      );
    });
  }, [filteredFamilies, query, searchFilter]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Search App Bar */}
      <View style={[styles.topBar, { backgroundColor: isDarkMode ? '#064E3B' : colors.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={[styles.searchInputWrapper, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Search Jan Aadhaar, Name, Mobile..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {Boolean(query) && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.qrBtn}
          onPress={() => navigation.navigate('QrScanner')}
          accessibilityLabel="Scan QR"
        >
          <MaterialCommunityIcons name="qrcode-scan" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, searchFilter === 'all' && styles.filterChipActive]}
          onPress={() => setSearchFilter('all')}
        >
          <Text style={[styles.filterChipText, searchFilter === 'all' && styles.filterChipTextActive]}>
            All Fields
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, searchFilter === 'name' && styles.filterChipActive]}
          onPress={() => setSearchFilter('name')}
        >
          <Text style={[styles.filterChipText, searchFilter === 'name' && styles.filterChipTextActive]}>
            Head Name
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, searchFilter === 'janAadhaar' && styles.filterChipActive]}
          onPress={() => setSearchFilter('janAadhaar')}
        >
          <Text style={[styles.filterChipText, searchFilter === 'janAadhaar' && styles.filterChipTextActive]}>
            Jan Aadhaar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, searchFilter === 'mobile' && styles.filterChipActive]}
          onPress={() => setSearchFilter('mobile')}
        >
          <Text style={[styles.filterChipText, searchFilter === 'mobile' && styles.filterChipTextActive]}>
            Mobile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Header */}
      {Boolean(query) && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            Found <Text style={styles.bold}>{results.length}</Text> matches
          </Text>
        </View>
      )}

      {/* Results List */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FamilyCard
            family={item}
            onPress={() => navigation.navigate('FamilyDetail', { id: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          query ? (
            <View style={styles.emptyContainer}>
              <Feather name="alert-circle" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Matching Households</Text>
              <Text style={styles.emptySub}>
                Check spelling or try searching with Jan Aadhaar number
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={COLORS.cardBorder} />
              <Text style={styles.emptyTitle}>Type to Search Survey Records</Text>
              <Text style={styles.emptySub}>
                Instant fuzzy search across {families.length} families
              </Text>
            </View>
          )
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
  topBar: {
    backgroundColor: COLORS.primary,
    paddingTop: 45,
    paddingHorizontal: SIZES.lg,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surfaceSubtle,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.surface,
  },
  resultsHeader: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bold: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  listContent: {
    paddingBottom: 50,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
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
