/* ============================================================
   GENERAL MATH / RANDOM / FORMATTING HELPERS
   Small, dependency-free utilities shared by the question generators,
   stats/heatmap code, and settings handlers.
   ============================================================ */

export function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
export function simplify(n, d) { const g = gcd(n, d); return [n / g, d / g]; }

export function pctLabel(num, den) {
  const v = (num / den) * 100;
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? `${r}` : r.toFixed(2).replace(/0$/, "");
}

export function rnd(rng) { return rng ? rng() : Math.random(); }

export function randInt(min, max, rng) {
  const r = rng ? rng() : Math.random();
  return Math.floor(r * (max - min + 1)) + min;
}
export function pick(arr, rng) { return arr[randInt(0, arr.length - 1, rng)]; }

// groups a wide numeric range into ~10 buckets so heatmaps stay readable
// even when the user opens the range up to e.g. 100-999
export function bucketForRange(n, lo, hi) {
  const span = Math.max(1, hi - lo + 1);
  const bucketSize = Math.max(1, Math.ceil(span / 10));
  if (bucketSize === 1) return String(n);
  const idx = Math.floor((n - lo) / bucketSize);
  const start = lo + idx * bucketSize;
  const end = Math.min(hi, start + bucketSize - 1);
  return `${start}-${end}`;
}
export function bucketItemsForRange(lo, hi) {
  const span = Math.max(1, hi - lo + 1);
  const bucketSize = Math.max(1, Math.ceil(span / 10));
  const items = [];
  for (let start = lo; start <= hi; start += bucketSize) {
    const end = Math.min(hi, start + bucketSize - 1);
    items.push(bucketSize === 1 ? String(start) : `${start}-${end}`);
  }
  return items;
}

export function clampInt(val, lo, hi) {
  if (Number.isNaN(val)) return lo;
  return Math.min(Math.max(val, lo), hi);
}

export function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i, rng);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function numDistractors(answer, spread, count = 3, rng) {
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

export function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

// acc in [0,1] -> from rose (weak) to gold (mid) to green (strong)
export function colorForAcc(acc) {
  if (acc === null || acc === undefined) return "#33465B";
  if (acc < 0.5) {
    // rose to amber
    const t = acc / 0.5;
    return lerpColor("#C0392B", "#E8B23D", t);
  }
  const t = (acc - 0.5) / 0.5;
  return lerpColor("#E8B23D", "#1F6F5C", t);
}

export function lerpColor(c1, c2, t) {
  const p1 = hexToRgb(c1), p2 = hexToRgb(c2);
  const r = Math.round(p1.r + (p2.r - p1.r) * t);
  const g = Math.round(p1.g + (p2.g - p1.g) * t);
  const b = Math.round(p1.b + (p2.b - p1.b) * t);
  return `rgb(${r},${g},${b})`;
}
export function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.substring(0, 2), 16),
    g: parseInt(v.substring(2, 4), 16),
    b: parseInt(v.substring(4, 6), 16),
  };
}
