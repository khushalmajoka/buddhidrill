/* ============================================================
   COSMETIC THEMES
   Purely decorative — swaps the page background gradient and the
   gold accent color (header eyebrow, stamp box border, link buttons)
   via CSS custom properties set on the page wrapper. Functional
   "active state" colors elsewhere in the app deliberately stay gold
   across all themes, so switching themes never affects legibility of
   selected/active controls.
   ============================================================ */

import { badgeById } from "./badges";
import { pkey } from "./profiles";

export const THEMES = [
  {
    id: "classic", icon: "🌌", label: "Classic Navy",
    accent: "#E8B23D",
    bg: "radial-gradient(1200px 600px at 10% -10%, #16273D 0%, #0B1929 55%, #081422 100%)",
    unlockLevel: 1,
  },
  {
    // Phase 6, item 21 — the only theme with `light: true`; App.jsx adds a
    // `bd-light` class to the page wrapper for this theme, which flips the
    // handful of structural surfaces (page bg, cards, text colors) via CSS
    // overrides in styles.js GLOBAL_CSS. Per the documented theme trade-off,
    // this reskins the main surfaces, not every hardcoded color everywhere.
    id: "daylight", icon: "☀️", label: "Daylight",
    accent: "#B2762B",
    bg: "radial-gradient(1200px 600px at 10% -10%, #F7F2E4 0%, #EFE8D6 55%, #E7DEC7 100%)",
    light: true,
    unlockLevel: 1,
  },
  {
    id: "emerald", icon: "🟢", label: "Emerald Night",
    accent: "#3DDC97",
    bg: "radial-gradient(1200px 600px at 10% -10%, #123328 0%, #081F19 55%, #051510 100%)",
    unlockLevel: 5,
  },
  {
    id: "crimson", icon: "🔴", label: "Crimson Drill",
    accent: "#E8703D",
    bg: "radial-gradient(1200px 600px at 10% -10%, #3D1E16 0%, #1F0F0B 55%, #140A07 100%)",
    unlockLevel: 10,
  },
  {
    id: "violet", icon: "🟣", label: "Violet Focus",
    accent: "#B27DE8",
    bg: "radial-gradient(1200px 600px at 10% -10%, #271A3D 0%, #150B1F 55%, #0D0714 100%)",
    unlockLevel: 15,
  },
  {
    id: "gold", icon: "🏆", label: "Solid Gold",
    accent: "#F2C744",
    bg: "radial-gradient(1200px 600px at 10% -10%, #3D3016 0%, #1F1A08 55%, #141105 100%)",
    unlockBadge: "level_20",
  },
  {
    id: "obsidian", icon: "🌋", label: "Obsidian Blaze",
    accent: "#FF5A3C",
    bg: "radial-gradient(1200px 600px at 10% -10%, #2A0E08 0%, #170603 55%, #0D0301 100%)",
    unlockLevel: 25,
  },
  {
    id: "sapphire", icon: "🔷", label: "Sapphire Storm",
    accent: "#3FA9F5",
    bg: "radial-gradient(1200px 600px at 10% -10%, #0B233D 0%, #061424 55%, #030D18 100%)",
    unlockLevel: 30,
  },
  {
    id: "inferno", icon: "🔥", label: "Streak Inferno",
    accent: "#FF6B35",
    bg: "radial-gradient(1200px 600px at 10% -10%, #3D1206 0%, #200902 55%, #140501 100%)",
    unlockBadge: "streak_100",
  },
  {
    id: "neon", icon: "🌈", label: "Cyber Neon",
    accent: "#FF3DBB",
    bg: "radial-gradient(1200px 600px at 10% -10%, #170B33 0%, #0B051D 55%, #060312 100%)",
    unlockLevel: 40,
  },
  {
    id: "chrome", icon: "🔬", label: "Precision Chrome",
    accent: "#D9E6EC",
    bg: "radial-gradient(1200px 600px at 10% -10%, #1C232A 0%, #10151A 55%, #0A0D10 100%)",
    unlockBadge: "precision_master",
  },
  {
    id: "prestige", icon: "👑", label: "Grandmaster Prestige",
    accent: "#FFD86B",
    bg: "radial-gradient(1200px 600px at 10% -10%, #3D2F06 0%, #221A03 55%, #141001 100%)",
    unlockBadge: "level_50",
  },
];

const THEME_KEY = "buddhidrill-theme";

export function loadThemeId() {
  try { return window.localStorage.getItem(pkey(THEME_KEY)) || "classic"; } catch { return "classic"; }
}

export function saveThemeId(id) {
  try { window.localStorage.setItem(pkey(THEME_KEY), id); } catch { /* ignore */ }
}

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function isThemeUnlocked(theme, { level, unlockedBadges }) {
  if (theme.unlockBadge) return unlockedBadges.includes(theme.unlockBadge);
  if (theme.unlockLevel) return level >= theme.unlockLevel;
  return true;
}

export function unlockRequirementLabel(theme) {
  if (theme.unlockBadge) {
    const b = badgeById(theme.unlockBadge);
    return b ? `Unlock the "${b.label}" badge` : "Unlock a hidden badge";
  }
  if (theme.unlockLevel) return `Reach level ${theme.unlockLevel}`;
  return "";
}
