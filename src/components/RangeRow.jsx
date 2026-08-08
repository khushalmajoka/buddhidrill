import { styles } from "../styles";

export default function RangeRow({ label, value, onChange, limits, light = false }) {
  const rowStyle = light ? styles.cardRangeRow : styles.rangeRow;
  const labelStyle = light ? styles.cardLabel : styles.rangeLabel;
  const inputStyle = light ? styles.cardRangeInput : styles.rangeInput;
  const dashStyle = light ? styles.cardRangeDash : styles.rangeDash;

  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <div style={styles.rangeInputs}>
        <input
          type="number"
          value={value[0]}
          min={limits[0]}
          max={limits[1]}
          onChange={(e) => onChange(0, e.target.value)}
          style={inputStyle}
        />
        <span style={dashStyle}>–</span>
        <input
          type="number"
          value={value[1]}
          min={limits[0]}
          max={limits[1]}
          onChange={(e) => onChange(1, e.target.value)}
          style={inputStyle}
        />
      </div>
    </div>
  );
}
