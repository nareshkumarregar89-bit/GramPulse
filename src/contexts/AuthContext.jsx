import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
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
import { resolveVillageId, deriveAssignedVillageIds, getVillageDisplayName, getUniqueAssignedVillageNames } from '../utils/villageUtils';
import { sendRegistrationWelcomeEmail } from '../utils/emailNotifier';

const AuthContext = createContext();

// Helper to provide both Unicode spellings and canonical names for Firestore security rules
export const enrichVillageVariants = (villageList = [], vIds = []) => {
  const set = new Set();
  (villageList || []).forEach(v => {
    if (v && typeof v === 'string') {
      const cleanV = v.trim();
      set.add(cleanV);
      if (cleanV.includes('Samodi') || cleanV.includes('समो') || cleanV.includes('समौ')) {
        set.add('समौड़ी (Samodi)');
        set.add('समौड़ी (Samodi)');
        set.add('समौड़ी');
        set.add('समौड़ी');
        set.add('समोड़ी (Samodi)');
        set.add('समोड़ी (Samodi)');
        set.add('Samodi');
        set.add('समोड़ी');
        set.add('समोड़ी');
      } else if (cleanV.includes('Kotdi') || cleanV.includes('कोट')) {
        set.add('कोटड़ी (Kotdi)');
        set.add('कोटड़ी (Kotdi)');
        set.add('Kotdi');
        set.add('कोटड़ी');
        set.add('कोटड़ी');
      }
    }
  });
  (vIds || []).forEach(id => {
    if (id && typeof id === 'string') {
      const clean = id.trim().toLowerCase();
      if (clean === 'samodi') {
        set.add('समौड़ी (Samodi)');
        set.add('समौड़ी (Samodi)');
        set.add('समौड़ी');
        set.add('समौड़ी');
        set.add('समोड़ी (Samodi)');
        set.add('समोड़ी (Samodi)');
        set.add('Samodi');
        set.add('समोड़ी');
        set.add('समोड़ी');
      } else if (clean === 'kotdi') {
        set.add('कोटड़ी (Kotdi)');
        set.add('कोटड़ी (Kotdi)');
        set.add('Kotdi');
        set.add('कोटड़ी');
        set.add('कोटड़ी');
      }
    }
  });
  return Array.from(set);
};

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
              assignedVillageIds: [],
              assignedVillageId: null,
              assignmentStatus: isSuperAdmin ? 'Assigned' : 'Unassigned',
              status: isSuperAdmin ? 'active' : 'pending',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);

            // Send registration welcome notification email
            sendRegistrationWelcomeEmail({
              to_email: user.email,
              to_name: newProfile.name,
              role: newProfile.role
            }).catch(e => console.warn('Welcome email dispatch:', e));
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
            setAuthError('ACCOUNT_INACTIVE');
            setLoading(false);
            return;
          }

          // Pending approval check (Requires admin approval)
          if (data.status === 'pending' && user.uid !== SUPER_ADMIN_UID) {
            await signOut(auth);
            setCurrentUser(null);
            setUserRole(null);
            setUserProfile(null);
            setAuthError('ACCOUNT_PENDING');
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
              assignedVillageIds: [],
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
          const isAdminUser = role === 'admin' || user.uid === SUPER_ADMIN_UID;
          const userAssignedVillages = data.assignedVillages || (data.assignedVillage ? [data.assignedVillage] : []);
          const userAssignedVillageIds = deriveAssignedVillageIds(data);
          const primaryVillageId = userAssignedVillageIds[0] || data.assignedVillageId || null;
          const isAssigned = (userAssignedVillages.length > 0 || userAssignedVillageIds.length > 0);
          const assignmentStatus = (isAssigned || isAdminUser) ? 'Assigned' : 'Unassigned';

          // Safe Mode Permissions Logic:
          // Admin always has full rights (canEdit=true, canDelete=true, isReadOnly=false).
          // Surveyor: If safeMode is NOT ticked (false/undefined), surveyor is View-Only (cannot edit, cannot delete).
          // Even when safeMode is TICKED (true), surveyor CAN edit, but CANNOT delete (only admin can delete!).
          const safeMode = isAdminUser ? true : Boolean(data.safeMode);
          const isReadOnly = isAdminUser ? false : (data.safeMode !== undefined ? !data.safeMode : Boolean(data.isReadOnly || data.accessLevel === 'view_only' || data.role === 'viewer'));
          const canEdit = isAdminUser || safeMode;
          const canDelete = isAdminUser; // Strictly Admin only!
          const canAddSurvey = isAdminUser || safeMode;
          const enrichedVillages = isAssigned ? enrichVillageVariants(userAssignedVillages, userAssignedVillageIds) : userAssignedVillages;

          setUserRole(role);
          setUserProfile({
            ...data,
            role,
            assignedVillages: enrichedVillages,
            assignedVillageIds: userAssignedVillageIds,
            assignedVillageId: primaryVillageId,
            assignmentStatus,
            safeMode,
            isReadOnly,
            canEdit,
            canDelete,
            canAddSurvey
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
              // Auto-repair missing assignedVillageIds / assignedVillageId for surveyors in Firestore
              if (data.role === 'surveyor' && (data.assignedVillages?.length > 0 || data.assignedVillage)) {
                const vIds = deriveAssignedVillageIds(data);
                if (vIds.length > 0) {
                  const primaryId = vIds[0];
                  const enriched = enrichVillageVariants(data.assignedVillages || [data.assignedVillage], vIds);
                  const needsSync = 
                    data.assignmentStatus !== 'Assigned' ||
                    data.assignedVillageId !== primaryId ||
                    !Array.isArray(data.assignedVillageIds) ||
                    data.assignedVillageIds.length === 0 ||
                    !Array.isArray(data.assignedVillages) ||
                    data.assignedVillages.length < enriched.length;

                  if (needsSync) {
                    updateDoc(docSnap.ref, {
                      assignedVillages: enriched,
                      assignedVillageIds: vIds,
                      assignedVillageId: primaryId,
                      assignmentStatus: 'Assigned',
                      status: 'active'
                    }).catch(err => console.warn('Surveyor profile auto-heal failed:', err));
                  }
                }
              }
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
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    // Double check active/pending status upon login
    try {
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === 'inactive' && cred.user.uid !== SUPER_ADMIN_UID) {
          await signOut(auth);
          throw new Error('ACCOUNT_INACTIVE');
        }
        if (data.status === 'pending' && cred.user.uid !== SUPER_ADMIN_UID) {
          await signOut(auth);
          throw new Error('ACCOUNT_PENDING');
        }
      }
    } catch (e) {
      if (e.message === 'ACCOUNT_INACTIVE' || e.message === 'ACCOUNT_PENDING') throw e;
    }
    return cred;
  };

  const signup = async (email, password, name) => {
    setAuthError('');
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = cred.user;

    if (name && name.trim()) {
      try {
        await updateProfile(user, { displayName: name.trim() });
      } catch (profileErr) {
        console.warn('Could not update auth profile displayName:', profileErr);
      }
    }

    const isSuperAdmin = user.uid === SUPER_ADMIN_UID;
    const initialStatus = isSuperAdmin ? 'active' : 'pending';

    const newProfile = {
      uid: user.uid,
      email: user.email,
      name: (name || user.email.split('@')[0] || 'Surveyor').trim(),
      photoURL: '',
      role: isSuperAdmin ? 'admin' : 'surveyor',
      assignedVillages: [],
      assignedVillageIds: [],
      assignedVillageId: null,
      assignmentStatus: isSuperAdmin ? 'Assigned' : 'Unassigned',
      status: initialStatus,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', user.uid), newProfile);

    // Send registration welcome notification email
    sendRegistrationWelcomeEmail({
      to_email: user.email,
      to_name: newProfile.name,
      role: newProfile.role
    }).catch(e => console.warn('Signup welcome email dispatch:', e));

    if (!isSuperAdmin) {
      await signOut(auth);
    }

    return { user: cred.user, status: initialStatus };
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
          throw new Error('ACCOUNT_INACTIVE');
        }
        if (data.status === 'pending' && user.uid !== SUPER_ADMIN_UID) {
          await signOut(auth);
          throw new Error('ACCOUNT_PENDING');
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
            assignedVillageIds: [],
            assignedVillageId: null,
            assignmentStatus: 'Unassigned',
            status: 'pending',
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newProfile);
          try { await deleteDoc(doc(db, 'deletedUsers', user.uid)); } catch (e) {}
          await signOut(auth);
          throw new Error('ACCOUNT_PENDING');
        }
      } else {
        const isSuperAdmin = user.uid === SUPER_ADMIN_UID;
        const initialStatus = isSuperAdmin ? 'active' : 'pending';
        const newProfile = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
          photoURL: user.photoURL || '',
          role: isSuperAdmin ? 'admin' : 'surveyor',
          assignedVillages: [],
          assignedVillageIds: [],
          assignedVillageId: null,
          assignmentStatus: isSuperAdmin ? 'Assigned' : 'Unassigned',
          status: initialStatus,
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile);

        // Send registration welcome notification email
        sendRegistrationWelcomeEmail({
          to_email: user.email,
          to_name: newProfile.name,
          role: newProfile.role
        }).catch(e => console.warn('Google user welcome email dispatch:', e));

        if (!isSuperAdmin) {
          await signOut(auth);
          throw new Error('ACCOUNT_PENDING');
        }
      }
    } catch (e) {
      if (e.message === 'ACCOUNT_INACTIVE' || e.message === 'ACCOUNT_PENDING') throw e;
      console.warn('Firestore profile check for Google user:', e);
    }
    return cred;
  };

  // Admin function: Create user without signing out Admin
  const createUserByAdmin = async ({ name, email, password, role, assignedVillages, safeMode = false, isReadOnly, accessLevel }) => {
    const secondaryAppName = 'SecondaryAuthApp';
    const existingApp = getApps().find(a => a.name === secondaryAppName);
    const secondaryApp = existingApp || initializeApp(auth.app.options, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
      const newUid = userCred.user.uid;
      const isAssigned = Array.isArray(assignedVillages) && assignedVillages.length > 0;
      const assignedVillageIds = isAssigned
        ? assignedVillages.map(v => resolveVillageId(v)).filter(Boolean)
        : [];

      const isRoleAdmin = role === 'admin';
      const userSafeMode = isRoleAdmin ? true : Boolean(safeMode);
      const userReadOnly = isRoleAdmin ? false : !userSafeMode;

      const profile = {
        uid: newUid,
        email: email.trim(),
        name: name.trim() || email.split('@')[0],
        role: role || 'surveyor',
        assignedVillages: isAssigned ? enrichVillageVariants(assignedVillages, assignedVillageIds) : [],
        assignedVillageIds,
        assignedVillageId: assignedVillageIds[0] || null,
        assignmentStatus: (isAssigned || isRoleAdmin) ? 'Assigned' : 'Unassigned',
        safeMode: userSafeMode,
        isReadOnly: userReadOnly,
        accessLevel: isRoleAdmin ? 'full' : (userSafeMode ? 'standard' : 'view_only'),
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', newUid), profile);
      await signOut(secondaryAuth);

      // Send registration welcome notification email to the new surveyor
      sendRegistrationWelcomeEmail({
        to_email: profile.email,
        to_name: profile.name,
        role: profile.role
      }).catch(e => console.warn('Admin user creation email dispatch:', e));

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

      // Automatically keep assignedVillageIds, village variants and assignmentStatus synchronized
      if (Array.isArray(payload.assignedVillages)) {
        const vIds = payload.assignedVillages.map(v => resolveVillageId(v)).filter(Boolean);
        payload.assignedVillageIds = vIds;
        payload.assignedVillageId = vIds[0] || null;
        payload.assignedVillages = enrichVillageVariants(payload.assignedVillages, vIds);
        payload.assignmentStatus = (vIds.length > 0 || payload.role === 'admin') ? 'Assigned' : 'Unassigned';
      }
      if (payload.role === 'admin') {
        payload.assignmentStatus = 'Assigned';
        payload.safeMode = true;
        payload.isReadOnly = false;
        payload.accessLevel = 'full';
      } else {
        if (payload.safeMode !== undefined) {
          payload.safeMode = Boolean(payload.safeMode);
          payload.isReadOnly = !payload.safeMode;
          payload.accessLevel = payload.safeMode ? 'standard' : 'view_only';
        } else if (payload.isReadOnly !== undefined) {
          payload.safeMode = !payload.isReadOnly;
          payload.accessLevel = payload.safeMode ? 'standard' : 'view_only';
        }
      }

      await updateDoc(userDocRef, payload);

      // Instant optimistic state update for admin UI without waiting for network re-fetch
      setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...payload } : u));
      if (currentUser?.uid === uid) {
        if (payload.role) setUserRole(payload.role);
        setUserProfile(prev => ({ ...prev, ...payload }));
      }
      return payload;
    } catch (err) {
      console.error('Failed to update user:', err);
      throw err;
    }
  };

  // Admin function: Assign or Change village for a user
  const assignVillageToUser = async (uid, villageObj) => {
    try {
      const villageId = resolveVillageId(villageObj) || (typeof villageObj === 'string' ? villageObj.toLowerCase() : 'samodi');
      const villageName = getVillageDisplayName(villageObj) || (typeof villageObj === 'string' ? villageObj : villageId);

      const updates = {
        assignedVillages: enrichVillageVariants([villageName], [villageId]),
        assignedVillageIds: [villageId],
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

      return {
        villageId,
        villageName
      };
    } catch (err) {
      console.error('Failed to assign village to user:', err);
      throw err;
    }
  };

  // Admin function: Toggle active/inactive
  const toggleUserStatus = async (uid, currentStatus) => {
    const nextStatus = (currentStatus === 'active') ? 'inactive' : 'active';
    await updateUserByAdmin(uid, { 
      status: nextStatus,
      ...(nextStatus === 'active' ? { approvedAt: new Date().toISOString() } : {})
    });
    return nextStatus;
  };

  // Admin function: Approve pending user
  const approveUser = async (uid) => {
    await updateUserByAdmin(uid, {
      status: 'active',
      approvedAt: new Date().toISOString()
    });
    return 'active';
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

  const rawAssignedVillages = (userProfile?.assignedVillages && userProfile.assignedVillages.length > 0)
    ? userProfile.assignedVillages
    : (userProfile?.assignedVillage ? [userProfile.assignedVillage] : []);

  const assignedVillages = (userProfile?.role !== 'admin' && rawAssignedVillages.length > 0)
    ? getUniqueAssignedVillageNames(userProfile, [], 'en')
    : [];

  const assignedVillageIds = (userProfile?.assignedVillageIds && userProfile.assignedVillageIds.length > 0)
    ? userProfile.assignedVillageIds
    : deriveAssignedVillageIds(userProfile);

  const isAdmin = userRole === 'admin';
  const safeMode = isAdmin ? true : Boolean(userProfile?.safeMode);
  const isReadOnly = isAdmin ? false : (userProfile?.safeMode !== undefined ? !userProfile.safeMode : Boolean(userProfile?.isReadOnly || userProfile?.accessLevel === 'view_only' || userRole === 'viewer'));
  const canEdit = isAdmin || safeMode;
  const canDelete = isAdmin; // Strictly Admin only! Surveyors can never delete!
  const canAddSurvey = isAdmin || safeMode;

  const value = {
    currentUser,
    userRole,
    userProfile,
    allUsers,
    isAdmin,
    isSurveyor: userRole === 'surveyor',
    safeMode,
    canEdit,
    canDelete,
    canAddSurvey,
    assignedVillages,
    assignedVillageVariants: rawAssignedVillages,
    assignedVillageIds,
    isReadOnly,
    login,
    signup,
    logout,
    approveUser,
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
