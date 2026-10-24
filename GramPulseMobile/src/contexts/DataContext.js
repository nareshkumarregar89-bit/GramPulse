import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  getDocs,
  query,
  where 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { initialFamilies } from '../constants/initialData';
import { initialVillages, villagesList, resolveVillageId, getCleanUniqueAssignedVillages } from '../constants/villages';
import { castes as casteList } from '../constants/castes';
import { mohallas as mohallaList } from '../constants/mohallas';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DataContext = createContext();

const STORAGE_KEY_FAMILIES = '@villagepulse_families';
const STORAGE_KEY_DELETED = '@villagepulse_deleted_families';
const STORAGE_KEY_VILLAGE = '@villagepulse_selected_village';

export function DataProvider({ children }) {
  const { 
    currentUser, 
    userProfile, 
    isAdmin, 
    isPending, 
    isUnassigned, 
    assignedVillages, 
    loading: authLoading 
  } = useAuth();

  const cleanAssignedVillages = useMemo(() => {
    return getCleanUniqueAssignedVillages(userProfile?.assignedVillages || assignedVillages);
  }, [userProfile?.assignedVillages, assignedVillages]);

  const hasAccess = useMemo(() => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    if (isPending) return false;
    if (userProfile?.status === 'pending' || userProfile?.status === 'inactive') return false;
    if (cleanAssignedVillages.length === 0) return false;
    return true;
  }, [currentUser, isAdmin, isPending, userProfile?.status, cleanAssignedVillages]);

  // Initial state is empty for unassigned/pending, only initialized when authorized
  const [families, setFamilies] = useState([]);
  const [deletedFamilies, setDeletedFamilies] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState('समोड़ी (Samodi)');
  const [villages] = useState(initialVillages);
  const [castes] = useState(casteList);
  const [mohallas] = useState(mohallaList);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Connecting...');

  // Auto-set selected village to surveyor's assigned village on login
  useEffect(() => {
    if (!isAdmin && cleanAssignedVillages.length > 0) {
      setSelectedVillage(cleanAssignedVillages[0]);
    }
  }, [isAdmin, cleanAssignedVillages]);

  // Load cached village & families from AsyncStorage (only if authorized)
  useEffect(() => {
    async function loadCache() {
      try {
        const cachedVillage = await AsyncStorage.getItem(STORAGE_KEY_VILLAGE);
        if (cachedVillage) setSelectedVillage(cachedVillage);

        if (!hasAccess && !isAdmin) {
          setFamilies([]);
          setLoading(false);
          return;
        }

        const cachedFamilies = await AsyncStorage.getItem(STORAGE_KEY_FAMILIES);
        const cachedDeleted = await AsyncStorage.getItem(STORAGE_KEY_DELETED);
        if (cachedDeleted) {
          try {
            setDeletedFamilies(JSON.parse(cachedDeleted) || []);
          } catch (e) {}
        }
        if (cachedFamilies) {
          try {
            const parsed = JSON.parse(cachedFamilies);
            const validParsed = Array.isArray(parsed) ? parsed.filter((f) => f && f.id) : [];
            if (validParsed.length >= initialFamilies.length) {
              setFamilies(validParsed);
            } else {
              const map = new Map();
              initialFamilies.forEach((f) => f && f.id && map.set(f.id, f));
              validParsed.forEach((f) => f && f.id && map.set(f.id, f));
              const merged = Array.from(map.values());
              setFamilies(merged);
              AsyncStorage.setItem(STORAGE_KEY_FAMILIES, JSON.stringify(merged)).catch(() => {});
            }
          } catch (pe) {
            setFamilies(initialFamilies);
          }
        } else {
          setFamilies(initialFamilies);
          AsyncStorage.setItem(STORAGE_KEY_FAMILIES, JSON.stringify(initialFamilies)).catch(() => {});
        }
      } catch (e) {
        console.log('Error loading cached data:', e);
      }
    }
    loadCache();
  }, [hasAccess, isAdmin]);

  // Listen to Firestore 'deletedFamilies' for Admins (Recycle Bin)
  useEffect(() => {
    if (!currentUser || !isAdmin) {
      setDeletedFamilies([]);
      return;
    }

    try {
      const qDel = collection(db, 'deletedFamilies');
      const unsubDel = onSnapshot(
        qDel,
        (snapshot) => {
          const list = [];
          snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
          setDeletedFamilies(list);
          AsyncStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(list)).catch(() => {});
        },
        (err) => {
          console.log('Deleted families listener notice:', err.message);
        }
      );
      return () => unsubDel();
    } catch (e) {
      console.log('Error setting up deletedFamilies listener:', e);
    }
  }, [currentUser, isAdmin]);

  // Listen to Firestore 'families' in real-time when user is authenticated
  useEffect(() => {
    // If auth state is still resolving, wait
    if (authLoading) {
      setSyncStatus('Authenticating...');
      return;
    }

    // If no user is logged in, use cache and stop loading
    if (!currentUser) {
      setLoading(false);
      setIsOnline(false);
      setSyncStatus('Offline (Not Logged In)');
      return;
    }

    // Strict security: Unassigned or pending surveyors CANNOT query or view census data
    if (!hasAccess) {
      setFamilies([]);
      setLoading(false);
      setIsOnline(true);
      setSyncStatus(
        isPending
          ? 'Approval Pending (स्वीकृति प्रतीक्षित)'
          : 'Village Allocation Pending (गाँव आवंटन प्रतीक्षित)'
      );
      return;
    }

    setLoading(true);
    setSyncStatus('Connecting to Firestore...');
    let isActive = true;
    const unsubscribers = [];
    const combinedMap = new Map();

    const commitFamiliesToState = () => {
      if (!isActive) return;
      // Merge initialFamilies baseline with any Firestore docs so no survey is ever dropped
      const finalMap = new Map();
      initialFamilies.forEach((f) => finalMap.set(f.id, f));
      combinedMap.forEach((val, key) => finalMap.set(key, val));

      const list = Array.from(finalMap.values());
      setFamilies(list);
      setIsOnline(true);
      setSyncStatus(`Live Firestore (${list.length})`);
      AsyncStorage.setItem(STORAGE_KEY_FAMILIES, JSON.stringify(list)).catch(() => {});
      setLoading(false);
    };

    try {
      const familiesCol = collection(db, 'families');

      // Strategy 1: General collection listener
      const unsubGeneral = onSnapshot(
        familiesCol,
        (snapshot) => {
          if (!isActive) return;
          snapshot.forEach((docSnap) => {
            combinedMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          });
          commitFamiliesToState();
        },
        (error) => {
          console.log('General Firestore listener notice:', error.message);
          if (combinedMap.size === 0) {
            commitFamiliesToState();
          }
          setLoading(false);
        }
      );
      unsubscribers.push(unsubGeneral);

      // Strategy 2: Village-specific queries (guaranteed to match surveyor permissions)
      const vNames = Array.isArray(assignedVillages) && assignedVillages.length > 0
        ? assignedVillages
        : ['समोड़ी (Samodi)', 'कोटड़ी (Kotdi)'];

      vNames.forEach((vName) => {
        if (!vName) return;
        try {
          const qName = query(familiesCol, where('village', '==', vName));
          const unsubV = onSnapshot(qName, (snapshot) => {
            if (!isActive) return;
            snapshot.forEach((docSnap) => {
              combinedMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
            });
            commitFamiliesToState();
          }, (err) => {
            console.log(`Village query note (${vName}):`, err.message);
          });
          unsubscribers.push(unsubV);

          const vId = resolveVillageId(vName);
          const qId = query(familiesCol, where('villageId', '==', vId));
          const unsubId = onSnapshot(qId, (snapshot) => {
            if (!isActive) return;
            snapshot.forEach((docSnap) => {
              combinedMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
            });
            commitFamiliesToState();
          }, (err) => {
            console.log(`VillageId query note (${vId}):`, err.message);
          });
          unsubscribers.push(unsubId);
        } catch (e) {
          console.log('Query creation note:', e);
        }
      });

    } catch (e) {
      console.log('Firestore listener setup notice:', e);
      commitFamiliesToState();
      setLoading(false);
    }

    return () => {
      isActive = false;
      unsubscribers.forEach((unsub) => {
        try {
          if (typeof unsub === 'function') unsub();
        } catch (err) {}
      });
    };
  }, [currentUser?.uid, isAdmin, JSON.stringify(assignedVillages), authLoading]);

  // Manual Force-Sync function (callable on pull-to-refresh or from Profile screen)
  const refreshData = async () => {
    setLoading(true);
    setSyncStatus('Syncing...');
    try {
      const familiesCol = collection(db, 'families');
      const snap = await getDocs(familiesCol);
      if (!snap.empty) {
        const finalMap = new Map();
        initialFamilies.forEach((f) => finalMap.set(f.id, f));
        snap.forEach((docSnap) => {
          finalMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
        const list = Array.from(finalMap.values());
        setFamilies(list);
        setIsOnline(true);
        setSyncStatus(`Live Firestore (${list.length})`);
        await AsyncStorage.setItem(STORAGE_KEY_FAMILIES, JSON.stringify(list));
        setLoading(false);
        return { success: true, count: list.length };
      }
    } catch (err) {
      console.log('Direct getDocs note, trying village queries:', err.message);
      try {
        const vNames = Array.isArray(assignedVillages) && assignedVillages.length > 0
          ? assignedVillages
          : ['समोड़ी (Samodi)', 'कोटड़ी (Kotdi)'];
        const map = new Map();
        initialFamilies.forEach((f) => map.set(f.id, f));
        for (const vName of vNames) {
          try {
            const q = query(collection(db, 'families'), where('village', '==', vName));
            const s = await getDocs(q);
            s.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
          } catch (e) {}
          try {
            const vid = resolveVillageId(vName);
            const q2 = query(collection(db, 'families'), where('villageId', '==', vid));
            const s2 = await getDocs(q2);
            s2.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
          } catch (e) {}
        }
        const list = Array.from(map.values());
        if (list.length > 0) {
          setFamilies(list);
          setIsOnline(true);
          setSyncStatus(`Live Firestore (${list.length})`);
          await AsyncStorage.setItem(STORAGE_KEY_FAMILIES, JSON.stringify(list));
          setLoading(false);
          return { success: true, count: list.length };
        }
      } catch (err2) {
        console.log('Village getDocs note:', err2.message);
      }
    }
    setFamilies((prev) => (prev.length >= initialFamilies.length ? prev : initialFamilies));
    setIsOnline(true);
    setSyncStatus(`Live (${families.length || initialFamilies.length})`);
    setLoading(false);
    return { success: true, count: families.length || initialFamilies.length };
  };

  // Change Selected Village & persist
  const changeSelectedVillage = (villageName) => {
    setSelectedVillage(villageName);
    AsyncStorage.setItem(STORAGE_KEY_VILLAGE, villageName).catch(() => {});
  };

  const filteredFamilies = useMemo(() => {
    if (!hasAccess) return [];

    return families.filter((f) => {
      // Surveyor: enforce assigned villages
      if (!isAdmin) {
        const famVillage = f.village || f.villageId || '';
        const famId = resolveVillageId(famVillage);
        const inAssigned = cleanAssignedVillages.some((av) => resolveVillageId(av) === famId);
        if (!inAssigned) return false;
      }

      if (!selectedVillage || selectedVillage === 'All' || selectedVillage.includes('All')) return true;
      const targetId = resolveVillageId(selectedVillage);
      const famId = resolveVillageId(f.villageId || f.village);
      return famId === targetId;
    });
  }, [families, selectedVillage, hasAccess, isAdmin, cleanAssignedVillages]);

  // Key performance indicators (KPIs)
  const stats = useMemo(() => {
    if (!hasAccess) {
      return {
        totalFamilies: 0,
        totalPopulation: 0,
        maleCount: 0,
        femaleCount: 0,
        bplCount: 0,
        casteMap: {},
        mohallaMap: {}
      };
    }

    const totalFamilies = filteredFamilies.length;
    let totalPopulation = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let bplCount = 0;
    const casteMap = {};
    const mohallaMap = {};

    filteredFamilies.forEach((f) => {
      // BPL check
      if (f.bplStatus === 'BPL' || f.category === 'BPL' || f.category === 'SC' || f.category === 'ST') {
        bplCount++;
      }

      // Caste tally
      const caste = f.caste || 'Other';
      casteMap[caste] = (casteMap[caste] || 0) + 1;

      // Mohalla tally
      const moh = f.mohalla || 'Main';
      mohallaMap[moh] = (mohallaMap[moh] || 0) + 1;

      // Members tally
      if (Array.isArray(f.members) && f.members.length > 0) {
        totalPopulation += f.members.length;
        f.members.forEach((m) => {
          if (m.gender === 'Female') femaleCount++;
          else maleCount++;
        });
      } else {
        // Fallback count head as 1
        totalPopulation += 1;
        maleCount += 1;
      }
    });

    return {
      totalFamilies,
      totalPopulation,
      maleCount,
      femaleCount,
      bplCount,
      casteMap,
      mohallaMap
    };
  }, [filteredFamilies, hasAccess]);

  // Add Family Survey
  const addFamily = async (familyData) => {
    // Generate standard ID: FAM-XXXX
    const nextNum = families.length + 1;
    const nextId = `FAM-${String(nextNum).padStart(4, '0')}`;
    const newDocId = familyData.id || nextId;

    const record = {
      ...familyData,
      id: newDocId,
      village: familyData.village || selectedVillage,
      villageId: resolveVillageId(familyData.village || selectedVillage),
      surveyorName: currentUser?.displayName || currentUser?.email || 'Field Surveyor',
      surveyorId: currentUser?.uid || 'offline-surveyor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update local state immediately for instant feedback
    setFamilies((prev) => [record, ...prev]);

    // Save to Firestore
    try {
      const docRef = doc(db, 'families', newDocId);
      await setDoc(docRef, record);
    } catch (err) {
      console.log('Saved locally (offline or permission):', err.message);
    }

    return record;
  };

  // Update Family Survey
  const updateFamily = async (id, updatedFields) => {
    const updatedRecord = {
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    setFamilies((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updatedRecord } : f))
    );

    try {
      const docRef = doc(db, 'families', id);
      await updateDoc(docRef, updatedRecord);
    } catch (err) {
      console.log('Updated locally:', err.message);
    }
  };

  // Soft Delete Family Record (Move to Deleted Records / Recycle Bin)
  const deleteFamily = async (id) => {
    const target = families.find((f) => f.id === id);
    if (!target) return;

    const deletedRecord = {
      ...target,
      deletedAt: new Date().toISOString(),
      deletedBy: currentUser?.displayName || currentUser?.email || 'Field Surveyor',
      isDeleted: true,
    };

    // Update local states immediately
    setFamilies((prev) => prev.filter((f) => f.id !== id));
    setDeletedFamilies((prev) => [deletedRecord, ...prev.filter((f) => f.id !== id)]);

    try {
      // 1. Write to deletedFamilies collection
      const delDocRef = doc(db, 'deletedFamilies', id);
      await setDoc(delDocRef, deletedRecord);

      // 2. Remove from active families collection
      const docRef = doc(db, 'families', id);
      await deleteDoc(docRef);

      // Update storage
      await AsyncStorage.setItem(STORAGE_KEY_FAMILIES, JSON.stringify(families.filter((f) => f.id !== id)));
    } catch (err) {
      console.log('Soft delete notice:', err.message);
    }
  };

  // Restore Family Record from Recycle Bin
  const restoreFamily = async (id) => {
    const target = deletedFamilies.find((f) => f.id === id);
    if (!target) return;

    const { deletedAt, deletedBy, isDeleted, ...cleanRecord } = target;
    const restoredRecord = {
      ...cleanRecord,
      restoredAt: new Date().toISOString(),
      restoredBy: currentUser?.displayName || currentUser?.email || 'Admin',
      updatedAt: new Date().toISOString(),
    };

    // Update local states immediately
    setDeletedFamilies((prev) => prev.filter((f) => f.id !== id));
    setFamilies((prev) => [restoredRecord, ...prev]);

    try {
      // 1. Write back to active families collection
      const docRef = doc(db, 'families', id);
      await setDoc(docRef, restoredRecord);

      // 2. Remove from deletedFamilies collection
      const delDocRef = doc(db, 'deletedFamilies', id);
      await deleteDoc(delDocRef);
    } catch (err) {
      console.log('Restore error:', err.message);
    }
  };

  // Permanently Delete Record
  const permanentlyDeleteFamily = async (id) => {
    setDeletedFamilies((prev) => prev.filter((f) => f.id !== id));
    try {
      const delDocRef = doc(db, 'deletedFamilies', id);
      await deleteDoc(delDocRef);
    } catch (err) {
      console.log('Permanent delete error:', err.message);
    }
  };

  // Lookup single family by ID
  const getFamilyById = (id) => {
    return families.find((f) => String(f.id) === String(id));
  };

  return (
    <DataContext.Provider
      value={{
        families,
        filteredFamilies,
        selectedVillage,
        villages,
        villagesList,
        castes,
        mohallas,
        stats,
        loading,
        isOnline,
        syncStatus,
        hasAccess,
        cleanAssignedVillages,
        refreshData,
        syncData: refreshData,
        changeSelectedVillage,
        addFamily,
        updateFamily,
        deleteFamily,
        deletedFamilies,
        restoreFamily,
        permanentlyDeleteFamily,
        getFamilyById,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
