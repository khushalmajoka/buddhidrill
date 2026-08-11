/* ============================================================
   BADGES / ACHIEVEMENTS
   Pure read-off of data that already exists (stats, daily history,
   best streak, XP level, per-duration Game Mode high scores) — no
   new tracking required. Unlocked badge ids are persisted separately
   from everything else so re-evaluating is always safe/idempotent.
   ============================================================ */

import { categoryAccuracy } from "../stats";

const UNLOCKED_KEY = "buddhidrill-badges";

export function loadUnlockedBadges() {
  try {
    const raw = window.localStorage.getItem(UNLOCKED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveUnlockedBadges(ids) {
  try { window.localStorage.setItem(UNLOCKED_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

// consecutive days (ending today) with at least one attempt logged
function currentDayStreak(history) {
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    const entry = history[key];
    if (entry && entry.total > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function readHighScore(duration) {
  try {
    const raw = window.localStorage.getItem(`buddhidrill-highscore-${duration}`);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function bossCleared() {
  try { return window.localStorage.getItem("buddhidrill-boss-cleared") === "1"; } catch { return false; }
}

// ctx = { stats, history, bestStreakEver, level, summary }
export const BADGE_DEFS = [
  {
    id: "first_steps", icon: "🌱", label: "First Steps",
    desc: "Answer your first question.",
    check: (ctx) => ctx.summary.total >= 1,
  },
  {
    id: "century", icon: "💯", label: "Century",
    desc: "Answer 100 questions in total.",
    check: (ctx) => ctx.summary.total >= 100,
  },
  {
    id: "grinder", icon: "⛏️", label: "Grinder",
    desc: "Answer 1,000 questions in total.",
    check: (ctx) => ctx.summary.total >= 1000,
  },
  {
    id: "streak_10", icon: "🔥", label: "On a Roll",
    desc: "Hit a 10-answer streak.",
    check: (ctx) => ctx.bestStreakEver >= 10,
  },
  {
    id: "streak_25", icon: "🔥", label: "Unstoppable",
    desc: "Hit a 25-answer streak.",
    check: (ctx) => ctx.bestStreakEver >= 25,
  },
  {
    id: "streak_50", icon: "🌟", label: "Legendary Streak",
    desc: "Hit a 50-answer streak.",
    check: (ctx) => ctx.bestStreakEver >= 50,
  },
  {
    id: "level_5", icon: "🥉", label: "Level 5",
    desc: "Reach level 5.",
    check: (ctx) => ctx.level >= 5,
  },
  {
    id: "level_10", icon: "🥈", label: "Level 10",
    desc: "Reach level 10.",
    check: (ctx) => ctx.level >= 10,
  },
  {
    id: "level_20", icon: "🥇", label: "Level 20",
    desc: "Reach level 20.",
    check: (ctx) => ctx.level >= 20,
  },
  {
    id: "sharpshooter", icon: "🎯", label: "Sharpshooter",
    desc: "Reach 100% accuracy in any category (20+ attempts).",
    check: (ctx) => Object.keys(ctx.stats).some((cat) => {
      const a = categoryAccuracy(ctx.stats, cat);
      return a.total >= 20 && a.acc === 1;
    }),
  },
  {
    id: "well_rounded", icon: "🧭", label: "Well Rounded",
    desc: "Practice at least 5 categories with 10+ attempts each.",
    check: (ctx) => Object.keys(ctx.stats)
      .filter((cat) => categoryAccuracy(ctx.stats, cat).total >= 10).length >= 5,
  },
  {
    id: "habit_3", icon: "📅", label: "Building a Habit",
    desc: "Practice 3 days in a row.",
    check: (ctx) => currentDayStreak(ctx.history) >= 3,
  },
  {
    id: "habit_7", icon: "📆", label: "Week Warrior",
    desc: "Practice 7 days in a row.",
    check: (ctx) => currentDayStreak(ctx.history) >= 7,
  },
  {
    id: "speedster", icon: "⚡", label: "Speedster",
    desc: "Score 20+ correct in a single 60s Game Mode run.",
    check: () => readHighScore(60) >= 20,
  },
  {
    id: "boss_slayer", icon: "🐉", label: "Boss Slayer",
    desc: "Clear a Boss Level challenge.",
    check: () => bossCleared(),
  },
];

export function badgeById(id) {
  return BADGE_DEFS.find((b) => b.id === id) || null;
}

// evaluates every not-yet-unlocked badge against fresh ctx, persists any
// newly earned ones, and returns both the full unlocked set and just the
// ones that were newly earned this call (for toast/confetti purposes)
export function evaluateBadges(ctx) {
  const already = new Set(loadUnlockedBadges());
  const newly = [];
  for (const b of BADGE_DEFS) {
    if (already.has(b.id)) continue;
    if (b.check(ctx)) {
      already.add(b.id);
      newly.push(b.id);
    }
  }
  const unlocked = Array.from(already);
  if (newly.length) saveUnlockedBadges(unlocked);
  return { unlocked, newlyUnlocked: newly };
}
