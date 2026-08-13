/* ============================================================
   PRACTICE PLAN
   A one-tap "what should I drill today" suggestion. Natural follow-on
   to adaptive difficulty + spaced repetition: it reuses the exact same
   signals (per-category accuracy, items due for review) to rank
   categories rather than introducing a new scoring system.
   ============================================================ */

import { CATEGORY_ORDER, CATEGORY_META } from "../constants";
import { categoryAccuracy } from "../stats";
import { dueCount } from "./spacedRepetition";

const PLAN_SIZE = 3;
export const PRACTICE_PLAN_QUESTION_TARGET = 15;

export function buildPracticePlan(stats, srs) {
  const scored = CATEGORY_ORDER.map((cat) => {
    const { acc, total } = categoryAccuracy(stats, cat);
    const due = dueCount(srs, cat);
    // no data yet -> a modest default score so untried categories still
    // surface sometimes instead of being ignored forever
    const accScore = acc === null ? 0.5 : (1 - acc);
    const score = accScore * 2 + Math.min(due, 10) * 0.15;
    return { cat, label: CATEGORY_META[cat].label, acc, total, due, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const picked = scored.slice(0, PLAN_SIZE);
  return {
    categories: picked.map((s) => s.cat),
    details: picked,
    estimatedQuestions: PRACTICE_PLAN_QUESTION_TARGET,
  };
}
