import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAZSeoTYuU-ue4UO0JYcC9Z4SkqikqtfoQ",
  authDomain: "gram-survey.firebaseapp.com",
  projectId: "gram-survey",
  storageBucket: "gram-survey.firebasestorage.app",
  messagingSenderId: "218966954015",
  appId: "1:218966954015:web:f5f8f2eddaa93706e0c52a",
  measurementId: "G-X5JKNPHE1Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Helper to extract bilingual name parts: "English Name (हिन्दी नाम)"
function extractBilingualNames(rawName) {
  if (!rawName) return { full: '', en: '', hi: '' };
  const str = String(rawName).trim();
  if (str.includes('(') && str.includes(')')) {
    const en = str.split('(')[0].trim();
    const hiMatch = str.match(/\((.*?)\)/);
    const hi = hiMatch ? hiMatch[1].trim() : en;
    return { full: str, en: en || str, hi: hi || str };
  }
  return { full: str, en: str, hi: str };
}

// Helper to extract integer age from formats like "59 (DOB: 03-05-1967)"
function extractAge(rawAge) {
  if (rawAge === undefined || rawAge === null || rawAge === '') return 30;
  const match = String(rawAge).match(/\d+/);
  return match ? parseInt(match[0], 10) : 30;
}

async function main() {
  console.log('==================================================');
  console.log('  VillagePulse Survey JSON Importer');
  console.log('==================================================\n');

  const targetPath = process.argv[2] || path.resolve(process.cwd(), 'VillagePulse_Survey_Nested.json');
  const email = process.argv[3];
  const password = process.argv[4];

  if (!fs.existsSync(targetPath)) {
    console.error(`[X] File not found: ${targetPath}`);
    console.log('\n[!] निर्देश:');
    console.log('1. कृपया Gemini से 142 परिवारों का JSON डेटा कॉपी करें।');
    console.log('2. उसे इस प्रोजेक्ट फोल्डर में "VillagePulse_Survey_Nested.json" नाम से सेव करें।');
    console.log('3. या फिर आप सीधे VillagePulse वेबसाइट में "Import" बटन पर क्लिक करके JSON फाइल अपलोड या सीधे पेस्ट कर सकते हैं!\n');
    process.exit(1);
  }

  if (email && password) {
    console.log(`[+] Authenticating as ${email}...`);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log(`[✓] Authenticated successfully!\n`);
    } catch (authErr) {
      console.error(`[X] Authentication failed:`, authErr.message);
      process.exit(1);
    }
  } else {
    console.log('[!] Tip: For Firestore writes, you can either:');
    console.log('    1. (Best & Easiest) Import directly in the VillagePulse Web App via the "Import" button.');
    console.log('    2. Or provide your admin login: node import_json_data.mjs [file] [email] [password]\n');
  }

  console.log(`[+] Reading JSON file: ${targetPath}...`);
  const rawContent = fs.readFileSync(targetPath, 'utf-8');
  let data;
  try {
    data = JSON.parse(rawContent);
  } catch (err) {
    console.error(`[X] Error parsing JSON:`, err.message);
    process.exit(1);
  }

  let families = [];
  if (Array.isArray(data)) {
    families = data;
  } else if (data && Array.isArray(data.families)) {
    families = data.families;
  } else if (data && Array.isArray(data.surveyData)) {
    families = data.surveyData;
  } else if (data && Array.isArray(data.data)) {
    families = data.data;
  } else if (data && typeof data === 'object') {
    families = [data];
  }

  console.log(`[+] Found ${families.length} families in JSON.`);
  if (families.length === 0) {
    console.log('[!] No family records to import.');
    process.exit(0);
  }

  // Fetch existing families to find max ID
  console.log('[+] Checking existing database records for ID sequencing...');
  let currentMax = 0;
  const existingMap = new Map();
  try {
    const existingSnap = await getDocs(collection(db, 'families'));
    existingSnap.forEach(d => {
      const dat = d.data();
      existingMap.set(d.id, dat);
      const match = d.id && String(d.id).match(/FAM-(\d+)/);
      if (match) {
        currentMax = Math.max(currentMax, parseInt(match[1], 10));
      }
    });
    console.log(`[+] Existing database records: ${existingMap.size}, Maximum ID: FAM-${String(currentMax).padStart(4, '0')}`);
  } catch (err) {
    console.log('[!] Notice: Could not read existing ID sequence, starting sequence from 1:', err.message);
  }

  const defaultVillage = 'समोड़ी (Samodi)';
  const preparedFamilies = families.map((fam, idx) => {
    let famId = fam.id;
    if (!famId || !String(famId).startsWith('FAM-')) {
      currentMax += 1;
      famId = `FAM-${String(currentMax).padStart(4, '0')}`;
    }

    const rawHead = fam.familyHeadName || fam['Family Head Name'] || fam.headName || fam.name || `मुखिया ${idx + 1}`;
    const headNames = extractBilingualNames(rawHead);

    const rawFather = fam.fatherName || fam['Father or Husband Name'] || fam.father_name || '';
    const fatherNames = extractBilingualNames(rawFather);

    let mobile = String(fam.mobile || fam['Mobile Number'] || fam.phone || '').replace(/[^0-9]/g, '');
    if (mobile.startsWith('91') && mobile.length === 12) mobile = mobile.slice(2);
    if (mobile.startsWith('0') && mobile.length === 11) mobile = mobile.slice(1);
    if (mobile.length > 10 && (mobile.startsWith('7') || mobile.startsWith('8') || mobile.startsWith('9'))) {
      mobile = mobile.slice(0, 10);
    }

    const village = fam.village || fam['Village Name'] || defaultVillage;

    let members = [];
    if (Array.isArray(fam.members) && fam.members.length > 0) {
      members = fam.members.map((m, mIdx) => {
        const rawMName = m.name || m.nameHindi || m.nameEnglish || (mIdx === 0 ? rawHead : `सदस्य ${mIdx + 1}`);
        const mNames = extractBilingualNames(rawMName);
        const ageVal = extractAge(m.age);
        const genderStr = String(m.gender || 'Male');
        const isFemale = genderStr.toLowerCase().startsWith('f') || genderStr.includes('महिला') || genderStr.includes('स्त्री');
        return {
          id: m.id || mIdx + 1,
          name: mNames.full,
          nameEnglish: mNames.en,
          nameHindi: mNames.hi,
          age: ageVal,
          gender: isFemale ? 'Female' : 'Male',
          relation: m.relation || (mIdx === 0 ? 'Head' : 'Member'),
          aadhaarNumber: m.aadhaarNumber || m.aadhaar || '',
          occupation: m.occupation || '',
          education: m.education || '',
          maritalStatus: m.maritalStatus || 'Married'
        };
      });
    } else {
      members = [{
        id: 1,
        name: headNames.full,
        nameEnglish: headNames.en,
        nameHindi: headNames.hi,
        age: 40,
        gender: 'Male',
        relation: 'Head',
        aadhaarNumber: fam.aadhaarNumber || '',
        occupation: 'Agriculture',
        education: 'Secondary',
        maritalStatus: 'Married'
      }];
    }

    return {
      id: famId,
      familyHeadName: headNames.full,
      familyHeadNameEnglish: headNames.en,
      familyHeadNameHindi: headNames.hi,
      fatherName: fatherNames.full,
      fatherNameEnglish: fatherNames.en,
      fatherNameHindi: fatherNames.hi,
      mobile: mobile,
      alternateMobile: fam.alternateMobile || '',
      village: 'समोड़ी (Samodi)',
      villageId: 'samodi',
      mohalla: fam.mohalla || 'Regar Mohalla',
      caste: fam.caste || 'Regar',
      category: fam.category || 'APL',
      houseNumber: fam.houseNumber || '',
      address: fam.address || '',
      pinCode: fam.pinCode || '302001',
      aadhaarNumber: fam.aadhaarNumber || fam.aadhaar || '',
      janAadhaarNumber: fam.janAadhaarNumber || fam.janAadhaar || '',
      rationCardNumber: fam.rationCardNumber || fam.rationCard || '',
      voterId: fam.voterId || '',
      bankName: fam.bankName || '',
      branch: fam.branch || '',
      accountHolder: fam.accountHolder || headNames.full,
      accountNumber: fam.accountNumber || '',
      ifsc: fam.ifsc || '',
      houseType: fam.houseType || 'Pucca',
      electricityConnection: Boolean(fam.electricityConnection ?? true),
      waterTapConnection: Boolean(fam.waterTapConnection ?? true),
      toiletAvailable: Boolean(fam.toiletAvailable ?? true),
      gasConnection: Boolean(fam.gasConnection ?? true),
      members: members,
      surveyorId: fam.surveyorId || 'system_bulk_import',
      surveyorName: fam.surveyorName || 'Surveyor',
      surveyorEmail: fam.surveyorEmail || '',
      createdBy: fam.createdBy || 'system_bulk_import',
      createdAt: fam.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  console.log(`[+] Prepared ${preparedFamilies.length} families. Beginning Firestore batch import...`);

  const chunkSize = 400;
  for (let i = 0; i < preparedFamilies.length; i += chunkSize) {
    const chunk = preparedFamilies.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(f => {
      const ref = doc(db, 'families', f.id);
      batch.set(ref, f);
    });
    await batch.commit();
    console.log(`[✓] Batch committed: ${i + 1} to ${i + chunk.length} families.`);
  }

  console.log('\n==================================================');
  console.log(`  🎉 SUCCESS! All ${preparedFamilies.length} families imported successfully into Firestore!`);
  console.log('==================================================\n');
  process.exit(0);
}

main().catch(err => {
  console.error('[X] Unhandled Error:', err);
  process.exit(1);
});
