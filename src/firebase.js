import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

/* ============================================================
   FIREBASE — used only for Battle Mode (shared rooms between two
   devices). Practice/Game/heatmap stay fully local (localStorage) and
   never touch this. See the setup notes for how to fill this in.
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

let _dbInstance;
let _dbInitTried = false;
export function getFirebaseDb() {
  if (_dbInitTried) return _dbInstance;
  _dbInitTried = true;
  try {
    if (!firebaseConfig.databaseURL) throw new Error("Firebase env vars not set");
    const app = initializeApp(firebaseConfig);
    _dbInstance = getDatabase(app);
  } catch (e) {
    console.warn("Battle Mode: Firebase not configured yet.", e);
    _dbInstance = null;
  }
  return _dbInstance;
}

export function newRoomCode() {
  const charset = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — easy to read aloud
  let code = "";
  for (let i = 0; i < 5; i++) code += charset[Math.floor(Math.random() * charset.length)];
  return code;
}

export function newPlayerId() {
  return "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
