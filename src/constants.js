/* ============================================================
   DATA — categories, difficulty presets, and range limits shared
   across Practice, Game, and Battle modes.
   ============================================================ */

export const FRACTIONS = [
  [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5],
  [1, 6], [5, 6], [1, 7], [1, 8], [3, 8], [5, 8], [7, 8], [1, 9], [2, 9],
  [1, 10], [3, 10], [7, 10], [9, 10], [1, 11], [1, 12], [5, 12], [7, 12],
  [11, 12], [1, 16], [1, 20], [1, 25],
];

export const QUICK_PCT = [
  [1, 10], [1, 5], [1, 4], [1, 2], [3, 4], [1, 8], [3, 8], [5, 8], [7, 8],
  [1, 3], [2, 3], [1, 6], [5, 6], [1, 20], [1, 25], [1, 50],
];

export const CATEGORY_META = {
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

export const CATEGORY_ORDER = [
  "multiplication", "addition", "subtraction", "division",
  "squares", "cubes", "fractions", "quickpct",
  "alphaValue", "alphaOpposite",
];

export const ABSOLUTE_LIMITS = {
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

export const DIFFICULTY_PRESETS = {
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

export const GAME_CATEGORY_ORDER = [
  "multiplication", "addition", "subtraction", "division", "squares", "cubes", "alphaValue", "alphaOpposite",
];

// Shared settings UI (Practice + Battle) iterates over this to render each
// category's range inputs identically.
export const RANGE_FIELDS = [
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
