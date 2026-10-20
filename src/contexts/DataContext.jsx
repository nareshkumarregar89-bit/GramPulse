import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  getDocs,
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
import surveyData142 from '../data/surveyData142.json';
import { translations } from '../utils/translations';
import { useAuth } from './AuthContext';
import { 
  resolveVillageId, 
  getVillageDisplayName, 
  isFamilyInVillageRecord, 
  isRecordVillageUncertain, 
  deriveAssignedVillageIds 
} from '../utils/villageUtils';

const DataContext = createContext();

const normalizeFamily = (f, villageRecords = []) => {
  if (!f) return f;
  const headNameEn = f.familyHeadNameEnglish || f.familyHeadName || '';
  const headNameHi = f.familyHeadNameHindi || f.familyHeadName || '';
  const headName = f.familyHeadName || headNameEn || headNameHi || 'Unknown';
  const fatherNameEn = f.fatherNameEnglish || f.fatherName || '';
  const fatherNameHi = f.fatherNameHindi || f.fatherName || '';
  const fatherName = f.fatherName || fatherNameEn || fatherNameHi || '';

  const villageStr = f.village || (initialVillages[0]?.name || 'समोड़ी (Samodi)');
  const resolvedId = f.villageId || resolveVillageId(villageStr, villageRecords);
  const isUncertain = isRecordVillageUncertain(f, villageRecords);

  return {
    ...f,
    village: villageStr,
    villageId: resolvedId || (isUncertain ? '' : 'samodi'),
    needsVillageReview: Boolean(f.needsVillageReview || isUncertain),
    villageReviewReason: f.villageReviewReason || (isUncertain ? 'Uncertain or missing village association' : ''),
    familyHeadName: headName,
    familyHeadNameEnglish: headNameEn || headName,
    familyHeadNameHindi: headNameHi || headName,
    fatherName,
    fatherNameEnglish: fatherNameEn || fatherName,
    fatherNameHindi: fatherNameHi || fatherName,
    surveyorId: f.surveyorId || '',
    surveyorName: f.surveyorName || '',
    surveyorEmail: f.surveyorEmail || '',
    createdBy: f.createdBy || f.surveyorId || '',
    createdByName: f.createdByName || f.surveyorName || 'Surveyor',
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
  const { 
    currentUser, 
    isAdmin, 
    userProfile, 
    assignedVillages = [], 
    assignedVillageIds = [], 
    isReadOnly = false 
  } = auth;

  const [rawFamilies, setRawFamilies] = useLocalStorage('villagepulse-families', []);
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

  // Purge stale cached family records when assignment changes or user logs out
  const activeVillageIdsKey = useMemo(() => {
    if (isAdmin) return 'admin_all';
    const vIds = (assignedVillageIds && assignedVillageIds.length > 0)
      ? assignedVillageIds
      : deriveAssignedVillageIds(userProfile, villageRecords);
    return vIds.sort().join(',');
  }, [isAdmin, assignedVillageIds, userProfile, villageRecords]);

  // Helper to derive all name and ID query variations for assigned villages
  const getAssignedVillageQueryVariants = (vIds = [], assignedVillagesList = []) => {
    const nameVariants = new Set();
    const idVariants = new Set();

    (vIds || []).forEach(id => {
      if (id && typeof id === 'string') {
        const cleanId = id.trim().toLowerCase();
        idVariants.add(cleanId);
        if (cleanId === 'samodi') {
          nameVariants.add('समोड़ी (Samodi)');
          nameVariants.add('समोड़ी (Samodi)');
          nameVariants.add('Samodi');
          nameVariants.add('समोड़ी');
          nameVariants.add('समोड़ी');
        } else if (cleanId === 'kotdi') {
          nameVariants.add('कोटड़ी (Kotdi)');
          nameVariants.add('कोटड़ी (Kotdi)');
          nameVariants.add('Kotdi');
          nameVariants.add('कोटड़ी');
          nameVariants.add('कोटड़ी');
        }
      }
    });

    (assignedVillagesList || []).forEach(v => {
      if (v && typeof v === 'string') {
        nameVariants.add(v.trim());
        if (v.includes('Samodi') || v.includes('समो')) {
          nameVariants.add('समोड़ी (Samodi)');
          nameVariants.add('समोड़ी (Samodi)');
          nameVariants.add('Samodi');
          idVariants.add('samodi');
        } else if (v.includes('Kotdi') || v.includes('कोट')) {
          nameVariants.add('कोटड़ी (Kotdi)');
          nameVariants.add('कोटड़ी (Kotdi)');
          nameVariants.add('Kotdi');
          idVariants.add('kotdi');
        }
      }
    });

    return {
      names: Array.from(nameVariants).slice(0, 10),
      ids: Array.from(idVariants).slice(0, 10)
    };
  };

  // Real-time Firestore sync for families (Village-Level Shared Access)
  useEffect(() => {
    if (!currentUser) {
      setRawFamilies([]);
      return;
    }

    try {
      if (isAdmin) {
        // Admin: Unrestricted access across all villages
        const familiesQuery = collection(db, 'families');
        const unsubscribe = onSnapshot(familiesQuery, (snapshot) => {
          setIsFirebaseConnected(true);
          const loaded = [];
          snapshot.forEach(docSnap => {
            loaded.push({ ...docSnap.data(), id: docSnap.id });
          });
          setRawFamilies(loaded);
        }, (error) => {
          console.error('Firestore admin families listener error:', error);
        });
        return () => unsubscribe();
      }

      // Surveyor: Strict Village-Level Shared Access
      const vIds = (assignedVillageIds && assignedVillageIds.length > 0)
        ? assignedVillageIds
        : deriveAssignedVillageIds(userProfile, villageRecords);

      // Strict isolation: Unassigned surveyor has NO village access
      if (!vIds || vIds.length === 0) {
        setRawFamilies([]);
        setIsFirebaseConnected(true);
        return;
      }

      const { names: targetNames, ids: targetIds } = getAssignedVillageQueryVariants(
        vIds, 
        userProfile?.assignedVillages || assignedVillages
      );

      const combinedMap = new Map();
      const unsubscribers = [];

      const syncCombinedFamilies = () => {
        setIsFirebaseConnected(true);
        const combined = Array.from(combinedMap.values());
        setRawFamilies(combined);
      };

      // Strategy 1: General collection listener with client-side assigned village filter
      // (Executes when security rules allow isAssignedSurveyor read)
      try {
        const qCollection = collection(db, 'families');
        const unsub0 = onSnapshot(qCollection, (snapshot) => {
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const matchesVillage = vIds.some(vid => isFamilyInVillageRecord(data, vid, villageRecords));
            if (matchesVillage) {
              combinedMap.set(docSnap.id, { ...data, id: docSnap.id });
            }
          });
          syncCombinedFamilies();
        }, (err) => {
          console.warn('Firestore general collection query for surveyor (handled):', err.message);
        });
        unsubscribers.push(unsub0);
      } catch (e) {
        console.warn('Collection listener init error:', e);
      }

      // Strategy 2: Single-value queries for each target village name
      // (Direct equality checks immune to "in" operator rule constraints)
      targetNames.forEach(name => {
        try {
          const qSingle = query(collection(db, 'families'), where('village', '==', name));
          const unsub = onSnapshot(qSingle, (snapshot) => {
            snapshot.forEach(docSnap => {
              combinedMap.set(docSnap.id, { ...docSnap.data(), id: docSnap.id });
            });
            syncCombinedFamilies();
          }, (err) => {
            console.warn(`Firestore single name query for "${name}" (handled):`, err.message);
          });
          unsubscribers.push(unsub);
        } catch (e) {
          console.warn(`Single name query init error for "${name}":`, e);
        }
      });

      // Strategy 3: Single-value query for canonical villageId
      targetIds.forEach(id => {
        try {
          const qIdSingle = query(collection(db, 'families'), where('villageId', '==', id));
          const unsub = onSnapshot(qIdSingle, (snapshot) => {
            snapshot.forEach(docSnap => {
              combinedMap.set(docSnap.id, { ...docSnap.data(), id: docSnap.id });
            });
            syncCombinedFamilies();
          }, (err) => {
            console.warn(`Firestore single villageId query for "${id}" (handled):`, err.message);
          });
          unsubscribers.push(unsub);
        } catch (e) {
          console.warn(`Single villageId query init error for "${id}":`, e);
        }
      });

      // Strategy 4: Batch "in" queries for names and IDs
      if (targetNames.length > 0) {
        try {
          const qNames = targetNames.length === 1
            ? query(collection(db, 'families'), where('village', '==', targetNames[0]))
            : query(collection(db, 'families'), where('village', 'in', targetNames.slice(0, 10)));

          const unsubNames = onSnapshot(qNames, (snapshot) => {
            snapshot.forEach(docSnap => {
              combinedMap.set(docSnap.id, { ...docSnap.data(), id: docSnap.id });
            });
            syncCombinedFamilies();
          }, (err) => {
            console.warn('Firestore village name batch query (handled):', err.message);
          });
          unsubscribers.push(unsubNames);
        } catch (e) {
          console.warn('Batch name query init error:', e);
        }
      }

      if (targetIds.length > 0) {
        try {
          const qIds = targetIds.length === 1
            ? query(collection(db, 'families'), where('villageId', '==', targetIds[0]))
            : query(collection(db, 'families'), where('villageId', 'in', targetIds.slice(0, 10)));

          const unsubIds = onSnapshot(qIds, (snapshot) => {
            snapshot.forEach(docSnap => {
              combinedMap.set(docSnap.id, { ...docSnap.data(), id: docSnap.id });
            });
            syncCombinedFamilies();
          }, (err) => {
            console.warn('Firestore villageId batch query (handled):', err.message);
          });
          unsubscribers.push(unsubIds);
        } catch (e) {
          console.warn('Batch villageId query init error:', e);
        }
      }

      return () => {
        unsubscribers.forEach(unsub => {
          try { unsub(); } catch (e) {}
        });
      };
    } catch (e) {
      console.error('Failed to initialize Firestore families listener:', e);
    }
  }, [currentUser, isAdmin, activeVillageIdsKey]);

  // Real-time Firestore sync for deletedFamilies (Recycle Bin village scope)
  useEffect(() => {
    if (!currentUser) {
      setDeletedFamilies([]);
      return;
    }

    try {
      if (isAdmin) {
        const deletedQuery = collection(db, 'deletedFamilies');
        const unsubscribe = onSnapshot(deletedQuery, (snapshot) => {
          const loaded = [];
          snapshot.forEach(docSnap => {
            loaded.push({ ...docSnap.data(), id: docSnap.id });
          });
          setDeletedFamilies(loaded);
        }, (error) => {
          console.error('Firestore admin deletedFamilies listener error:', error);
        });
        return () => unsubscribe();
      }

      const vIds = (assignedVillageIds && assignedVillageIds.length > 0)
        ? assignedVillageIds
        : deriveAssignedVillageIds(userProfile, villageRecords);

      if (!vIds || vIds.length === 0) {
        setDeletedFamilies([]);
        return;
      }

      const { names: targetNames, ids: targetIds } = getAssignedVillageQueryVariants(
        vIds, 
        userProfile?.assignedVillages || assignedVillages
      );

      const combinedDeletedMap = new Map();
      const unsubscribers = [];

      const syncCombinedDeleted = () => {
        setDeletedFamilies(Array.from(combinedDeletedMap.values()));
      };

      // Strategy 1: Collection query fallback
      try {
        const qCollection = collection(db, 'deletedFamilies');
        const unsub0 = onSnapshot(qCollection, (snapshot) => {
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const matchesVillage = vIds.some(vid => isFamilyInVillageRecord(data, vid, villageRecords));
            if (matchesVillage) {
              combinedDeletedMap.set(docSnap.id, { ...data, id: docSnap.id });
            }
          });
          syncCombinedDeleted();
        }, () => {});
        unsubscribers.push(unsub0);
      } catch (e) {}

      // Strategy 2: Single name queries
      targetNames.forEach(name => {
        try {
          const qSingle = query(collection(db, 'deletedFamilies'), where('village', '==', name));
          const unsub = onSnapshot(qSingle, (snapshot) => {
            snapshot.forEach(docSnap => {
              combinedDeletedMap.set(docSnap.id, { ...docSnap.data(), id: docSnap.id });
            });
            syncCombinedDeleted();
          }, () => {});
          unsubscribers.push(unsub);
        } catch (e) {}
      });

      // Strategy 3: Single ID queries
      targetIds.forEach(id => {
        try {
          const qIdSingle = query(collection(db, 'deletedFamilies'), where('villageId', '==', id));
          const unsub = onSnapshot(qIdSingle, (snapshot) => {
            snapshot.forEach(docSnap => {
              combinedDeletedMap.set(docSnap.id, { ...docSnap.data(), id: docSnap.id });
            });
            syncCombinedDeleted();
          }, () => {});
          unsubscribers.push(unsub);
        } catch (e) {}
      });

      return () => {
        unsubscribers.forEach(unsub => {
          try { unsub(); } catch (e) {}
        });
      };
    } catch (e) {
      console.error('Failed to initialize Firestore deletedFamilies listener:', e);
    }
  }, [currentUser, isAdmin, activeVillageIdsKey]);

  // Auto-migrate legacy family records in Firestore when Admin loads them
  useEffect(() => {
    if (!isAdmin || !currentUser) return;
    if (!rawFamilies || rawFamilies.length === 0) return;

    const unmigrated = rawFamilies.filter(f => !f.villageId || f.villageId === '');
    if (unmigrated.length > 0) {
      console.log(`Admin detected ${unmigrated.length} unmigrated family records. Running automatic backfill...`);
      migrateMissingVillageIds().then(res => {
        console.log('Automatic village ID migration completed:', res);
      }).catch(err => {
        console.warn('Automatic village ID migration non-fatal warning:', err);
      });
    }
  }, [isAdmin, currentUser, rawFamilies?.length]);

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
    return (rawFamilies || []).map(f => normalizeFamily(f, villageRecords));
  }, [rawFamilies, villageRecords]);

  const normalizedDeletedFamilies = useMemo(() => {
    return (deletedFamilies || []).map(f => normalizeFamily(f, villageRecords));
  }, [deletedFamilies, villageRecords]);

  // Helper function to match whether a family belongs to a village identifier (name, Hindi, English, or ID)
  const isFamilyInVillage = useCallback((family, villageIdentifier) => {
    return isFamilyInVillageRecord(family, villageIdentifier, villageRecords);
  }, [villageRecords]);

  // Scoped families according to user role and assigned villages
  const scopedFamilies = useMemo(() => {
    let result = allFamilies;

    // Strict Village-level Data Isolation for regular surveyors:
    if (!isAdmin) {
      if (!currentUser) return [];

      const vIds = (assignedVillageIds && assignedVillageIds.length > 0)
        ? assignedVillageIds
        : deriveAssignedVillageIds(userProfile, villageRecords);

      // If surveyor has NO assigned villages:
      if (!vIds || vIds.length === 0) {
        return []; // Strict isolation: Unassigned users cannot see or access village records
      }

      result = result.filter(f => {
        return vIds.some(vid => isFamilyInVillageRecord(f, vid, villageRecords));
      });
    }

    // Filter by selected village only for Admin (surveyors see all records for their assigned villages)
    if (isAdmin && selectedVillage && selectedVillage !== 'all') {
      result = result.filter(f => isFamilyInVillageRecord(f, selectedVillage, villageRecords));
    }

    return result;
  }, [allFamilies, isAdmin, currentUser, assignedVillageIds, selectedVillage, villageRecords]);

  // Records requiring Admin village review
  const needsReviewFamilies = useMemo(() => {
    return (allFamilies || []).filter(f => f.needsVillageReview);
  }, [allFamilies]);

  // Translation function
  const t = useCallback((key) => {
    return translations[language]?.[key] || key;
  }, [language]);

  // Add a single family with village validation
  const addFamily = async (family) => {
    if (isReadOnly) {
      throw new Error(language === 'hi' 
        ? 'आपके खाते को केवल देखने (View-Only) की अनुमति है। आप नए रिकॉर्ड नहीं जोड़ सकते।'
        : 'Your account has view-only permissions. You cannot add survey records.');
    }

    const vIds = (assignedVillageIds && assignedVillageIds.length > 0)
      ? assignedVillageIds
      : deriveAssignedVillageIds(userProfile, villageRecords);

    if (!isAdmin && (!vIds || vIds.length === 0)) {
      throw new Error(language === 'hi' 
        ? 'आपके खाते को अभी कोई गाँव आवंटित नहीं है। कृपया व्यवस्थापक द्वारा गाँव आवंटन की प्रतीक्षा करें।'
        : 'You cannot create surveys because no village has been assigned to your account. Please wait for an administrator to assign your village.');
    }

    const defaultVillage = activeVillages[0] || 'समोड़ी (Samodi)';
    let targetVillage = family.village;

    if (!isAdmin) {
      const isTargetAssigned = vIds.some(vid => isFamilyInVillageRecord({ village: targetVillage }, vid, villageRecords));
      if (!isTargetAssigned) {
        targetVillage = assignedVillages[0] || vIds[0] || defaultVillage;
      }
    } else {
      targetVillage = targetVillage || (selectedVillage !== 'all' ? selectedVillage : defaultVillage);
    }

    // Resolve canonical villageId and formatted display name
    const targetVillageId = resolveVillageId(targetVillage, villageRecords) || 'samodi';
    const targetVillageDisplay = getVillageDisplayName(targetVillage, villageRecords, language);

    const maxNum = (rawFamilies || []).reduce((max, f) => {
      const match = f.id && String(f.id).match(/FAM-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const newId = family.id || `FAM-${String(Math.max((rawFamilies || []).length + 1, maxNum + 1)).padStart(4, '0')}`;
    const newFamily = {
      ...family,
      id: newId,
      village: targetVillageDisplay || targetVillage,
      villageId: targetVillageId,
      needsVillageReview: false,
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
      throw err;
    }

    return newFamily;
  };

  // Bulk add families (for Excel import or standard dataset reload)
  const bulkAddFamilies = async (importedFamilies, options = {}) => {
    const { replaceAll = false } = options;

    if (isReadOnly) {
      throw new Error(language === 'hi' 
        ? 'आपके खाते को केवल देखने (View-Only) की अनुमति है। आप रिकॉर्ड आयात नहीं कर सकते।'
        : 'Your account has view-only permissions. You cannot import survey records.');
    }

    const vIds = (assignedVillageIds && assignedVillageIds.length > 0)
      ? assignedVillageIds
      : deriveAssignedVillageIds(userProfile, villageRecords);

    if (!isAdmin && (!vIds || vIds.length === 0)) {
      throw new Error(language === 'hi' 
        ? 'आपके खाते को अभी कोई गाँव आवंटित नहीं है। कृपया व्यवस्थापक द्वारा गाँव आवंटन की प्रतीक्षा करें।'
        : 'You cannot import surveys because no village has been assigned to your account.');
    }

    if (replaceAll) {
      try {
        await clearAllSurveyData();
      } catch (wipeErr) {
        console.warn('Wipe prior to replaceAll encountered warning (proceeding with clean overwrite):', wipeErr);
      }
    }

    let currentMax = replaceAll ? 0 : (rawFamilies || []).reduce((max, f) => {
      const match = f.id && String(f.id).match(/FAM-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);

    const defaultVillage = activeVillages[0] || 'समोड़ी (Samodi)';

    const prepared = importedFamilies.map((fam) => {
      let famId = fam.id;
      if (!famId) {
        currentMax += 1;
        famId = `FAM-${String(currentMax).padStart(4, '0')}`;
      }
      let targetVillage = fam.village;
      if (!isAdmin) {
        if (vIds && vIds.length > 0) {
          const isAssigned = vIds.some(vid => isFamilyInVillageRecord({ village: targetVillage }, vid, villageRecords));
          targetVillage = isAssigned ? targetVillage : (assignedVillages[0] || defaultVillage);
        }
      } else {
        targetVillage = targetVillage || (selectedVillage !== 'all' ? selectedVillage : defaultVillage);
      }

      const targetVillageId = resolveVillageId(targetVillage, villageRecords) || 'samodi';
      const targetVillageDisplay = getVillageDisplayName(targetVillage, villageRecords, language);

      return normalizeFamily({
        ...fam,
        id: famId,
        village: targetVillageDisplay || targetVillage,
        villageId: targetVillageId,
        needsVillageReview: false,
        surveyorId: (!isAdmin || !fam.surveyorId) ? (currentUser?.uid || '') : fam.surveyorId,
        surveyorName: fam.surveyorName || userProfile?.name || currentUser?.email?.split('@')[0] || 'Surveyor',
        surveyorEmail: fam.surveyorEmail || currentUser?.email || '',
        createdBy: fam.createdBy || currentUser?.uid || '',
        createdByName: userProfile?.name || currentUser?.email?.split('@')[0] || 'Surveyor',
        createdAt: fam.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, villageRecords);
    });

    setRawFamilies(prev => {
      if (replaceAll) return prepared;
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
      throw err;
    }

    return prepared;
  };

  // 1-Click Load or Restore the canonical 142-family Samodi survey dataset
  const loadStandard142Families = async () => {
    return await bulkAddFamilies(surveyData142, { replaceAll: true });
  };

  // Update a family (Allowed for assigned surveyors & admins, even in safe view/edit mode)
  const updateFamily = async (id, updatedFamily) => {
    if (!isAdmin) {
      const vIds = (assignedVillageIds && assignedVillageIds.length > 0)
        ? assignedVillageIds
        : deriveAssignedVillageIds(userProfile, villageRecords);

      if (!vIds || vIds.length === 0) {
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

    const targetVillage = updatedFamily.village;
    const targetVillageId = targetVillage ? resolveVillageId(targetVillage, villageRecords) : updatedFamily.villageId;
    const targetVillageDisplay = targetVillage ? getVillageDisplayName(targetVillage, villageRecords, language) : undefined;

    const enriched = {
      ...updatedFamily,
      ...(targetVillageId ? { villageId: targetVillageId } : {}),
      ...(targetVillageDisplay ? { village: targetVillageDisplay } : {}),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.uid || '',
      updatedByName: userProfile?.name || currentUser?.email?.split('@')[0] || 'User'
    };

    setRawFamilies(prev => prev.map(f => f.id === id ? { ...f, ...enriched } : f));
    try {
      await setDoc(doc(db, 'families', id), enriched, { merge: true });
    } catch (err) {
      console.error('Firestore updateFamily error:', err);
      throw err;
    }
  };

  // Delete a family (move to deletedFamilies - restricted for view-only / safe mode)
  const deleteFamily = async (id) => {
    if (isReadOnly) {
      throw new Error(language === 'hi' 
        ? 'आपके खाते को रिकॉर्ड हटाने (Delete) की अनुमति नहीं है। केवल व्यवस्थापक ही रिकॉर्ड हटा सकते हैं।'
        : 'Your account does not have permission to delete records. Only administrators can delete records.');
    }

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

  // Admin function: Completely wipe all survey families from database & cache
  const clearAllSurveyData = async () => {
    // 1. Immediately wipe local state & local storage
    setRawFamilies([]);
    setDeletedFamilies([]);
    try {
      localStorage.removeItem('villagepulse-families');
      localStorage.removeItem('villagepulse-deleted-families');
      localStorage.removeItem('grampulse-families');
      localStorage.removeItem('grampulse-deleted-families');
    } catch (e) {
      console.warn('LocalStorage clear error:', e);
    }

    // 2. Fetch and delete all documents in Firestore 'families' and 'deletedFamilies'
    try {
      const familiesSnap = await getDocs(collection(db, 'families'));
      const deletedSnap = await getDocs(collection(db, 'deletedFamilies'));

      const allDocs = [...familiesSnap.docs, ...deletedSnap.docs];
      const chunkSize = 400;

      for (let i = 0; i < allDocs.length; i += chunkSize) {
        const chunk = allDocs.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(d => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }

      return { success: true, count: allDocs.length };
    } catch (err) {
      console.error('Firestore clearAllSurveyData error:', err);
      throw err;
    }
  };

  // Reset all data: Purge survey data completely for clean production slate
  const resetData = async () => {
    await clearAllSurveyData();
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

  // Safe migration of older records missing villageId
  const migrateMissingVillageIds = async () => {
    if (!isAdmin) {
      throw new Error('Only administrators can perform village ID data migration.');
    }

    try {
      const snap = await getDocs(collection(db, 'families'));
      let migratedCount = 0;
      let reviewCount = 0;
      let alreadyValidCount = 0;
      const batch = writeBatch(db);
      let batchOps = 0;

      for (const d of snap.docs) {
        const data = d.data();
        const hasValidVillageId = data.villageId && (villageRecords || []).some(v => v.id === data.villageId);

        if (hasValidVillageId) {
          alreadyValidCount++;
        } else {
          const isUncertain = isRecordVillageUncertain(data, villageRecords);
          if (!isUncertain) {
            // Unambiguous and certain association: migrate to canonical villageId
            const canonicalId = resolveVillageId(data.village, villageRecords);
            const canonicalName = getVillageDisplayName(data.village, villageRecords);
            if (canonicalId) {
              batch.update(d.ref, {
                villageId: canonicalId,
                village: canonicalName || data.village,
                needsVillageReview: false,
                villageReviewReason: '',
                updatedAt: new Date().toISOString()
              });
              batchOps++;
              migratedCount++;
            }
          } else {
            // Uncertain association: flag for authorized Admin review (do NOT guess!)
            batch.update(d.ref, {
              needsVillageReview: true,
              villageReviewReason: 'Uncertain or missing village association',
              updatedAt: new Date().toISOString()
            });
            batchOps++;
            reviewCount++;
          }
        }
      }

      if (batchOps > 0) {
        await batch.commit();
      }

      return {
        migratedCount,
        reviewCount,
        alreadyValidCount,
        totalChecked: snap.docs.length
      };
    } catch (err) {
      console.error('migrateMissingVillageIds error:', err);
      throw err;
    }
  };

  // Admin assigns verified village to an uncertain record
  const resolveUncertainRecordVillage = async (familyId, targetVillageObj) => {
    if (!isAdmin) {
      throw new Error('Only administrators can verify and assign villages to flagged records.');
    }

    const vId = resolveVillageId(targetVillageObj, villageRecords);
    const vName = getVillageDisplayName(targetVillageObj, villageRecords, language);
    if (!vId) {
      throw new Error('Invalid village specified');
    }

    const payload = {
      villageId: vId,
      village: vName,
      needsVillageReview: false,
      villageReviewReason: '',
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.uid || ''
    };

    setRawFamilies(prev => prev.map(f => f.id === familyId ? { ...f, ...payload } : f));
    await setDoc(doc(db, 'families', familyId), payload, { merge: true });
    return payload;
  };

  return (
    <DataContext.Provider value={{
      families: scopedFamilies,
      allFamilies,
      deletedFamilies: normalizedDeletedFamilies,
      needsReviewFamilies,
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
      loadStandard142Families,
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
      clearAllSurveyData,
      exportData,
      importData,
      migrateMissingVillageIds,
      resolveUncertainRecordVillage
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
