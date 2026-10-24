import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../../components/Header';
import { getCleanUniqueAssignedVillages } from '../../constants/villages';

export function ProfileScreen({ navigation }) {
  const { currentUser, userProfile, userRole, isAdmin, assignedVillages, logout } = useAuth();
  const { families, deletedFamilies, isOnline, syncStatus, refreshData } = useData();
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    const result = await refreshData();
    setIsSyncing(false);
    if (result?.success) {
      Alert.alert('सिंक सफल (Sync Successful)', `क्लाउड से कुल ${result.count} परिवारों का डेटा सफलतापूर्वक लोड हो गया है।`);
    } else {
      Alert.alert('सिंक स्थिति (Sync Status)', `डेटा सिंक स्थिति: ${result?.error || 'ऑफ़लाइन कैश डेटा लोड है'}`);
    }
  };

  const [isCheckingUpdate, setIsCheckingUpdate] = React.useState(false);

  const handleCheckAppUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      if (!Updates.isEnabled) {
        setIsCheckingUpdate(false);
        Alert.alert(
          'अपडेट स्थिति (Update Status)',
          'OTA लाइव अपडेट केवल स्थापित APK बिल्ड में सक्रिय होता है। वर्तमान में ऐप लोकल डेवलपमेंट मोड में है।'
        );
        return;
      }
      const check = await Updates.checkForUpdateAsync();
      setIsCheckingUpdate(false);
      if (check.isAvailable) {
        Alert.alert(
          '🚀 नया अपडेट उपलब्ध है! (Update Found)',
          'VillagePulse का नया क्लाउड अपडेट उपलब्ध है। क्या आप इसे तुरंत डाउनलोड करके लागू करना चाहते हैं?',
          [
            { text: 'बाद में (Later)', style: 'cancel' },
            {
              text: 'अपडेट करें (Update Now)',
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                } catch (err) {
                  Alert.alert('अपडेट त्रुटि', 'अपडेट डाउनलोड नहीं हो सका: ' + err.message);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          '✅ नवीनतम संस्करण (Up to date)',
          `आपका ऐप पहले से ही नवीनतम संस्करण पर है।\n\n• चैनल: ${Updates.channel || 'preview'}\n• रनटाइम: ${Updates.runtimeVersion || '1.0.x'}\n• अपडेट ID: ${Updates.updateId ? Updates.updateId.slice(0, 8) : 'Embedded Base'}`
        );
      }
    } catch (e) {
      setIsCheckingUpdate(false);
      Alert.alert(
        'अपडेट जांच सूचना (Update Notice)',
        'सर्वर से जांच विफल: ' + (e?.message || 'कृपया इंटरनेट कनेक्शन जांचें')
      );
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of VillagePulse?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Surveyor Profile" showVillagePicker={false} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={[styles.profileCard, SHADOWS.md]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(userProfile?.name || currentUser?.displayName || 'S').charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.userName}>
            {userProfile?.name || currentUser?.displayName || 'Panchayat Staff'}
          </Text>
          <Text style={styles.userEmail}>
            {currentUser?.email || 'surveyor@villagepulse.gov.in'}
          </Text>

          <View style={[styles.roleBadge, isAdmin ? styles.roleAdmin : styles.roleSurveyor]}>
            <MaterialCommunityIcons
              name={isAdmin ? 'shield-crown' : 'badge-account-outline'}
              size={16}
              color={isAdmin ? '#B45309' : COLORS.primary}
            />
            <Text style={[styles.roleText, isAdmin ? styles.roleTextAdmin : styles.roleTextSurveyor]}>
              {isAdmin ? 'Super Administrator' : 'Panchayat Field Surveyor'}
            </Text>
          </View>
        </View>

        {/* Assigned Villages Section */}
        <View style={[styles.sectionCard, SHADOWS.sm]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Assigned Villages (आवंटित गाँव)</Text>
          </View>

          <View style={styles.villagesRow}>
            {(() => {
              const clean = getCleanUniqueAssignedVillages(assignedVillages);
              if (isAdmin) {
                return (
                  <View style={styles.villageBadge}>
                    <Ionicons name="globe-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.villageBadgeText}>सभी गाँव (All Access)</Text>
                  </View>
                );
              }
              if (clean.length === 0) {
                return (
                  <View style={[styles.villageBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="alert-circle" size={16} color="#DC2626" />
                    <Text style={[styles.villageBadgeText, { color: '#B91C1C' }]}>आवंटन लंबित (Unassigned)</Text>
                  </View>
                );
              }
              return clean.map((v) => (
                <View key={v} style={styles.villageBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.villageBadgeText}>{v}</Text>
                </View>
              ));
            })()}
          </View>
        </View>

        {/* Cloud & Cache Status */}
        <View style={[styles.sectionCard, SHADOWS.sm]}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="cloud-sync" size={20} color={COLORS.info} />
            <Text style={styles.sectionTitle}>Data & Sync Status</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Firestore Backend:</Text>
            <View style={styles.onlineBadge}>
              <View style={[styles.onlineDot, { backgroundColor: isOnline ? COLORS.success : COLORS.warning }]} />
              <Text style={styles.onlineText}>{syncStatus || (isOnline ? 'Connected' : 'Offline Cache')}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Loaded Family Records:</Text>
            <Text style={styles.statusVal}>{families.length} Records</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Auto-Save Mode:</Text>
            <Text style={styles.statusVal}>Enabled (Instant)</Text>
          </View>

          <TouchableOpacity 
            style={[styles.syncNowBtn, isSyncing && { opacity: 0.7 }]}
            onPress={handleManualSync}
            disabled={isSyncing}
            activeOpacity={0.8}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" />
                <Text style={styles.syncNowBtnText}>Sync with Cloud (सिंक करें)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Appearance & Dark Mode Toggle */}
        <View style={[styles.sectionCard, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={isDarkMode ? '#FBBF24' : colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Appearance & Theme (थीम मोड)
            </Text>
          </View>
          <Text style={[styles.roleSubtext, { color: colors.textSecondary }]}>
            कम रोशनी या रात के समय आंखों के आराम के लिए डार्क मोड को सक्रिय करें
          </Text>

          <View style={styles.themeToggleRow}>
            <View style={styles.themeToggleLeft}>
              <Text style={[styles.themeToggleTitle, { color: colors.textPrimary }]}>
                {isDarkMode ? 'डार्क मोड सक्रिय (Dark Mode ON)' : 'लाइट मोड सक्रिय (Light Mode ON)'}
              </Text>
              <Text style={[styles.themeToggleSub, { color: colors.textMuted }]}>
                {isDarkMode ? 'डार्क स्लेट थीम चालू है' : 'मानक ब्राइट थीम चालू है'}
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#CBD5E1', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* QR Code Scanner Tool */}
        <View style={[styles.sectionCard, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="qrcode-scan" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              QR Code Scanner (क्यूआर कोड स्कैनर)
            </Text>
          </View>
          <Text style={[styles.roleSubtext, { color: colors.textSecondary }]}>
            परिवार पहचान पत्र, डिजिटल प्रमाण पत्र या राशन कार्ड का QR कोड मोबाइल कैमरे से तुरंत स्कैन करें
          </Text>

          <TouchableOpacity
            style={[styles.actionCardBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('QrScanner')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="camera-iris" size={18} color="#FFFFFF" />
            <Text style={styles.actionCardBtnText}>कैमरा स्कैनर खोलें (Scan QR Code)</Text>
          </TouchableOpacity>
        </View>

        {/* Data Print & Reports */}
        <View style={[styles.sectionCard, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="print-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data Print & PDF Reports (डेटा प्रिंट)</Text>
          </View>
          <Text style={[styles.roleSubtext, { color: colors.textSecondary }]}>
            गाँववार सर्वेक्षण रिकॉर्ड्स एवं परिवारों के विस्तृत डॉसियर को पीडीएफ में डाउनलोड या प्रिंट करें
          </Text>

          <TouchableOpacity
            style={[styles.actionCardBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('DataPrint')}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionCardBtnText}>Open Print Roster (डेटा प्रिंट खोलें)</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Control Panel (Admins Only) */}
        {isAdmin && (
          <View style={[styles.sectionCard, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: '#C7D2FE', borderWidth: 1.5 }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="shield-account" size={20} color="#4F46E5" />
              <Text style={[styles.sectionTitle, { color: '#312E81' }]}>Admin Control Panel (प्रबंधन)</Text>
            </View>
            <Text style={[styles.roleSubtext, { color: colors.textSecondary }]}>
              सर्वेक्षक स्वीकृति, गाँव आवंटन एवं हटाए गए रिकॉर्ड्स की रिकवरी का प्रबंधन करें
            </Text>

            <TouchableOpacity
              style={[styles.actionCardBtn, { backgroundColor: '#4F46E5', marginBottom: 10 }]}
              onPress={() => navigation.navigate('AdminUserManagement')}
              activeOpacity={0.8}
            >
              <Ionicons name="people-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionCardBtnText}>User & Surveyor Control (यूज़र प्रबंधन)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCardBtn, { backgroundColor: '#DC2626' }]}
              onPress={() => navigation.navigate('DeletedRecords')}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionCardBtnText}>
                रीसायकल बिन ({deletedFamilies?.length || 0} हटाए गए रिकॉर्ड्स)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* App Info & About */}
        <View style={[styles.sectionCard, SHADOWS.sm]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.sectionTitle}>About VillagePulse</Text>
          </View>
          <Text style={styles.aboutText}>
            VillagePulse is a modern rural census and household intelligence system built for Indian Panchayats. Designed for offline resilience, live cloud synchronization, and field surveys.
          </Text>
          <View style={{ marginTop: 10, padding: 10, backgroundColor: COLORS.background, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.cardBorder }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textPrimary }}>
              VillagePulse Mobile • v1.0.2
            </Text>
            <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
              Channel: {Updates.channel || 'preview'} | Runtime: {Updates.runtimeVersion || '1.0.x'}
            </Text>
            <Text style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 1 }}>
              OTA Build: {Updates.updateId ? Updates.updateId.slice(0, 12) + '...' : 'Embedded Base'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.checkUpdateBtn, isCheckingUpdate && { opacity: 0.7 }]}
            onPress={handleCheckAppUpdates}
            disabled={isCheckingUpdate}
            activeOpacity={0.8}
          >
            {isCheckingUpdate ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                <Text style={styles.checkUpdateBtnText}>Check for App Updates (अपडेट जांचें)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Log Out from Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.lg,
    paddingBottom: 90,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginTop: -10,
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusFull,
    gap: 6,
    marginTop: 12,
  },
  roleAdmin: {
    backgroundColor: COLORS.accentLight,
  },
  roleSurveyor: {
    backgroundColor: COLORS.primarySubtle,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  roleTextAdmin: {
    color: '#B45309',
  },
  roleTextSurveyor: {
    color: COLORS.primary,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  villagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  villageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primarySubtle,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: SIZES.radiusFull,
  },
  villageBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statusLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  roleSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  testBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  testBtn: {
    flex: 1,
    backgroundColor: COLORS.accentLight,
    paddingVertical: 10,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  testBtnSec: {
    flex: 1,
    backgroundColor: COLORS.primarySubtle,
    paddingVertical: 10,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
  },
  testBtnSecText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  aboutText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  versionText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 14,
    borderRadius: SIZES.radiusMd,
    gap: 8,
    marginTop: 6,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  syncNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    gap: 8,
    marginTop: 14,
  },
  syncNowBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySubtle,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: SIZES.radiusMd,
    gap: 8,
    marginTop: 12,
    width: '100%',
  },
  checkUpdateBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  actionCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: SIZES.radiusMd,
    gap: 8,
    marginTop: 6,
  },
  actionCardBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 4,
  },
  themeToggleLeft: {
    flex: 1,
    marginRight: 12,
  },
  themeToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  themeToggleSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
