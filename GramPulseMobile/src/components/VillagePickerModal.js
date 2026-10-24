import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { useData } from '../contexts/DataContext';

export function VillagePickerModal({ visible, onClose }) {
  const { villagesList, selectedVillage, changeSelectedVillage } = useData();

  const options = ['All (सभी गाँव)', ...villagesList];

  const handleSelect = (v) => {
    changeSelectedVillage(v === 'All (सभी गाँव)' ? 'All' : v);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>Switch Village (गाँव चुनें)</Text>
            <Text style={styles.subtitle}>Select village to view census data</Text>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected =
                (item === 'All (सभी गाँव)' && selectedVillage === 'All') ||
                item === selectedVillage;

              return (
                <TouchableOpacity
                  style={[styles.itemRow, isSelected && styles.itemRowActive]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemLeft}>
                    <Ionicons
                      name="location"
                      size={20}
                      color={isSelected ? COLORS.primary : COLORS.textMuted}
                    />
                    <Text
                      style={[styles.itemText, isSelected && styles.itemTextActive]}
                    >
                      {item}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.radiusLg * 1.5,
    borderTopRightRadius: SIZES.radiusLg * 1.5,
    padding: SIZES.lg,
    maxHeight: '70%',
    ...SHADOWS.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.cardBorder,
    marginBottom: SIZES.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: SIZES.radiusMd,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemRowActive: {
    backgroundColor: COLORS.primarySubtle,
    borderColor: COLORS.primaryLight,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  itemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: SIZES.md,
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
