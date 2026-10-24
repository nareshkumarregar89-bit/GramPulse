import React, { useState, useMemo, useEffect } from 'react';
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
  Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
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
  const [viewMode, setViewMode] = useState('select'); // 'select' | 'preview'
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

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

  // Sync selectedIds with printable families by default
  useEffect(() => {
    setSelectedIds(new Set(printableFamilies.map((f) => f.id)));
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
      minute: '2-digit'
    });
    const surveyorName = userProfile?.name || currentUser?.displayName || 'Panchayat Survey Officer';

    if (printFormat === 'table') {
      // Summary Table Roster
      const tableRows = familiesToPrint
        .map((f, idx) => {
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

    // Full Detailed Dossier Format
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
            चयनित परिवार: <strong>${familiesToPrint.length}</strong> | कुल जनसंख्या: <strong>${totalPopulationToPrint}</strong> | प्रिंट तिथि: <strong>${printedAt}</strong>
          </div>
        </div>
        ${dossierCards}
      </body>
      </html>
    `;
  };

  // Trigger Print or Share PDF
  const handlePrintOrExport = async () => {
    if (familiesToPrint.length === 0) {
      Alert.alert('कोई परिवार चयनित नहीं', 'प्रिंट करने के लिए कृपया कम से कम 1 परिवार का चयन करें।');
      return;
    }

    setIsGenerating(true);
    try {
      const html = generatePrintHTML();
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });

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
          disabled={isGenerating || familiesToPrint.length === 0}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={COLORS.surface} />
          ) : (
            <Ionicons name="print-outline" size={20} color={COLORS.surface} />
          )}
        </TouchableOpacity>
      </View>

      {/* Main View Mode Tabs: Select Families vs Live Print Preview */}
      <View style={styles.viewModeTabs}>
        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'select' && styles.viewModeTabActive]}
          onPress={() => setViewMode('select')}
        >
          <Ionicons
            name="checkbox-outline"
            size={16}
            color={viewMode === 'select' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.viewModeTabText, viewMode === 'select' && styles.viewModeTabTextActive]}>
            परिवार चयन ({familiesToPrint.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'preview' && styles.viewModeTabActive]}
          onPress={() => setViewMode('preview')}
        >
          <Ionicons
            name="eye-outline"
            size={16}
            color={viewMode === 'preview' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.viewModeTabText, viewMode === 'preview' && styles.viewModeTabTextActive]}>
            दस्तावेज़ पूर्वावलोकन (Preview)
          </Text>
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

        {/* ----------------- TAB 1: SELECT FAMILIES ----------------- */}
        {viewMode === 'select' && (
          <>
            {/* Filter Controls */}
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
                          {m === 'All' ? 'सभी मोहल्ले' : m}
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
                          {c === 'All' ? 'सभी जातियां' : c}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Search Text Input */}
                <Text style={styles.filterLabel}>खोजें (Search by Name, Father, ID, Mobile):</Text>
                <View style={styles.searchBox}>
                  <Ionicons name="search" size={18} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="उदा. FAM-0001 या मोहन लाल या मोबाइल..."
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

            {/* Selection Toolbar: Select All, Deselect All, Count */}
            <View style={styles.selectionToolbar}>
              <View style={styles.selectionCountBadge}>
                <Ionicons name="checkmark-done-circle" size={16} color={COLORS.primary} />
                <Text style={styles.selectionCountText}>
                  चयनित: <Text style={{ fontWeight: '800', color: COLORS.primary }}>{familiesToPrint.length}</Text> / {printableFamilies.length}
                </Text>
              </View>

              <View style={styles.selectionBtnsGroup}>
                <TouchableOpacity style={styles.selectToggleBtn} onPress={selectAll}>
                  <Text style={styles.selectToggleBtnText}>सभी चुनें</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.selectToggleBtnSecondary} onPress={deselectAll}>
                  <Text style={styles.selectToggleBtnSecondaryText}>हटाएं</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Checkable Family Items List */}
            <View style={[styles.card, SHADOWS.sm]}>
              <Text style={styles.sectionTitle}>
                प्रिंट हेतु परिवार चुनें (Tap to Select/Deselect)
              </Text>

              {printableFamilies.map((f) => {
                const isChecked = selectedIds.has(f.id);
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.selectableRow, isChecked && styles.selectableRowChecked]}
                    onPress={() => toggleSelectFamily(f.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isChecked ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isChecked ? COLORS.primary : COLORS.textMuted}
                    />

                    <View style={styles.selectableInfo}>
                      <View style={styles.selectableTopLine}>
                        <Text style={styles.selectableId}>{f.id}</Text>
                        <Text style={styles.selectableHeadName}>
                          {f.familyHeadNameHindi || f.familyHeadNameEnglish || f.familyHeadName}
                        </Text>
                      </View>
                      <Text style={styles.selectableSubLine}>
                        पिता: {f.fatherNameHindi || f.fatherName || '-'} • {f.village || ''} • {f.mohalla || ''}
                      </Text>
                      <View style={styles.selectableBadgeRow}>
                        <Text style={styles.selectableBadge}>{f.caste || 'Caste'}</Text>
                        <Text style={[styles.selectableBadge, { backgroundColor: f.bplStatus === 'BPL' ? '#FEE2E2' : '#F0FDF4', color: f.bplStatus === 'BPL' ? '#B91C1C' : '#15803D' }]}>
                          {f.bplStatus || 'APL'}
                        </Text>
                        <Text style={styles.selectableBadge}>
                          {f.members?.length || 1} सदस्य
                        </Text>
                        {Boolean(f.mobile) && (
                          <Text style={[styles.selectableBadge, { fontFamily: 'monospace' }]}>
                            📞 {f.mobile}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {printableFamilies.length === 0 && (
                <View style={styles.emptyBox}>
                  <Ionicons name="search" size={40} color={COLORS.textMuted} />
                  <Text style={styles.emptyTitle}>कोई परिवार नहीं मिला</Text>
                  <Text style={styles.emptySub}>फ़िल्टर रीसेट करें</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* ----------------- TAB 2: LIVE PRINT PREVIEW ----------------- */}
        {viewMode === 'preview' && (
          <View style={styles.previewContainer}>
            {/* Live Paper Document Frame */}
            <View style={[styles.paperSheet, SHADOWS.md]}>
              {/* Document Official Header */}
              <View style={styles.docHeader}>
                <Image
                  source={require('../../../assets/logo.png')}
                  style={styles.docLogo}
                  resizeMode="contain"
                />
                <Text style={styles.docMainTitle}>
                  {printFormat === 'table'
                    ? 'ग्राम पंचायत डिजिटल सर्वेक्षण रोस्टर'
                    : 'डिजिटल ग्रामीण परिवार सर्वेक्षण डॉसियर'}
                </Text>
                <Text style={styles.docSubTitle}>
                  ग्राम पंचायत • राजस्थान सरकार • Official Census Dossier
                </Text>
                <View style={styles.docDivider} />
                <View style={styles.docMetaRow}>
                  <Text style={styles.docMetaText}>
                    चयनित परिवार: <Text style={{ fontWeight: '800' }}>{familiesToPrint.length}</Text>
                  </Text>
                  <Text style={styles.docMetaText}>
                    कुल जनसंख्या: <Text style={{ fontWeight: '800' }}>{totalPopulationToPrint}</Text>
                  </Text>
                  <Text style={styles.docMetaText}>
                    प्रारूप: {printFormat === 'table' ? 'रोस्टर तालिका' : 'विस्तृत डॉसियर'}
                  </Text>
                </View>
              </View>

              {/* Dossier Preview Cards */}
              {printFormat === 'dossier' && (
                <View style={{ gap: 14 }}>
                  {familiesToPrint.slice(0, 10).map((f, idx) => (
                    <View key={f.id} style={styles.docDossierCard}>
                      <View style={styles.docCardTop}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.docCardIdBadge}>#{idx + 1} • {f.id}</Text>
                          <Text style={styles.docCardVillage}>{f.village || ''}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          <Text style={[styles.docBplBadge, { backgroundColor: f.bplStatus === 'BPL' ? '#FEE2E2' : '#F0FDF4', color: f.bplStatus === 'BPL' ? '#B91C1C' : '#15803D' }]}>
                            {f.bplStatus || 'APL'}
                          </Text>
                          <Text style={styles.docCasteBadge}>{f.caste || '-'}</Text>
                        </View>
                      </View>

                      <Text style={styles.docHeadTitle}>
                        {f.familyHeadNameHindi || f.familyHeadName || ''} {f.familyHeadNameEnglish ? `(${f.familyHeadNameEnglish})` : ''}
                      </Text>

                      <View style={styles.docGrid}>
                        <Text style={styles.docGridItem}><strong>पिता/पति:</strong> {f.fatherNameHindi || f.fatherName || '-'}</Text>
                        <Text style={styles.docGridItem}><strong>मोहल्ला:</strong> {f.mohalla || '-'}</Text>
                        <Text style={styles.docGridItem}><strong>मकान नं.:</strong> {f.houseNumber || '-'}</Text>
                        <Text style={styles.docGridItem}><strong>मोबाइल:</strong> {f.mobile || '-'}</Text>
                        <Text style={styles.docGridItem}><strong>जन आधार:</strong> {f.janAadhaarNumber || f.janAadhaar || '-'}</Text>
                        <Text style={styles.docGridItem}><strong>राशन कार्ड:</strong> {f.rationCardNumber || f.rationCard || '-'}</Text>
                      </View>

                      {/* Members Sub-Table */}
                      <Text style={styles.docMembersHeading}>
                        परिवार के सदस्य ({f.members?.length || 1} सदस्य):
                      </Text>
                      <View style={styles.docTableWrap}>
                        <View style={styles.docTableHeaderRow}>
                          <Text style={[styles.docTh, { width: 30, textAlign: 'center' }]}>क्र.</Text>
                          <Text style={[styles.docTh, { flex: 2 }]}>सदस्य नाम</Text>
                          <Text style={[styles.docTh, { flex: 1.2 }]}>सम्बन्ध</Text>
                          <Text style={[styles.docTh, { width: 35, textAlign: 'center' }]}>उम्र</Text>
                          <Text style={[styles.docTh, { width: 45, textAlign: 'center' }]}>लिंग</Text>
                          <Text style={[styles.docTh, { flex: 1.5 }]}>मोबाइल नं.</Text>
                        </View>
                        {(f.members || []).map((m, mIdx) => (
                          <View key={m.id || mIdx} style={styles.docTableRow}>
                            <Text style={[styles.docTd, { width: 30, textAlign: 'center' }]}>{mIdx + 1}</Text>
                            <Text style={[styles.docTd, { flex: 2, fontWeight: '700' }]}>{m.nameHindi || m.name || m.nameEnglish || '-'}</Text>
                            <Text style={[styles.docTd, { flex: 1.2 }]}>{m.relation || '-'}</Text>
                            <Text style={[styles.docTd, { width: 35, textAlign: 'center' }]}>{m.age || '-'}</Text>
                            <Text style={[styles.docTd, { width: 45, textAlign: 'center' }]}>{m.gender || '-'}</Text>
                            <Text style={[styles.docTd, { flex: 1.5, fontFamily: 'monospace' }]}>{m.mobile || '-'}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}

                  {familiesToPrint.length > 10 && (
                    <Text style={styles.previewMoreNote}>
                      + {familiesToPrint.length - 10} और चयनित परिवार प्रिंट दस्तावेज में शामिल हैं
                    </Text>
                  )}
                </View>
              )}

              {/* Table Roster Preview */}
              {printFormat === 'table' && (
                <View style={styles.docTableWrap}>
                  <View style={styles.docTableHeaderRow}>
                    <Text style={[styles.docTh, { width: 30, textAlign: 'center' }]}>क्र.</Text>
                    <Text style={[styles.docTh, { width: 60 }]}>आईडी</Text>
                    <Text style={[styles.docTh, { flex: 2 }]}>मुखिया का नाम</Text>
                    <Text style={[styles.docTh, { flex: 1.5 }]}>पिता/पति</Text>
                    <Text style={[styles.docTh, { flex: 1 }]}>गाँव</Text>
                    <Text style={[styles.docTh, { flex: 1.2 }]}>मोबाइल</Text>
                    <Text style={[styles.docTh, { width: 40, textAlign: 'center' }]}>सदस्य</Text>
                  </View>
                  {familiesToPrint.slice(0, 20).map((f, idx) => (
                    <View key={f.id} style={styles.docTableRow}>
                      <Text style={[styles.docTd, { width: 30, textAlign: 'center' }]}>{idx + 1}</Text>
                      <Text style={[styles.docTd, { width: 60, fontWeight: '800', color: COLORS.primary }]}>{f.id}</Text>
                      <Text style={[styles.docTd, { flex: 2, fontWeight: '700' }]}>
                        {f.familyHeadNameHindi || f.familyHeadName || ''}
                      </Text>
                      <Text style={[styles.docTd, { flex: 1.5 }]}>{f.fatherNameHindi || f.fatherName || '-'}</Text>
                      <Text style={[styles.docTd, { flex: 1 }]}>{f.village || ''}</Text>
                      <Text style={[styles.docTd, { flex: 1.2, fontFamily: 'monospace' }]}>{f.mobile || '-'}</Text>
                      <Text style={[styles.docTd, { width: 40, textAlign: 'center', fontWeight: '800' }]}>
                        {f.members?.length || 1}
                      </Text>
                    </View>
                  ))}
                  {familiesToPrint.length > 20 && (
                    <Text style={styles.previewMoreNote}>
                      + {familiesToPrint.length - 20} और रिकॉर्ड्स प्रिंट तालिका में शामिल हैं
                    </Text>
                  )}
                </View>
              )}

              {familiesToPrint.length === 0 && (
                <View style={styles.emptyBox}>
                  <Ionicons name="alert-circle-outline" size={44} color="#D97706" />
                  <Text style={styles.emptyTitle}>कोई परिवार चयनित नहीं है</Text>
                  <Text style={styles.emptySub}>
                    'परिवार चयन' टैब पर जाएं और जिन परिवारों को प्रिंट करना है उन्हें चेक करें।
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.previewTipBox}>
              <Ionicons name="information-circle" size={18} color={COLORS.primary} />
              <Text style={styles.previewTipText}>
                यह दस्तावेज़ का मोबाइल पूर्वावलोकन है। PDF डाउनलोड करने या सीधे प्रिंटर पर भेजने के लिए नीचे 'PDF / प्रिंट करें' बटन दबाएं।
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Sticky Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarLeft}>
          <Text style={styles.bottomBarCount}>
            {familiesToPrint.length} परिवार चयनित
          </Text>
          <Text style={styles.bottomBarSub}>
            {totalPopulationToPrint} कुल जनसंख्या
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.bottomBarPrintBtn, (isGenerating || familiesToPrint.length === 0) && { opacity: 0.6 }]}
          onPress={handlePrintOrExport}
          disabled={isGenerating || familiesToPrint.length === 0}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="print" size={18} color="#FFFFFF" />
              <Text style={styles.bottomBarPrintBtnText}>PDF / प्रिंट करें</Text>
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
  viewModeTabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  viewModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  viewModeTabActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  viewModeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  viewModeTabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
  selectionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  selectionCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectionCountText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  selectionBtnsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  selectToggleBtn: {
    backgroundColor: COLORS.primarySubtle,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  selectToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  selectToggleBtnSecondary: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  selectToggleBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  selectableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  selectableRowChecked: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  selectableInfo: {
    flex: 1,
  },
  selectableTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectableId: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selectableHeadName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  selectableSubLine: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  selectableBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  selectableBadge: {
    fontSize: 10,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewContainer: {
    gap: 12,
  },
  paperSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  docHeader: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#166534',
    paddingBottom: 12,
    marginBottom: 14,
  },
  docLogo: {
    width: 52,
    height: 52,
    marginBottom: 6,
  },
  docMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
    textAlign: 'center',
  },
  docSubTitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  docDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  docMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  docMetaText: {
    fontSize: 10,
    color: '#475569',
  },
  docDossierCard: {
    borderWidth: 1.5,
    borderColor: '#166534',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FAFAF9',
  },
  docCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
    marginBottom: 8,
  },
  docCardIdBadge: {
    backgroundColor: '#166534',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  docCardVillage: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  docBplBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  docCasteBadge: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  docHeadTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  docGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docGridItem: {
    fontSize: 10,
    color: '#334155',
    width: '48%',
  },
  docMembersHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
    marginTop: 8,
    marginBottom: 4,
  },
  docTableWrap: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    overflow: 'hidden',
  },
  docTableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#166534',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  docTh: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  docTableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  docTd: {
    fontSize: 9,
    color: '#1E293B',
  },
  previewMoreNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 8,
  },
  previewTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  previewTipText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    ...SHADOWS.lg,
  },
  bottomBarLeft: {
    flex: 1,
  },
  bottomBarCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomBarSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  bottomBarPrintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
  },
  bottomBarPrintBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
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
