import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { 
  initializeAuth, 
  getAuth,
  getReactNativePersistence 
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyAZSeoTYuU-ue4UO0JYcC9Z4SkqikqtfoQ",
  authDomain: "gram-survey.firebaseapp.com",
  projectId: "gram-survey",
  storageBucket: "gram-survey.firebasestorage.app",
  messagingSenderId: "218966954015",
  appId: "1:218966954015:web:f5f8f2eddaa93706e0c52a",
  measurementId: "G-X5JKNPHE1Q"
};

// Initialize App safely
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    // For Native (iOS / Android), use AsyncStorage persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
} catch (e) {
  // If already initialized
  auth = getAuth(app);
}

// Initialize Firestore with long-polling to prevent React Native WebChannel connection hanging
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  db = getFirestore(app);
}

export { auth, db };
export default app;
