import { ABSOLUTE_LIMITS, DIFFICULTY_PRESETS } from "../constants";
import { clampInt } from "./mathUtils";

/* ============================================================
   SETTINGS HANDLER FACTORIES — Practice and Battle each keep their own
   independent active/ranges/difficulty/answerMode state, but the logic
   for toggling a category or editing a range is identical, so it's
   built once here and bound to whichever setters are passed in.
   ============================================================ */

export function makeToggleCategory(setActiveFn) {
  return (cat) => {
    setActiveFn((a) => {
      const next = { ...a, [cat]: !a[cat] };
      if (!Object.values(next).some(Boolean)) return a; // keep at least one on
      return next;
    });
  };
}

export function makeApplyDifficulty(setRangesFn, setDifficultyLabelFn) {
  return (label) => {
    setDifficultyLabelFn(label);
    setRangesFn(JSON.parse(JSON.stringify(DIFFICULTY_PRESETS[label])));
  };
}

// updates one end (0=min, 1=max) of a two-value range for a category/field,
// e.g. updateRangePair('multiplication', 'a', 0, 5)
export function makeUpdateRangePair(setRangesFn, setDifficultyLabelFn) {
  return (cat, field, idx, rawValue) => {
    const limitsKey = `${cat}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    const [lo, hi] = ABSOLUTE_LIMITS[limitsKey] || [1, 99];
    const value = clampInt(parseInt(rawValue, 10), lo, hi);
    setDifficultyLabelFn("custom");
    setRangesFn((r) => {
      const pair = [...r[cat][field]];
      pair[idx] = value;
      if (pair[0] > pair[1]) {
        if (idx === 0) pair[1] = pair[0]; else pair[0] = pair[1];
      }
      return { ...r, [cat]: { ...r[cat], [field]: pair } };
    });
  };
}

export function makeUpdateSingleValue(setRangesFn, setDifficultyLabelFn) {
  return (cat, field, rawValue) => {
    const limitsKey = `${cat}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    const [lo, hi] = ABSOLUTE_LIMITS[limitsKey] || [1, 99];
    const value = clampInt(parseInt(rawValue, 10), lo, hi);
    setDifficultyLabelFn("custom");
    setRangesFn((r) => ({ ...r, [cat]: { ...r[cat], [field]: value } }));
  };
}
