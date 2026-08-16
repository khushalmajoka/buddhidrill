/* ============================================================
   UNIQUE USERNAMES (onboarding)
   Reserves a lowercase-normalized username under `usernames/<name>` in
   Firebase so two players on different devices can't claim the same
   handle for the leaderboard/daily-challenge boards. Same best-effort
   pattern as everything else in lib/ — if Firebase isn't configured,
   or the device is offline, the check is skipped and the username is
   accepted locally (a duplicate can only ever collide with someone
   else on a *different* device, and the worst case is two people
   sharing a leaderboard row label, not a crash or data loss).

   REQUIRED FIREBASE RULES ADDITION (add alongside the leaderboard and
   rooms rules — see the setup notes shipped with this update):

   "usernames": {
     "$name": {
       ".read": true,
       ".write": "auth != null && (!data.exists() || data.val() === auth.uid)"
     }
   }
   ============================================================ */

import { ref, get, set } from "firebase/database";
import { getFirebaseDb, ensureFirebaseAuth } from "../firebase";

export function normalizeUsername(raw) {
  return (raw || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function usernameFormatError(raw) {
  const clean = normalizeUsername(raw);
  if (clean.length < 3) return "Username needs at least 3 characters.";
  if (clean.length > 20) return "Username needs to be 20 characters or fewer.";
  if (clean !== raw.trim().toLowerCase()) return "Letters, numbers, and underscores only.";
  return null;
}

// Resolves true if the username is free to take (or availability can't be
// checked right now, in which case we optimistically allow it).
export async function isUsernameAvailable(rawUsername) {
  const name = normalizeUsername(rawUsername);
  const db = getFirebaseDb();
  if (!db || !name) return true;
  try {
    const snap = await get(ref(db, `usernames/${name}`));
    if (!snap.exists()) return true;
    const uid = await ensureFirebaseAuth();
    return snap.val() === uid; // it's "available" to you if you already own it
  } catch {
    return true;
  }
}

// Best-effort claim — never throws into the UI, never blocks onboarding
// if Firebase/the network isn't cooperating.
export async function claimUsername(rawUsername) {
  const name = normalizeUsername(rawUsername);
  const db = getFirebaseDb();
  if (!db || !name) return true;
  try {
    const uid = await ensureFirebaseAuth();
    if (!uid) return true;
    await set(ref(db, `usernames/${name}`), uid);
    return true;
  } catch (e) {
    console.warn("Username: claim failed, continuing offline.", e);
    return true;
  }
}
