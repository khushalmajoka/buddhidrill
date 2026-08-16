import { styles } from "../styles";

export default function ReminderSettings({ pref, permission, supported, onToggle, onTimeChange, onRequestPermission }) {
  return (
    <div style={styles.reminderCard}>
      <div style={styles.progressSectionTitle}>🔔 Daily practice reminder</div>

      {!supported ? (
        <div style={styles.cardHint}>Notifications aren't supported in this browser.</div>
      ) : (
        <>
          <div style={styles.reminderRow}>
            <button
              onClick={onToggle}
              style={{
                ...styles.reminderToggleBtn,
                borderColor: pref.enabled ? "#E8B23D" : "#D8CFB8",
                color: pref.enabled ? "#0B1929" : "#6B7A89",
                background: pref.enabled ? "#E8B23D" : "transparent",
              }}
            >
              {pref.enabled ? "Reminder ON" : "Reminder OFF"}
            </button>
            <input
              type="time"
              value={pref.time}
              onChange={(e) => onTimeChange(e.target.value)}
              style={styles.reminderTimeInput}
            />
          </div>

          {permission !== "granted" && pref.enabled && (
            <button style={{ ...styles.linkBtn, alignSelf: "flex-start" }} onClick={onRequestPermission}>
              {permission === "denied"
                ? "Notifications blocked — enable them in your browser's site settings"
                : "Allow notifications →"}
            </button>
          )}

          <div style={styles.cardHint}>
            If you haven't practiced by this time and Logiks is open in a tab, you'll get a one-time nudge. Browsers don't allow reliable notifications from fully closed tabs, so keep a tab open (even in the background) for this to fire.
          </div>
        </>
      )}
    </div>
  );
}
