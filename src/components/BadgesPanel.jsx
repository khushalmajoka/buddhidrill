import { styles } from "../styles";
import { BADGE_DEFS } from "../lib/badges";
import { THEMES, isThemeUnlocked, unlockRequirementLabel } from "../lib/themes";

function BadgeCard({ badge, unlocked }) {
  return (
    <div style={{ ...styles.badgeCard, opacity: unlocked ? 1 : 0.45 }} title={badge.desc}>
      <div style={styles.badgeCardIcon}>{unlocked ? badge.icon : "🔒"}</div>
      <div style={styles.badgeCardLabel}>{badge.label}</div>
      <div style={styles.badgeCardDesc}>{badge.desc}</div>
    </div>
  );
}

function ThemeSwatch({ theme, unlocked, selected, onSelect }) {
  return (
    <button
      onClick={() => unlocked && onSelect(theme.id)}
      style={{
        ...styles.themeSwatch,
        background: theme.bg,
        borderColor: selected ? theme.accent : "#E3D9BE",
        cursor: unlocked ? "pointer" : "default",
      }}
      title={unlocked ? theme.label : `${theme.label} — ${unlockRequirementLabel(theme)}`}
      type="button"
    >
      <span style={{ ...styles.themeSwatchDot, background: theme.accent }} />
      <span style={styles.themeSwatchLabel}>{unlocked ? theme.icon : "🔒"} {theme.label}</span>
      {!unlocked && <span style={styles.themeSwatchLock}>{unlockRequirementLabel(theme)}</span>}
      {selected && <span style={styles.themeSwatchSelected}>Active</span>}
    </button>
  );
}

export default function BadgesPanel({ unlockedBadges, level, themeId, setTheme }) {
  const unlockedSet = new Set(unlockedBadges);
  const earnedCount = BADGE_DEFS.filter((b) => unlockedSet.has(b.id)).length;

  return (
    <>
      <div style={styles.progressSectionTitle}>Badges — {earnedCount}/{BADGE_DEFS.length} earned</div>
      <div style={styles.badgeGrid}>
        {BADGE_DEFS.map((b) => (
          <BadgeCard key={b.id} badge={b} unlocked={unlockedSet.has(b.id)} />
        ))}
      </div>

      <div style={styles.progressSectionTitle}>Themes</div>
      <div style={styles.themeGrid}>
        {THEMES.map((t) => (
          <ThemeSwatch
            key={t.id}
            theme={t}
            unlocked={isThemeUnlocked(t, { level, unlockedBadges })}
            selected={themeId === t.id}
            onSelect={setTheme}
          />
        ))}
      </div>
    </>
  );
}
