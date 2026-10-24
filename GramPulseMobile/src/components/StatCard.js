import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SHADOWS, SIZES } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

export function StatCard({ title, titleHi, value, icon, color, bgColor }) {
  const { colors, isDarkMode } = useTheme();
  const cardColor = color || colors.primary;
  const cardBg = bgColor || (isDarkMode ? '#064E3B' : colors.primarySubtle);

  return (
    <View style={[styles.card, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <View style={[styles.iconBox, { backgroundColor: cardBg }]}>
        <MaterialCommunityIcons name={icon} size={22} color={cardColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
        {titleHi && <Text style={[styles.titleHi, { color: colors.textMuted }]}>{titleHi}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1,
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
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  titleHi: {
    fontSize: 10,
  },
});
