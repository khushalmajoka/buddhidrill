import { styles } from "../styles";

export default function RangeRow({ label, value, onChange, limits }) {
  return (
    <div style={styles.rangeRow}>
      <span style={styles.rangeLabel}>{label}</span>
      <div style={styles.rangeInputs}>
        <input
          type="number"
          value={value[0]}
          min={limits[0]}
          max={limits[1]}
          onChange={(e) => onChange(0, e.target.value)}
          style={styles.rangeInput}
        />
        <span style={styles.rangeDash}>–</span>
        <input
          type="number"
          value={value[1]}
          min={limits[0]}
          max={limits[1]}
          onChange={(e) => onChange(1, e.target.value)}
          style={styles.rangeInput}
        />
      </div>
    </div>
  );
}
