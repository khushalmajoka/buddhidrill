/* ============================================================
   LEADERBOARD (Phase 5, item 19) & DAILY CHALLENGE BOARD (item 17)
   Small Firebase Realtime Database helpers, following the exact same
   pattern Battle Mode already uses: anonymous-auth uid as the write
   key, best-effort (never throws into the UI), degrades to "offline"
   silently if Firebase isn't configured.

   REQUIRED FIREBASE RULES ADDITIONS (add alongside the existing
   `rooms` rules — see the setup notes shipped with this update):

   "leaderboard": {
     "$weekId": {
       ".read": true,
       "$uid": {
         ".write": "auth != null && auth.uid === $uid",
         ".validate": "newData.hasChildren(['name','score','ts']) && newData.child('score').isNumber() && newData.child('score').val() >= 0 && newData.child('score').val() <= 100000"
       }
     }
   },
   "dailyChallenge": {
     "$dateKey": {
       ".read": true,
       "$uid": {
         ".write": "auth != null && auth.uid === $uid",
         ".validate": "newData.hasChildren(['name','score','ts']) && newData.child('score').isNumber() && newData.child('score').val() >= 0 && newData.child('score').val() <= 100000"
       }
     }
   }
   ============================================================ */

import { ref, set, get, query, orderByChild, limitToLast } from "firebase/database";
import { getFirebaseDb, ensureFirebaseAuth } from "../firebase";

// ISO week id, e.g. "2026-W33" — resets the leaderboard every Monday.
export function currentWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

async function submitScoreTo(path, name, score) {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    const uid = await ensureFirebaseAuth();
    if (!uid) return false;
    await set(ref(db, `${path}/${uid}`), {
      name: (name || "Player").slice(0, 16),
      score: Math.max(0, Math.min(100000, Math.round(score))),
      ts: Date.now(),
    });
    return true;
  } catch (e) {
    console.warn("Leaderboard: submit failed.", e);
    return false;
  }
}

async function loadTopFrom(path, count = 20) {
  const db = getFirebaseDb();
  if (!db) return [];
  try {
    const snap = await get(query(ref(db, path), orderByChild("score"), limitToLast(count)));
    const val = snap.val();
    if (!val) return [];
    return Object.entries(val)
      .map(([uid, v]) => ({ uid, ...v }))
      .sort((a, b) => b.score - a.score);
  } catch (e) {
    console.warn("Leaderboard: load failed.", e);
    return [];
  }
}

// Only writes if it beats the player's own previous best for the week —
// avoids overwriting a good run with a worse one, and cuts write volume.
export async function submitLeaderboardScore(name, score) {
  const week = currentWeekId();
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    const uid = await ensureFirebaseAuth();
    if (!uid) return false;
    const existing = await get(ref(db, `leaderboard/${week}/${uid}`));
    const prevBest = existing.exists() ? existing.val().score || 0 : 0;
    if (score <= prevBest) return true; // nothing to do, not an error
    return submitScoreTo(`leaderboard/${week}`, name, score);
  } catch (e) {
    console.warn("Leaderboard: submit failed.", e);
    return false;
  }
}

export function loadLeaderboard(count = 20) {
  return loadTopFrom(`leaderboard/${currentWeekId()}`, count);
}

export async function submitDailyChallengeScore(dateKey, name, score) {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    const uid = await ensureFirebaseAuth();
    if (!uid) return false;
    const existing = await get(ref(db, `dailyChallenge/${dateKey}/${uid}`));
    const prevBest = existing.exists() ? existing.val().score || 0 : 0;
    if (score <= prevBest) return true;
    return submitScoreTo(`dailyChallenge/${dateKey}`, name, score);
  } catch (e) {
    console.warn("Daily challenge: submit failed.", e);
    return false;
  }
}

export function loadDailyChallengeBoard(dateKey, count = 20) {
  return loadTopFrom(`dailyChallenge/${dateKey}`, count);
}
