import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const SUPER_ADMIN_UID = 'sJwiZZ6cf8Ze8YAmMMK8T1FwF232';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState('surveyor'); // 'admin' | 'surveyor'
  const [assignedVillages, setAssignedVillages] = useState(['समोड़ी (Samodi)', 'कोटड़ी (Kotdi)']);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Check super admin status
  const isAdmin = currentUser?.uid === SUPER_ADMIN_UID || userRole === 'admin' || userProfile?.role === 'admin';

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

        // Listen to Firestore User Document
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
              } else if (data.assignedVillages && data.assignedVillages.length > 0) {
                setAssignedVillages(data.assignedVillages);
              }
            } else {
              // Create user profile document if not exists
              const isSuper = user.uid === SUPER_ADMIN_UID;
              const newProf = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || user.email?.split('@')[0] || 'Surveyor',
                role: isSuper ? 'admin' : 'surveyor',
                assignedVillages: isSuper ? ['समोड़ी (Samodi)', 'कोटड़ी (Kotdi)'] : ['समोड़ी (Samodi)'],
                createdAt: new Date().toISOString()
              };
              setDoc(userDocRef, newProf).catch(console.error);
              setUserProfile(newProf);
              setUserRole(newProf.role);
              setAssignedVillages(newProf.assignedVillages);
            }
          }, (err) => {
            console.log('User snapshot notice:', err.message);
            // Fallback for offline
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
        setAssignedVillages(['समोड़ी (Samodi)']);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  // Login
  const login = async (email, password) => {
    setAuthError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      return cred.user;
    } catch (err) {
      let msg = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No user account found with this email.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Register
  const register = async (email, password, displayName, selectedVillage = 'समोड़ी (Samodi)') => {
    setAuthError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      // Create user doc
      const userRef = doc(db, 'users', cred.user.uid);
      await setDoc(userRef, {
        uid: cred.user.uid,
        email: cred.user.email,
        name: displayName || cred.user.email?.split('@')[0],
        role: 'surveyor',
        status: 'active',
        assignedVillages: [selectedVillage],
        createdAt: new Date().toISOString()
      });
      return cred.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Demo Login (Shortcut for testing)
  const loginDemoAdmin = () => {
    setCurrentUser({
      uid: SUPER_ADMIN_UID,
      email: 'admin@villagepulse.gov.in',
      displayName: 'Super Administrator'
    });
    setUserRole('admin');
    setUserProfile({
      uid: SUPER_ADMIN_UID,
      name: 'Super Administrator',
      role: 'admin',
      email: 'admin@villagepulse.gov.in'
    });
    setAssignedVillages(['समोड़ी (Samodi)', 'कोटड़ी (Kotdi)']);
  };

  const loginDemoSurveyor = () => {
    setCurrentUser({
      uid: 'demo-surveyor-101',
      email: 'surveyor.samodi@villagepulse.gov.in',
      displayName: 'Field Surveyor'
    });
    setUserRole('surveyor');
    setUserProfile({
      uid: 'demo-surveyor-101',
      name: 'Field Surveyor',
      role: 'surveyor',
      email: 'surveyor.samodi@villagepulse.gov.in'
    });
    setAssignedVillages(['समोड़ी (Samodi)']);
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
        assignedVillages,
        loading,
        authError,
        login,
        register,
        loginDemoAdmin,
        loginDemoSurveyor,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
