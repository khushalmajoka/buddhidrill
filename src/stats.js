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
    alphaValue: {}, alphaOpposite: {}, bodmas: {},
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

// aggregate accuracy across every item ever attempted in a category —
// powers the "accuracy by category" bar chart on the Progress tab
export function categoryAccuracy(stats, category) {
  const entries = Object.values(stats[category] || {});
  let correct = 0, total = 0;
  for (const e of entries) { correct += e.correct; total += e.total; }
  return { correct, total, acc: total > 0 ? correct / total : null };
}

// rolls every category up into one all-time correct/total/avg-time summary —
// powers the summary cards at the top of the Progress tab
export function allTimeSummary(stats) {
  let correct = 0, total = 0, totalTimeMs = 0, timedTotal = 0;
  for (const cat of Object.keys(stats)) {
    for (const e of Object.values(stats[cat] || {})) {
      correct += e.correct;
      total += e.total;
      if (e.totalTimeMs) { totalTimeMs += e.totalTimeMs; timedTotal += e.total; }
    }
  }
  return {
    correct,
    total,
    acc: total > 0 ? correct / total : null,
    avgTimeMs: timedTotal > 0 ? totalTimeMs / timedTotal : null,
  };
}

/* ============================================================
   DAILY HISTORY — a lightweight day-by-day correct/total log, kept
   separate from the per-item `stats` above. This is what powers the
   "learning curve" chart: per-item stats can't show trends over time,
   but a daily rollup can.
   ============================================================ */

const HISTORY_KEY = "buddhidrill-history";
const HISTORY_DAYS_KEPT = 60; // trim old entries so localStorage stays small

export function loadHistory() {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordDailyHistory(history, correct) {
  const day = new Date().toISOString().slice(0, 10);
  const cur = history[day] || { correct: 0, total: 0 };
  const next = {
    ...history,
    [day]: { correct: cur.correct + (correct ? 1 : 0), total: cur.total + 1 },
  };
  const keys = Object.keys(next).sort();
  if (keys.length > HISTORY_DAYS_KEPT) {
    for (const k of keys.slice(0, keys.length - HISTORY_DAYS_KEPT)) delete next[k];
  }
  try { window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

// returns a fixed-length array (oldest -> newest) even for days with no
// activity, so the chart always has a consistent x-axis
export function lastNDays(history, n) {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = history[key];
    out.push({
      date: key,
      correct: entry ? entry.correct : 0,
      total: entry ? entry.total : 0,
      acc: entry && entry.total > 0 ? entry.correct / entry.total : null,
    });
  }
  return out;
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
