import { styles } from "../styles";
import { CATEGORY_META, CATEGORY_ORDER } from "../constants";
import CategoryPicker from "./CategoryPicker";

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

export default function MockTestPanel({
  mockCats, toggleMockCat, mockLength, setMockLength, mockStatus, setMockStatus,
  mockIdx, mockQuestion, mockFillValue, setMockFillValue, mockTally, mockReview, mockRevealed,
  startMockTest, submitMockAnswer, handleMockFillSubmit, skipMockQuestion, revealMockAnswer,
  continueAfterMockReveal, mockInputRef,
}) {
  const accuracy = mockTally.correct + mockTally.wrong > 0
    ? Math.round((mockTally.correct / (mockTally.correct + mockTally.wrong)) * 100)
    : 0;
  const avgTimeMs = mockTally.timedCount > 0 ? mockTally.totalTimeMs / mockTally.timedCount : null;

  return (
    <div style={styles.gamePanel} className="bd-card">
      {mockStatus === "setup" && (
        <>
          <div style={styles.gameSetupTitle}>📝 Mock Test</div>
          <CategoryPicker categories={CATEGORY_ORDER} meta={CATEGORY_META} active={mockCats} onToggle={toggleMockCat} light />
          <div style={styles.gameHint}>A fixed set of questions across your chosen categories, untimed per question — answers reveal in the report at the end, just like the real thing.</div>

          <div style={styles.gameDurationRow}>
            <span style={styles.cardModeLabel}>Length:</span>
            <div style={styles.cardSegmentGroup}>
              {[10, 20, 30].map((n) => (
                <button
                  key={n}
                  onClick={() => setMockLength(n)}
                  style={{
                    ...styles.cardSegmentBtn,
                    background: mockLength === n ? "#E8B23D" : "transparent",
                    color: mockLength === n ? "#0B1929" : "#6B7A89",
                    fontWeight: mockLength === n ? 700 : 500,
                  }}
                >
                  {n} Qs
                </button>
              ))}
            </div>
          </div>

          <button style={styles.gameStartBtn} onClick={startMockTest}>Start Test →</button>
        </>
      )}

      {mockStatus === "playing" && mockQuestion && (
        <>
          <div style={styles.gameTopBar}>
            <span style={{ ...styles.catPill, background: CATEGORY_META[mockQuestion.category].ink }}>
              {CATEGORY_META[mockQuestion.category].label}
            </span>
            <span style={styles.mockProgressLabel}>Question {mockIdx + 1} of {mockLength}</span>
          </div>

          <div style={styles.gamePromptText} className="bd-prompt">{mockQuestion.prompt}</div>

          {mockRevealed !== null ? (
            <div style={styles.mockRevealBox}>
              <div style={styles.mockRevealLabel}>Answer</div>
              <div style={styles.mockRevealValue}>{String(mockRevealed)}</div>
              <button style={styles.gameStartBtn} onClick={continueAfterMockReveal}>
                {mockIdx + 1 >= mockLength ? "Finish →" : "Continue →"}
              </button>
            </div>
          ) : (
            <>
              {mockQuestion.type === "mcq" ? (
                <div style={styles.optionsGrid} className="bd-options-grid">
                  {mockQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => submitMockAnswer(opt)}
                      style={{ ...styles.optionBtn, background: "#FFFDF7", borderColor: "#D8CFB8", color: "#1F2937" }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleMockFillSubmit} style={styles.fillRow} className="bd-fill-row">
                  <input
                    ref={mockInputRef}
                    type="text"
                    inputMode={mockQuestion.inputMode === "text" ? "text" : "decimal"}
                    value={mockFillValue}
                    onChange={(e) => setMockFillValue(e.target.value)}
                    placeholder={mockQuestion.placeholder || "type your answer"}
                    className="bd-fill-input"
                    style={{ ...styles.fillInput, borderColor: "#B9AE94" }}
                  />
                  <button type="submit" style={styles.submitBtn} className="bd-submit-btn">
                    {mockIdx + 1 >= mockLength ? "Finish →" : "Next →"}
                  </button>
                </form>
              )}

              <div style={styles.mockUtilityRow}>
                <button type="button" style={styles.mockUtilityBtn} onClick={skipMockQuestion}>⏭ Skip</button>
                <button type="button" style={styles.mockUtilityBtn} onClick={revealMockAnswer}>👁 Show answer</button>
              </div>
            </>
          )}
        </>
      )}

      {mockStatus === "finished" && (
        <div style={styles.gameResults} className="bd-pop-in">
          <div style={styles.gameResultsTitle}>📝 Test complete</div>
          <div style={styles.gameResultsScore}>{mockTally.correct}/{mockLength} correct</div>
          <div style={styles.gameResultsSub}>
            {accuracy}% accuracy · avg. {formatTime(avgTimeMs)} per question
            {mockTally.skipped > 0 && ` · ${mockTally.skipped} skipped`}
          </div>

          {Object.keys(mockTally.byCat).length > 0 && (
            <div style={styles.gameResultsCatBreakdown}>
              <div style={styles.progressSectionTitle}>By category</div>
              {Object.entries(mockTally.byCat).map(([cat, v]) => (
                <CatResultBar key={cat} cat={cat} v={v} />
              ))}
            </div>
          )}

          <div style={styles.progressSectionTitle}>Review</div>
          <div style={styles.mockReviewList}>
            {mockReview.map((r, i) => (
              <div key={i} style={styles.mockReviewRow}>
                <span style={styles.mockReviewIcon}>{r.skipped ? "⏭" : r.revealed ? "👁" : r.correct ? "✅" : "❌"}</span>
                <span style={styles.mockReviewPrompt}>{r.prompt}</span>
                <span style={styles.mockReviewAnswer}>
                  {r.skipped
                    ? `skipped → ${r.correctAnswer}`
                    : r.correct ? String(r.correctAnswer) : `${r.userAnswer || "—"} → ${r.correctAnswer}`}
                </span>
              </div>
            ))}
          </div>

          <div style={styles.gameResultsBtns}>
            <button style={styles.gameStartBtn} onClick={startMockTest}>Retake Test</button>
            <button style={styles.linkBtn} onClick={() => setMockStatus("setup")}>Change Settings</button>
          </div>
        </div>
      )}
    </div>
  );
}
