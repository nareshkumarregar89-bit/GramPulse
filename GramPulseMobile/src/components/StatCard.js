import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';

export function StatCard({ title, titleHi, value, icon, color = COLORS.primary, bgColor = COLORS.primarySubtle }) {
  return (
    <View style={[styles.card, SHADOWS.sm]}>
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.title}>{title}</Text>
        {titleHi && <Text style={styles.titleHi}>{titleHi}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 140,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  titleHi: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
