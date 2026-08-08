import { styles } from "../styles";
import { accuracyOf } from "../stats";
import { colorForAcc } from "../lib/mathUtils";

export default function Heatmap({ category, title, items, stats }) {
  return (
    <div style={styles.heatBlock}>
      <div style={styles.heatBlockTitle}>{title}</div>
      <div style={styles.heatGrid}>
        {items.map((key) => {
          const entry = stats[category] ? stats[category][key] : null;
          const acc = accuracyOf(entry);
          const fill = colorForAcc(acc);
          const label = String(key);
          return (
            <div key={key} style={styles.bubbleWrap} title={
              entry ? `${label}: ${entry.correct}/${entry.total} correct` : `${label}: not attempted`
            }>
              <div style={{ ...styles.bubble, background: fill }} />
              <div style={styles.bubbleLabel}>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
