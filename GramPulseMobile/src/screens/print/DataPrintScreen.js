import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SHADOWS, SIZES } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Memoized Checkable Row with Rich, Modern Cards & Avatars
const SelectableFamilyRow = memo(function SelectableFamilyRow({
  family,
  isChecked,
  onToggle,
  colors,
}) {
  const headName =
    family.familyHeadNameHindi || family.familyHeadNameEnglish || family.familyHeadName || 'परिवार';
  const initialChar = headName.trim().charAt(0);
  const isBpl = family.bplStatus === 'BPL';

  return (
    <TouchableOpacity
      style={[
        styles.selectableRow,
        SHADOWS.sm,
        {
          backgroundColor: isChecked ? (colors.primarySubtle || '#F0FDF4') : colors.surface,
          borderColor: isChecked ? colors.primary : colors.cardBorder,
          borderLeftWidth: 4,
          borderLeftColor: isChecked ? colors.primary : colors.cardBorder,
        },
      ]}
      onPress={() => onToggle(family.id)}
      activeOpacity={0.75}
    >
      {/* Left Avatar Initial */}
      <View
        style={[
          styles.avatarCircle,
          {
            backgroundColor: isChecked ? colors.primary : (colors.surfaceSubtle || '#F1F5F9'),
          },
        ]}
      >
        <Text style={[styles.avatarInitial, { color: isChecked ? '#FFFFFF' : colors.primary }]}>
          {initialChar}
        </Text>
      </View>

      {/* Center Details */}
      <View style={styles.selectableInfo}>
        <View style={styles.selectableTopLine}>
          <View
            style={[
              styles.selectableIdBadge,
              {
                backgroundColor: isChecked ? colors.surface : (colors.surfaceSubtle || '#F1F5F9'),
                borderColor: isChecked ? colors.primary : colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.selectableIdText, { color: colors.primary }]}>
              {family.id}
            </Text>
          </View>

          <Text style={[styles.selectableHeadName, { color: colors.textPrimary }]} numberOfLines={1}>
            {headName}
          </Text>
        </View>

        {/* Father & Location */}
        <View style={styles.selectableMetaRow}>
          {(family.fatherNameHindi || family.fatherName) ? (
            <Text style={[styles.selectableFatherText, { color: colors.textSecondary }]} numberOfLines={1}>
              पिता: {family.fatherNameHindi || family.fatherName}
            </Text>
          ) : null}

          <View style={styles.selectableLocWrap}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.selectableLocText, { color: colors.textMuted }]} numberOfLines={1}>
              {family.village || ''}{family.mohalla ? ` • ${family.mohalla}` : ''}
            </Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.selectableBadgeRow}>
          {/* Members Badge */}
          <View style={[styles.selectableBadgePill, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
            <Ionicons name="people-outline" size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
            <Text style={[styles.selectableBadgeText, { color: colors.textSecondary }]}>
              {family.members?.length || 1} सदस्य
            </Text>
          </View>

          {/* BPL / APL Status Badge */}
          <View
            style={[
              styles.selectableBadgePill,
              {
                backgroundColor: isBpl ? '#FEE2E2' : '#DCFCE7',
                borderColor: isBpl ? '#FECACA' : '#BBF7D0',
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: isBpl ? '#DC2626' : '#16A34A' }]} />
            <Text
              style={[
                styles.selectableBadgeText,
                {
                  fontWeight: '700',
                  color: isBpl ? '#B91C1C' : '#15803D',
                },
              ]}
            >
              {family.bplStatus || 'APL'}
            </Text>
          </View>

          {/* Caste Badge */}
          {Boolean(family.caste) && (
            <View style={[styles.selectableBadgePill, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              <Text style={[styles.selectableBadgeText, { color: colors.textSecondary }]}>
                {family.caste}
              </Text>
            </View>
          )}

          {/* Mobile Badge */}
          {Boolean(family.mobile) && (
            <View style={[styles.selectableBadgePill, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              <Ionicons name="call-outline" size={10} color={colors.textSecondary} style={{ marginRight: 3 }} />
              <Text style={[styles.selectableBadgeText, { color: colors.textSecondary, fontFamily: 'monospace' }]}>
                {family.mobile}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right Animated-style Checkbox */}
      <View style={styles.checkboxContainer}>
        <Ionicons
          name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
          size={25}
          color={isChecked ? colors.primary : colors.textMuted}
        />
      </View>
    </TouchableOpacity>
  );
});

export function DataPrintScreen({ navigation, route }) {
  const { colors, isDarkMode } = useTheme();
  const { t, isHindi } = useLanguage();
  const { families, castes, mohallas } = useData();
  const { userProfile, currentUser } = useAuth();

  const initialFamilyId = route?.params?.familyId;
  const [selectedVillage, setSelectedVillage] = useState('All');
  const [selectedMohalla, setSelectedMohalla] = useState('All');
  const [selectedCaste, setSelectedCaste] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [printFormat, setPrintFormat] = useState('dossier'); // 'dossier' | 'table'
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [renderLimit, setRenderLimit] = useState(60);

  // Atomic lock to strictly prevent repeated print triggers and frozen UI
  const isPrintingRef = useRef(false);

  // Filtered families matching the filter criteria
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

  // Sync selectedIds with printable families
  useEffect(() => {
    setSelectedIds(new Set(printableFamilies.map((f) => f.id)));
    setRenderLimit(60);
  }, [printableFamilies]);

  // Actual families that will be included in the print / PDF
  const familiesToPrint = useMemo(() => {
    return printableFamilies.filter((f) => selectedIds.has(f.id));
  }, [printableFamilies, selectedIds]);

  // Total population for selected subset
  const totalPopulationToPrint = useMemo(() => {
    return familiesToPrint.reduce((acc, f) => acc + (f.members?.length || 1), 0);
  }, [familiesToPrint]);

  // Selection Toggles
  const toggleSelectFamily = (id) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(printableFamilies.map((f) => f.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Generate HTML for Print / PDF Export
  const generatePrintHTML = () => {
    const printedAt = new Date().toLocaleDateString('hi-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const surveyorName = userProfile?.name || currentUser?.displayName || 'Panchayat Survey Officer';

    if (printFormat === 'table') {
      const tableRows = familiesToPrint
        .map((f, idx) => `
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
        `)
        .join('');

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>VillagePulse - Census Table Roster</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 16px; color: #111; }
            .header { text-align: center; border-bottom: 2px solid #166534; padding-bottom: 8px; margin-bottom: 12px; }
            .header h1 { margin: 0; color: #166534; font-size: 18px; }
            .header h2 { margin: 3px 0; font-size: 12px; color: #4b5563; }
            .meta-bar { display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background-color: #166534; color: #ffffff; border: 1px solid #333; padding: 6px 4px; text-align: left; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .footer { margin-top: 16px; text-align: right; font-size: 10px; color: #6b7280; border-top: 1px solid #ddd; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ग्राम पंचायत डिजिटल सर्वेक्षण रोस्टर (Village Census Roster)</h1>
            <h2>राजस्थान सरकार • ग्राम स्तर जनगणना विवरण • VillagePulse Official</h2>
          </div>
          <div class="meta-bar">
            <span><strong>चयनित परिवार:</strong> ${familiesToPrint.length} | <strong>कुल जनसंख्या:</strong> ${totalPopulationToPrint}</span>
            <span><strong>सर्वेक्षक:</strong> ${surveyorName} | <strong>दिनांक:</strong> ${printedAt}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 30px;">क्र.</th>
                <th style="width: 70px;">आईडी</th>
                <th>मुखिया का नाम</th>
                <th>पिता/पति</th>
                <th>गाँव</th>
                <th>मोहल्ला</th>
                <th>जाति</th>
                <th style="text-align: center;">श्रेणी</th>
                <th>मोबाइल</th>
                <th style="text-align: center;">सदस्य</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            Generated via VillagePulse Panchayat Intelligence System • Digital Records
          </div>
        </body>
        </html>
      `;
    }

    // Detailed Dossier Format
    const dossierCards = familiesToPrint
      .map((f, idx) => {
        const membersRows = (f.members || [])
          .map((m, mIdx) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center;">${mIdx + 1}</td>
              <td style="border: 1px solid #ddd; padding: 4px; font-weight: 600;">${m.nameHindi || m.name || m.nameEnglish || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 4px;">${m.relation || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center;">${m.age || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center;">${m.gender || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 4px;">${m.mobile || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 4px;">${m.education || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 4px;">${m.occupation || '-'}</td>
            </tr>
          `)
          .join('');

        return `
          <div style="page-break-inside: avoid; border: 1.5px solid #166534; border-radius: 8px; padding: 12px; margin-bottom: 16px; background-color: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
              <div>
                <span style="background-color: #166534; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">#${idx + 1} • ${f.id}</span>
                <span style="background-color: #f1f5f9; color: #334155; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 6px;">गाँव: ${f.village || ''}</span>
              </div>
              <div>
                <span style="background-color: ${f.bplStatus === 'BPL' ? '#fee2e2' : '#f0fdf4'}; color: ${f.bplStatus === 'BPL' ? '#b91c1c' : '#15803d'}; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">
                  ${f.bplStatus || 'APL'}
                </span>
                <span style="background-color: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-left: 4px;">
                  ${f.caste || '-'}
                </span>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; margin-bottom: 8px;">
              <div><strong>परिवार मुखिया:</strong> ${f.familyHeadNameHindi || f.familyHeadName || ''} (${f.familyHeadNameEnglish || ''})</div>
              <div><strong>पिता/पति का नाम:</strong> ${f.fatherNameHindi || f.fatherName || '-'}</div>
              <div><strong>मोहल्ला:</strong> ${f.mohalla || '-'}</div>
              <div><strong>मकान संख्या:</strong> ${f.houseNumber || '-'}</div>
              <div><strong>मोबाइल नंबर:</strong> <span style="font-family: monospace; font-weight: bold;">${f.mobile || '-'}</span></div>
              <div><strong>मासिक आय:</strong> ₹${f.monthlyIncome || '-'}</div>
              <div><strong>जन आधार नंबर:</strong> <span style="font-family: monospace;">${f.janAadhaarNumber || f.janAadhaar || '-'}</span></div>
              <div><strong>राशन कार्ड:</strong> <span style="font-family: monospace;">${f.rationCardNumber || f.rationCard || '-'}</span></div>
            </div>

            <div style="font-size: 11px; font-weight: bold; color: #166534; margin-top: 8px; margin-bottom: 4px;">
              परिवार के सदस्य (${(f.members || []).length} सदस्य):
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <thead>
                <tr style="background-color: #f8fafc;">
                  <th style="border: 1px solid #ddd; padding: 4px; text-align: center; width: 25px;">क्र.</th>
                  <th style="border: 1px solid #ddd; padding: 4px; text-align: left;">सदस्य का नाम</th>
                  <th style="border: 1px solid #ddd; padding: 4px; text-align: left;">सम्बन्ध</th>
                  <th style="border: 1px solid #ddd; padding: 4px; text-align: center; width: 35px;">उम्र</th>
                  <th style="border: 1px solid #ddd; padding: 4px; text-align: center; width: 45px;">लिंग</th>
                  <th style="border: 1px solid #ddd; padding: 4px; text-align: left;">मोबाइल नंबर</th>
                  <th style="border: 1px solid #ddd; padding: 4px; text-align: left;">शिक्षा</th>
                  <th style="border: 1px solid #ddd; padding: 4px; text-align: left;">व्यवसाय</th>
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
        <title>VillagePulse - Household Dossier</title>
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
            चयनित परिवार: <strong>${familiesToPrint.length}</strong> | कुल जनसंख्या: <strong>${totalPopulationToPrint}</strong> | प्रिंट तिथि: <strong>${printedAt}</strong>
          </div>
        </div>
        ${dossierCards}
      </body>
      </html>
    `;
  };

  // Trigger Print or Share PDF with Async Defer & Lock
  const handlePrintOrExport = () => {
    if (isPrintingRef.current || isGenerating) return;

    if (familiesToPrint.length === 0) {
      Alert.alert(
        t('noFamiliesSelectedTitle', 'कोई परिवार चयनित नहीं'),
        t('noFamiliesSelectedMsg', 'प्रिंट करने के लिए कृपया कम से कम 1 परिवार का चयन करें।')
      );
      return;
    }

    isPrintingRef.current = true;
    setIsGenerating(true);

    // Yield control to JS event loop so UI spinner renders immediately
    setTimeout(async () => {
      try {
        const html = generatePrintHTML();
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            UTI: '.pdf',
            mimeType: 'application/pdf',
            dialogTitle: isHindi
              ? 'VillagePulse Survey PDF डाउनलोड / प्रिंट करें'
              : 'VillagePulse Survey PDF Export & Print',
          });
        } else {
          await Print.printAsync({ html });
        }
      } catch (err) {
        console.error('Print Error:', err);
        Alert.alert(
          t('printErrorTitle', 'प्रिंट त्रुटि'),
          err.message || 'पीडीएफ जनरेट करने में असमर्थ।'
        );
      } finally {
        isPrintingRef.current = false;
        setIsGenerating(false);
      }
    }, 60);
  };

  const displayedFamilies = useMemo(() => {
    return printableFamilies.slice(0, renderLimit);
  }, [printableFamilies, renderLimit]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{t('printScreenTitle', 'Data Print & PDF Export')}</Text>
          <Text style={styles.headerSub}>
            {isHindi ? 'सर्वेक्षण रिपोर्ट एवं परिवार डॉसियर प्रिंट' : 'Household Survey Roster & Dossier Print'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.printTopBtn, (isGenerating || familiesToPrint.length === 0) && { opacity: 0.6 }]}
          onPress={handlePrintOrExport}
          disabled={isGenerating || familiesToPrint.length === 0}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="print-outline" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Quick Stats Hero Card */}
        <View style={[styles.heroCard, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.heroRow}>
            <View style={styles.heroStatItem}>
              <View style={[styles.heroStatIconBox, { backgroundColor: colors.primarySubtle || '#ECFDF5' }]}>
                <Ionicons name="checkbox-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <View style={styles.heroNumberRow}>
                  <Text style={[styles.heroStatValue, { color: colors.primary }]}>
                    {familiesToPrint.length}
                  </Text>
                  <Text style={[styles.heroStatTotal, { color: colors.textMuted }]}>
                    /{printableFamilies.length}
                  </Text>
                </View>
                <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>
                  {isHindi ? 'परिवार चयनित' : 'Selected Families'}
                </Text>
              </View>
            </View>

            <View style={[styles.heroDivider, { backgroundColor: colors.cardBorder }]} />

            <View style={styles.heroStatItem}>
              <View style={[styles.heroStatIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="people" size={20} color="#D97706" />
              </View>
              <View>
                <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>
                  {totalPopulationToPrint}
                </Text>
                <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>
                  {isHindi ? 'कुल नागरिक' : 'Total Population'}
                </Text>
              </View>
            </View>
          </View>

          {/* Visual Selection Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${printableFamilies.length > 0 ? Math.round((familiesToPrint.length / printableFamilies.length) * 100) : 0}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Report Format Selector */}
        <View style={[styles.card, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderWithIcon}>
            <MaterialCommunityIcons name="file-document-edit-outline" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {t('printFormat', 'प्रिंट प्रारूप चुनें (Select Layout Format)')}
            </Text>
          </View>

          <View style={styles.formatRow}>
            <TouchableOpacity
              style={[
                styles.formatCard,
                {
                  backgroundColor: printFormat === 'dossier' ? (colors.primarySubtle || '#F0FDF4') : colors.surfaceSubtle,
                  borderColor: printFormat === 'dossier' ? colors.primary : colors.cardBorder,
                },
              ]}
              onPress={() => setPrintFormat('dossier')}
              activeOpacity={0.8}
            >
              <View style={styles.formatCardTop}>
                <View
                  style={[
                    styles.formatIconCircle,
                    {
                      backgroundColor: printFormat === 'dossier' ? colors.primary : colors.surface,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="card-account-details-outline"
                    size={20}
                    color={printFormat === 'dossier' ? '#FFFFFF' : colors.textSecondary}
                  />
                </View>
                <Ionicons
                  name={printFormat === 'dossier' ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={printFormat === 'dossier' ? colors.primary : colors.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.formatCardTitle,
                  { color: printFormat === 'dossier' ? colors.primary : colors.textPrimary },
                ]}
              >
                विस्तृत डॉसियर
              </Text>
              <Text style={[styles.formatCardSub, { color: colors.textSecondary }]}>
                फोटो, पहचान पत्र एवं विस्तृत विवरण
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.formatCard,
                {
                  backgroundColor: printFormat === 'table' ? (colors.primarySubtle || '#F0FDF4') : colors.surfaceSubtle,
                  borderColor: printFormat === 'table' ? colors.primary : colors.cardBorder,
                },
              ]}
              onPress={() => setPrintFormat('table')}
              activeOpacity={0.8}
            >
              <View style={styles.formatCardTop}>
                <View
                  style={[
                    styles.formatIconCircle,
                    {
                      backgroundColor: printFormat === 'table' ? colors.primary : colors.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name="grid-outline"
                    size={18}
                    color={printFormat === 'table' ? '#FFFFFF' : colors.textSecondary}
                  />
                </View>
                <Ionicons
                  name={printFormat === 'table' ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={printFormat === 'table' ? colors.primary : colors.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.formatCardTitle,
                  { color: printFormat === 'table' ? colors.primary : colors.textPrimary },
                ]}
              >
                सर्वेक्षण तालिका
              </Text>
              <Text style={[styles.formatCardSub, { color: colors.textSecondary }]}>
                A4 पेज बचत क्रमवार सारांश रोस्टर
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters & Search Card */}
        {!initialFamilyId && (
          <View style={[styles.card, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleLeft}>
                <Ionicons name="filter-outline" size={17} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  {t('filtersAndSearch', 'फ़िल्टर एवं खोज (Filters & Search)')}
                </Text>
              </View>

              {(selectedVillage !== 'All' || selectedMohalla !== 'All' || selectedCaste !== 'All' || searchQuery) && (
                <TouchableOpacity
                  style={[styles.resetFilterBtn, { backgroundColor: colors.primarySubtle || '#ECFDF5' }]}
                  onPress={() => {
                    setSelectedVillage('All');
                    setSelectedMohalla('All');
                    setSelectedCaste('All');
                    setSearchQuery('');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh-outline" size={12} color={colors.primary} />
                  <Text style={[styles.resetFilterText, { color: colors.primary }]}>
                    {isHindi ? 'रीसेट' : 'Reset'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Village Filter */}
            <View style={styles.filterLabelRow}>
              <Ionicons name="business-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
                {t('selectVillage', 'गाँव')}:
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {['All', 'समोड़ी (Samodi)', 'कोटड़ी (Kotdi)'].map((v) => {
                const isSelected = selectedVillage === v;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[
                      styles.pill,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                      isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedVillage(v)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.pillText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
                      {v === 'All' ? (isHindi ? 'सभी गाँव' : 'All Villages') : v}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Mohalla Filter */}
            <View style={styles.filterLabelRow}>
              <Ionicons name="home-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
                {t('selectMohalla', 'मोहल्ला')}:
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {['All', ...mohallas].map((m) => {
                const isSelected = selectedMohalla === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.pill,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                      isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedMohalla(m)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.pillText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
                      {m === 'All' ? (isHindi ? 'सभी मोहल्ले' : 'All Mohallas') : m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Caste Filter */}
            <View style={styles.filterLabelRow}>
              <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
                {t('selectCaste', 'जाति')}:
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {['All', ...castes].map((c) => {
                const isSelected = selectedCaste === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.pill,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder },
                      isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedCaste(c)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.pillText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
                      {c === 'All' ? (isHindi ? 'सभी जातियां' : 'All Castes') : c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Search Input */}
            <View style={styles.filterLabelRow}>
              <Ionicons name="search-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
                {t('search', 'खोजें')}:
              </Text>
            </View>
            <View style={[styles.searchBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
              <Ionicons name="search" size={17} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder={t('searchPrintPlaceholder', 'उदा. FAM-0001 या नाम या मोबाइल...')}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {Boolean(searchQuery) && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Selection Toolbar: Select All, Deselect All, Count */}
        <View style={styles.selectionToolbar}>
          <View style={[styles.selectionCountBadge, { backgroundColor: colors.primarySubtle || '#ECFDF5' }]}>
            <Ionicons name="checkmark-done-circle" size={16} color={colors.primary} />
            <Text style={[styles.selectionCountText, { color: colors.textPrimary }]}>
              {t('selectedCountBadge', 'चयनित')}:{' '}
              <Text style={{ fontWeight: '800', color: colors.primary }}>{familiesToPrint.length}</Text> / {printableFamilies.length}
            </Text>
          </View>

          <View style={styles.selectionBtnsGroup}>
            <TouchableOpacity
              style={[styles.selectToggleBtn, { backgroundColor: colors.primary }]}
              onPress={selectAll}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-outline" size={14} color="#FFFFFF" style={{ marginRight: 3 }} />
              <Text style={styles.selectToggleBtnText}>{t('selectAll', 'सभी चुनें')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.selectToggleBtnSecondary, { borderColor: colors.cardBorder, backgroundColor: colors.surfaceSubtle }]}
              onPress={deselectAll}
              activeOpacity={0.8}
            >
              <Ionicons name="close-outline" size={14} color={colors.textSecondary} style={{ marginRight: 2 }} />
              <Text style={[styles.selectToggleBtnSecondaryText, { color: colors.textSecondary }]}>
                {t('deselectAll', 'हटाएं')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Checkable Family Items List */}
        <View style={[styles.card, SHADOWS.sm, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderWithIcon}>
            <Ionicons name="list" size={17} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('selectFamiliesToPrint', 'प्रिंट हेतु परिवार चुनें')}
            </Text>
          </View>

          {displayedFamilies.map((f) => {
            const isChecked = selectedIds.has(f.id);
            return (
              <SelectableFamilyRow
                key={f.id}
                family={f}
                isChecked={isChecked}
                onToggle={toggleSelectFamily}
                colors={colors}
              />
            );
          })}

          {printableFamilies.length > renderLimit && (
            <TouchableOpacity
              style={[styles.loadMoreBtn, { borderColor: colors.primary, backgroundColor: colors.primarySubtle || '#ECFDF5' }]}
              onPress={() => setRenderLimit((prev) => prev + 60)}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-down" size={16} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                {isHindi
                  ? `और परिवार लोड करें (+${printableFamilies.length - renderLimit} शेष)`
                  : `Load More Families (+${printableFamilies.length - renderLimit} remaining)`}
              </Text>
            </TouchableOpacity>
          )}

          {printableFamilies.length === 0 && (
            <View style={styles.emptyBox}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name="search" size={32} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {isHindi ? 'कोई परिवार नहीं मिला' : 'No Families Found'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {isHindi ? 'फ़िल्टर या खोज बदलकर देखें' : 'Try adjusting search or filters'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Print Action Bar */}
      <View
        style={[
          styles.bottomFloatingBar,
          SHADOWS.lg,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.bottomInfo}>
          <View style={styles.bottomCountRow}>
            <Ionicons name="document-text" size={16} color={colors.primary} style={{ marginRight: 5 }} />
            <Text style={[styles.bottomCount, { color: colors.textPrimary }]}>
              {familiesToPrint.length} {t('selectedCountBadge', 'परिवार तैयार')}
            </Text>
          </View>
          <Text style={[styles.bottomSub, { color: colors.textMuted }]}>
            {totalPopulationToPrint} नागरिक • {printFormat === 'dossier' ? 'विस्तृत डॉसियर' : 'तालिका'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.printActionBtn,
            { backgroundColor: colors.primary },
            (isGenerating || familiesToPrint.length === 0) && { opacity: 0.6 },
          ]}
          onPress={handlePrintOrExport}
          disabled={isGenerating || familiesToPrint.length === 0}
          activeOpacity={0.85}
        >
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="print" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.printActionBtnText}>
                {t('generatePdfBtn', 'PDF / प्रिंट')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 48 : 38,
    paddingBottom: 14,
    paddingHorizontal: SIZES.md,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 1,
  },
  printTopBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SIZES.md,
    paddingBottom: 120,
  },

  // Hero Stats Card
  heroCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
  },
  heroStatIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  heroStatTotal: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  heroDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 8,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Cards
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Format Cards
  formatRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  formatCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formatIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  formatCardSub: {
    fontSize: 10,
    lineHeight: 14,
  },

  // Filters
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 3,
  },
  resetFilterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    marginBottom: 5,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    marginTop: 4,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },

  // Selection Toolbar
  selectionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  selectionCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  selectionCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectionBtnsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  selectToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  selectToggleBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  selectToggleBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectToggleBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Family List Card Row
  selectableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 9,
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
  },
  selectableInfo: {
    flex: 1,
  },
  selectableTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  selectableIdBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  selectableIdText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  selectableHeadName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  selectableMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 5,
  },
  selectableFatherText: {
    fontSize: 11,
  },
  selectableLocWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  selectableLocText: {
    fontSize: 11,
  },
  selectableBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  selectableBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  selectableBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 4,
  },
  checkboxContainer: {
    paddingLeft: 4,
  },

  loadMoreBtn: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 6,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 11,
    marginTop: 2,
  },

  // Floating Bottom Action Bar
  bottomFloatingBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  bottomInfo: {
    flex: 1,
  },
  bottomCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomCount: {
    fontSize: 13,
    fontWeight: '800',
  },
  bottomSub: {
    fontSize: 10,
    marginTop: 1,
  },
  printActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  printActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
