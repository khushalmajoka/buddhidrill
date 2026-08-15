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

// Cumulative XP required to REACH a given level (level 1 = 0 XP).
// Quadratic-ish growth: level 2 needs 100, level 3 needs 300, level 4
// needs 600, level 5 needs 1000, ... — early levels come fast (feels
// rewarding immediately), later ones stretch out.
export function xpForLevel(level) {
  return Math.round(50 * (level - 1) * level);
}

export function levelFromXP(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
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
