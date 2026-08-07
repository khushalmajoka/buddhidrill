import React, { useState, useEffect, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getDatabase, ref, set, get, update, remove, onValue, onDisconnect,
} from "firebase/database";

/* ============================================================
   FIREBASE — used only for Battle Mode (shared rooms between two
   devices). Practice/Game/heatmap stay fully local (localStorage) and
   never touch this. See the setup notes for how to fill this in.
   ============================================================ */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let _dbInstance;
let _dbInitTried = false;
function getFirebaseDb() {
  if (_dbInitTried) return _dbInstance;
  _dbInitTried = true;
  try {
    if (!firebaseConfig.databaseURL) throw new Error("Firebase env vars not set");
    const app = initializeApp(firebaseConfig);
    _dbInstance = getDatabase(app);
  } catch (e) {
    console.warn("Battle Mode: Firebase not configured yet.", e);
    _dbInstance = null;
  }
  return _dbInstance;
}

function newRoomCode() {
  const charset = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — easy to read aloud
  let code = "";
  for (let i = 0; i < 5; i++) code += charset[Math.floor(Math.random() * charset.length)];
  return code;
}
function newPlayerId() {
  return "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ============================================================
   DATA
   ============================================================ */

const FRACTIONS = [
  [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5],
  [1, 6], [5, 6], [1, 7], [1, 8], [3, 8], [5, 8], [7, 8], [1, 9], [2, 9],
  [1, 10], [3, 10], [7, 10], [9, 10], [1, 11], [1, 12], [5, 12], [7, 12],
  [11, 12], [1, 16], [1, 20], [1, 25],
];

const QUICK_PCT = [
  [1, 10], [1, 5], [1, 4], [1, 2], [3, 4], [1, 8], [3, 8], [5, 8], [7, 8],
  [1, 3], [2, 3], [1, 6], [5, 6], [1, 20], [1, 25], [1, 50],
];

const CATEGORY_META = {
  multiplication: { label: "Multiplication", short: "×", ink: "#1F6F5C" },
  addition: { label: "Addition", short: "+", ink: "#2E8B57" },
  subtraction: { label: "Subtraction", short: "−", ink: "#B2662B" },
  division: { label: "Division", short: "÷", ink: "#2B5A8A" },
  squares: { label: "Squares", short: "n²", ink: "#8A4B2B" },
  cubes: { label: "Cubes", short: "n³", ink: "#4B3D8A" },
  fractions: { label: "Fraction ↔ %", short: "%", ink: "#8A2B4B" },
  quickpct: { label: "Quick %", short: "%of", ink: "#8A2B6B" },
  alphaValue: { label: "Alphabet ↔ Number", short: "A1", ink: "#4B8A2B" },
  alphaOpposite: { label: "Opposite Letters", short: "A↔Z", ink: "#2B8A8A" },
};

const CATEGORY_ORDER = [
  "multiplication", "addition", "subtraction", "division",
  "squares", "cubes", "fractions", "quickpct",
  "alphaValue", "alphaOpposite",
];

const ABSOLUTE_LIMITS = {
  multiplicationA: [2, 25],
  multiplicationB: [1, 20],
  additionA: [1, 999],
  additionB: [1, 999],
  subtractionA: [1, 999],
  subtractionB: [1, 999],
  divisionDivisor: [2, 25],
  divisionQuotient: [2, 25],
  squaresN: [1, 25],
  cubesN: [1, 25],
  fractionsMaxDen: [2, 25],
  quickpctMult: [2, 60],
  alphaValuePos: [1, 26],
  alphaOppositePos: [1, 26],
};

const DIFFICULTY_PRESETS = {
  easy: {
    multiplication: { a: [2, 10], b: [2, 5] },
    addition: { a: [1, 20], b: [1, 20] },
    subtraction: { a: [5, 20], b: [1, 20] },
    division: { divisor: [2, 10], quotient: [2, 10] },
    squares: { n: [1, 10] },
    cubes: { n: [1, 10] },
    fractions: { maxDen: 10 },
    quickpct: { mult: [2, 10] },
    alphaValue: { pos: [1, 13] },
    alphaOpposite: { pos: [1, 13] },
  },
  medium: {
    multiplication: { a: [2, 20], b: [2, 10] },
    addition: { a: [1, 100], b: [1, 100] },
    subtraction: { a: [10, 100], b: [1, 100] },
    division: { divisor: [2, 20], quotient: [2, 20] },
    squares: { n: [1, 20] },
    cubes: { n: [1, 15] },
    fractions: { maxDen: 20 },
    quickpct: { mult: [2, 20] },
    alphaValue: { pos: [1, 20] },
    alphaOpposite: { pos: [1, 20] },
  },
  hard: {
    multiplication: { a: [11, 25], b: [6, 12] },
    addition: { a: [100, 999], b: [100, 999] },
    subtraction: { a: [100, 999], b: [1, 999] },
    division: { divisor: [11, 25], quotient: [11, 25] },
    squares: { n: [15, 25] },
    cubes: { n: [12, 25] },
    fractions: { maxDen: 25 },
    quickpct: { mult: [15, 40] },
    alphaValue: { pos: [1, 26] },
    alphaOpposite: { pos: [1, 26] },
  },
};

/* ============================================================
   HELPERS
   ============================================================ */

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function simplify(n, d) { const g = gcd(n, d); return [n / g, d / g]; }
function pctLabel(num, den) {
  const v = (num / den) * 100;
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? `${r}` : r.toFixed(2).replace(/0$/, "");
}
function randInt(min, max, rng) {
  const r = rng ? rng() : Math.random();
  return Math.floor(r * (max - min + 1)) + min;
}
function pick(arr, rng) { return arr[randInt(0, arr.length - 1, rng)]; }

// groups a wide numeric range into ~10 buckets so heatmaps stay readable
// even when the user opens the range up to e.g. 100-999
function bucketForRange(n, lo, hi) {
  const span = Math.max(1, hi - lo + 1);
  const bucketSize = Math.max(1, Math.ceil(span / 10));
  if (bucketSize === 1) return String(n);
  const idx = Math.floor((n - lo) / bucketSize);
  const start = lo + idx * bucketSize;
  const end = Math.min(hi, start + bucketSize - 1);
  return `${start}-${end}`;
}
function bucketItemsForRange(lo, hi) {
  const span = Math.max(1, hi - lo + 1);
  const bucketSize = Math.max(1, Math.ceil(span / 10));
  const items = [];
  for (let start = lo; start <= hi; start += bucketSize) {
    const end = Math.min(hi, start + bucketSize - 1);
    items.push(bucketSize === 1 ? String(start) : `${start}-${end}`);
  }
  return items;
}

/* ============================================================
   SETTINGS HANDLER FACTORIES — Practice and Battle each keep their own
   independent active/ranges/difficulty/answerMode state, but the logic
   for toggling a category or editing a range is identical, so it's
   built once here and bound to whichever setters are passed in.
   ============================================================ */

function clampInt(val, lo, hi) {
  if (Number.isNaN(val)) return lo;
  return Math.min(Math.max(val, lo), hi);
}

function makeToggleCategory(setActiveFn) {
  return (cat) => {
    setActiveFn((a) => {
      const next = { ...a, [cat]: !a[cat] };
      if (!Object.values(next).some(Boolean)) return a; // keep at least one on
      return next;
    });
  };
}

function makeApplyDifficulty(setRangesFn, setDifficultyLabelFn) {
  return (label) => {
    setDifficultyLabelFn(label);
    setRangesFn(JSON.parse(JSON.stringify(DIFFICULTY_PRESETS[label])));
  };
}

// updates one end (0=min, 1=max) of a two-value range for a category/field,
// e.g. updateRangePair('multiplication', 'a', 0, 5)
function makeUpdateRangePair(setRangesFn, setDifficultyLabelFn) {
  return (cat, field, idx, rawValue) => {
    const limitsKey = `${cat}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    const [lo, hi] = ABSOLUTE_LIMITS[limitsKey] || [1, 99];
    const value = clampInt(parseInt(rawValue, 10), lo, hi);
    setDifficultyLabelFn("custom");
    setRangesFn((r) => {
      const pair = [...r[cat][field]];
      pair[idx] = value;
      if (pair[0] > pair[1]) {
        if (idx === 0) pair[1] = pair[0]; else pair[0] = pair[1];
      }
      return { ...r, [cat]: { ...r[cat], [field]: pair } };
    });
  };
}

function makeUpdateSingleValue(setRangesFn, setDifficultyLabelFn) {
  return (cat, field, rawValue) => {
    const limitsKey = `${cat}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    const [lo, hi] = ABSOLUTE_LIMITS[limitsKey] || [1, 99];
    const value = clampInt(parseInt(rawValue, 10), lo, hi);
    setDifficultyLabelFn("custom");
    setRangesFn((r) => ({ ...r, [cat]: { ...r[cat], [field]: value } }));
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i, rng);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function numDistractors(answer, spread, count = 3, rng) {
  const set = new Set([answer]);
  let guard = 0;
  while (set.size < count + 1 && guard < 200) {
    guard++;
    const delta = randInt(-spread, spread, rng);
    const cand = answer + (delta === 0 ? spread : delta);
    if (cand > 0 && !set.has(cand)) set.add(cand);
  }
  return [...set].filter((v) => v !== answer);
}

/* ============================================================
   QUESTION GENERATORS
   returns { category, key, keyLabel, prompt, answer, type, options?, checkFillBlank }
   ============================================================ */

function rnd(rng) { return rng ? rng() : Math.random(); }

function genMultiplication(forceType, ranges, rng) {
  const r = ranges.multiplication;
  const a = randInt(r.a[0], r.a[1], rng);
  const b = randInt(r.b[0], r.b[1], rng);
  const answer = a * b;
  const asMcq = forceType ? forceType === "mcq" : rnd(rng) < 0.5;
  const prompt = `${a} × ${b} = ?`;
  if (asMcq) {
    const options = shuffle([answer, ...numDistractors(answer, Math.max(6, a), 3, rng)], rng);
    return { category: "multiplication", key: a, keyLabel: a, prompt, answer, type: "mcq", options };
  }
  return { category: "multiplication", key: a, keyLabel: a, prompt, answer, type: "fill" };
}

function genAddition(forceType, ranges, rng) {
  const r = ranges.addition;
  const a = randInt(r.a[0], r.a[1], rng);
  const b = randInt(r.b[0], r.b[1], rng);
  const answer = a + b;
  const key = bucketForRange(a, r.a[0], r.a[1]);
  const asMcq = forceType ? forceType === "mcq" : rnd(rng) < 0.5;
  const prompt = `${a} + ${b} = ?`;
  const spread = Math.max(5, Math.round(answer * 0.15));
  if (asMcq) {
    const options = shuffle([answer, ...numDistractors(answer, spread, 3, rng)], rng);
    return { category: "addition", key, keyLabel: key, prompt, answer, type: "mcq", options };
  }
  return { category: "addition", key, keyLabel: key, prompt, answer, type: "fill" };
}

function genSubtraction(forceType, ranges, rng) {
  const r = ranges.subtraction;
  const x = randInt(r.a[0], r.a[1], rng);
  const y = randInt(r.b[0], r.b[1], rng);
  const big = Math.max(x, y);
  const small = Math.min(x, y);
  const answer = big - small;
  const key = bucketForRange(big, Math.min(r.a[0], r.b[0]), Math.max(r.a[1], r.b[1]));
  const asMcq = forceType ? forceType === "mcq" : rnd(rng) < 0.5;
  const prompt = `${big} − ${small} = ?`;
  const spread = Math.max(5, Math.round((answer || 1) * 0.2) + 3);
  if (asMcq) {
    const options = shuffle([answer, ...numDistractors(answer, spread, 3, rng)], rng);
    return { category: "subtraction", key, keyLabel: key, prompt, answer, type: "mcq", options };
  }
  return { category: "subtraction", key, keyLabel: key, prompt, answer, type: "fill" };
}

function genDivision(forceType, ranges, rng) {
  const r = ranges.division;
  const divisor = randInt(r.divisor[0], r.divisor[1], rng);
  const quotient = randInt(r.quotient[0], r.quotient[1], rng);
  const dividend = divisor * quotient;
  const answer = quotient;
  const asMcq = forceType ? forceType === "mcq" : rnd(rng) < 0.5;
  const prompt = `${dividend} ÷ ${divisor} = ?`;
  if (asMcq) {
    const options = shuffle([answer, ...numDistractors(answer, Math.max(4, Math.round(answer * 0.3)), 3, rng)], rng);
    return { category: "division", key: divisor, keyLabel: divisor, prompt, answer, type: "mcq", options };
  }
  return { category: "division", key: divisor, keyLabel: divisor, prompt, answer, type: "fill" };
}

function genSquares(forceType, ranges, rng) {
  const r = ranges.squares;
  const n = randInt(r.n[0], r.n[1], rng);
  const answer = n * n;
  const asMcq = forceType ? forceType === "mcq" : rnd(rng) < 0.5;
  const prompt = `${n}² = ?`;
  if (asMcq) {
    const options = shuffle([answer, ...numDistractors(answer, Math.max(8, n * 2), 3, rng)], rng);
    return { category: "squares", key: n, keyLabel: n, prompt, answer, type: "mcq", options };
  }
  return { category: "squares", key: n, keyLabel: n, prompt, answer, type: "fill" };
}

function genCubes(forceType, ranges, rng) {
  const r = ranges.cubes;
  const n = randInt(r.n[0], r.n[1], rng);
  const answer = n * n * n;
  const asMcq = forceType ? forceType === "mcq" : rnd(rng) < 0.5;
  const prompt = `${n}³ = ?`;
  if (asMcq) {
    const spread = Math.max(20, Math.round(answer * 0.15));
    const options = shuffle([answer, ...numDistractors(answer, spread, 3, rng)], rng);
    return { category: "cubes", key: n, keyLabel: n, prompt, answer, type: "mcq", options };
  }
  return { category: "cubes", key: n, keyLabel: n, prompt, answer, type: "fill" };
}

function genFractions(forceType, ranges, rng) {
  const maxDen = ranges.fractions.maxDen;
  const pool = FRACTIONS.filter(([, d]) => d <= maxDen);
  const usable = pool.length >= 4 ? pool : FRACTIONS;
  const [num, den] = pick(usable, rng);
  const key = `${num}/${den}`;
  const directionA = rnd(rng) < 0.6; // fraction -> %
  if (directionA) {
    const answerLabel = pctLabel(num, den);
    const answerVal = parseFloat(answerLabel);
    const prompt = `${num}/${den} = ?%`;
    const asMcq = forceType ? forceType === "mcq" : rnd(rng) < 0.6;
    if (asMcq) {
      const distractors = [];
      const others = shuffle(usable.filter((f) => f[0] !== num || f[1] !== den), rng).slice(0, 6);
      for (const [n2, d2] of others) {
        const lbl = pctLabel(n2, d2);
        if (lbl !== answerLabel && !distractors.includes(lbl)) distractors.push(lbl);
        if (distractors.length >= 3) break;
      }
      const options = shuffle([answerLabel, ...distractors], rng);
      return {
        category: "fractions", key, keyLabel: key, prompt, answer: answerLabel,
        type: "mcq", options,
      };
    }
    return {
      category: "fractions", key, keyLabel: key, prompt, answer: answerLabel,
      type: "fill", tolerance: 0.06 * Math.max(1, answerVal),
    };
  } else {
    const [sn, sd] = simplify(num, den);
    const answer = `${sn}/${sd}`;
    const label = pctLabel(num, den);
    const asMcq = forceType ? forceType === "mcq" : rnd(rng) < 0.5;
    if (!asMcq) {
      const prompt = `${label}% = ? (lowest-terms fraction, e.g. 3/4)`;
      return {
        category: "fractions", key, keyLabel: key, prompt, answer,
        type: "fill", answerIsText: true, inputMode: "text", placeholder: "e.g. 3/4",
      };
    }
    const prompt = `${label}% = ? (lowest terms fraction)`;
    const others = shuffle(usable.filter((f) => f[0] !== num || f[1] !== den), rng).slice(0, 6);
    const distractors = [];
    for (const [n2, d2] of others) {
      const [a, b] = simplify(n2, d2);
      const lbl = `${a}/${b}`;
      if (lbl !== answer && !distractors.includes(lbl)) distractors.push(lbl);
      if (distractors.length >= 3) break;
    }
    const options = shuffle([answer, ...distractors], rng);
    return { category: "fractions", key, keyLabel: key, prompt, answer, type: "mcq", options };
  }
}

function genQuickPct(forceType, ranges, rng) {
  const r = ranges.quickpct;
  const [num, den] = pick(QUICK_PCT, rng);
  const mult = randInt(r.mult[0], r.mult[1], rng);
  const base = den * mult;
  const answer = (base * num) / den;
  const label = pctLabel(num, den);
  const prompt = `${label}% of ${base} = ?`;
  const asMcq = forceType ? forceType === "mcq" : rnd(rng) < 0.55;
  const key = label;
  if (asMcq) {
    const spread = Math.max(4, Math.round(answer * 0.2));
    const options = shuffle([answer, ...numDistractors(answer, spread, 3, rng)], rng);
    return { category: "quickpct", key, keyLabel: `${label}%`, prompt, answer, type: "mcq", options };
  }
  return { category: "quickpct", key, keyLabel: `${label}%`, prompt, answer, type: "fill" };
}

function letterAt(pos) { return String.fromCharCode(64 + pos); }

function letterDistractors(correctLetter, count, near, rng) {
  const correctPos = correctLetter.charCodeAt(0) - 64;
  const set = new Set([correctLetter]);
  let guard = 0;
  while (set.size < count + 1 && guard < 200) {
    guard++;
    const delta = randInt(-near, near, rng);
    const cand = correctPos + (delta === 0 ? near : delta);
    if (cand >= 1 && cand <= 26) {
      const L = letterAt(cand);
      if (!set.has(L)) set.add(L);
    }
  }
  return [...set].filter((l) => l !== correctLetter);
}

// A=1, B=2 ... Z=26, quizzed in both directions
function genAlphaValue(forceType, ranges, rng) {
  const r = ranges.alphaValue;
  const pos = randInt(r.pos[0], r.pos[1], rng);
  const letter = letterAt(pos);
  const key = letter;
  const directionA = rnd(rng) < 0.5; // letter -> number
  const asMcq = forceType ? forceType === "mcq" : rnd(rng) < 0.55;

  if (directionA) {
    const prompt = `${letter} = ?`;
    const answer = pos;
    if (asMcq) {
      const options = shuffle([answer, ...numDistractors(answer, 5, 3, rng)], rng);
      return { category: "alphaValue", key, keyLabel: letter, prompt, answer, type: "mcq", options };
    }
    return { category: "alphaValue", key, keyLabel: letter, prompt, answer, type: "fill" };
  }

  const prompt = `${pos} = ?`;
  const answer = letter;
  if (asMcq) {
    const options = shuffle([answer, ...letterDistractors(letter, 3, 6, rng)], rng);
    return { category: "alphaValue", key, keyLabel: letter, prompt, answer, type: "mcq", options };
  }
  return {
    category: "alphaValue", key, keyLabel: letter, prompt, answer,
    type: "fill", answerIsText: true, inputMode: "text", placeholder: "e.g. G",
  };
}

// mirror pairs: A<->Z, B<->Y, C<->X ... — picking any letter naturally
// covers both "near the start" and "near the end" prompts
function genAlphaOpposite(forceType, ranges, rng) {
  const r = ranges.alphaOpposite;
  const pos = randInt(r.pos[0], r.pos[1], rng);
  const letter = letterAt(pos);
  const oppLetter = letterAt(27 - pos);
  const key = letter;
  const asMcq = forceType ? forceType === "mcq" : rnd(rng) < 0.55;
  const prompt = `Opposite of ${letter} = ?`;
  if (asMcq) {
    const options = shuffle([oppLetter, ...letterDistractors(oppLetter, 3, 4, rng)], rng);
    return { category: "alphaOpposite", key, keyLabel: letter, prompt, answer: oppLetter, type: "mcq", options };
  }
  return {
    category: "alphaOpposite", key, keyLabel: letter, prompt, answer: oppLetter,
    type: "fill", answerIsText: true, inputMode: "text", placeholder: "e.g. Z",
  };
}

const GENERATORS = {
  multiplication: genMultiplication,
  addition: genAddition,
  subtraction: genSubtraction,
  division: genDivision,
  squares: genSquares,
  cubes: genCubes,
  fractions: genFractions,
  quickpct: genQuickPct,
  alphaValue: genAlphaValue,
  alphaOpposite: genAlphaOpposite,
};

/* ============================================================
   BATTLE MODE — deterministic shared question sequence
   Both players precompute the *same* array of questions locally from a
   shared seed + shared settings, so nothing about the questions themselves
   ever needs to travel over the network — only scores do.
   ============================================================ */

// mulberry32: small, fast, deterministic PRNG. Same seed -> same output stream,
// on any device, forever — that's what keeps both players' questions in sync.
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const BATTLE_QUESTION_POOL_SIZE = 250; // plenty even for a fast player over 5 minutes

function generateBattleQuestions(seed, categories, ranges, answerMode) {
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

/* ============================================================
   STATS HELPERS
   ============================================================ */

function emptyStats() {
  return {
    multiplication: {}, addition: {}, subtraction: {}, division: {},
    squares: {}, cubes: {}, fractions: {}, quickpct: {},
    alphaValue: {}, alphaOpposite: {},
  };
}

function recordAnswer(stats, category, key, correct, timeMs) {
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

function accuracyOf(entry) {
  if (!entry || entry.total === 0) return null;
  return entry.correct / entry.total;
}

function avgTimeOf(entry) {
  if (!entry || entry.total === 0 || !entry.totalTimeMs) return null;
  return entry.totalTimeMs / entry.total;
}

// average response time across every attempted item in a category — used as
// the "normal pace" baseline that individual items are compared against
function categoryAvgTimeMs(stats, category) {
  const entries = Object.values(stats[category] || {});
  let sumTime = 0, sumTotal = 0;
  for (const e of entries) {
    if (e.total > 0 && e.totalTimeMs) { sumTime += e.totalTimeMs; sumTotal += e.total; }
  }
  return sumTotal > 0 ? sumTime / sumTotal : null;
}

function weightForItem(stats, category, key) {
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

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function BuddhiDrill() {
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState(emptyStats());
  const [active, setActive] = useState({
    multiplication: true, addition: true, subtraction: true, division: true,
    squares: true, cubes: true, fractions: true, quickpct: true,
    alphaValue: true, alphaOpposite: true,
  });
  const [answerMode, setAnswerMode] = useState("mixed"); // 'mixed' | 'mcq' | 'fill'
  const [ranges, setRanges] = useState(DIFFICULTY_PRESETS.medium);
  const [difficultyLabel, setDifficultyLabel] = useState("medium"); // 'easy' | 'medium' | 'hard' | 'custom'
  const [showCustomize, setShowCustomize] = useState(false);
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [fillValue, setFillValue] = useState("");
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [session, setSession] = useState({ correct: 0, total: 0, streak: 0, best: 0 });
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [weakMode, setWeakMode] = useState(false);
  const inputRef = useRef(null);
  const autoFocusRef = useRef(false);
  const advanceTimerRef = useRef(null);
  const feedbackRef = useRef(null);
  const questionRef = useRef(null);
  const fillValueRef = useRef("");
  const questionStartRef = useRef(null);

  // ---- Game mode state ----
  const [appMode, setAppMode] = useState("practice"); // 'practice' | 'game'
  const [gameCats, setGameCats] = useState({
    multiplication: true, addition: true, subtraction: true, division: true, squares: true, cubes: true,
    alphaValue: true, alphaOpposite: true,
  });
  const [gameDuration, setGameDuration] = useState(60);
  const [gameStatus, setGameStatus] = useState("setup"); // 'setup' | 'playing' | 'finished'
  const [gameTimeLeft, setGameTimeLeft] = useState(60);
  const [gameQuestion, setGameQuestion] = useState(null);
  const [gameSelected, setGameSelected] = useState(null);
  const [gameFillValue, setGameFillValue] = useState("");
  const [gameFeedback, setGameFeedback] = useState(null);
  const [gameTally, setGameTally] = useState({ correct: 0, wrong: 0, byCat: {} });
  const [gameBest, setGameBest] = useState(0);
  const gameTimerRef = useRef(null);
  const gameAdvanceRef = useRef(null);
  const gameInputRef = useRef(null);
  const gameQuestionStartRef = useRef(null);
  const gameFeedbackRef = useRef(null);
  const gameQuestionRef = useRef(null);
  const gameFillValueRef = useRef("");

  useEffect(() => { gameFeedbackRef.current = gameFeedback; }, [gameFeedback]);
  useEffect(() => { gameQuestionRef.current = gameQuestion; }, [gameQuestion]);
  useEffect(() => { gameFillValueRef.current = gameFillValue; }, [gameFillValue]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`buddhidrill-highscore-${gameDuration}`);
      setGameBest(raw ? parseInt(raw, 10) || 0 : 0);
    } catch { /* ignore */ }
  }, [gameDuration]);

  // ---- Battle mode state ----
  const [battleStage, setBattleStage] = useState("menu"); // menu | create | join | lobby | countdown | playing | results
  const [playerId] = useState(() => newPlayerId());
  const [playerName, setPlayerName] = useState(() => {
    try { return window.localStorage.getItem("buddhidrill-name") || ""; } catch { return ""; }
  });
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [battleDuration, setBattleDuration] = useState(60);
  const [battleError, setBattleError] = useState("");
  const [battleBusy, setBattleBusy] = useState(false);
  const [battleRoom, setBattleRoom] = useState(null);
  const [battleCode, setBattleCode] = useState("");
  const [battleQuestions, setBattleQuestions] = useState(null);
  const [battleIdx, setBattleIdx] = useState(0);
  const [battleSelected, setBattleSelected] = useState(null);
  const [battleFillValue, setBattleFillValue] = useState("");
  const [battleFeedback, setBattleFeedback] = useState(null);
  const [battleScore, setBattleScore] = useState({ correct: 0, wrong: 0 });
  const [battleTimeLeft, setBattleTimeLeft] = useState(0);

  // Battle keeps its own independent category/range/difficulty/answer-mode
  // settings — separate from Practice, so setting up a battle never
  // depends on whatever you last had active in Practice
  const [battleActive, setBattleActive] = useState({
    multiplication: true, addition: true, subtraction: true, division: true,
    squares: true, cubes: true, fractions: true, quickpct: true,
    alphaValue: true, alphaOpposite: true,
  });
  const [battleRanges, setBattleRanges] = useState(DIFFICULTY_PRESETS.medium);
  const [battleDifficultyLabel, setBattleDifficultyLabel] = useState("medium");
  const [battleAnswerMode, setBattleAnswerMode] = useState("mixed");
  const [battleShowCustomize, setBattleShowCustomize] = useState(false);

  const toggleBattleCategory = makeToggleCategory(setBattleActive);
  const applyBattleDifficulty = makeApplyDifficulty(setBattleRanges, setBattleDifficultyLabel);
  const updateBattleRangePair = makeUpdateRangePair(setBattleRanges, setBattleDifficultyLabel);
  const updateBattleSingleValue = makeUpdateSingleValue(setBattleRanges, setBattleDifficultyLabel);


  const [battleCountdown, setBattleCountdown] = useState(0);

  const battleStageRef = useRef("menu");
  const battleCodeRef = useRef("");
  const battleUnsubRef = useRef(null);
  const battleTimerRef = useRef(null);
  const battleAdvanceRef = useRef(null);
  const battleCountdownTimerRef = useRef(null);
  const battleQuestionsRef = useRef(null);
  const battleIdxRef = useRef(0);
  const battleFeedbackRef = useRef(null);
  const battleFillValueRef = useRef("");
  const battleQuestionStartRef = useRef(null);
  const battleStartedSeedRef = useRef(null);
  const battleInputRef = useRef(null);

  useEffect(() => { battleStageRef.current = battleStage; }, [battleStage]);
  useEffect(() => { battleCodeRef.current = battleCode; }, [battleCode]);
  useEffect(() => { battleQuestionsRef.current = battleQuestions; }, [battleQuestions]);
  useEffect(() => { battleIdxRef.current = battleIdx; }, [battleIdx]);
  useEffect(() => { battleFeedbackRef.current = battleFeedback; }, [battleFeedback]);
  useEffect(() => { battleFillValueRef.current = battleFillValue; }, [battleFillValue]);

  // clean up any live listener/timers if the whole app unmounts
  useEffect(() => () => {
    if (battleUnsubRef.current) battleUnsubRef.current();
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    if (battleAdvanceRef.current) clearTimeout(battleAdvanceRef.current);
    if (battleCountdownTimerRef.current) clearTimeout(battleCountdownTimerRef.current);
  }, []);

  useEffect(() => { feedbackRef.current = feedback; }, [feedback]);
  useEffect(() => { questionRef.current = question; }, [question]);
  useEffect(() => { fillValueRef.current = fillValue; }, [fillValue]);

  // load persisted stats (browser localStorage — works once deployed as a standalone site)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("buddhidrill-stats");
      if (raw) setStats({ ...emptyStats(), ...JSON.parse(raw) });
    } catch {
      // no saved stats yet, or storage blocked — start fresh
    } finally {
      setLoaded(true);
    }
  }, []);

  const persist = useCallback((next) => {
    try {
      window.localStorage.setItem("buddhidrill-stats", JSON.stringify(next));
    } catch {
      // storage unavailable (e.g. private browsing) — session continues without persistence
    }
  }, []);

  const pickCategory = useCallback((statsSnapshot) => {
    const pool = CATEGORY_ORDER.filter((c) => active[c]);
    if (pool.length === 0) return null;
    if (!weakMode) return pick(pool);
    // weighted toward categories with lower overall accuracy
    const weights = pool.map((c) => {
      const entries = Object.values(statsSnapshot[c] || {});
      if (entries.length === 0) return 2;
      const totalCorrect = entries.reduce((s, e) => s + e.correct, 0);
      const totalAll = entries.reduce((s, e) => s + e.total, 0);
      const acc = totalAll ? totalCorrect / totalAll : 0.5;
      return 0.5 + (1 - acc) * 3;
    });
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }, [active, weakMode]);

  const nextQuestion = useCallback((statsSnapshot, focusAfter) => {
    const cat = pickCategory(statsSnapshot);
    if (!cat) { setQuestion(null); return; }
    const forceType = answerMode === "mixed" ? undefined : answerMode;
    let q = null;
    let guard = 0;
    // in weak mode, retry generation a few times hoping to land on a weak key
    if (weakMode) {
      let bestQ = GENERATORS[cat](forceType, ranges);
      let bestW = weightForItem(statsSnapshot, cat, bestQ.key);
      while (guard < 5) {
        guard++;
        const cand = GENERATORS[cat](forceType, ranges);
        const w = weightForItem(statsSnapshot, cat, cand.key);
        if (w > bestW) { bestW = w; bestQ = cand; }
      }
      q = bestQ;
    } else {
      q = GENERATORS[cat](forceType, ranges);
    }
    autoFocusRef.current = !!focusAfter;
    questionStartRef.current = Date.now();
    setQuestion(q);
    setSelected(null);
    setFillValue("");
    setFeedback(null);
  }, [pickCategory, weakMode, answerMode, ranges]);

  // initial question on load — no auto-focus, so the keyboard doesn't pop
  // open the moment the page finishes loading on mobile
  useEffect(() => {
    if (loaded && !question) nextQuestion(stats, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // only steal focus into the answer box when the question changed because
  // the user answered and moved on — never when a chip/setting change
  // silently regenerated the question underneath them
  useEffect(() => {
    if (question && question.type === "fill" && inputRef.current && autoFocusRef.current) {
      inputRef.current.focus();
    }
    autoFocusRef.current = false;
  }, [question]);

  function submitAnswer(userAnswer) {
    if (!question || feedback) return;
    let correct;
    if (question.type === "mcq") {
      correct = String(userAnswer) === String(question.answer);
      setSelected(userAnswer);
    } else {
      const raw = String(userAnswer).trim();
      if (question.answerIsText) {
        const norm = (s) => s.replace(/\s+/g, "").toLowerCase();
        correct = norm(raw) === norm(String(question.answer));
      } else {
        const num = Number(raw);
        if (question.tolerance !== undefined) {
          correct = !Number.isNaN(num) && Math.abs(num - parseFloat(question.answer)) <= question.tolerance;
        } else {
          correct = !Number.isNaN(num) && num === question.answer;
        }
      }
    }
    setFeedback(correct ? "correct" : "wrong");
    const elapsedMs = questionStartRef.current ? Date.now() - questionStartRef.current : 0;
    const nextStats = recordAnswer(stats, question.category, question.key, correct, elapsedMs);
    setStats(nextStats);
    persist(nextStats);
    setSession((s) => {
      const streak = correct ? s.streak + 1 : 0;
      return {
        correct: s.correct + (correct ? 1 : 0),
        total: s.total + 1,
        streak,
        best: Math.max(s.best, streak),
      };
    });

    // correct answers auto-advance after a short beat; wrong answers wait for Enter
    if (correct) {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        handleNext();
      }, 700);
    }
  }

  function handleFillSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (feedbackRef.current) return; // already answered — Enter should advance, handled by keydown listener
    if (fillValueRef.current.trim() === "") return;
    submitAnswer(fillValueRef.current.trim());
  }

  function handleNext() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    nextQuestion(stats, true);
  }

  // global Enter handling: submits a typed fill-blank answer, or advances to the
  // next question once feedback (correct/wrong) is showing (practice mode only)
  useEffect(() => {
    function onKeyDown(e) {
      if (appMode !== "practice") return;
      if (e.key !== "Enter") return;
      const q = questionRef.current;
      if (!q) return;
      if (feedbackRef.current) {
        e.preventDefault();
        handleNext();
      } else if (q.type === "fill") {
        e.preventDefault();
        handleFillSubmit();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
  }, []);

  /* ============================================================
     GAME MODE — fast-paced timed challenge across chosen categories
     ============================================================ */

  const GAME_CATEGORY_ORDER = ["multiplication", "addition", "subtraction", "division", "squares", "cubes", "alphaValue", "alphaOpposite"];

  function toggleGameCat(cat) {
    setGameCats((c) => {
      const next = { ...c, [cat]: !c[cat] };
      if (!Object.values(next).some(Boolean)) return c; // keep at least one on
      return next;
    });
  }

  function pickGameCategory() {
    const pool = GAME_CATEGORY_ORDER.filter((c) => gameCats[c]);
    return pool.length ? pick(pool) : "multiplication";
  }

  function nextGameQuestion() {
    const cat = pickGameCategory();
    const forceType = answerMode === "mixed" ? undefined : answerMode;
    const q = GENERATORS[cat](forceType, ranges);
    gameQuestionStartRef.current = Date.now();
    setGameQuestion(q);
    setGameSelected(null);
    setGameFillValue("");
    setGameFeedback(null);
  }

  function startGame() {
    setGameStatus("playing");
    setGameTimeLeft(gameDuration);
    setGameTally({ correct: 0, wrong: 0, byCat: {} });
    nextGameQuestion();
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    gameTimerRef.current = setInterval(() => {
      setGameTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(gameTimerRef.current);
          gameTimerRef.current = null;
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function endGame() {
    if (gameTimerRef.current) { clearInterval(gameTimerRef.current); gameTimerRef.current = null; }
    if (gameAdvanceRef.current) { clearTimeout(gameAdvanceRef.current); gameAdvanceRef.current = null; }
    setGameStatus("finished");
    setGameTally((tally) => {
      if (tally.correct > gameBest) {
        setGameBest(tally.correct);
        try { window.localStorage.setItem(`buddhidrill-highscore-${gameDuration}`, String(tally.correct)); } catch { /* ignore */ }
      }
      return tally;
    });
  }

  function submitGameAnswer(userAnswer) {
    const q = gameQuestion;
    if (!q || gameFeedback || gameStatus !== "playing") return;
    let correct;
    if (q.type === "mcq") {
      correct = String(userAnswer) === String(q.answer);
      setGameSelected(userAnswer);
    } else {
      const raw = String(userAnswer).trim();
      if (q.answerIsText) {
        const norm = (s) => s.replace(/\s+/g, "").toLowerCase();
        correct = norm(raw) === norm(String(q.answer));
      } else {
        const num = Number(raw);
        if (q.tolerance !== undefined) {
          correct = !Number.isNaN(num) && Math.abs(num - parseFloat(q.answer)) <= q.tolerance;
        } else {
          correct = !Number.isNaN(num) && num === q.answer;
        }
      }
    }
    setGameFeedback(correct ? "correct" : "wrong");

    const elapsedMs = gameQuestionStartRef.current ? Date.now() - gameQuestionStartRef.current : 0;
    const nextStats = recordAnswer(stats, q.category, q.key, correct, elapsedMs);
    setStats(nextStats);
    persist(nextStats);

    setGameTally((t) => {
      const byCat = { ...t.byCat };
      const c = byCat[q.category] || { correct: 0, total: 0 };
      byCat[q.category] = { correct: c.correct + (correct ? 1 : 0), total: c.total + 1 };
      return { correct: t.correct + (correct ? 1 : 0), wrong: t.wrong + (correct ? 0 : 1), byCat };
    });

    if (gameAdvanceRef.current) clearTimeout(gameAdvanceRef.current);
    gameAdvanceRef.current = setTimeout(() => {
      gameAdvanceRef.current = null;
      if (gameStatus === "playing") nextGameQuestion();
    }, correct ? 450 : 900);
  }

  function handleGameFillSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (gameFeedbackRef.current) return;
    if (gameFillValueRef.current.trim() === "") return;
    submitGameAnswer(gameFillValueRef.current.trim());
  }

  useEffect(() => {
    if (gameStatus === "playing" && gameQuestion && gameQuestion.type === "fill" && gameInputRef.current) {
      gameInputRef.current.focus();
    }
  }, [gameQuestion, gameStatus]);

  useEffect(() => {
    function onGameKeyDown(e) {
      if (appMode !== "game" || gameStatus !== "playing") return;
      if (e.key !== "Enter") return;
      const q = gameQuestionRef.current;
      if (!q || q.type !== "fill" || gameFeedbackRef.current) return;
      e.preventDefault();
      handleGameFillSubmit();
    }
    document.addEventListener("keydown", onGameKeyDown);
    return () => document.removeEventListener("keydown", onGameKeyDown);
  });

  useEffect(() => () => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (gameAdvanceRef.current) clearTimeout(gameAdvanceRef.current);
  }, []);

  /* ============================================================
     BATTLE MODE — Firebase-backed room, two players, same questions
     ============================================================ */

  function subscribeToRoom(code) {
    const db = getFirebaseDb();
    if (!db) return;
    if (battleUnsubRef.current) battleUnsubRef.current();
    const roomRef = ref(db, `rooms/${code}`);
    battleUnsubRef.current = onValue(roomRef, (snap) => {
      const val = snap.exists() ? snap.val() : null;
      setBattleRoom(val);
      if (!val) return; // room was removed (host left / expired)

      // only ever start a round once per seed — otherwise every later
      // write to the room (opponent's score ticking up, etc.) would
      // re-trigger this and reset an already-finished player's score
      if (val.status === "playing" && val.seed != null && val.seed !== battleStartedSeedRef.current) {
        battleStartedSeedRef.current = val.seed;
        beginBattleCountdown(val);
      }
      if (val.status === "waiting") {
        battleStartedSeedRef.current = null;
        if (battleStageRef.current === "results" || battleStageRef.current === "countdown") {
          // host started a rematch — jump everyone back to the lobby
          setBattleStage("lobby");
        }
      }

      // once both players have finished, mark the room so late listeners
      // don't try to (re)start anything and the lobby knows a round happened
      if (val.status === "playing" && val.players) {
        const ids = Object.keys(val.players);
        const bothDone = ids.length === 2 && ids.every((id) => val.players[id].finishedAt);
        if (bothDone && val.hostId === playerId) {
          update(ref(db, `rooms/${code}`), { status: "finished" }).catch(() => {});
        }
      }
    });
  }

  async function handleCreateRoom() {
    const db = getFirebaseDb();
    if (!db) { setBattleError("Battle Mode isn't configured yet — see the Firebase setup notes."); return; }
    const name = playerName.trim() || "Player 1";
    try { window.localStorage.setItem("buddhidrill-name", name); } catch { /* ignore */ }
    setBattleError("");
    setBattleBusy(true);
    try {
      let code = newRoomCode();
      for (let tries = 0; tries < 5; tries++) {
        const snap = await get(ref(db, `rooms/${code}`));
        if (!snap.exists()) break;
        code = newRoomCode();
      }
      const activeCats = CATEGORY_ORDER.filter((c) => battleActive[c]);
      const roomData = {
        code,
        createdAt: Date.now(),
        status: "waiting",
        hostId: playerId,
        duration: battleDuration,
        settings: { categories: activeCats, ranges: battleRanges, answerMode: battleAnswerMode, difficultyLabel: battleDifficultyLabel },
        seed: null,
        startAt: null,
        players: {
          [playerId]: { name, isHost: true, score: { correct: 0, wrong: 0 }, finishedAt: null, joinedAt: Date.now() },
        },
      };
      await set(ref(db, `rooms/${code}`), roomData);
      onDisconnect(ref(db, `rooms/${code}/players/${playerId}`)).remove();
      setBattleCode(code);
      subscribeToRoom(code);
      setBattleStage("lobby");
    } catch (e) {
      setBattleError("Couldn't create the room. Check your connection and try again.");
    } finally {
      setBattleBusy(false);
    }
  }

  async function handleJoinRoom() {
    const db = getFirebaseDb();
    if (!db) { setBattleError("Battle Mode isn't configured yet — see the Firebase setup notes."); return; }
    const code = joinCodeInput.trim().toUpperCase();
    if (code.length < 4) { setBattleError("Enter the room code your friend shared with you."); return; }
    const name = playerName.trim() || "Player 2";
    try { window.localStorage.setItem("buddhidrill-name", name); } catch { /* ignore */ }
    setBattleError("");
    setBattleBusy(true);
    try {
      const snap = await get(ref(db, `rooms/${code}`));
      if (!snap.exists()) { setBattleError("No room found with that code."); setBattleBusy(false); return; }
      const room = snap.val();
      if (room.status !== "waiting") { setBattleError("That room already started — ask for a new code."); setBattleBusy(false); return; }
      const existingCount = room.players ? Object.keys(room.players).length : 0;
      if (existingCount >= 2) { setBattleError("That room is already full."); setBattleBusy(false); return; }

      await update(ref(db, `rooms/${code}/players/${playerId}`), {
        name, isHost: false, score: { correct: 0, wrong: 0 }, finishedAt: null, joinedAt: Date.now(),
      });
      onDisconnect(ref(db, `rooms/${code}/players/${playerId}`)).remove();
      setBattleCode(code);
      subscribeToRoom(code);
      setBattleStage("lobby");
    } catch (e) {
      setBattleError("Couldn't join that room. Check your connection and try again.");
    } finally {
      setBattleBusy(false);
    }
  }

  function beginBattleCountdown(room) {
    const qs = generateBattleQuestions(room.seed, room.settings.categories, room.settings.ranges, room.settings.answerMode);
    setBattleQuestions(qs);
    setBattleIdx(0);
    setBattleScore({ correct: 0, wrong: 0 });
    setBattleSelected(null);
    setBattleFillValue("");
    setBattleFeedback(null);
    setBattleStage("countdown");

    const tick = () => {
      const msLeft = room.startAt - Date.now();
      if (msLeft <= 0) {
        setBattleStage("playing");
        startBattleTimer(room.duration, room.startAt);
        battleQuestionStartRef.current = Date.now();
        return;
      }
      setBattleCountdown(Math.ceil(msLeft / 1000));
      battleCountdownTimerRef.current = setTimeout(tick, 150);
    };
    tick();
  }

  function startBattleTimer(duration, startAt) {
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    const endAt = startAt + duration * 1000;
    const update_ = () => setBattleTimeLeft(Math.max(0, Math.round((endAt - Date.now()) / 1000)));
    update_();
    battleTimerRef.current = setInterval(() => {
      update_();
      if (Date.now() >= endAt) {
        clearInterval(battleTimerRef.current);
        battleTimerRef.current = null;
        finishBattleForMe();
      }
    }, 250);
  }

  function finishBattleForMe() {
    if (battleAdvanceRef.current) { clearTimeout(battleAdvanceRef.current); battleAdvanceRef.current = null; }
    const db = getFirebaseDb();
    if (db && battleCodeRef.current) {
      update(ref(db, `rooms/${battleCodeRef.current}/players/${playerId}`), { finishedAt: Date.now() }).catch(() => {});
    }
    setBattleStage("results");
  }

  function submitBattleAnswer(userAnswer) {
    if (battleStageRef.current !== "playing" || battleFeedbackRef.current) return;
    const qs = battleQuestionsRef.current;
    const idx = battleIdxRef.current;
    const q = qs && qs[idx % qs.length];
    if (!q) return;

    let correct;
    if (q.type === "mcq") {
      correct = String(userAnswer) === String(q.answer);
      setBattleSelected(userAnswer);
    } else {
      const raw = String(userAnswer).trim();
      if (q.answerIsText) {
        const norm = (s) => s.replace(/\s+/g, "").toLowerCase();
        correct = norm(raw) === norm(String(q.answer));
      } else {
        const num = Number(raw);
        correct = q.tolerance !== undefined
          ? !Number.isNaN(num) && Math.abs(num - parseFloat(q.answer)) <= q.tolerance
          : !Number.isNaN(num) && num === q.answer;
      }
    }
    setBattleFeedback(correct ? "correct" : "wrong");

    const elapsedMs = battleQuestionStartRef.current ? Date.now() - battleQuestionStartRef.current : 0;
    const nextStats = recordAnswer(stats, q.category, q.key, correct, elapsedMs);
    setStats(nextStats);
    persist(nextStats);

    setBattleScore((s) => {
      const next = { correct: s.correct + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) };
      const db = getFirebaseDb();
      if (db && battleCodeRef.current) {
        update(ref(db, `rooms/${battleCodeRef.current}/players/${playerId}`), { score: next }).catch(() => {});
      }
      return next;
    });

    if (battleAdvanceRef.current) clearTimeout(battleAdvanceRef.current);
    battleAdvanceRef.current = setTimeout(() => {
      battleAdvanceRef.current = null;
      if (battleStageRef.current !== "playing") return;
      setBattleIdx((i) => i + 1);
      setBattleSelected(null);
      setBattleFillValue("");
      setBattleFeedback(null);
      battleQuestionStartRef.current = Date.now();
    }, correct ? 450 : 900);
  }

  function handleBattleFillSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (battleFeedbackRef.current) return;
    if (battleFillValueRef.current.trim() === "") return;
    submitBattleAnswer(battleFillValueRef.current.trim());
  }

  useEffect(() => {
    const q = battleQuestions && battleQuestions[battleIdx % battleQuestions.length];
    if (battleStage === "playing" && q && q.type === "fill" && battleInputRef.current) {
      battleInputRef.current.focus();
    }
  }, [battleIdx, battleStage, battleQuestions]);

  useEffect(() => {
    function onBattleKeyDown(e) {
      if (appMode !== "battle" || battleStageRef.current !== "playing") return;
      if (e.key !== "Enter") return;
      const qs = battleQuestionsRef.current;
      const q = qs && qs[battleIdxRef.current % qs.length];
      if (!q || q.type !== "fill" || battleFeedbackRef.current) return;
      e.preventDefault();
      handleBattleFillSubmit();
    }
    document.addEventListener("keydown", onBattleKeyDown);
    return () => document.removeEventListener("keydown", onBattleKeyDown);
  });

  async function handleSyncRoomSettings() {
    const db = getFirebaseDb();
    if (!db || !battleCode) return;
    const activeCats = CATEGORY_ORDER.filter((c) => battleActive[c]);
    await update(ref(db, `rooms/${battleCode}`), {
      duration: battleDuration,
      settings: { categories: activeCats, ranges: battleRanges, answerMode: battleAnswerMode, difficultyLabel: battleDifficultyLabel },
    }).catch(() => {});
  }

  async function handleStartBattle() {
    const db = getFirebaseDb();
    if (!db || !battleCode) return;
    const seed = Math.floor(Math.random() * 2 ** 31);
    const startAt = Date.now() + 4000;
    const activeCats = CATEGORY_ORDER.filter((c) => battleActive[c]);
    await update(ref(db, `rooms/${battleCode}`), {
      status: "playing", seed, startAt, duration: battleDuration,
      settings: { categories: activeCats, ranges: battleRanges, answerMode: battleAnswerMode, difficultyLabel: battleDifficultyLabel },
    }).catch(() => {});
  }

  async function handleRematch() {
    const db = getFirebaseDb();
    if (!db || !battleCode || !battleRoom) return;
    const resetPlayers = {};
    Object.entries(battleRoom.players || {}).forEach(([pid, p]) => {
      resetPlayers[pid] = { ...p, score: { correct: 0, wrong: 0 }, finishedAt: null };
    });
    await update(ref(db, `rooms/${battleCode}`), {
      status: "waiting", seed: null, startAt: null, players: resetPlayers,
    }).catch(() => {});
    setBattleStage("lobby");
  }

  function handleLeaveRoom() {
    if (battleUnsubRef.current) { battleUnsubRef.current(); battleUnsubRef.current = null; }
    if (battleTimerRef.current) { clearInterval(battleTimerRef.current); battleTimerRef.current = null; }
    if (battleAdvanceRef.current) { clearTimeout(battleAdvanceRef.current); battleAdvanceRef.current = null; }
    if (battleCountdownTimerRef.current) { clearTimeout(battleCountdownTimerRef.current); battleCountdownTimerRef.current = null; }
    const db = getFirebaseDb();
    if (db && battleCode) {
      if (battleRoom && battleRoom.hostId === playerId) {
        remove(ref(db, `rooms/${battleCode}`)).catch(() => {});
      } else {
        remove(ref(db, `rooms/${battleCode}/players/${playerId}`)).catch(() => {});
      }
    }
    setBattleRoom(null);
    setBattleCode("");
    setBattleQuestions(null);
    setBattleError("");
    battleStartedSeedRef.current = null;
    setBattleStage("menu");
  }

  function handleReset() {
    const fresh = emptyStats();
    setStats(fresh);
    persist(fresh);
    setSession({ correct: 0, total: 0, streak: 0, best: 0 });
  }

  function toggleCategory(cat) { makeToggleCategory(setActive)(cat); }

  const applyDifficulty = makeApplyDifficulty(setRanges, setDifficultyLabel);
  const updateRangePair = makeUpdateRangePair(setRanges, setDifficultyLabel);
  const updateSingleValue = makeUpdateSingleValue(setRanges, setDifficultyLabel);

  // regenerate the question when settings change (category toggle, difficulty,
  // custom ranges, answer mode) — never auto-focus here, this isn't the user
  // asking to move to the next question, just a settings tweak
  useEffect(() => {
    if (loaded) nextQuestion(stats, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, answerMode, ranges]);

  const accuracyPct = session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0;

  return (
    <div style={styles.page} className="bd-page">
      <style>{FONT_IMPORT + GLOBAL_CSS}</style>

      <div style={styles.wrap} className="bd-wrap">
        {/* ADMIT-CARD HEADER */}
        <header style={styles.header} className="bd-header">
          <div style={styles.headerLeft} className="bd-header-left">
            <div style={styles.eyebrow}>BUDDHIDRILL · BRAIN GAMES</div>
            <h1 style={styles.title}>BuddhiDrill</h1>
            <div style={styles.subtitle}>A playful daily workout for your math &amp; memory</div>
          </div>
          <div style={styles.stampBox} className="bd-stamp">
            <div style={styles.stampRow}>
              <span style={styles.stampLabel}>SCORE</span>
              <span style={styles.stampVal}>{session.correct}/{session.total}</span>
            </div>
            <div style={styles.stampRow}>
              <span style={styles.stampLabel}>ACCURACY</span>
              <span style={styles.stampVal}>{accuracyPct}%</span>
            </div>
            <div style={styles.stampRow}>
              <span style={styles.stampLabel}>STREAK</span>
              <span style={styles.stampVal}>{session.streak} <span style={styles.stampSub}>(best {session.best})</span></span>
            </div>
          </div>
        </header>

        {/* APP MODE: PRACTICE VS GAME */}
        <div style={styles.modeRow}>
          <span style={styles.modeLabel}>Mode:</span>
          <div style={styles.segmentGroup}>
            {[
              { id: "practice", label: "📖 Practice" },
              { id: "game", label: "🎮 Game" },
              { id: "battle", label: "⚔️ Battle" },
            ].map((opt) => {
              const on = appMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setAppMode(opt.id)}
                  style={{
                    ...styles.segmentBtn,
                    background: on ? "#E8B23D" : "transparent",
                    color: on ? "#0B1929" : "#93A6B8",
                    fontWeight: on ? 700 : 500,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {appMode === "practice" && (
        <>
        {/* CATEGORY TOGGLES */}
        <div style={styles.chipsRow}>
          {CATEGORY_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat];
            const on = active[cat];
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                style={{
                  ...styles.chip,
                  borderColor: on ? meta.ink : "#3E566B",
                  color: on ? "#F4EFE3" : "#7C93A8",
                  background: on ? meta.ink : "transparent",
                }}
              >
                <span style={styles.chipTag}>{meta.short}</span> {meta.label}
              </button>
            );
          })}
          <button
            onClick={() => setWeakMode((w) => !w)}
            style={{
              ...styles.chip,
              marginLeft: "auto",
              borderColor: weakMode ? "#E8B23D" : "#3E566B",
              color: weakMode ? "#0B1929" : "#7C93A8",
              background: weakMode ? "#E8B23D" : "transparent",
              fontWeight: 700,
            }}
            title="Bias questions toward the numbers you get wrong most, or answer slowest"
          >
            🎯 Focus weak spots {weakMode ? "ON" : "OFF"}
          </button>
        </div>

        {/* ANSWER MODE TOGGLE */}
        <div style={styles.modeRow}>
          <span style={styles.modeLabel}>Question type:</span>
          <div style={styles.segmentGroup}>
            {[
              { id: "mixed", label: "Mixed" },
              { id: "mcq", label: "MCQ only" },
              { id: "fill", label: "Fill in the blank" },
            ].map((opt) => {
              const on = answerMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setAnswerMode(opt.id)}
                  style={{
                    ...styles.segmentBtn,
                    background: on ? "#E8B23D" : "transparent",
                    color: on ? "#0B1929" : "#93A6B8",
                    fontWeight: on ? 700 : 500,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* DIFFICULTY + CUSTOM RANGE */}
        <div style={styles.modeRow}>
          <span style={styles.modeLabel}>Difficulty:</span>
          <div style={styles.segmentGroup}>
            {[
              { id: "easy", label: "Easy" },
              { id: "medium", label: "Medium" },
              { id: "hard", label: "Hard" },
            ].map((opt) => {
              const on = difficultyLabel === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => applyDifficulty(opt.id)}
                  style={{
                    ...styles.segmentBtn,
                    background: on ? "#E8B23D" : "transparent",
                    color: on ? "#0B1929" : "#93A6B8",
                    fontWeight: on ? 700 : 500,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
            {difficultyLabel === "custom" && (
              <span style={{ ...styles.segmentBtn, color: "#E8B23D", fontWeight: 700 }}>Custom</span>
            )}
          </div>
          <button
            onClick={() => setShowCustomize((s) => !s)}
            style={{ ...styles.linkBtn, marginLeft: 4 }}
          >
            ⚙️ {showCustomize ? "Hide range settings" : "Set your own ranges"}
          </button>
        </div>

        {showCustomize && (
          <div style={styles.customizePanel}>
            {active.multiplication && (
              <RangeRow
                label="Multiplication — 1st number"
                value={ranges.multiplication.a}
                onChange={(idx, v) => updateRangePair("multiplication", "a", idx, v)}
                limits={ABSOLUTE_LIMITS.multiplicationA}
              />
            )}
            {active.multiplication && (
              <RangeRow
                label="Multiplication — 2nd number"
                value={ranges.multiplication.b}
                onChange={(idx, v) => updateRangePair("multiplication", "b", idx, v)}
                limits={ABSOLUTE_LIMITS.multiplicationB}
              />
            )}
            {active.addition && (
              <RangeRow
                label="Addition — 1st number"
                value={ranges.addition.a}
                onChange={(idx, v) => updateRangePair("addition", "a", idx, v)}
                limits={ABSOLUTE_LIMITS.additionA}
              />
            )}
            {active.addition && (
              <RangeRow
                label="Addition — 2nd number"
                value={ranges.addition.b}
                onChange={(idx, v) => updateRangePair("addition", "b", idx, v)}
                limits={ABSOLUTE_LIMITS.additionB}
              />
            )}
            {active.subtraction && (
              <RangeRow
                label="Subtraction — 1st number"
                value={ranges.subtraction.a}
                onChange={(idx, v) => updateRangePair("subtraction", "a", idx, v)}
                limits={ABSOLUTE_LIMITS.subtractionA}
              />
            )}
            {active.subtraction && (
              <RangeRow
                label="Subtraction — 2nd number"
                value={ranges.subtraction.b}
                onChange={(idx, v) => updateRangePair("subtraction", "b", idx, v)}
                limits={ABSOLUTE_LIMITS.subtractionB}
              />
            )}
            {active.division && (
              <RangeRow
                label="Division — divisor"
                value={ranges.division.divisor}
                onChange={(idx, v) => updateRangePair("division", "divisor", idx, v)}
                limits={ABSOLUTE_LIMITS.divisionDivisor}
              />
            )}
            {active.division && (
              <RangeRow
                label="Division — quotient (the answer)"
                value={ranges.division.quotient}
                onChange={(idx, v) => updateRangePair("division", "quotient", idx, v)}
                limits={ABSOLUTE_LIMITS.divisionQuotient}
              />
            )}
            {active.squares && (
              <RangeRow
                label="Squares — number range"
                value={ranges.squares.n}
                onChange={(idx, v) => updateRangePair("squares", "n", idx, v)}
                limits={ABSOLUTE_LIMITS.squaresN}
              />
            )}
            {active.cubes && (
              <RangeRow
                label="Cubes — number range"
                value={ranges.cubes.n}
                onChange={(idx, v) => updateRangePair("cubes", "n", idx, v)}
                limits={ABSOLUTE_LIMITS.cubesN}
              />
            )}
            {active.fractions && (
              <div style={styles.rangeRow}>
                <span style={styles.rangeLabel}>Fraction ↔ % — max denominator</span>
                <input
                  type="number"
                  value={ranges.fractions.maxDen}
                  onChange={(e) => updateSingleValue("fractions", "maxDen", e.target.value)}
                  min={ABSOLUTE_LIMITS.fractionsMaxDen[0]}
                  max={ABSOLUTE_LIMITS.fractionsMaxDen[1]}
                  style={styles.rangeInput}
                />
              </div>
            )}
            {active.quickpct && (
              <RangeRow
                label="Quick % — base number multiplier"
                value={ranges.quickpct.mult}
                onChange={(idx, v) => updateRangePair("quickpct", "mult", idx, v)}
                limits={ABSOLUTE_LIMITS.quickpctMult}
              />
            )}
            {active.alphaValue && (
              <RangeRow
                label="Alphabet ↔ Number — letter range (A=1 … Z=26)"
                value={ranges.alphaValue.pos}
                onChange={(idx, v) => updateRangePair("alphaValue", "pos", idx, v)}
                limits={ABSOLUTE_LIMITS.alphaValuePos}
              />
            )}
            {active.alphaOpposite && (
              <RangeRow
                label="Opposite Letters — letter range"
                value={ranges.alphaOpposite.pos}
                onChange={(idx, v) => updateRangePair("alphaOpposite", "pos", idx, v)}
                limits={ABSOLUTE_LIMITS.alphaOppositePos}
              />
            )}
            <div style={styles.customizeHint}>Bigger numbers and wider ranges = harder mental math. Changing any value switches Difficulty to "Custom".</div>
          </div>
        )}

        {/* QUESTION CARD */}
        <div style={styles.paperCard} className="bd-card">
          <div style={styles.paperTopRow}>
            <span style={{ ...styles.catPill, background: question ? CATEGORY_META[question.category].ink : "#999" }}>
              {question ? CATEGORY_META[question.category].label : "—"}
            </span>
            <span style={styles.itemTag}>
              {question ? `item · ${question.keyLabel}` : ""}
            </span>
          </div>

          {!question ? (
            <div style={styles.emptyState}>Pick at least one category above to start drilling.</div>
          ) : (
            <>
              <div style={styles.promptText} className="bd-prompt">{question.prompt}</div>

              {question.type === "mcq" ? (
                <div style={styles.optionsGrid} className="bd-options-grid">
                  {question.options.map((opt, i) => {
                    const isSelected = selected !== null && String(opt) === String(selected);
                    const isCorrectOpt = feedback && String(opt) === String(question.answer);
                    let bg = "#FFFDF7";
                    let border = "#D8CFB8";
                    let color = "#1F2937";
                    if (feedback) {
                      if (isCorrectOpt) { bg = "#E4F0E9"; border = "#1F6F5C"; color = "#1F6F5C"; }
                      else if (isSelected) { bg = "#F6E4E1"; border = "#C0392B"; color = "#C0392B"; }
                    }
                    return (
                      <button
                        key={i}
                        disabled={!!feedback}
                        onClick={() => submitAnswer(opt)}
                        style={{ ...styles.optionBtn, background: bg, borderColor: border, color }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <form onSubmit={handleFillSubmit} style={styles.fillRow} className="bd-fill-row">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode={question.inputMode === "text" ? "text" : "decimal"}
                    value={fillValue}
                    disabled={!!feedback}
                    onChange={(e) => setFillValue(e.target.value)}
                    placeholder={question.placeholder || "type your answer"}
                    className="bd-fill-input"
                    style={{
                      ...styles.fillInput,
                      borderColor: feedback === "correct" ? "#1F6F5C" : feedback === "wrong" ? "#C0392B" : "#B9AE94",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!!feedback}
                    style={styles.submitBtn}
                    className="bd-submit-btn"
                  >
                    Check
                  </button>
                </form>
              )}

              {feedback && (
                <div style={{
                  ...styles.feedbackBar,
                  background: feedback === "correct" ? "#E4F0E9" : "#F6E4E1",
                  color: feedback === "correct" ? "#1F6F5C" : "#C0392B",
                }}>
                  <span>
                    {feedback === "correct"
                      ? "✓ Correct — next question coming up"
                      : `✕ Not quite — answer: ${question.answer}`}
                  </span>
                  <button onClick={handleNext} style={styles.nextBtn}>
                    {feedback === "correct" ? "Next →" : "Press Enter →"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        </>
        )}

        {appMode === "game" && (
          <GamePanel
            gameCats={gameCats}
            toggleGameCat={toggleGameCat}
            gameDuration={gameDuration}
            setGameDuration={setGameDuration}
            gameStatus={gameStatus}
            gameTimeLeft={gameTimeLeft}
            gameQuestion={gameQuestion}
            gameSelected={gameSelected}
            gameFillValue={gameFillValue}
            setGameFillValue={setGameFillValue}
            gameFeedback={gameFeedback}
            gameTally={gameTally}
            gameBest={gameBest}
            startGame={startGame}
            submitGameAnswer={submitGameAnswer}
            handleGameFillSubmit={handleGameFillSubmit}
            gameInputRef={gameInputRef}
            setGameStatus={setGameStatus}
          />
        )}

        {appMode === "battle" && (
          <BattlePanel
            battleStage={battleStage}
            setBattleStage={setBattleStage}
            playerId={playerId}
            playerName={playerName}
            setPlayerName={setPlayerName}
            joinCodeInput={joinCodeInput}
            setJoinCodeInput={setJoinCodeInput}
            battleDuration={battleDuration}
            setBattleDuration={setBattleDuration}
            battleError={battleError}
            battleBusy={battleBusy}
            battleRoom={battleRoom}
            battleCode={battleCode}
            battleQuestions={battleQuestions}
            battleIdx={battleIdx}
            battleSelected={battleSelected}
            battleFillValue={battleFillValue}
            setBattleFillValue={setBattleFillValue}
            battleFeedback={battleFeedback}
            battleScore={battleScore}
            battleTimeLeft={battleTimeLeft}
            battleCountdown={battleCountdown}
            battleInputRef={battleInputRef}
            handleCreateRoom={handleCreateRoom}
            handleJoinRoom={handleJoinRoom}
            handleSyncRoomSettings={handleSyncRoomSettings}
            handleStartBattle={handleStartBattle}
            handleRematch={handleRematch}
            handleLeaveRoom={handleLeaveRoom}
            submitBattleAnswer={submitBattleAnswer}
            handleBattleFillSubmit={handleBattleFillSubmit}
            battleActive={battleActive}
            toggleBattleCategory={toggleBattleCategory}
            battleRanges={battleRanges}
            battleAnswerMode={battleAnswerMode}
            setBattleAnswerMode={setBattleAnswerMode}
            battleDifficultyLabel={battleDifficultyLabel}
            applyBattleDifficulty={applyBattleDifficulty}
            updateBattleRangePair={updateBattleRangePair}
            updateBattleSingleValue={updateBattleSingleValue}
            battleShowCustomize={battleShowCustomize}
            setBattleShowCustomize={setBattleShowCustomize}
          />
        )}

        {/* HEATMAP */}
        <div style={styles.heatmapSection}>
          <div style={styles.heatmapHeader}>
            <h2 style={styles.heatmapTitle}>Where you stand</h2>
            <button style={styles.linkBtn} onClick={() => setShowHeatmap((s) => !s)}>
              {showHeatmap ? "Hide" : "Show"}
            </button>
          </div>

          {showHeatmap && (
            <>
              {active.multiplication && (
                <Heatmap
                  category="multiplication"
                  title={`Multiplication (${ranges.multiplication.a[0]}–${ranges.multiplication.a[1]})`}
                  items={range(ranges.multiplication.a[0], ranges.multiplication.a[1])}
                  stats={stats}
                />
              )}
              {active.addition && (
                <Heatmap
                  category="addition"
                  title={`Addition (${ranges.addition.a[0]}–${ranges.addition.a[1]})`}
                  items={bucketItemsForRange(ranges.addition.a[0], ranges.addition.a[1])}
                  stats={stats}
                />
              )}
              {active.subtraction && (
                <Heatmap
                  category="subtraction"
                  title={`Subtraction (${Math.min(ranges.subtraction.a[0], ranges.subtraction.b[0])}–${Math.max(ranges.subtraction.a[1], ranges.subtraction.b[1])})`}
                  items={bucketItemsForRange(
                    Math.min(ranges.subtraction.a[0], ranges.subtraction.b[0]),
                    Math.max(ranges.subtraction.a[1], ranges.subtraction.b[1])
                  )}
                  stats={stats}
                />
              )}
              {active.division && (
                <Heatmap
                  category="division"
                  title={`Division — divisor (${ranges.division.divisor[0]}–${ranges.division.divisor[1]})`}
                  items={range(ranges.division.divisor[0], ranges.division.divisor[1])}
                  stats={stats}
                />
              )}
              {active.squares && (
                <Heatmap
                  category="squares"
                  title={`Squares (${ranges.squares.n[0]}–${ranges.squares.n[1]})`}
                  items={range(ranges.squares.n[0], ranges.squares.n[1])}
                  stats={stats}
                />
              )}
              {active.cubes && (
                <Heatmap
                  category="cubes"
                  title={`Cubes (${ranges.cubes.n[0]}–${ranges.cubes.n[1]})`}
                  items={range(ranges.cubes.n[0], ranges.cubes.n[1])}
                  stats={stats}
                />
              )}
              {active.fractions && (
                <Heatmap
                  category="fractions"
                  title="Fraction ↔ %"
                  items={FRACTIONS.filter(([, d]) => d <= ranges.fractions.maxDen).map(([n, d]) => `${n}/${d}`)}
                  stats={stats}
                />
              )}
              {active.quickpct && (
                <Heatmap
                  category="quickpct"
                  title="Quick % of a number"
                  items={QUICK_PCT.map(([n, d]) => pctLabel(n, d))}
                  stats={stats}
                />
              )}
              {active.alphaValue && (
                <Heatmap
                  category="alphaValue"
                  title={`Alphabet ↔ Number (${letterAt(ranges.alphaValue.pos[0])}–${letterAt(ranges.alphaValue.pos[1])})`}
                  items={range(ranges.alphaValue.pos[0], ranges.alphaValue.pos[1]).map(letterAt)}
                  stats={stats}
                />
              )}
              {active.alphaOpposite && (
                <Heatmap
                  category="alphaOpposite"
                  title={`Opposite Letters (${letterAt(ranges.alphaOpposite.pos[0])}–${letterAt(ranges.alphaOpposite.pos[1])})`}
                  items={range(ranges.alphaOpposite.pos[0], ranges.alphaOpposite.pos[1]).map(letterAt)}
                  stats={stats}
                />
              )}

              <div style={styles.legendRow}>
                <span style={styles.legendLabel}>Legend:</span>
                {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                  <span key={i} style={{ ...styles.legendDot, background: colorForAcc(v) }} />
                ))}
                <span style={styles.legendLabel}>weak → strong</span>
                <span style={{ ...styles.legendDot, background: "#33465B", marginLeft: 12 }} />
                <span style={styles.legendLabel}>not attempted</span>
              </div>

              <button style={styles.resetBtn} onClick={handleReset}>Reset all progress</button>
            </>
          )}
        </div>

        {/* COMING SOON TEASER */}
        <div style={styles.comingSoonBox}>
          <div style={styles.comingSoonTitle}>🚧 More drills coming to BuddhiDrill</div>
          <div style={styles.comingSoonChips}>
            {["Number Series", "Blood Relations", "Direction Sense", "Coding-Decoding"].map((t) => (
              <span key={t} style={styles.comingSoonChip}>{t}</span>
            ))}
          </div>
        </div>

        <footer style={styles.footer}>BuddhiDrill — a playful daily workout for your math &amp; memory. Accuracy is tracked per number and saved on this device.</footer>
      </div>
    </div>
  );
}

/* ============================================================
   HEATMAP SUB-COMPONENT
   ============================================================ */

function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

function colorForAcc(acc) {
  // acc in [0,1] -> from rose (weak) to gold (mid) to green (strong)
  if (acc === null || acc === undefined) return "#33465B";
  if (acc < 0.5) {
    // rose to amber
    const t = acc / 0.5;
    return lerpColor("#C0392B", "#E8B23D", t);
  }
  const t = (acc - 0.5) / 0.5;
  return lerpColor("#E8B23D", "#1F6F5C", t);
}

function lerpColor(c1, c2, t) {
  const p1 = hexToRgb(c1), p2 = hexToRgb(c2);
  const r = Math.round(p1.r + (p2.r - p1.r) * t);
  const g = Math.round(p1.g + (p2.g - p1.g) * t);
  const b = Math.round(p1.b + (p2.b - p1.b) * t);
  return `rgb(${r},${g},${b})`;
}
function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.substring(0, 2), 16),
    g: parseInt(v.substring(2, 4), 16),
    b: parseInt(v.substring(4, 6), 16),
  };
}

function GamePanel({
  gameCats, toggleGameCat, gameDuration, setGameDuration, gameStatus, gameTimeLeft,
  gameQuestion, gameSelected, gameFillValue, setGameFillValue, gameFeedback, gameTally,
  gameBest, startGame, submitGameAnswer, handleGameFillSubmit, gameInputRef, setGameStatus,
}) {
  const GAME_CATS = ["multiplication", "addition", "subtraction", "division", "squares", "cubes", "alphaValue", "alphaOpposite"];
  const accuracy = gameTally.correct + gameTally.wrong > 0
    ? Math.round((gameTally.correct / (gameTally.correct + gameTally.wrong)) * 100)
    : 0;

  return (
    <div style={styles.gamePanel} className="bd-card">
      {gameStatus === "setup" && (
        <>
          <div style={styles.gameSetupTitle}>🎮 Pick your challenge</div>
          <div style={styles.gameCatRow}>
            {GAME_CATS.map((cat) => {
              const meta = CATEGORY_META[cat];
              const on = gameCats[cat];
              return (
                <button
                  key={cat}
                  onClick={() => toggleGameCat(cat)}
                  style={{
                    ...styles.gameCatChip,
                    borderColor: on ? meta.ink : "#3E566B",
                    background: on ? meta.ink : "transparent",
                    color: on ? "#F4EFE3" : "#7C93A8",
                  }}
                >
                  <span style={styles.chipTag}>{meta.short}</span> {meta.label}
                </button>
              );
            })}
          </div>
          <div style={styles.gameHint}>Pick one for a focused drill, or select two or three to mix it up.</div>

          <div style={styles.gameDurationRow}>
            <span style={styles.modeLabel}>Duration:</span>
            <div style={styles.segmentGroup}>
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setGameDuration(d)}
                  style={{
                    ...styles.segmentBtn,
                    background: gameDuration === d ? "#E8B23D" : "transparent",
                    color: gameDuration === d ? "#0B1929" : "#93A6B8",
                    fontWeight: gameDuration === d ? 700 : 500,
                  }}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {gameBest > 0 && (
            <div style={styles.gameBestLine}>🏆 Best at {gameDuration}s: <b>{gameBest}</b> correct</div>
          )}

          <button style={styles.gameStartBtn} onClick={startGame}>Start Game →</button>
        </>
      )}

      {gameStatus === "playing" && gameQuestion && (
        <>
          <div style={styles.gameTopBar}>
            <span style={{ ...styles.catPill, background: CATEGORY_META[gameQuestion.category].ink }}>
              {CATEGORY_META[gameQuestion.category].label}
            </span>
            <span style={styles.gameTimer}>⏱ {gameTimeLeft}s</span>
            <span style={styles.gameScoreLive}>✓ {gameTally.correct} &nbsp; ✕ {gameTally.wrong}</span>
          </div>

          <div style={styles.gamePromptText} className="bd-prompt">{gameQuestion.prompt}</div>

          {gameQuestion.type === "mcq" ? (
            <div style={styles.optionsGrid} className="bd-options-grid">
              {gameQuestion.options.map((opt, i) => {
                const isSelected = gameSelected !== null && String(opt) === String(gameSelected);
                const isCorrectOpt = gameFeedback && String(opt) === String(gameQuestion.answer);
                let bg = "#FFFDF7", border = "#D8CFB8", color = "#1F2937";
                if (gameFeedback) {
                  if (isCorrectOpt) { bg = "#E4F0E9"; border = "#1F6F5C"; color = "#1F6F5C"; }
                  else if (isSelected) { bg = "#F6E4E1"; border = "#C0392B"; color = "#C0392B"; }
                }
                return (
                  <button
                    key={i}
                    disabled={!!gameFeedback}
                    onClick={() => submitGameAnswer(opt)}
                    style={{ ...styles.optionBtn, background: bg, borderColor: border, color }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleGameFillSubmit} style={styles.fillRow} className="bd-fill-row">
              <input
                ref={gameInputRef}
                type="text"
                inputMode={gameQuestion.inputMode === "text" ? "text" : "decimal"}
                value={gameFillValue}
                disabled={!!gameFeedback}
                onChange={(e) => setGameFillValue(e.target.value)}
                placeholder={gameQuestion.placeholder || "type your answer"}
                className="bd-fill-input"
                style={{
                  ...styles.fillInput,
                  borderColor: gameFeedback === "correct" ? "#1F6F5C" : gameFeedback === "wrong" ? "#C0392B" : "#B9AE94",
                }}
              />
              <button type="submit" disabled={!!gameFeedback} style={styles.submitBtn} className="bd-submit-btn">Check</button>
            </form>
          )}

          {gameFeedback && (
            <div style={{
              ...styles.feedbackBar,
              background: gameFeedback === "correct" ? "#E4F0E9" : "#F6E4E1",
              color: gameFeedback === "correct" ? "#1F6F5C" : "#C0392B",
            }}>
              {gameFeedback === "correct" ? "✓ Correct" : `✕ answer: ${gameQuestion.answer}`}
            </div>
          )}
        </>
      )}

      {gameStatus === "finished" && (
        <div style={styles.gameResults}>
          <div style={styles.gameResultsTitle}>⏹ Time's up!</div>
          <div style={styles.gameResultsScore}>{gameTally.correct} correct</div>
          <div style={styles.gameResultsSub}>{accuracy}% accuracy · {gameTally.wrong} missed</div>
          {gameTally.correct >= gameBest && gameTally.correct > 0 && (
            <div style={styles.gameNewBest}>🏆 New best!</div>
          )}
          <div style={styles.gameResultsBreakdown}>
            {Object.entries(gameTally.byCat).map(([cat, v]) => (
              <div key={cat} style={styles.gameResultsRow}>
                <span>{CATEGORY_META[cat].label}</span>
                <span>{v.correct}/{v.total}</span>
              </div>
            ))}
          </div>
          <div style={styles.gameResultsBtns}>
            <button style={styles.gameStartBtn} onClick={startGame}>Play Again</button>
            <button style={styles.linkBtn} onClick={() => setGameStatus("setup")}>Change Settings</button>
          </div>
        </div>
      )}
    </div>
  );
}

function BattlePanel({
  battleStage, setBattleStage, playerId, playerName, setPlayerName,
  joinCodeInput, setJoinCodeInput, battleDuration, setBattleDuration,
  battleError, battleBusy, battleRoom, battleCode, battleQuestions, battleIdx,
  battleSelected, battleFillValue, setBattleFillValue, battleFeedback,
  battleScore, battleTimeLeft, battleCountdown, battleInputRef,
  handleCreateRoom, handleJoinRoom, handleSyncRoomSettings, handleStartBattle,
  handleRematch, handleLeaveRoom, submitBattleAnswer, handleBattleFillSubmit,
  battleActive, toggleBattleCategory, battleRanges, battleAnswerMode, setBattleAnswerMode,
  battleDifficultyLabel, applyBattleDifficulty, updateBattleRangePair, updateBattleSingleValue,
  battleShowCustomize, setBattleShowCustomize,
}) {
  const players = (battleRoom && battleRoom.players) || {};
  const playerIds = Object.keys(players);
  const me = players[playerId];
  const opponentId = playerIds.find((id) => id !== playerId);
  const opponent = opponentId ? players[opponentId] : null;
  const isHost = !!(me && me.isHost) || (battleRoom && battleRoom.hostId === playerId);
  const roomCatLabels = battleRoom && battleRoom.settings
    ? battleRoom.settings.categories.map((c) => CATEGORY_META[c].label)
    : [];

  return (
    <div style={styles.gamePanel} className="bd-card">

      {battleStage === "menu" && (
        <>
          <div style={styles.gameSetupTitle}>⚔️ Battle a friend</div>
          <div style={styles.battleNameRow}>
            <span style={styles.rangeLabel}>Your name</span>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Khushal"
              maxLength={16}
              style={styles.rangeInput}
              className="bd-fill-input"
            />
          </div>
          {battleError && <div style={styles.battleError}>{battleError}</div>}
          <div style={styles.battleMenuBtns}>
            <button style={styles.gameStartBtn} onClick={() => setBattleStage("create")}>Create Room</button>
            <button style={styles.battleSecondaryBtn} onClick={() => setBattleStage("join")}>Join Room</button>
          </div>
          <div style={styles.gameHint}>Same questions, same order, same timer — whoever gets more right wins.</div>
        </>
      )}

      {battleStage === "create" && (
        <>
          <div style={styles.gameSetupTitle}>Create a room</div>
          <div style={styles.battleNameRow}>
            <span style={styles.rangeLabel}>Your name</span>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Khushal"
              maxLength={16}
              style={styles.rangeInput}
              className="bd-fill-input"
            />
          </div>

          <div style={styles.battleSettingsSummary}>
            <div style={styles.rangeLabel}>Battle settings</div>
            <SettingsPanel
              active={battleActive}
              onToggle={toggleBattleCategory}
              answerMode={battleAnswerMode}
              onSetAnswerMode={setBattleAnswerMode}
              difficultyLabel={battleDifficultyLabel}
              onApplyDifficulty={applyBattleDifficulty}
              ranges={battleRanges}
              onUpdateRangePair={updateBattleRangePair}
              onUpdateSingleValue={updateBattleSingleValue}
              showCustomize={battleShowCustomize}
              onToggleCustomize={() => setBattleShowCustomize((s) => !s)}
            />
          </div>

          <div style={styles.gameDurationRow}>
            <span style={styles.modeLabel}>Battle length:</span>
            <div style={styles.segmentGroup}>
              {[30, 60, 90, 120, 180].map((d) => (
                <button
                  key={d}
                  onClick={() => setBattleDuration(d)}
                  style={{
                    ...styles.segmentBtn,
                    background: battleDuration === d ? "#E8B23D" : "transparent",
                    color: battleDuration === d ? "#0B1929" : "#93A6B8",
                    fontWeight: battleDuration === d ? 700 : 500,
                  }}
                >
                  {d < 60 ? `${d}s` : `${d / 60}m`}
                </button>
              ))}
            </div>
          </div>

          {battleError && <div style={styles.battleError}>{battleError}</div>}
          <div style={styles.battleMenuBtns}>
            <button style={styles.gameStartBtn} disabled={battleBusy} onClick={handleCreateRoom}>
              {battleBusy ? "Creating…" : "Create Room →"}
            </button>
            <button style={styles.linkBtn} onClick={() => setBattleStage("menu")}>← Back</button>
          </div>
        </>
      )}

      {battleStage === "join" && (
        <>
          <div style={styles.gameSetupTitle}>Join a room</div>
          <div style={styles.battleNameRow}>
            <span style={styles.rangeLabel}>Your name</span>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Khushal"
              maxLength={16}
              style={styles.rangeInput}
              className="bd-fill-input"
            />
          </div>
          <div style={styles.battleNameRow}>
            <span style={styles.rangeLabel}>Room code</span>
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. K7QXM"
              maxLength={6}
              style={{ ...styles.rangeInput, letterSpacing: "0.15em", fontWeight: 700 }}
              className="bd-fill-input"
            />
          </div>
          {battleError && <div style={styles.battleError}>{battleError}</div>}
          <div style={styles.battleMenuBtns}>
            <button style={styles.gameStartBtn} disabled={battleBusy} onClick={handleJoinRoom}>
              {battleBusy ? "Joining…" : "Join Room →"}
            </button>
            <button style={styles.linkBtn} onClick={() => setBattleStage("menu")}>← Back</button>
          </div>
        </>
      )}

      {battleStage === "lobby" && battleRoom && (
        <>
          <div style={styles.gameSetupTitle}>Room code</div>
          <div style={styles.battleCodeDisplay}>{battleCode}</div>
          <div style={styles.gameHint}>Share this code with your friend — they tap "Join Room" and type it in.</div>

          <div style={styles.battlePlayersRow}>
            <div style={styles.battlePlayerCard}>
              <div style={styles.battlePlayerName}>{me ? me.name : playerName || "You"} {isHost && "👑"}</div>
              <div style={styles.gameHint}>You</div>
            </div>
            <div style={styles.battleVs}>VS</div>
            <div style={styles.battlePlayerCard}>
              {opponent ? (
                <>
                  <div style={styles.battlePlayerName}>{opponent.name} {opponent.isHost && "👑"}</div>
                  <div style={styles.gameHint}>Ready</div>
                </>
              ) : (
                <div style={styles.gameHint}>Waiting for a friend…</div>
              )}
            </div>
          </div>

          <div style={styles.battleSettingsSummary}>
            <div style={styles.rangeLabel}>Current room settings</div>
            <div style={styles.battleTagRow}>
              {roomCatLabels.map((l) => <span key={l} style={styles.battleTag}>{l}</span>)}
            </div>
            <div style={styles.gameHint}>
              Difficulty: {battleRoom.settings.difficultyLabel} · Mode: {battleRoom.settings.answerMode} · Length: {battleRoom.duration}s
            </div>
          </div>

          {isHost ? (
            <>
              <div style={styles.battleSettingsSummary}>
                <div style={styles.rangeLabel}>Edit settings (only you can see this until you update or start)</div>
                <SettingsPanel
                  active={battleActive}
                  onToggle={toggleBattleCategory}
                  answerMode={battleAnswerMode}
                  onSetAnswerMode={setBattleAnswerMode}
                  difficultyLabel={battleDifficultyLabel}
                  onApplyDifficulty={applyBattleDifficulty}
                  ranges={battleRanges}
                  onUpdateRangePair={updateBattleRangePair}
                  onUpdateSingleValue={updateBattleSingleValue}
                  showCustomize={battleShowCustomize}
                  onToggleCustomize={() => setBattleShowCustomize((s) => !s)}
                />
              </div>
              <div style={styles.gameDurationRow}>
                <span style={styles.modeLabel}>Battle length:</span>
                <div style={styles.segmentGroup}>
                  {[30, 60, 90, 120, 180].map((d) => (
                    <button
                      key={d}
                      onClick={() => setBattleDuration(d)}
                      style={{
                        ...styles.segmentBtn,
                        background: battleDuration === d ? "#E8B23D" : "transparent",
                        color: battleDuration === d ? "#0B1929" : "#93A6B8",
                        fontWeight: battleDuration === d ? 700 : 500,
                      }}
                    >
                      {d < 60 ? `${d}s` : `${d / 60}m`}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.battleMenuBtns}>
                <button style={styles.battleSecondaryBtn} onClick={handleSyncRoomSettings}>
                  Update Room (let your friend see these settings now)
                </button>
              </div>
              <button
                style={{ ...styles.gameStartBtn, opacity: opponent ? 1 : 0.5 }}
                disabled={!opponent}
                onClick={handleStartBattle}
              >
                {opponent ? "Start Battle →" : "Waiting for a player…"}
              </button>
            </>
          ) : (
            <div style={{ ...styles.gameHint, textAlign: "center", marginTop: 16 }}>
              Waiting for the host to start the battle…
            </div>
          )}

          <button style={styles.linkBtn} onClick={handleLeaveRoom}>Leave Room</button>
        </>
      )}

      {battleStage === "countdown" && (
        <div style={styles.gameResults}>
          <div style={styles.gameResultsTitle}>Get ready!</div>
          <div style={styles.battleCountdownNum}>{battleCountdown || "GO"}</div>
          <div style={styles.gameHint}>Same questions, same order — go!</div>
        </div>
      )}

      {battleStage === "playing" && battleQuestions && (() => {
        const q = battleQuestions[battleIdx % battleQuestions.length];
        return (
          <>
            <div style={styles.gameTopBar}>
              <span style={{ ...styles.catPill, background: CATEGORY_META[q.category].ink }}>
                {CATEGORY_META[q.category].label}
              </span>
              <span style={styles.gameTimer}>⏱ {battleTimeLeft}s</span>
            </div>

            <div style={styles.battleScoreRow}>
              <div style={styles.battleScoreBox}>
                <div style={styles.gameHint}>You</div>
                <div style={styles.battleScoreNum}>{battleScore.correct}</div>
              </div>
              <div style={styles.battleScoreBox}>
                <div style={styles.gameHint}>{opponent ? opponent.name : "Opponent"}</div>
                <div style={styles.battleScoreNum}>{opponent && opponent.score ? opponent.score.correct : 0}</div>
              </div>
            </div>

            <div style={styles.gamePromptText} className="bd-prompt">{q.prompt}</div>

            {q.type === "mcq" ? (
              <div style={styles.optionsGrid} className="bd-options-grid">
                {q.options.map((opt, i) => {
                  const isSelected = battleSelected !== null && String(opt) === String(battleSelected);
                  const isCorrectOpt = battleFeedback && String(opt) === String(q.answer);
                  let bg = "#FFFDF7", border = "#D8CFB8", color = "#1F2937";
                  if (battleFeedback) {
                    if (isCorrectOpt) { bg = "#E4F0E9"; border = "#1F6F5C"; color = "#1F6F5C"; }
                    else if (isSelected) { bg = "#F6E4E1"; border = "#C0392B"; color = "#C0392B"; }
                  }
                  return (
                    <button
                      key={i}
                      disabled={!!battleFeedback}
                      onClick={() => submitBattleAnswer(opt)}
                      style={{ ...styles.optionBtn, background: bg, borderColor: border, color }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={handleBattleFillSubmit} style={styles.fillRow} className="bd-fill-row">
                <input
                  ref={battleInputRef}
                  type="text"
                  inputMode={q.inputMode === "text" ? "text" : "decimal"}
                  value={battleFillValue}
                  disabled={!!battleFeedback}
                  onChange={(e) => setBattleFillValue(e.target.value)}
                  placeholder={q.placeholder || "type your answer"}
                  className="bd-fill-input"
                  style={{
                    ...styles.fillInput,
                    borderColor: battleFeedback === "correct" ? "#1F6F5C" : battleFeedback === "wrong" ? "#C0392B" : "#B9AE94",
                  }}
                />
                <button type="submit" disabled={!!battleFeedback} style={styles.submitBtn} className="bd-submit-btn">Check</button>
              </form>
            )}

            {battleFeedback && (
              <div style={{
                ...styles.feedbackBar,
                background: battleFeedback === "correct" ? "#E4F0E9" : "#F6E4E1",
                color: battleFeedback === "correct" ? "#1F6F5C" : "#C0392B",
              }}>
                {battleFeedback === "correct" ? "✓ Correct" : `✕ answer: ${q.answer}`}
              </div>
            )}
          </>
        );
      })()}

      {battleStage === "results" && (
        <div style={styles.gameResults}>
          <div style={styles.gameResultsTitle}>⏹ Battle over!</div>
          <div style={styles.battleResultsRow}>
            <div style={styles.battleResultBox}>
              <div style={styles.gameHint}>You</div>
              <div style={styles.gameResultsScore}>{battleScore.correct}</div>
            </div>
            <div style={styles.battleVs}>VS</div>
            <div style={styles.battleResultBox}>
              <div style={styles.gameHint}>{opponent ? opponent.name : "Opponent"}</div>
              <div style={styles.gameResultsScore}>{opponent && opponent.score ? opponent.score.correct : 0}</div>
            </div>
          </div>

          {(() => {
            const oppCorrect = opponent && opponent.score ? opponent.score.correct : 0;
            if (!opponent) return <div style={styles.gameHint}>Waiting for opponent's final score…</div>;
            if (battleScore.correct > oppCorrect) return <div style={styles.gameNewBest}>🏆 You win!</div>;
            if (battleScore.correct < oppCorrect) return <div style={styles.battleLoseText}>{opponent.name} wins this one</div>;
            return <div style={styles.gameNewBest}>🤝 It's a tie!</div>;
          })()}

          {opponent && !opponent.finishedAt && (
            <div style={{ ...styles.gameHint, marginTop: 8 }}>{opponent.name} is still finishing up — score above updates live.</div>
          )}

          <div style={styles.gameResultsBtns}>
            {isHost && <button style={styles.gameStartBtn} onClick={handleRematch}>Rematch</button>}
            <button style={styles.linkBtn} onClick={handleLeaveRoom}>Leave Room</button>
          </div>
        </div>
      )}
    </div>
  );
}

const RANGE_FIELDS = [
  { cat: "multiplication", field: "a", label: "Multiplication — 1st number", limitsKey: "multiplicationA" },
  { cat: "multiplication", field: "b", label: "Multiplication — 2nd number", limitsKey: "multiplicationB" },
  { cat: "addition", field: "a", label: "Addition — 1st number", limitsKey: "additionA" },
  { cat: "addition", field: "b", label: "Addition — 2nd number", limitsKey: "additionB" },
  { cat: "subtraction", field: "a", label: "Subtraction — 1st number", limitsKey: "subtractionA" },
  { cat: "subtraction", field: "b", label: "Subtraction — 2nd number", limitsKey: "subtractionB" },
  { cat: "division", field: "divisor", label: "Division — divisor", limitsKey: "divisionDivisor" },
  { cat: "division", field: "quotient", label: "Division — quotient (the answer)", limitsKey: "divisionQuotient" },
  { cat: "squares", field: "n", label: "Squares — number range", limitsKey: "squaresN" },
  { cat: "cubes", field: "n", label: "Cubes — number range", limitsKey: "cubesN" },
  { cat: "quickpct", field: "mult", label: "Quick % — base number multiplier", limitsKey: "quickpctMult" },
  { cat: "alphaValue", field: "pos", label: "Alphabet ↔ Number — letter range (A=1 … Z=26)", limitsKey: "alphaValuePos" },
  { cat: "alphaOpposite", field: "pos", label: "Opposite Letters — letter range", limitsKey: "alphaOppositePos" },
];

// Shared settings UI — Practice and Battle each pass in their own
// active/ranges/difficulty/answerMode state + setters, identical controls either way
function SettingsPanel({
  active, onToggle, answerMode, onSetAnswerMode,
  difficultyLabel, onApplyDifficulty, ranges, onUpdateRangePair, onUpdateSingleValue,
  showCustomize, onToggleCustomize,
}) {
  return (
    <div>
      <div style={styles.chipsRow}>
        {CATEGORY_ORDER.map((cat) => {
          const meta = CATEGORY_META[cat];
          const on = active[cat];
          return (
            <button
              key={cat}
              onClick={() => onToggle(cat)}
              style={{
                ...styles.chip,
                borderColor: on ? meta.ink : "#3E566B",
                background: on ? meta.ink : "transparent",
                color: on ? "#F4EFE3" : "#7C93A8",
              }}
            >
              <span style={styles.chipTag}>{meta.short}</span> {meta.label}
            </button>
          );
        })}
      </div>

      <div style={styles.modeRow}>
        <span style={styles.modeLabel}>Question type:</span>
        <div style={styles.segmentGroup}>
          {[{ id: "mixed", label: "Mixed" }, { id: "mcq", label: "MCQ only" }, { id: "fill", label: "Fill in the blank" }].map((opt) => {
            const on = answerMode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onSetAnswerMode(opt.id)}
                style={{ ...styles.segmentBtn, background: on ? "#E8B23D" : "transparent", color: on ? "#0B1929" : "#93A6B8", fontWeight: on ? 700 : 500 }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.modeRow}>
        <span style={styles.modeLabel}>Difficulty:</span>
        <div style={styles.segmentGroup}>
          {["easy", "medium", "hard"].map((id) => {
            const on = difficultyLabel === id;
            return (
              <button
                key={id}
                onClick={() => onApplyDifficulty(id)}
                style={{ ...styles.segmentBtn, background: on ? "#E8B23D" : "transparent", color: on ? "#0B1929" : "#93A6B8", fontWeight: on ? 700 : 500 }}
              >
                {id[0].toUpperCase() + id.slice(1)}
              </button>
            );
          })}
          {difficultyLabel === "custom" && (
            <span style={{ ...styles.segmentBtn, color: "#E8B23D", fontWeight: 700 }}>Custom</span>
          )}
        </div>
        <button onClick={onToggleCustomize} style={{ ...styles.linkBtn, marginLeft: 4 }}>
          ⚙️ {showCustomize ? "Hide range settings" : "Set your own ranges"}
        </button>
      </div>

      {showCustomize && (
        <div style={styles.customizePanel}>
          {RANGE_FIELDS.filter((f) => active[f.cat]).map((f) => (
            <RangeRow
              key={`${f.cat}-${f.field}`}
              label={f.label}
              value={ranges[f.cat][f.field]}
              onChange={(idx, v) => onUpdateRangePair(f.cat, f.field, idx, v)}
              limits={ABSOLUTE_LIMITS[f.limitsKey]}
            />
          ))}
          {active.fractions && (
            <div style={styles.rangeRow}>
              <span style={styles.rangeLabel}>Fraction ↔ % — max denominator</span>
              <input
                type="number"
                value={ranges.fractions.maxDen}
                onChange={(e) => onUpdateSingleValue("fractions", "maxDen", e.target.value)}
                min={ABSOLUTE_LIMITS.fractionsMaxDen[0]}
                max={ABSOLUTE_LIMITS.fractionsMaxDen[1]}
                style={styles.rangeInput}
              />
            </div>
          )}
          <div style={styles.customizeHint}>Bigger numbers and wider ranges = harder mental math. Changing any value switches Difficulty to "Custom".</div>
        </div>
      )}
    </div>
  );
}

function RangeRow({ label, value, onChange, limits }) {
  return (
    <div style={styles.rangeRow}>
      <span style={styles.rangeLabel}>{label}</span>
      <div style={styles.rangeInputs}>
        <input
          type="number"
          value={value[0]}
          min={limits[0]}
          max={limits[1]}
          onChange={(e) => onChange(0, e.target.value)}
          style={styles.rangeInput}
        />
        <span style={styles.rangeDash}>–</span>
        <input
          type="number"
          value={value[1]}
          min={limits[0]}
          max={limits[1]}
          onChange={(e) => onChange(1, e.target.value)}
          style={styles.rangeInput}
        />
      </div>
    </div>
  );
}

function Heatmap({ category, title, items, stats }) {
  return (
    <div style={styles.heatBlock}>
      <div style={styles.heatBlockTitle}>{title}</div>
      <div style={styles.heatGrid}>
        {items.map((key) => {
          const entry = stats[category] ? stats[category][key] : null;
          const acc = accuracyOf(entry);
          const fill = colorForAcc(acc);
          const label = String(key);
          return (
            <div key={key} style={styles.bubbleWrap} title={
              entry ? `${label}: ${entry.correct}/${entry.total} correct` : `${label}: not attempted`
            }>
              <div style={{ ...styles.bubble, background: fill }} />
              <div style={styles.bubbleLabel}>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   STYLE TOKENS
   ============================================================ */

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');`;

const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  input::placeholder { color: #A79A7C; }
  button { cursor: pointer; font-family: inherit; }
  button:disabled { cursor: default; }

  /* ---- Mobile responsiveness ---- */
  @media (max-width: 640px) {
    .bd-page { padding: 18px 10px 44px !important; }
    .bd-wrap { padding-left: 2px; padding-right: 2px; }

    .bd-header {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 14px !important;
    }
    .bd-header-left {
      flex: none !important;
    }
    .bd-stamp {
      min-width: 0 !important;
      width: 100% !important;
    }

    .bd-card {
      padding: 16px 14px 16px !important;
    }

    .bd-prompt {
      padding: 14px 4px 18px !important;
    }

    .bd-options-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
    }

    .bd-fill-row {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    .bd-fill-input {
      width: 100% !important;
      font-size: 16px !important;
    }
    .bd-submit-btn {
      width: 100% !important;
    }
  }

  @media (max-width: 400px) {
    .bd-options-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(1200px 600px at 10% -10%, #16273D 0%, #0B1929 55%, #081422 100%)",
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: "28px 16px 60px",
    color: "#E7E1D3",
  },
  wrap: { maxWidth: 880, margin: "0 auto" },

  header: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: "2px dashed #33465B",
    paddingBottom: 18,
    marginBottom: 20,
  },
  headerLeft: { flex: "1 1 260px" },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.18em",
    color: "#E8B23D",
    marginBottom: 6,
    fontWeight: 600,
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "clamp(28px, 5vw, 40px)",
    fontWeight: 700,
    margin: 0,
    color: "#F4EFE3",
    letterSpacing: "-0.01em",
  },
  subtitle: { fontSize: 13, color: "#93A6B8", marginTop: 6 },

  stampBox: {
    border: "2px solid #E8B23D",
    borderRadius: 10,
    padding: "10px 16px",
    background: "rgba(232,178,61,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 190,
  },
  stampRow: { display: "flex", justifyContent: "space-between", gap: 14, fontFamily: "'JetBrains Mono', monospace" },
  stampLabel: { fontSize: 10, letterSpacing: "0.1em", color: "#93A6B8" },
  stampVal: { fontSize: 14, fontWeight: 700, color: "#F4EFE3" },
  stampSub: { fontSize: 10, color: "#93A6B8", fontWeight: 500 },

  chipsRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20, alignItems: "center" },
  chip: {
    border: "1.5px solid",
    borderRadius: 999,
    padding: "7px 14px",
    fontSize: 12.5,
    fontWeight: 600,
    background: "transparent",
    transition: "all 0.15s ease",
  },
  chipTag: { fontFamily: "'JetBrains Mono', monospace", marginRight: 4, opacity: 0.85 },

  modeRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  modeLabel: { fontSize: 12.5, color: "#93A6B8", fontWeight: 600 },
  segmentGroup: {
    display: "flex",
    border: "1.5px solid #3E566B",
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  segmentBtn: {
    border: "none",
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 12.5,
    background: "transparent",
  },

  customizePanel: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #233448",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  rangeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  rangeLabel: { fontSize: 13, color: "#C6D4E0" },
  rangeInputs: { display: "flex", alignItems: "center", gap: 6 },
  rangeInput: {
    width: 60,
    padding: "6px 8px",
    borderRadius: 8,
    border: "1.5px solid #3E566B",
    background: "#0F2033",
    color: "#F4EFE3",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    textAlign: "center",
  },
  rangeDash: { color: "#5E7590" },
  customizeHint: { fontSize: 11.5, color: "#5E7590", marginTop: 4 },

  gamePanel: {
    background: "#F4EFE3",
    borderRadius: 16,
    padding: "22px 24px 24px",
    boxShadow: "0 20px 40px -18px rgba(0,0,0,0.55)",
    marginBottom: 26,
  },
  gameSetupTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#1F2937",
    marginBottom: 14,
    textAlign: "center",
  },
  gameCatRow: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  gameCatChip: {
    border: "1.5px solid",
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
  },
  gameHint: { textAlign: "center", fontSize: 12, color: "#8A7F63", marginTop: 10 },
  gameDurationRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
    flexWrap: "wrap",
  },
  gameBestLine: { textAlign: "center", fontSize: 12.5, color: "#8A7F63", marginTop: 14 },
  gameStartBtn: {
    display: "block",
    margin: "20px auto 0",
    border: "none",
    borderRadius: 999,
    padding: "13px 30px",
    background: "#1F2937",
    color: "#F4EFE3",
    fontWeight: 700,
    fontSize: 15,
  },
  gameTopBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  gameTimer: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#8A4B2B", fontSize: 15 },
  gameScoreLive: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#1F2937", fontSize: 13 },
  gamePromptText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "clamp(24px, 5.5vw, 32px)",
    fontWeight: 700,
    color: "#1F2937",
    textAlign: "center",
    padding: "16px 8px 22px",
  },
  gameResults: { textAlign: "center", padding: "10px 0" },
  gameResultsTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#1F2937" },
  gameResultsScore: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 44,
    fontWeight: 700,
    color: "#1F6F5C",
    margin: "6px 0 2px",
  },
  gameResultsSub: { fontSize: 13, color: "#8A7F63" },
  gameNewBest: { fontSize: 13, fontWeight: 700, color: "#E8A23D", marginTop: 8 },
  gameResultsBreakdown: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    maxWidth: 260,
    margin: "18px auto 0",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: "#1F2937",
  },
  gameResultsRow: { display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #D8CFB8", paddingBottom: 4 },
  gameResultsBtns: { display: "flex", gap: 12, justifyContent: "center", marginTop: 20, flexWrap: "wrap" },

  battleNameRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 12, marginBottom: 12, flexWrap: "wrap",
  },
  battleError: {
    background: "#F6E4E1", color: "#C0392B", borderRadius: 8, padding: "8px 12px",
    fontSize: 12.5, marginBottom: 12, textAlign: "center",
  },
  battleMenuBtns: { display: "flex", flexDirection: "column", gap: 10, marginTop: 14, alignItems: "center" },
  battleSecondaryBtn: {
    border: "1.5px solid #1F2937", borderRadius: 999, padding: "11px 26px",
    background: "transparent", color: "#1F2937", fontWeight: 700, fontSize: 14,
  },
  battleSettingsSummary: {
    background: "rgba(31,41,55,0.04)", borderRadius: 10, padding: "12px 14px", margin: "14px 0",
  },
  battleTagRow: { display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0" },
  battleTag: {
    fontSize: 11.5, fontWeight: 600, color: "#1F2937", background: "#E8DFC8",
    borderRadius: 999, padding: "3px 10px",
  },
  battleCodeDisplay: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 40, fontWeight: 700,
    letterSpacing: "0.15em", textAlign: "center", color: "#1F2937", margin: "8px 0 4px",
  },
  battlePlayersRow: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "18px 0", flexWrap: "wrap",
  },
  battlePlayerCard: {
    flex: "1 1 140px", textAlign: "center", background: "rgba(31,41,55,0.04)",
    borderRadius: 10, padding: "12px 10px",
  },
  battlePlayerName: { fontWeight: 700, color: "#1F2937", fontSize: 14 },
  battleVs: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#8A7F63", fontSize: 13 },
  battleCountdownNum: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 64, fontWeight: 700,
    color: "#E8B23D", margin: "14px 0",
  },
  battleScoreRow: { display: "flex", justifyContent: "center", gap: 24, margin: "0 0 8px", flexWrap: "wrap" },
  battleScoreBox: { textAlign: "center" },
  battleScoreNum: { fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 700, color: "#1F2937" },
  battleResultsRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 20, margin: "10px 0", flexWrap: "wrap" },
  battleResultBox: { textAlign: "center" },
  battleLoseText: { fontSize: 13, fontWeight: 700, color: "#8A7F63", marginTop: 8 },

  paperCard: {
    background: "#F4EFE3",
    borderRadius: 16,
    padding: "22px 24px 20px",
    boxShadow: "0 20px 40px -18px rgba(0,0,0,0.55)",
    marginBottom: 26,
  },
  paperTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  catPill: {
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    padding: "4px 10px",
    borderRadius: 999,
    textTransform: "uppercase",
  },
  itemTag: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#8A7F63" },

  emptyState: { padding: "30px 0", textAlign: "center", color: "#8A7F63", fontSize: 14 },

  promptText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "clamp(26px, 5.5vw, 34px)",
    fontWeight: 700,
    color: "#1F2937",
    textAlign: "center",
    padding: "22px 8px 26px",
  },

  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 10,
  },
  optionBtn: {
    border: "2px solid",
    borderRadius: 10,
    padding: "14px 10px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 18,
    fontWeight: 700,
  },

  fillRow: { display: "flex", gap: 10, justifyContent: "center" },
  fillInput: {
    border: "2px solid",
    borderRadius: 10,
    padding: "12px 16px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 18,
    fontWeight: 700,
    width: 180,
    textAlign: "center",
    background: "#FFFDF7",
    color: "#1F2937",
    outline: "none",
  },
  submitBtn: {
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    background: "#1F2937",
    color: "#F4EFE3",
    fontWeight: 700,
    fontSize: 14,
  },

  feedbackBar: {
    marginTop: 16,
    borderRadius: 10,
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 14,
    flexWrap: "wrap",
    gap: 10,
  },
  nextBtn: {
    border: "none",
    borderRadius: 8,
    padding: "7px 14px",
    background: "#1F2937",
    color: "#F4EFE3",
    fontWeight: 700,
    fontSize: 13,
  },

  heatmapSection: { marginTop: 6 },
  heatmapHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  heatmapTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#F4EFE3", margin: 0 },
  linkBtn: { background: "none", border: "none", color: "#E8B23D", fontWeight: 600, fontSize: 13 },

  heatBlock: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #233448",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 12,
  },
  heatBlockTitle: {
    fontSize: 12.5,
    fontWeight: 700,
    letterSpacing: "0.04em",
    color: "#C6D4E0",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  heatGrid: { display: "flex", flexWrap: "wrap", gap: "10px 6px" },
  bubbleWrap: { display: "flex", flexDirection: "column", alignItems: "center", width: 40 },
  bubble: { width: 22, height: 22, borderRadius: "50%", border: "1px solid rgba(0,0,0,0.15)" },
  bubbleLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: "#8FA2B5", marginTop: 3 },

  legendRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8FA2B5", margin: "10px 2px 18px" },
  legendLabel: { marginRight: 2 },
  legendDot: { width: 14, height: 14, borderRadius: "50%", display: "inline-block" },

  resetBtn: {
    display: "block",
    margin: "0 auto",
    background: "transparent",
    border: "1.5px solid #C0392B",
    color: "#E08279",
    borderRadius: 999,
    padding: "8px 18px",
    fontSize: 12.5,
    fontWeight: 600,
  },

  footer: { textAlign: "center", fontSize: 11.5, color: "#5E7590", marginTop: 30 },

  comingSoonBox: {
    border: "1.5px dashed #3E566B",
    borderRadius: 12,
    padding: "14px 16px",
    marginTop: 20,
    textAlign: "center",
  },
  comingSoonTitle: { fontSize: 13, fontWeight: 700, color: "#C6D4E0", marginBottom: 10 },
  comingSoonChips: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  comingSoonChip: {
    fontSize: 11.5,
    color: "#8FA2B5",
    border: "1px solid #33465B",
    borderRadius: 999,
    padding: "4px 12px",
  },
};