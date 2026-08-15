/* ============================================================
   IMPORT / EXPORT SETTINGS (Phase 6, item 24)
   Bundles everything a person tuned by hand — active categories,
   ranges, difficulty, answer mode, theme, sound, adaptive/spaced-rep
   toggles, reminder prefs, big-text pref — into one downloadable JSON
   file, and can restore it again. Pure Blob/File Web APIs, no
   dependency. Deliberately excludes stats/XP/badges/history: those are
   *progress*, not settings, and round-tripping them invites accidental
   overwrite of real progress. Use "Export progress" (Progress tab) for that.
   ============================================================ */

const SETTINGS_SCHEMA_VERSION = 1;

export function buildSettingsSnapshot({
  active, ranges, difficultyLabel, answerMode, themeId, soundOn,
  adaptiveOn, spacedRepOn, reminderPref, bigText,
}) {
  return {
    schema: "buddhidrill-settings",
    version: SETTINGS_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: {
      active, ranges, difficultyLabel, answerMode, themeId, soundOn,
      adaptiveOn, spacedRepOn, reminderPref, bigText,
    },
  };
}

export function exportSettingsFile(snapshot) {
  try {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buddhidrill-settings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch {
    return false;
  }
}

// Reads a File (from an <input type="file"> change event) and resolves with
// the parsed `.settings` object, or rejects with a human-readable message.
export function importSettingsFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error("No file selected.")); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || parsed.schema !== "buddhidrill-settings" || !parsed.settings) {
          reject(new Error("That doesn't look like a BuddhiDrill settings file."));
          return;
        }
        resolve(parsed.settings);
      } catch {
        reject(new Error("Couldn't read that file — it may be corrupted."));
      }
    };
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsText(file);
  });
}
