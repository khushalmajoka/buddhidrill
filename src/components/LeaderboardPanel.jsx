import { useEffect, useState } from "react";
import { styles } from "../styles";
import { loadLeaderboard, currentWeekId, submitLeaderboardScore } from "../lib/leaderboard";
import { getFirebaseDb } from "../firebase";

// Weekly score = total correct answers this week, tracked purely client-side
// (session.total correct across Practice/Game/Battle since the week
// started) and opportunistically pushed to Firebase whenever it improves.
// Read-only board — anyone can see the top 20, only the signed-in device
// can write its own row (see the rules note in lib/leaderboard.js).
export default function LeaderboardPanel({ weeklyScore, playerName }) {
  const [board, setBoard] = useState([]);
  const configured = !!getFirebaseDb();
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;
    loadLeaderboard(20).then((b) => { setBoard(b); setLoading(false); });
  }, [configured]);

  async function handleSubmit() {
    setLoading(true);
    await submitLeaderboardScore(playerName || "Player", weeklyScore);
    const b = await loadLeaderboard(20);
    setBoard(b);
    setLoading(false);
  }

  return (
    <div style={styles.gamePanel} className="bd-card">
      <div style={styles.gameSetupTitle}>🏆 Weekly Leaderboard</div>
      <div style={styles.gameHint}>Week {currentWeekId()} · total correct answers across Practice, Game, and Battle.</div>

      {!configured && (
        <div style={styles.cardHint}>Leaderboard needs Firebase configured (same setup as Battle Mode) to sync scores between devices.</div>
      )}

      {configured && (
        <>
          <div style={styles.leaderboardMeRow}>
            <span>Your score this week: <b>{weeklyScore}</b></span>
            <button style={styles.secondaryBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? "Syncing…" : "Submit / Refresh"}
            </button>
          </div>

          {board.length === 0 && !loading && (
            <div style={styles.cardHint}>No scores posted yet this week — be the first!</div>
          )}

          {board.map((row, i) => (
            <div key={row.uid} style={styles.leaderboardRow}>
              <span style={styles.leaderboardRank}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
              <span style={styles.leaderboardName}>{row.name}</span>
              <span style={styles.leaderboardScore}>{row.score}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
