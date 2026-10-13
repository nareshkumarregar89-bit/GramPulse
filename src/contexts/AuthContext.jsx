import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

// Super Admin UID provided by user
const SUPER_ADMIN_UID = 'sJwiZZ6cf8Ze8YAmMMK8T1FwF232';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserRole(data.role || (user.uid === SUPER_ADMIN_UID ? 'admin' : 'surveyor'));
            setUserProfile(data);
          } else {
            // Initial profile creation
            const isSuperAdmin = user.uid === SUPER_ADMIN_UID;
            const newProfile = {
              uid: user.uid,
              email: user.email,
              name: isSuperAdmin ? 'Admin' : (user.email ? user.email.split('@')[0] : 'Surveyor'),
              role: isSuperAdmin ? 'admin' : 'surveyor',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setUserRole(newProfile.role);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching user role from Firestore:', error);
          // Fallback based on UID
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

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    userRole,
    userProfile,
    isAdmin: userRole === 'admin',
    isSurveyor: userRole === 'surveyor',
    login,
    logout,
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
