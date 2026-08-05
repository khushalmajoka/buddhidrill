import React, { useState, useEffect, useCallback, useRef } from "react";

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
  tables: { label: "Tables", short: "×", ink: "#1F6F5C" },
  squares: { label: "Squares", short: "n²", ink: "#8A4B2B" },
  cubes: { label: "Cubes", short: "n³", ink: "#5B4B8A" },
  fractions: { label: "Fraction ↔ %", short: "%", ink: "#8A2B4B" },
  quickpct: { label: "Quick %", short: "%of", ink: "#2B5A8A" },
};

const CATEGORY_ORDER = ["tables", "squares", "cubes", "fractions", "quickpct"];

const ABSOLUTE_LIMITS = {
  tablesBase: [2, 25],
  tablesMult: [1, 20],
  squaresN: [1, 25],
  cubesN: [1, 25],
  fractionsMaxDen: [2, 25],
  quickpctMult: [2, 60],
};

function defaultRanges() {
  return {
    tables: { base: [2, 25], mult: [2, 12] },
    squares: { n: [1, 25] },
    cubes: { n: [1, 25] },
    fractions: { maxDen: 25 },
    quickpct: { mult: [2, 30] },
  };
}

const DIFFICULTY_PRESETS = {
  easy: {
    tables: { base: [2, 10], mult: [2, 5] },
    squares: { n: [1, 10] },
    cubes: { n: [1, 10] },
    fractions: { maxDen: 10 },
    quickpct: { mult: [2, 10] },
  },
  medium: {
    tables: { base: [2, 20], mult: [2, 10] },
    squares: { n: [1, 20] },
    cubes: { n: [1, 15] },
    fractions: { maxDen: 20 },
    quickpct: { mult: [2, 20] },
  },
  hard: {
    tables: { base: [11, 25], mult: [6, 12] },
    squares: { n: [15, 25] },
    cubes: { n: [12, 25] },
    fractions: { maxDen: 25 },
    quickpct: { mult: [15, 40] },
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
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function numDistractors(answer, spread, count = 3) {
  const set = new Set([answer]);
  let guard = 0;
  while (set.size < count + 1 && guard < 200) {
    guard++;
    const delta = randInt(-spread, spread);
    const cand = answer + (delta === 0 ? spread : delta);
    if (cand > 0 && !set.has(cand)) set.add(cand);
  }
  return [...set].filter((v) => v !== answer);
}

/* ============================================================
   QUESTION GENERATORS
   returns { category, key, keyLabel, prompt, answer, type, options?, checkFillBlank }
   ============================================================ */

function genTables(forceType, ranges) {
  const r = ranges.tables;
  const base = randInt(r.base[0], r.base[1]);
  const mult = randInt(r.mult[0], r.mult[1]);
  const answer = base * mult;
  const asMcq = forceType ? forceType === "mcq" : Math.random() < 0.5;
  const prompt = `${base} × ${mult} = ?`;
  if (asMcq) {
    const options = shuffle([answer, ...numDistractors(answer, Math.max(6, base))]);
    return { category: "tables", key: base, keyLabel: base, prompt, answer, type: "mcq", options };
  }
  return { category: "tables", key: base, keyLabel: base, prompt, answer, type: "fill" };
}

function genSquares(forceType, ranges) {
  const r = ranges.squares;
  const n = randInt(r.n[0], r.n[1]);
  const answer = n * n;
  const asMcq = forceType ? forceType === "mcq" : Math.random() < 0.5;
  const prompt = `${n}² = ?`;
  if (asMcq) {
    const options = shuffle([answer, ...numDistractors(answer, Math.max(8, n * 2))]);
    return { category: "squares", key: n, keyLabel: n, prompt, answer, type: "mcq", options };
  }
  return { category: "squares", key: n, keyLabel: n, prompt, answer, type: "fill" };
}

function genCubes(forceType, ranges) {
  const r = ranges.cubes;
  const n = randInt(r.n[0], r.n[1]);
  const answer = n * n * n;
  const asMcq = forceType ? forceType === "mcq" : Math.random() < 0.5;
  const prompt = `${n}³ = ?`;
  if (asMcq) {
    const spread = Math.max(20, Math.round(answer * 0.15));
    const options = shuffle([answer, ...numDistractors(answer, spread)]);
    return { category: "cubes", key: n, keyLabel: n, prompt, answer, type: "mcq", options };
  }
  return { category: "cubes", key: n, keyLabel: n, prompt, answer, type: "fill" };
}

function genFractions(forceType, ranges) {
  const maxDen = ranges.fractions.maxDen;
  const pool = FRACTIONS.filter(([, d]) => d <= maxDen);
  const usable = pool.length >= 4 ? pool : FRACTIONS;
  const [num, den] = pick(usable);
  const key = `${num}/${den}`;
  const directionA = Math.random() < 0.6; // fraction -> %
  if (directionA) {
    const answerLabel = pctLabel(num, den);
    const answerVal = parseFloat(answerLabel);
    const prompt = `${num}/${den} = ?%`;
    const asMcq = forceType ? forceType === "mcq" : Math.random() < 0.6;
    if (asMcq) {
      const distractors = [];
      const others = shuffle(usable.filter((f) => f[0] !== num || f[1] !== den)).slice(0, 6);
      for (const [n2, d2] of others) {
        const lbl = pctLabel(n2, d2);
        if (lbl !== answerLabel && !distractors.includes(lbl)) distractors.push(lbl);
        if (distractors.length >= 3) break;
      }
      const options = shuffle([answerLabel, ...distractors]);
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
    const asMcq = forceType ? forceType === "mcq" : Math.random() < 0.5;
    if (!asMcq) {
      const prompt = `${label}% = ? (lowest-terms fraction, e.g. 3/4)`;
      return {
        category: "fractions", key, keyLabel: key, prompt, answer,
        type: "fill", answerIsText: true, inputMode: "text", placeholder: "e.g. 3/4",
      };
    }
    const prompt = `${label}% = ? (lowest terms fraction)`;
    const others = shuffle(usable.filter((f) => f[0] !== num || f[1] !== den)).slice(0, 6);
    const distractors = [];
    for (const [n2, d2] of others) {
      const [a, b] = simplify(n2, d2);
      const lbl = `${a}/${b}`;
      if (lbl !== answer && !distractors.includes(lbl)) distractors.push(lbl);
      if (distractors.length >= 3) break;
    }
    const options = shuffle([answer, ...distractors]);
    return { category: "fractions", key, keyLabel: key, prompt, answer, type: "mcq", options };
  }
}

function genQuickPct(forceType, ranges) {
  const r = ranges.quickpct;
  const [num, den] = pick(QUICK_PCT);
  const mult = randInt(r.mult[0], r.mult[1]);
  const base = den * mult;
  const answer = (base * num) / den;
  const label = pctLabel(num, den);
  const prompt = `${label}% of ${base} = ?`;
  const asMcq = forceType ? forceType === "mcq" : Math.random() < 0.55;
  const key = label;
  if (asMcq) {
    const spread = Math.max(4, Math.round(answer * 0.2));
    const options = shuffle([answer, ...numDistractors(answer, spread)]);
    return { category: "quickpct", key, keyLabel: `${label}%`, prompt, answer, type: "mcq", options };
  }
  return { category: "quickpct", key, keyLabel: `${label}%`, prompt, answer, type: "fill" };
}

const GENERATORS = {
  tables: genTables,
  squares: genSquares,
  cubes: genCubes,
  fractions: genFractions,
  quickpct: genQuickPct,
};

/* ============================================================
   STATS HELPERS
   ============================================================ */

function emptyStats() {
  return { tables: {}, squares: {}, cubes: {}, fractions: {}, quickpct: {} };
}

function recordAnswer(stats, category, key, correct) {
  const next = { ...stats, [category]: { ...stats[category] } };
  const cur = next[category][key] || { correct: 0, total: 0 };
  next[category][key] = {
    correct: cur.correct + (correct ? 1 : 0),
    total: cur.total + 1,
  };
  return next;
}

function accuracyOf(entry) {
  if (!entry || entry.total === 0) return null;
  return entry.correct / entry.total;
}

function weightForItem(stats, category, key) {
  const entry = stats[category] && stats[category][key];
  if (!entry || entry.total === 0) return 3; // unseen items get modest priority
  const acc = entry.correct / entry.total;
  // weaker items (low acc, more attempts) get higher weight
  const base = 1 - acc;
  return 0.5 + base * 4 + Math.min(entry.total, 5) * 0.15;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function BuddhiDrill() {
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState(emptyStats());
  const [active, setActive] = useState({
    tables: true, squares: true, cubes: true, fractions: true, quickpct: true,
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
  const advanceTimerRef = useRef(null);
  const feedbackRef = useRef(null);
  const questionRef = useRef(null);
  const fillValueRef = useRef("");

  useEffect(() => { feedbackRef.current = feedback; }, [feedback]);
  useEffect(() => { questionRef.current = question; }, [question]);
  useEffect(() => { fillValueRef.current = fillValue; }, [fillValue]);

  // load persisted stats (browser localStorage — works once deployed as a standalone site)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("buddhidrill-stats");
      if (raw) setStats({ ...emptyStats(), ...JSON.parse(raw) });
    } catch (e) {
      // no saved stats yet, or storage blocked — start fresh
    } finally {
      setLoaded(true);
    }
  }, []);

  const persist = useCallback((next) => {
    try {
      window.localStorage.setItem("buddhidrill-stats", JSON.stringify(next));
    } catch (e) {
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

  const nextQuestion = useCallback((statsSnapshot) => {
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
    setQuestion(q);
    setSelected(null);
    setFillValue("");
    setFeedback(null);
  }, [pickCategory, weakMode, answerMode, ranges]);

  useEffect(() => {
    if (loaded && !question) nextQuestion(stats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  useEffect(() => {
    if (question && question.type === "fill" && inputRef.current) {
      inputRef.current.focus();
    }
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
    const nextStats = recordAnswer(stats, question.category, question.key, correct);
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
    nextQuestion(stats);
  }

  // global Enter handling: submits a typed fill-blank answer, or advances to the
  // next question once feedback (correct/wrong) is showing
  useEffect(() => {
    function onKeyDown(e) {
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

  function handleReset() {
    const fresh = emptyStats();
    setStats(fresh);
    persist(fresh);
    setSession({ correct: 0, total: 0, streak: 0, best: 0 });
  }

  function toggleCategory(cat) {
    setActive((a) => {
      const next = { ...a, [cat]: !a[cat] };
      if (!Object.values(next).some(Boolean)) return a; // keep at least one on
      return next;
    });
  }

  function applyDifficulty(label) {
    setDifficultyLabel(label);
    setRanges(JSON.parse(JSON.stringify(DIFFICULTY_PRESETS[label])));
  }

  function clamp(val, lo, hi) {
    if (Number.isNaN(val)) return lo;
    return Math.min(Math.max(val, lo), hi);
  }

  // updates one end (0=min, 1=max) of a two-value range for a category/field,
  // e.g. updateRangePair('tables', 'base', 0, 5)
  function updateRangePair(cat, field, idx, rawValue) {
    const limitsKey = `${cat}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    const [lo, hi] = ABSOLUTE_LIMITS[limitsKey] || [1, 99];
    const value = clamp(parseInt(rawValue, 10), lo, hi);
    setDifficultyLabel("custom");
    setRanges((r) => {
      const pair = [...r[cat][field]];
      pair[idx] = value;
      if (pair[0] > pair[1]) {
        if (idx === 0) pair[1] = pair[0]; else pair[0] = pair[1];
      }
      return { ...r, [cat]: { ...r[cat], [field]: pair } };
    });
  }

  function updateSingleValue(cat, field, rawValue) {
    const limitsKey = `${cat}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    const [lo, hi] = ABSOLUTE_LIMITS[limitsKey] || [1, 99];
    const value = clamp(parseInt(rawValue, 10), lo, hi);
    setDifficultyLabel("custom");
    setRanges((r) => ({ ...r, [cat]: { ...r[cat], [field]: value } }));
  }

  useEffect(() => {
    if (loaded) nextQuestion(stats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, answerMode, ranges]);

  const accuracyPct = session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0;

  return (
    <div style={styles.page}>
      <style>{FONT_IMPORT + GLOBAL_CSS}</style>

      <div style={styles.wrap}>
        {/* ADMIT-CARD HEADER */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.eyebrow}>BUDDHIDRILL · MENTAL MATH &amp; REASONING DRILLS</div>
            <h1 style={styles.title}>BuddhiDrill</h1>
            <div style={styles.subtitle}>Tables · Squares · Cubes · Fraction–% · Quick % — built for govt exam quant &amp; reasoning</div>
          </div>
          <div style={styles.stampBox}>
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
            title="Bias questions toward your weakest numbers"
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
            {active.tables && (
              <RangeRow
                label="Tables — table number"
                value={ranges.tables.base}
                onChange={(idx, v) => updateRangePair("tables", "base", idx, v)}
                limits={ABSOLUTE_LIMITS.tablesBase}
              />
            )}
            {active.tables && (
              <RangeRow
                label="Tables — multiplier (×1 to ×N)"
                value={ranges.tables.mult}
                onChange={(idx, v) => updateRangePair("tables", "mult", idx, v)}
                limits={ABSOLUTE_LIMITS.tablesMult}
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
            <div style={styles.customizeHint}>Higher table/square/cube numbers and bigger multipliers = harder mental math.</div>
          </div>
        )}

        {/* QUESTION CARD */}
        <div style={styles.paperCard}>
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
              <div style={styles.promptText}>{question.prompt}</div>

              {question.type === "mcq" ? (
                <div style={styles.optionsGrid}>
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
                <form onSubmit={handleFillSubmit} style={styles.fillRow}>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode={question.inputMode === "text" ? "text" : "decimal"}
                    value={fillValue}
                    disabled={!!feedback}
                    onChange={(e) => setFillValue(e.target.value)}
                    placeholder={question.placeholder || "type your answer"}
                    style={{
                      ...styles.fillInput,
                      borderColor: feedback === "correct" ? "#1F6F5C" : feedback === "wrong" ? "#C0392B" : "#B9AE94",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!!feedback}
                    style={styles.submitBtn}
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
              <Heatmap category="tables" title="Tables (2–25)" items={range(2, 25)} stats={stats} />
              <Heatmap category="squares" title="Squares (1–25)" items={range(1, 25)} stats={stats} />
              <Heatmap category="cubes" title="Cubes (1–25)" items={range(1, 25)} stats={stats} />
              <Heatmap
                category="fractions"
                title="Fraction ↔ %"
                items={FRACTIONS.map(([n, d]) => `${n}/${d}`)}
                stats={stats}
              />
              <Heatmap
                category="quickpct"
                title="Quick % of a number"
                items={QUICK_PCT.map(([n, d]) => pctLabel(n, d))}
                stats={stats}
              />

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
            {["Place Value", "Number Series", "Reversal Pairs", "Alphabet Coding", "Blood Relations", "Direction Sense"].map((t) => (
              <span key={t} style={styles.comingSoonChip}>{t}</span>
            ))}
          </div>
        </div>

        <footer style={styles.footer}>BuddhiDrill — daily mental math &amp; reasoning drills for govt exam prep. Accuracy is tracked per number and saved on this device.</footer>
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