import { styles } from "../styles";

/* ============================================================
   CATEGORY PICKER — a responsive grid instead of a wrapping pill row,
   so adding more drill categories over time doesn't turn this into an
   unreadable wall of chips. Includes Select all / Clear so a long list
   stays fast to work with.

   Used with `light` for panels on the cream card background (Game,
   Battle), and without it (default) for Practice, which sits directly
   on the dark page background.
   ============================================================ */
export default function CategoryPicker({ categories, meta, active, onToggle, light = false }) {
  const allOn = categories.every((c) => active[c]);

  function selectAll() {
    categories.forEach((c) => { if (!active[c]) onToggle(c); });
  }
  function clearToOne() {
    // keep exactly the first category on — toggle logic always keeps at least one active
    categories.forEach((c, i) => { if (i > 0 && active[c]) onToggle(c); });
  }

  const offLabelColor = light ? "#6B7A89" : "#7C93A8";
  const offBorderColor = light ? "#D8CFB8" : "#3E566B";

  return (
    <div style={styles.pickerWrap}>
      <div style={styles.pickerHeaderRow}>
        <span style={light ? styles.cardModeLabel : styles.modeLabel}>
          Categories ({categories.filter((c) => active[c]).length}/{categories.length})
        </span>
        <div style={styles.pickerActionsRow}>
          <button
            type="button"
            style={{ ...styles.pickerActionBtn, color: "#E8B23D", opacity: allOn ? 0.4 : 1 }}
            onClick={selectAll}
            disabled={allOn}
          >
            Select all
          </button>
          <button
            type="button"
            style={{ ...styles.pickerActionBtn, color: offLabelColor }}
            onClick={clearToOne}
          >
            Clear
          </button>
        </div>
      </div>

      <div style={styles.pickerGrid}>
        {categories.map((cat) => {
          const m = meta[cat];
          const on = active[cat];
          return (
            <div
              key={cat}
              role="checkbox"
              aria-checked={on}
              tabIndex={0}
              onClick={() => onToggle(cat)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(cat); } }}
              style={{
                ...styles.pickerCard,
                borderColor: on ? m.ink : offBorderColor,
                background: on ? m.ink : "transparent",
                color: on ? "#F4EFE3" : offLabelColor,
              }}
            >
              <span style={{
                ...styles.pickerCheck,
                borderColor: on ? "#F4EFE3" : offBorderColor,
                color: "#F4EFE3",
              }}>
                {on ? "✓" : ""}
              </span>
              <span style={styles.pickerTag}>{m.short}</span>
              <span>{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
