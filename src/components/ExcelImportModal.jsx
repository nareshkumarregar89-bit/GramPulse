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
  Filter,
  FileCode,
  ClipboardPaste,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { resolveVillageId, getVillageDisplayName } from '../utils/villageUtils';

export function ExcelImportModal({ isOpen, onClose }) {
  const { darkMode, language, villages, allFamilies, bulkAddFamilies, villageRecords } = useData();
  const { currentUser, userProfile, isAdmin, assignedVillages, assignedVillageIds } = useAuth();
  const { addToast } = useToast();

  const [importMode, setImportMode] = useState('file'); // 'file' or 'paste'
  const [jsonPasteText, setJsonPasteText] = useState('');
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [validRows, setValidRows] = useState([]);
  const [duplicateRows, setDuplicateRows] = useState([]);
  const [errorRows, setErrorRows] = useState([]);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'valid', 'duplicate', 'error'

  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [replaceAllExisting, setReplaceAllExisting] = useState(false);
  const [rawLoadedRows, setRawLoadedRows] = useState(null);
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
    XLSX.writeFile(workbook, 'VillagePulse_Village_Survey_Sample_Template.xlsx');
    addToast(language === 'hi' ? 'सैंपल एक्सेल टेम्पलेट डाउनलोड हो गया!' : 'Sample Excel template downloaded!', 'success');
  };

  // Generate & Download sample JSON template
  const handleDownloadJsonTemplate = () => {
    const sampleVillage = allowedVillages[0] || 'समोड़ी (Samodi)';
    const sampleData = {
      village: sampleVillage,
      surveyDate: new Date().toISOString().split('T')[0],
      families: [
        {
          id: 'FAM-0001',
          village: sampleVillage,
          familyHeadName: 'रामलाल शर्मा',
          fatherName: 'कन्हैयालाल शर्मा',
          mobile: '9876543210',
          alternateMobile: '9876543211',
          mohalla: 'Regar Mohalla',
          caste: 'Brahmin',
          category: 'APL',
          houseNumber: 'H-101',
          address: 'वार्ड नं. 4, मुख्य बाजार के पास',
          pinCode: '302001',
          aadhaarNumber: '123456789012',
          janAadhaarNumber: '9876543210',
          rationCardNumber: 'RC-100234',
          bankName: 'SBI',
          accountNumber: '1029384756',
          ifsc: 'SBIN0001234',
          houseType: 'Pucca',
          electricityConnection: true,
          waterTapConnection: true,
          toiletAvailable: true,
          gasConnection: true,
          members: [
            {
              id: 1,
              name: 'रामलाल शर्मा',
              age: 45,
              gender: 'Male',
              relation: 'Head',
              occupation: 'Agriculture',
              education: 'Secondary',
              maritalStatus: 'Married'
            },
            {
              id: 2,
              name: 'सुनीता देवी',
              age: 40,
              gender: 'Female',
              relation: 'Wife',
              occupation: 'Homemaker',
              education: 'Primary',
              maritalStatus: 'Married'
            },
            {
              id: 3,
              name: 'रोहित शर्मा',
              age: 18,
              gender: 'Male',
              relation: 'Son',
              occupation: 'Student',
              education: 'Senior Secondary',
              maritalStatus: 'Single'
            }
          ]
        }
      ]
    };

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'VillagePulse_Survey_Sample_Template.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast(language === 'hi' ? 'सैंपल JSON टेम्पलेट डाउनलोड हो गया!' : 'Sample JSON template downloaded!', 'success');
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

  // Helper to extract boolean flexibly from string/boolean representations
  const getBool = (row, keys) => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) {
        if (typeof row[key] === 'boolean') return row[key];
        const s = String(row[key]).trim().toLowerCase();
        if (['true', 'yes', 'y', '1', 'हाँ', 'हां'].includes(s)) return true;
        if (['false', 'no', 'n', '0', 'नहीं'].includes(s)) return false;
      }
    }
    return false;
  };

  // Shared row processing, validation and duplicate detection
  const processRows = (rawJson, isReplace = replaceAllExisting) => {
    setRawLoadedRows(rawJson);
    if (!rawJson || rawJson.length === 0) {
      setFileError(language === 'hi' ? 'फाइल में कोई रिकॉर्ड नहीं मिला।' : 'File contains no records.');
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
      const rowNumber = row.rowNumber || idx + 1;
      const rowErrors = [];

      const headName = getValue(row, [
        'Family Head Name', 'Head Name', 'Family Head', 'Name', 
        'मुखिया का नाम', 'परिवार मुखिया का नाम', 'नाम', 
        'familyHeadName', 'familyHeadNameHindi', 'familyHeadNameEnglish', 'headName', 'head_name'
      ]);
      const fatherName = getValue(row, [
        'Father or Husband Name', 'Father Name', 'Husband Name', 
        'पिता/पति का नाम', 'पिता का नाम', 
        'fatherName', 'fatherNameHindi', 'fatherNameEnglish', 'father_name', 'fatherOrHusbandName'
      ]);
      let mobile = getValue(row, [
        'Mobile Number', 'Mobile', 'Phone', 
        'मोबाइल', 'मोबाइल नंबर', 
        'mobile', 'mobileNumber', 'phone'
      ]);
      const altMobile = getValue(row, [
        'Alternate Mobile', 'Alt Mobile', 
        'वैकल्पिक मोबाइल', 
        'alternateMobile', 'altMobile'
      ]);
      let village = getValue(row, [
        'Village Name', 'Village', 
        'गाँव का नाम', 'गाँव', 
        'village', 'villageName'
      ]);
      const mohalla = getValue(row, ['Mohalla', 'मोहल्ला', 'Colony', 'mohalla']) || 'Shastri Nagar';
      const caste = getValue(row, ['Caste', 'जाति', 'caste']) || 'General';
      const category = getValue(row, ['Category', 'वर्ग', 'BPL/APL', 'category']) || 'APL';
      const houseNumber = getValue(row, ['House Number', 'मकान नंबर', 'House No', 'houseNumber', 'houseNo']);
      const address = getValue(row, ['Address', 'पता', 'address']);
      const pinCode = getValue(row, ['PIN Code', 'Pin Code', 'पिन कोड', 'Pincode', 'pinCode', 'pincode']) || '302001';
      const aadhaarNumber = getValue(row, ['Aadhaar Number', 'Aadhaar', 'आधार नंबर', 'आधार', 'aadhaarNumber', 'aadhaar']);
      const janAadhaarNumber = getValue(row, ['Jan Aadhaar Number', 'Jan Aadhaar', 'जन आधार', 'janAadhaarNumber', 'janAadhaar']);
      const rationCardNumber = getValue(row, ['Ration Card Number', 'Ration Card', 'राशन कार्ड', 'rationCardNumber', 'rationCard']);
      const voterId = getValue(row, ['Voter ID', 'Voter Id', 'वोटर आईडी', 'voterId', 'voterID']);
      const bankName = getValue(row, ['Bank Name', 'बैंक नाम', 'Bank', 'bankName']);
      const branch = getValue(row, ['Branch', 'ब्रांच', 'शाखा', 'branch']);
      const accountHolder = getValue(row, ['Account Holder', 'खाताधारक', 'accountHolder']) || headName;
      const accountNumber = getValue(row, ['Account Number', 'खाता संख्या', 'accountNumber']);
      const ifsc = getValue(row, ['IFSC Code', 'IFSC', 'आईएफएससी', 'ifsc']);
      const houseType = getValue(row, ['House Type', 'मकान प्रकार', 'houseType']) || 'Pucca';
      const electricity = getBool(row, ['Electricity Connection', 'Electricity', 'बिजली', 'electricityConnection', 'electricity']);
      const water = getBool(row, ['Water Tap Connection', 'Water', 'पानी', 'waterTapConnection', 'water']);
      const toilet = getBool(row, ['Toilet Available', 'Toilet', 'शौचालय', 'toiletAvailable', 'toilet']);
      const gas = getBool(row, ['Gas Connection', 'Gas', 'गैस', 'gasConnection', 'gas']);

      // Clean up mobile
      mobile = String(mobile).replace(/[^0-9]/g, '');
      if (mobile.startsWith('91') && mobile.length === 12) mobile = mobile.slice(2);
      if (mobile.startsWith('0') && mobile.length === 11) mobile = mobile.slice(1);
      if (mobile.length > 10 && (mobile.startsWith('7') || mobile.startsWith('8') || mobile.startsWith('9'))) {
        mobile = mobile.slice(0, 10);
      }

      // 1. Validation: Family Head Name
      if (!headName || headName.trim().length < 2) {
        rowErrors.push(language === 'hi' ? 'मुखिया का नाम अनिवार्य है' : 'Family Head Name is required');
      }

      // 2. Validation: Mobile Number (Optional for government survey records, but if present must be digits)
      if (mobile && mobile.length > 0 && mobile.length < 10) {
        rowErrors.push(language === 'hi' ? `अमान्य मोबाइल नंबर (${mobile}): कम से कम 10 अंक होने चाहिए` : `Invalid mobile (${mobile}): must be 10 digits`);
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
        const resolvedVId = resolveVillageId(village, villageRecords);
        if (!isAdmin) {
          // Regular user MUST only import into their assigned villages!
          const userVIds = (assignedVillageIds && assignedVillageIds.length > 0)
            ? assignedVillageIds
            : assignedVillages.map(v => resolveVillageId(v, villageRecords)).filter(Boolean);
          const isAssigned = (resolvedVId && userVIds.includes(resolvedVId)) || assignedVillages.some(v => v.toLowerCase() === village.toLowerCase());
          if (!isAssigned) {
            rowErrors.push(
              language === 'hi'
                ? `गाँव "${village}" आपके आवंटित गाँवों (${assignedVillages.join(', ')}) में शामिल नहीं है`
                : `Village "${village}" is not in your assigned villages (${assignedVillages.join(', ')})`
            );
          }
        } else {
          // Admin must provide an existing system village
          const exists = resolvedVId || villages.some(v => v.toLowerCase() === village.toLowerCase());
          if (!exists) {
            rowErrors.push(
              language === 'hi'
                ? `गाँव "${village}" पंजीकृत गाँवों में नहीं मिला`
                : `Village "${village}" is not a registered village`
            );
          }
        }
      }

      // Parse nested members array or flat columns (Member 1 ... Member 10)
      let members = [];
      if (Array.isArray(row.members) && row.members.length > 0) {
        members = row.members.map((m, mIdx) => {
          const mName = m.name || m.nameEnglish || m.nameHindi || m['Member Name'] || m['सदस्य नाम'] || (mIdx === 0 ? headName : `सदस्य ${mIdx + 1}`);
          const mAge = parseInt(m.age || m['Age'] || m['आयु'] || '30', 10);
          const mGender = String(m.gender || m['Gender'] || m['लिंग'] || 'Male');
          const mRelation = m.relation || m['Relation'] || m['संबंध'] || (mIdx === 0 ? 'Head' : 'Member');
          return {
            id: m.id || mIdx + 1,
            name: mName,
            nameEnglish: m.nameEnglish || mName,
            nameHindi: m.nameHindi || mName,
            age: isNaN(mAge) ? 30 : mAge,
            gender: mGender.toLowerCase().startsWith('f') || mGender.includes('महिला') || mGender.includes('स्त्री') ? 'Female' : 'Male',
            relation: mRelation,
            aadhaarNumber: m.aadhaarNumber || m.aadhaar || '',
            occupation: m.occupation || '',
            education: m.education || '',
            maritalStatus: m.maritalStatus || 'Married'
          };
        });
      } else {
        // Flat columns Member 1 Name ... Member 10 Name
        for (let m = 1; m <= 10; m++) {
          const mName = getValue(row, [`Member ${m} Name`, `Member${m}Name`, `member_${m}_name`, `सदस्य ${m} नाम`]);
          if (mName) {
            const mAge = parseInt(getValue(row, [`Member ${m} Age`, `Member${m}Age`, `member_${m}_age`, `सदस्य ${m} आयु`]) || '30', 10);
            const mGender = getValue(row, [`Member ${m} Gender`, `Member${m}Gender`, `member_${m}_gender`, `सदस्य ${m} लिंग`]) || 'Male';
            const mRelation = getValue(row, [`Member ${m} Relation`, `Member${m}Relation`, `member_${m}_relation`, `सदस्य ${m} संबंध`]) || (m === 1 ? 'Head' : 'Member');
            members.push({
              id: m,
              name: mName,
              nameEnglish: mName,
              nameHindi: mName,
              age: isNaN(mAge) ? 30 : mAge,
              gender: mGender.toLowerCase().startsWith('f') || mGender.includes('महिला') ? 'Female' : 'Male',
              relation: mRelation,
              aadhaarNumber: '',
              occupation: '',
              education: '',
              maritalStatus: 'Married'
            });
          }
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
        id: row.id ? String(row.id).trim() : undefined,
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
        surveyorId: row.surveyorId || currentUser?.uid || '',
        surveyorName: row.surveyorName || userProfile?.name || currentUser?.email?.split('@')[0] || 'User',
        surveyorEmail: row.surveyorEmail || currentUser?.email || '',
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
      if (mobile && mobile.length >= 10) {
        if (seenMobilesInFile.has(mobile)) {
          duplicates.push({
            ...parsedItem,
            status: 'duplicate',
            errorReason: language === 'hi' ? `फाइल में मोबाइल ${mobile} पहले भी आ चुका है` : `Duplicate mobile ${mobile} inside file`
          });
          return;
        }
        seenMobilesInFile.add(mobile);
      }

      if (aadhaarNumber && seenAadhaarsInFile.has(aadhaarNumber)) {
        duplicates.push({
          ...parsedItem,
          status: 'duplicate',
          errorReason: language === 'hi' ? `फाइल में आधार ${aadhaarNumber} पहले भी आ चुका है` : `Duplicate Aadhaar ${aadhaarNumber} inside file`
        });
        return;
      }
      if (aadhaarNumber) seenAadhaarsInFile.add(aadhaarNumber);

      // 5. Duplicate Check: Database existing family (Skip if in Clean Replace mode)
      if (!isReplace) {
        if (mobile && mobile.length >= 10) {
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
  };

  // Handle Excel or JSON file upload
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // File validation: Size <= 15MB
    if (selected.size > 15 * 1024 * 1024) {
      setFileError(language === 'hi' ? 'फाइल का आकार 15MB से कम होना चाहिए।' : 'File size exceeds 15MB limit.');
      return;
    }

    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv', 'json'].includes(ext)) {
      setFileError(language === 'hi' ? 'केवल .xlsx, .xls, .csv या .json फाइल समर्थित है।' : 'Only .xlsx, .xls, .csv, or .json files are supported.');
      return;
    }

    setFile(selected);
    setIsProcessing(true);
    setFileError('');
    setImportSummary(null);

    if (ext === 'json') {
      const textReader = new FileReader();
      textReader.onload = (evt) => {
        try {
          const content = evt.target?.result;
          const parsed = JSON.parse(content);
          let rawList = [];
          if (Array.isArray(parsed)) {
            rawList = parsed;
          } else if (parsed && Array.isArray(parsed.families)) {
            rawList = parsed.families;
          } else if (parsed && Array.isArray(parsed.surveyData)) {
            rawList = parsed.surveyData;
          } else if (parsed && Array.isArray(parsed.data)) {
            rawList = parsed.data;
          } else if (parsed && typeof parsed === 'object') {
            rawList = [parsed];
          }

          processRows(rawList);
        } catch (err) {
          console.error('Failed to parse JSON file:', err);
          setFileError(language === 'hi' ? 'JSON फाइल पढ़ने में त्रुटि हुई। कृपया सही JSON फॉर्मेट जांचें।' : 'Failed to parse JSON file. Please ensure valid JSON format.');
        } finally {
          setIsProcessing(false);
        }
      };
      textReader.onerror = () => {
        setFileError(language === 'hi' ? 'फाइल पढ़ने में त्रुटि हुई।' : 'Error reading file.');
        setIsProcessing(false);
      };
      textReader.readAsText(selected, 'UTF-8');
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rawJson = XLSX.utils.sheet_to_json(sheet);
          processRows(rawJson);
        } catch (err) {
          console.error('Failed to parse excel:', err);
          setFileError(language === 'hi' ? 'एक्सेल फाइल पढ़ने में त्रुटि हुई। कृपया सैंपल फॉर्मेट का उपयोग करें।' : 'Failed to parse Excel file. Please ensure it matches template.');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setFileError(language === 'hi' ? 'फाइल पढ़ने में त्रुटि हुई।' : 'Error reading file.');
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(selected);
    }
  };

  // Handle pasted JSON text parse
  const handleParsePastedJson = () => {
    if (!jsonPasteText.trim()) {
      setFileError(language === 'hi' ? 'कृपया JSON डेटा पेस्ट करें।' : 'Please paste JSON text first.');
      return;
    }
    setIsProcessing(true);
    setFileError('');
    setImportSummary(null);
    setFile({ name: 'pasted_survey_data.json', size: new Blob([jsonPasteText]).size });

    try {
      let cleaned = jsonPasteText.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }
      const parsed = JSON.parse(cleaned);
      let rawList = [];
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (parsed && Array.isArray(parsed.families)) {
        rawList = parsed.families;
      } else if (parsed && Array.isArray(parsed.surveyData)) {
        rawList = parsed.surveyData;
      } else if (parsed && Array.isArray(parsed.data)) {
        rawList = parsed.data;
      } else if (parsed && typeof parsed === 'object') {
        rawList = [parsed];
      }

      if (!rawList || rawList.length === 0) {
        setFileError(language === 'hi' ? 'पेस्ट किए गए JSON में परिवारों की कोई सूची नहीं मिली।' : 'No families array found in pasted JSON.');
        setIsProcessing(false);
        return;
      }

      processRows(rawList);
    } catch (err) {
      console.error('Failed to parse pasted JSON:', err);
      setFileError(language === 'hi' ? 'JSON फॉर्मेट अमान्य है। कृपया पूरा और सही JSON पेस्ट करें।' : 'Invalid JSON format. Please verify and paste complete JSON.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Clean Replace mode and immediately re-evaluate rows
  const handleToggleReplaceAll = (checked) => {
    setReplaceAllExisting(checked);
    if (rawLoadedRows && rawLoadedRows.length > 0) {
      processRows(rawLoadedRows, checked);
    }
  };

  // Reset file/text state
  const handleReset = () => {
    setFile(null);
    setRawLoadedRows(null);
    setReplaceAllExisting(false);
    setParsedRows([]);
    setValidRows([]);
    setDuplicateRows([]);
    setErrorRows([]);
    setFileError('');
    setImportSummary(null);
    setJsonPasteText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    XLSX.writeFile(workbook, `VillagePulse_Import_Errors_${new Date().toISOString().split('T')[0]}.xlsx`);
    addToast(language === 'hi' ? 'त्रुटि रिपोर्ट (.xlsx) डाउनलोड हो गई!' : 'Error report (.xlsx) downloaded!', 'success');
  };

  // Perform bulk import for valid rows
  const handleImportNow = async () => {
    if (validRows.length === 0) return;
    setIsImporting(true);
    try {
      await bulkAddFamilies(validRows, { replaceAll: replaceAllExisting });
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
                {language === 'hi' ? 'बल्क डेटा इम्पोर्ट (Excel / CSV / JSON)' : 'Bulk Family Data Import (Excel / CSV / JSON)'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isAdmin
                  ? (language === 'hi' ? 'एडमिन: सभी गाँवों का डेटा Excel या JSON से इम्पोर्ट करें' : 'Admin: Import records for any registered village from Excel or JSON')
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
          {/* Step 1: Download Sample Templates */}
          <div className="p-5 rounded-2xl border bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/60 dark:border-blue-900/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-sm text-blue-950 dark:text-blue-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  {language === 'hi' ? 'मानक टेम्पलेट डाउनलोड करें (वैकल्पिक)' : 'Download Standard Sample Template'}
                </h3>
                <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-1">
                  {language === 'hi'
                    ? 'गाँव, मुखिया, मोबाइल (10 अंक), जाति, श्रेणी और परिवार के सदस्यों का फॉर्मेट देखने के लिए टेम्पलेट डाउनलोड करें।'
                    : 'Pre-formatted columns or nested structure with village, head, mobile, caste, category, and members.'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'एक्सेल (.xlsx)' : 'Excel (.xlsx)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJsonTemplate}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'JSON (.json)' : 'JSON (.json)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          {!importSummary && parsedRows.length === 0 && (
            <div className="flex border-b border-gray-200 dark:border-gray-800 gap-6">
              <button
                type="button"
                onClick={() => setImportMode('file')}
                className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  importMode === 'file'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{language === 'hi' ? 'फाइल अपलोड (.xlsx / .csv / .json)' : 'Upload File (.xlsx / .csv / .json)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMode('paste')}
                className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  importMode === 'paste'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>{language === 'hi' ? 'सीधे JSON टेक्स्ट पेस्ट करें' : 'Paste Raw JSON'}</span>
              </button>
            </div>
          )}

          {/* Step 2: Upload Area or JSON Paste Area */}
          {!importSummary && parsedRows.length === 0 && (
            <div>
              {importMode === 'file' ? (
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                    {language === 'hi' ? 'एक्सेल या JSON फाइल अपलोड करें' : 'Upload Excel or JSON File'}
                  </h3>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 md:p-8 border-2 border-dashed rounded-3xl cursor-pointer text-center transition-all border-gray-300 dark:border-gray-700 hover:border-green-500 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv, .json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                          {language === 'hi' ? 'फाइल यहाँ ड्रॉप करें या ब्राउज करें' : 'Drop Excel or JSON file here or browse'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, .csv or .json (Max 15MB)</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                    {language === 'hi' ? 'Gemini / AI से प्राप्त JSON टेक्स्ट यहाँ पेस्ट करें' : 'Paste Raw JSON from Gemini / AI'}
                  </h3>
                  <textarea
                    rows={8}
                    value={jsonPasteText}
                    onChange={(e) => setJsonPasteText(e.target.value)}
                    placeholder={language === 'hi' 
                      ? 'यहाँ 142 परिवारों का पूरा JSON डेटा पेस्ट करें (उदा. [ { "familyHeadName": "...", "mobile": "...", "members": [...] } ])' 
                      : 'Paste complete JSON array or object here...'}
                    className={`w-full p-4 rounded-2xl font-mono text-xs border outline-none transition-all ${
                      darkMode ? 'bg-gray-950 border-gray-800 text-gray-200 focus:border-indigo-500' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-indigo-500'
                    }`}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParsePastedJson}
                      disabled={!jsonPasteText.trim() || isProcessing}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{language === 'hi' ? 'डेटा पार्स और प्रीव्यू करें' : 'Parse & Preview Data'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing Spinner */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-3 p-6 text-sm text-gray-500">
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <span>{language === 'hi' ? 'डेटा और वैधता की जाँच हो रही है...' : 'Validating survey records and checking duplicates...'}</span>
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
            <div className="p-5 rounded-2xl border border-green-500/30 bg-green-50/50 dark:bg-green-950/20 space-y-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>{language === 'hi' ? 'इम्पोर्ट प्रक्रिया पूर्ण हुई!' : 'Import Completed Successfully!'}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <p className="text-xl font-bold text-green-600">{importSummary.successCount}</p>
                  <p className="text-gray-500">{language === 'hi' ? 'सफलतापूर्वक जोड़े गए' : 'Imported'}</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <p className="text-xl font-bold text-amber-500">{importSummary.duplicateCount}</p>
                  <p className="text-gray-500">{language === 'hi' ? 'डुप्लीकेट छोड़े गए' : 'Duplicates Skipped'}</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <p className="text-xl font-bold text-red-500">{importSummary.errorCount}</p>
                  <p className="text-gray-500">{language === 'hi' ? 'अमान्य पंक्तियाँ' : 'Invalid Rows'}</p>
                </div>
              </div>
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-semibold rounded-xl transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'और डेटा इम्पोर्ट करें' : 'Import More Data'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Preview Stats & Tabs */}
          {parsedRows.length > 0 && !importSummary && (
            <div className="space-y-4">
              {/* Header with Selected File and Reset Button */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {file?.name || 'Survey_Data.json'}
                  </span>
                  <span className="text-gray-400">
                    ({parsedRows.length} {language === 'hi' ? 'परिवार पढ़े गए' : 'families parsed'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all font-semibold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{language === 'hi' ? 'बदलें / रीसेट' : 'Change / Reset'}</span>
                </button>
              </div>

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

              {/* Clean Replace Toggle */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs">
                <input
                  type="checkbox"
                  id="replace-all-checkbox"
                  checked={replaceAllExisting}
                  onChange={(e) => handleToggleReplaceAll(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-indigo-600 rounded cursor-pointer shrink-0"
                />
                <label htmlFor="replace-all-checkbox" className="cursor-pointer text-gray-800 dark:text-gray-200 flex-1">
                  <span className="font-bold text-indigo-900 dark:text-indigo-300">
                    {language === 'hi'
                      ? 'पुराना डुप्लीकेट डेटा साफ़ करके केवल यह डेटा लोड करें (Clean Replace)'
                      : 'Wipe old duplicate records and load only this dataset (Clean Replace)'}
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {language === 'hi'
                      ? 'यदि पहले 192 या टेस्ट रिकॉर्ड दिख रहे हैं, तो इसे चुनें ताकि पुराने डुप्लीकेट हट जाएं और केवल यह स्वच्छ सूची रहे।'
                      : 'Enable this if previous duplicate or test families exist, to establish an exact clean count.'}
                  </p>
                </label>
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
