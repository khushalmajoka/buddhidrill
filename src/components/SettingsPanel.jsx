import { styles } from "../styles";
import { CATEGORY_ORDER, CATEGORY_META, ABSOLUTE_LIMITS, RANGE_FIELDS } from "../constants";
import CategoryPicker from "./CategoryPicker";
import RangeRow from "./RangeRow";

// Shared settings UI — Practice and Battle each pass in their own
// active/ranges/difficulty/answerMode state + setters, identical controls either way.
// Always rendered inside the cream `.bd-card` (Battle), so it always uses the
// light-context tokens.
export default function SettingsPanel({
  active, onToggle, answerMode, onSetAnswerMode,
  difficultyLabel, onApplyDifficulty, ranges, onUpdateRangePair, onUpdateSingleValue,
  showCustomize, onToggleCustomize,
}) {
  return (
    <div>
      <CategoryPicker categories={CATEGORY_ORDER} meta={CATEGORY_META} active={active} onToggle={onToggle} light />

      <div style={styles.modeRow}>
        <span style={styles.cardModeLabel}>Question type:</span>
        <div style={styles.cardSegmentGroup}>
          {[{ id: "mixed", label: "Mixed" }, { id: "mcq", label: "MCQ only" }, { id: "fill", label: "Fill in the blank" }].map((opt) => {
            const on = answerMode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onSetAnswerMode(opt.id)}
                style={{ ...styles.cardSegmentBtn, background: on ? "#E8B23D" : "transparent", color: on ? "#0B1929" : "#6B7A89", fontWeight: on ? 700 : 500 }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.modeRow}>
        <span style={styles.cardModeLabel}>Difficulty:</span>
        <div style={styles.cardSegmentGroup}>
          {["easy", "medium", "hard"].map((id) => {
            const on = difficultyLabel === id;
            return (
              <button
                key={id}
                onClick={() => onApplyDifficulty(id)}
                style={{ ...styles.cardSegmentBtn, background: on ? "#E8B23D" : "transparent", color: on ? "#0B1929" : "#6B7A89", fontWeight: on ? 700 : 500 }}
              >
                {id[0].toUpperCase() + id.slice(1)}
              </button>
            );
          })}
          {difficultyLabel === "custom" && (
            <span style={{ ...styles.cardSegmentBtn, color: "#8A4B2B", fontWeight: 700 }}>Custom</span>
          )}
        </div>
        <button onClick={onToggleCustomize} style={{ ...styles.linkBtn, marginLeft: 4, color: "#8A4B2B" }}>
          ⚙️ {showCustomize ? "Hide range settings" : "Set your own ranges"}
        </button>
      </div>

      {showCustomize && (
        <div style={styles.cardCustomizePanel}>
          {RANGE_FIELDS.filter((f) => active[f.cat]).map((f) => (
            <RangeRow
              key={`${f.cat}-${f.field}`}
              label={f.label}
              value={ranges[f.cat][f.field]}
              onChange={(idx, v) => onUpdateRangePair(f.cat, f.field, idx, v)}
              limits={ABSOLUTE_LIMITS[f.limitsKey]}
              light
            />
          ))}
          {active.fractions && (
            <div style={styles.cardRangeRow}>
              <span style={styles.cardLabel}>Fraction ↔ % — max denominator</span>
              <input
                type="number"
                value={ranges.fractions.maxDen}
                onChange={(e) => onUpdateSingleValue("fractions", "maxDen", e.target.value)}
                min={ABSOLUTE_LIMITS.fractionsMaxDen[0]}
                max={ABSOLUTE_LIMITS.fractionsMaxDen[1]}
                style={styles.cardRangeInput}
              />
            </div>
          )}
          <div style={styles.cardHint}>Bigger numbers and wider ranges = harder mental math. Changing any value switches Difficulty to "Custom".</div>
        </div>
      )}
    </div>
  );
}
