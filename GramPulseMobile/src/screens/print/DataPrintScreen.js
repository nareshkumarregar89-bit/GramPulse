import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export function DataPrintScreen({ navigation, route }) {
  const { families, villagesList, castes, mohallas } = useData();
  const { userProfile, currentUser, isAdmin } = useAuth();
  
  const initialFamilyId = route?.params?.familyId;
  const [selectedVillage, setSelectedVillage] = useState('All');
  const [selectedMohalla, setSelectedMohalla] = useState('All');
  const [selectedCaste, setSelectedCaste] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [printFormat, setPrintFormat] = useState('dossier'); // 'dossier' | 'table'
  const [isGenerating, setIsGenerating] = useState(false);

  // Filtered families for print
  const printableFamilies = useMemo(() => {
    if (initialFamilyId) {
      return families.filter((f) => String(f.id) === String(initialFamilyId));
    }

    return families.filter((f) => {
      // Village filter
      if (selectedVillage !== 'All') {
        const str = String(f.village || f.villageId || '').toLowerCase();
        const target = selectedVillage.toLowerCase();
        if (target.includes('kotdi') && !str.includes('kotdi') && !str.includes('कोट')) return false;
        if (target.includes('samodi') && !str.includes('samodi') && !str.includes('समो') && !str.includes('समौ')) return false;
      }

      // Mohalla filter
      if (selectedMohalla !== 'All' && f.mohalla !== selectedMohalla) {
        return false;
      }

      // Caste filter
      if (selectedCaste !== 'All' && f.caste !== selectedCaste) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const head = String(f.familyHeadName || f.familyHeadNameHindi || f.familyHeadNameEnglish || '').toLowerCase();
        const father = String(f.fatherName || f.fatherNameHindi || '').toLowerCase();
        const id = String(f.id || '').toLowerCase();
        const mob = String(f.mobile || '');
        if (!head.includes(q) && !father.includes(q) && !id.includes(q) && !mob.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [families, selectedVillage, selectedMohalla, selectedCaste, searchQuery, initialFamilyId]);

  // Total population in printable subset
  const totalPopulation = useMemo(() => {
    return printableFamilies.reduce((acc, f) => acc + (f.members?.length || 1), 0);
  }, [printableFamilies]);

  // Generate HTML for Print / PDF Export
  const generatePrintHTML = () => {
    const printedAt = new Date().toLocaleDateString('hi-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const surveyorName = userProfile?.name || currentUser?.displayName || 'Panchayat Survey Officer';

    if (printFormat === 'table') {
      // Summary Table Roster
      const tableRows = printableFamilies
        .map((f, idx) => {
          const membersList = (f.members || []).map((m) => `${m.nameHindi || m.name || ''} (${m.relation || ''})`).join(', ');
          return `
            <tr>
              <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold;">${idx + 1}</td>
              <td style="border: 1px solid #333; padding: 6px; font-weight: bold; color: #166534;">${f.id}</td>
              <td style="border: 1px solid #333; padding: 6px;">
                <div style="font-weight: bold;">${f.familyHeadNameHindi || f.familyHeadName || ''}</div>
                <div style="font-size: 11px; color: #555;">${f.familyHeadNameEnglish || ''}</div>
              </td>
              <td style="border: 1px solid #333; padding: 6px;">${f.fatherNameHindi || f.fatherName || '-'}</td>
              <td style="border: 1px solid #333; padding: 6px;">${f.village || ''}</td>
              <td style="border: 1px solid #333; padding: 6px;">${f.mohalla || '-'}</td>
              <td style="border: 1px solid #333; padding: 6px;">${f.caste || '-'}</td>
              <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold;">${f.bplStatus || '-'}</td>
              <td style="border: 1px solid #333; padding: 6px; font-family: monospace;">${f.mobile || '-'}</td>
              <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold;">${f.members?.length || 1}</td>
            </tr>
          `;
        })
        .join('');

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>VillagePulse - Survey Table Roster</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 20px; color: #111; }
            .header { text-align: center; border-bottom: 2px solid #166534; padding-bottom: 12px; margin-bottom: 16px; }
            .header h1 { margin: 0; color: #166534; font-size: 22px; }
            .header h2 { margin: 4px 0; font-size: 14px; color: #444; }
            .meta { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background-color: #f0fdf4; border: 1px solid #333; padding: 6px; font-weight: bold; }
            .footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 11px; border-top: 1px solid #ddd; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ग्राम पंचायत परिवार सर्वेक्षण तालिका (VillagePulse Roster)</h1>
            <h2>Government of Rajasthan • Rural Digital Census Dossier</h2>
          </div>
          <div class="meta">
            <div><strong>गाँव:</strong> ${selectedVillage} | <strong>कुल परिवार:</strong> ${printableFamilies.length} | <strong>कुल जनसंख्या:</strong> ${totalPopulation}</div>
            <div><strong>प्रिंट दिनांक:</strong> ${printedAt}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px;">#</th>
                <th style="width: 70px;">ID</th>
                <th>मुखिया का नाम</th>
                <th>पिता/पति</th>
                <th>गाँव</th>
                <th>मोहल्ला</th>
                <th>जाति</th>
                <th>श्रेणी</th>
                <th>मोबाइल</th>
                <th style="width: 35px;">सदस्य</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            <div>प्रमाणित किया जाता है कि उपरोक्त डेटा अधिकृत पंचायत सर्वेक्षण रिकॉर्ड से संकलित है।</div>
            <div><strong>हस्ताक्षर अधिकृत सर्वेक्षक:</strong> ${surveyorName}</div>
          </div>
        </body>
        </html>
      `;
    }

    // Detailed Individual Dossier Cards
    const dossierCards = printableFamilies
      .map((f, idx) => {
        const membersRows = (f.members || [])
          .map((m, mIdx) => `
            <tr>
              <td style="border: 1px solid #444; padding: 4px; text-align: center;">${mIdx + 1}</td>
              <td style="border: 1px solid #444; padding: 4px; font-weight: bold;">
                ${m.nameHindi || m.nameEnglish || m.name || '-'}
                ${m.nameEnglish && m.nameHindi ? `<span style="font-size: 9px; color: #555;"> (${m.nameEnglish})</span>` : ''}
              </td>
              <td style="border: 1px solid #444; padding: 4px;">${m.relation || '-'}</td>
              <td style="border: 1px solid #444; padding: 4px; text-align: center;">${m.age || '-'}</td>
              <td style="border: 1px solid #444; padding: 4px; text-align: center;">${m.gender || '-'}</td>
              <td style="border: 1px solid #444; padding: 4px;">${m.education || '-'}</td>
              <td style="border: 1px solid #444; padding: 4px;">${m.occupation || '-'}</td>
              <td style="border: 1px solid #444; padding: 4px; font-family: monospace;">${m.mobile || '-'}</td>
              <td style="border: 1px solid #444; padding: 4px; font-family: monospace;">${m.aadhaarNumber || '-'}</td>
            </tr>
          `)
          .join('');

        return `
          <div style="border: 2px solid #166534; border-radius: 8px; padding: 14px; margin-bottom: 24px; page-break-inside: avoid; background-color: #fff;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
              <div>
                <span style="background-color: #166534; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                  ${f.id}
                </span>
                <span style="font-size: 16px; font-weight: bold; margin-left: 8px; color: #111;">
                  ${f.familyHeadNameHindi || f.familyHeadName || ''}
                </span>
                <span style="font-size: 13px; color: #555;">
                  (${f.familyHeadNameEnglish || ''})
                </span>
              </div>
              <div style="font-size: 12px; font-weight: bold; color: ${f.bplStatus === 'BPL' ? '#dc2626' : '#166534'};">
                ${f.bplStatus || 'Non-BPL'} • ${f.caste || 'Caste'}
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px;">
              <tr>
                <td style="padding: 4px; width: 25%;"><strong>पिता/पति:</strong> ${f.fatherNameHindi || f.fatherName || '-'}</td>
                <td style="padding: 4px; width: 25%;"><strong>गाँव:</strong> ${f.village || ''}</td>
                <td style="padding: 4px; width: 25%;"><strong>मोहल्ला:</strong> ${f.mohalla || '-'}</td>
                <td style="padding: 4px; width: 25%;"><strong>मकान सं.:</strong> ${f.houseNumber || '-'}</td>
              </tr>
              <tr>
                <td style="padding: 4px;"><strong>मोबाइल:</strong> ${f.mobile || '-'}</td>
                <td style="padding: 4px;"><strong>जन आधार:</strong> ${f.janAadhaarNumber || f.janAadhaar || '-'}</td>
                <td style="padding: 4px;"><strong>राशन कार्ड:</strong> ${f.rationCardNumber || f.rationCard || '-'}</td>
                <td style="padding: 4px;"><strong>मासिक आय:</strong> ₹${f.monthlyIncome || '-'}</td>
              </tr>
            </table>

            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 4px 8px; font-weight: bold; font-size: 11px; margin-bottom: 4px;">
              परिवार के सदस्य (${f.members?.length || 1} सदस्य)
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <thead>
                <tr style="background-color: #e2e8f0;">
                  <th style="border: 1px solid #444; padding: 4px; width: 20px;">#</th>
                  <th style="border: 1px solid #444; padding: 4px;">सदस्य का नाम</th>
                  <th style="border: 1px solid #444; padding: 4px;">संबंध</th>
                  <th style="border: 1px solid #444; padding: 4px; width: 30px;">आयु</th>
                  <th style="border: 1px solid #444; padding: 4px; width: 35px;">लिंग</th>
                  <th style="border: 1px solid #444; padding: 4px;">शिक्षा</th>
                  <th style="border: 1px solid #444; padding: 4px;">व्यवसाय</th>
                  <th style="border: 1px solid #444; padding: 4px;">मोबाइल</th>
                  <th style="border: 1px solid #444; padding: 4px;">आधार</th>
                </tr>
              </thead>
              <tbody>
                ${membersRows}
              </tbody>
            </table>
          </div>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>VillagePulse - Family Survey Dossier</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 16px; color: #111; background-color: #f8fafc; }
          .header { text-align: center; border-bottom: 3px double #166534; padding-bottom: 10px; margin-bottom: 16px; background-color: #fff; padding: 12px; border-radius: 8px; }
          .header h1 { margin: 0; color: #166534; font-size: 20px; font-weight: 800; }
          .header h2 { margin: 4px 0; font-size: 13px; color: #475569; }
          .meta { font-size: 11px; margin-top: 6px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>डिजिटल ग्रामीण परिवार सर्वेक्षण डॉसियर (VillagePulse Dossier)</h1>
          <h2>ग्राम पंचायत • राजस्थान सरकार • Digital Census & Household Dossier</h2>
          <div class="meta">
            प्रदर्शित परिवार: <strong>${printableFamilies.length}</strong> | कुल जनसंख्या: <strong>${totalPopulation}</strong> | प्रिंट तिथि: <strong>${printedAt}</strong>
          </div>
        </div>
        ${dossierCards}
      </body>
      </html>
    `;
  };

  // Trigger Print or Share PDF
  const handlePrintOrExport = async () => {
    if (printableFamilies.length === 0) {
      Alert.alert('कोई डेटा नहीं', 'प्रिंट करने के लिए कम से कम 1 परिवार होना चाहिए।');
      return;
    }

    setIsGenerating(true);
    try {
      const html = generatePrintHTML();
      // Generate PDF File
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      // Share or open print preview
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'VillagePulse Survey PDF डाउनलोड / प्रिंट करें'
        });
      } else {
        await Print.printAsync({ html });
      }
    } catch (err) {
      console.error('Print Error:', err);
      Alert.alert('प्रिंट त्रुटि', err.message || 'पीडीएफ जनरेट करने में असमर्थ।');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.surface} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Data Print & PDF Export</Text>
          <Text style={styles.headerSub}>सर्वेक्षण रिपोर्ट एवं परिवार डॉसियर प्रिंट</Text>
        </View>
        <TouchableOpacity
          style={styles.printTopBtn}
          onPress={handlePrintOrExport}
          disabled={isGenerating}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={COLORS.surface} />
          ) : (
            <Ionicons name="print-outline" size={20} color={COLORS.surface} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Format Selection Card */}
        <View style={[styles.card, SHADOWS.sm]}>
          <Text style={styles.sectionTitle}>रिपोर्ट प्रारूप (Print Layout Format)</Text>
          <View style={styles.formatRow}>
            <TouchableOpacity
              style={[styles.formatBtn, printFormat === 'dossier' && styles.formatBtnActive]}
              onPress={() => setPrintFormat('dossier')}
            >
              <MaterialCommunityIcons
                name="card-text-outline"
                size={20}
                color={printFormat === 'dossier' ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.formatBtnText, printFormat === 'dossier' && styles.formatBtnTextActive]}>
                विस्तृत डॉसियर (Detailed Dossier)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.formatBtn, printFormat === 'table' && styles.formatBtnActive]}
              onPress={() => setPrintFormat('table')}
            >
              <MaterialCommunityIcons
                name="table-large"
                size={20}
                color={printFormat === 'table' ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.formatBtnText, printFormat === 'table' && styles.formatBtnTextActive]}>
                सर्वेक्षण तालिका (Roster Table)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Controls (Shown when not printing a single family) */}
        {!initialFamilyId && (
          <View style={[styles.card, SHADOWS.sm]}>
            <Text style={styles.sectionTitle}>फ़िल्टर एवं खोज (Filters & Search)</Text>

            {/* Village Filter */}
            <Text style={styles.filterLabel}>गाँव चुनें (Village):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {['All', ...villagesList].map((v) => {
                const isSelected = selectedVillage === v;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[styles.pill, isSelected && styles.pillActive]}
                    onPress={() => setSelectedVillage(v)}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                      {v === 'All' ? 'सभी गाँव (All)' : v}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Mohalla Filter */}
            <Text style={styles.filterLabel}>मोहल्ला चुनें (Mohalla):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {['All', ...mohallas].map((m) => {
                const isSelected = selectedMohalla === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.pill, isSelected && styles.pillActive]}
                    onPress={() => setSelectedMohalla(m)}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Caste Filter */}
            <Text style={styles.filterLabel}>जाति चुनें (Caste):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {['All', ...castes].map((c) => {
                const isSelected = selectedCaste === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.pill, isSelected && styles.pillActive]}
                    onPress={() => setSelectedCaste(c)}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Search Input */}
            <Text style={styles.filterLabel}>नाम, पिता का नाम या ID से खोजें:</Text>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="उदा. FAM-0001 या मोहन लाल..."
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
          </View>
        )}

        {/* Printable Summary Banner */}
        <View style={styles.summaryBanner}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryTitle}>तैयार रिकॉर्ड्स (Ready to Print)</Text>
            <Text style={styles.summarySubtitle}>
              {printableFamilies.length} परिवार • {totalPopulation} कुल जनसंख्या
            </Text>
          </View>

          <TouchableOpacity
            style={styles.printActionBtn}
            onPress={handlePrintOrExport}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="print" size={18} color="#FFFFFF" />
                <Text style={styles.printActionBtnText}>PDF / प्रिंट</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Preview List of Included Families */}
        <View style={styles.previewSection}>
          <Text style={styles.previewHeaderTitle}>शामिल परिवारों की सूची (Preview List)</Text>
          {printableFamilies.slice(0, 15).map((f) => (
            <View key={f.id} style={styles.previewItem}>
              <View style={styles.previewItemLeft}>
                <Text style={styles.previewItemId}>{f.id}</Text>
                <View>
                  <Text style={styles.previewItemName}>
                    {f.familyHeadNameHindi || f.familyHeadNameEnglish || f.familyHeadName}
                  </Text>
                  <Text style={styles.previewItemMeta}>
                    {f.village || ''} • {f.mohalla || ''} • {f.members?.length || 1} सदस्य
                  </Text>
                </View>
              </View>
              <View style={styles.previewItemRight}>
                <Text style={styles.previewItemBadge}>{f.caste || 'Caste'}</Text>
              </View>
            </View>
          ))}

          {printableFamilies.length > 15 && (
            <Text style={styles.moreText}>
              + {printableFamilies.length - 15} और परिवार प्रिंट दस्तावेज में शामिल हैं
            </Text>
          )}

          {printableFamilies.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="search" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>कोई परिवार नहीं मिला</Text>
              <Text style={styles.emptySub}>फ़िल्टर रीसेट करें</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  printTopBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  formatBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#E8F5E9',
  },
  formatBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  formatBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 6,
  },
  pillScroll: {
    marginBottom: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  pillTextActive: {
    color: COLORS.surface,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.md,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  summarySubtitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  printActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 6,
  },
  printActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  previewSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  previewItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  previewItemId: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  previewItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  previewItemMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  previewItemRight: {},
  previewItemBadge: {
    fontSize: 11,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moreText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
