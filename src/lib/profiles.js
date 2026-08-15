/* ============================================================
   PROFILES (Phase 6, item 25)
   Lets one device host several local players (e.g. siblings sharing
   a laptop), each with fully separate stats/XP/badges/theme/etc.

   Migration-free by design: the very first profile ("default") reads
   and writes every key EXACTLY as before (no prefix), so existing
   users' data is untouched. Any additional profile gets its keys
   namespaced with `::p:<id>`. Every other lib file that touches
   localStorage wraps its key with `pkey()` from here, so switching
   the active profile automatically scopes ALL persisted data (stats,
   history, XP, badges, theme, sound pref, adaptive/SRS state,
   reminders, best streak, boss-cleared flag, high scores, player name).
   ============================================================ */

const PROFILES_LIST_KEY = "buddhidrill-profiles";
const ACTIVE_PROFILE_KEY = "buddhidrill-active-profile";
export const DEFAULT_PROFILE_ID = "default";

export function loadProfiles() {
  try {
    const raw = window.localStorage.getItem(PROFILES_LIST_KEY);
    const list = raw ? JSON.parse(raw) : null;
    if (Array.isArray(list) && list.length) return list;
  } catch { /* ignore */ }
  return [{ id: DEFAULT_PROFILE_ID, name: "Player 1", avatar: "🧠", createdAt: Date.now() }];
}

function saveProfiles(list) {
  try { window.localStorage.setItem(PROFILES_LIST_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function loadActiveProfileId() {
  try { return window.localStorage.getItem(ACTIVE_PROFILE_KEY) || DEFAULT_PROFILE_ID; } catch { return DEFAULT_PROFILE_ID; }
}

export function saveActiveProfileId(id) {
  try { window.localStorage.setItem(ACTIVE_PROFILE_KEY, id); } catch { /* ignore */ }
}

// Namespaces a base localStorage key for the CURRENTLY ACTIVE profile.
// The default profile is deliberately unprefixed for zero-migration
// backward compatibility.
export function pkey(baseKey) {
  const active = loadActiveProfileId();
  if (!active || active === DEFAULT_PROFILE_ID) return baseKey;
  return `${baseKey}::p:${active}`;
}

const AVATAR_CHOICES = ["🧠", "🚀", "🦊", "🐯", "🐼", "🦉", "🐙", "🦁", "🐨", "🦄", "🐸", "🦅"];
export function avatarChoices() { return AVATAR_CHOICES; }

export function createProfile(name) {
  const list = loadProfiles();
  const id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const avatar = AVATAR_CHOICES[list.length % AVATAR_CHOICES.length];
  const next = [...list, { id, name: (name || "New Player").slice(0, 20), avatar, createdAt: Date.now() }];
  saveProfiles(next);
  return next;
}

export function renameProfile(id, name) {
  const next = loadProfiles().map((p) => (p.id === id ? { ...p, name: (name || p.name).slice(0, 20) } : p));
  saveProfiles(next);
  return next;
}

export function setProfileAvatar(id, avatar) {
  const next = loadProfiles().map((p) => (p.id === id ? { ...p, avatar } : p));
  saveProfiles(next);
  return next;
}

// Deleting a profile only removes it from the roster — its namespaced
// localStorage keys are simply orphaned (harmless, and recoverable if the
// same id were ever reused, which it never is since ids are timestamped).
export function deleteProfile(id) {
  const list = loadProfiles();
  if (list.length <= 1) return list; // always keep at least one profile
  const next = list.filter((p) => p.id !== id);
  saveProfiles(next);
  if (loadActiveProfileId() === id) saveActiveProfileId(next[0].id);
  return next;
}
