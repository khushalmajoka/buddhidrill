/* ============================================================
   XP / LEVELS
   Every correct answer (Practice, Game, Battle) earns base XP,
   boosted by a short-term combo multiplier tied to the player's
   live correct-answer streak. XP is a single running total
   persisted to localStorage; level is always derived from it
   (never stored separately) so the curve can be retuned later
   without a migration.
   ============================================================ */

import { pkey } from "./profiles";

const XP_KEY = "buddhidrill-xp";
const BASE_XP = 10;

export function loadXP() {
  try {
    const raw = window.localStorage.getItem(pkey(XP_KEY));
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function saveXP(xp) {
  try { window.localStorage.setItem(pkey(XP_KEY), String(xp)); } catch { /* ignore */ }
}

// Level curve, tuned for a 1→100 climb: the XP needed for EACH single
// step up (level N → N+1) grows on its own, every level, not just in
// broad bands — L1→2 is a handful of correct answers, L2→3 needs a bit
// more, L3→4 more still, and so on, all the way to a serious grind by
// L99→100. Modeled as step(level) = ROUND_UNIT * level^1.4, which keeps
// early steps small (step(1)=40) while the later ones dominate the total
// (step(99)≈24,600) — so most of a player's XP over time goes toward the
// last handful of levels, which is what makes late levels feel earned.
// xpForLevel is cumulative XP to REACH `level` (level 1 = 0 XP) and is
// just the running sum of every step below it.
const LEVEL_STEP_UNIT = 40;
const LEVEL_STEP_EXPONENT = 1.4;

function xpStep(level) {
  // step FROM `level` TO `level + 1`
  return Math.round(LEVEL_STEP_UNIT * Math.pow(level, LEVEL_STEP_EXPONENT));
}

const _levelTotals = [0]; // _levelTotals[i] = cumulative XP to reach level i+1
function xpForLevel(level) {
  const idx = level - 1;
  while (_levelTotals.length <= idx) {
    const lvl = _levelTotals.length; // level we're about to add the floor for
    _levelTotals.push(_levelTotals[lvl - 1] + xpStep(lvl));
  }
  return _levelTotals[idx];
}

export { xpForLevel };

export function levelFromXP(xp) {
  let level = 1;
  while (level < 100 && xpForLevel(level + 1) <= xp) level++;
  return level;
}

// { level, xp, into, need, pct } — progress toward the *next* level
export function levelProgress(xp) {
  const level = levelFromXP(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const into = xp - floor;
  const need = ceil - floor;
  return { level, xp, into, need, pct: need > 0 ? Math.min(100, Math.round((into / need) * 100)) : 100 };
}

// +10% XP for every 5-answer streak milestone, capped at 2x — rewards
// sustained accuracy without letting combo farming run away
export function comboMultiplier(streak) {
  return Math.min(2, 1 + Math.floor(streak / 5) * 0.1);
}

export function xpForAnswer(correct, streak = 0) {
  if (!correct) return 0;
  return Math.round(BASE_XP * comboMultiplier(streak));
}

// applies an XP gain, persists it, and reports whether it crossed into a new level
export function addXP(currentXP, amount) {
  const nextXP = Math.max(0, currentXP + amount);
  saveXP(nextXP);
  const beforeLevel = levelFromXP(currentXP);
  const afterLevel = levelFromXP(nextXP);
  return { xp: nextXP, leveledUp: afterLevel > beforeLevel, level: afterLevel };
}
