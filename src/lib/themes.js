/* ============================================================
   COSMETIC THEMES
   Purely decorative — swaps the page background gradient and the
   gold accent color (header eyebrow, stamp box border, link buttons)
   via CSS custom properties set on the page wrapper. Functional
   "active state" colors elsewhere in the app deliberately stay gold
   across all themes, so switching themes never affects legibility of
   selected/active controls.
   ============================================================ */

export const THEMES = [
  {
    id: "classic", icon: "🌌", label: "Classic Navy",
    accent: "#E8B23D",
    bg: "radial-gradient(1200px 600px at 10% -10%, #16273D 0%, #0B1929 55%, #081422 100%)",
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
];

const THEME_KEY = "buddhidrill-theme";

export function loadThemeId() {
  try { return window.localStorage.getItem(THEME_KEY) || "classic"; } catch { return "classic"; }
}

export function saveThemeId(id) {
  try { window.localStorage.setItem(THEME_KEY, id); } catch { /* ignore */ }
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
  if (theme.unlockBadge) return "Unlock the Level 20 badge";
  if (theme.unlockLevel) return `Reach level ${theme.unlockLevel}`;
  return "";
}
