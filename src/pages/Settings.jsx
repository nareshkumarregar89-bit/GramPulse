import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  Moon,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  MapPin,
  UsersRound,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { ExcelImportModal } from '../components/ExcelImportModal';

export function Settings() {
  const {
    families,
    villages,
    mohallas,
    castes,
    darkMode,
    setDarkMode,
    language,
    addVillage,
    deleteVillage,
    addMohalla,
    deleteMohalla,
    addCaste,
    deleteCaste,
    resetData,
    clearAllSurveyData,
    exportData,
    importData
  } = useData();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const [newVillage, setNewVillage] = useState('');
  const [newMohalla, setNewMohalla] = useState('');
  const [newCaste, setNewCaste] = useState('');
  const [settingsExportFormat, setSettingsExportFormat] = useState('json');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const handleAddVillage = () => {
    if (newVillage.trim() && !villages.includes(newVillage.trim())) {
      addVillage(newVillage.trim());
      setNewVillage('');
      addToast(language === 'hi' ? 'गाँव सफलतापूर्वक जोड़ा गया!' : 'Village added successfully!', 'success');
    }
  };

  const handleDeleteVillage = (village) => {
    if (confirm(language === 'hi' ? `क्या आप निश्चित रूप से "${village}" को हटाना चाहते हैं?` : `Are you sure you want to delete "${village}"?`)) {
      deleteVillage(village);
      addToast(language === 'hi' ? 'गाँव हटा दिया गया!' : 'Village deleted successfully!', 'success');
    }
  };

  const handleAddMohalla = () => {
    if (newMohalla.trim() && !mohallas.includes(newMohalla.trim())) {
      addMohalla(newMohalla.trim());
      setNewMohalla('');
      addToast('Mohalla added successfully!', 'success');
    }
  };

  const handleAddCaste = () => {
    if (newCaste.trim() && !castes.includes(newCaste.trim())) {
      addCaste(newCaste.trim());
      setNewCaste('');
      addToast('Caste added successfully!', 'success');
    }
  };

  const handleDeleteMohalla = (mohalla) => {
    if (confirm(`Are you sure you want to delete "${mohalla}"?`)) {
      deleteMohalla(mohalla);
      addToast('Mohalla deleted successfully!', 'success');
    }
  };

  const handleDeleteCaste = (caste) => {
    if (confirm(`Are you sure you want to delete "${caste}"?`)) {
      deleteCaste(caste);
      addToast('Caste deleted successfully!', 'success');
    }
  };

  // Export as Excel for Settings - with ALL details
  const exportSettingsToExcel = () => {
    const excelData = families.flatMap(family => {
      return family.members.map(member => ({
        'Family ID': family.id,
        'Family Head Name': family.familyHeadNameEnglish || family.familyHeadNameHindi || family.familyHeadName || '',
        'Father/Husband Name': family.fatherName || '',
        'Mobile Number': family.mobile,
        'Alternate Mobile': family.alternateMobile || '',
        'Mohalla': family.mohalla,
        'Caste': family.caste,
        'Address': family.address || '',
        'House Number': family.houseNumber || '',
        'PIN Code': family.pinCode || '',
        'Aadhaar Number': family.aadhaarNumber || '',
        'Jan Aadhaar Number': family.janAadhaarNumber || '',
        'Ration Card Number': family.rationCardNumber || '',
        'Voter ID': family.voterId || '',
        'Bank Name': family.bankName || '',
        'Branch Name': family.branch || '',
        'Account Holder': family.accountHolder || '',
        'Account Number': family.accountNumber || '',
        'IFSC Code': family.ifsc || '',
        'Monthly Income': family.monthlyIncome || '',
        'Occupation': family.occupation || '',
        'Category': family.category || '',
        'House Type': family.houseType || '',
        'Water Connection': family.waterConnection ? 'Yes' : 'No',
        'Electricity Connection': family.electricityConnection ? 'Yes' : 'No',
        'Toilet Available': family.toilet ? 'Yes' : 'No',
        'Gas Connection': family.gasConnection ? 'Yes' : 'No',
        'Member ID': member.id,
        'Member Name': member.name,
        'Member Age': member.age,
        'Member Gender': member.gender,
        'Member Relation': member.relation,
        'Member Aadhaar Number': member.aadhaarNumber || '',
        'Member Occupation': member.occupation || '',
        'Member Education': member.education || '',
        'Member Marital Status': member.maritalStatus || ''
      }));
    });
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Complete Family Data");
    XLSX.writeFile(workbook, `villagepulse-data-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export as PDF for Settings - with ALL details
  const exportSettingsToPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    
    // Title
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('VillagePulse - Complete Village Survey Report', 14, yPos);
    yPos += 10;
    doc.setFont(undefined, 'normal');
    
    // Subtitle
    doc.setFontSize(12);
    doc.text(`Exported on: ${new Date().toLocaleString()}`, 14, yPos);
    yPos += 15;
    
    // Summary
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', 14, yPos);
    yPos += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text(`Total Families: ${families.length}`, 16, yPos);
    yPos += 6;
    const totalPop = families.reduce((sum, f) => sum + f.members.length, 0);
    doc.text(`Total Population: ${totalPop}`, 16, yPos);
    yPos += 12;
    
    // Families
    families.forEach((family, idx) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      // Family Header
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`${idx + 1}. Family: ${family.familyHeadNameEnglish || family.familyHeadNameHindi || family.familyHeadName || 'Family'}`, 14, yPos);
      yPos += 8;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      
      // Family Details - Section 1
      doc.text('--- Family Information ---', 16, yPos);
      yPos += 6;
      doc.text(`Father/Husband Name: ${family.fatherName || 'N/A'}`, 18, yPos);
      yPos += 5;
      doc.text(`Mobile: ${family.mobile}`, 18, yPos);
      yPos += 5;
      if (family.alternateMobile) { doc.text(`Alternate Mobile: ${family.alternateMobile}`, 18, yPos); yPos += 5; }
      doc.text(`Mohalla: ${family.mohalla}`, 18, yPos);
      yPos += 5;
      doc.text(`Caste: ${family.caste}`, 18, yPos);
      yPos += 5;
      if (family.address) { doc.text(`Address: ${family.address}`, 18, yPos); yPos += 5; }
      if (family.houseNumber) { doc.text(`House Number: ${family.houseNumber}`, 18, yPos); yPos += 5; }
      if (family.pinCode) { doc.text(`PIN Code: ${family.pinCode}`, 18, yPos); yPos += 5; }
      
      // Govt Documents
      yPos += 4;
      doc.text('--- Government Documents ---', 16, yPos);
      yPos += 6;
      if (family.aadhaarNumber) { doc.text(`Aadhaar Number: ${family.aadhaarNumber}`, 18, yPos); yPos += 5; }
      if (family.janAadhaarNumber) { doc.text(`Jan Aadhaar Number: ${family.janAadhaarNumber}`, 18, yPos); yPos += 5; }
      if (family.rationCardNumber) { doc.text(`Ration Card Number: ${family.rationCardNumber}`, 18, yPos); yPos += 5; }
      if (family.voterId) { doc.text(`Voter ID: ${family.voterId}`, 18, yPos); yPos += 5; }
      
      // Bank Details
      yPos += 4;
      doc.text('--- Bank Details ---', 16, yPos);
      yPos += 6;
      if (family.bankName) { doc.text(`Bank Name: ${family.bankName}`, 18, yPos); yPos += 5; }
      if (family.branch) { doc.text(`Branch: ${family.branch}`, 18, yPos); yPos += 5; }
      if (family.accountHolder) { doc.text(`Account Holder: ${family.accountHolder}`, 18, yPos); yPos += 5; }
      if (family.accountNumber) { doc.text(`Account Number: ${family.accountNumber}`, 18, yPos); yPos += 5; }
      if (family.ifsc) { doc.text(`IFSC Code: ${family.ifsc}`, 18, yPos); yPos += 5; }
      
      // House Info
      yPos += 4;
      doc.text('--- House Information ---', 16, yPos);
      yPos += 6;
      if (family.monthlyIncome) { doc.text(`Monthly Income: ₹${family.monthlyIncome}`, 18, yPos); yPos += 5; }
      if (family.occupation) { doc.text(`Occupation: ${family.occupation}`, 18, yPos); yPos += 5; }
      doc.text(`Category: ${family.category}`, 18, yPos); yPos +=5;
      if (family.houseType) { doc.text(`House Type: ${family.houseType}`, 18, yPos); yPos += 5; }
      doc.text(`Water Connection: ${family.waterConnection ? 'Yes' : 'No'}`, 18, yPos); yPos +=5;
      doc.text(`Electricity Connection: ${family.electricityConnection ? 'Yes' : 'No'}`, 18, yPos); yPos +=5;
      doc.text(`Toilet Available: ${family.toilet ? 'Yes' : 'No'}`, 18, yPos); yPos +=5;
      doc.text(`Gas Connection: ${family.gasConnection ? 'Yes' : 'No'}`, 18, yPos); yPos +=5;
      
      // Family Members
      yPos +=4;
      doc.text('--- Family Members ---',16, yPos);
      yPos +=6;
      family.members.forEach((member, mIdx) => {
        if (yPos > pageHeight -40) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont(undefined, 'bold');
        doc.text(`${mIdx+1}. ${member.name}`,18,yPos);
        yPos +=6;
        doc.setFont(undefined, 'normal');
        doc.text(`   Age: ${member.age} | Gender: ${member.gender} | Relation: ${member.relation}`,18,yPos);
        yPos +=5;
        if (member.aadhaarNumber) { doc.text(`   Aadhaar Number: ${member.aadhaarNumber}`,18,yPos); yPos +=5; }
        if (member.education) { doc.text(`   Education: ${member.education}`,18,yPos); yPos +=5; }
        if (member.occupation) { doc.text(`   Occupation: ${member.occupation}`,18,yPos); yPos +=5; }
        doc.text(`   Marital Status: ${member.maritalStatus}`,18,yPos);
        yPos +=8;
      });
      
      yPos += 10;
    });
    
    doc.save(`villagepulse-data-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleSettingsExport = () => {
    switch (settingsExportFormat) {
      case 'json':
        exportData();
        break;
      case 'excel':
        exportSettingsToExcel();
        break;
      case 'pdf':
        exportSettingsToPDF();
        break;
      default:
        exportData();
        break;
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          importData(data);
          addToast('Data imported successfully!', 'success');
        } catch (error) {
          addToast('Invalid JSON file', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const [isWiping, setIsWiping] = useState(false);

  const handleResetData = async () => {
    const confirmMsg = language === 'hi'
      ? 'सावधानी: क्या आप वाकई डेटाबेस और ऐप से सभी (डमी / पुराने) परिवार रिकॉर्ड हटाना चाहते हैं? इसके बाद आप नया असली डेटा अपलोड कर सकेंगे।'
      : 'Caution: Are you sure you want to permanently delete all survey/family records from the database? This action cannot be undone.';

    if (window.confirm(confirmMsg)) {
      try {
        setIsWiping(true);
        const res = await clearAllSurveyData();
        addToast(
          language === 'hi'
            ? `सफलतापूर्वक डेटा साफ़ हुआ! (${res.count || 0} रिकॉर्ड हटाए गए)`
            : `All dummy survey data deleted successfully! (${res.count || 0} records wiped)`,
          'success'
        );
      } catch (err) {
        console.error('Wipe data error:', err);
        addToast(err.message || 'Failed to wipe survey data', 'error');
      } finally {
        setIsWiping(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your application preferences and data</p>
      </div>

      {/* Theme */}
      <SettingSection title="Appearance" icon={Sun}>
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark/light theme</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-14 h-8 rounded-full transition-colors relative ${darkMode ? 'bg-gradient-to-r from-green-500 to-indigo-600' : 'bg-gray-300'}`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${darkMode ? 'left-7' : 'left-1'}`}
            />
          </button>
        </div>
      </SettingSection>

      {/* Manage Villages */}
      <SettingSection title={language === 'hi' ? 'गाँव प्रबंधन (Manage Villages)' : 'Manage Villages'} icon={Building2}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 mb-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
          <div>
            <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
              {language === 'hi' ? 'समग्र गाँव प्रबंधन केंद्र' : 'Dynamic Village Management'}
            </h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
              {language === 'hi' 
                ? 'समोड़ी, कोटड़ी और नए गाँवों के हिंदी-अंग्रेजी नाम, एक्टिव/इनएक्टिव स्थिति और सुरक्षा नियंत्रण'
                : 'Manage English/Hindi names, active/inactive states, and survey records integrity.'}
            </p>
          </div>
          <Link
            to="/admin/villages"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <span>{language === 'hi' ? 'गाँव प्रबंधन खोलें' : 'Open Village Hub'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-2">
          {villages.map((village) => (
            <div key={village} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <span className="text-gray-900 dark:text-white font-medium">{village}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 font-bold">
                {language === 'hi' ? 'सक्रिय' : 'Active'}
              </span>
            </div>
          ))}
        </div>
      </SettingSection>

      {/* Manage Mohallas */}
      <SettingSection title="Manage Mohallas" icon={MapPin}>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Add new mohalla..."
            value={newMohalla}
            onChange={(e) => setNewMohalla(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddMohalla()}
            className={`
              flex-1 px-4 py-3 rounded-xl border outline-none
              ${darkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }
            `}
          />
          <button
            onClick={handleAddMohalla}
            disabled={!newMohalla.trim()}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          {mohallas.map((mohalla) => (
            <div key={mohalla} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <span className="text-gray-900 dark:text-white">{mohalla}</span>
              <button
                onClick={() => handleDeleteMohalla(mohalla)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </SettingSection>

      {/* Manage Castes */}
      <SettingSection title="Manage Castes" icon={UsersRound}>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Add new caste..."
            value={newCaste}
            onChange={(e) => setNewCaste(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCaste()}
            className={`
              flex-1 px-4 py-3 rounded-xl border outline-none
              ${darkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }
            `}
          />
          <button
            onClick={handleAddCaste}
            disabled={!newCaste.trim()}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          {castes.map((caste) => (
            <div key={caste} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <span className="text-gray-900 dark:text-white">{caste}</span>
              <button
                onClick={() => handleDeleteCaste(caste)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </SettingSection>

      {/* Data Management */}
      <SettingSection title="Data Management" icon={Download}>
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={settingsExportFormat}
              onChange={(e) => setSettingsExportFormat(e.target.value)}
              className={`flex-1 px-4 py-3 rounded-xl border outline-none ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="json">JSON</option>
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
            </select>
            <button
              onClick={handleSettingsExport}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-gray-900 dark:text-white">Export</span>
            </button>
          </div>

          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div className="text-left flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {language === 'hi' ? 'एक्सेल शीट से इम्पोर्ट करें (.xlsx)' : 'Import from Excel (.xlsx)'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'hi' ? 'सैंपल टेम्पलेट डाउनलोड करें और बल्क डेटा अपलोड करें' : 'Download sample template & upload village families in bulk'}
              </p>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl border bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">Import Data</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Upload data from JSON file</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </button>

          <button
            onClick={handleResetData}
            disabled={isWiping}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/15 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all disabled:opacity-50"
          >
            <Trash2 className={`w-5 h-5 text-red-600 dark:text-red-400 ${isWiping ? 'animate-spin' : ''}`} />
            <div className="text-left flex-1">
              <p className="font-semibold text-red-700 dark:text-red-300">
                {isWiping
                  ? (language === 'hi' ? 'डेटा साफ़ किया जा रहा है...' : 'Wiping all survey data...')
                  : (language === 'hi' ? 'सभी डमी एवं सर्वे डेटा मिटाएं' : 'Wipe All Dummy & Survey Data')}
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-400/80">
                {language === 'hi'
                  ? 'डेटाबेस और ऐप से सभी पुराने व डमी परिवार रिकॉर्ड स्थायी रूप से हटाएँ ताकि आप असली डेटा अपलोड कर सकें'
                  : 'Permanently wipe all mock survey records from database to upload real data'}
              </p>
            </div>
          </button>
        </div>
      </SettingSection>

      {/* Danger Zone */}
      <SettingSection title="About" icon={AlertTriangle}>
        <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-indigo-50 dark:from-green-900/20 dark:to-indigo-900/20">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">VillagePulse</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Smart Village Survey & Family Records Management System
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Version 1.0.0 • © 2026 VillagePulse
          </p>
        </div>
      </SettingSection>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />
    </div>
  );
}

function SettingSection({ title, icon: Icon, children }) {
  const { darkMode } = useData();
  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}
