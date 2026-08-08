import { styles } from "../styles";
import { CATEGORY_ORDER, CATEGORY_META, ABSOLUTE_LIMITS, RANGE_FIELDS } from "../constants";
import RangeRow from "./RangeRow";

// Shared settings UI — Practice and Battle each pass in their own
// active/ranges/difficulty/answerMode state + setters, identical controls either way
export default function SettingsPanel({
  active, onToggle, answerMode, onSetAnswerMode,
  difficultyLabel, onApplyDifficulty, ranges, onUpdateRangePair, onUpdateSingleValue,
  showCustomize, onToggleCustomize,
}) {
  return (
    <div>
      <div style={styles.chipsRow}>
        {CATEGORY_ORDER.map((cat) => {
          const meta = CATEGORY_META[cat];
          const on = active[cat];
          return (
            <button
              key={cat}
              onClick={() => onToggle(cat)}
              style={{
                ...styles.chip,
                borderColor: on ? meta.ink : "#3E566B",
                background: on ? meta.ink : "transparent",
                color: on ? "#F4EFE3" : "#7C93A8",
              }}
            >
              <span style={styles.chipTag}>{meta.short}</span> {meta.label}
            </button>
          );
        })}
      </div>

      <div style={styles.modeRow}>
        <span style={styles.modeLabel}>Question type:</span>
        <div style={styles.segmentGroup}>
          {[{ id: "mixed", label: "Mixed" }, { id: "mcq", label: "MCQ only" }, { id: "fill", label: "Fill in the blank" }].map((opt) => {
            const on = answerMode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onSetAnswerMode(opt.id)}
                style={{ ...styles.segmentBtn, background: on ? "#E8B23D" : "transparent", color: on ? "#0B1929" : "#93A6B8", fontWeight: on ? 700 : 500 }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.modeRow}>
        <span style={styles.modeLabel}>Difficulty:</span>
        <div style={styles.segmentGroup}>
          {["easy", "medium", "hard"].map((id) => {
            const on = difficultyLabel === id;
            return (
              <button
                key={id}
                onClick={() => onApplyDifficulty(id)}
                style={{ ...styles.segmentBtn, background: on ? "#E8B23D" : "transparent", color: on ? "#0B1929" : "#93A6B8", fontWeight: on ? 700 : 500 }}
              >
                {id[0].toUpperCase() + id.slice(1)}
              </button>
            );
          })}
          {difficultyLabel === "custom" && (
            <span style={{ ...styles.segmentBtn, color: "#E8B23D", fontWeight: 700 }}>Custom</span>
          )}
        </div>
        <button onClick={onToggleCustomize} style={{ ...styles.linkBtn, marginLeft: 4 }}>
          ⚙️ {showCustomize ? "Hide range settings" : "Set your own ranges"}
        </button>
      </div>

      {showCustomize && (
        <div style={styles.customizePanel}>
          {RANGE_FIELDS.filter((f) => active[f.cat]).map((f) => (
            <RangeRow
              key={`${f.cat}-${f.field}`}
              label={f.label}
              value={ranges[f.cat][f.field]}
              onChange={(idx, v) => onUpdateRangePair(f.cat, f.field, idx, v)}
              limits={ABSOLUTE_LIMITS[f.limitsKey]}
            />
          ))}
          {active.fractions && (
            <div style={styles.rangeRow}>
              <span style={styles.rangeLabel}>Fraction ↔ % — max denominator</span>
              <input
                type="number"
                value={ranges.fractions.maxDen}
                onChange={(e) => onUpdateSingleValue("fractions", "maxDen", e.target.value)}
                min={ABSOLUTE_LIMITS.fractionsMaxDen[0]}
                max={ABSOLUTE_LIMITS.fractionsMaxDen[1]}
                style={styles.rangeInput}
              />
            </div>
          )}
          <div style={styles.customizeHint}>Bigger numbers and wider ranges = harder mental math. Changing any value switches Difficulty to "Custom".</div>
        </div>
      )}
    </div>
  );
}
