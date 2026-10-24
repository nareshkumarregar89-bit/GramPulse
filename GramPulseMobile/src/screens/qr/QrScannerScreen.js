import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';

const { width } = Dimensions.get('window');
const SCAN_FRAME_SIZE = width * 0.72;

export function QrScannerScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const { families, getFamilyById } = useData();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualIdInput, setManualIdInput] = useState('');

  // Handle scanned barcode data
  const handleBarcodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);

    if (!data) {
      Alert.alert('त्रुटि', 'QR कोड पढ़ने में असमर्थ। कृपया पुनः प्रयास करें।', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
      return;
    }

    const trimmed = String(data).trim();
    console.log('Scanned QR data:', trimmed);

    // 1. Try to extract Family ID from URL or Raw String
    // Patterns:
    // https://villagepulse.netlify.app/verify/FAM-0001
    // FAM-0001
    // FAM0001
    // id: "FAM-0001"
    let extractedId = '';

    const verifyMatch = trimmed.match(/\/verify\/([A-Za-z0-9_-]+)/i);
    if (verifyMatch && verifyMatch[1]) {
      extractedId = verifyMatch[1].toUpperCase();
    } else {
      const famMatch = trimmed.match(/FAM[-_]?\d+/i);
      if (famMatch) {
        extractedId = famMatch[0].toUpperCase().replace('_', '-');
        if (!extractedId.includes('-')) {
          extractedId = extractedId.replace('FAM', 'FAM-');
        }
      } else {
        extractedId = trimmed.toUpperCase();
      }
    }

    // Lookup family in state
    const family = getFamilyById(extractedId) || families.find(
      (f) => String(f.id).toUpperCase() === extractedId
    );

    if (family) {
      navigation.navigate('FamilyDetail', { id: family.id });
    } else {
      Alert.alert(
        'रिकॉर्ड मिलान (Record Lookup)',
        `स्कैन किया गया क्रमांक: "${extractedId}"\n\nक्या आप इस परिवार को खोजना चाहते हैं?`,
        [
          {
            text: 'पुनः स्कैन करें',
            style: 'cancel',
            onPress: () => setScanned(false)
          },
          {
            text: 'विवरण खोलें',
            onPress: () => {
              navigation.navigate('FamilyDetail', { id: extractedId });
            }
          }
        ]
      );
    }
  };

  const handleManualLookup = () => {
    if (!manualIdInput.trim()) {
      Alert.alert('कृपया क्रमांक दर्ज करें', 'जैसे: FAM-0001');
      return;
    }
    const clean = manualIdInput.trim().toUpperCase();
    setManualModalVisible(false);
    navigation.navigate('FamilyDetail', { id: clean });
  };

  if (!permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          कैमरा अनुमतियाँ जांची जा रही हैं...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <View style={styles.permissionCard}>
          <MaterialCommunityIcons name="camera-off" size={64} color={colors.danger} />
          <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
            कैमरा अनुमति आवश्यक है
          </Text>
          <Text style={[styles.permissionSub, { color: colors.textSecondary }]}>
            प्रमाण पत्र, राशन कार्ड या डिजिटल पहचान पत्र का QR कोड स्कैन करने के लिए कैमरा की अनुमति दें।
          </Text>
          <TouchableOpacity
            style={[styles.grantBtn, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={20} color="#FFFFFF" />
            <Text style={styles.grantBtnText}>अनुमति दें (Allow Camera)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>वापस जाएं</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Real-time Camera View */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Dark Overlay Mask */}
      <View style={styles.overlay}>
        {/* Top Controls Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.topBadge}>
            <MaterialCommunityIcons name="qrcode-scan" size={16} color="#FFFFFF" />
            <Text style={styles.topBadgeText}>QR कोड स्कैनर</Text>
          </View>

          <TouchableOpacity
            style={[styles.circleBtn, torchOn && styles.circleBtnActive]}
            onPress={() => setTorchOn(!torchOn)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={torchOn ? 'flash' : 'flash-off-outline'}
              size={22}
              color={torchOn ? '#FBBF24' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Center Target Viewfinder Frame */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinderFrame}>
            {/* Corner Markers */}
            <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />

            {/* Scanning Center Guide */}
            <View style={[styles.laserLine, { backgroundColor: colors.primary }]} />
          </View>
          <Text style={styles.guideText}>
            परिवार प्रमाण पत्र या पहचान पत्र का QR कोड चौकोर फ्रेम के अंदर लाएं
          </Text>
        </View>

        {/* Bottom Actions Bar */}
        <View style={styles.bottomBar}>
          {scanned && (
            <TouchableOpacity
              style={[styles.rescanBtn, { backgroundColor: colors.primary }]}
              onPress={() => setScanned(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.rescanBtnText}>पुनः स्कैन करें (Scan Again)</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.manualEntryBtn}
            onPress={() => setManualModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="keypad-outline" size={18} color="#FFFFFF" />
            <Text style={styles.manualEntryText}>क्रमांक सीधे दर्ज करें (Enter ID)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Manual ID Input Modal */}
      <Modal
        visible={manualModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setManualModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <MaterialCommunityIcons name="card-account-details-outline" size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                परिवार क्रमांक खोजें
              </Text>
            </View>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              प्रमाण पत्र पर लिखा 8-अंकों का परिवार क्रमांक दर्ज करें:
            </Text>

            <TextInput
              style={[
                styles.manualInput,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.cardBorder,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="उदा. FAM-0001"
              placeholderTextColor={colors.textMuted}
              value={manualIdInput}
              onChangeText={setManualIdInput}
              autoCapitalize="characters"
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: colors.cardBorder }]}
                onPress={() => setManualModalVisible(false)}
              >
                <Text style={[styles.modalBtnCancelText, { color: colors.textSecondary }]}>
                  रद्द करें
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleManualLookup}
              >
                <Text style={styles.modalBtnSubmitText}>खोजें (Search)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    maxWidth: 360,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 24,
  },
  grantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'center',
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  circleBtnActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
    borderColor: '#FBBF24',
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    borderRadius: 24,
    backgroundColor: 'transparent',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  laserLine: {
    width: '90%',
    height: 2,
    opacity: 0.7,
  },
  guideText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 36,
    fontWeight: '500',
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomBar: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  rescanBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  manualEntryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  manualInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalBtnSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
