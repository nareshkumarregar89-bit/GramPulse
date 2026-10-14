import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  getAuth
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
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
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();

            // Deactivated user check
            if (data.status === 'inactive' && user.uid !== SUPER_ADMIN_UID) {
              await signOut(auth);
              setCurrentUser(null);
              setUserRole(null);
              setUserProfile(null);
              setAuthError('Your account has been deactivated. Please contact the administrator.');
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
              assignedVillages: isSuperAdmin ? [] : ['रामपुरा (Rampura)'],
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
            usersList.push({ ...docSnap.data(), uid: docSnap.id });
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
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (snap.exists() && snap.data().status === 'inactive' && cred.user.uid !== SUPER_ADMIN_UID) {
        await signOut(auth);
        throw new Error('Your account has been deactivated by the administrator.');
      }
    } catch (e) {
      if (e.message.includes('deactivated')) throw e;
    }
    return cred;
  };

  const logout = () => {
    return signOut(auth);
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
    createUserByAdmin,
    updateUserByAdmin,
    toggleUserStatus,
    sendUserPasswordReset,
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
