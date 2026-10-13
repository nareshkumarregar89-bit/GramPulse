import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAZSeoTYuU-ue4UO0JYcC9Z4SkqikqtfoQ",
  authDomain: "gram-survey.firebaseapp.com",
  projectId: "gram-survey",
  storageBucket: "gram-survey.firebasestorage.app",
  messagingSenderId: "218966954015",
  appId: "1:218966954015:web:f5f8f2eddaa93706e0c52a",
  measurementId: "G-X5JKNPHE1Q"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
