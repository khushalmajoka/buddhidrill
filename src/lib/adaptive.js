/* ============================================================
   ADAPTIVE DIFFICULTY
   Quietly nudges each category's numeric ranges up or down based on a
   rolling accuracy window, so the drill gets a little harder when
   you're breezing through it and a little easier when you're
   struggling — without ever touching your saved Difficulty preset or
   custom ranges, which stay exactly as you set them. Needs a real
   chunk of usage history per category before it starts adjusting,
   which is why it's most useful once Phases 1–3 have generated some.
   ============================================================ */

import { RANGE_FIELDS, ABSOLUTE_LIMITS } from "../constants";

const ADAPTIVE_KEY = "buddhidrill-adaptive";
const ADAPTIVE_ON_KEY = "buddhidrill-adaptive-on";

const ROLLING_WINDOW = 12;  // recent answers per category the rolling accuracy looks at
const MIN_SAMPLES = 6;      // don't move the needle until there's at least this much signal
const TARGET_LOW = 0.6;     // rolling accuracy below this -> ease off
const TARGET_HIGH = 0.85;   // rolling accuracy above this -> tighten up
const STEP = 0.06;          // how far the level moves per adjustment
const LEVEL_MIN = 0.6;
const LEVEL_MAX = 1.6;

export function loadAdaptiveOnPref() {
  try { return window.localStorage.getItem(ADAPTIVE_ON_KEY) === "1"; } catch { return false; }
}

export function saveAdaptiveOnPref(on) {
  try { window.localStorage.setItem(ADAPTIVE_ON_KEY, on ? "1" : "0"); } catch { /* ignore */ }
}

export function emptyAdaptiveState() {
  return { levels: {}, rolling: {} };
}

export function loadAdaptiveState() {
  try {
    const raw = window.localStorage.getItem(ADAPTIVE_KEY);
    if (!raw) return emptyAdaptiveState();
    const parsed = JSON.parse(raw);
    return { levels: parsed.levels || {}, rolling: parsed.rolling || {} };
  } catch {
    return emptyAdaptiveState();
  }
}

function saveAdaptiveState(state) {
  try { window.localStorage.setItem(ADAPTIVE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export function resetAdaptiveState() {
  const fresh = emptyAdaptiveState();
  saveAdaptiveState(fresh);
  return fresh;
}

export function levelForCategory(state, category) {
  return state.levels[category] || 1;
}

// rolling accuracy for a category, or null if there isn't enough signal yet
export function rollingAccuracy(state, category) {
  const samples = state.rolling[category] || [];
  if (samples.length < MIN_SAMPLES) return null;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}

// call once per answer; returns the new state (the level only actually
// moves once there's enough rolling signal, and only by one STEP at a time
// so it never whiplashes after a single lucky or unlucky question)
export function recordAdaptiveOutcome(state, category, correct) {
  const samples = [...(state.rolling[category] || []), correct ? 1 : 0].slice(-ROLLING_WINDOW);
  const rolling = { ...state.rolling, [category]: samples };
  let level = state.levels[category] || 1;
  if (samples.length >= MIN_SAMPLES) {
    const acc = samples.reduce((a, b) => a + b, 0) / samples.length;
    if (acc >= TARGET_HIGH) level = Math.min(LEVEL_MAX, +(level + STEP).toFixed(3));
    else if (acc < TARGET_LOW) level = Math.max(LEVEL_MIN, +(level - STEP).toFixed(3));
  }
  const next = { rolling, levels: { ...state.levels, [category]: level } };
  saveAdaptiveState(next);
  return next;
}

function scalePair(pair, limitsKey, level) {
  const [lo, hi] = pair;
  const [, limHi] = ABSOLUTE_LIMITS[limitsKey] || [lo, hi];
  const width = hi - lo;
  const newHi = Math.round(lo + width * level);
  return [lo, Math.max(lo, Math.min(limHi, newHi))];
}

// returns a fresh ranges object with each category's upper bound scaled by
// its current adaptive level. The base `ranges` object (your Difficulty
// preset or custom settings) is never mutated.
export function applyAdaptiveRanges(ranges, adaptiveState, enabled) {
  if (!enabled) return ranges;
  const next = JSON.parse(JSON.stringify(ranges));
  for (const f of RANGE_FIELDS) {
    const level = levelForCategory(adaptiveState, f.cat);
    if (level === 1 || !next[f.cat] || !next[f.cat][f.field]) continue;
    next[f.cat][f.field] = scalePair(next[f.cat][f.field], f.limitsKey, level);
  }
  // fractions.maxDen is a single scalar rather than a [lo, hi] pair
  const fracLevel = levelForCategory(adaptiveState, "fractions");
  if (fracLevel !== 1 && next.fractions) {
    const [limLo, limHi] = ABSOLUTE_LIMITS.fractionsMaxDen;
    next.fractions.maxDen = Math.max(limLo, Math.min(limHi, Math.round(next.fractions.maxDen * fracLevel)));
  }
  return next;
}
