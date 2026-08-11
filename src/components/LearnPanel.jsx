import { styles } from "../styles";
import { CATEGORY_META, CATEGORY_ORDER } from "../constants";
import { explainQuestion } from "../lib/explain";
import CategoryPicker from "./CategoryPicker";

export default function LearnPanel({
  active, toggleCategory, learnQuestion, learnRevealed, revealLearnAnswer, nextLearnQuestion,
}) {
  if (!learnQuestion) {
    return (
      <div style={styles.gamePanel} className="bd-card">
        <div style={styles.gameSetupTitle}>🧠 Learn Mode</div>
        <div style={styles.gameHint}>Turn on at least one category to start.</div>
        <CategoryPicker categories={CATEGORY_ORDER} meta={CATEGORY_META} active={active} onToggle={toggleCategory} light />
      </div>
    );
  }

  return (
    <div style={styles.gamePanel} className="bd-card">
      <div style={styles.gameSetupTitle}>🧠 Learn Mode</div>
      <div style={styles.gameHint}>No timer, no score — think it through, then reveal how it's worked out.</div>

      <CategoryPicker categories={CATEGORY_ORDER} meta={CATEGORY_META} active={active} onToggle={toggleCategory} light />

      <div style={styles.gameTopBar}>
        <span style={{ ...styles.catPill, background: CATEGORY_META[learnQuestion.category].ink }}>
          {CATEGORY_META[learnQuestion.category].label}
        </span>
      </div>

      <div style={styles.gamePromptText} className="bd-prompt">{learnQuestion.prompt}</div>

      {!learnRevealed ? (
        <button style={styles.gameStartBtn} onClick={revealLearnAnswer}>Show answer →</button>
      ) : (
        <>
          <div style={styles.learnExplainBox}>{explainQuestion(learnQuestion)}</div>
          <button style={styles.gameStartBtn} onClick={nextLearnQuestion}>Next question →</button>
        </>
      )}
    </div>
  );
}
