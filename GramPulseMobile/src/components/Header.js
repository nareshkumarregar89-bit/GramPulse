import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { VillagePickerModal } from './VillagePickerModal';

export function Header({
  title,
  showVillagePicker = true,
  rightAction,
  onSearchPress,
  showQrScanner = true,
}) {
  const navigation = useNavigation();
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  const { language, isHindi, toggleLanguage, t } = useLanguage();
  const { selectedVillage } = useData();
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenQrScanner = () => {
    try {
      navigation.navigate('QrScanner');
    } catch (e) {
      console.log('Navigation to QrScanner note:', e);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#064E3B' : colors.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={isDarkMode ? '#022C22' : colors.primaryDark} />

      {/* Brand & Title */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.appName}>{title || 'VillagePulse'}</Text>
            <Text style={styles.appSub}>
              {isHindi ? 'विलेज पल्स • Rural Survey' : 'VillagePulse • Rural Survey'}
            </Text>
          </View>
        </View>

        {/* Right Action Icons */}
        <View style={styles.actionsRow}>
          {/* Language Switch Button */}
          <TouchableOpacity
            style={styles.langBtn}
            onPress={toggleLanguage}
            activeOpacity={0.75}
            accessibilityLabel="Switch Language"
          >
            <Ionicons name="globe-outline" size={13} color="#FFFFFF" style={{ marginRight: 3 }} />
            <Text style={styles.langBtnText}>{isHindi ? 'हिंदी' : 'English'}</Text>
          </TouchableOpacity>

          {/* Quick Dark Mode Toggle */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={toggleDarkMode}
            activeOpacity={0.7}
            accessibilityLabel="Toggle Dark Mode"
          >
            <Ionicons
              name={isDarkMode ? 'sunny' : 'moon'}
              size={18}
              color={isDarkMode ? '#FBBF24' : '#FFFFFF'}
            />
          </TouchableOpacity>

          {/* QR Code Camera Scanner Button */}
          {showQrScanner && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={handleOpenQrScanner}
              activeOpacity={0.7}
              accessibilityLabel="Scan QR Code"
            >
              <MaterialCommunityIcons name="qrcode-scan" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Search Button */}
          {onSearchPress && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onSearchPress}
              activeOpacity={0.7}
              accessibilityLabel="Search"
            >
              <Ionicons name="search" size={18} color="#FFFFFF" />
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
          <Ionicons name="location-sharp" size={16} color={colors.accent} />
          <Text style={styles.villageText} numberOfLines={1}>
            {selectedVillage || 'Select Village'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
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
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
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
    gap: 6,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  langBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  villagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
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
    color: '#FFFFFF',
  },
  titleRow: {
    marginTop: 8,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
