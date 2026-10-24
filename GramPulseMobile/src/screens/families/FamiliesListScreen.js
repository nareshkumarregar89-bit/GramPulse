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

export function FamiliesListScreen({ navigation }) {
  const { filteredFamilies, castes, mohallas, loading, refreshData } = useData();
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
    <View style={styles.container}>
      <Header title="Family Directory" showVillagePicker={true} />

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, SHADOWS.sm]}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Name, Jan Aadhaar, Mobile..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mohalla Filter Chips */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          <TouchableOpacity
            style={[styles.chip, selectedMohalla === 'All' && styles.chipActive]}
            onPress={() => setSelectedMohalla('All')}
          >
            <Text style={[styles.chipText, selectedMohalla === 'All' && styles.chipTextActive]}>
              All Mohallas
            </Text>
          </TouchableOpacity>
          {mohallas.map((m) => {
            const isAct = selectedMohalla === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.chip, isAct && styles.chipActive]}
                onPress={() => setSelectedMohalla(isAct ? 'All' : m)}
              >
                <Text style={[styles.chipText, isAct && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Header Counter */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsCount}>
          Showing <Text style={styles.countBold}>{displayFamilies.length}</Text> Families
        </Text>
        {(selectedMohalla !== 'All' || selectedCaste !== 'All' || searchQuery) && (
          <TouchableOpacity
            onPress={() => {
              setSelectedMohalla('All');
              setSelectedCaste('All');
              setSearchQuery('');
            }}
          >
            <Text style={styles.clearFilterText}>Reset Filters</Text>
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
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="search" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No matching family records</Text>
            <Text style={styles.emptySub}>Try searching with a different term or clear filters</Text>
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
