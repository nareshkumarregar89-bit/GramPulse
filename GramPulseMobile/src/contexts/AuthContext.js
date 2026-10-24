import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const SUPER_ADMIN_UID = 'sJwiZZ6cf8Ze8YAmMMK8T1FwF232';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState('surveyor'); // 'admin' | 'surveyor'
  const [assignedVillages, setAssignedVillages] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Check super admin status
  const isAdmin = currentUser?.uid === SUPER_ADMIN_UID || userRole === 'admin' || userProfile?.role === 'admin';
  const isPending = userProfile?.status === 'pending';
  const isInactive = userProfile?.status === 'inactive';
  const isUnassigned = !isAdmin && (!assignedVillages || assignedVillages.length === 0);

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (user) {
        setCurrentUser(user);

        // Check if user is hardcoded Super Admin
        if (user.uid === SUPER_ADMIN_UID) {
          setUserRole('admin');
          setAssignedVillages(['समोड़ी (Samodi)', 'कोटड़ी (Kotdi)']);
        }

        // Listen to Firestore User Document in real-time
        try {
          const userDocRef = doc(db, 'users', user.uid);
          unsubscribeDoc = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              setUserProfile(data);
              const role = user.uid === SUPER_ADMIN_UID ? 'admin' : (data.role || 'surveyor');
              setUserRole(role);
              
              if (role === 'admin') {
                setAssignedVillages(['समोड़ी (Samodi)', 'कोटड़ी (Kotdi)']);
              } else if (Array.isArray(data.assignedVillages)) {
                setAssignedVillages(data.assignedVillages);
              } else if (data.assignedVillage) {
                setAssignedVillages([data.assignedVillage]);
              } else {
                setAssignedVillages([]);
              }
            } else {
              // Create user profile document if missing
              const isSuper = user.uid === SUPER_ADMIN_UID;
              const newProf = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || user.email?.split('@')[0] || 'Surveyor',
                role: isSuper ? 'admin' : 'surveyor',
                status: isSuper ? 'active' : 'pending',
                assignmentStatus: isSuper ? 'Assigned' : 'Unassigned',
                assignedVillages: isSuper ? ['समोड़ी (Samodi)', 'कोटड़ी (Kotdi)'] : [],
                assignedVillageIds: isSuper ? ['samodi', 'kotdi'] : [],
                createdAt: new Date().toISOString()
              };
              setDoc(userDocRef, newProf).catch(console.error);
              setUserProfile(newProf);
              setUserRole(newProf.role);
              setAssignedVillages(newProf.assignedVillages);
            }
          }, (err) => {
            console.log('User snapshot notice:', err.message);
            setUserProfile({
              uid: user.uid,
              email: user.email,
              name: user.displayName || 'Surveyor',
              role: user.uid === SUPER_ADMIN_UID ? 'admin' : 'surveyor'
            });
          });
        } catch (e) {
          console.log('Profile setup error:', e);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setUserRole('surveyor');
        setAssignedVillages([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  // Listen to all users for Admin
  useEffect(() => {
    if (!isAdmin) {
      setAllUsers([]);
      return;
    }
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const uList = [];
      snap.forEach((d) => uList.push({ ...d.data(), uid: d.id }));
      setAllUsers(uList);
    }, (err) => {
      console.log('AllUsers snapshot note:', err.message);
    });
    return () => unsub();
  }, [isAdmin]);

  // Login
  const login = async (email, password) => {
    setAuthError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      return cred.user;
    } catch (err) {
      let msg = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'अमान्य ईमेल या पासवर्ड। कृपया पुनः प्रयास करें।';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'इस ईमेल से कोई खाता नहीं मिला। कृपया पहले साइन अप करें।';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'कृपया मान्य ईमेल आईडी दर्ज करें।';
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Register - creates unassigned surveyor requiring admin approval
  const register = async (email, password, displayName, mobileNumber = '') => {
    setAuthError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      // Create user doc in Firestore matching web schema
      const userRef = doc(db, 'users', cred.user.uid);
      const newProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        name: displayName || cred.user.email?.split('@')[0] || 'Surveyor',
        mobile: mobileNumber || '',
        role: 'surveyor',
        status: 'pending', // Requires admin approval
        assignmentStatus: 'Unassigned', // Requires admin village assignment
        assignedVillages: [],
        assignedVillageIds: [],
        assignedVillageId: null,
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, newProfile);
      return cred.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Password Reset Email
  const sendPasswordReset = async (email) => {
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err) {
      let msg = err.message;
      if (err.code === 'auth/user-not-found') {
        msg = 'इस ईमेल से कोई खाता पंजीकृत नहीं है।';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'कृपया सही ईमेल दर्ज करें।';
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Admin Actions: Approve Surveyor
  const approveUser = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        status: 'active',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser?.uid || ''
      });
      return true;
    } catch (err) {
      console.error('Approve user error:', err);
      throw err;
    }
  };

  // Admin Actions: Assign Village to Surveyor
  const assignVillageToUser = async (uid, villageName, villageId) => {
    try {
      const userRef = doc(db, 'users', uid);
      
      // Clear / Unassign
      if (!villageName || villageName === 'unassign' || villageName === 'none') {
        await updateDoc(userRef, {
          assignedVillages: [],
          assignedVillageIds: [],
          assignedVillageId: null,
          assignmentStatus: 'Unassigned',
          status: 'pending',
          updatedAt: new Date().toISOString(),
          assignedBy: currentUser?.uid || ''
        });
        return true;
      }

      // All Villages
      const lower = String(villageName).toLowerCase();
      if (lower === 'all' || lower.includes('सभी') || villageName === 'सभी गाँव (All Access)') {
        await updateDoc(userRef, {
          assignedVillages: ['समोड़ी (Samodi)', 'कोटड़ी (Kotdi)'],
          assignedVillageIds: ['samodi', 'kotdi'],
          assignedVillageId: 'all',
          assignmentStatus: 'Assigned',
          status: 'active',
          assignedAt: new Date().toISOString(),
          assignedBy: currentUser?.uid || ''
        });
        return true;
      }

      // Single Village
      const vId = villageId || (lower.includes('kotdi') || villageName.includes('कोट') ? 'kotdi' : 'samodi');
      const vName = vId === 'kotdi' ? 'कोटड़ी (Kotdi)' : 'समोड़ी (Samodi)';
      
      await updateDoc(userRef, {
        assignedVillages: [vName],
        assignedVillageIds: [vId],
        assignedVillageId: vId,
        assignmentStatus: 'Assigned',
        status: 'active',
        assignedAt: new Date().toISOString(),
        assignedBy: currentUser?.uid || ''
      });
      return true;
    } catch (err) {
      console.error('Assign village error:', err);
      throw err;
    }
  };

  // Admin Actions: Toggle User Active/Inactive
  const toggleUserStatus = async (uid, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
      return nextStatus;
    } catch (err) {
      console.error('Toggle status error:', err);
      throw err;
    }
  };

  // Admin Actions: Delete User Profile
  const deleteUser = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      await deleteDoc(userRef);
      return true;
    } catch (err) {
      console.error('Delete user error:', err);
      throw err;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      setCurrentUser(null);
      setUserProfile(null);
      setUserRole('surveyor');
      setAssignedVillages([]);
    } catch (err) {
      console.log('Logout notice:', err);
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        userRole,
        isAdmin,
        isPending,
        isInactive,
        isUnassigned,
        assignedVillages,
        allUsers,
        loading,
        authError,
        login,
        register,
        sendPasswordReset,
        approveUser,
        assignVillageToUser,
        toggleUserStatus,
        deleteUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
