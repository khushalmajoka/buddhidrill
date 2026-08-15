/* ============================================================
   SPACED REPETITION
   A lightweight Leitner-style scheduler, one "box" per item (the same
   category+key that stats.js already tracks). Answer it right and it
   moves up a box with a longer wait before it's due again; miss it
   and it drops straight back to box 0, due immediately. This layers
   on top of the existing weak-mode weighting: weak-mode already
   biases toward low-accuracy items, spaced repetition additionally
   biases toward items that are *due*, regardless of raw accuracy.
   ============================================================ */

import { pkey } from "./profiles";

const SRS_KEY = "buddhidrill-srs";
const SRS_ON_KEY = "buddhidrill-srs-on";

// box 0 = due immediately, each later box waits longer before coming due again
const INTERVALS_MS = [
  0,
  5 * 60 * 1000,          // box 1 — 5 min
  30 * 60 * 1000,         // box 2 — 30 min
  6 * 60 * 60 * 1000,     // box 3 — 6 hours
  24 * 60 * 60 * 1000,    // box 4 — 1 day
  4 * 24 * 60 * 60 * 1000, // box 5 — 4 days (mastered, revisited occasionally)
];
const MAX_BOX = INTERVALS_MS.length - 1;

export function loadSpacedRepOnPref() {
  try { return window.localStorage.getItem(pkey(SRS_ON_KEY)) === "1"; } catch { return false; }
}

export function saveSpacedRepOnPref(on) {
  try { window.localStorage.setItem(pkey(SRS_ON_KEY), on ? "1" : "0"); } catch { /* ignore */ }
}

export function loadSRS() {
  try {
    const raw = window.localStorage.getItem(pkey(SRS_KEY));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSRS(srs) {
  try { window.localStorage.setItem(pkey(SRS_KEY), JSON.stringify(srs)); } catch { /* ignore */ }
}

export function resetSRS() {
  saveSRS({});
  return {};
}

function itemKey(category, key) { return `${category}::${key}`; }

export function recordSRSOutcome(srs, category, key, correct) {
  const ik = itemKey(category, key);
  const cur = srs[ik] || { box: 0 };
  const box = correct ? Math.min(MAX_BOX, cur.box + 1) : 0;
  const dueAt = Date.now() + INTERVALS_MS[box];
  const next = { ...srs, [ik]: { box, dueAt } };
  saveSRS(next);
  return next;
}

// a priority multiplier for question-selection weighting: due/overdue items
// score well above 1, items reviewed recently and not yet due score below 1,
// and never-seen items get a moderate default so they surface reasonably often
export function srsPriority(srs, category, key) {
  const entry = srs[itemKey(category, key)];
  if (!entry) return 1.4;
  const now = Date.now();
  if (now >= entry.dueAt) {
    const overdueMs = now - entry.dueAt;
    return 1.5 + Math.min(2, overdueMs / (60 * 60 * 1000)); // grows with overdue time, capped
  }
  return 0.35;
}

export function dueCount(srs, category) {
  const now = Date.now();
  let count = 0;
  for (const k of Object.keys(srs)) {
    if (k.startsWith(`${category}::`) && srs[k].dueAt <= now) count++;
  }
  return count;
}

export function totalDueCount(srs) {
  const now = Date.now();
  return Object.values(srs).filter((e) => e.dueAt <= now).length;
}
