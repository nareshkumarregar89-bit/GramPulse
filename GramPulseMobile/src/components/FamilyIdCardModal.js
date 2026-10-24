import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export function FamilyIdCardModal({ visible, onClose, family }) {
  const { colors, isDarkMode } = useTheme();

  if (!family) return null;

  const members = Array.isArray(family.members) ? family.members : [];
  const headName = family.familyHeadNameHindi || family.familyHeadNameEnglish || family.familyHeadName || 'मुखिया';
  const fatherName = family.fatherNameHindi || family.fatherNameEnglish || family.fatherName || 'पिता/पति';
  const verifyUrl = `https://villagepulse.netlify.app/verify/${family.id}`;

  const handleShare = async () => {
    try {
      const msg = `*ग्राम पंचायत डिजिटल परिवार पहचान पत्र (Family ID Card)*\n\n` +
        `परिवार क्रमांक (Family ID): ${family.id}\n` +
        `मुखिया (Head): ${headName}\n` +
        `पिता/पति: ${fatherName}\n` +
        `गाँव (Village): ${family.village || 'N/A'}\n` +
        `मोहल्ला (Mohalla): ${family.mohalla || 'N/A'}\n` +
        `जन आधार: ${family.janAadhaarNumber || family.janAadhaar || 'N/A'}\n` +
        `राशन कार्ड: ${family.rationCardNumber || family.rationCard || 'N/A'}\n` +
        `कुल सदस्य (Members): ${members.length}\n\n` +
        `सत्यापन लिंक (Verify Online): ${verifyUrl}`;
      await Share.share({ message: msg });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  const handlePrintIdCard = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
            .id-card {
              max-width: 500px;
              margin: 0 auto;
              border: 3px double #059669;
              border-radius: 16px;
              background: #ffffff;
              padding: 20px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #059669;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .gov-title { font-size: 13px; color: #475569; font-weight: bold; text-transform: uppercase; margin: 0; }
            .card-title { font-size: 18px; color: #065f46; font-weight: 800; margin: 4px 0 0 0; }
            .fam-id { font-size: 14px; background: #ecfdf5; color: #047857; display: inline-block; padding: 4px 12px; border-radius: 12px; font-weight: bold; margin-top: 6px; }
            .body-grid { display: flex; gap: 16px; margin-top: 12px; }
            .qr-col { flex: 0 0 130px; text-align: center; }
            .info-col { flex: 1; }
            .info-row { margin-bottom: 8px; font-size: 13px; }
            .label { color: #64748b; font-weight: 600; display: block; font-size: 11px; }
            .value { color: #0f172a; font-weight: 700; font-size: 14px; }
            .members-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
            .members-table th { background: #f1f5f9; padding: 6px; text-align: left; border: 1px solid #cbd5e1; }
            .members-table td { padding: 6px; border: 1px solid #e2e8f0; }
            .footer { margin-top: 16px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="id-card">
            <div class="header">
              <p class="gov-title">राजस्थान सरकार • ग्राम पंचायत डिजिटल अभिलेख</p>
              <h2 class="card-title">परिवार पहचान पत्र (Family Dossier ID)</h2>
              <div class="fam-id">${family.id}</div>
            </div>
            <div class="body-grid">
              <div class="info-col">
                <div class="info-row">
                  <span class="label">परिवार का मुखिया (Head of Family)</span>
                  <span class="value">${headName}</span>
                </div>
                <div class="info-row">
                  <span class="label">पिता/पति (Father / Husband)</span>
                  <span class="value">${fatherName}</span>
                </div>
                <div class="info-row">
                  <span class="label">गाँव एवं मोहल्ला (Village & Mohalla)</span>
                  <span class="value">${family.village || 'N/A'} • ${family.mohalla || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="label">जन आधार / राशन कार्ड (Govt IDs)</span>
                  <span class="value">JA: ${family.janAadhaarNumber || family.janAadhaar || 'N/A'} | RC: ${family.rationCardNumber || family.rationCard || 'N/A'}</span>
                </div>
              </div>
            </div>
            <table class="members-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>सदस्य का नाम</th>
                  <th>संबंध</th>
                  <th>आयु / लिंग</th>
                </tr>
              </thead>
              <tbody>
                ${members.map((m, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${m.nameHindi || m.nameEnglish || m.name || 'सदस्य'}</strong></td>
                    <td>${m.relation || 'सदस्य'}</td>
                    <td>${m.age || '-'} वर्ष • ${m.gender || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              डिजिटल सत्यापन हेतु क्यूआर कोड स्कैन करें • VillagePulse Smart Panchayat System
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (err) {
      Alert.alert('प्रिंट त्रुटि', 'पहचान पत्र प्रिंट करने में असमर्थ।');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <MaterialCommunityIcons name="badge-account-horizontal" size={24} color={colors.primary} />
              <Text style={[styles.modalHeaderTitle, { color: colors.textPrimary }]}>
                डिजिटल पहचान पत्र (ID Card)
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* The Physical-Style ID Card */}
            <View style={[styles.idCardContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: colors.primary }]}>
              {/* Card Official Top Header */}
              <View style={[styles.cardTopHeader, { backgroundColor: isDarkMode ? '#064E3B' : '#059669' }]}>
                <Text style={styles.govText}>राजस्थान सरकार • पंचायती राज</Text>
                <Text style={styles.cardMainHeading}>परिवार पहचान पत्र (Family ID)</Text>
              </View>

              {/* Card Body */}
              <View style={styles.cardInnerBody}>
                {/* ID Badge */}
                <View style={styles.idBadgeRow}>
                  <View style={[styles.idPill, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.idText, { color: colors.primaryDark }]}>{family.id}</Text>
                  </View>
                  <View style={[styles.categoryPill, { backgroundColor: colors.accentLight }]}>
                    <Text style={[styles.categoryText, { color: colors.saffron }]}>
                      {family.bplStatus === 'BPL' || family.category === 'BPL' ? 'BPL परिवार' : 'APL परिवार'}
                    </Text>
                  </View>
                </View>

                {/* QR Code and Primary Info Side by Side */}
                <View style={styles.qrInfoRow}>
                  {/* Real-time Generated QR Code */}
                  <View style={styles.qrWrapper}>
                    <QRCode
                      value={verifyUrl}
                      size={96}
                      color="#0F172A"
                      backgroundColor="#FFFFFF"
                    />
                    <Text style={styles.qrSubText}>स्कैन करें</Text>
                  </View>

                  {/* Details */}
                  <View style={styles.detailsCol}>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>मुखिया (Head):</Text>
                      <Text style={[styles.detailValue, { color: colors.textPrimary }]} numberOfLines={1}>
                        {headName}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>पिता/पति (Father):</Text>
                      <Text style={[styles.detailValue, { color: colors.textPrimary }]} numberOfLines={1}>
                        {fatherName}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>गाँव / मोहल्ला:</Text>
                      <Text style={[styles.detailValue, { color: colors.textPrimary }]} numberOfLines={1}>
                        {family.village || 'N/A'} • {family.mohalla || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Government IDs Bar */}
                <View style={[styles.govIdsBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9' }]}>
                  <View style={styles.govIdItem}>
                    <Text style={[styles.govIdLabel, { color: colors.textMuted }]}>जन आधार क्रमांक</Text>
                    <Text style={[styles.govIdVal, { color: colors.textPrimary }]}>
                      {family.janAadhaarNumber || family.janAadhaar || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.govIdDivider} />
                  <View style={styles.govIdItem}>
                    <Text style={[styles.govIdLabel, { color: colors.textMuted }]}>राशन कार्ड क्रमांक</Text>
                    <Text style={[styles.govIdVal, { color: colors.textPrimary }]}>
                      {family.rationCardNumber || family.rationCard || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Family Members Summary List */}
                <View style={styles.membersSummarySection}>
                  <Text style={[styles.membersSectionTitle, { color: colors.textSecondary }]}>
                    दर्ज सदस्य ({members.length} व्यक्ति):
                  </Text>
                  <View style={styles.membersChipRow}>
                    {members.slice(0, 6).map((m, idx) => (
                      <View key={idx} style={[styles.memberChip, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                        <Text style={[styles.memberChipText, { color: colors.textPrimary }]}>
                          {m.nameHindi || m.nameEnglish || m.name || `सदस्य ${idx + 1}`} ({m.relation || 'सदस्य'})
                        </Text>
                      </View>
                    ))}
                    {members.length > 6 && (
                      <View style={[styles.memberChip, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.memberChipText, { color: colors.primaryDark }]}>
                          +{members.length - 6} अन्य
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Official Verification Notice */}
                <View style={styles.verificationNoteRow}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                  <Text style={[styles.verificationNoteText, { color: colors.textSecondary }]}>
                    ग्राम पंचायत द्वारा डिजिटल रूप से सत्यापित एवं क्लाउड सुरक्षित
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={handlePrintIdCard}
                activeOpacity={0.8}
              >
                <Ionicons name="print-outline" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>प्रिंट / PDF डाउनलोड</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.shareBtn, { borderColor: colors.cardBorder }]}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={18} color={colors.textPrimary} />
                <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>शेयर करें</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  scrollContent: {
    padding: 18,
  },
  idCardContainer: {
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTopHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  govText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardMainHeading: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  cardInnerBody: {
    padding: 16,
  },
  idBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  idPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  idText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categoryPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  qrInfoRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  qrWrapper: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  qrSubText: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  detailsCol: {
    flex: 1,
    gap: 8,
  },
  detailItem: {
    gap: 2,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  govIdsBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  govIdItem: {
    flex: 1,
    alignItems: 'center',
  },
  govIdDivider: {
    width: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.25)',
  },
  govIdLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  govIdVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  membersSummarySection: {
    marginBottom: 14,
  },
  membersSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  membersChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  memberChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  memberChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  verificationNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  verificationNoteText: {
    fontSize: 10,
    fontWeight: '500',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  shareBtn: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
