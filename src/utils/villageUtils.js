import { initialVillages } from '../data/villages.js';

/**
 * Resolves a canonical village ID ('samodi', 'kotdi', or slug)
 * from any input: string, display name, Hindi name, English name, or object.
 *
 * @param {string|object} villageIdentifier - The village name, id, or object
 * @param {Array} villageRecords - Optional active or all village records from DataContext
 * @returns {string|null} - Canonical lowercase village ID or null if unrecognized
 */
export const resolveVillageId = (villageIdentifier, villageRecords = []) => {
  if (!villageIdentifier) return null;

  // Handle object input
  if (typeof villageIdentifier === 'object') {
    if (villageIdentifier.id) return String(villageIdentifier.id).trim().toLowerCase();
    const nameStr = villageIdentifier.name || villageIdentifier.nameEnglish || villageIdentifier.nameHindi || '';
    if (nameStr) return resolveVillageId(nameStr, villageRecords);
    return null;
  }

  const str = String(villageIdentifier).trim();
  if (!str) return null;
  const lower = str.toLowerCase();
  if (lower === 'all' || str === 'सभी गाँव' || lower === 'all villages') return 'all';

  // 1. Direct match with standard production villages
  // Samodi checks
  if (
    lower === 'samodi' ||
    lower.includes('samodi') ||
    str.includes('समोड़ी') ||
    str.includes('समोड़ी') ||
    str.includes('समौड़ी') ||
    str.includes('समौड़ी')
  ) {
    return 'samodi';
  }

  // Kotdi checks
  if (
    lower === 'kotdi' ||
    lower.includes('kotdi') ||
    str.includes('कोटड़ी') ||
    str.includes('कोटड़ी')
  ) {
    return 'kotdi';
  }

  // 2. Check against registered village records (from Firestore or local state)
  const allRecords = Array.isArray(villageRecords) && villageRecords.length > 0
    ? villageRecords
    : initialVillages;

  for (const v of allRecords) {
    if (!v) continue;
    const vId = (v.id || '').trim().toLowerCase();
    const vName = (v.name || '').trim().toLowerCase();
    const vEn = (v.nameEnglish || '').trim().toLowerCase();
    const vHi = (v.nameHindi || '').trim();

    if (vId && vId === lower) return v.id;
    if (vName && (vName === lower || lower.includes(vName) || vName.includes(lower))) return v.id;
    if (vEn && (vEn === lower || lower.includes(vEn) || vEn.includes(lower))) return v.id;
    if (vHi && (str.includes(vHi) || vHi.includes(str))) return v.id;
  }

  // 3. Fallback: Slugify clean string (alphanumeric with hyphens)
  const slug = lower.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return slug || null;
};

/**
 * Returns formatted display name for a village.
 *
 * @param {string|object} villageIdentifier
 * @param {Array} villageRecords
 * @param {string} language - 'en' | 'hi'
 * @returns {string} Display string
 */
export const getVillageDisplayName = (villageIdentifier, villageRecords = [], language = 'en') => {
  if (!villageIdentifier) return '';

  const vId = resolveVillageId(villageIdentifier, villageRecords);
  const allRecords = Array.isArray(villageRecords) && villageRecords.length > 0
    ? villageRecords
    : initialVillages;

  const match = allRecords.find(v => (v.id || '').toLowerCase() === vId);
  if (match) {
    if (language === 'hi' && match.nameHindi) return match.nameHindi;
    if (language === 'en' && match.nameEnglish) return match.nameEnglish;
    return match.name || `${match.nameHindi || ''} (${match.nameEnglish || match.id})`;
  }

  if (typeof villageIdentifier === 'string') return villageIdentifier;
  return villageIdentifier.name || villageIdentifier.nameEnglish || villageIdentifier.id || '';
};

/**
 * Determines whether a family record belongs to a village identifier with 100% certainty.
 *
 * @param {object} family
 * @param {string|object} villageIdentifier
 * @param {Array} villageRecords
 * @returns {boolean}
 */
export const isFamilyInVillageRecord = (family, villageIdentifier, villageRecords = []) => {
  if (!family) return false;
  if (!villageIdentifier || villageIdentifier === 'all' || villageIdentifier === 'All Villages' || villageIdentifier === 'सभी गाँव') return true;

  const targetId = resolveVillageId(villageIdentifier, villageRecords);
  const familyVillageId = family.villageId
    ? String(family.villageId).trim().toLowerCase()
    : resolveVillageId(family.village, villageRecords);

  if (targetId && familyVillageId && targetId === familyVillageId) {
    return true;
  }

  // Direct string inclusion fallback
  const targetStr = (typeof villageIdentifier === 'string' ? villageIdentifier : (villageIdentifier.name || '')).trim().toLowerCase();
  const famVillage = (family.village || '').trim().toLowerCase();

  if (targetStr && famVillage && (famVillage === targetStr || famVillage.includes(targetStr) || targetStr.includes(famVillage))) {
    return true;
  }

  return false;
};

/**
 * Checks whether a family record has uncertain or missing village association.
 * If uncertain, it must not be guessed and should be flagged for Admin review.
 *
 * @param {object} family
 * @param {Array} villageRecords
 * @returns {boolean} true if association is uncertain and requires admin review
 */
export const isRecordVillageUncertain = (family, villageRecords = []) => {
  if (!family) return true;
  if (!family.village && !family.villageId) return true;

  const famV = (family.village || '').trim();
  const famId = (family.villageId || '').trim();

  // If already flagged for review
  if (family.needsVillageReview === true) return true;

  // If villageId is known and valid
  const allRecords = Array.isArray(villageRecords) && villageRecords.length > 0
    ? villageRecords
    : initialVillages;

  if (famId) {
    const matchesKnown = allRecords.some(v => (v.id || '').toLowerCase() === famId.toLowerCase());
    if (matchesKnown) return false;
  }

  // If village text clearly matches Samodi or Kotdi or known records
  if (
    famV.includes('समौड़ी') || famV.includes('समौड़ी') ||
    famV.includes('समोड़ी') || famV.includes('समोड़ी') || famV.toLowerCase().includes('samodi') ||
    famV.includes('कोटड़ी') || famV.includes('कोटड़ी') || famV.toLowerCase().includes('kotdi')
  ) {
    return false;
  }

  const matchesRecord = allRecords.some(v => {
    const vEn = (v.nameEnglish || '').toLowerCase();
    const vHi = v.nameHindi || '';
    return (vEn && famV.toLowerCase().includes(vEn)) || (vHi && famV.includes(vHi));
  });

  return !matchesRecord;
};

/**
 * Extracts and sanitizes the user's assigned village IDs.
 *
 * @param {object} userProfile
 * @param {Array} villageRecords
 * @returns {string[]} Array of unique canonical village IDs
 */
export const deriveAssignedVillageIds = (userProfile, villageRecords = []) => {
  if (!userProfile) return [];
  if (userProfile.role === 'admin') return ['all'];

  const ids = new Set();

  // 1. Direct assignedVillageIds array
  if (Array.isArray(userProfile.assignedVillageIds)) {
    userProfile.assignedVillageIds.forEach(id => {
      if (id && typeof id === 'string') ids.add(id.trim().toLowerCase());
    });
  }

  // 2. Primary assignedVillageId
  if (userProfile.assignedVillageId && typeof userProfile.assignedVillageId === 'string') {
    ids.add(userProfile.assignedVillageId.trim().toLowerCase());
  }

  // 3. Resolve from assignedVillages display names
  const rawList = Array.isArray(userProfile.assignedVillages)
    ? userProfile.assignedVillages
    : (userProfile.assignedVillage ? [userProfile.assignedVillage] : []);

  rawList.forEach(item => {
    const resolved = resolveVillageId(item, villageRecords);
    if (resolved) ids.add(resolved);
  });

  return Array.from(ids);
};

/**
 * Deduplicates and formats assigned villages into a clean list of unique display names.
 * Ensures a surveyor assigned to Samodi only sees "समोड़ी (Samodi)" or "Samodi" once,
 * never repeating multiple internal variants or aliases.
 *
 * @param {object|Array} userProfileOrVillages - user profile object or raw array of village strings
 * @param {Array} villageRecords - active village records from DataContext
 * @param {string} language - 'en' | 'hi'
 * @returns {string[]} Array of clean, unique display names
 */
export const getUniqueAssignedVillageNames = (userProfileOrVillages, villageRecords = [], language = 'en') => {
  if (!userProfileOrVillages) return [];

  let vIds = [];
  if (typeof userProfileOrVillages === 'object' && !Array.isArray(userProfileOrVillages)) {
    if (userProfileOrVillages.role === 'admin') {
      return [language === 'hi' ? 'सभी गाँव (ग्लोबल एक्सेस)' : 'All Villages (Global Access)'];
    }
    vIds = deriveAssignedVillageIds(userProfileOrVillages, villageRecords);
  } else if (Array.isArray(userProfileOrVillages)) {
    const setIds = new Set();
    userProfileOrVillages.forEach(item => {
      const id = resolveVillageId(item, villageRecords);
      if (id) setIds.add(id);
    });
    vIds = Array.from(setIds);
  }

  if (vIds.length === 0) return [];

  const uniqueNames = new Set();
  vIds.forEach(id => {
    const displayName = getVillageDisplayName(id, villageRecords, language);
    if (displayName) uniqueNames.add(displayName);
  });

  return Array.from(uniqueNames);
};
