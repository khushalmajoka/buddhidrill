import { styles } from "../styles";

export default function BadgeUnlockToast({ badge }) {
  if (!badge) return null;
  return (
    <div style={styles.badgeToast} className="bd-pop-in">
      <span style={styles.badgeToastIcon}>{badge.icon}</span>
      <div>
        <div style={styles.badgeToastTitle}>Badge unlocked!</div>
        <div style={styles.badgeToastLabel}>{badge.label}</div>
      </div>
    </div>
  );
}
