/* ============================================================
   EXPLANATIONS — a one-line "how you get there" for each category,
   built from the same question object the generators already return.
   Used only by Learn Mode; Practice/Game/Battle are unaffected.
   ============================================================ */

function stripSuffix(prompt) {
  return prompt
    .replace(" = ?%", "")
    .replace(" = ?", "")
    .replace(" (lowest terms fraction)", "")
    .replace(" (lowest-terms fraction, e.g. 3/4)", "");
}

export function explainQuestion(q) {
  switch (q.category) {
    case "alphaValue":
      return `${stripSuffix(q.prompt)} = ${q.answer}  ·  A=1, B=2 … Z=26, so just count along the alphabet.`;
    case "alphaOpposite":
      return `${stripSuffix(q.prompt)} = ${q.answer}  ·  Opposite pairs mirror the alphabet: A↔Z, B↔Y, C↔X … position n pairs with position (27 − n).`;
    case "fractions":
      return `${stripSuffix(q.prompt)} = ${q.answer}  ·  Convert by dividing numerator by denominator (or simplify to lowest terms) and shift the decimal for a percentage.`;
    case "quickpct":
      return `${stripSuffix(q.prompt)} = ${q.answer}  ·  Find the fraction's unit value first, then scale it up to the full base number.`;
    case "bodmas":
      return `${stripSuffix(q.prompt)} = ${q.answer}  ·  Brackets first, then × and ÷ (left to right), then + and − (left to right) — never straight left-to-right.`;
    case "squares":
      return `${stripSuffix(q.prompt)} = ${q.answer}  ·  Multiply the number by itself.`;
    case "cubes":
      return `${stripSuffix(q.prompt)} = ${q.answer}  ·  Multiply the number by itself twice more (n × n × n).`;
    default:
      return `${stripSuffix(q.prompt)} = ${q.answer}`;
  }
}
