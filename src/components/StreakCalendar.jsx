import { styles } from "../styles";
import { lastNDays } from "../stats";
import { colorForAcc } from "../lib/mathUtils";

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""]; // Sun-first row labels, sparse to avoid clutter

function currentDailyStreak(days) {
  // days is oldest -> newest; walk backward from today while each day has activity
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].total > 0) streak++;
    else break;
  }
  return streak;
}

export default function StreakCalendar({ history, weeks = 12 }) {
  const totalDays = weeks * 7;
  const days = lastNDays(history, totalDays);

  // pad the front so the grid aligns to real Sun–Sat columns, like GitHub's
  const firstDow = new Date(days[0].date + "T00:00:00").getDay();
  const padded = [...Array(firstDow).fill(null), ...days];
  const cols = [];
  for (let i = 0; i < padded.length; i += 7) cols.push(padded.slice(i, i + 7));

  const streak = currentDailyStreak(days);
  const activeDayCount = days.filter((d) => d.total > 0).length;

  return (
    <div>
      <div style={styles.streakCalHeader}>
        <span style={styles.streakCalStreakNum}>🔥 {streak}</span>
        <span style={styles.cardHint}>day streak · {activeDayCount} active day{activeDayCount === 1 ? "" : "s"} in the last {weeks} weeks</span>
      </div>
      <div style={styles.streakCalRow}>
        <div style={styles.streakCalDayLabels}>
          {DAY_LABELS.map((l, i) => <span key={i} style={styles.streakCalDayLabel}>{l}</span>)}
        </div>
        <div style={styles.streakCalScroll}>
          <div style={styles.streakCalGrid}>
            {cols.map((week, wi) => (
              <div key={wi} style={styles.streakCalCol}>
                {week.map((d, di) => {
                  if (!d) return <div key={di} style={{ ...styles.streakCalCell, background: "transparent" }} />;
                  const fill = d.total > 0 ? colorForAcc(d.acc) : "rgba(31,41,55,0.06)";
                  const label = new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
                  const title = d.total > 0 ? `${label}: ${d.correct}/${d.total} correct` : `${label}: no activity`;
                  return <div key={di} title={title} style={{ ...styles.streakCalCell, background: fill }} />;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
