import { styles } from "../styles";

// Stays pinned to the top of the viewport (position: sticky) so score,
// streak, combo multiplier, and XP progress are always visible while
// answering questions — on a long mobile screen the admit-card header
// above scrolls out of view, but this bar never does.
export default function StickyHUD({ correct, total, streak, best, multiplier, level, into, need, pct }) {
  const xpLeft = Math.max(0, need - into);
  return (
    <div style={styles.stickyHud} className="bd-sticky-hud">
      <div style={styles.hudItem}>
        <span style={styles.hudLabel}>SCORE</span>
        <span style={styles.hudValue}>{correct}/{total}</span>
      </div>
      <div style={styles.hudDivider} className="bd-hud-divider" />
      <div style={styles.hudItem}>
        <span style={styles.hudLabel}>STREAK</span>
        <span style={styles.hudValue}>
          🔥 {streak}
          <span style={styles.hudSub}> (best {best})</span>
        </span>
      </div>
      <div style={styles.hudDivider} className="bd-hud-divider" />
      <div style={styles.hudItem}>
        <span style={styles.hudLabel}>MULTIPLIER</span>
        <span style={{ ...styles.hudValue, color: multiplier > 1 ? "var(--bd-accent, #E8B23D)" : styles.hudValue.color }}>
          ×{multiplier.toFixed(1)}
        </span>
      </div>
      <div style={styles.hudDivider} className="bd-hud-divider" />
      <div style={{ ...styles.hudItem, flex: "1 1 140px", minWidth: 120 }}>
        <span style={styles.hudLabel}>LVL {level} · {xpLeft} XP TO NEXT</span>
        <div style={styles.hudXpTrack}>
          <div style={{ ...styles.hudXpFill, width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
