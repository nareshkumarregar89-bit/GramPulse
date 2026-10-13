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
import { translations } from '../utils/translations';

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
    familyHeadName: headName,
    familyHeadNameEnglish: headNameEn || headName,
    familyHeadNameHindi: headNameHi || headName,
    fatherName,
    fatherNameEnglish: fatherNameEn || fatherName,
    fatherNameHindi: fatherNameHi || fatherName,
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
  const [families, setFamilies] = useLocalStorage('grampulse-families', initialFamilies);
  const [deletedFamilies, setDeletedFamilies] = useLocalStorage('grampulse-deleted-families', []);
  const [mohallas, setMohallas] = useLocalStorage('grampulse-mohallas', initialMohallas);
  const [castes, setCastes] = useLocalStorage('grampulse-castes', initialCastes);
  const [darkMode, setDarkMode] = useLocalStorage('grampulse-darkmode', false);
  const [language, setLanguage] = useLocalStorage('grampulse-language', 'en');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Real-time Firestore sync for families
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, 'families'), async (snapshot) => {
        setIsFirebaseConnected(true);
        if (snapshot.empty) {
          // Initialize empty Firestore with initial families
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
          setFamilies(loaded);
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

  // Real-time Firestore sync for settings (mohallas & castes)
  useEffect(() => {
    try {
      const configDocRef = doc(db, 'settings', 'villageConfig');
      const unsubscribe = onSnapshot(configDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.mohallas && Array.isArray(data.mohallas)) setMohallas(data.mohallas);
          if (data.castes && Array.isArray(data.castes)) setCastes(data.castes);
        } else {
          try {
            await setDoc(configDocRef, {
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

  const normalizedFamilies = useMemo(() => {
    return (families || []).map(normalizeFamily);
  }, [families]);

  const normalizedDeletedFamilies = useMemo(() => {
    return (deletedFamilies || []).map(normalizeFamily);
  }, [deletedFamilies]);
  
  // Translation function
  const t = useCallback((key) => {
    return translations[language][key] || key;
  }, [language]);

  // Add a family
  const addFamily = async (family) => {
    const maxNum = (families || []).reduce((max, f) => {
      const match = f.id && String(f.id).match(/FAM-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const newId = family.id || `FAM-${String(Math.max((families || []).length + 1, maxNum + 1)).padStart(4, '0')}`;
    const newFamily = {
      ...family,
      id: newId,
      createdAt: new Date().toISOString()
    };
    
    // Immediate local state update
    setFamilies(prev => [...prev.filter(f => f.id !== newId), newFamily]);

    // Push to Firestore
    try {
      await setDoc(doc(db, 'families', newId), newFamily);
    } catch (err) {
      console.error('Firestore addFamily error:', err);
    }

    return newFamily;
  };

  // Update a family
  const updateFamily = async (id, updatedFamily) => {
    setFamilies(prev => prev.map(f => f.id === id ? { ...f, ...updatedFamily } : f));
    try {
      await setDoc(doc(db, 'families', id), updatedFamily, { merge: true });
    } catch (err) {
      console.error('Firestore updateFamily error:', err);
    }
  };

  // Delete a family (move to deletedFamilies)
  const deleteFamily = async (id) => {
    const familyToDelete = families.find(f => f.id === id);
    if (familyToDelete) {
      const deletedRecord = { ...familyToDelete, deletedAt: new Date().toISOString() };
      setDeletedFamilies(prev => [...prev, deletedRecord]);
      setFamilies(prev => prev.filter(f => f.id !== id));
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
      setFamilies(prev => [...prev, restoredFamily]);
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

  // Get family by id
  const getFamilyById = (id) => {
    return normalizedFamilies.find(f => f.id === id);
  };

  // Add mohalla
  const addMohalla = async (mohalla) => {
    if (!mohallas.includes(mohalla)) {
      const nextMohallas = [...mohallas, mohalla];
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
    if (!castes.includes(caste)) {
      const nextCastes = [...castes, caste];
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
    setFamilies(initialFamilies);
    setMohallas(initialMohallas);
    setCastes(initialCastes);
    try {
      const batch = writeBatch(db);
      initialFamilies.slice(0, 30).forEach((fam) => {
        batch.set(doc(db, 'families', fam.id), fam);
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
      families: normalizedFamilies,
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
      setFamilies(data.families);
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
      families: normalizedFamilies,
      deletedFamilies: normalizedDeletedFamilies,
      mohallas,
      castes,
      darkMode,
      setDarkMode,
      language,
      setLanguage,
      t,
      isFirebaseConnected,
      addFamily,
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
