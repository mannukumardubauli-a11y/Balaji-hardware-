import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App safely
let app: any = null;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn('Firebase initializeApp failed:', e);
}

// Initialize Services safely
export const auth = app ? getAuth(app) : ({} as any);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore safely
const databaseId = firebaseConfigJson.firestoreDatabaseId || undefined;
export const db = app 
  ? (databaseId ? getFirestore(app, databaseId) : getFirestore(app))
  : ({} as any);

// Enable Offline Persistence safely without crashing
if (typeof window !== 'undefined' && app && db && typeof db.app !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      console.warn('Firestore persistence warning:', err?.message);
    });
  } catch (err) {
    console.warn('enableIndexedDbPersistence catch:', err);
  }
}

export const storage = app ? getStorage(app) : ({} as any);
export default app;

