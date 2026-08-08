import { styles } from "../styles";
import { CATEGORY_META, GAME_CATEGORY_ORDER } from "../constants";
import CategoryPicker from "./CategoryPicker";

// Game Mode deliberately never reveals correct/wrong per question — the whole
// point is answering as fast as possible without a reaction pause. Feedback
// only ever shows up in the final results screen once time's up.
export default function GamePanel({
  gameCats, toggleGameCat, gameDuration, setGameDuration, gameStatus, gameTimeLeft,
  gameQuestion, gameFillValue, setGameFillValue, gameTally,
  gameBest, startGame, submitGameAnswer, handleGameFillSubmit, gameInputRef, setGameStatus,
}) {
  const accuracy = gameTally.correct + gameTally.wrong > 0
    ? Math.round((gameTally.correct / (gameTally.correct + gameTally.wrong)) * 100)
    : 0;

  return (
    <div style={styles.gamePanel} className="bd-card">
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
        <div style={styles.gameResults}>
          <div style={styles.gameResultsTitle}>⏹ Time's up!</div>
          <div style={styles.gameResultsScore}>{gameTally.correct} correct</div>
          <div style={styles.gameResultsSub}>{accuracy}% accuracy · {gameTally.wrong} missed · {gameTally.correct + gameTally.wrong} answered</div>
          {gameTally.correct >= gameBest && gameTally.correct > 0 && (
            <div style={styles.gameNewBest}>🏆 New best!</div>
          )}
          <div style={styles.gameResultsBreakdown}>
            {Object.entries(gameTally.byCat).map(([cat, v]) => (
              <div key={cat} style={styles.gameResultsRow}>
                <span>{CATEGORY_META[cat].label}</span>
                <span>{v.correct}/{v.total}</span>
              </div>
            ))}
          </div>
          <div style={styles.gameResultsBtns}>
            <button style={styles.gameStartBtn} onClick={startGame}>Play Again</button>
            <button style={styles.linkBtn} onClick={() => setGameStatus("setup")}>Change Settings</button>
          </div>
        </div>
      )}
    </div>
  );
}
