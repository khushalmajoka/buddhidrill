import { useState, useEffect, useCallback, useRef } from "react";
import {
  ref, set, get, update, remove, onValue, onDisconnect,
} from "firebase/database";

import { getFirebaseDb, newRoomCode, newPlayerId } from "./firebase";
import {
  FRACTIONS, QUICK_PCT, CATEGORY_META, CATEGORY_ORDER,
  ABSOLUTE_LIMITS, DIFFICULTY_PRESETS, GAME_CATEGORY_ORDER,
} from "./constants";
import { pctLabel, pick, bucketItemsForRange, range, colorForAcc } from "./lib/mathUtils";
import {
  makeToggleCategory, makeApplyDifficulty, makeUpdateRangePair, makeUpdateSingleValue,
} from "./lib/settingsHandlers";
import { GENERATORS, letterAt } from "./questions/generators";
import { generateBattleQuestions } from "./battle/battleEngine";
import {
  emptyStats, recordAnswer, weightForItem, loadHistory, recordDailyHistory,
} from "./stats";
import { FONT_IMPORT, GLOBAL_CSS, styles } from "./styles";
import { loadSoundPref, saveSoundPref, playCorrect, playWrong, playTap, playNewBest } from "./lib/sound";
import GamePanel from "./components/GamePanel";
import BattlePanel from "./components/BattlePanel";
import RangeRow from "./components/RangeRow";
import Heatmap from "./components/Heatmap";
import CategoryPicker from "./components/CategoryPicker";
import ProgressPanel from "./components/ProgressPanel";
import Confetti from "./components/Confetti";

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function BuddhiDrill() {
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState(emptyStats());
  const [active, setActive] = useState({
    multiplication: true, addition: true, subtraction: true, division: true,
    squares: true, cubes: true, fractions: true, quickpct: true,
    alphaValue: true, alphaOpposite: true, bodmas: true,
  });
  const [soundOn, setSoundOn] = useState(() => loadSoundPref());
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimeoutRef = useRef(null);
  const bestStreakMountedRef = useRef(false);

  function fireConfetti(ms = 1600) {
    setShowConfetti(true);
    if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
    confettiTimeoutRef.current = setTimeout(() => setShowConfetti(false), ms);
  }
  function toggleSound() {
    setSoundOn((s) => { saveSoundPref(!s); return !s; });
  }
  const [answerMode, setAnswerMode] = useState("mixed"); // 'mixed' | 'mcq' | 'fill'
  const [ranges, setRanges] = useState(DIFFICULTY_PRESETS.medium);
  const [difficultyLabel, setDifficultyLabel] = useState("medium"); // 'easy' | 'medium' | 'hard' | 'custom'
  const [showCustomize, setShowCustomize] = useState(false);
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [fillValue, setFillValue] = useState("");
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [session, setSession] = useState({ correct: 0, total: 0, streak: 0, best: 0 });
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [weakMode, setWeakMode] = useState(false);
  // day-by-day correct/total log (separate from per-item `stats`) — powers
  // the learning-curve chart on the Progress tab. Shared across Practice,
  // Game, and Battle, since they all feed the same daily total.
  const [history, setHistory] = useState(() => loadHistory());
  const [bestStreakEver, setBestStreakEver] = useState(() => {
    try { return parseInt(window.localStorage.getItem("buddhidrill-best-streak"), 10) || 0; } catch { return 0; }
  });

  // confetti + chime whenever bestStreakEver climbs (skip the very first
  // mount, which just loads whatever was already saved)
  useEffect(() => {
    if (!bestStreakMountedRef.current) { bestStreakMountedRef.current = true; return; }
    fireConfetti();
    playNewBest(soundOn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bestStreakEver]);
  const inputRef = useRef(null);
  const autoFocusRef = useRef(false);
  const advanceTimerRef = useRef(null);
  const feedbackRef = useRef(null);
  const questionRef = useRef(null);
  const fillValueRef = useRef("");
  const questionStartRef = useRef(null);

  // ---- Game mode state ----
  const [appMode, setAppMode] = useState("practice"); // 'practice' | 'game'
  const [gameCats, setGameCats] = useState({
    multiplication: true, addition: true, subtraction: true, division: true, squares: true, cubes: true,
    alphaValue: true, alphaOpposite: true, bodmas: true,
  });
  const [gameDuration, setGameDuration] = useState(60);
  const [gameStatus, setGameStatus] = useState("setup"); // 'setup' | 'playing' | 'finished'
  const [gameTimeLeft, setGameTimeLeft] = useState(60);
  const [gameQuestion, setGameQuestion] = useState(null);
  const [gameFillValue, setGameFillValue] = useState("");
  const [gameTally, setGameTally] = useState({
    correct: 0, wrong: 0, byCat: {}, streak: 0, bestStreak: 0, totalTimeMs: 0, timedCount: 0, fastestMs: null,
  });
  const [gameBest, setGameBest] = useState(0);
  const gameTimerRef = useRef(null);
  const gameInputRef = useRef(null);
  const gameQuestionStartRef = useRef(null);
  const gameQuestionRef = useRef(null);
  const gameFillValueRef = useRef("");
  const gameSubmitLockRef = useRef(false); // prevents double-submits since answers now advance instantly

  useEffect(() => { gameQuestionRef.current = gameQuestion; }, [gameQuestion]);
  useEffect(() => { gameFillValueRef.current = gameFillValue; }, [gameFillValue]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`buddhidrill-highscore-${gameDuration}`);
      setGameBest(raw ? parseInt(raw, 10) || 0 : 0);
    } catch { /* ignore */ }
  }, [gameDuration]);

  // ---- Battle mode state ----
  const [battleStage, setBattleStage] = useState("menu"); // menu | create | join | lobby | countdown | playing | results
  const [playerId] = useState(() => newPlayerId());
  const [playerName, setPlayerName] = useState(() => {
    try { return window.localStorage.getItem("buddhidrill-name") || ""; } catch { return ""; }
  });
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [battleDuration, setBattleDuration] = useState(60);
  const [battleError, setBattleError] = useState("");
  const [battleBusy, setBattleBusy] = useState(false);
  const [battleRoom, setBattleRoom] = useState(null);
  const [battleCode, setBattleCode] = useState("");
  const [battleQuestions, setBattleQuestions] = useState(null);
  const [battleIdx, setBattleIdx] = useState(0);
  const [battleSelected, setBattleSelected] = useState(null);
  const [battleFillValue, setBattleFillValue] = useState("");
  const [battleFeedback, setBattleFeedback] = useState(null);
  const [battleScore, setBattleScore] = useState({ correct: 0, wrong: 0 });
  const [battleTimeLeft, setBattleTimeLeft] = useState(0);

  // Battle keeps its own independent category/range/difficulty/answer-mode
  // settings — separate from Practice, so setting up a battle never
  // depends on whatever you last had active in Practice
  const [battleActive, setBattleActive] = useState({
    multiplication: true, addition: true, subtraction: true, division: true,
    squares: true, cubes: true, fractions: true, quickpct: true,
    alphaValue: true, alphaOpposite: true, bodmas: true,
  });
  const [battleRanges, setBattleRanges] = useState(DIFFICULTY_PRESETS.medium);
  const [battleDifficultyLabel, setBattleDifficultyLabel] = useState("medium");
  const [battleAnswerMode, setBattleAnswerMode] = useState("mixed");
  const [battleShowCustomize, setBattleShowCustomize] = useState(false);

  const toggleBattleCategory = makeToggleCategory(setBattleActive);
  const applyBattleDifficulty = makeApplyDifficulty(setBattleRanges, setBattleDifficultyLabel);
  const updateBattleRangePair = makeUpdateRangePair(setBattleRanges, setBattleDifficultyLabel);
  const updateBattleSingleValue = makeUpdateSingleValue(setBattleRanges, setBattleDifficultyLabel);


  const [battleCountdown, setBattleCountdown] = useState(0);

  const battleStageRef = useRef("menu");
  const battleCodeRef = useRef("");
  const battleUnsubRef = useRef(null);
  const battleTimerRef = useRef(null);
  const battleAdvanceRef = useRef(null);
  const battleCountdownTimerRef = useRef(null);
  const battleQuestionsRef = useRef(null);
  const battleIdxRef = useRef(0);
  const battleFeedbackRef = useRef(null);
  const battleFillValueRef = useRef("");
  const battleQuestionStartRef = useRef(null);
  const battleStartedSeedRef = useRef(null);
  const battleInputRef = useRef(null);

  useEffect(() => { battleStageRef.current = battleStage; }, [battleStage]);
  useEffect(() => { battleCodeRef.current = battleCode; }, [battleCode]);
  useEffect(() => { battleQuestionsRef.current = battleQuestions; }, [battleQuestions]);
  useEffect(() => { battleIdxRef.current = battleIdx; }, [battleIdx]);
  useEffect(() => { battleFeedbackRef.current = battleFeedback; }, [battleFeedback]);
  useEffect(() => { battleFillValueRef.current = battleFillValue; }, [battleFillValue]);

  // clean up any live listener/timers if the whole app unmounts
  useEffect(() => () => {
    if (battleUnsubRef.current) battleUnsubRef.current();
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    if (battleAdvanceRef.current) clearTimeout(battleAdvanceRef.current);
    if (battleCountdownTimerRef.current) clearTimeout(battleCountdownTimerRef.current);
  }, []);

  useEffect(() => { feedbackRef.current = feedback; }, [feedback]);
  useEffect(() => { questionRef.current = question; }, [question]);
  useEffect(() => { fillValueRef.current = fillValue; }, [fillValue]);

  // load persisted stats (browser localStorage — works once deployed as a standalone site)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("buddhidrill-stats");
      if (raw) setStats({ ...emptyStats(), ...JSON.parse(raw) });
    } catch {
      // no saved stats yet, or storage blocked — start fresh
    } finally {
      setLoaded(true);
    }
  }, []);

  const persist = useCallback((next) => {
    try {
      window.localStorage.setItem("buddhidrill-stats", JSON.stringify(next));
    } catch {
      // storage unavailable (e.g. private browsing) — session continues without persistence
    }
  }, []);

  const pickCategory = useCallback((statsSnapshot) => {
    const pool = CATEGORY_ORDER.filter((c) => active[c]);
    if (pool.length === 0) return null;
    if (!weakMode) return pick(pool);
    // weighted toward categories with lower overall accuracy
    const weights = pool.map((c) => {
      const entries = Object.values(statsSnapshot[c] || {});
      if (entries.length === 0) return 2;
      const totalCorrect = entries.reduce((s, e) => s + e.correct, 0);
      const totalAll = entries.reduce((s, e) => s + e.total, 0);
      const acc = totalAll ? totalCorrect / totalAll : 0.5;
      return 0.5 + (1 - acc) * 3;
    });
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }, [active, weakMode]);

  const nextQuestion = useCallback((statsSnapshot, focusAfter) => {
    const cat = pickCategory(statsSnapshot);
    if (!cat) { setQuestion(null); return; }
    const forceType = answerMode === "mixed" ? undefined : answerMode;
    let q = null;
    let guard = 0;
    // in weak mode, retry generation a few times hoping to land on a weak key
    if (weakMode) {
      let bestQ = GENERATORS[cat](forceType, ranges);
      let bestW = weightForItem(statsSnapshot, cat, bestQ.key);
      while (guard < 5) {
        guard++;
        const cand = GENERATORS[cat](forceType, ranges);
        const w = weightForItem(statsSnapshot, cat, cand.key);
        if (w > bestW) { bestW = w; bestQ = cand; }
      }
      q = bestQ;
    } else {
      q = GENERATORS[cat](forceType, ranges);
    }
    autoFocusRef.current = !!focusAfter;
    questionStartRef.current = Date.now();
    setQuestion(q);
    setSelected(null);
    setFillValue("");
    setFeedback(null);
  }, [pickCategory, weakMode, answerMode, ranges]);

  // initial question on load — no auto-focus, so the keyboard doesn't pop
  // open the moment the page finishes loading on mobile
  useEffect(() => {
    if (loaded && !question) nextQuestion(stats, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // only steal focus into the answer box when the question changed because
  // the user answered and moved on — never when a chip/setting change
  // silently regenerated the question underneath them
  useEffect(() => {
    if (question && question.type === "fill" && inputRef.current && autoFocusRef.current) {
      inputRef.current.focus();
    }
    autoFocusRef.current = false;
  }, [question]);

  function submitAnswer(userAnswer) {
    if (!question || feedback) return;
    let correct;
    if (question.type === "mcq") {
      correct = String(userAnswer) === String(question.answer);
      setSelected(userAnswer);
    } else {
      const raw = String(userAnswer).trim();
      if (question.answerIsText) {
        const norm = (s) => s.replace(/\s+/g, "").toLowerCase();
        correct = norm(raw) === norm(String(question.answer));
      } else {
        const num = Number(raw);
        if (question.tolerance !== undefined) {
          correct = !Number.isNaN(num) && Math.abs(num - parseFloat(question.answer)) <= question.tolerance;
        } else {
          correct = !Number.isNaN(num) && num === question.answer;
        }
      }
    }
    setFeedback(correct ? "correct" : "wrong");
    if (correct) playCorrect(soundOn); else playWrong(soundOn);
    const elapsedMs = questionStartRef.current ? Date.now() - questionStartRef.current : 0;
    const nextStats = recordAnswer(stats, question.category, question.key, correct, elapsedMs);
    setStats(nextStats);
    persist(nextStats);
    setHistory((h) => recordDailyHistory(h, correct));
    setSession((s) => {
      const streak = correct ? s.streak + 1 : 0;
      if (streak > bestStreakEver) {
        setBestStreakEver(streak);
        try { window.localStorage.setItem("buddhidrill-best-streak", String(streak)); } catch { /* ignore */ }
      }
      return {
        correct: s.correct + (correct ? 1 : 0),
        total: s.total + 1,
        streak,
        best: Math.max(s.best, streak),
      };
    });

    // correct answers auto-advance after a short beat; wrong answers wait for Enter
    if (correct) {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        handleNext();
      }, 700);
    }
  }

  function handleFillSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (feedbackRef.current) return; // already answered — Enter should advance, handled by keydown listener
    if (fillValueRef.current.trim() === "") return;
    submitAnswer(fillValueRef.current.trim());
  }

  function handleNext() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    nextQuestion(stats, true);
  }

  // global Enter handling: submits a typed fill-blank answer, or advances to the
  // next question once feedback (correct/wrong) is showing (practice mode only)
  useEffect(() => {
    function onKeyDown(e) {
      if (appMode !== "practice") return;
      if (e.key !== "Enter") return;
      const q = questionRef.current;
      if (!q) return;
      if (feedbackRef.current) {
        e.preventDefault();
        handleNext();
      } else if (q.type === "fill") {
        e.preventDefault();
        handleFillSubmit();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
  }, []);

  /* ============================================================
     GAME MODE — fast-paced timed challenge across chosen categories
     ============================================================ */


  function toggleGameCat(cat) {
    setGameCats((c) => {
      const next = { ...c, [cat]: !c[cat] };
      if (!Object.values(next).some(Boolean)) return c; // keep at least one on
      return next;
    });
  }

  function pickGameCategory() {
    const pool = GAME_CATEGORY_ORDER.filter((c) => gameCats[c]);
    return pool.length ? pick(pool) : "multiplication";
  }

  function nextGameQuestion() {
    const cat = pickGameCategory();
    const forceType = answerMode === "mixed" ? undefined : answerMode;
    const q = GENERATORS[cat](forceType, ranges);
    gameQuestionStartRef.current = Date.now();
    setGameQuestion(q);
    setGameFillValue("");
    gameSubmitLockRef.current = false;
  }

  function startGame() {
    setGameStatus("playing");
    setGameTimeLeft(gameDuration);
    setGameTally({ correct: 0, wrong: 0, byCat: {}, streak: 0, bestStreak: 0, totalTimeMs: 0, timedCount: 0, fastestMs: null });
    nextGameQuestion();
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    gameTimerRef.current = setInterval(() => {
      setGameTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(gameTimerRef.current);
          gameTimerRef.current = null;
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function endGame() {
    if (gameTimerRef.current) { clearInterval(gameTimerRef.current); gameTimerRef.current = null; }
    setGameStatus("finished");
    setGameTally((tally) => {
      if (tally.correct > gameBest && tally.correct > 0) {
        setGameBest(tally.correct);
        try { window.localStorage.setItem(`buddhidrill-highscore-${gameDuration}`, String(tally.correct)); } catch { /* ignore */ }
        fireConfetti();
        playNewBest(soundOn);
      }
      return tally;
    });
  }

  // Game Mode never reveals correct/wrong per question — every answer is
  // recorded and we move straight to the next one, as fast as the player can
  // go. Results only surface once time runs out (see endGame/GamePanel).
  function submitGameAnswer(userAnswer) {
    const q = gameQuestion;
    if (!q || gameStatus !== "playing" || gameSubmitLockRef.current) return;
    gameSubmitLockRef.current = true;

    let correct;
    if (q.type === "mcq") {
      correct = String(userAnswer) === String(q.answer);
    } else {
      const raw = String(userAnswer).trim();
      if (q.answerIsText) {
        const norm = (s) => s.replace(/\s+/g, "").toLowerCase();
        correct = norm(raw) === norm(String(q.answer));
      } else {
        const num = Number(raw);
        if (q.tolerance !== undefined) {
          correct = !Number.isNaN(num) && Math.abs(num - parseFloat(q.answer)) <= q.tolerance;
        } else {
          correct = !Number.isNaN(num) && num === q.answer;
        }
      }
    }

    playTap(soundOn);
    const elapsedMs = gameQuestionStartRef.current ? Date.now() - gameQuestionStartRef.current : 0;
    const nextStats = recordAnswer(stats, q.category, q.key, correct, elapsedMs);
    setStats(nextStats);
    persist(nextStats);
    setHistory((h) => recordDailyHistory(h, correct));

    setGameTally((t) => {
      const byCat = { ...t.byCat };
      const c = byCat[q.category] || { correct: 0, total: 0 };
      byCat[q.category] = { correct: c.correct + (correct ? 1 : 0), total: c.total + 1 };
      const streak = correct ? t.streak + 1 : 0;
      const clampedMs = Number.isFinite(elapsedMs) ? Math.max(0, Math.min(elapsedMs, 60000)) : 0;
      return {
        correct: t.correct + (correct ? 1 : 0),
        wrong: t.wrong + (correct ? 0 : 1),
        byCat,
        streak,
        bestStreak: Math.max(t.bestStreak, streak),
        totalTimeMs: t.totalTimeMs + clampedMs,
        timedCount: t.timedCount + 1,
        fastestMs: t.fastestMs === null ? clampedMs : Math.min(t.fastestMs, clampedMs),
      };
    });

    nextGameQuestion();
  }

  function handleGameFillSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (gameFillValueRef.current.trim() === "") return;
    submitGameAnswer(gameFillValueRef.current.trim());
  }

  useEffect(() => {
    if (gameStatus === "playing" && gameQuestion && gameQuestion.type === "fill" && gameInputRef.current) {
      gameInputRef.current.focus();
    }
  }, [gameQuestion, gameStatus]);

  useEffect(() => {
    function onGameKeyDown(e) {
      if (appMode !== "game" || gameStatus !== "playing") return;
      if (e.key !== "Enter") return;
      const q = gameQuestionRef.current;
      if (!q || q.type !== "fill") return;
      e.preventDefault();
      handleGameFillSubmit();
    }
    document.addEventListener("keydown", onGameKeyDown);
    return () => document.removeEventListener("keydown", onGameKeyDown);
  });

  useEffect(() => () => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
  }, []);

  /* ============================================================
     BATTLE MODE — Firebase-backed room, two players, same questions
     ============================================================ */

  function subscribeToRoom(code) {
    const db = getFirebaseDb();
    if (!db) return;
    if (battleUnsubRef.current) battleUnsubRef.current();
    const roomRef = ref(db, `rooms/${code}`);
    battleUnsubRef.current = onValue(roomRef, (snap) => {
      const val = snap.exists() ? snap.val() : null;
      setBattleRoom(val);
      if (!val) return; // room was removed (host left / expired)

      // only ever start a round once per seed — otherwise every later
      // write to the room (opponent's score ticking up, etc.) would
      // re-trigger this and reset an already-finished player's score
      if (val.status === "playing" && val.seed != null && val.seed !== battleStartedSeedRef.current) {
        battleStartedSeedRef.current = val.seed;
        beginBattleCountdown(val);
      }
      if (val.status === "waiting") {
        battleStartedSeedRef.current = null;
        if (battleStageRef.current === "results" || battleStageRef.current === "countdown") {
          // host started a rematch — jump everyone back to the lobby
          setBattleStage("lobby");
        }
      }

      // once both players have finished, mark the room so late listeners
      // don't try to (re)start anything and the lobby knows a round happened
      if (val.status === "playing" && val.players) {
        const ids = Object.keys(val.players);
        const bothDone = ids.length === 2 && ids.every((id) => val.players[id].finishedAt);
        if (bothDone && val.hostId === playerId) {
          update(ref(db, `rooms/${code}`), { status: "finished" }).catch(() => {});
        }
      }
    });
  }

  async function handleCreateRoom() {
    const db = getFirebaseDb();
    if (!db) { setBattleError("Battle Mode isn't configured yet — see the Firebase setup notes."); return; }
    const name = playerName.trim() || "Player 1";
    try { window.localStorage.setItem("buddhidrill-name", name); } catch { /* ignore */ }
    setBattleError("");
    setBattleBusy(true);
    try {
      let code = newRoomCode();
      for (let tries = 0; tries < 5; tries++) {
        const snap = await get(ref(db, `rooms/${code}`));
        if (!snap.exists()) break;
        code = newRoomCode();
      }
      const activeCats = CATEGORY_ORDER.filter((c) => battleActive[c]);
      const roomData = {
        code,
        createdAt: Date.now(),
        status: "waiting",
        hostId: playerId,
        duration: battleDuration,
        settings: { categories: activeCats, ranges: battleRanges, answerMode: battleAnswerMode, difficultyLabel: battleDifficultyLabel },
        seed: null,
        startAt: null,
        players: {
          [playerId]: { name, isHost: true, score: { correct: 0, wrong: 0 }, finishedAt: null, joinedAt: Date.now() },
        },
      };
      await set(ref(db, `rooms/${code}`), roomData);
      onDisconnect(ref(db, `rooms/${code}/players/${playerId}`)).remove();
      setBattleCode(code);
      subscribeToRoom(code);
      setBattleStage("lobby");
    } catch (e) {
      setBattleError("Couldn't create the room. Check your connection and try again.");
    } finally {
      setBattleBusy(false);
    }
  }

  async function handleJoinRoom() {
    const db = getFirebaseDb();
    if (!db) { setBattleError("Battle Mode isn't configured yet — see the Firebase setup notes."); return; }
    const code = joinCodeInput.trim().toUpperCase();
    if (code.length < 4) { setBattleError("Enter the room code your friend shared with you."); return; }
    const name = playerName.trim() || "Player 2";
    try { window.localStorage.setItem("buddhidrill-name", name); } catch { /* ignore */ }
    setBattleError("");
    setBattleBusy(true);
    try {
      const snap = await get(ref(db, `rooms/${code}`));
      if (!snap.exists()) { setBattleError("No room found with that code."); setBattleBusy(false); return; }
      const room = snap.val();
      if (room.status !== "waiting") { setBattleError("That room already started — ask for a new code."); setBattleBusy(false); return; }
      const existingCount = room.players ? Object.keys(room.players).length : 0;
      if (existingCount >= 2) { setBattleError("That room is already full."); setBattleBusy(false); return; }

      await update(ref(db, `rooms/${code}/players/${playerId}`), {
        name, isHost: false, score: { correct: 0, wrong: 0 }, finishedAt: null, joinedAt: Date.now(),
      });
      onDisconnect(ref(db, `rooms/${code}/players/${playerId}`)).remove();
      setBattleCode(code);
      subscribeToRoom(code);
      setBattleStage("lobby");
    } catch (e) {
      setBattleError("Couldn't join that room. Check your connection and try again.");
    } finally {
      setBattleBusy(false);
    }
  }

  function beginBattleCountdown(room) {
    const qs = generateBattleQuestions(room.seed, room.settings.categories, room.settings.ranges, room.settings.answerMode);
    setBattleQuestions(qs);
    setBattleIdx(0);
    setBattleScore({ correct: 0, wrong: 0 });
    setBattleSelected(null);
    setBattleFillValue("");
    setBattleFeedback(null);
    setBattleStage("countdown");

    const tick = () => {
      const msLeft = room.startAt - Date.now();
      if (msLeft <= 0) {
        setBattleStage("playing");
        startBattleTimer(room.duration, room.startAt);
        battleQuestionStartRef.current = Date.now();
        return;
      }
      setBattleCountdown(Math.ceil(msLeft / 1000));
      battleCountdownTimerRef.current = setTimeout(tick, 150);
    };
    tick();
  }

  function startBattleTimer(duration, startAt) {
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    const endAt = startAt + duration * 1000;
    const update_ = () => setBattleTimeLeft(Math.max(0, Math.round((endAt - Date.now()) / 1000)));
    update_();
    battleTimerRef.current = setInterval(() => {
      update_();
      if (Date.now() >= endAt) {
        clearInterval(battleTimerRef.current);
        battleTimerRef.current = null;
        finishBattleForMe();
      }
    }, 250);
  }

  function finishBattleForMe() {
    if (battleAdvanceRef.current) { clearTimeout(battleAdvanceRef.current); battleAdvanceRef.current = null; }
    const db = getFirebaseDb();
    if (db && battleCodeRef.current) {
      update(ref(db, `rooms/${battleCodeRef.current}/players/${playerId}`), { finishedAt: Date.now() }).catch(() => {});
    }
    setBattleStage("results");
  }

  function submitBattleAnswer(userAnswer) {
    if (battleStageRef.current !== "playing" || battleFeedbackRef.current) return;
    const qs = battleQuestionsRef.current;
    const idx = battleIdxRef.current;
    const q = qs && qs[idx % qs.length];
    if (!q) return;

    let correct;
    if (q.type === "mcq") {
      correct = String(userAnswer) === String(q.answer);
      setBattleSelected(userAnswer);
    } else {
      const raw = String(userAnswer).trim();
      if (q.answerIsText) {
        const norm = (s) => s.replace(/\s+/g, "").toLowerCase();
        correct = norm(raw) === norm(String(q.answer));
      } else {
        const num = Number(raw);
        correct = q.tolerance !== undefined
          ? !Number.isNaN(num) && Math.abs(num - parseFloat(q.answer)) <= q.tolerance
          : !Number.isNaN(num) && num === q.answer;
      }
    }
    setBattleFeedback(correct ? "correct" : "wrong");
    if (correct) playCorrect(soundOn); else playWrong(soundOn);

    const elapsedMs = battleQuestionStartRef.current ? Date.now() - battleQuestionStartRef.current : 0;
    const nextStats = recordAnswer(stats, q.category, q.key, correct, elapsedMs);
    setStats(nextStats);
    persist(nextStats);
    setHistory((h) => recordDailyHistory(h, correct));

    setBattleScore((s) => {
      const next = { correct: s.correct + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) };
      const db = getFirebaseDb();
      if (db && battleCodeRef.current) {
        update(ref(db, `rooms/${battleCodeRef.current}/players/${playerId}`), { score: next }).catch(() => {});
      }
      return next;
    });

    if (battleAdvanceRef.current) clearTimeout(battleAdvanceRef.current);
    battleAdvanceRef.current = setTimeout(() => {
      battleAdvanceRef.current = null;
      if (battleStageRef.current !== "playing") return;
      setBattleIdx((i) => i + 1);
      setBattleSelected(null);
      setBattleFillValue("");
      setBattleFeedback(null);
      battleQuestionStartRef.current = Date.now();
    }, correct ? 450 : 900);
  }

  function handleBattleFillSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (battleFeedbackRef.current) return;
    if (battleFillValueRef.current.trim() === "") return;
    submitBattleAnswer(battleFillValueRef.current.trim());
  }

  useEffect(() => {
    const q = battleQuestions && battleQuestions[battleIdx % battleQuestions.length];
    if (battleStage === "playing" && q && q.type === "fill" && battleInputRef.current) {
      battleInputRef.current.focus();
    }
  }, [battleIdx, battleStage, battleQuestions]);

  useEffect(() => {
    function onBattleKeyDown(e) {
      if (appMode !== "battle" || battleStageRef.current !== "playing") return;
      if (e.key !== "Enter") return;
      const qs = battleQuestionsRef.current;
      const q = qs && qs[battleIdxRef.current % qs.length];
      if (!q || q.type !== "fill" || battleFeedbackRef.current) return;
      e.preventDefault();
      handleBattleFillSubmit();
    }
    document.addEventListener("keydown", onBattleKeyDown);
    return () => document.removeEventListener("keydown", onBattleKeyDown);
  });

  async function handleSyncRoomSettings() {
    const db = getFirebaseDb();
    if (!db || !battleCode) return;
    const activeCats = CATEGORY_ORDER.filter((c) => battleActive[c]);
    await update(ref(db, `rooms/${battleCode}`), {
      duration: battleDuration,
      settings: { categories: activeCats, ranges: battleRanges, answerMode: battleAnswerMode, difficultyLabel: battleDifficultyLabel },
    }).catch(() => {});
  }

  async function handleStartBattle() {
    const db = getFirebaseDb();
    if (!db || !battleCode) return;
    const seed = Math.floor(Math.random() * 2 ** 31);
    const startAt = Date.now() + 4000;
    const activeCats = CATEGORY_ORDER.filter((c) => battleActive[c]);
    await update(ref(db, `rooms/${battleCode}`), {
      status: "playing", seed, startAt, duration: battleDuration,
      settings: { categories: activeCats, ranges: battleRanges, answerMode: battleAnswerMode, difficultyLabel: battleDifficultyLabel },
    }).catch(() => {});
  }

  async function handleRematch() {
    const db = getFirebaseDb();
    if (!db || !battleCode || !battleRoom) return;
    const resetPlayers = {};
    Object.entries(battleRoom.players || {}).forEach(([pid, p]) => {
      resetPlayers[pid] = { ...p, score: { correct: 0, wrong: 0 }, finishedAt: null };
    });
    await update(ref(db, `rooms/${battleCode}`), {
      status: "waiting", seed: null, startAt: null, players: resetPlayers,
    }).catch(() => {});
    setBattleStage("lobby");
  }

  function handleLeaveRoom() {
    if (battleUnsubRef.current) { battleUnsubRef.current(); battleUnsubRef.current = null; }
    if (battleTimerRef.current) { clearInterval(battleTimerRef.current); battleTimerRef.current = null; }
    if (battleAdvanceRef.current) { clearTimeout(battleAdvanceRef.current); battleAdvanceRef.current = null; }
    if (battleCountdownTimerRef.current) { clearTimeout(battleCountdownTimerRef.current); battleCountdownTimerRef.current = null; }
    const db = getFirebaseDb();
    if (db && battleCode) {
      if (battleRoom && battleRoom.hostId === playerId) {
        remove(ref(db, `rooms/${battleCode}`)).catch(() => {});
      } else {
        remove(ref(db, `rooms/${battleCode}/players/${playerId}`)).catch(() => {});
      }
    }
    setBattleRoom(null);
    setBattleCode("");
    setBattleQuestions(null);
    setBattleError("");
    battleStartedSeedRef.current = null;
    setBattleStage("menu");
  }

  function handleReset() {
    const fresh = emptyStats();
    setStats(fresh);
    persist(fresh);
    setSession({ correct: 0, total: 0, streak: 0, best: 0 });
    setHistory({});
    setBestStreakEver(0);
    try {
      window.localStorage.removeItem("buddhidrill-history");
      window.localStorage.removeItem("buddhidrill-best-streak");
    } catch { /* ignore */ }
  }

  function toggleCategory(cat) { makeToggleCategory(setActive)(cat); }

  const applyDifficulty = makeApplyDifficulty(setRanges, setDifficultyLabel);
  const updateRangePair = makeUpdateRangePair(setRanges, setDifficultyLabel);
  const updateSingleValue = makeUpdateSingleValue(setRanges, setDifficultyLabel);

  // regenerate the question when settings change (category toggle, difficulty,
  // custom ranges, answer mode) — never auto-focus here, this isn't the user
  // asking to move to the next question, just a settings tweak
  useEffect(() => {
    if (loaded) nextQuestion(stats, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, answerMode, ranges]);

  const accuracyPct = session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0;

  return (
    <div style={styles.page} className="bd-page">
      <style>{FONT_IMPORT + GLOBAL_CSS}</style>
      {showConfetti && <Confetti />}

      <div style={styles.wrap} className="bd-wrap">
        {/* ADMIT-CARD HEADER */}
        <header style={styles.header} className="bd-header">
          <div style={styles.headerLeft} className="bd-header-left">
            <div style={styles.eyebrow}>BUDDHIDRILL · BRAIN GAMES</div>
            <h1 style={styles.title}>BuddhiDrill</h1>
            <div style={styles.subtitle}>A playful daily workout for your math &amp; memory</div>
          </div>
          <div style={styles.stampBox} className="bd-stamp">
            <div style={styles.stampRow}>
              <span style={styles.stampLabel}>SCORE</span>
              <span style={styles.stampVal}>{session.correct}/{session.total}</span>
            </div>
            <div style={styles.stampRow}>
              <span style={styles.stampLabel}>ACCURACY</span>
              <span style={styles.stampVal}>{accuracyPct}%</span>
            </div>
            <div style={styles.stampRow}>
              <span style={styles.stampLabel}>STREAK</span>
              <span style={styles.stampVal}>{session.streak} <span style={styles.stampSub}>(best {session.best})</span></span>
            </div>
            <button
              onClick={toggleSound}
              style={styles.soundToggleBtn}
              title={soundOn ? "Mute sound effects" : "Unmute sound effects"}
              type="button"
            >
              {soundOn ? "🔊 Sound on" : "🔇 Sound off"}
            </button>
          </div>
        </header>

        {/* APP MODE: PRACTICE VS GAME */}
        <div style={styles.modeRow}>
          <span style={styles.modeLabel}>Mode:</span>
          <div style={styles.segmentGroup}>
            {[
              { id: "practice", label: "📖 Practice" },
              { id: "game", label: "🎮 Game" },
              { id: "battle", label: "⚔️ Battle" },
              { id: "progress", label: "📊 Progress" },
            ].map((opt) => {
              const on = appMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setAppMode(opt.id)}
                  style={{
                    ...styles.segmentBtn,
                    background: on ? "#E8B23D" : "transparent",
                    color: on ? "#0B1929" : "#93A6B8",
                    fontWeight: on ? 700 : 500,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {appMode === "practice" && (
        <>
        {/* CATEGORY TOGGLES */}
        <CategoryPicker categories={CATEGORY_ORDER} meta={CATEGORY_META} active={active} onToggle={toggleCategory} />

        <div style={styles.weakModeRow}>
          <button
            onClick={() => setWeakMode((w) => !w)}
            style={{
              ...styles.chip,
              borderColor: weakMode ? "#E8B23D" : "#3E566B",
              color: weakMode ? "#0B1929" : "#7C93A8",
              background: weakMode ? "#E8B23D" : "transparent",
              fontWeight: 700,
            }}
            title="Bias questions toward the numbers you get wrong most, or answer slowest"
          >
            🎯 Focus weak spots {weakMode ? "ON" : "OFF"}
          </button>
        </div>

        {/* ANSWER MODE TOGGLE */}
        <div style={styles.modeRow}>
          <span style={styles.modeLabel}>Question type:</span>
          <div style={styles.segmentGroup}>
            {[
              { id: "mixed", label: "Mixed" },
              { id: "mcq", label: "MCQ only" },
              { id: "fill", label: "Fill in the blank" },
            ].map((opt) => {
              const on = answerMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setAnswerMode(opt.id)}
                  style={{
                    ...styles.segmentBtn,
                    background: on ? "#E8B23D" : "transparent",
                    color: on ? "#0B1929" : "#93A6B8",
                    fontWeight: on ? 700 : 500,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* DIFFICULTY + CUSTOM RANGE */}
        <div style={styles.modeRow}>
          <span style={styles.modeLabel}>Difficulty:</span>
          <div style={styles.segmentGroup}>
            {[
              { id: "easy", label: "Easy" },
              { id: "medium", label: "Medium" },
              { id: "hard", label: "Hard" },
            ].map((opt) => {
              const on = difficultyLabel === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => applyDifficulty(opt.id)}
                  style={{
                    ...styles.segmentBtn,
                    background: on ? "#E8B23D" : "transparent",
                    color: on ? "#0B1929" : "#93A6B8",
                    fontWeight: on ? 700 : 500,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
            {difficultyLabel === "custom" && (
              <span style={{ ...styles.segmentBtn, color: "#E8B23D", fontWeight: 700 }}>Custom</span>
            )}
          </div>
          <button
            onClick={() => setShowCustomize((s) => !s)}
            style={{ ...styles.linkBtn, marginLeft: 4 }}
          >
            ⚙️ {showCustomize ? "Hide range settings" : "Set your own ranges"}
          </button>
        </div>

        {showCustomize && (
          <div style={styles.customizePanel}>
            {active.multiplication && (
              <RangeRow
                label="Multiplication — 1st number"
                value={ranges.multiplication.a}
                onChange={(idx, v) => updateRangePair("multiplication", "a", idx, v)}
                limits={ABSOLUTE_LIMITS.multiplicationA}
              />
            )}
            {active.multiplication && (
              <RangeRow
                label="Multiplication — 2nd number"
                value={ranges.multiplication.b}
                onChange={(idx, v) => updateRangePair("multiplication", "b", idx, v)}
                limits={ABSOLUTE_LIMITS.multiplicationB}
              />
            )}
            {active.addition && (
              <RangeRow
                label="Addition — 1st number"
                value={ranges.addition.a}
                onChange={(idx, v) => updateRangePair("addition", "a", idx, v)}
                limits={ABSOLUTE_LIMITS.additionA}
              />
            )}
            {active.addition && (
              <RangeRow
                label="Addition — 2nd number"
                value={ranges.addition.b}
                onChange={(idx, v) => updateRangePair("addition", "b", idx, v)}
                limits={ABSOLUTE_LIMITS.additionB}
              />
            )}
            {active.subtraction && (
              <RangeRow
                label="Subtraction — 1st number"
                value={ranges.subtraction.a}
                onChange={(idx, v) => updateRangePair("subtraction", "a", idx, v)}
                limits={ABSOLUTE_LIMITS.subtractionA}
              />
            )}
            {active.subtraction && (
              <RangeRow
                label="Subtraction — 2nd number"
                value={ranges.subtraction.b}
                onChange={(idx, v) => updateRangePair("subtraction", "b", idx, v)}
                limits={ABSOLUTE_LIMITS.subtractionB}
              />
            )}
            {active.division && (
              <RangeRow
                label="Division — divisor"
                value={ranges.division.divisor}
                onChange={(idx, v) => updateRangePair("division", "divisor", idx, v)}
                limits={ABSOLUTE_LIMITS.divisionDivisor}
              />
            )}
            {active.division && (
              <RangeRow
                label="Division — quotient (the answer)"
                value={ranges.division.quotient}
                onChange={(idx, v) => updateRangePair("division", "quotient", idx, v)}
                limits={ABSOLUTE_LIMITS.divisionQuotient}
              />
            )}
            {active.squares && (
              <RangeRow
                label="Squares — number range"
                value={ranges.squares.n}
                onChange={(idx, v) => updateRangePair("squares", "n", idx, v)}
                limits={ABSOLUTE_LIMITS.squaresN}
              />
            )}
            {active.cubes && (
              <RangeRow
                label="Cubes — number range"
                value={ranges.cubes.n}
                onChange={(idx, v) => updateRangePair("cubes", "n", idx, v)}
                limits={ABSOLUTE_LIMITS.cubesN}
              />
            )}
            {active.fractions && (
              <div style={styles.rangeRow}>
                <span style={styles.rangeLabel}>Fraction ↔ % — max denominator</span>
                <input
                  type="number"
                  value={ranges.fractions.maxDen}
                  onChange={(e) => updateSingleValue("fractions", "maxDen", e.target.value)}
                  min={ABSOLUTE_LIMITS.fractionsMaxDen[0]}
                  max={ABSOLUTE_LIMITS.fractionsMaxDen[1]}
                  style={styles.rangeInput}
                />
              </div>
            )}
            {active.quickpct && (
              <RangeRow
                label="Quick % — base number multiplier"
                value={ranges.quickpct.mult}
                onChange={(idx, v) => updateRangePair("quickpct", "mult", idx, v)}
                limits={ABSOLUTE_LIMITS.quickpctMult}
              />
            )}
            {active.alphaValue && (
              <RangeRow
                label="Alphabet ↔ Number — letter range (A=1 … Z=26)"
                value={ranges.alphaValue.pos}
                onChange={(idx, v) => updateRangePair("alphaValue", "pos", idx, v)}
                limits={ABSOLUTE_LIMITS.alphaValuePos}
              />
            )}
            {active.alphaOpposite && (
              <RangeRow
                label="Opposite Letters — letter range"
                value={ranges.alphaOpposite.pos}
                onChange={(idx, v) => updateRangePair("alphaOpposite", "pos", idx, v)}
                limits={ABSOLUTE_LIMITS.alphaOppositePos}
              />
            )}
            {active.bodmas && (
              <RangeRow
                label="BODMAS — number range"
                value={ranges.bodmas.n}
                onChange={(idx, v) => updateRangePair("bodmas", "n", idx, v)}
                limits={ABSOLUTE_LIMITS.bodmasN}
              />
            )}
            <div style={styles.customizeHint}>Bigger numbers and wider ranges = harder mental math. Changing any value switches Difficulty to "Custom".</div>
          </div>
        )}

        {/* QUESTION CARD */}
        <div style={styles.paperCard} className="bd-card">
          <div style={styles.paperTopRow}>
            <span style={{ ...styles.catPill, background: question ? CATEGORY_META[question.category].ink : "#999" }}>
              {question ? CATEGORY_META[question.category].label : "—"}
            </span>
            <span style={styles.itemTag}>
              {question ? `item · ${question.keyLabel}` : ""}
            </span>
          </div>

          {!question ? (
            <div style={styles.emptyState}>Pick at least one category above to start drilling.</div>
          ) : (
            <>
              <div style={styles.promptText} className="bd-prompt">{question.prompt}</div>

              {question.type === "mcq" ? (
                <div style={styles.optionsGrid} className="bd-options-grid">
                  {question.options.map((opt, i) => {
                    const isSelected = selected !== null && String(opt) === String(selected);
                    const isCorrectOpt = feedback && String(opt) === String(question.answer);
                    let bg = "#FFFDF7";
                    let border = "#D8CFB8";
                    let color = "#1F2937";
                    if (feedback) {
                      if (isCorrectOpt) { bg = "#E4F0E9"; border = "#1F6F5C"; color = "#1F6F5C"; }
                      else if (isSelected) { bg = "#F6E4E1"; border = "#C0392B"; color = "#C0392B"; }
                    }
                    return (
                      <button
                        key={i}
                        disabled={!!feedback}
                        onClick={() => submitAnswer(opt)}
                        style={{ ...styles.optionBtn, background: bg, borderColor: border, color }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <form onSubmit={handleFillSubmit} style={styles.fillRow} className="bd-fill-row">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode={question.inputMode === "text" ? "text" : "decimal"}
                    value={fillValue}
                    disabled={!!feedback}
                    onChange={(e) => setFillValue(e.target.value)}
                    placeholder={question.placeholder || "type your answer"}
                    className="bd-fill-input"
                    style={{
                      ...styles.fillInput,
                      borderColor: feedback === "correct" ? "#1F6F5C" : feedback === "wrong" ? "#C0392B" : "#B9AE94",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!!feedback}
                    style={styles.submitBtn}
                    className="bd-submit-btn"
                  >
                    Check
                  </button>
                </form>
              )}

              {feedback && (
                <div style={{
                  ...styles.feedbackBar,
                  background: feedback === "correct" ? "#E4F0E9" : "#F6E4E1",
                  color: feedback === "correct" ? "#1F6F5C" : "#C0392B",
                }}>
                  <span>
                    {feedback === "correct"
                      ? "✓ Correct — next question coming up"
                      : `✕ Not quite — answer: ${question.answer}`}
                  </span>
                  <button onClick={handleNext} style={styles.nextBtn}>
                    {feedback === "correct" ? "Next →" : "Press Enter →"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        </>
        )}

        {appMode === "game" && (
          <GamePanel
            gameCats={gameCats}
            toggleGameCat={toggleGameCat}
            gameDuration={gameDuration}
            setGameDuration={setGameDuration}
            gameStatus={gameStatus}
            gameTimeLeft={gameTimeLeft}
            gameQuestion={gameQuestion}
            gameFillValue={gameFillValue}
            setGameFillValue={setGameFillValue}
            gameTally={gameTally}
            gameBest={gameBest}
            startGame={startGame}
            submitGameAnswer={submitGameAnswer}
            handleGameFillSubmit={handleGameFillSubmit}
            gameInputRef={gameInputRef}
            setGameStatus={setGameStatus}
            soundOn={soundOn}
          />
        )}

        {appMode === "battle" && (
          <BattlePanel
            battleStage={battleStage}
            setBattleStage={setBattleStage}
            playerId={playerId}
            playerName={playerName}
            setPlayerName={setPlayerName}
            joinCodeInput={joinCodeInput}
            setJoinCodeInput={setJoinCodeInput}
            battleDuration={battleDuration}
            setBattleDuration={setBattleDuration}
            battleError={battleError}
            battleBusy={battleBusy}
            battleRoom={battleRoom}
            battleCode={battleCode}
            battleQuestions={battleQuestions}
            battleIdx={battleIdx}
            battleSelected={battleSelected}
            battleFillValue={battleFillValue}
            setBattleFillValue={setBattleFillValue}
            battleFeedback={battleFeedback}
            battleScore={battleScore}
            battleTimeLeft={battleTimeLeft}
            battleCountdown={battleCountdown}
            battleInputRef={battleInputRef}
            handleCreateRoom={handleCreateRoom}
            handleJoinRoom={handleJoinRoom}
            handleSyncRoomSettings={handleSyncRoomSettings}
            handleStartBattle={handleStartBattle}
            handleRematch={handleRematch}
            handleLeaveRoom={handleLeaveRoom}
            submitBattleAnswer={submitBattleAnswer}
            handleBattleFillSubmit={handleBattleFillSubmit}
            battleActive={battleActive}
            toggleBattleCategory={toggleBattleCategory}
            battleRanges={battleRanges}
            battleAnswerMode={battleAnswerMode}
            setBattleAnswerMode={setBattleAnswerMode}
            battleDifficultyLabel={battleDifficultyLabel}
            applyBattleDifficulty={applyBattleDifficulty}
            updateBattleRangePair={updateBattleRangePair}
            updateBattleSingleValue={updateBattleSingleValue}
            battleShowCustomize={battleShowCustomize}
            setBattleShowCustomize={setBattleShowCustomize}
            soundOn={soundOn}
          />
        )}

        {appMode === "progress" && (
          <ProgressPanel stats={stats} history={history} session={session} bestStreakEver={bestStreakEver} />
        )}

        {/* HEATMAP */}
        {appMode === "practice" && (
        <div style={styles.heatmapSection}>
          <div style={styles.heatmapHeader}>
            <h2 style={styles.heatmapTitle}>Where you stand</h2>
            <button style={styles.linkBtn} onClick={() => setShowHeatmap((s) => !s)}>
              {showHeatmap ? "Hide" : "Show"}
            </button>
          </div>

          {showHeatmap && (
            <>
              {active.multiplication && (
                <Heatmap
                  category="multiplication"
                  title={`Multiplication (${ranges.multiplication.a[0]}–${ranges.multiplication.a[1]})`}
                  items={range(ranges.multiplication.a[0], ranges.multiplication.a[1])}
                  stats={stats}
                />
              )}
              {active.addition && (
                <Heatmap
                  category="addition"
                  title={`Addition (${ranges.addition.a[0]}–${ranges.addition.a[1]})`}
                  items={bucketItemsForRange(ranges.addition.a[0], ranges.addition.a[1])}
                  stats={stats}
                />
              )}
              {active.subtraction && (
                <Heatmap
                  category="subtraction"
                  title={`Subtraction (${Math.min(ranges.subtraction.a[0], ranges.subtraction.b[0])}–${Math.max(ranges.subtraction.a[1], ranges.subtraction.b[1])})`}
                  items={bucketItemsForRange(
                    Math.min(ranges.subtraction.a[0], ranges.subtraction.b[0]),
                    Math.max(ranges.subtraction.a[1], ranges.subtraction.b[1])
                  )}
                  stats={stats}
                />
              )}
              {active.division && (
                <Heatmap
                  category="division"
                  title={`Division — divisor (${ranges.division.divisor[0]}–${ranges.division.divisor[1]})`}
                  items={range(ranges.division.divisor[0], ranges.division.divisor[1])}
                  stats={stats}
                />
              )}
              {active.squares && (
                <Heatmap
                  category="squares"
                  title={`Squares (${ranges.squares.n[0]}–${ranges.squares.n[1]})`}
                  items={range(ranges.squares.n[0], ranges.squares.n[1])}
                  stats={stats}
                />
              )}
              {active.cubes && (
                <Heatmap
                  category="cubes"
                  title={`Cubes (${ranges.cubes.n[0]}–${ranges.cubes.n[1]})`}
                  items={range(ranges.cubes.n[0], ranges.cubes.n[1])}
                  stats={stats}
                />
              )}
              {active.fractions && (
                <Heatmap
                  category="fractions"
                  title="Fraction ↔ %"
                  items={FRACTIONS.filter(([, d]) => d <= ranges.fractions.maxDen).map(([n, d]) => `${n}/${d}`)}
                  stats={stats}
                />
              )}
              {active.quickpct && (
                <Heatmap
                  category="quickpct"
                  title="Quick % of a number"
                  items={QUICK_PCT.map(([n, d]) => pctLabel(n, d))}
                  stats={stats}
                />
              )}
              {active.alphaValue && (
                <Heatmap
                  category="alphaValue"
                  title={`Alphabet ↔ Number (${letterAt(ranges.alphaValue.pos[0])}–${letterAt(ranges.alphaValue.pos[1])})`}
                  items={range(ranges.alphaValue.pos[0], ranges.alphaValue.pos[1]).map(letterAt)}
                  stats={stats}
                />
              )}
              {active.alphaOpposite && (
                <Heatmap
                  category="alphaOpposite"
                  title={`Opposite Letters (${letterAt(ranges.alphaOpposite.pos[0])}–${letterAt(ranges.alphaOpposite.pos[1])})`}
                  items={range(ranges.alphaOpposite.pos[0], ranges.alphaOpposite.pos[1]).map(letterAt)}
                  stats={stats}
                />
              )}
              {active.bodmas && (
                <Heatmap
                  category="bodmas"
                  title="BODMAS — by complexity"
                  items={ranges.bodmas.brackets
                    ? [`${ranges.bodmas.ops}-op`, `${ranges.bodmas.ops}-op+brackets`]
                    : [`${ranges.bodmas.ops}-op`]}
                  stats={stats}
                />
              )}

              <div style={styles.legendRow}>
                <span style={styles.legendLabel}>Legend:</span>
                {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                  <span key={i} style={{ ...styles.legendDot, background: colorForAcc(v) }} />
                ))}
                <span style={styles.legendLabel}>weak → strong</span>
                <span style={{ ...styles.legendDot, background: "#33465B", marginLeft: 12 }} />
                <span style={styles.legendLabel}>not attempted</span>
              </div>

              <button style={styles.resetBtn} onClick={handleReset}>Reset all progress</button>
            </>
          )}
        </div>
        )}

        {/* COMING SOON TEASER */}
        <div style={styles.comingSoonBox}>
          <div style={styles.comingSoonTitle}>🚧 More drills coming to BuddhiDrill</div>
          <div style={styles.comingSoonChips}>
            {["Number Series", "Blood Relations", "Direction Sense", "Coding-Decoding"].map((t) => (
              <span key={t} style={styles.comingSoonChip}>{t}</span>
            ))}
          </div>
        </div>

        <footer style={styles.footer}>BuddhiDrill — a playful daily workout for your math &amp; memory. Accuracy is tracked per number and saved on this device.</footer>
      </div>
    </div>
  );
}
