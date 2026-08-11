import { styles } from "../styles";
import { CATEGORY_META } from "../constants";
import Confetti from "./Confetti";

export const BOSS_DURATION = 45;
export const BOSS_TARGET = 25;

export default function BossPanel({
  bossStatus, bossTimeLeft, bossQuestion, bossFillValue, setBossFillValue, bossTally,
  bossCleared, startBoss, submitBossAnswer, handleBossFillSubmit, bossInputRef,
}) {
  return (
    <div style={styles.gamePanel} className="bd-card">
      {bossCleared && bossStatus === "finished" && <Confetti />}

      {bossStatus === "intro" && (
        <>
          <div style={styles.bossIntroTitle}>🐉 Boss Level</div>
          <div style={styles.bossIntroHint}>
            One fixed, harder timed challenge — mixed categories, {BOSS_DURATION} seconds, no setup to fiddle with.
            Clear it and you'll unlock the Boss Slayer badge.
          </div>
          <div style={styles.bossTargetLine}>Target: {BOSS_TARGET}+ correct</div>
          <button style={styles.gameStartBtn} onClick={startBoss}>Enter the Boss Level →</button>
        </>
      )}

      {bossStatus === "playing" && bossQuestion && (
        <>
          <div style={styles.gameTopBar}>
            <span style={{ ...styles.catPill, background: CATEGORY_META[bossQuestion.category].ink }}>
              {CATEGORY_META[bossQuestion.category].label}
            </span>
            <span style={styles.gameTimer}>⏱ {bossTimeLeft}s</span>
            <span style={styles.gameScoreLive}>{bossTally.correct + bossTally.wrong} answered</span>
          </div>

          <div style={styles.gamePromptText} className="bd-prompt">{bossQuestion.prompt}</div>

          {bossQuestion.type === "mcq" ? (
            <div style={styles.optionsGrid} className="bd-options-grid">
              {bossQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => submitBossAnswer(opt)}
                  style={{ ...styles.optionBtn, background: "#FFFDF7", borderColor: "#D8CFB8", color: "#1F2937" }}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleBossFillSubmit} style={styles.fillRow} className="bd-fill-row">
              <input
                ref={bossInputRef}
                type="text"
                inputMode={bossQuestion.inputMode === "text" ? "text" : "decimal"}
                value={bossFillValue}
                onChange={(e) => setBossFillValue(e.target.value)}
                placeholder={bossQuestion.placeholder || "type your answer"}
                className="bd-fill-input"
                style={{ ...styles.fillInput, borderColor: "#B9AE94" }}
              />
              <button type="submit" style={styles.submitBtn} className="bd-submit-btn">Next →</button>
            </form>
          )}
        </>
      )}

      {bossStatus === "finished" && (
        <div style={styles.gameResults} className="bd-pop-in">
          <div style={styles.gameResultsTitle}>{bossCleared ? "🏆 Boss defeated!" : "⏹ Time's up"}</div>
          <div
            style={{
              ...styles.bossResultBanner,
              background: bossCleared ? "#E4F0E9" : "#F6E4E1",
              color: bossCleared ? "#1F6F5C" : "#C0392B",
            }}
          >
            {bossCleared
              ? `${bossTally.correct} correct — Boss Slayer badge unlocked!`
              : `${bossTally.correct} correct — needed ${BOSS_TARGET}. Try again?`}
          </div>
          <div style={styles.gameResultsSub}>{bossTally.wrong} missed · {bossTally.correct + bossTally.wrong} answered</div>

          <div style={styles.gameResultsBtns}>
            <button style={styles.gameStartBtn} onClick={startBoss}>Retry Boss Level</button>
          </div>
        </div>
      )}
    </div>
  );
}
