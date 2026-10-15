import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  getAuth
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
import { initializeApp, getApps } from 'firebase/app';
import { auth, db } from '../firebase';

const AuthContext = createContext();

// Super Admin UID
const SUPER_ADMIN_UID = 'sJwiZZ6cf8Ze8YAmMMK8T1FwF232';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user was marked deleted or deactivated
          try {
            const deletedSnap = await getDoc(doc(db, 'deletedUsers', user.uid));
            if (deletedSnap.exists()) {
              await signOut(auth);
              setCurrentUser(null);
              setUserRole(null);
              setUserProfile(null);
              setAuthError('Your account has been deleted by the administrator.');
              setLoading(false);
              return;
            }
          } catch (delCheckErr) {
            // Ignored if deletedUsers is not readable by rules
          }

          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();

            // Deactivated or deleted user check
            if ((data.status === 'inactive' || data.status === 'deleted' || data.isDeleted) && user.uid !== SUPER_ADMIN_UID) {
              await signOut(auth);
              setCurrentUser(null);
              setUserRole(null);
              setUserProfile(null);
              setAuthError('Your account has been deactivated or deleted by the administrator.');
              setLoading(false);
              return;
            }

            setCurrentUser(user);
            const role = data.role || (user.uid === SUPER_ADMIN_UID ? 'admin' : 'surveyor');
            setUserRole(role);
            setUserProfile({
              ...data,
              role,
              assignedVillages: data.assignedVillages || (data.assignedVillage ? [data.assignedVillage] : [])
            });
          } else {
            // Initial profile creation
            const isSuperAdmin = user.uid === SUPER_ADMIN_UID;
            const newProfile = {
              uid: user.uid,
              email: user.email,
              name: isSuperAdmin ? 'Admin' : (user.email ? user.email.split('@')[0] : 'Surveyor'),
              role: isSuperAdmin ? 'admin' : 'surveyor',
              assignedVillages: isSuperAdmin ? [] : ['समोड़ी (Samodi)'],
              status: 'active',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setCurrentUser(user);
            setUserRole(newProfile.role);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching user role from Firestore:', error);
          setCurrentUser(user);
          setUserRole(user.uid === SUPER_ADMIN_UID ? 'admin' : 'surveyor');
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen for all users if logged in as admin
  useEffect(() => {
    if (userRole === 'admin') {
      try {
        const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
          const usersList = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            // Exclude soft-deleted users
            if (!data.isDeleted && data.status !== 'deleted') {
              usersList.push({ ...data, uid: docSnap.id });
            }
          });
          setAllUsers(usersList);
        }, (err) => {
          console.error('Error loading users list:', err);
        });

        return () => unsubscribe();
      } catch (e) {
        console.error('Users collection listener error:', e);
      }
    } else {
      setAllUsers([]);
    }
  }, [userRole]);

  const login = async (email, password) => {
    setAuthError('');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Double check status upon login
    try {
      try {
        const delSnap = await getDoc(doc(db, 'deletedUsers', cred.user.uid));
        if (delSnap.exists()) {
          await signOut(auth);
          throw new Error('Your account has been deleted by the administrator.');
        }
      } catch (delErr) {
        if (delErr.message.includes('deleted')) throw delErr;
      }

      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if ((data.status === 'inactive' || data.status === 'deleted' || data.isDeleted) && cred.user.uid !== SUPER_ADMIN_UID) {
          await signOut(auth);
          throw new Error('Your account has been deactivated by the administrator.');
        }
      }
    } catch (e) {
      if (e.message.includes('deactivated') || e.message.includes('deleted')) throw e;
    }
    return cred;
  };

  const logout = () => {
    return signOut(auth);
  };

  const signInWithGoogle = async () => {
    setAuthError('');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;

    // Check or initialize Firestore profile
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.status === 'inactive' && user.uid !== SUPER_ADMIN_UID) {
          await signOut(auth);
          throw new Error('Your account has been deactivated by the administrator.');
        }
      } else {
        const isSuperAdmin = user.uid === SUPER_ADMIN_UID;
        const newProfile = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
          photoURL: user.photoURL || '',
          role: isSuperAdmin ? 'admin' : 'surveyor',
          assignedVillages: isSuperAdmin ? [] : ['समोड़ी (Samodi)'],
          status: 'active',
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile);
      }
    } catch (e) {
      if (e.message.includes('deactivated')) throw e;
      console.warn('Firestore profile check for Google user:', e);
    }
    return cred;
  };

  // Admin function: Create user without signing out Admin
  const createUserByAdmin = async ({ name, email, password, role, assignedVillages }) => {
    const secondaryAppName = 'SecondaryAuthApp';
    const existingApp = getApps().find(a => a.name === secondaryAppName);
    const secondaryApp = existingApp || initializeApp(auth.app.options, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
      const newUid = userCred.user.uid;

      const profile = {
        uid: newUid,
        email: email.trim(),
        name: name.trim() || email.split('@')[0],
        role: role || 'surveyor',
        assignedVillages: Array.isArray(assignedVillages) ? assignedVillages : [],
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', newUid), profile);
      await signOut(secondaryAuth);
      return profile;
    } catch (err) {
      console.error('Failed to create user by admin:', err);
      throw err;
    }
  };

  // Admin function: Update user details
  const updateUserByAdmin = async (uid, updates) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const payload = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(userDocRef, payload);
    } catch (err) {
      console.error('Failed to update user:', err);
      throw err;
    }
  };

  // Admin function: Toggle active/inactive
  const toggleUserStatus = async (uid, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateUserByAdmin(uid, { status: nextStatus });
    return nextStatus;
  };

  // Admin function: Send password reset email
  const sendUserPasswordReset = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Admin function: Delete user account
  const deleteUserByAdmin = async (uid, userData = {}) => {
    if (uid === SUPER_ADMIN_UID) {
      throw new Error('Super Admin account cannot be deleted.');
    }
    if (uid === currentUser?.uid) {
      throw new Error('You cannot delete your own account.');
    }

    const userDocRef = doc(db, 'users', uid);
    let isDeleted = false;

    // 1. Attempt hard delete directly from Firestore
    try {
      await deleteDoc(userDocRef);
      isDeleted = true;
    } catch (delErr) {
      console.warn('deleteDoc failed, falling back to soft-delete:', delErr);
    }

    // 2. If deleteDoc was blocked by Firestore rules, fallback to soft-delete
    if (!isDeleted) {
      try {
        await updateDoc(userDocRef, {
          status: 'deleted',
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser?.uid || ''
        });
        isDeleted = true;
      } catch (updErr) {
        console.error('Both deleteDoc and updateDoc failed:', updErr);
        throw new Error(updErr.code === 'permission-denied'
          ? 'Permission Denied: Please verify admin permissions in Firestore Rules.'
          : (updErr.message || 'Failed to delete user'));
      }
    }

    // Immediately remove from local state for instant UI update
    setAllUsers(prev => prev.filter(u => u.uid !== uid));

    // 3. Optional audit log in deletedUsers (non-fatal if deletedUsers rule is absent)
    try {
      await setDoc(doc(db, 'deletedUsers', uid), {
        uid,
        email: userData.email || '',
        name: userData.name || '',
        role: userData.role || 'surveyor',
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.uid || '',
        deletedByName: userProfile?.name || currentUser?.email?.split('@')[0] || 'Admin'
      });
    } catch (auditErr) {
      // Ignored: non-fatal if deletedUsers collection rule is not configured in Firestore
      console.warn('Non-fatal: could not write to deletedUsers collection:', auditErr.message);
    }
  };

  const assignedVillages = (userProfile?.assignedVillages && userProfile.assignedVillages.length > 0)
    ? userProfile.assignedVillages
    : (userProfile?.assignedVillage ? [userProfile.assignedVillage] : []);

  const value = {
    currentUser,
    userRole,
    userProfile,
    allUsers,
    isAdmin: userRole === 'admin',
    isSurveyor: userRole === 'surveyor',
    assignedVillages,
    login,
    logout,
    signInWithGoogle,
    createUserByAdmin,
    updateUserByAdmin,
    toggleUserStatus,
    sendUserPasswordReset,
    deleteUserByAdmin,
    authError,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
