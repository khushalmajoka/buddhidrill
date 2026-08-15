import { useEffect, useRef, useState } from "react";
import { styles } from "../styles";
import { CATEGORY_META, GAME_CATEGORY_ORDER } from "../constants";
import CategoryPicker from "./CategoryPicker";
import Confetti from "./Confetti";
import useCountUp from "../lib/useCountUp";
import { playNewBest } from "../lib/sound";

function formatTime(ms) {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function CatResultBar({ cat, v }) {
  const meta = CATEGORY_META[cat];
  const pct = v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0;
  return (
    <div style={styles.gameResultsCatRow}>
      <span style={styles.gameResultsCatLabel}>{meta.label}</span>
      <div style={styles.gameResultsCatTrack}>
        <div style={{ ...styles.gameResultsCatFill, width: `${pct}%`, background: meta.ink }} />
      </div>
      <span style={styles.gameResultsCatNum}>{v.correct}/{v.total}</span>
    </div>
  );
}

// Game Mode never reveals correct/wrong per question — the whole
// point is answering as fast as possible without a reaction pause. Feedback
// only ever shows up in the final results screen once time's up.
export default function GamePanel({
  gameCats, toggleGameCat, gameDuration, setGameDuration, gameStatus, gameTimeLeft,
  gameQuestion, gameFillValue, setGameFillValue, gameTally,
  gameBest, startGame, submitGameAnswer, handleGameFillSubmit, gameInputRef, setGameStatus,
  soundOn, onShare,
}) {
  const accuracy = gameTally.correct + gameTally.wrong > 0
    ? Math.round((gameTally.correct / (gameTally.correct + gameTally.wrong)) * 100)
    : 0;
  const avgTimeMs = gameTally.timedCount > 0 ? gameTally.totalTimeMs / gameTally.timedCount : null;
  const isNewBest = gameTally.correct >= gameBest && gameTally.correct > 0;

  const animatedScore = useCountUp(gameTally.correct, gameStatus === "finished", 750);

  // celebrate a new best exactly once when the results screen first appears
  const [showLocalConfetti, setShowLocalConfetti] = useState(false);
  const celebratedRef = useRef(false);
  useEffect(() => {
    if (gameStatus !== "finished") { celebratedRef.current = false; return; }
    if (isNewBest && !celebratedRef.current) {
      celebratedRef.current = true;
      setShowLocalConfetti(true);
      playNewBest(soundOn);
      const t = setTimeout(() => setShowLocalConfetti(false), 1600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, isNewBest]);

  return (
    <div style={styles.gamePanel} className="bd-card">
      {showLocalConfetti && <Confetti />}
      {gameStatus === "setup" && (
        <>
          <div style={styles.gameSetupTitle}>🎮 Pick your challenge</div>
          <CategoryPicker categories={GAME_CATEGORY_ORDER} meta={CATEGORY_META} active={gameCats} onToggle={toggleGameCat} light />
          <div style={styles.gameHint}>Pick one for a focused drill, or select a few to mix it up. Answers won't show right/wrong until time's up — just move as fast as you can.</div>

          <div style={styles.gameDurationRow}>
            <span style={styles.cardModeLabel}>Duration:</span>
            <div style={styles.cardSegmentGroup}>
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setGameDuration(d)}
                  style={{
                    ...styles.cardSegmentBtn,
                    background: gameDuration === d ? "#E8B23D" : "transparent",
                    color: gameDuration === d ? "#0B1929" : "#6B7A89",
                    fontWeight: gameDuration === d ? 700 : 500,
                  }}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {gameBest > 0 && (
            <div style={styles.gameBestLine}>🏆 Best at {gameDuration}s: <b>{gameBest}</b> correct</div>
          )}

          <button style={styles.gameStartBtn} onClick={startGame}>Start Game →</button>
        </>
      )}

      {gameStatus === "playing" && gameQuestion && (
        <>
          <div style={styles.gameTopBar}>
            <span style={{ ...styles.catPill, background: CATEGORY_META[gameQuestion.category].ink }}>
              {CATEGORY_META[gameQuestion.category].label}
            </span>
            <span style={styles.gameTimer}>⏱ {gameTimeLeft}s</span>
            <span style={styles.gameScoreLive}>{gameTally.correct + gameTally.wrong} answered</span>
          </div>

          <div style={styles.gamePromptText} className="bd-prompt">{gameQuestion.prompt}</div>

          {gameQuestion.type === "mcq" ? (
            <div style={styles.optionsGrid} className="bd-options-grid">
              {gameQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => submitGameAnswer(opt)}
                  style={{ ...styles.optionBtn, background: "#FFFDF7", borderColor: "#D8CFB8", color: "#1F2937" }}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleGameFillSubmit} style={styles.fillRow} className="bd-fill-row">
              <input
                ref={gameInputRef}
                type="text"
                inputMode={gameQuestion.inputMode === "text" ? "text" : "decimal"}
                value={gameFillValue}
                onChange={(e) => setGameFillValue(e.target.value)}
                placeholder={gameQuestion.placeholder || "type your answer"}
                className="bd-fill-input"
                style={{ ...styles.fillInput, borderColor: "#B9AE94" }}
              />
              <button type="submit" style={styles.submitBtn} className="bd-submit-btn">Next →</button>
            </form>
          )}
        </>
      )}

      {gameStatus === "finished" && (
        <div style={styles.gameResults} className="bd-pop-in">
          <div style={styles.gameResultsTitle}>⏹ Time's up!</div>
          <div style={styles.gameResultsScore}>{animatedScore} correct</div>
          <div style={styles.gameResultsSub}>{accuracy}% accuracy · {gameTally.wrong} missed · {gameTally.correct + gameTally.wrong} answered</div>
          {isNewBest && (
            <div style={styles.gameNewBest}>🏆 New best!</div>
          )}

          <div style={styles.gameResultsStatsGrid}>
            <div style={styles.gameResultsStatCard}>
              <div style={styles.gameResultsStatNum}>{gameTally.bestStreak}</div>
              <div style={styles.gameResultsStatLabel}>Best streak this run</div>
            </div>
            <div style={styles.gameResultsStatCard}>
              <div style={styles.gameResultsStatNum}>{formatTime(avgTimeMs)}</div>
              <div style={styles.gameResultsStatLabel}>Avg. answer time</div>
            </div>
            <div style={styles.gameResultsStatCard}>
              <div style={styles.gameResultsStatNum}>{formatTime(gameTally.fastestMs)}</div>
              <div style={styles.gameResultsStatLabel}>Fastest answer</div>
            </div>
          </div>

          {Object.keys(gameTally.byCat).length > 0 && (
            <div style={styles.gameResultsCatBreakdown}>
              <div style={styles.progressSectionTitle}>By category</div>
              {Object.entries(gameTally.byCat).map(([cat, v]) => (
                <CatResultBar key={cat} cat={cat} v={v} />
              ))}
            </div>
          )}

          <div style={styles.gameResultsBtns}>
            <button style={styles.gameStartBtn} onClick={startGame}>Play Again</button>
            <button style={styles.linkBtn} onClick={() => setGameStatus("setup")}>Change Settings</button>
            {onShare && (
              <button
                style={styles.secondaryBtn}
                onClick={() => onShare({
                  title: `${gameTally.correct} correct`,
                  subtitle: `Game Mode · ${accuracy}% accuracy`,
                  statLines: [
                    { label: "Correct", value: gameTally.correct },
                    { label: "Accuracy", value: `${accuracy}%` },
                    { label: "Best streak", value: gameTally.bestStreak },
                    { label: "Fastest answer", value: formatTime(gameTally.fastestMs) },
                  ],
                })}
              >
                📸 Share result
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
