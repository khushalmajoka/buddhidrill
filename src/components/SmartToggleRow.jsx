import { styles } from "../styles";

// A single labeled row with an iOS-style switch — icon + title + one-line
// description on the left, the switch on the right. Used to replace the
// old flat row of on/off chip buttons for Adaptive/Spaced/Focus, which
// read as three identical pills with no room to explain what each does.
export default function SmartToggleRow({ icon, title, description, on, onToggle }) {
  return (
    <div style={styles.smartToggleRow} className="bd-smart-toggle-row">
      <div style={styles.smartToggleInfo}>
        <div style={styles.smartToggleLabel}>
          <span>{icon}</span>
          <span>{title}</span>
        </div>
        <div style={styles.smartToggleDesc}>{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={title}
        onClick={onToggle}
        style={{
          ...styles.switchTrack,
          background: on ? "#E8B23D" : "rgba(255,255,255,0.14)",
        }}
      >
        <span style={{ ...styles.switchThumb, left: on ? 20 : 2 }} />
      </button>
    </div>
  );
}
