import { styles } from "../styles";

export default function XPBar({ level, into, need, pct }) {
  return (
    <div style={styles.xpBarWrap}>
      <div style={styles.xpBarTopRow}>
        <span style={styles.xpBarLevel}>LVL {level}</span>
        <span style={styles.xpBarNums}>{into}/{need} XP</span>
      </div>
      <div style={styles.xpBarTrack}>
        <div style={{ ...styles.xpBarFill, width: `${pct}%` }} />
      </div>
    </div>
  );
}
