import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let dbInstance: Firestore;

function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  
  // Remove surrounding quotes if present
  let formatted = key.trim();
  if (formatted.startsWith('"') && formatted.endsWith('"')) {
    formatted = formatted.slice(1, -1);
  }
  if (formatted.startsWith("'") && formatted.endsWith("'")) {
    formatted = formatted.slice(1, -1);
  }
  
  // Replace literal \n with actual newlines
  formatted = formatted.replace(/\\n/g, '\n');
  
  // Ensure it starts and ends with the correct markers
  if (!formatted.includes('-----BEGIN PRIVATE KEY-----')) {
    formatted = '-----BEGIN PRIVATE KEY-----\n' + formatted;
  }
  if (!formatted.includes('-----END PRIVATE KEY-----')) {
    formatted = formatted + '\n-----END PRIVATE KEY-----\n';
  }
  
  return formatted;
}

export function getAdminApp(): App {
  if (!adminApp) {
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    
    adminApp = getApps().length > 0 
      ? getApps()[0] 
      : initializeApp({
          credential: cert({
            projectId: 'grana3d-acb66',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
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
