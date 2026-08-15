/* ============================================================
   ACCESSIBILITY (Phase 6, item 22)
   A single "big text" toggle that scales up body/number/answer text
   app-wide via a CSS class + custom property, so it works alongside
   every theme without touching each component's inline styles.
   ============================================================ */

import { pkey } from "./profiles";

const BIG_TEXT_KEY = "buddhidrill-big-text";

export function loadBigTextPref() {
  try { return window.localStorage.getItem(pkey(BIG_TEXT_KEY)) === "1"; } catch { return false; }
}

export function saveBigTextPref(on) {
  try { window.localStorage.setItem(pkey(BIG_TEXT_KEY), on ? "1" : "0"); } catch { /* ignore */ }
}
