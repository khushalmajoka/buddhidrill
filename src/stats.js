/* ============================================================
   STATS HELPERS
   Tracks per-category, per-item accuracy and timing, persisted to
   localStorage by App.jsx. Powers both the heatmap and "weak mode"
   question weighting.
   ============================================================ */

export function emptyStats() {
  return {
    multiplication: {}, addition: {}, subtraction: {}, division: {},
    squares: {}, cubes: {}, fractions: {}, quickpct: {},
    alphaValue: {}, alphaOpposite: {},
  };
}

export function recordAnswer(stats, category, key, correct, timeMs) {
  const next = { ...stats, [category]: { ...stats[category] } };
  const cur = next[category][key] || { correct: 0, total: 0, totalTimeMs: 0 };
  const clampedTime = Number.isFinite(timeMs) ? Math.max(0, Math.min(timeMs, 120000)) : 0;
  next[category][key] = {
    correct: cur.correct + (correct ? 1 : 0),
    total: cur.total + 1,
    totalTimeMs: (cur.totalTimeMs || 0) + clampedTime,
  };
  return next;
}

export function accuracyOf(entry) {
  if (!entry || entry.total === 0) return null;
  return entry.correct / entry.total;
}

export function avgTimeOf(entry) {
  if (!entry || entry.total === 0 || !entry.totalTimeMs) return null;
  return entry.totalTimeMs / entry.total;
}

// average response time across every attempted item in a category — used as
// the "normal pace" baseline that individual items are compared against
export function categoryAvgTimeMs(stats, category) {
  const entries = Object.values(stats[category] || {});
  let sumTime = 0, sumTotal = 0;
  for (const e of entries) {
    if (e.total > 0 && e.totalTimeMs) { sumTime += e.totalTimeMs; sumTotal += e.total; }
  }
  return sumTotal > 0 ? sumTime / sumTotal : null;
}

export function weightForItem(stats, category, key) {
  const entry = stats[category] && stats[category][key];
  if (!entry || entry.total === 0) return 3; // unseen items get modest priority
  const acc = entry.correct / entry.total;
  // weaker items (low acc, more attempts) get higher weight
  const base = 1 - acc;
  let weight = 0.5 + base * 4 + Math.min(entry.total, 5) * 0.15;

  // items that consistently take longer than your usual pace for this
  // category are "slow but maybe getting there" — nudge them up too,
  // even if you're technically still getting them right
  const itemAvg = avgTimeOf(entry);
  const catAvg = categoryAvgTimeMs(stats, category);
  if (itemAvg && catAvg && catAvg > 0) {
    const slownessRatio = itemAvg / catAvg; // >1 means slower than your average for this category
    const slownessBonus = Math.max(0, Math.min(2, slownessRatio - 1));
    weight += slownessBonus * 1.5;
  }
  return weight;
}
