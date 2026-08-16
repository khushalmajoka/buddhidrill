import { useEffect, useState } from "react";
import { styles } from "../styles";
import { fetchQuestionDifficulty } from "../lib/questionStats";

const TONE_COLOR = {
  new: "#7C93A8",
  easy: "#1F6F5C",
  medium: "#B8862E",
  hard: "#C0392B",
  veryhard: "#8E2E1E",
};

// Sits where the old plain "item · N" tag used to be, top-right of the
// question card. Shows how everyone (not just you) has done on this exact
// question so far — pulled from Firebase, so it degrades to nothing if
// that's not configured or the question is brand new.
export default function QuestionDifficultyBadge({ question }) {
  const [info, setInfo] = useState(null);
  const [lastQuestion, setLastQuestion] = useState(null);

  // Reset synchronously during render when the question identity changes —
  // React's documented pattern for "adjusting state when a prop changes"
  // (state, not a ref, since this stricter lint config forbids ref reads
  // during render).
  if (question !== lastQuestion) {
    setLastQuestion(question);
    if (info !== null) setInfo(null);
  }

  useEffect(() => {
    if (!question) return undefined;
    let cancelled = false;
    fetchQuestionDifficulty(question).then((res) => { if (!cancelled) setInfo(res); });
    return () => { cancelled = true; };
  }, [question]);

  if (!question) return null;
  if (!info) return <span style={styles.itemTag}>{`item · ${question.keyLabel}`}</span>;

  const color = TONE_COLOR[info.tone] || TONE_COLOR.new;
  const detail = info.label === "New"
    ? "not enough answers yet"
    : `${info.pctCorrect}% get it right${info.avgSeconds ? ` · avg ${info.avgSeconds}s` : ""}`;

  return (
    <span style={{ ...styles.difficultyBadge, color, borderColor: color }} title={`Based on ${info.samples || 0} community answers`}>
      {info.label} <span style={styles.difficultyBadgeSub}>· {detail}</span>
    </span>
  );
}
