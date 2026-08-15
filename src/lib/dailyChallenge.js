/* ============================================================
   DAILY CHALLENGE (Phase 5, item 17) & ASYNC CHALLENGES (item 18)
   Reuses Battle Mode's deterministic mulberry32-seeded question
   generator (src/battle/battleEngine.js) — same seed + same settings
   always produces the same question sequence on any device, which is
   exactly what "everyone gets today's same set" and "beat my set"
   need, with zero network traffic for the questions themselves.
   ============================================================ */

export const DAILY_CHALLENGE_LENGTH = 10;
export const DAILY_CHALLENGE_CATEGORIES = [
  "multiplication", "addition", "subtraction", "division", "squares", "bodmas",
];

// A numeric seed derived from the calendar date (UTC) — every device gets
// the exact same seed on the same day, no server round-trip required.
export function todaysDateKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function seedFromString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function todaysChallengeSeed() {
  return seedFromString(`buddhidrill-daily-${todaysDateKey()}`);
}

/* ---- Async / friend challenges ----
   A challenge "code" packs a random seed + a short label into a compact
   base36 string that fits cleanly in a URL query param, e.g.
   ?challenge=k3f9a2-9x . Whoever opens the link gets the identical
   question set to try to beat. */

export function makeAsyncChallengeSeed() {
  return Math.floor(Math.random() * 0xffffffff);
}

export function encodeChallengeCode(seed, fromName, fromScore) {
  const seedPart = (seed >>> 0).toString(36);
  const namePart = encodeURIComponent((fromName || "").slice(0, 16));
  const scorePart = Number.isFinite(fromScore) ? String(fromScore) : "";
  return [seedPart, namePart, scorePart].join(".");
}

export function decodeChallengeCode(code) {
  if (!code) return null;
  const [seedPart, namePart, scorePart] = String(code).split(".");
  const seed = parseInt(seedPart, 36);
  if (!Number.isFinite(seed)) return null;
  return {
    seed: seed >>> 0,
    fromName: namePart ? decodeURIComponent(namePart) : "",
    fromScore: scorePart ? parseInt(scorePart, 10) : null,
  };
}

export function challengeShareUrl(seed, fromName, fromScore) {
  const code = encodeChallengeCode(seed, fromName, fromScore);
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("challenge", code);
  return url.toString();
}

// Reads ?challenge=... from the current URL, if present.
export function readChallengeFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("challenge");
    return raw ? decodeChallengeCode(raw) : null;
  } catch {
    return null;
  }
}
