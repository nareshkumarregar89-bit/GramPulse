import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';

export function DeletedRecordsScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const { deletedFamilies, restoreFamily, permanentlyDeleteFamily } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const filteredRecords = (deletedFamilies || []).filter((f) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = String(f.familyHeadNameHindi || f.familyHeadNameEnglish || f.familyHeadName || '').toLowerCase();
    const id = String(f.id || '').toLowerCase();
    const village = String(f.village || '').toLowerCase();
    const mohalla = String(f.mohalla || '').toLowerCase();
    return name.includes(q) || id.includes(q) || village.includes(q) || mohalla.includes(q);
  });

  const handleRestore = (item) => {
    Alert.alert(
      'रिकॉर्ड पुनर्स्थापित करें (Restore Record)',
      `क्या आप परिवार क्रमांक "${item.id}" को पुनः सक्रिय डेटाबेस में वापस लाना चाहते हैं?`,
      [
        { text: 'रद्द करें', style: 'cancel' },
        {
          text: 'हाँ, रिस्टोर करें',
          onPress: async () => {
            setProcessingId(item.id);
            try {
              await restoreFamily(item.id);
              Alert.alert('सफलता', `परिवार ${item.id} को सफलतापूर्वक सक्रिय सूची में रिस्टोर कर दिया गया है।`);
            } catch (err) {
              Alert.alert('त्रुटि', 'रिस्टोर करने में विफल।');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handlePermanentDelete = (item) => {
    Alert.alert(
      'हमेशा के लिए हटाएं (Permanent Delete)',
      `सावधानी: यह कार्रवाई पूर्ववत (Undo) नहीं की जा सकती। क्या आप रिकॉर्ड "${item.id}" को सर्वर से स्थायी रूप से मिटाना चाहते हैं?`,
      [
        { text: 'रद्द करें', style: 'cancel' },
        {
          text: 'स्थायी रूप से हटाएं',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(item.id);
            try {
              await permanentlyDeleteFamily(item.id);
            } catch (err) {
              Alert.alert('त्रुटि', 'हटाने में विफल।');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const headName = item.familyHeadNameHindi || item.familyHeadNameEnglish || item.familyHeadName || 'परिवार';
    const memberCount = Array.isArray(item.members) ? item.members.length : 1;
    const deletedDate = item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('hi-IN') : 'हाल ही में';

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.idBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={styles.idBadgeText}>{item.id}</Text>
            </View>
            <View>
              <Text style={[styles.headName, { color: colors.textPrimary }]}>{headName}</Text>
              <Text style={[styles.villageSub, { color: colors.textMuted }]}>
                {item.village || 'N/A'} • {item.mohalla || 'N/A'}
              </Text>
            </View>
          </View>
          <View style={styles.membersBadge}>
            <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.membersText, { color: colors.textSecondary }]}>{memberCount}</Text>
          </View>
        </View>

        {/* Deletion Metadata */}
        <View style={[styles.metaRow, { backgroundColor: colors.surfaceSubtle }]}>
          <View style={styles.metaCol}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>हटाया गया:</Text>
            <Text style={[styles.metaVal, { color: colors.textPrimary }]}>{deletedDate}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>द्वारा:</Text>
            <Text style={[styles.metaVal, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.deletedBy || 'एडमिन'}
            </Text>
          </View>
        </View>

        {/* Card Actions */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[styles.restoreBtn, { backgroundColor: colors.primaryLight }]}
            onPress={() => handleRestore(item)}
            activeOpacity={0.8}
            disabled={processingId === item.id}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.primaryDark} />
            <Text style={[styles.restoreBtnText, { color: colors.primaryDark }]}>
              रिस्टोर करें (Restore)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handlePermanentDelete(item)}
            activeOpacity={0.8}
            disabled={processingId === item.id}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={[styles.deleteBtnText, { color: colors.danger }]}>स्थायी हटाएं</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleCol}>
          <Text style={[styles.topTitle, { color: colors.textPrimary }]}>
            रीसायकल बिन (Recycle Bin)
          </Text>
          <Text style={[styles.topSub, { color: colors.textMuted }]}>
            हटाए गए परिवारों की सूची ({deletedFamilies?.length || 0} रिकॉर्ड्स)
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="आईडी, मुखिया या गाँव से खोजें..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Records List */}
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="trash-can-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              रीसायकल बिन खाली है
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              वर्तमान में कोई भी हटाया गया परिवार उपलब्ध नहीं है।
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 20,
  },
  titleCol: {
    flex: 1,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  topSub: {
    fontSize: 12,
    marginTop: 2,
  },
  searchContainer: {
    padding: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  idBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  idBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  headName: {
    fontSize: 15,
    fontWeight: '700',
  },
  villageSub: {
    fontSize: 12,
    marginTop: 2,
  },
  membersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.12)',
  },
  membersText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 8,
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  restoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  restoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
