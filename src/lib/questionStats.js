/* ============================================================
   QUESTION DIFFICULTY (community stats)
   Shows a small "how hard is THIS exact question, based on everyone who's
   answered it before" badge on the question card, instead of the old
   "item · N" tag. Backed by a Firebase counter per unique question
   (right/wrong counts + total time), shared across every player —
   same best-effort pattern as the rest of lib/: if Firebase isn't
   configured, or a read/write fails, this quietly does nothing and the
   badge just doesn't render.

   REQUIRED FIREBASE RULES ADDITION (alongside leaderboard/rooms/usernames):

   "questionStats": {
     "$qid": {
       ".read": true,
       ".write": "auth != null"
     }
   }
   ============================================================ */

import { ref, get, runTransaction } from "firebase/database";
import { getFirebaseDb, ensureFirebaseAuth } from "../firebase";

const MIN_SAMPLES = 5; // below this, we don't have enough signal to call it anything but "New"
const memCache = new Map(); // signature -> stats, per page-load — avoids re-fetching the same question repeatedly

// A stable id for "this exact question" — category + the exact prompt text
// (which already bakes in the specific numbers/operands), hashed down to a
// short Firebase-safe key (Realtime DB keys can't contain . # $ [ ] /).
function questionSignature(question) {
  const raw = `${question.category}::${question.prompt}`;
  let h = 2166136261; // FNV-1a
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `q${(h >>> 0).toString(36)}`;
}

function bandFor(stats) {
  const total = stats.correct + stats.wrong;
  if (total < MIN_SAMPLES) return { label: "New", tone: "new" };
  const acc = stats.correct / total;
  if (acc >= 0.85) return { label: "Easy", tone: "easy" };
  if (acc >= 0.6) return { label: "Medium", tone: "medium" };
  if (acc >= 0.35) return { label: "Hard", tone: "hard" };
  return { label: "Very hard", tone: "veryhard" };
}

// Best-effort read. Resolves null if unavailable/not enough data — caller
// should just skip rendering the badge in that case.
export async function fetchQuestionDifficulty(question) {
  const sig = questionSignature(question);
  if (memCache.has(sig)) return memCache.get(sig);
  const db = getFirebaseDb();
  if (!db) return null;
  try {
    const snap = await get(ref(db, `questionStats/${sig}`));
    const raw = snap.exists() ? snap.val() : { correct: 0, wrong: 0, timeSumMs: 0, timeCount: 0 };
    const total = (raw.correct || 0) + (raw.wrong || 0);
    const result = total < MIN_SAMPLES
      ? { label: "New", tone: "new", pctCorrect: null, avgSeconds: null, samples: total }
      : {
        ...bandFor(raw),
        pctCorrect: Math.round((raw.correct / total) * 100),
        avgSeconds: raw.timeCount ? +((raw.timeSumMs / raw.timeCount) / 1000).toFixed(1) : null,
        samples: total,
      };
    memCache.set(sig, result);
    return result;
  } catch {
    return null;
  }
}

// Best-effort write — fire and forget from the caller's point of view.
// Uses a transaction so simultaneous answers from different players don't
// clobber each other's counts.
export async function recordQuestionOutcome(question, correct, elapsedMs) {
  const db = getFirebaseDb();
  if (!db) return;
  const sig = questionSignature(question);
  memCache.delete(sig); // this question's stats just changed — don't serve the stale cached read next time
  try {
    await ensureFirebaseAuth();
    await runTransaction(ref(db, `questionStats/${sig}`), (curr) => {
      const c = curr || { correct: 0, wrong: 0, timeSumMs: 0, timeCount: 0 };
      return {
        correct: c.correct + (correct ? 1 : 0),
        wrong: c.wrong + (correct ? 0 : 1),
        timeSumMs: c.timeSumMs + (elapsedMs > 0 && elapsedMs < 120000 ? elapsedMs : 0),
        timeCount: c.timeCount + (elapsedMs > 0 && elapsedMs < 120000 ? 1 : 0),
      };
    });
  } catch (e) {
    console.warn("Question stats: write failed, continuing offline.", e);
  }
}
