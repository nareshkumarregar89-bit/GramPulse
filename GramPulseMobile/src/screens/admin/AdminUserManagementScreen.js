import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { villagesList } from '../../constants/villages';

export function AdminUserManagementScreen({ navigation }) {
  const { 
    allUsers, 
    approveUser, 
    assignVillageToUser, 
    toggleUserStatus, 
    deleteUser,
    currentUser 
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'active'
  const [selectedUserForAssign, setSelectedUserForAssign] = useState(null);
  const [selectedVillageToAssign, setSelectedVillageToAssign] = useState(villagesList[0]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [processingUid, setProcessingUid] = useState(null);

  // Filter users based on search & tab
  const filteredUsers = (allUsers || []).filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.mobile && user.mobile.includes(query));

    if (!matchesSearch) return false;

    if (activeTab === 'pending') return user.status === 'pending';
    if (activeTab === 'active') return user.status === 'active';
    if (activeTab === 'inactive') return user.status === 'inactive';
    return true;
  });

  const pendingCount = (allUsers || []).filter((u) => u.status === 'pending').length;
  const activeCount = (allUsers || []).filter((u) => u.status === 'active').length;

  // Handle Approve
  const handleApprove = async (user) => {
    setProcessingUid(user.uid);
    try {
      await approveUser(user.uid);
      Alert.alert('स्वीकृत (Approved)', `सर्वेक्षक ${user.name || user.email} को सफलतापूर्वक स्वीकृत कर दिया गया है।`);
    } catch (err) {
      Alert.alert('त्रुटि', err.message || 'स्वीकृत करने में विफल।');
    } finally {
      setProcessingUid(null);
    }
  };

  // Handle Village Assign Modal Submit
  const handleAssignVillageSubmit = async () => {
    if (!selectedUserForAssign) return;
    setIsAssigning(true);
    try {
      await assignVillageToUser(selectedUserForAssign.uid, selectedVillageToAssign);
      Alert.alert(
        'गाँव आवंटित (Village Assigned)',
        `${selectedUserForAssign.name || selectedUserForAssign.email} को "${selectedVillageToAssign}" सफलतापूर्वक आवंटित कर दिया गया।`
      );
      setSelectedUserForAssign(null);
    } catch (err) {
      Alert.alert('त्रुटि', err.message || 'गाँव आवंटित करने में विफल।');
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (user) => {
    const next = user.status === 'active' ? 'inactive' : 'active';
    Alert.alert(
      next === 'inactive' ? 'अकाउंट निष्क्रिय करें?' : 'अकाउंट सक्रिय करें?',
      `क्या आप ${user.name || user.email} का खाता ${next === 'inactive' ? 'निष्क्रिय' : 'सक्रिय'} करना चाहते हैं?`,
      [
        { text: 'रद्द करें', style: 'cancel' },
        {
          text: 'हाँ (Confirm)',
          onPress: async () => {
            setProcessingUid(user.uid);
            try {
              await toggleUserStatus(user.uid, user.status);
            } catch (err) {
              Alert.alert('त्रुटि', err.message);
            } finally {
              setProcessingUid(null);
            }
          }
        }
      ]
    );
  };

  // Handle Delete User
  const handleDeleteUser = (user) => {
    if (user.uid === currentUser?.uid) {
      Alert.alert('प्रतिबंधित', 'आप स्वयं अपना खाता यहाँ से नहीं हटा सकते।');
      return;
    }
    Alert.alert(
      'यूज़र खाता हटाएं?',
      `क्या आप निश्चित हैं कि ${user.name || user.email} का खाता पूरी तरह हटाना चाहते हैं?`,
      [
        { text: 'रद्द करें', style: 'cancel' },
        {
          text: 'हटाएं (Delete)',
          style: 'destructive',
          onPress: async () => {
            setProcessingUid(user.uid);
            try {
              await deleteUser(user.uid);
              Alert.alert('सफलता', 'यूज़र खाता हटा दिया गया है।');
            } catch (err) {
              Alert.alert('त्रुटि', err.message);
            } finally {
              setProcessingUid(null);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.surface} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>User & Surveyor Control</Text>
          <Text style={styles.headerSub}>सर्वेक्षक अनुमोदन एवं गाँव आवंटन</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Counter Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{allUsers.length}</Text>
          <Text style={styles.statLbl}>कुल यूज़र</Text>
        </View>
        <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E2E8F0' }]}>
          <Text style={[styles.statVal, { color: COLORS.primary }]}>{activeCount}</Text>
          <Text style={styles.statLbl}>सक्रिय सर्वेक्षक</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: COLORS.warning }]}>{pendingCount}</Text>
          <Text style={styles.statLbl}>लंबित अनुमोदन</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="नाम, ईमेल या मोबाइल से खोजें..."
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

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'all' && styles.tabItemActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabItemText, activeTab === 'all' && styles.tabItemTextActive]}>
            सभी ({allUsers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'pending' && styles.tabItemActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabItemText, activeTab === 'pending' && styles.tabItemTextActive]}>
            लंबित ({pendingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'active' && styles.tabItemActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabItemText, activeTab === 'active' && styles.tabItemTextActive]}>
            सक्रिय ({activeCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isUserPending = item.status === 'pending';
          const isUserInactive = item.status === 'inactive';
          const isItemProcessing = processingUid === item.uid;
          const assignedList = Array.isArray(item.assignedVillages) ? item.assignedVillages : [];

          return (
            <View style={[styles.userCard, SHADOWS.sm]}>
              {/* Card Top: Avatar, Name, Email, Badges */}
              <View style={styles.cardTop}>
                <View style={[styles.avatar, item.role === 'admin' ? styles.avatarAdmin : styles.avatarSurveyor]}>
                  <Text style={styles.avatarText}>
                    {(item.name || item.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>{item.name || 'Unnamed Surveyor'}</Text>
                    <View style={[styles.roleBadge, item.role === 'admin' && styles.roleBadgeAdmin]}>
                      <Text style={[styles.roleBadgeText, item.role === 'admin' && styles.roleBadgeTextAdmin]}>
                        {item.role === 'admin' ? 'Admin' : 'Surveyor'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.userEmail}>{item.email}</Text>
                  {Boolean(item.mobile) && (
                    <Text style={styles.userMobile}>📞 +91 {item.mobile}</Text>
                  )}
                </View>
              </View>

              {/* Status & Assigned Village Pills */}
              <View style={styles.metaRow}>
                <View style={[
                  styles.statusPill,
                  isUserPending ? styles.statusPillPending : isUserInactive ? styles.statusPillInactive : styles.statusPillActive
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: isUserPending ? '#D97706' : isUserInactive ? '#DC2626' : '#16A34A' }
                  ]} />
                  <Text style={[
                    styles.statusPillText,
                    { color: isUserPending ? '#B45309' : isUserInactive ? '#B91C1C' : '#15803D' }
                  ]}>
                    {isUserPending ? 'स्वीकृति प्रतीक्षित (Pending)' : isUserInactive ? 'निष्क्रिय (Inactive)' : 'सक्रिय (Active)'}
                  </Text>
                </View>

                <View style={styles.villagesWrap}>
                  {assignedList.length > 0 ? (
                    assignedList.map((v) => (
                      <View key={v} style={styles.villageTag}>
                        <Ionicons name="location-sharp" size={11} color={COLORS.primary} />
                        <Text style={styles.villageTagText}>{v}</Text>
                      </View>
                    ))
                  ) : item.role === 'admin' ? (
                    <View style={styles.villageTag}>
                      <Ionicons name="globe-outline" size={11} color={COLORS.accent} />
                      <Text style={[styles.villageTagText, { color: COLORS.accent }]}>सभी गाँव (All Access)</Text>
                    </View>
                  ) : (
                    <View style={[styles.villageTag, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                      <Ionicons name="alert-circle" size={11} color={COLORS.danger} />
                      <Text style={[styles.villageTagText, { color: COLORS.danger }]}>कोई गाँव आवंटित नहीं</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.cardActions}>
                {isUserPending && (
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApprove(item)}
                    disabled={isItemProcessing}
                    activeOpacity={0.8}
                  >
                    {isItemProcessing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.approveBtnText}>Approve (स्वीकृत करें)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.assignBtn}
                  onPress={() => {
                    setSelectedUserForAssign(item);
                    setSelectedVillageToAssign(assignedList[0] || villagesList[0]);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="map-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.assignBtnText}>Assign Village (गाँव दें)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toggleBtn}
                  onPress={() => handleToggleStatus(item)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isUserInactive ? 'play-outline' : 'pause-outline'}
                    size={15}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>

                {item.uid !== currentUser?.uid && (
                  <TouchableOpacity
                    style={styles.deleteUserBtn}
                    onPress={() => handleDeleteUser(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="account-search-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>कोई यूज़र नहीं मिला</Text>
            <Text style={styles.emptySub}>खोज शब्द बदलें या फ़िल्टर टैब बदलें</Text>
          </View>
        }
      />

      {/* Village Assignment Modal */}
      <Modal
        visible={Boolean(selectedUserForAssign)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedUserForAssign(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedUserForAssign(null)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>गाँव आवंटित करें (Assign Village)</Text>
            <Text style={styles.modalSubtitle}>
              {selectedUserForAssign?.name || selectedUserForAssign?.email} के लिए कार्यक्षेत्र गाँव चुनें:
            </Text>

            <View style={styles.villageOptionsList}>
              {villagesList.map((villageName) => {
                const isSelected = selectedVillageToAssign === villageName;
                return (
                  <TouchableOpacity
                    key={villageName}
                    style={[styles.villageOptionRow, isSelected && styles.villageOptionRowActive]}
                    onPress={() => setSelectedVillageToAssign(villageName)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isSelected ? COLORS.primary : COLORS.textMuted}
                    />
                    <Text style={[styles.villageOptionText, isSelected && styles.villageOptionTextActive]}>
                      {villageName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSelectedUserForAssign(null)}
              >
                <Text style={styles.modalCancelBtnText}>रद्द करें (Cancel)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleAssignVillageSubmit}
                disabled={isAssigning}
                activeOpacity={0.8}
              >
                {isAssigning ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>आवंटित करें (Save)</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.surface,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLbl: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  userCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAdmin: {
    backgroundColor: '#EEF2FF',
  },
  avatarSurveyor: {
    backgroundColor: '#E8F5E9',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  roleBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleBadgeAdmin: {
    backgroundColor: '#EEF2FF',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  roleBadgeTextAdmin: {
    color: '#4F46E5',
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  userMobile: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusPillActive: {
    backgroundColor: '#DCFCE7',
  },
  statusPillPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPillInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  villagesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  villageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  villageTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  assignBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  assignBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteUserBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 18,
  },
  villageOptionsList: {
    gap: 8,
    marginBottom: 20,
  },
  villageOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  villageOptionRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#E8F5E9',
  },
  villageOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  villageOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.surface,
  },
});
