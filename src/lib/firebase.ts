import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBNvIcTj3RDJitC0AQMu9NfDzaPqs808jw",
  authDomain: "grana3d-acb66.firebaseapp.com",
  projectId: "grana3d-acb66",
  storageBucket: "grana3d-acb66.firebasestorage.app",
  messagingSenderId: "1054364269485",
  appId: "1:1054364269485:web:ff27c3b11f62c50932bf24",
  measurementId: "G-JCXRY4338X"
};

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function getDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
  }
  return dbInstance;
}

export function getAuthInstance(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

export const db = getDb();
export const auth = getAuthInstance();
