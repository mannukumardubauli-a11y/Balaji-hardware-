import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson?.apiKey || '',
  authDomain: firebaseConfigJson?.authDomain || '',
  projectId: firebaseConfigJson?.projectId || '',
  storageBucket: firebaseConfigJson?.storageBucket || '',
  messagingSenderId: firebaseConfigJson?.messagingSenderId || '',
  appId: firebaseConfigJson?.appId || '',
};

// Initialize Firebase App safely
let app: any = null;
try {
  if (firebaseConfig.apiKey) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
} catch (e) {
  console.warn('Firebase initializeApp warning:', e);
}

// Initialize Services safely
export const auth = app ? getAuth(app) : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;

// Initialize Firestore safely with persistent local cache
const databaseId = firebaseConfigJson?.firestoreDatabaseId || undefined;
let firestoreDb: any = null;

if (app) {
  try {
    const firestoreSettings = {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    };
    firestoreDb = databaseId 
      ? initializeFirestore(app, firestoreSettings, databaseId)
      : initializeFirestore(app, firestoreSettings);
  } catch (err) {
    console.warn('initializeFirestore persistent cache fallback:', err);
    firestoreDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(firestoreDb).catch(() => {});
    }
  }
}

export const db = firestoreDb;
export const storage = app ? getStorage(app) : null;
export default app;



