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
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clean up any existing user document snapshot listener
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, 'users', user.uid);

        try {
          // Check if profile exists, create initial if missing
          const userSnap = await getDoc(userDocRef);
          if (!userSnap.exists()) {
            const isSuperAdmin = user.uid === SUPER_ADMIN_UID;
            const newProfile = {
              uid: user.uid,
              email: user.email,
              name: isSuperAdmin ? 'Admin' : (user.displayName || (user.email ? user.email.split('@')[0] : 'Surveyor')),
              role: isSuperAdmin ? 'admin' : 'surveyor',
              assignedVillages: [],
              assignedVillageId: null,
              assignmentStatus: isSuperAdmin ? 'Assigned' : 'Unassigned',
              status: 'active',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
          }
        } catch (initErr) {
          console.warn('Initial profile check error:', initErr);
        }

        // Live Real-Time Listener: Automatically syncs role, assigned villages, and status whenever an Admin modifies them!
        unsubscribeDoc = onSnapshot(userDocRef, async (docSnap) => {
          if (!docSnap.exists()) {
            setLoading(false);
            return;
          }

          const data = docSnap.data();

          // Deactivated user check (Admin explicitly deactivated account)
          if (data.status === 'inactive' && user.uid !== SUPER_ADMIN_UID) {
            await signOut(auth);
            setCurrentUser(null);
            setUserRole(null);
            setUserProfile(null);
            setAuthError('Your account has been deactivated by the administrator.');
            setLoading(false);
            return;
          }

          // If user profile was previously marked deleted, re-register as fresh active surveyor
          if ((data.status === 'deleted' || data.isDeleted) && user.uid !== SUPER_ADMIN_UID) {
            const newProfile = {
              uid: user.uid,
              email: user.email,
              name: user.displayName || (user.email ? user.email.split('@')[0] : 'Surveyor'),
              photoURL: user.photoURL || '',
              role: 'surveyor',
              assignedVillages: [],
              assignedVillageId: null,
              assignmentStatus: 'Unassigned',
              status: 'active',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            try { await deleteDoc(doc(db, 'deletedUsers', user.uid)); } catch (e) {}
            setUserRole(newProfile.role);
            setUserProfile(newProfile);
            setLoading(false);
            return;
          }

          const role = data.role || (user.uid === SUPER_ADMIN_UID ? 'admin' : 'surveyor');
          const userAssignedVillages = data.assignedVillages || (data.assignedVillage ? [data.assignedVillage] : []);
          const assignmentStatus = data.assignmentStatus || (userAssignedVillages.length > 0 || role === 'admin' ? 'Assigned' : 'Unassigned');

          setUserRole(role);
          setUserProfile({
            ...data,
            role,
            assignedVillages: userAssignedVillages,
            assignedVillageId: data.assignedVillageId || null,
            assignmentStatus
          });
          setLoading(false);
        }, (err) => {
          console.error('Realtime user profile listener error:', err);
          setUserRole(user.uid === SUPER_ADMIN_UID ? 'admin' : 'surveyor');
          setLoading(false);
        });

      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeDoc) unsubscribeDoc();
      unsubscribeAuth();
    };
  }, []);

  // Listen for all users if logged in as admin
  useEffect(() => {
    if (userRole === 'admin') {
      try {
        const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
          const usersList = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            // Exclude soft-deleted users and clean them up automatically
            if (!data.isDeleted && data.status !== 'deleted') {
              usersList.push({ ...data, uid: docSnap.id });
            } else {
              // Legacy soft-deleted record found: remove it completely so user can re-register cleanly
              deleteDoc(docSnap.ref).catch(() => {});
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
    // Double check active status upon login
    try {
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === 'inactive' && cred.user.uid !== SUPER_ADMIN_UID) {
          await signOut(auth);
          throw new Error('Your account has been deactivated by the administrator.');
        }
      }
    } catch (e) {
      if (e.message.includes('deactivated')) throw e;
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
        // If previously soft-deleted, reset to fresh unassigned profile
        if ((data.status === 'deleted' || data.isDeleted) && user.uid !== SUPER_ADMIN_UID) {
          const newProfile = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
            photoURL: user.photoURL || '',
            role: 'surveyor',
            assignedVillages: [],
            assignedVillageId: null,
            assignmentStatus: 'Unassigned',
            status: 'active',
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newProfile);
          try { await deleteDoc(doc(db, 'deletedUsers', user.uid)); } catch (e) {}
        }
      } else {
        const isSuperAdmin = user.uid === SUPER_ADMIN_UID;
        const newProfile = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
          photoURL: user.photoURL || '',
          role: isSuperAdmin ? 'admin' : 'surveyor',
          assignedVillages: [],
          assignedVillageId: null,
          assignmentStatus: isSuperAdmin ? 'Assigned' : 'Unassigned',
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
      const isAssigned = Array.isArray(assignedVillages) && assignedVillages.length > 0;

      const profile = {
        uid: newUid,
        email: email.trim(),
        name: name.trim() || email.split('@')[0],
        role: role || 'surveyor',
        assignedVillages: isAssigned ? assignedVillages : [],
        assignedVillageId: isAssigned && assignedVillages[0]
          ? (assignedVillages[0].toLowerCase().includes('kotdi') ? 'kotdi' : 'samodi')
          : null,
        assignmentStatus: isAssigned || role === 'admin' ? 'Assigned' : 'Unassigned',
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

      // Instant optimistic state update for admin UI without waiting for network re-fetch
      setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...updates } : u));
      if (currentUser?.uid === uid) {
        if (updates.role) setUserRole(updates.role);
        setUserProfile(prev => ({ ...prev, ...updates }));
      }
    } catch (err) {
      console.error('Failed to update user:', err);
      throw err;
    }
  };

  // Admin function: Assign or Change village for a user
  const assignVillageToUser = async (uid, villageObj) => {
    try {
      const villageName = typeof villageObj === 'string'
        ? villageObj
        : (villageObj.name || villageObj.nameHindi || villageObj.nameEnglish || villageObj.id);
      const villageId = typeof villageObj === 'object' && villageObj.id
        ? villageObj.id
        : (villageName.toLowerCase().includes('kotdi') ? 'kotdi' : 'samodi');

      const updates = {
        assignedVillages: [villageName],
        assignedVillageId: villageId,
        assignmentStatus: 'Assigned',
        status: 'active',
        assignedAt: new Date().toISOString(),
        assignedBy: currentUser?.uid || ''
      };

      await updateUserByAdmin(uid, updates);

      // Instantly update local state so UI updates without waiting for network re-fetch
      setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...updates } : u));
      if (currentUser?.uid === uid) {
        setUserProfile(prev => ({ ...prev, ...updates }));
      }
    } catch (err) {
      console.error('Failed to assign village to user:', err);
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

  // Admin function: Delete user account completely from Firebase Auth and Firestore
  const deleteUserByAdmin = async (uid, userData = {}) => {
    if (!uid) {
      throw new Error('Target user UID is required.');
    }
    if (uid === SUPER_ADMIN_UID) {
      throw new Error('Super Admin account is protected and cannot be deleted.');
    }
    if (uid === currentUser?.uid) {
      throw new Error('You cannot delete your own administrator account.');
    }

    // Safeguard: Check if this would delete the last active administrator
    const activeAdmins = allUsers.filter(u => 
      u.role === 'admin' && 
      !u.isDeleted && 
      u.status !== 'inactive' && 
      u.status !== 'deleted'
    );
    if (activeAdmins.length <= 1 && activeAdmins.some(u => u.uid === uid)) {
      throw new Error('Action blocked: Cannot delete the last active administrator.');
    }

    let authDeleted = false;

    // 1. Attempt complete removal from Firebase Authentication via trusted serverless backend
    try {
      if (currentUser) {
        const idToken = await currentUser.getIdToken(true);
        const response = await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            targetUid: uid,
            userData
          })
        });

        if (response.ok) {
          const resData = await response.json().catch(() => ({}));
          authDeleted = resData.authDeleted || false;
        } else {
          console.warn('Backend serverless deletion response not 200:', response.status);
        }
      }
    } catch (apiErr) {
      console.warn('Serverless endpoint unreachable (proceeding with resilient Firestore cleanup):', apiErr.message);
    }

    // 2. Direct Firestore profile complete hard deletion
    const userDocRef = doc(db, 'users', uid);
    const now = new Date().toISOString();

    try {
      await deleteDoc(userDocRef);
    } catch (delErr) {
      console.warn('deleteDoc failed, attempting soft cleanup fallback:', delErr);
      try {
        await updateDoc(userDocRef, {
          status: 'deleted',
          isDeleted: true,
          assignedVillages: [],
          assignmentStatus: 'Unassigned',
          deletedAt: now
        });
      } catch (updErr) {
        console.error('Failed to remove user profile:', updErr);
        throw new Error(delErr.code === 'permission-denied'
          ? 'Permission Denied: Please verify administrator permissions in Firestore Rules.'
          : (delErr.message || 'Failed to delete user profile.'));
      }
    }

    // Immediately remove from local state for instant UI update
    setAllUsers(prev => prev.filter(u => u.uid !== uid));

    // Also remove any legacy record in deletedUsers collection
    try {
      await deleteDoc(doc(db, 'deletedUsers', uid));
    } catch (e) {
      // Non-fatal
    }

    // 3. Record protected Administrative Audit Log (for admin history/compliance)
    try {
      await setDoc(doc(db, 'adminAuditLogs', `del_${uid}_${Date.now()}`), {
        action: 'DELETE_USER',
        targetUid: uid,
        targetEmail: userData.email || '',
        targetName: userData.name || '',
        targetRole: userData.role || 'surveyor',
        authDeleted,
        deletedAt: now,
        deletedBy: currentUser?.uid || '',
        deletedByName: userProfile?.name || currentUser?.email?.split('@')[0] || 'Admin'
      });
    } catch (auditErr) {
      console.warn('Non-fatal: could not write to adminAuditLogs:', auditErr.message);
    }

    return {
      success: true,
      authDeleted,
      message: 'User account deleted successfully. The user can re-register with their Google account as a fresh user if needed.'
    };
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
    assignVillageToUser,
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
