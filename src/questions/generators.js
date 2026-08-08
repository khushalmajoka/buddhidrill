import { FRACTIONS, QUICK_PCT } from "../constants";
import { pctLabel, simplify, shuffle, numDistractors, pick, randInt, bucketForRange, rnd } from "../lib/mathUtils";

/* ============================================================
   QUESTION GENERATORS
   returns { category, key, keyLabel, prompt, answer, type, options?, checkFillBlank }
   ============================================================ */

export function genMultiplication(forceType, ranges, rng) {
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

export function genAddition(forceType, ranges, rng) {
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

export function genSubtraction(forceType, ranges, rng) {
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

export function genDivision(forceType, ranges, rng) {
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

export function genSquares(forceType, ranges, rng) {
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

export function genCubes(forceType, ranges, rng) {
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

export function genFractions(forceType, ranges, rng) {
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

export function genQuickPct(forceType, ranges, rng) {
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

export function letterAt(pos) { return String.fromCharCode(64 + pos); }

export function letterDistractors(correctLetter, count, near, rng) {
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
export function genAlphaValue(forceType, ranges, rng) {
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
export function genAlphaOpposite(forceType, ranges, rng) {
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

export const GENERATORS = {
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
