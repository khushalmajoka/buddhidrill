import { styles } from "../styles";
import { CATEGORY_ORDER, CATEGORY_META } from "../constants";
import { allTimeSummary, categoryAccuracy, lastNDays } from "../stats";
import StreakCalendar from "./StreakCalendar";
import BadgesPanel from "./BadgesPanel";

function formatTime(ms) {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// tiny hand-rolled SVG line+bar combo — no charting library needed for
// something this simple, and it matches the app's own visual language
function LearningCurveChart({ days }) {
  const width = 640;
  const height = 160;
  const padL = 34, padR = 10, padT = 12, padB = 26;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const attempted = days.filter((d) => d.total > 0);
  if (attempted.length === 0) {
    return <div style={styles.learningCurveEmpty}>No activity yet — answer a few questions and your trend will show up here.</div>;
  }

  const n = days.length;
  const stepX = n > 1 ? plotW / (n - 1) : 0;
  const points = days.map((d, i) => {
    const x = padL + i * stepX;
    const y = d.acc === null ? null : padT + (1 - d.acc) * plotH;
    return { ...d, x, y };
  });

  const linePoints = points.filter((p) => p.y !== null);
  const pathD = linePoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const maxTotal = Math.max(1, ...days.map((d) => d.total));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {/* gridlines at 0/50/100% accuracy */}
      {[0, 0.5, 1].map((v) => {
        const y = padT + (1 - v) * plotH;
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="rgba(31,41,55,0.08)" strokeWidth="1" />
            <text x={padL - 8} y={y + 4} fontSize="10" fill="#8A7F63" textAnchor="end" fontFamily="'JetBrains Mono', monospace">
              {Math.round(v * 100)}%
            </text>
          </g>
        );
      })}

      {/* faint activity bars (volume of questions that day) */}
      {points.map((p, i) => {
        const barH = (p.total / maxTotal) * plotH * 0.9;
        return (
          <rect
            key={`bar-${i}`}
            x={p.x - Math.min(10, stepX * 0.3)}
            y={padT + plotH - barH}
            width={Math.min(20, stepX * 0.6)}
            height={barH}
            fill="rgba(31,111,92,0.12)"
            rx="2"
          />
        );
      })}

      {/* accuracy line */}
      {linePoints.length > 1 && <path d={pathD} fill="none" stroke="#1F6F5C" strokeWidth="2.5" />}
      {linePoints.map((p, i) => (
        <circle key={`pt-${i}`} cx={p.x} cy={p.y} r="3" fill="#1F6F5C" />
      ))}

      {/* x-axis labels: first, middle, last day */}
      {[0, Math.floor((n - 1) / 2), n - 1].map((i) => {
        const p = points[i];
        const label = new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        return (
          <text key={i} x={p.x} y={height - 6} fontSize="10" fill="#8A7F63" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function CategoryBar({ cat, entry }) {
  const meta = CATEGORY_META[cat];
  const pct = entry.acc === null ? null : Math.round(entry.acc * 100);
  return (
    <div style={styles.catBarRow}>
      <span style={styles.catBarLabel}>{meta.label}</span>
      <div style={styles.catBarTrack}>
        {pct !== null && (
          <div style={{ ...styles.catBarFill, width: `${pct}%`, background: meta.ink }} />
        )}
      </div>
      <span style={styles.catBarPct}>{pct === null ? "—" : `${pct}%`}</span>
    </div>
  );
}

export default function ProgressPanel({
  stats, history, session, bestStreakEver, xpProgress, unlockedBadges, themeId, setTheme,
}) {
  const summary = allTimeSummary(stats);
  const days = lastNDays(history, 14);

  const categoriesWithData = CATEGORY_ORDER
    .map((cat) => ({ cat, entry: categoryAccuracy(stats, cat) }))
    .filter((c) => c.entry.total > 0);

  return (
    <div style={styles.progressPanel} className="bd-card">
      <div style={styles.gameSetupTitle}>📊 Your progress</div>

      <div style={styles.statCardsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statCardNum}>{summary.total}</div>
          <div style={styles.statCardLabel}>Questions answered</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statCardNum}>{summary.acc === null ? "—" : `${Math.round(summary.acc * 100)}%`}</div>
          <div style={styles.statCardLabel}>Overall accuracy</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statCardNum}>{session.streak}</div>
          <div style={styles.statCardLabel}>Current streak</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statCardNum}>{bestStreakEver}</div>
          <div style={styles.statCardLabel}>Best streak ever</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statCardNum}>{formatTime(summary.avgTimeMs)}</div>
          <div style={styles.statCardLabel}>Avg. answer time</div>
        </div>
        {xpProgress && (
          <div style={styles.statCard}>
            <div style={styles.statCardNum}>Lv {xpProgress.level}</div>
            <div style={styles.statCardLabel}>{xpProgress.xp} XP total</div>
          </div>
        )}
      </div>

      <div style={styles.progressSectionTitle}>Practice streak</div>
      <StreakCalendar history={history} />

      <div style={styles.progressSectionTitle}>Learning curve — last 14 days</div>
      <LearningCurveChart days={days} />
      <div style={styles.cardHint}>Line = daily accuracy · bars = how many questions you answered that day.</div>

      <div style={styles.progressSectionTitle}>Accuracy by category</div>
      {categoriesWithData.length === 0 ? (
        <div style={styles.learningCurveEmpty}>Answer a few questions in any category and your breakdown shows up here.</div>
      ) : (
        categoriesWithData.map(({ cat, entry }) => <CategoryBar key={cat} cat={cat} entry={entry} />)
      )}

      {xpProgress && (
        <BadgesPanel
          unlockedBadges={unlockedBadges}
          level={xpProgress.level}
          themeId={themeId}
          setTheme={setTheme}
        />
      )}
    </div>
  );
}
