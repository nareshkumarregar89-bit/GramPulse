import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { initialFamilies } from '../data/villageData';
import { mohallas as initialMohallas } from '../data/mohallas';
import { castes as initialCastes } from '../data/castes';
import { villages as initialVillages } from '../data/villages';
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

  return {
    ...f,
    village: f.village || (initialVillages[0] || 'रामपुरा (Rampura)'),
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

  const [rawFamilies, setRawFamilies] = useLocalStorage('grampulse-families', initialFamilies);
  const [deletedFamilies, setDeletedFamilies] = useLocalStorage('grampulse-deleted-families', []);
  const [villages, setVillages] = useLocalStorage('grampulse-villages', initialVillages);
  const [mohallas, setMohallas] = useLocalStorage('grampulse-mohallas', initialMohallas);
  const [castes, setCastes] = useLocalStorage('grampulse-castes', initialCastes);
  const [selectedVillage, setSelectedVillage] = useLocalStorage('grampulse-selected-village', 'all');
  const [darkMode, setDarkMode] = useLocalStorage('grampulse-darkmode', false);
  const [language, setLanguage] = useLocalStorage('grampulse-language', 'en');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Sync dark class on html root element for Tailwind dark: variants
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Real-time Firestore sync for families
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, 'families'), async (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty) {
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
  }, []);

  // Real-time Firestore sync for deletedFamilies
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, 'deletedFamilies'), (snapshot) => {
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
  }, []);

  // Real-time Firestore sync for settings (villages, mohallas & castes)
  useEffect(() => {
    try {
      const configDocRef = doc(db, 'settings', 'villageConfig');
      const unsubscribe = onSnapshot(configDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.villages && Array.isArray(data.villages)) setVillages(data.villages);
          if (data.mohallas && Array.isArray(data.mohallas)) setMohallas(data.mohallas);
          if (data.castes && Array.isArray(data.castes)) setCastes(data.castes);
        } else {
          try {
            await setDoc(configDocRef, {
              villages: initialVillages,
              mohallas: initialMohallas,
              castes: initialCastes
            });
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
  }, []);

  const allFamilies = useMemo(() => {
    return (rawFamilies || []).map(normalizeFamily);
  }, [rawFamilies]);

  const normalizedDeletedFamilies = useMemo(() => {
    return (deletedFamilies || []).map(normalizeFamily);
  }, [deletedFamilies]);

  // Scoped families according to user role and assigned villages
  const scopedFamilies = useMemo(() => {
    let result = allFamilies;

    // Strict Village-level Data Isolation:
    if (!isAdmin) {
      if (!currentUser) return [];

      // If user has assigned villages, restrict strictly to those assigned villages
      if (assignedVillages && assignedVillages.length > 0) {
        result = result.filter(f => assignedVillages.includes(f.village));
      } else {
        // Fallback: only families added by this user
        result = result.filter(f => 
          (f.surveyorId && f.surveyorId === currentUser.uid) ||
          (!f.surveyorId && currentUser.email && f.surveyorEmail === currentUser.email)
        );
      }
    }

    // Filter by selected village if not 'all'
    if (selectedVillage && selectedVillage !== 'all') {
      result = result.filter(f => (f.village || '').trim().toLowerCase() === selectedVillage.trim().toLowerCase());
    }

    return result;
  }, [allFamilies, isAdmin, currentUser, assignedVillages, selectedVillage]);

  // Translation function
  const t = useCallback((key) => {
    return translations[language]?.[key] || key;
  }, [language]);

  // Add a single family with village validation
  const addFamily = async (family) => {
    let targetVillage = family.village;
    if (!isAdmin) {
      if (assignedVillages && assignedVillages.length > 0) {
        if (!assignedVillages.includes(targetVillage)) {
          targetVillage = assignedVillages[0];
        }
      } else {
        targetVillage = targetVillage || (villages[0] || 'रामपुरा (Rampura)');
      }
    } else {
      targetVillage = targetVillage || (selectedVillage !== 'all' ? selectedVillage : (villages[0] || 'रामपुरा (Rampura)'));
    }

    const maxNum = (rawFamilies || []).reduce((max, f) => {
      const match = f.id && String(f.id).match(/FAM-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const newId = family.id || `FAM-${String(Math.max((rawFamilies || []).length + 1, maxNum + 1)).padStart(4, '0')}`;
    const newFamily = {
      ...family,
      id: newId,
      village: targetVillage,
      surveyorId: family.surveyorId || currentUser?.uid || '',
      surveyorName: family.surveyorName || userProfile?.name || currentUser?.email?.split('@')[0] || 'Surveyor',
      surveyorEmail: family.surveyorEmail || currentUser?.email || '',
      createdBy: currentUser?.uid || '',
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
    let currentMax = (rawFamilies || []).reduce((max, f) => {
      const match = f.id && String(f.id).match(/FAM-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);

    const prepared = importedFamilies.map((fam) => {
      currentMax += 1;
      const famId = fam.id || `FAM-${String(currentMax).padStart(4, '0')}`;
      let targetVillage = fam.village;
      if (!isAdmin) {
        if (assignedVillages && assignedVillages.length > 0) {
          targetVillage = assignedVillages.includes(targetVillage) ? targetVillage : assignedVillages[0];
        }
      } else {
        targetVillage = targetVillage || (selectedVillage !== 'all' ? selectedVillage : (villages[0] || 'रामपुरा (Rampura)'));
      }

      return normalizeFamily({
        ...fam,
        id: famId,
        village: targetVillage,
        surveyorId: fam.surveyorId || currentUser?.uid || '',
        surveyorName: fam.surveyorName || userProfile?.name || currentUser?.email?.split('@')[0] || 'Surveyor',
        surveyorEmail: fam.surveyorEmail || currentUser?.email || '',
        createdBy: currentUser?.uid || '',
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

  // Get family by id (with privacy protection)
  const getFamilyById = (id) => {
    if (isAdmin) {
      return allFamilies.find(f => f.id === id);
    }
    return scopedFamilies.find(f => f.id === id);
  };

  // Add Village
  const addVillage = async (village) => {
    if (!village || !village.trim()) return;
    const trimmed = village.trim();
    if (!villages.includes(trimmed)) {
      const nextVillages = [...villages, trimmed];
      setVillages(nextVillages);
      try {
        await setDoc(doc(db, 'settings', 'villageConfig'), { villages: nextVillages }, { merge: true });
      } catch (err) {
        console.error('Firestore addVillage error:', err);
      }
    }
  };

  // Delete Village
  const deleteVillage = async (village) => {
    const nextVillages = villages.filter(v => v !== village);
    setVillages(nextVillages);
    if (selectedVillage === village) {
      setSelectedVillage('all');
    }
    try {
      await setDoc(doc(db, 'settings', 'villageConfig'), { villages: nextVillages }, { merge: true });
    } catch (err) {
      console.error('Firestore deleteVillage error:', err);
    }
  };

  // Add mohalla
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

  // Delete mohalla
  const deleteMohalla = async (mohalla) => {
    const nextMohallas = mohallas.filter(m => m !== mohalla);
    setMohallas(nextMohallas);
    try {
      await setDoc(doc(db, 'settings', 'villageConfig'), { mohallas: nextMohallas }, { merge: true });
    } catch (err) {
      console.error('Firestore deleteMohalla error:', err);
    }
  };

  // Add caste
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

  // Delete caste
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
    setVillages(initialVillages);
    setMohallas(initialMohallas);
    setCastes(initialCastes);
    setSelectedVillage('all');
    try {
      const batch = writeBatch(db);
      initialFamilies.slice(0, 30).forEach((fam) => {
        batch.set(doc(db, 'families', fam.id), fam);
      });
      batch.set(doc(db, 'settings', 'villageConfig'), {
        villages: initialVillages,
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
      villages,
      mohallas,
      castes,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grampulse-data-${new Date().toISOString().split('T')[0]}.json`;
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
    if (data.villages && Array.isArray(data.villages)) {
      setVillages(data.villages);
      try {
        await setDoc(doc(db, 'settings', 'villageConfig'), { villages: data.villages }, { merge: true });
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
      villages,
      selectedVillage,
      setSelectedVillage,
      addVillage,
      deleteVillage,
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
