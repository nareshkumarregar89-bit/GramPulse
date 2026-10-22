import { transliterateToHindi, isHindiText } from './transliteration';

/**
 * Clean care-of string (e.g., "S/O: Mohan Lal" -> "Mohan Lal")
 */
function cleanFatherName(co) {
  if (!co) return '';
  return co
    .replace(/^(S\/O|D\/O|W\/O|C\/O|H\/O|S\/o|D\/o|W\/o|C\/o|H\/o|SO|DO|WO|CO|HO)[:\s-]*/i, '')
    .trim();
}

/**
 * Format DOB or YOB into calculated Age and standard Date format
 */
function parseAgeAndDob(dobStr, yobStr) {
  let age = null;
  let formattedDob = '';

  const currentYear = new Date().getFullYear();

  if (dobStr) {
    formattedDob = dobStr.trim();
    // Common formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    const parts = dobStr.split(/[-/]/);
    if (parts.length === 3) {
      let year = null;
      if (parts[2].length === 4) {
        year = parseInt(parts[2], 10);
      } else if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
      }
      if (year && year > 1900 && year <= currentYear) {
        age = currentYear - year;
      }
    }
  }

  if (age === null && yobStr) {
    const yob = parseInt(yobStr, 10);
    if (yob && yob > 1900 && yob <= currentYear) {
      age = currentYear - yob;
      if (!formattedDob) formattedDob = `01/01/${yob}`;
    }
  }

  return { age, dob: formattedDob };
}

/**
 * Parse XML Aadhaar QR Code (<PrintLetterBarcodeData ... />)
 */
function parseAadhaarXml(rawXml) {
  if (!rawXml.includes('PrintLetterBarcodeData') && !rawXml.includes('uid=')) {
    return null;
  }

  const getAttr = (attr) => {
    // Matches attr="value" or attr='value'
    const regex = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i');
    const match = rawXml.match(regex);
    return match ? match[1].trim() : '';
  };

  const uid = getAttr('uid');
  const name = getAttr('name');
  const genderCode = getAttr('gender');
  const yob = getAttr('yob');
  const dob = getAttr('dob');
  const co = getAttr('co');
  const house = getAttr('house');
  const street = getAttr('street');
  const lm = getAttr('lm'); // Landmark
  const loc = getAttr('loc'); // Locality
  const vtc = getAttr('vtc'); // Village / Town / City
  const po = getAttr('po'); // Post Office
  const dist = getAttr('dist'); // District
  const subdist = getAttr('subdist');
  const state = getAttr('state');
  const pc = getAttr('pc'); // Pin Code

  let gender = 'Male';
  if (genderCode.toUpperCase() === 'F' || genderCode.toLowerCase().startsWith('fem')) {
    gender = 'Female';
  }

  const fatherName = cleanFatherName(co);
  const { age, dob: parsedDob } = parseAgeAndDob(dob, yob);

  // Address components
  const addrParts = [house, street, lm, loc, vtc, po, dist, state].filter(Boolean);
  const address = addrParts.join(', ');

  const nameEn = name;
  const nameHi = isHindiText(name) ? name : transliterateToHindi(name);
  const fatherHi = fatherName ? (isHindiText(fatherName) ? fatherName : transliterateToHindi(fatherName)) : '';

  return {
    sourceType: 'AADHAAR_XML',
    aadhaarNumber: uid ? uid.replace(/\s+/g, '') : '',
    familyHeadName: nameEn,
    familyHeadNameEnglish: nameEn,
    familyHeadNameHindi: nameHi,
    fatherName: fatherName,
    fatherNameEnglish: fatherName,
    fatherNameHindi: fatherHi,
    gender,
    age: age || '',
    dob: parsedDob,
    pinCode: pc,
    address,
    villageCandidate: vtc || loc || ''
  };
}

/**
 * Parse JSON formatted QR Code
 */
function parseJsonQr(rawStr) {
  try {
    const data = JSON.parse(rawStr);
    if (!data || typeof data !== 'object') return null;

    const uid = data.uid || data.aadhaar || data.aadhaarNumber || data.aadhar || '';
    const name = data.name || data.headName || data.familyHeadName || '';
    const father = data.fatherName || data.father || cleanFatherName(data.co || '');
    const mobile = data.mobile || data.phone || '';
    const janAadhaar = data.janAadhaar || data.janAadhaarNumber || '';
    const pinCode = data.pinCode || data.pincode || data.pc || '';
    const genderStr = String(data.gender || 'Male');
    const gender = genderStr.toLowerCase().startsWith('f') ? 'Female' : 'Male';
    const age = data.age || parseAgeAndDob(data.dob, data.yob).age || '';

    const nameEn = name;
    const nameHi = isHindiText(name) ? name : transliterateToHindi(name);
    const fatherHi = father ? (isHindiText(father) ? father : transliterateToHindi(father)) : '';

    return {
      sourceType: 'JSON',
      aadhaarNumber: String(uid).replace(/\s+/g, ''),
      janAadhaarNumber: String(janAadhaar).replace(/\s+/g, ''),
      familyHeadName: nameEn,
      familyHeadNameEnglish: nameEn,
      familyHeadNameHindi: nameHi,
      fatherName: father,
      fatherNameEnglish: father,
      fatherNameHindi: fatherHi,
      mobile: String(mobile).replace(/[^0-9]/g, '').slice(-10),
      gender,
      age: age || '',
      pinCode: String(pinCode).trim(),
      address: data.address || '',
      mohalla: data.mohalla || '',
      caste: data.caste || '',
      villageCandidate: data.village || data.vtc || ''
    };
  } catch (e) {
    return null;
  }
}

/**
 * Parse Jan-Aadhaar QR Code or direct Jan-Aadhaar 10-digit number
 */
function parseJanAadhaar(rawStr) {
  // Check for Jan-Aadhaar URL pattern or keyword
  if (rawStr.includes('janaadhaar') || rawStr.includes('jan-aadhaar') || rawStr.includes('जन-आधार')) {
    // Extract 10-digit number
    const match = rawStr.match(/\b\d{10}\b/);
    if (match) {
      return {
        sourceType: 'JAN_AADHAAR',
        janAadhaarNumber: match[0]
      };
    }
  }

  // Pure 10-digit number
  const trimmed = rawStr.trim();
  if (/^\d{10}$/.test(trimmed)) {
    return {
      sourceType: 'JAN_AADHAAR',
      janAadhaarNumber: trimmed
    };
  }

  // Pure 12-digit number (Raw Aadhaar)
  if (/^\d{12}$/.test(trimmed)) {
    return {
      sourceType: 'RAW_AADHAAR',
      aadhaarNumber: trimmed
    };
  }

  return null;
}

/**
 * Universal QR Code Parser for Village Survey Documents
 */
export function parseSurveyDocumentQr(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  const trimmed = rawText.trim();

  // 1. Try XML Aadhaar format
  const xmlResult = parseAadhaarXml(trimmed);
  if (xmlResult) return xmlResult;

  // 2. Try JSON format
  const jsonResult = parseJsonQr(trimmed);
  if (jsonResult) return jsonResult;

  // 3. Try Jan-Aadhaar or Raw Numbers
  const janResult = parseJanAadhaar(trimmed);
  if (janResult) return janResult;

  // 4. Fallback line-by-line key:value pairs
  const lines = trimmed.split(/[\r\n]+/);
  if (lines.length > 1) {
    const extracted = {};
    lines.forEach(line => {
      const parts = line.split(/[:=-]/);
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase();
        const val = parts.slice(1).join(':').trim();
        if (key.includes('name') || key.includes('नाम')) extracted.name = val;
        if (key.includes('father') || key.includes('पिता')) extracted.father = val;
        if (key.includes('aadhaar') || key.includes('आधार')) extracted.uid = val.replace(/[^0-9]/g, '');
        if (key.includes('jan') || key.includes('जन')) extracted.janAadhaar = val.replace(/[^0-9]/g, '');
        if (key.includes('mobile') || key.includes('फोन')) extracted.mobile = val.replace(/[^0-9]/g, '').slice(-10);
        if (key.includes('age') || key.includes('उम्र')) extracted.age = parseInt(val, 10);
        if (key.includes('gender') || key.includes('लिंग')) extracted.gender = val.toLowerCase().includes('fem') || val.includes('महिला') ? 'Female' : 'Male';
      }
    });

    if (Object.keys(extracted).length > 0) {
      const name = extracted.name || '';
      return {
        sourceType: 'TEXT_KV',
        familyHeadName: name,
        familyHeadNameEnglish: name,
        familyHeadNameHindi: isHindiText(name) ? name : transliterateToHindi(name),
        fatherName: extracted.father || '',
        aadhaarNumber: extracted.uid || '',
        janAadhaarNumber: extracted.janAadhaar || '',
        mobile: extracted.mobile || '',
        gender: extracted.gender || 'Male',
        age: extracted.age || ''
      };
    }
  }

  return null;
}
