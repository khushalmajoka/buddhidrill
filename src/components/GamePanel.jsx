import { styles } from "../styles";
import { CATEGORY_META, GAME_CATEGORY_ORDER } from "../constants";

export default function GamePanel({
  gameCats, toggleGameCat, gameDuration, setGameDuration, gameStatus, gameTimeLeft,
  gameQuestion, gameSelected, gameFillValue, setGameFillValue, gameFeedback, gameTally,
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
          <div style={styles.gameCatRow}>
            {GAME_CATEGORY_ORDER.map((cat) => {
              const meta = CATEGORY_META[cat];
              const on = gameCats[cat];
              return (
                <button
                  key={cat}
                  onClick={() => toggleGameCat(cat)}
                  style={{
                    ...styles.gameCatChip,
                    borderColor: on ? meta.ink : "#3E566B",
                    background: on ? meta.ink : "transparent",
                    color: on ? "#F4EFE3" : "#7C93A8",
                  }}
                >
                  <span style={styles.chipTag}>{meta.short}</span> {meta.label}
                </button>
              );
            })}
          </div>
          <div style={styles.gameHint}>Pick one for a focused drill, or select two or three to mix it up.</div>

          <div style={styles.gameDurationRow}>
            <span style={styles.modeLabel}>Duration:</span>
            <div style={styles.segmentGroup}>
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setGameDuration(d)}
                  style={{
                    ...styles.segmentBtn,
                    background: gameDuration === d ? "#E8B23D" : "transparent",
                    color: gameDuration === d ? "#0B1929" : "#93A6B8",
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
            <span style={styles.gameScoreLive}>✓ {gameTally.correct} &nbsp; ✕ {gameTally.wrong}</span>
          </div>

          <div style={styles.gamePromptText} className="bd-prompt">{gameQuestion.prompt}</div>

          {gameQuestion.type === "mcq" ? (
            <div style={styles.optionsGrid} className="bd-options-grid">
              {gameQuestion.options.map((opt, i) => {
                const isSelected = gameSelected !== null && String(opt) === String(gameSelected);
                const isCorrectOpt = gameFeedback && String(opt) === String(gameQuestion.answer);
                let bg = "#FFFDF7", border = "#D8CFB8", color = "#1F2937";
                if (gameFeedback) {
                  if (isCorrectOpt) { bg = "#E4F0E9"; border = "#1F6F5C"; color = "#1F6F5C"; }
                  else if (isSelected) { bg = "#F6E4E1"; border = "#C0392B"; color = "#C0392B"; }
                }
                return (
                  <button
                    key={i}
                    disabled={!!gameFeedback}
                    onClick={() => submitGameAnswer(opt)}
                    style={{ ...styles.optionBtn, background: bg, borderColor: border, color }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleGameFillSubmit} style={styles.fillRow} className="bd-fill-row">
              <input
                ref={gameInputRef}
                type="text"
                inputMode={gameQuestion.inputMode === "text" ? "text" : "decimal"}
                value={gameFillValue}
                disabled={!!gameFeedback}
                onChange={(e) => setGameFillValue(e.target.value)}
                placeholder={gameQuestion.placeholder || "type your answer"}
                className="bd-fill-input"
                style={{
                  ...styles.fillInput,
                  borderColor: gameFeedback === "correct" ? "#1F6F5C" : gameFeedback === "wrong" ? "#C0392B" : "#B9AE94",
                }}
              />
              <button type="submit" disabled={!!gameFeedback} style={styles.submitBtn} className="bd-submit-btn">Check</button>
            </form>
          )}

          {gameFeedback && (
            <div style={{
              ...styles.feedbackBar,
              background: gameFeedback === "correct" ? "#E4F0E9" : "#F6E4E1",
              color: gameFeedback === "correct" ? "#1F6F5C" : "#C0392B",
            }}>
              {gameFeedback === "correct" ? "✓ Correct" : `✕ answer: ${gameQuestion.answer}`}
            </div>
          )}
        </>
      )}

      {gameStatus === "finished" && (
        <div style={styles.gameResults}>
          <div style={styles.gameResultsTitle}>⏹ Time's up!</div>
          <div style={styles.gameResultsScore}>{gameTally.correct} correct</div>
          <div style={styles.gameResultsSub}>{accuracy}% accuracy · {gameTally.wrong} missed</div>
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
