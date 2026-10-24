import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';

export function UpdateModal({ autoCheck = true, visibleOverride, onCloseOverride }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  // Check for updates
  const checkForUpdate = async (isManual = false) => {
    try {
      if (!Updates.isEnabled) {
        if (isManual) {
          Alert.alert(
            'अपडेट स्थिति (Update Status)',
            'यह ऐप वर्तमान में नवीनतम संस्करण (Latest Version) पर चल रहा है।'
          );
        }
        return;
      }

      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setUpdateInfo(update);
        setModalVisible(true);
      } else if (isManual) {
        Alert.alert(
          'कोई नया अपडेट नहीं (Up to Date)',
          'आप पहले से ही VillagePulse के नवीनतम संस्करण का उपयोग कर रहे हैं।'
        );
      }
    } catch (error) {
      console.log('Update check notice:', error.message);
      if (isManual) {
        Alert.alert(
          'अपडेट जांच सूचना (Update Notice)',
          'अपडेट सर्वर से संपर्क नहीं हो सका। कृपया इंटरनेट कनेक्शन जांचें।'
        );
      }
    }
  };

  useEffect(() => {
    if (autoCheck) {
      // Delay check slightly so it doesn't block initial boot
      const timer = setTimeout(() => {
        checkForUpdate(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [autoCheck]);

  // Perform Update Download & App Reload
  const handleApplyUpdate = async () => {
    setIsDownloading(true);
    try {
      if (Updates.isEnabled) {
        await Updates.fetchUpdateAsync();
        setIsDownloading(false);
        setModalVisible(false);

        Alert.alert(
          'अपडेट डाउनलोड हो गया! 🎉',
          'नया संस्करण सफलतापूर्वक डाउनलोड हो गया है।\n\nबदलाव लागू करने के लिए ऐप को तुरंत रीस्टार्ट किया जा रहा है।\n\n(यदि बदलाव तुरंत न दिखें, तो कृपया ऐप को Recent Apps से स्वाइप करके बंद करें और दोबारा खोलें)।',
          [
            {
              text: 'रीस्टार्ट करें (Restart App)',
              onPress: async () => {
                try {
                  await Updates.reloadAsync();
                } catch (reloadErr) {
                  console.log('Reload notice:', reloadErr);
                }
              },
            },
          ]
        );
      } else {
        setModalVisible(false);
        setIsDownloading(false);
      }
    } catch (error) {
      setIsDownloading(false);
      Alert.alert(
        'अपडेट त्रुटि (Update Error)',
        'अपडेट डाउनलोड करने में समस्या आई: ' + (error?.message || 'कृपया थोड़ी देर बाद पुनः प्रयास करें।')
      );
    }
  };

  const isVisible = visibleOverride !== undefined ? visibleOverride : modalVisible;
  const handleClose = onCloseOverride || (() => setModalVisible(false));

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, SHADOWS.lg]}>
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="rocket-launch" size={36} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>नया अपडेट उपलब्ध है!</Text>
          <Text style={styles.titleEn}>New Update Available</Text>

          <Text style={styles.description}>
            VillagePulse का नया संस्करण क्लाउड पर जारी किया गया है। नए फ़ीचर्स, तेज़ सिंक और डेटा सुधार तुरंत लागू करने के लिए अभी अपडेट करें।
          </Text>

          {isDownloading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>नया अपडेट डाउनलोड हो रहा है...</Text>
              <Text style={styles.loadingSub}>ऐप स्वतः रीस्टार्ट होगी</Text>
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.laterBtn}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.laterText}>बाद में (Later)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.updateBtn}
                onPress={handleApplyUpdate}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.updateText}>Update Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  titleEn: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SIZES.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 6,
  },
  loadingSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  laterBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  updateBtn: {
    flex: 1.3,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  updateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
