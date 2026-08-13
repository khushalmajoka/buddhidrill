import { styles } from "../styles";
import { CATEGORY_META } from "../constants";

export default function PracticePlanCard({ plan, onStart, hasAnyData }) {
  if (!plan || plan.categories.length === 0) return null;

  return (
    <div style={styles.practicePlanCard}>
      <div style={styles.practicePlanTitle}>🧭 Today's Practice Plan</div>
      <div style={styles.practicePlanDesc}>
        {hasAnyData
          ? `Based on your recent accuracy and what's due for review, here's a focused ~${plan.estimatedQuestions}-question set:`
          : `No history yet, so here's a well-rounded starting set (~${plan.estimatedQuestions} questions):`}
      </div>
      <div style={styles.practicePlanTags}>
        {plan.details.map((d) => (
          <span
            key={d.cat}
            style={{ ...styles.practicePlanTag, background: CATEGORY_META[d.cat].ink }}
            title={d.acc === null ? "No attempts yet" : `${Math.round(d.acc * 100)}% accuracy${d.due ? ` · ${d.due} due for review` : ""}`}
          >
            {CATEGORY_META[d.cat].label}
          </span>
        ))}
      </div>
      <button style={styles.practicePlanBtn} onClick={onStart}>
        Start today's plan →
      </button>
    </div>
  );
}
