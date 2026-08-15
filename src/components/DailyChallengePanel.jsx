import { useEffect, useMemo, useRef, useState } from "react";
import { styles } from "../styles";
import { CATEGORY_META, DIFFICULTY_PRESETS } from "../constants";
import { generateBattleQuestions } from "../battle/battleEngine";
import {
  DAILY_CHALLENGE_LENGTH, DAILY_CHALLENGE_CATEGORIES, todaysChallengeSeed, todaysDateKey,
  makeAsyncChallengeSeed, challengeShareUrl,
} from "../lib/dailyChallenge";
import { submitDailyChallengeScore, loadDailyChallengeBoard } from "../lib/leaderboard";

// A single self-contained mode: covers BOTH the daily challenge (seed
// derived from today's date, shared by everyone) and async friend
// challenges (a random seed baked into a shareable link). Deliberately
// kept independent of the main Practice/Game state machine — it only
// needs a seed, a player name, and somewhere to report the final score.
export default function DailyChallengePanel({ playerName, onAwardXp, incomingChallenge, onClearIncoming }) {
  const [stage, setStage] = useState("menu"); // menu | playing | results
  const [activeChallenge, setActiveChallenge] = useState(null); // { seed, label, isAsync, fromName, fromScore }
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [fillValue, setFillValue] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [answers, setAnswers] = useState([]); // [{correct}]
  const [board, setBoard] = useState([]);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const submittedRef = useRef(false);

  const questions = useMemo(() => {
    if (!activeChallenge) return [];
    return generateBattleQuestions(
      activeChallenge.seed, DAILY_CHALLENGE_CATEGORIES, DIFFICULTY_PRESETS.medium, "mixed",
    ).slice(0, DAILY_CHALLENGE_LENGTH);
  }, [activeChallenge]);

  useEffect(() => {
    loadDailyChallengeBoard(todaysDateKey(), 10).then(setBoard);
  }, []);

  useEffect(() => {
    if (incomingChallenge && stage === "menu") {
      startChallenge({ ...incomingChallenge, label: incomingChallenge.fromName ? `${incomingChallenge.fromName}'s challenge` : "Friend's challenge", isAsync: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingChallenge]);

  function startChallenge(challenge) {
    submittedRef.current = false;
    setActiveChallenge(challenge);
    setIdx(0);
    setSelected(null);
    setFillValue("");
    setFeedback(null);
    setAnswers([]);
    setStage("playing");
  }

  function startDaily() {
    startChallenge({ seed: todaysChallengeSeed(), label: "Today's Challenge", isAsync: false });
  }

  function startNewFriendChallenge() {
    const seed = makeAsyncChallengeSeed();
    startChallenge({ seed, label: "Friend Challenge", isAsync: true });
  }

  const q = questions[idx];

  function submit(userAnswer) {
    if (!q || feedback) return;
    let correct;
    if (q.type === "mcq") {
      correct = String(userAnswer) === String(q.answer);
    } else {
      const num = Number(String(userAnswer).trim());
      correct = q.answerIsText
        ? String(userAnswer).trim().toLowerCase() === String(q.answer).toLowerCase()
        : !Number.isNaN(num) && num === q.answer;
    }
    setSelected(userAnswer);
    setFeedback(correct ? "correct" : "wrong");
    setAnswers((a) => [...a, { correct }]);
    if (onAwardXp) onAwardXp(correct);
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        finish([...answers, { correct }]);
      } else {
        setIdx((i) => i + 1);
        setSelected(null);
        setFillValue("");
        setFeedback(null);
      }
    }, 550);
  }

  function finish(finalAnswers) {
    const score = finalAnswers.filter((a) => a.correct).length;
    setStage("results");
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (!activeChallenge.isAsync) {
      submitDailyChallengeScore(todaysDateKey(), playerName || "Player", score).then(() => {
        loadDailyChallengeBoard(todaysDateKey(), 10).then(setBoard);
      });
    }
    if (activeChallenge.isAsync) {
      setShareUrl(challengeShareUrl(activeChallenge.seed, playerName || "Player", score));
    }
  }

  function handleFillSubmit(e) {
    e.preventDefault();
    if (fillValue.trim() === "") return;
    submit(fillValue.trim());
  }

  function backToMenu() {
    setStage("menu");
    setActiveChallenge(null);
    if (onClearIncoming) onClearIncoming();
  }

  const score = answers.filter((a) => a.correct).length;

  return (
    <div style={styles.gamePanel} className="bd-card">
      {stage === "menu" && (
        <>
          <div style={styles.gameSetupTitle}>🗓️ Daily &amp; Friend Challenges</div>
          <div style={styles.gameHint}>
            A fresh {DAILY_CHALLENGE_LENGTH}-question set, identical for every player today. Beat your
            best, then send a friend a link to try your exact set.
          </div>
          <button style={styles.gameStartBtn} onClick={startDaily}>▶️ Play Today's Challenge</button>
          <button style={{ ...styles.secondaryBtn, marginTop: 10 }} onClick={startNewFriendChallenge}>
            🔗 Start a Friend Challenge
          </button>

          {board.length > 0 && (
            <div style={styles.gameResultsCatBreakdown}>
              <div style={styles.progressSectionTitle}>Today's top scores</div>
              {board.slice(0, 10).map((row, i) => (
                <div key={row.uid} style={styles.leaderboardRow}>
                  <span style={styles.leaderboardRank}>#{i + 1}</span>
                  <span style={styles.leaderboardName}>{row.name}</span>
                  <span style={styles.leaderboardScore}>{row.score}/{DAILY_CHALLENGE_LENGTH}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {stage === "playing" && q && (
        <>
          <div style={styles.gameTopBar}>
            <span style={{ ...styles.catPill, background: CATEGORY_META[q.category].ink }}>
              {CATEGORY_META[q.category].label}
            </span>
            <span style={styles.gameScoreLive}>Q{idx + 1} of {questions.length}</span>
            <span style={styles.gameScoreLive}>{score} correct</span>
          </div>

          <div style={styles.gamePromptText} className="bd-prompt">{q.prompt}</div>

          {q.type === "mcq" ? (
            <div style={styles.optionsGrid} className="bd-options-grid">
              {q.options.map((opt, i) => {
                const isSelected = selected === opt;
                const isRight = feedback && String(opt) === String(q.answer);
                let bg = "#FFFDF7", border = "#D8CFB8", color = "#1F2937";
                if (feedback && isRight) { bg = "#DFF5E6"; border = "#4CAF6D"; }
                else if (feedback && isSelected) { bg = "#FBE1DE"; border = "#E0665A"; }
                return (
                  <button key={i} onClick={() => submit(opt)} disabled={!!feedback}
                    style={{ ...styles.optionBtn, background: bg, borderColor: border, color }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleFillSubmit} style={styles.fillRow} className="bd-fill-row">
              <input
                type="text" inputMode="decimal" value={fillValue} disabled={!!feedback}
                onChange={(e) => setFillValue(e.target.value)}
                placeholder="type your answer" className="bd-fill-input"
                style={{ ...styles.fillInput, borderColor: "#B9AE94" }}
              />
              <button type="submit" style={styles.submitBtn} className="bd-submit-btn" disabled={!!feedback}>Submit</button>
            </form>
          )}
        </>
      )}

      {stage === "results" && (
        <div style={styles.gameResults} className="bd-pop-in">
          <div style={styles.gameResultsTitle}>{activeChallenge.label} — done!</div>
          <div style={styles.gameResultsScore}>{score}/{questions.length} correct</div>

          {activeChallenge.isAsync && activeChallenge.fromScore !== null && activeChallenge.fromScore !== undefined && (
            <div style={styles.gameResultsSub}>
              {score > activeChallenge.fromScore
                ? `🎉 You beat ${activeChallenge.fromName || "them"}'s score of ${activeChallenge.fromScore}!`
                : score === activeChallenge.fromScore
                  ? `Tied with ${activeChallenge.fromName || "them"} at ${activeChallenge.fromScore}.`
                  : `${activeChallenge.fromName || "They"} scored ${activeChallenge.fromScore} — so close!`}
            </div>
          )}

          {activeChallenge.isAsync && shareUrl && (
            <div style={styles.challengeShareBox}>
              <div style={styles.cardHint}>Send this link — whoever opens it gets your exact question set to beat:</div>
              <div style={styles.challengeShareRow}>
                <input readOnly value={shareUrl} style={styles.challengeShareInput} onFocus={(e) => e.target.select()} />
                <button
                  style={styles.secondaryBtn}
                  onClick={() => {
                    navigator.clipboard?.writeText(shareUrl).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    });
                  }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          <div style={styles.gameResultsBtns}>
            <button style={styles.gameStartBtn} onClick={() => startChallenge(activeChallenge)}>Try Again</button>
            <button style={styles.linkBtn} onClick={backToMenu}>Back to Menu</button>
          </div>
        </div>
      )}
    </div>
  );
}
