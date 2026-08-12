import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

/* ============================================================
   FIREBASE — used only for Battle Mode (shared rooms between two
   devices). Practice/Game/heatmap stay fully local (localStorage) and
   never touch this. See the setup notes for how to fill this in.

   Battle Mode signs each device in anonymously so the database rules
   can verify "this write really came from this player" (auth.uid)
   instead of trusting a self-reported id in the request — otherwise
   any client could write into another player's slot in a shared room.
   Anonymous Auth must be enabled once in the Firebase console:
   Authentication → Sign-in method → Anonymous → Enable.
   ============================================================ */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let _appInstance;
function getFirebaseApp() {
  if (_appInstance !== undefined) return _appInstance;
  try {
    if (!firebaseConfig.databaseURL) throw new Error("Firebase env vars not set");
    _appInstance = initializeApp(firebaseConfig);
  } catch (e) {
    console.warn("Battle Mode: Firebase not configured yet.", e);
    _appInstance = null;
  }
  return _appInstance;
}

let _dbInstance;
let _dbInitTried = false;
export function getFirebaseDb() {
  if (_dbInitTried) return _dbInstance;
  _dbInitTried = true;
  const app = getFirebaseApp();
  _dbInstance = app ? getDatabase(app) : null;
  return _dbInstance;
}

let _authInstance;
function getFirebaseAuthInstance() {
  if (_authInstance !== undefined) return _authInstance;
  const app = getFirebaseApp();
  _authInstance = app ? getAuth(app) : null;
  return _authInstance;
}

let _authReadyPromise = null;
/**
 * Ensures the device is signed in anonymously and resolves with the
 * stable uid to use as this player's id. Safe to call multiple times —
 * the underlying sign-in only happens once per session.
 */
export function ensureFirebaseAuth() {
  if (_authReadyPromise) return _authReadyPromise;
  _authReadyPromise = new Promise((resolve) => {
    const db = getFirebaseDb();
    if (!db) { resolve(null); return; }
    const auth = getFirebaseAuthInstance();
    if (!auth) { resolve(null); return; }
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub();
        resolve(user.uid);
      }
    });
    signInAnonymously(auth).catch((e) => {
      console.warn("Battle Mode: anonymous sign-in failed.", e);
      unsub();
      resolve(null);
    });
  });
  return _authReadyPromise;
}

export function newRoomCode() {
  const charset = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — easy to read aloud
  let code = "";
  for (let i = 0; i < 5; i++) code += charset[Math.floor(Math.random() * charset.length)];
  return code;
}
