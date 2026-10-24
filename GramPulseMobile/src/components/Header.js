import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { useData } from '../contexts/DataContext';
import { VillagePickerModal } from './VillagePickerModal';

export function Header({ title, showVillagePicker = true, rightAction, onSearchPress }) {
  const { selectedVillage } = useData();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      
      {/* Brand & Title */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="home-group" size={20} color={COLORS.surface} />
          </View>
          <View>
            <Text style={styles.appName}>VillagePulse</Text>
            <Text style={styles.appSub}>विलेज पल्स • Rural Survey</Text>
          </View>
        </View>

        {/* Right Action Icons */}
        <View style={styles.actionsRow}>
          {onSearchPress && (
            <TouchableOpacity style={styles.iconBtn} onPress={onSearchPress} activeOpacity={0.7}>
              <Ionicons name="search" size={20} color={COLORS.surface} />
            </TouchableOpacity>
          )}
          {rightAction}
        </View>
      </View>

      {/* Village Picker Pill */}
      {showVillagePicker && (
        <TouchableOpacity
          style={styles.villagePill}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="location-sharp" size={16} color={COLORS.accent} />
          <Text style={styles.villageText} numberOfLines={1}>
            {selectedVillage || 'Select Village'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.surface} />
        </TouchableOpacity>
      )}

      {/* Screen Title (Optional) */}
      {title && (
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
      )}

      <VillagePickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    paddingTop: 45,
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
    borderBottomLeftRadius: SIZES.radiusLg,
    borderBottomRightRadius: SIZES.radiusLg,
    ...SHADOWS.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.surface,
    letterSpacing: 0.5,
  },
  appSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  villagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusFull,
    gap: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  villageText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.surface,
  },
  titleRow: {
    marginTop: 8,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.surface,
  },
});
