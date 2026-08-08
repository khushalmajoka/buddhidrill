import { GENERATORS } from "../questions/generators";

/* ============================================================
   BATTLE MODE — deterministic shared question sequence
   Both players precompute the *same* array of questions locally from a
   shared seed + shared settings, so nothing about the questions themselves
   ever needs to travel over the network — only scores do.
   ============================================================ */

// mulberry32: small, fast, deterministic PRNG. Same seed -> same output stream,
// on any device, forever — that's what keeps both players' questions in sync.
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export const BATTLE_QUESTION_POOL_SIZE = 250; // plenty even for a fast player over 5 minutes

export function generateBattleQuestions(seed, categories, ranges, answerMode) {
  const rng = mulberry32(seed);
  const forceType = answerMode === "mixed" ? undefined : answerMode;
  const cats = categories.length ? categories : ["multiplication"];
  const qs = [];
  for (let i = 0; i < BATTLE_QUESTION_POOL_SIZE; i++) {
    const cat = cats[Math.floor(rng() * cats.length)];
    qs.push(GENERATORS[cat](forceType, ranges, rng));
  }
  return qs;
}
