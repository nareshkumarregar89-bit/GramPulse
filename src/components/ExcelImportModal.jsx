import { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Building2, 
  FileCheck,
  RefreshCw,
  Eye,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function ExcelImportModal({ isOpen, onClose }) {
  const { darkMode, language, villages, allFamilies, bulkAddFamilies } = useData();
  const { currentUser, userProfile, isAdmin, assignedVillages } = useAuth();
  const { addToast } = useToast();

  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [validRows, setValidRows] = useState([]);
  const [duplicateRows, setDuplicateRows] = useState([]);
  const [errorRows, setErrorRows] = useState([]);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'valid', 'duplicate', 'error'

  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileError, setFileError] = useState('');
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // The villages allowed for current user
  const allowedVillages = isAdmin ? villages : (assignedVillages.length > 0 ? assignedVillages : villages);

  // Generate & Download sample Excel template
  const handleDownloadTemplate = () => {
    const sampleVillage = allowedVillages[0] || 'समोड़ी (Samodi)';
    const sampleRows = [
      {
        'Village Name': sampleVillage,
        'Family Head Name': 'रामलाल शर्मा',
        'Father or Husband Name': 'कन्हैयालाल शर्मा',
        'Mobile Number': '9876543210',
        'Alternate Mobile': '9876543211',
        'Mohalla': 'Regar Mohalla',
        'Caste': 'Brahmin',
        'Category': 'APL',
        'House Number': 'H-101',
        'Address': 'वार्ड नं. 4, मुख्य बाजार के पास',
        'PIN Code': '302001',
        'Aadhaar Number': '123456789012',
        'Jan Aadhaar Number': '9876543210',
        'Ration Card Number': 'RC-100234',
        'Bank Name': 'SBI',
        'Account Number': '1029384756',
        'IFSC Code': 'SBIN0001234',
        'House Type': 'Pucca',
        'Electricity Connection': 'Yes',
        'Water Tap Connection': 'Yes',
        'Toilet Available': 'Yes',
        'Gas Connection': 'Yes',
        'Member 1 Name': 'रामलाल शर्मा',
        'Member 1 Age': 45,
        'Member 1 Gender': 'Male',
        'Member 1 Relation': 'Head',
        'Member 2 Name': 'सुनीता देवी',
        'Member 2 Age': 40,
        'Member 2 Gender': 'Female',
        'Member 2 Relation': 'Wife',
        'Member 3 Name': 'रोहित शर्मा',
        'Member 3 Age': 18,
        'Member 3 Gender': 'Male',
        'Member 3 Relation': 'Son'
      },
      {
        'Village Name': sampleVillage,
        'Family Head Name': 'मोहनलाल जाट',
        'Father or Husband Name': 'हरदेव जाट',
        'Mobile Number': '9829012345',
        'Alternate Mobile': '',
        'Mohalla': 'Ahir Mohalla',
        'Caste': 'Jat',
        'Category': 'BPL',
        'House Number': '12',
        'Address': 'स्कूल के पीछे',
        'PIN Code': '302001',
        'Aadhaar Number': '456789123456',
        'Jan Aadhaar Number': '5432109876',
        'Ration Card Number': 'RC-200456',
        'Bank Name': 'BOB',
        'Account Number': '9876123456',
        'IFSC Code': 'BARB0JAIPUR',
        'House Type': 'Pucca',
        'Electricity Connection': 'Yes',
        'Water Tap Connection': 'Yes',
        'Toilet Available': 'Yes',
        'Gas Connection': 'Yes',
        'Member 1 Name': 'मोहनलाल जाट',
        'Member 1 Age': 50,
        'Member 1 Gender': 'Male',
        'Member 1 Relation': 'Head',
        'Member 2 Name': 'कमला देवी',
        'Member 2 Age': 46,
        'Member 2 Gender': 'Female',
        'Member 2 Relation': 'Wife'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample_Families');
    XLSX.writeFile(workbook, 'GramPulse_Village_Survey_Sample_Template.xlsx');
    addToast(language === 'hi' ? 'सैंपल टेम्पलेट डाउनलोड हो गया!' : 'Sample template downloaded!', 'success');
  };

  // Helper to extract value flexibly from multiple possible column names
  const getValue = (row, keys) => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
        return String(row[key]).trim();
      }
    }
    return '';
  };

  // Handle Excel upload, row-by-row validation, and duplicate detection
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // File validation: Size <= 10MB
    if (selected.size > 10 * 1024 * 1024) {
      setFileError(language === 'hi' ? 'फाइल का आकार 10MB से कम होना चाहिए।' : 'File size exceeds 10MB limit.');
      return;
    }

    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setFileError(language === 'hi' ? 'केवल .xlsx, .xls या .csv फाइल समर्थित है।' : 'Only .xlsx, .xls, or .csv files are supported.');
      return;
    }

    setFile(selected);
    setIsProcessing(true);
    setFileError('');
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(sheet);

        if (!rawJson || rawJson.length === 0) {
          setFileError(language === 'hi' ? 'एक्सेल शीट खाली है या डेटा नहीं मिला।' : 'Excel sheet is empty or contains no records.');
          setIsProcessing(false);
          return;
        }

        const valid = [];
        const duplicates = [];
        const errors = [];
        const allParsed = [];

        // In-file duplicate tracking sets
        const seenMobilesInFile = new Set();
        const seenAadhaarsInFile = new Set();

        // Database lookup sets for duplicate detection
        const existingMobilesMap = new Map();
        const existingAadhaarsMap = new Map();
        (allFamilies || []).forEach(f => {
          if (f.mobile) existingMobilesMap.set(String(f.mobile).trim(), f);
          if (f.aadhaarNumber) existingAadhaarsMap.set(String(f.aadhaarNumber).trim(), f);
        });

        rawJson.forEach((row, idx) => {
          const rowNumber = idx + 2; // Excel row numbering starts at 2 (row 1 is header)
          const rowErrors = [];

          const headName = getValue(row, ['Family Head Name', 'Head Name', 'Family Head', 'Name', 'मुखिया का नाम', 'परिवार मुखिया का नाम', 'नाम']);
          const fatherName = getValue(row, ['Father or Husband Name', 'Father Name', 'Husband Name', 'पिता/पति का नाम', 'पिता का नाम']);
          let mobile = getValue(row, ['Mobile Number', 'Mobile', 'Phone', 'मोबाइल', 'मोबाइल नंबर']);
          const altMobile = getValue(row, ['Alternate Mobile', 'Alt Mobile', 'वैकल्पिक मोबाइल']);
          let village = getValue(row, ['Village Name', 'Village', 'गाँव का नाम', 'गाँव']);
          const mohalla = getValue(row, ['Mohalla', 'मोहल्ला', 'Colony']) || 'Shastri Nagar';
          const caste = getValue(row, ['Caste', 'जाति']) || 'General';
          const category = getValue(row, ['Category', 'वर्ग', 'BPL/APL']) || 'APL';
          const houseNumber = getValue(row, ['House Number', 'मकान नंबर', 'House No']);
          const address = getValue(row, ['Address', 'पता']);
          const pinCode = getValue(row, ['PIN Code', 'Pin Code', 'पिन कोड', 'Pincode']) || '302001';
          const aadhaarNumber = getValue(row, ['Aadhaar Number', 'Aadhaar', 'आधार नंबर', 'आधार']);
          const janAadhaarNumber = getValue(row, ['Jan Aadhaar Number', 'Jan Aadhaar', 'जन आधार']);
          const rationCardNumber = getValue(row, ['Ration Card Number', 'Ration Card', 'राशन कार्ड']);
          const voterId = getValue(row, ['Voter ID', 'Voter Id', 'वोटर आईडी']);
          const bankName = getValue(row, ['Bank Name', 'बैंक नाम', 'Bank']);
          const branch = getValue(row, ['Branch', 'ब्रांच', 'शाखा']);
          const accountHolder = getValue(row, ['Account Holder', 'खाताधारक']) || headName;
          const accountNumber = getValue(row, ['Account Number', 'खाता संख्या']);
          const ifsc = getValue(row, ['IFSC Code', 'IFSC', 'आईएफएससी']);
          const houseType = getValue(row, ['House Type', 'मकान प्रकार']) || 'Pucca';
          const electricity = String(getValue(row, ['Electricity Connection', 'Electricity', 'बिजली'])).toLowerCase().includes('y');
          const water = String(getValue(row, ['Water Tap Connection', 'Water', 'पानी'])).toLowerCase().includes('y');
          const toilet = String(getValue(row, ['Toilet Available', 'Toilet', 'शौचालय'])).toLowerCase().includes('y');
          const gas = String(getValue(row, ['Gas Connection', 'Gas', 'गैस'])).toLowerCase().includes('y');

          // Clean up mobile
          mobile = mobile.replace(/[^0-9]/g, '');

          // 1. Validation: Family Head Name
          if (!headName || headName.trim().length < 2) {
            rowErrors.push(language === 'hi' ? 'मुखिया का नाम अनिवार्य है' : 'Family Head Name is required');
          }

          // 2. Validation: Mobile Number (10 digits)
          if (!mobile || mobile.length !== 10) {
            rowErrors.push(language === 'hi' ? `अमान्य मोबाइल नंबर (${mobile || 'खाली'}): 10 अंक होने चाहिए` : `Invalid mobile (${mobile || 'empty'}): must be 10 digits`);
          }

          // 3. Validation: Village-wise permissions & existence
          if (!village) {
            if (!isAdmin && assignedVillages.length > 0) {
              village = assignedVillages[0];
            } else if (allowedVillages.length > 0) {
              village = allowedVillages[0];
            } else {
              rowErrors.push(language === 'hi' ? 'गाँव का नाम खाली है' : 'Village Name is missing');
            }
          }

          if (village) {
            if (!isAdmin) {
              // Regular user MUST only import into their assigned villages!
              const isAssigned = assignedVillages.some(v => v.toLowerCase() === village.toLowerCase());
              if (!isAssigned) {
                rowErrors.push(
                  language === 'hi'
                    ? `गाँव "${village}" आपके आवंटित गाँवों (${assignedVillages.join(', ')}) में शामिल नहीं है`
                    : `Village "${village}" is not in your assigned villages (${assignedVillages.join(', ')})`
                );
              }
            } else {
              // Admin must provide an existing system village
              const exists = villages.some(v => v.toLowerCase() === village.toLowerCase());
              if (!exists) {
                rowErrors.push(
                  language === 'hi'
                    ? `गाँव "${village}" पंजीकृत गाँवों में नहीं मिला`
                    : `Village "${village}" is not a registered village`
                );
              }
            }
          }

          // Parse members
          const members = [];
          for (let m = 1; m <= 10; m++) {
            const mName = getValue(row, [`Member ${m} Name`, `Member${m}Name`, `सदस्य ${m} नाम`]);
            if (mName) {
              const mAge = parseInt(getValue(row, [`Member ${m} Age`, `Member${m}Age`, `सदस्य ${m} आयु`]) || '30', 10);
              const mGender = getValue(row, [`Member ${m} Gender`, `Member${m}Gender`, `सदस्य ${m} लिंग`]) || 'Male';
              const mRelation = getValue(row, [`Member ${m} Relation`, `Member${m}Relation`, `सदस्य ${m} संबंध`]) || (m === 1 ? 'Head' : 'Member');
              members.push({
                id: m,
                name: mName,
                nameEnglish: mName,
                nameHindi: mName,
                age: isNaN(mAge) ? 30 : mAge,
                gender: mGender.toLowerCase().startsWith('f') ? 'Female' : 'Male',
                relation: mRelation,
                aadhaarNumber: '',
                occupation: '',
                education: '',
                maritalStatus: 'Married'
              });
            }
          }

          if (members.length === 0 && headName) {
            members.push({
              id: 1,
              name: headName,
              nameEnglish: headName,
              nameHindi: headName,
              age: 40,
              gender: 'Male',
              relation: 'Head',
              aadhaarNumber: aadhaarNumber || '',
              occupation: 'Agriculture',
              education: 'Secondary',
              maritalStatus: 'Married'
            });
          }

          const parsedItem = {
            rowNumber,
            familyHeadName: headName,
            familyHeadNameEnglish: headName,
            familyHeadNameHindi: headName,
            fatherName,
            fatherNameEnglish: fatherName,
            fatherNameHindi: fatherName,
            mobile,
            alternateMobile: altMobile,
            village,
            mohalla,
            caste,
            category,
            houseNumber,
            address,
            pinCode,
            aadhaarNumber,
            janAadhaarNumber,
            rationCardNumber,
            voterId,
            bankName,
            branch,
            accountHolder,
            accountNumber,
            ifsc,
            houseType,
            electricityConnection: electricity,
            waterTapConnection: water,
            toiletAvailable: toilet,
            gasConnection: gas,
            members,
            surveyorId: currentUser?.uid || '',
            surveyorName: userProfile?.name || currentUser?.email?.split('@')[0] || 'User',
            surveyorEmail: currentUser?.email || '',
            originalRow: row
          };

          allParsed.push(parsedItem);

          // If row has validation errors:
          if (rowErrors.length > 0) {
            errors.push({
              ...parsedItem,
              status: 'error',
              errorReason: rowErrors.join('; ')
            });
            return;
          }

          // 4. Duplicate Check: In-file duplicate
          if (seenMobilesInFile.has(mobile)) {
            duplicates.push({
              ...parsedItem,
              status: 'duplicate',
              errorReason: language === 'hi' ? `शीट में मोबाइल ${mobile} पहले भी आ चुका है` : `Duplicate mobile ${mobile} inside Excel file`
            });
            return;
          }
          seenMobilesInFile.add(mobile);

          if (aadhaarNumber && seenAadhaarsInFile.has(aadhaarNumber)) {
            duplicates.push({
              ...parsedItem,
              status: 'duplicate',
              errorReason: language === 'hi' ? `शीट में आधार ${aadhaarNumber} पहले भी आ चुका है` : `Duplicate Aadhaar ${aadhaarNumber} inside Excel file`
            });
            return;
          }
          if (aadhaarNumber) seenAadhaarsInFile.add(aadhaarNumber);

          // 5. Duplicate Check: Database existing family
          const existingByMobile = existingMobilesMap.get(mobile);
          if (existingByMobile) {
            duplicates.push({
              ...parsedItem,
              status: 'duplicate',
              errorReason: language === 'hi' 
                ? `डेटाबेस में पहले से मौजूद: ID ${existingByMobile.id} (${existingByMobile.familyHeadName})` 
                : `Already in database: ID ${existingByMobile.id} (${existingByMobile.familyHeadName})`
            });
            return;
          }

          if (aadhaarNumber && existingAadhaarsMap.has(aadhaarNumber)) {
            const existingByAadhaar = existingAadhaarsMap.get(aadhaarNumber);
            duplicates.push({
              ...parsedItem,
              status: 'duplicate',
              errorReason: language === 'hi'
                ? `आधार नंबर डेटाबेस में पहले से मौजूद: ID ${existingByAadhaar.id}`
                : `Aadhaar already in database: ID ${existingByAadhaar.id}`
            });
            return;
          }

          // Row is valid!
          valid.push({
            ...parsedItem,
            status: 'valid'
          });
        });

        setParsedRows(allParsed);
        setValidRows(valid);
        setDuplicateRows(duplicates);
        setErrorRows(errors);
      } catch (err) {
        console.error('Failed to parse excel:', err);
        setFileError(language === 'hi' ? 'एक्सेल फाइल पढ़ने में त्रुटि हुई। कृपया सैंपल फॉर्मेट का उपयोग करें।' : 'Failed to parse Excel file. Please ensure it matches template.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(selected);
  };

  // Download Error & Duplicate report so user can fix rows
  const handleDownloadErrorReport = () => {
    const issues = [...errorRows, ...duplicateRows];
    if (issues.length === 0) return;

    const reportData = issues.map(item => ({
      'Row Number': item.rowNumber,
      'Status': item.status === 'duplicate' ? 'DUPLICATE' : 'INVALID',
      'Reason / Error': item.errorReason,
      'Village Name': item.village || '',
      'Family Head Name': item.familyHeadName || '',
      'Father Name': item.fatherName || '',
      'Mobile Number': item.mobile || '',
      'Mohalla': item.mohalla || '',
      'Caste': item.caste || '',
      'Aadhaar Number': item.aadhaarNumber || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Validation_Errors');
    XLSX.writeFile(workbook, `GramPulse_Import_Errors_${new Date().toISOString().split('T')[0]}.xlsx`);
    addToast(language === 'hi' ? 'त्रुटि रिपोर्ट (.xlsx) डाउनलोड हो गई!' : 'Error report (.xlsx) downloaded!', 'success');
  };

  // Perform bulk import for valid rows
  const handleImportNow = async () => {
    if (validRows.length === 0) return;
    setIsImporting(true);
    try {
      await bulkAddFamilies(validRows);
      setImportSummary({
        successCount: validRows.length,
        duplicateCount: duplicateRows.length,
        errorCount: errorRows.length
      });
      addToast(
        language === 'hi' 
          ? `सफलतापूर्वक ${validRows.length} परिवारों का डेटा इम्पोर्ट हुआ!` 
          : `Successfully imported ${validRows.length} families!`,
        'success'
      );
    } catch (err) {
      console.error('Import failed:', err);
      addToast(language === 'hi' ? 'डेटा इम्पोर्ट करने में समस्या आई।' : 'Failed to import records.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Rows to display based on active tab
  const displayedRows = filterTab === 'valid' 
    ? validRows 
    : filterTab === 'duplicate' 
      ? duplicateRows 
      : filterTab === 'error' 
        ? errorRows 
        : [...validRows, ...duplicateRows, ...errorRows].sort((a, b) => a.rowNumber - b.rowNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border transition-all ${
        darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-green-500 to-indigo-600 text-white shadow-lg shadow-green-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {language === 'hi' ? 'एक्सेल शीट से बल्क डेटा इम्पोर्ट' : 'Bulk Village Family Excel Import'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isAdmin
                  ? (language === 'hi' ? 'एडमिन: सभी गाँवों का डेटा एक या एकाधिक फाइलों में इम्पोर्ट करें' : 'Admin: Import records for any registered village')
                  : (language === 'hi' ? `सर्वेयर: केवल आपके आवंटित गाँव (${allowedVillages.join(', ')}) का डेटा` : `Surveyor: Scoped to assigned village (${allowedVillages.join(', ')})`)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Step 1: Download Sample Template */}
          <div className="p-5 rounded-2xl border bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/60 dark:border-blue-900/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-sm text-blue-950 dark:text-blue-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  {language === 'hi' ? 'मानक एक्सेल टेम्पलेट डाउनलोड करें' : 'Download Standard Excel Template'}
                </h3>
                <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-1">
                  {language === 'hi'
                    ? 'गाँव, मुखिया का नाम, पिता का नाम, मोबाइल (10 अंक), मोहल्ला, जाति, और सदस्यों के कॉलम पहले से व्यवस्थित हैं।'
                    : 'Pre-formatted columns with village, head, father, 10-digit mobile, mohalla, caste, and member fields.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'hi' ? 'सैंपल टेम्पलेट (.xlsx)' : 'Sample Template (.xlsx)'}</span>
              </button>
            </div>
          </div>

          {/* Step 2: Upload Area */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              {language === 'hi' ? 'भरी हुई एक्सेल फाइल अपलोड करें' : 'Upload Filled Excel / CSV File'}
            </h3>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 md:p-8 border-2 border-dashed rounded-3xl cursor-pointer text-center transition-all ${
                file 
                  ? 'border-green-500 bg-green-50/20 dark:bg-green-950/20' 
                  : 'border-gray-300 dark:border-gray-700 hover:border-green-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <div className={`p-4 rounded-2xl ${file ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                  {file ? <FileCheck className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                </div>
                {file ? (
                  <div>
                    <p className="font-semibold text-sm text-green-600 dark:text-green-400">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • {language === 'hi' ? 'क्लिक करके दूसरी फाइल चुनें' : 'Click to select different file'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                      {language === 'hi' ? 'एक्सेल फाइल यहाँ ड्रॉप करें या ब्राउज करें' : 'Drop Excel file here or click to browse'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">.xlsx, .xls or .csv (Max 10MB)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Processing Spinner */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-3 p-6 text-sm text-gray-500">
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <span>{language === 'hi' ? 'एक्सेल डेटा और वैधता की जाँच हो रही है...' : 'Validating Excel rows and checking duplicates...'}</span>
            </div>
          )}

          {/* File Error Message */}
          {fileError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Import Final Summary Screen (if imported) */}
          {importSummary && (
            <div className="p-5 rounded-2xl border border-green-500/30 bg-green-50/50 dark:bg-green-950/20 space-y-3">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>{language === 'hi' ? 'इम्पोर्ट प्रक्रिया पूर्ण हुई!' : 'Import Completed Successfully!'}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <p className="text-lg font-bold text-green-600">{importSummary.successCount}</p>
                  <p className="text-gray-500">{language === 'hi' ? 'सफलतापूर्वक जोड़े गए' : 'Imported'}</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <p className="text-lg font-bold text-amber-500">{importSummary.duplicateCount}</p>
                  <p className="text-gray-500">{language === 'hi' ? 'डुप्लीकेट छोड़े गए' : 'Duplicates Skipped'}</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <p className="text-lg font-bold text-red-500">{importSummary.errorCount}</p>
                  <p className="text-gray-500">{language === 'hi' ? 'अमान्य पंक्तियाँ' : 'Invalid Rows'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Stats & Tabs */}
          {parsedRows.length > 0 && !importSummary && (
            <div className="space-y-4">
              {/* Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    filterTab === 'all' 
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 font-bold text-indigo-700 dark:text-indigo-300' 
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40'
                  }`}
                >
                  <p className="text-gray-500 dark:text-gray-400">{language === 'hi' ? 'कुल पंक्तियाँ' : 'Total Read'}</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{parsedRows.length}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('valid')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    filterTab === 'valid' 
                      ? 'border-green-500 bg-green-50/50 dark:bg-green-950/30 font-bold text-green-700 dark:text-green-300' 
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40'
                  }`}
                >
                  <p className="text-green-600 dark:text-green-400">{language === 'hi' ? 'वैध (रेडी)' : 'Valid (Ready)'}</p>
                  <p className="text-base font-bold text-green-700 dark:text-green-300 mt-0.5">{validRows.length}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('duplicate')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    filterTab === 'duplicate' 
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 font-bold text-amber-700 dark:text-amber-300' 
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40'
                  }`}
                >
                  <p className="text-amber-600 dark:text-amber-400">{language === 'hi' ? 'डुप्लीकेट' : 'Duplicates'}</p>
                  <p className="text-base font-bold text-amber-700 dark:text-amber-300 mt-0.5">{duplicateRows.length}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterTab('error')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    filterTab === 'error' 
                      ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 font-bold text-red-700 dark:text-red-300' 
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40'
                  }`}
                >
                  <p className="text-red-600 dark:text-red-400">{language === 'hi' ? 'त्रुटियाँ' : 'Errors'}</p>
                  <p className="text-base font-bold text-red-700 dark:text-red-300 mt-0.5">{errorRows.length}</p>
                </button>
              </div>

              {/* Action bar for error report */}
              {(errorRows.length > 0 || duplicateRows.length > 0) && (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      {language === 'hi' 
                        ? `${errorRows.length + duplicateRows.length} पंक्तियों में समस्या है। इन्हें ठीक करने के लिए रिपोर्ट डाउनलोड करें:` 
                        : `${errorRows.length + duplicateRows.length} rows have issues. Download report to correct them:`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadErrorReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'त्रुटि रिपोर्ट (.xlsx)' : 'Download Error Report'}</span>
                  </button>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`sticky top-0 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    <tr>
                      <th className="p-3 font-semibold">Row</th>
                      <th className="p-3 font-semibold">{language === 'hi' ? 'स्थिति' : 'Status'}</th>
                      <th className="p-3 font-semibold">{language === 'hi' ? 'मुखिया का नाम' : 'Head Name'}</th>
                      <th className="p-3 font-semibold">{language === 'hi' ? 'गाँव' : 'Village'}</th>
                      <th className="p-3 font-semibold">{language === 'hi' ? 'मोबाइल' : 'Mobile'}</th>
                      <th className="p-3 font-semibold">{language === 'hi' ? 'विवरण / त्रुटि' : 'Details / Error'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {displayedRows.map((fam, idx) => (
                      <tr 
                        key={idx} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 ${
                          fam.status === 'error' 
                            ? 'bg-red-50/30 dark:bg-red-950/20' 
                            : fam.status === 'duplicate' 
                              ? 'bg-amber-50/30 dark:bg-amber-950/20' 
                              : ''
                        }`}
                      >
                        <td className="p-3 font-mono text-gray-400">#{fam.rowNumber}</td>
                        <td className="p-3">
                          {fam.status === 'valid' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400">
                              ✓ {language === 'hi' ? 'वैध' : 'Valid'}
                            </span>
                          )}
                          {fam.status === 'duplicate' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              ⚠️ {language === 'hi' ? 'डुप्लीकेट' : 'Duplicate'}
                            </span>
                          )}
                          {fam.status === 'error' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400">
                              ✕ {language === 'hi' ? 'अमान्य' : 'Invalid'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">{fam.familyHeadName || '-'}</td>
                        <td className="p-3 text-indigo-600 dark:text-indigo-400 font-medium">{fam.village || '-'}</td>
                        <td className="p-3 font-mono">{fam.mobile || '-'}</td>
                        <td className="p-3 max-w-[200px] truncate text-gray-500">
                          {fam.errorReason ? (
                            <span className="text-red-500 font-medium">{fam.errorReason}</span>
                          ) : (
                            <span>{fam.members?.length || 0} {language === 'hi' ? 'सदस्य' : 'members'} • {fam.mohalla}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {importSummary ? (language === 'hi' ? 'बंद करें' : 'Close') : (language === 'hi' ? 'रद्द करें' : 'Cancel')}
          </button>

          {!importSummary && (
            <button
              type="button"
              onClick={handleImportNow}
              disabled={validRows.length === 0 || isImporting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-indigo-600 hover:from-green-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{language === 'hi' ? 'इम्पोर्ट हो रहा है...' : 'Importing...'}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>
                    {language === 'hi'
                      ? `${validRows.length} वैध परिवार इम्पोर्ट करें`
                      : `Import ${validRows.length} Valid Families`}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
