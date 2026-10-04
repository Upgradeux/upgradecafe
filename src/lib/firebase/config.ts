import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyCd8MQezrKU7uDIPWKkTaRUVV26dMeD6Zk",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "upgradecafe-63637.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "upgradecafe-63637",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "upgradecafe-63637.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "559819631222",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:559819631222:web:522cd9a177e03859b34d57",
};

// Initialize Firebase App for client-side authentication
export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const getFirebaseAuth = () => getAuth(firebaseApp);
