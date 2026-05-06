import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let dbInstance: Firestore;

export function getAdminApp(): App {
  if (!adminApp) {
    adminApp = getApps().length > 0 
      ? getApps()[0] 
      : initializeApp({
          credential: cert({
            projectId: 'grana3d-acb66',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
  }
  return adminApp;
}

export function getAdminDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getAdminApp());
  }
  return dbInstance;
}

export const adminDb = getAdminDb();
