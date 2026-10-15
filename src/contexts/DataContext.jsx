import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  where 
} from 'firebase/firestore';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { initialFamilies } from '../data/villageData';
import { mohallas as initialMohallas } from '../data/mohallas';
import { castes as initialCastes } from '../data/castes';
import { initialVillages, villages as fallbackVillages } from '../data/villages';
import { translations } from '../utils/translations';
import { useAuth } from './AuthContext';

const DataContext = createContext();

const normalizeFamily = (f) => {
  if (!f) return f;
  const headNameEn = f.familyHeadNameEnglish || f.familyHeadName || '';
  const headNameHi = f.familyHeadNameHindi || f.familyHeadName || '';
  const headName = f.familyHeadName || headNameEn || headNameHi || 'Unknown';
  const fatherNameEn = f.fatherNameEnglish || f.fatherName || '';
  const fatherNameHi = f.fatherNameHindi || f.fatherName || '';
  const fatherName = f.fatherName || fatherNameEn || fatherNameHi || '';

  const villageStr = f.village || (initialVillages[0]?.name || 'समोड़ी (Samodi)');
  const isKotdi = villageStr.includes('Kotdi') || villageStr.includes('कोटड़ी');
  const villageId = f.villageId || (isKotdi ? 'kotdi' : 'samodi');

  return {
    ...f,
    village: villageStr,
    villageId,
    familyHeadName: headName,
    familyHeadNameEnglish: headNameEn || headName,
    familyHeadNameHindi: headNameHi || headName,
    fatherName,
    fatherNameEnglish: fatherNameEn || fatherName,
    fatherNameHindi: fatherNameHi || fatherName,
    surveyorId: f.surveyorId || '',
    surveyorName: f.surveyorName || '',
    surveyorEmail: f.surveyorEmail || '',
    members: (f.members || []).map((m, idx) => {
      const nameEn = m.nameEnglish || m.name || `Member ${idx + 1}`;
      const nameHi = m.nameHindi || m.name || `सदस्य ${idx + 1}`;
      return {
        ...m,
        name: m.name || nameEn || nameHi,
        nameEnglish: nameEn,
        nameHindi: nameHi
      };
    })
  };
};

export function DataProvider({ children }) {
  const auth = useAuth() || {};
  const { currentUser, isAdmin, userProfile, assignedVillages = [] } = auth;

  const [rawFamilies, setRawFamilies] = useLocalStorage('villagepulse-families', initialFamilies);
  const [deletedFamilies, setDeletedFamilies] = useLocalStorage('villagepulse-deleted-families', []);
  const [villageRecords, setVillageRecords] = useLocalStorage('villagepulse-village-records', initialVillages);
  const [mohallas, setMohallas] = useLocalStorage('villagepulse-mohallas', initialMohallas);
  const [castes, setCastes] = useLocalStorage('villagepulse-castes', initialCastes);
  const [selectedVillage, setSelectedVillage] = useLocalStorage('villagepulse-selected-village', 'all');
  const [darkMode, setDarkMode] = useLocalStorage('villagepulse-darkmode', false);
  const [language, setLanguage] = useLocalStorage('villagepulse-language', 'en');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Sync dark class on html root element for Tailwind dark: variants
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Cleanup stale default mohallas from localStorage cache
  useEffect(() => {
    if (Array.isArray(mohallas) && mohallas.some(m => 
      m === 'Shastri Nagar' || m === 'Gandhi Colony' || m === 'Nehru Basti' || m === 'Indira Nagar'
    )) {
      setMohallas(initialMohallas);
    }
  }, [mohallas, setMohallas]);

  // Real-time Firestore sync for families
  useEffect(() => {
    if (!currentUser) return;

    try {
      const familiesQuery = isAdmin
        ? collection(db, 'families')
        : query(collection(db, 'families'), where('surveyorId', '==', currentUser.uid));

      const unsubscribe = onSnapshot(familiesQuery, async (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty && isAdmin) {
          try {
            const batch = writeBatch(db);
            initialFamilies.slice(0, 30).forEach((fam) => {
              const docRef = doc(db, 'families', fam.id);
              batch.set(docRef, fam);
            });
            await batch.commit();
          } catch (e) {
            console.warn('Seeding initial families failed:', e);
          }
        } else {
          const loaded = [];
          snapshot.forEach(docSnap => {
            loaded.push({ ...docSnap.data(), id: docSnap.id });
          });
          setRawFamilies(loaded);
        }
      }, (error) => {
        console.error('Firestore families listener error:', error);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error('Failed to initialize Firestore families listener:', e);
    }
  }, [currentUser, isAdmin]);

  // Real-time Firestore sync for deletedFamilies
  useEffect(() => {
    if (!currentUser) return;

    try {
      const deletedQuery = isAdmin
        ? collection(db, 'deletedFamilies')
        : query(collection(db, 'deletedFamilies'), where('surveyorId', '==', currentUser.uid));

      const unsubscribe = onSnapshot(deletedQuery, (snapshot) => {
        const loaded = [];
        snapshot.forEach(docSnap => {
          loaded.push({ ...docSnap.data(), id: docSnap.id });
        });
        setDeletedFamilies(loaded);
      }, (error) => {
        console.error('Firestore deletedFamilies listener error:', error);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error('Failed to initialize Firestore deletedFamilies listener:', e);
    }
  }, [currentUser, isAdmin]);

  // Real-time Firestore sync for dynamic villages collection
  useEffect(() => {
    if (!currentUser) return;

    try {
      const unsubscribe = onSnapshot(collection(db, 'villages'), async (snapshot) => {
        if (snapshot.empty && isAdmin) {
          try {
            const batch = writeBatch(db);
            initialVillages.forEach((v) => {
              const docRef = doc(db, 'villages', v.id);
              batch.set(docRef, v);
            });
            await batch.commit();
            setVillageRecords(initialVillages);
          } catch (e) {
            console.warn('Seeding initial villages failed:', e);
          }
        } else {
          const loaded = [];
          snapshot.forEach(docSnap => {
            loaded.push({ ...docSnap.data(), id: docSnap.id });
          });
          // Ensure sort order (active first, then by name)
          loaded.sort((a, b) => {
            if (a.status === b.status) return (a.nameEnglish || '').localeCompare(b.nameEnglish || '');
            return a.status === 'active' ? -1 : 1;
          });
          setVillageRecords(loaded);
        }
      }, (error) => {
        console.error('Firestore villages listener error:', error);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error('Failed to initialize Firestore villages listener:', e);
    }
  }, [currentUser, isAdmin]);

  // Real-time Firestore sync for settings (mohallas & castes)
  useEffect(() => {
    if (!currentUser) return;

    try {
      const configDocRef = doc(db, 'settings', 'villageConfig');
      const unsubscribe = onSnapshot(configDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const hasOldDefaults = Array.isArray(data.mohallas) && data.mohallas.some(m => 
            m === 'Shastri Nagar' || m === 'Gandhi Colony' || m === 'Nehru Basti' || m === 'Indira Nagar'
          );
          if (hasOldDefaults && isAdmin) {
            try {
              await setDoc(configDocRef, { mohallas: initialMohallas }, { merge: true });
              setMohallas(initialMohallas);
            } catch (e) {
              console.warn('Updating default mohallas in Firestore failed:', e);
              setMohallas(initialMohallas);
            }
          } else if (data.mohallas && Array.isArray(data.mohallas)) {
            setMohallas(data.mohallas);
          }
          if (data.castes && Array.isArray(data.castes)) setCastes(data.castes);
        } else if (isAdmin) {
          try {
            await setDoc(configDocRef, {
              mohallas: initialMohallas,
              castes: initialCastes
            }, { merge: true });
            setMohallas(initialMohallas);
          } catch (e) {
            console.warn('Seeding settings failed:', e);
          }
        }
      }, (error) => {
        console.error('Firestore settings listener error:', error);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error('Failed to initialize Firestore settings listener:', e);
    }
  }, [currentUser, isAdmin]);

  // Active village records (only active ones)
  const activeVillageRecords = useMemo(() => {
    const list = (villageRecords || []).filter(v => v.status !== 'inactive');
    return list.length > 0 ? list : initialVillages;
  }, [villageRecords]);

  // Active village string array for select dropdowns & dashboard (Samodi & Kotdi initially)
  const activeVillages = useMemo(() => {
    return activeVillageRecords.map(v => v.name || `${v.nameHindi} (${v.nameEnglish})`);
  }, [activeVillageRecords]);

  // All village string names
  const allVillages = useMemo(() => {
    return (villageRecords || []).map(v => v.name || `${v.nameHindi} (${v.nameEnglish})`);
  }, [villageRecords]);

  const allFamilies = useMemo(() => {
    return (rawFamilies || []).map(normalizeFamily);
  }, [rawFamilies]);

  const normalizedDeletedFamilies = useMemo(() => {
    return (deletedFamilies || []).map(normalizeFamily);
  }, [deletedFamilies]);

  // Helper function to match whether a family belongs to a village identifier (name, Hindi, English, or ID)
  const isFamilyInVillage = useCallback((family, villageIdentifier) => {
    if (!family || !villageIdentifier) return false;
    if (villageIdentifier === 'all') return true;

    const target = villageIdentifier.toString().trim().toLowerCase();

    // Direct villageId match
    if (family.villageId && family.villageId.toLowerCase() === target) return true;

    const famV = (family.village || '').trim().toLowerCase();
    if (!famV) return false;

    if (famV === target) return true;
    if (famV.includes(target) || target.includes(famV)) return true;

    // Check against all villageRecords for cross-matching English & Hindi names
    const matching = (villageRecords || []).find(v => {
      const vId = (v.id || '').toLowerCase();
      const vName = (v.name || '').toLowerCase();
      const vEn = (v.nameEnglish || '').toLowerCase();
      const vHi = (v.nameHindi || '').toLowerCase();
      return vId === target || vName === target || vEn === target || vHi === target;
    });

    if (matching) {
      if (family.villageId && family.villageId.toLowerCase() === matching.id.toLowerCase()) return true;
      if (matching.nameEnglish && famV.includes(matching.nameEnglish.toLowerCase())) return true;
      if (matching.nameHindi && (family.village || '').includes(matching.nameHindi)) return true;
      if (matching.name && famV === matching.name.toLowerCase()) return true;
    }

    return false;
  }, [villageRecords]);

  // Scoped families according to user role and assigned villages
  const scopedFamilies = useMemo(() => {
    let result = allFamilies;

    // Strict Village-level Data Isolation for regular surveyors:
    if (!isAdmin) {
      if (!currentUser) return [];

      // If surveyor has NO assigned villages or assignmentStatus === 'Unassigned':
      if (!assignedVillages || assignedVillages.length === 0 || userProfile?.assignmentStatus === 'Unassigned') {
        return []; // Strict isolation: Unassigned users cannot see or access village records
      }

      result = result.filter(f => {
        return assignedVillages.some(av => isFamilyInVillage(f, av));
      });
    }

    // Filter by selected village if not 'all'
    if (selectedVillage && selectedVillage !== 'all') {
      result = result.filter(f => isFamilyInVillage(f, selectedVillage));
    }

    return result;
  }, [allFamilies, isAdmin, currentUser, assignedVillages, userProfile?.assignmentStatus, selectedVillage, isFamilyInVillage]);

  // Translation function
  const t = useCallback((key) => {
    return translations[language]?.[key] || key;
  }, [language]);

  // Add a single family with village validation
  const addFamily = async (family) => {
    if (!isAdmin && (!assignedVillages || assignedVillages.length === 0 || userProfile?.assignmentStatus === 'Unassigned')) {
      throw new Error(language === 'hi' 
        ? 'आपके खाते को अभी कोई गाँव आवंटित नहीं है। कृपया व्यवस्थापक द्वारा गाँव आवंटन की प्रतीक्षा करें।'
        : 'You cannot create surveys because no village has been assigned to your account. Please wait for an administrator to assign your village.');
    }

    const defaultVillage = activeVillages[0] || 'समोड़ी (Samodi)';
    let targetVillage = family.village;

    if (!isAdmin) {
      const isTargetAssigned = assignedVillages.some(av => isFamilyInVillage({ village: targetVillage }, av));
      if (!isTargetAssigned) {
        targetVillage = assignedVillages[0];
      }
    } else {
      targetVillage = targetVillage || (selectedVillage !== 'all' ? selectedVillage : defaultVillage);
    }

    // Resolve villageId
    const matchedRecord = (villageRecords || []).find(v => isFamilyInVillage({ village: targetVillage }, v.id || v.name));
    const targetVillageId = matchedRecord ? matchedRecord.id : (family.villageId || (targetVillage.includes('Kotdi') ? 'kotdi' : 'samodi'));

    const maxNum = (rawFamilies || []).reduce((max, f) => {
      const match = f.id && String(f.id).match(/FAM-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const newId = family.id || `FAM-${String(Math.max((rawFamilies || []).length + 1, maxNum + 1)).padStart(4, '0')}`;
    const newFamily = {
      ...family,
      id: newId,
      village: targetVillage,
      villageId: targetVillageId,
      surveyorId: (!isAdmin || !family.surveyorId) ? (currentUser?.uid || '') : family.surveyorId,
      surveyorName: family.surveyorName || userProfile?.name || currentUser?.email?.split('@')[0] || 'Surveyor',
      surveyorEmail: family.surveyorEmail || currentUser?.email || '',
      createdBy: family.createdBy || currentUser?.uid || '',
      createdByName: userProfile?.name || currentUser?.email?.split('@')[0] || 'Surveyor',
      createdAt: family.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.uid || ''
    };
    
    // Immediate local state update
    setRawFamilies(prev => [...prev.filter(f => f.id !== newId), newFamily]);

    // Push to Firestore
    try {
      await setDoc(doc(db, 'families', newId), newFamily);
    } catch (err) {
      console.error('Firestore addFamily error:', err);
    }

    return newFamily;
  };

  // Bulk add families (for Excel import)
  const bulkAddFamilies = async (importedFamilies) => {
    if (!isAdmin && (!assignedVillages || assignedVillages.length === 0 || userProfile?.assignmentStatus === 'Unassigned')) {
      throw new Error(language === 'hi' 
        ? 'आपके खाते को अभी कोई गाँव आवंटित नहीं है। कृपया व्यवस्थापक द्वारा गाँव आवंटन की प्रतीक्षा करें।'
        : 'You cannot import surveys because no village has been assigned to your account.');
    }

    let currentMax = (rawFamilies || []).reduce((max, f) => {
      const match = f.id && String(f.id).match(/FAM-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);

    const defaultVillage = activeVillages[0] || 'समोड़ी (Samodi)';

    const prepared = importedFamilies.map((fam) => {
      currentMax += 1;
      const famId = fam.id || `FAM-${String(currentMax).padStart(4, '0')}`;
      let targetVillage = fam.village;
      if (!isAdmin) {
        if (assignedVillages && assignedVillages.length > 0) {
          const isAssigned = assignedVillages.some(av => isFamilyInVillage({ village: targetVillage }, av));
          targetVillage = isAssigned ? targetVillage : assignedVillages[0];
        }
      } else {
        targetVillage = targetVillage || (selectedVillage !== 'all' ? selectedVillage : defaultVillage);
      }

      const matchedRecord = (villageRecords || []).find(v => isFamilyInVillage({ village: targetVillage }, v.id || v.name));
      const targetVillageId = matchedRecord ? matchedRecord.id : (fam.villageId || (targetVillage.includes('Kotdi') ? 'kotdi' : 'samodi'));

      return normalizeFamily({
        ...fam,
        id: famId,
        village: targetVillage,
        villageId: targetVillageId,
        surveyorId: (!isAdmin || !fam.surveyorId) ? (currentUser?.uid || '') : fam.surveyorId,
        surveyorName: fam.surveyorName || userProfile?.name || currentUser?.email?.split('@')[0] || 'Surveyor',
        surveyorEmail: fam.surveyorEmail || currentUser?.email || '',
        createdBy: fam.createdBy || currentUser?.uid || '',
        createdByName: userProfile?.name || currentUser?.email?.split('@')[0] || 'Surveyor',
        createdAt: fam.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    setRawFamilies(prev => {
      const existingIds = new Set(prepared.map(p => p.id));
      return [...prev.filter(f => !existingIds.has(f.id)), ...prepared];
    });

    // Firestore batch writes (chunks of 400 to stay safely below 500 limit)
    try {
      const chunkSize = 400;
      for (let i = 0; i < prepared.length; i += chunkSize) {
        const chunk = prepared.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(f => {
          batch.set(doc(db, 'families', f.id), f);
        });
        await batch.commit();
      }
    } catch (err) {
      console.error('Firestore bulkAddFamilies error:', err);
    }

    return prepared;
  };

  // Update a family
  const updateFamily = async (id, updatedFamily) => {
    if (!isAdmin) {
      if (!assignedVillages || assignedVillages.length === 0 || userProfile?.assignmentStatus === 'Unassigned') {
        throw new Error(language === 'hi' 
          ? 'आपके खाते को अभी कोई गाँव आवंटित नहीं है।'
          : 'You cannot edit records because no village has been assigned to your account.');
      }
      const allowed = scopedFamilies.some(f => f.id === id);
      if (!allowed) {
        console.error('Unauthorized update attempt on family:', id);
        throw new Error('You do not have permission to edit records outside your assigned village.');
      }
    }

    const enriched = {
      ...updatedFamily,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.uid || '',
      updatedByName: userProfile?.name || currentUser?.email?.split('@')[0] || 'User'
    };

    setRawFamilies(prev => prev.map(f => f.id === id ? { ...f, ...enriched } : f));
    try {
      await setDoc(doc(db, 'families', id), enriched, { merge: true });
    } catch (err) {
      console.error('Firestore updateFamily error:', err);
    }
  };

  // Delete a family (move to deletedFamilies)
  const deleteFamily = async (id) => {
    if (!isAdmin) {
      const allowed = scopedFamilies.some(f => f.id === id);
      if (!allowed) {
        console.error('Unauthorized delete attempt on family:', id);
        throw new Error('You do not have permission to delete records outside your assigned village.');
      }
    }

    const familyToDelete = rawFamilies.find(f => f.id === id);
    if (familyToDelete) {
      const deletedRecord = { 
        ...familyToDelete, 
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.uid || '',
        deletedByName: userProfile?.name || currentUser?.email?.split('@')[0] || 'User'
      };
      setDeletedFamilies(prev => [...prev, deletedRecord]);
      setRawFamilies(prev => prev.filter(f => f.id !== id));
      try {
        await setDoc(doc(db, 'deletedFamilies', id), deletedRecord);
        await deleteDoc(doc(db, 'families', id));
      } catch (err) {
        console.error('Firestore deleteFamily error:', err);
      }
    }
  };

  // Restore a family
  const restoreFamily = async (id) => {
    const familyToRestore = deletedFamilies.find(f => f.id === id);
    if (familyToRestore) {
      const { deletedAt, ...restoredFamily } = familyToRestore;
      setRawFamilies(prev => [...prev, restoredFamily]);
      setDeletedFamilies(prev => prev.filter(f => f.id !== id));
      try {
        await setDoc(doc(db, 'families', id), restoredFamily);
        await deleteDoc(doc(db, 'deletedFamilies', id));
      } catch (err) {
        console.error('Firestore restoreFamily error:', err);
      }
    }
  };

  // Permanently delete a family
  const permanentlyDeleteFamily = async (id) => {
    setDeletedFamilies(prev => prev.filter(f => f.id !== id));
    try {
      await deleteDoc(doc(db, 'deletedFamilies', id));
    } catch (err) {
      console.error('Firestore permanentlyDeleteFamily error:', err);
    }
  };

  // Restore all deleted families
  const restoreAllFamilies = async () => {
    const toRestore = [...deletedFamilies];
    if (toRestore.length === 0) return;
    setRawFamilies(prev => [...prev, ...toRestore.map(f => {
      const { deletedAt, deletedBy, deletedByName, ...rest } = f;
      return rest;
    })]);
    setDeletedFamilies([]);
    try {
      const batch = writeBatch(db);
      toRestore.forEach(f => {
        const { deletedAt, deletedBy, deletedByName, ...rest } = f;
        batch.set(doc(db, 'families', f.id), rest);
        batch.delete(doc(db, 'deletedFamilies', f.id));
      });
      await batch.commit();
    } catch (err) {
      console.error('Firestore restoreAllFamilies error:', err);
    }
  };

  // Permanently delete all families (purge trash)
  const permanentlyDeleteAllFamilies = async () => {
    const toDelete = [...deletedFamilies];
    if (toDelete.length === 0) return;
    setDeletedFamilies([]);
    try {
      const batch = writeBatch(db);
      toDelete.forEach(f => {
        batch.delete(doc(db, 'deletedFamilies', f.id));
      });
      await batch.commit();
    } catch (err) {
      console.error('Firestore permanentlyDeleteAllFamilies error:', err);
    }
  };

  // Get family by id (with privacy protection)
  const getFamilyById = (id) => {
    if (isAdmin) {
      return allFamilies.find(f => f.id === id);
    }
    return scopedFamilies.find(f => f.id === id);
  };

  // ==========================================
  // DYNAMIC VILLAGE MANAGEMENT (ADMIN)
  // ==========================================

  // Add a new village record
  const addVillageRecord = async ({ nameEnglish, nameHindi, status = 'active' }) => {
    const en = (nameEnglish || '').trim();
    const hi = (nameHindi || '').trim();

    if (!en || !hi) {
      throw new Error(language === 'hi' ? 'अंग्रेजी और हिंदी दोनों नाम आवश्यक हैं।' : 'Both English and Hindi names are required.');
    }

    // Prevent duplicate village names (case-insensitive for English, trim for Hindi)
    const duplicateEn = (villageRecords || []).some(v => (v.nameEnglish || '').trim().toLowerCase() === en.toLowerCase());
    const duplicateHi = (villageRecords || []).some(v => (v.nameHindi || '').trim() === hi);

    if (duplicateEn || duplicateHi) {
      throw new Error(language === 'hi' ? 'इस नाम का गाँव पहले से मौजूद है।' : 'A village with this name already exists.');
    }

    const baseId = en.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const id = baseId || `village-${Date.now()}`;
    const combinedName = `${hi} (${en})`;

    const newVillage = {
      id,
      nameEnglish: en,
      nameHindi: hi,
      name: combinedName,
      status: status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setVillageRecords(prev => [...prev.filter(v => v.id !== id), newVillage]);

    try {
      await setDoc(doc(db, 'villages', id), newVillage);
    } catch (err) {
      console.error('Firestore addVillageRecord error:', err);
      throw err;
    }

    return newVillage;
  };

  // Update existing village details
  const updateVillageRecord = async (id, { nameEnglish, nameHindi, status }) => {
    const existing = (villageRecords || []).find(v => v.id === id);
    if (!existing) {
      throw new Error('Village not found');
    }

    const en = nameEnglish !== undefined ? nameEnglish.trim() : existing.nameEnglish;
    const hi = nameHindi !== undefined ? nameHindi.trim() : existing.nameHindi;

    if (!en || !hi) {
      throw new Error(language === 'hi' ? 'अंग्रेजी और हिंदी दोनों नाम आवश्यक हैं।' : 'Both English and Hindi names are required.');
    }

    // Check duplicate against other villages
    const duplicateEn = (villageRecords || []).some(v => v.id !== id && (v.nameEnglish || '').trim().toLowerCase() === en.toLowerCase());
    const duplicateHi = (villageRecords || []).some(v => v.id !== id && (v.nameHindi || '').trim() === hi);

    if (duplicateEn || duplicateHi) {
      throw new Error(language === 'hi' ? 'इस नाम का गाँव पहले से मौजूद है।' : 'Another village with this name already exists.');
    }

    const combinedName = `${hi} (${en})`;
    const updated = {
      ...existing,
      nameEnglish: en,
      nameHindi: hi,
      name: combinedName,
      status: status !== undefined ? status : existing.status,
      updatedAt: new Date().toISOString()
    };

    setVillageRecords(prev => prev.map(v => v.id === id ? updated : v));

    try {
      await setDoc(doc(db, 'villages', id), updated, { merge: true });
    } catch (err) {
      console.error('Firestore updateVillageRecord error:', err);
      throw err;
    }

    return updated;
  };

  // Activate / Deactivate village (preserving all survey records!)
  const toggleVillageStatus = async (id) => {
    const existing = (villageRecords || []).find(v => v.id === id);
    if (!existing) return;

    const nextStatus = existing.status === 'active' ? 'inactive' : 'active';
    const updated = {
      ...existing,
      status: nextStatus,
      updatedAt: new Date().toISOString()
    };

    setVillageRecords(prev => prev.map(v => v.id === id ? updated : v));

    // If currently selected village is being deactivated, reset selected village to all
    if (selectedVillage && isFamilyInVillage({ village: selectedVillage }, existing.id) && nextStatus === 'inactive') {
      setSelectedVillage('all');
    }

    try {
      await setDoc(doc(db, 'villages', id), updated, { merge: true });
    } catch (err) {
      console.error('Firestore toggleVillageStatus error:', err);
      throw err;
    }

    return nextStatus;
  };

  // Delete village safely: check associated survey records first
  const deleteVillageRecord = async (id) => {
    const existing = (villageRecords || []).find(v => v.id === id);
    if (!existing) {
      throw new Error('Village not found');
    }

    // Check if any family records in rawFamilies are associated with this village
    const associatedFamilies = (rawFamilies || []).filter(f => isFamilyInVillage(f, existing.id));

    if (associatedFamilies.length > 0) {
      const err = new Error(
        language === 'hi'
          ? `इस गाँव को स्थायी रूप से नहीं हटाया जा सकता क्योंकि इसके अंतर्गत ${associatedFamilies.length} परिवार सर्वे रिकॉर्ड दर्ज हैं। रिकॉर्ड्स को सुरक्षित रखने के लिए गाँव को 'निष्क्रिय' (Deactivate) करें।`
          : `Cannot delete village: ${associatedFamilies.length} family survey records are associated with it. Please deactivate it instead to preserve survey history.`
      );
      err.associatedCount = associatedFamilies.length;
      throw err;
    }

    // Safe to delete if 0 records
    setVillageRecords(prev => prev.filter(v => v.id !== id));
    if (selectedVillage && isFamilyInVillage({ village: selectedVillage }, existing.id)) {
      setSelectedVillage('all');
    }

    try {
      await deleteDoc(doc(db, 'villages', id));
    } catch (err) {
      console.error('Firestore deleteVillageRecord error:', err);
      throw err;
    }

    return true;
  };

  // Backwards-compatible wrappers for legacy callers
  const addVillage = async (villageName) => {
    if (!villageName || !villageName.trim()) return;
    const str = villageName.trim();
    // Check if contains (English) like "समोड़ी (Samodi)"
    const match = str.match(/(.*?)\s*\((.*?)\)/);
    const nameHindi = match ? match[1].trim() : str;
    const nameEnglish = match ? match[2].trim() : str;
    return addVillageRecord({ nameEnglish, nameHindi });
  };

  const deleteVillage = async (villageName) => {
    const matched = (villageRecords || []).find(v => isFamilyInVillage({ village: villageName }, v.id));
    if (matched) {
      return deleteVillageRecord(matched.id);
    }
  };

  // Mohallas & Castes CRUD
  const addMohalla = async (mohalla) => {
    if (!mohalla || !mohalla.trim()) return;
    const trimmed = mohalla.trim();
    if (!mohallas.includes(trimmed)) {
      const nextMohallas = [...mohallas, trimmed];
      setMohallas(nextMohallas);
      try {
        await setDoc(doc(db, 'settings', 'villageConfig'), { mohallas: nextMohallas }, { merge: true });
      } catch (err) {
        console.error('Firestore addMohalla error:', err);
      }
    }
  };

  const deleteMohalla = async (mohalla) => {
    const nextMohallas = mohallas.filter(m => m !== mohalla);
    setMohallas(nextMohallas);
    try {
      await setDoc(doc(db, 'settings', 'villageConfig'), { mohallas: nextMohallas }, { merge: true });
    } catch (err) {
      console.error('Firestore deleteMohalla error:', err);
    }
  };

  const addCaste = async (caste) => {
    if (!caste || !caste.trim()) return;
    const trimmed = caste.trim();
    if (!castes.includes(trimmed)) {
      const nextCastes = [...castes, trimmed];
      setCastes(nextCastes);
      try {
        await setDoc(doc(db, 'settings', 'villageConfig'), { castes: nextCastes }, { merge: true });
      } catch (err) {
        console.error('Firestore addCaste error:', err);
      }
    }
  };

  const deleteCaste = async (caste) => {
    const nextCastes = castes.filter(c => c !== caste);
    setCastes(nextCastes);
    try {
      await setDoc(doc(db, 'settings', 'villageConfig'), { castes: nextCastes }, { merge: true });
    } catch (err) {
      console.error('Firestore deleteCaste error:', err);
    }
  };

  // Reset all data
  const resetData = async () => {
    setRawFamilies(initialFamilies);
    setVillageRecords(initialVillages);
    setMohallas(initialMohallas);
    setCastes(initialCastes);
    setSelectedVillage('all');
    try {
      const batch = writeBatch(db);
      initialFamilies.slice(0, 30).forEach((fam) => {
        batch.set(doc(db, 'families', fam.id), fam);
      });
      initialVillages.forEach((v) => {
        batch.set(doc(db, 'villages', v.id), v);
      });
      batch.set(doc(db, 'settings', 'villageConfig'), {
        mohallas: initialMohallas,
        castes: initialCastes
      });
      await batch.commit();
    } catch (err) {
      console.error('Firestore resetData error:', err);
    }
  };

  // Export data as JSON
  const exportData = () => {
    const data = {
      families: scopedFamilies,
      allFamilies: isAdmin ? allFamilies : undefined,
      villages: activeVillages,
      villageRecords,
      mohallas,
      castes,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `villagepulse-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import data from JSON
  const importData = async (data) => {
    if (data.families && Array.isArray(data.families)) {
      setRawFamilies(data.families);
      try {
        const batch = writeBatch(db);
        data.families.forEach((fam) => {
          if (fam.id) batch.set(doc(db, 'families', fam.id), fam);
        });
        await batch.commit();
      } catch (err) {
        console.error('Firestore import families error:', err);
      }
    }
    if (data.villageRecords && Array.isArray(data.villageRecords)) {
      setVillageRecords(data.villageRecords);
      try {
        const batch = writeBatch(db);
        data.villageRecords.forEach((v) => {
          if (v.id) batch.set(doc(db, 'villages', v.id), v);
        });
        await batch.commit();
      } catch (e) { /* ignore */ }
    }
    if (data.mohallas) {
      setMohallas(data.mohallas);
      try {
        await setDoc(doc(db, 'settings', 'villageConfig'), { mohallas: data.mohallas }, { merge: true });
      } catch (e) { /* ignore */ }
    }
    if (data.castes) {
      setCastes(data.castes);
      try {
        await setDoc(doc(db, 'settings', 'villageConfig'), { castes: data.castes }, { merge: true });
      } catch (e) { /* ignore */ }
    }
  };

  return (
    <DataContext.Provider value={{
      families: scopedFamilies,
      allFamilies,
      deletedFamilies: normalizedDeletedFamilies,
      // Active villages array for dropdowns & dashboard (Samodi and Kotdi initially)
      villages: activeVillages,
      activeVillages,
      allVillages,
      villageRecords,
      activeVillageRecords,
      selectedVillage,
      setSelectedVillage,
      isFamilyInVillage,
      // Village management methods
      addVillageRecord,
      updateVillageRecord,
      toggleVillageStatus,
      deleteVillageRecord,
      addVillage,
      deleteVillage,
      // Mohallas & Castes
      mohallas,
      castes,
      darkMode,
      setDarkMode,
      language,
      setLanguage,
      t,
      isFirebaseConnected,
      addFamily,
      bulkAddFamilies,
      updateFamily,
      deleteFamily,
      restoreFamily,
      permanentlyDeleteFamily,
      restoreAllFamilies,
      permanentlyDeleteAllFamilies,
      getFamilyById,
      addMohalla,
      deleteMohalla,
      addCaste,
      deleteCaste,
      resetData,
      exportData,
      importData
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
