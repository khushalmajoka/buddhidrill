import { useState, useEffect, useCallback, useRef } from "react";
import {
  ref, set, get, update, remove, onValue, onDisconnect, serverTimestamp,
} from "firebase/database";

import { getFirebaseDb, newRoomCode, ensureFirebaseAuth } from "./firebase";
import {
  pkey, loadProfiles, loadActiveProfileId, saveActiveProfileId, createProfile, renameProfile,
  deleteProfile, setProfileAvatar, hasSavedProfiles, setProfileOnboardingInfo, isProfileOnboarded,
} from "./lib/profiles";
import OnboardingModal from "./components/OnboardingModal";
import { loadBigTextPref, saveBigTextPref } from "./lib/accessibility";
import { readChallengeFromUrl } from "./lib/dailyChallenge";
import ProfileSwitcher from "./components/ProfileSwitcher";
import ShareCardModal from "./components/ShareCardModal";
import DailyChallengePanel from "./components/DailyChallengePanel";
import LeaderboardPanel from "./components/LeaderboardPanel";
import TeamPanel from "./components/TeamPanel";
import SettingsIOPanel from "./components/SettingsIOPanel";
import {
  FRACTIONS, QUICK_PCT, CATEGORY_META, CATEGORY_ORDER,
  ABSOLUTE_LIMITS, DIFFICULTY_PRESETS, GAME_CATEGORY_ORDER, HOST_DISCONNECT_GRACE_MS,
} from "./constants";
import { pctLabel, pick, bucketItemsForRange, range, colorForAcc } from "./lib/mathUtils";
import {
  makeToggleCategory, makeApplyDifficulty, makeUpdateRangePair, makeUpdateSingleValue,
} from "./lib/settingsHandlers";
import { GENERATORS, letterAt } from "./questions/generators";
import { generateBattleQuestions } from "./battle/battleEngine";
import {
  emptyStats, recordAnswer, weightForItem, loadHistory, recordDailyHistory, allTimeSummary,
} from "./stats";
import { FONT_IMPORT, GLOBAL_CSS, styles } from "./styles";
import { loadSoundPref, saveSoundPref, playCorrect, playWrong, playTap, playNewBest } from "./lib/sound";
import { loadXP, addXP, levelFromXP, levelProgress, xpForAnswer, comboMultiplier } from "./lib/xp";
import { loadUnlockedBadges, evaluateBadges, badgeById } from "./lib/badges";
import { loadThemeId, saveThemeId, getTheme, isThemeUnlocked } from "./lib/themes";
import {
  loadAdaptiveOnPref, saveAdaptiveOnPref, loadAdaptiveState, recordAdaptiveOutcome, applyAdaptiveRanges,
} from "./lib/adaptive";
import {
  loadSpacedRepOnPref, saveSpacedRepOnPref, loadSRS, recordSRSOutcome, srsPriority,
} from "./lib/spacedRepetition";
import { buildPracticePlan } from "./lib/practicePlan";
import {
  loadReminderPref, saveReminderPref, notificationsSupported, notificationPermission,
  requestNotificationPermission, startReminderLoop,
} from "./lib/reminders";
import GamePanel from "./components/GamePanel";
import BattlePanel from "./components/BattlePanel";
import RangeRow from "./components/RangeRow";
import Heatmap from "./components/Heatmap";
import CategoryPicker from "./components/CategoryPicker";
import ProgressPanel from "./components/ProgressPanel";
import Confetti from "./components/Confetti";
import XPBar from "./components/XPBar";
import BadgeUnlockToast from "./components/BadgeUnlockToast";
import LearnPanel from "./components/LearnPanel";
import MockTestPanel from "./components/MockTestPanel";
import BossPanel, { BOSS_DURATION, BOSS_TARGET } from "./components/BossPanel";
import PracticePlanCard from "./components/PracticePlanCard";
import ReminderSettings from "./components/ReminderSettings";
import StickyHUD from "./components/StickyHUD";
import SmartToggleRow from "./components/SmartToggleRow";
import QuestionDifficultyBadge from "./components/QuestionDifficultyBadge";
import { recordQuestionOutcome } from "./lib/questionStats";

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function Logiks() {
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState(emptyStats());
  const [active, setActive] = useState({
    multiplication: true, addition: true, subtraction: true, division: true,
    squares: true, cubes: true, fractions: true, quickpct: true,
    alphaValue: true, alphaOpposite: true, bodmas: true,
  });
  const [soundOn, setSoundOn] = useState(() => loadSoundPref());
  const [bigText, setBigText] = useState(() => loadBigTextPref());
  function toggleBigText() {
    setBigText((v) => { saveBigTextPref(!v); return !v; });
  }
  const [shareCardData, setShareCardData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
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

  // ---- Phase 4: adaptive difficulty, spaced repetition, practice plan, reminders ----
  const [adaptiveOn, setAdaptiveOn] = useState(() => loadAdaptiveOnPref());
  const [adaptiveState, setAdaptiveState] = useState(() => loadAdaptiveState());
  const [spacedRepOn, setSpacedRepOn] = useState(() => loadSpacedRepOnPref());
  const [srs, setSrs] = useState(() => loadSRS());
  const [reminderPref, setReminderPref] = useState(() => loadReminderPref());
  const [notifPermission, setNotifPermission] = useState(() => notificationPermission());
  const reminderPrefRef = useRef(reminderPref);
  const historyRefForReminder = useRef(null);

  // Remembers the Difficulty preset that was active right before Adaptive
  // got switched on, so turning Adaptive back off can restore it — but
  // ONLY if the person hasn't manually touched a range in between (those
  // handlers below clear this ref, since a deliberate manual edit should
  // always win over "restore what adaptive found you on").
  const preAdaptiveLabelRef = useRef(null);
  function toggleAdaptive() {
    setAdaptiveOn((v) => {
      const turningOn = !v;
      saveAdaptiveOnPref(turningOn);
      if (turningOn) {
        // Adaptive scales the effective ranges live, so whatever preset was
        // showing is no longer literally true — same convention as manually
        // editing a range, which also flips the label to "Custom".
        if (difficultyLabel !== "custom") {
          preAdaptiveLabelRef.current = difficultyLabel;
          setDifficultyLabel("custom");
        } else {
          preAdaptiveLabelRef.current = null;
        }
      } else if (preAdaptiveLabelRef.current) {
        setDifficultyLabel(preAdaptiveLabelRef.current);
        preAdaptiveLabelRef.current = null;
      }
      return turningOn;
    });
  }
  function toggleSpacedRep() {
    setSpacedRepOn((v) => { saveSpacedRepOnPref(!v); return !v; });
  }
  // day-by-day correct/total log (separate from per-item `stats`) — powers
  // the learning-curve chart on the Progress tab. Shared across Practice,
  // Game, and Battle, since they all feed the same daily total.
  const [history, setHistory] = useState(() => loadHistory());
  const [bestStreakEver, setBestStreakEver] = useState(() => {
    try { return parseInt(window.localStorage.getItem(pkey("buddhidrill-best-streak")), 10) || 0; } catch { return 0; }
  });

  // ---- Profiles (Phase 6, item 25) ----
  const [profiles, setProfiles] = useState(() => loadProfiles());
  const [activeProfileId, setActiveProfileId] = useState(() => loadActiveProfileId());
  function switchProfile(id) {
    if (id === activeProfileId) return;
    saveActiveProfileId(id);
    setActiveProfileId(id);
    // simplest safe way to re-initialize every piece of per-profile state
    // (stats, XP, badges, theme, adaptive/SRS, history, best streak, name)
    // from the newly-active profile's namespaced localStorage keys
    window.location.reload();
  }
  function handleCreateProfile(name) { setProfiles(createProfile(name)); }
  function handleRenameProfile(id, name) { setProfiles(renameProfile(id, name)); }
  function handleSetProfileAvatar(id, avatar) { setProfiles(setProfileAvatar(id, avatar)); }
  function handleDeleteProfile(id) {
    const next = deleteProfile(id);
    setProfiles(next);
    if (id === activeProfileId) window.location.reload();
  }

  // ---- First-run onboarding (name / DOB / unique username) ----
  // hasSavedProfiles() is the true "first ever visit" signal — loadProfiles()
  // always returns a fallback so the rest of the app never needs to
  // null-check, but that fallback is exactly what a brand-new device sees.
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const activeP = loadProfiles().find((p) => p.id === loadActiveProfileId()) || loadProfiles()[0];
    return !hasSavedProfiles() || !isProfileOnboarded(activeP);
  });
  function handleOnboardingComplete({ name, username, dob }) {
    const next = setProfileOnboardingInfo(activeProfileId, { name, username, dob });
    setProfiles(next);
    setPlayerName(username);
    try { window.localStorage.setItem(pkey("buddhidrill-name"), username); } catch { /* ignore */ }
    setShowOnboarding(false);
  }

  // ---- Weekly leaderboard score (Phase 5, item 19) ----
  // simplest honest signal: total correct answers logged in `history`
  // since the start of THIS calendar week (Mon-based), summed live.
  const weeklyScore = (() => {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    monday.setHours(0, 0, 0, 0);
    let total = 0;
    for (const [dateKey, v] of Object.entries(history)) {
      if (new Date(dateKey) >= monday) total += v.correct || 0;
    }
    return total;
  })();

  // ---- Async friend challenge, read once from the URL on load (Phase 5, item 18) ----
  const [incomingChallenge, setIncomingChallenge] = useState(() => readChallengeFromUrl());

  // ---- Gamification: XP/levels, badges, cosmetic themes ----
  const [xp, setXp] = useState(() => loadXP());
  const [unlockedBadges, setUnlockedBadges] = useState(() => loadUnlockedBadges());
  const [themeId, setThemeId] = useState(() => loadThemeId());
  const [badgeToastQueue, setBadgeToastQueue] = useState([]);
  const theme = getTheme(themeId);
  const xpProgress = levelProgress(xp);

  function selectTheme(id) {
    const t = getTheme(id);
    if (!isThemeUnlocked(t, { level: xpProgress.level, unlockedBadges })) return;
    setThemeId(id);
    saveThemeId(id);
  }

  // ---- Daily reminder loop (Phase 4) ----
  useEffect(() => { reminderPrefRef.current = reminderPref; }, [reminderPref]);
  useEffect(() => { historyRefForReminder.current = history; }, [history]);

  useEffect(() => {
    const stop = startReminderLoop({
      getPref: () => reminderPrefRef.current,
      hasPracticedToday: () => {
        const today = new Date().toISOString().slice(0, 10);
        const h = historyRefForReminder.current;
        return !!(h && h[today] && h[today].total > 0);
      },
    });
    return stop;
  }, []);

  function toggleReminder() {
    setReminderPref((p) => {
      const next = { ...p, enabled: !p.enabled };
      saveReminderPref(next);
      return next;
    });
  }
  function setReminderTime(time) {
    setReminderPref((p) => {
      const next = { ...p, time };
      saveReminderPref(next);
      return next;
    });
  }
  async function handleRequestNotificationPermission() {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
  }

  // grants XP for a correct answer (streak drives the combo multiplier),
  // celebrating with confetti + a chime whenever it crosses a level
  const awardXP = useCallback((correct, streak) => {
    const gained = xpForAnswer(correct, streak);
    if (gained <= 0) return xp;
    const result = addXP(xp, gained);
    setXp(result.xp);
    if (result.leveledUp) {
      fireConfetti();
      playNewBest(soundOn);
    }
    return result.xp;
  }, [xp, soundOn]);

  // re-evaluates every badge against freshly-computed state (so it always
  // sees this answer's effects, not a stale render's) and queues a toast
  // for anything newly earned
  const runBadgeCheck = useCallback((ctx) => {
    const summary = allTimeSummary(ctx.stats);
    const result = evaluateBadges({ ...ctx, summary });
    if (result.newlyUnlocked.length) {
      setUnlockedBadges(result.unlocked);
      setBadgeToastQueue((q) => [...q, ...result.newlyUnlocked]);
      fireConfetti();
      playNewBest(soundOn);
    }
  }, [soundOn]);

  // shows badge-unlock toasts one at a time, ~2.6s each
  useEffect(() => {
    if (badgeToastQueue.length === 0) return;
    const t = setTimeout(() => setBadgeToastQueue((q) => q.slice(1)), 2600);
    return () => clearTimeout(t);
  }, [badgeToastQueue]);
  const currentBadgeToast = badgeToastQueue.length > 0 ? badgeById(badgeToastQueue[0]) : null;

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
  const [appMode, setAppMode] = useState(() => (readChallengeFromUrl() ? "daily" : "practice"));
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
      const raw = window.localStorage.getItem(pkey(`buddhidrill-highscore-${gameDuration}`));
      setGameBest(raw ? parseInt(raw, 10) || 0 : 0);
    } catch { /* ignore */ }
  }, [gameDuration]);

  // ---- Learn Mode state (untimed, reveal-the-answer practice) ----
  const [learnQuestion, setLearnQuestion] = useState(null);
  const [learnRevealed, setLearnRevealed] = useState(false);

  function nextLearnQuestion() {
    const pool = CATEGORY_ORDER.filter((c) => active[c]);
    if (pool.length === 0) { setLearnQuestion(null); setLearnRevealed(false); return; }
    const cat = pick(pool);
    const q = GENERATORS[cat](undefined, ranges);
    setLearnQuestion(q);
    setLearnRevealed(false);
  }

  function revealLearnAnswer() { setLearnRevealed(true); }

  // regenerate the Learn question when its category pool or ranges change
  // (shares Practice's `active`/`ranges` settings — see LearnPanel)
  useEffect(() => {
    if (appMode === "learn") nextLearnQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appMode, active, ranges]);

  // ---- Mock Test state (fixed-length mixed set, report at the end) ----
  const [mockCats, setMockCats] = useState({
    multiplication: true, addition: true, subtraction: true, division: true,
    squares: true, cubes: true, fractions: true, quickpct: true,
    alphaValue: true, alphaOpposite: true, bodmas: true,
  });
  const [mockLength, setMockLength] = useState(20);
  const [mockStatus, setMockStatus] = useState("setup"); // 'setup' | 'playing' | 'finished'
  const [mockIdx, setMockIdx] = useState(0);
  const [mockQuestion, setMockQuestion] = useState(null);
  const [mockFillValue, setMockFillValue] = useState("");
  const [mockTally, setMockTally] = useState({ correct: 0, wrong: 0, skipped: 0, byCat: {}, totalTimeMs: 0, timedCount: 0 });
  const [mockReview, setMockReview] = useState([]);
  const [mockRevealed, setMockRevealed] = useState(null); // the answer, once "Show Answer" is used on the current question
  const mockInputRef = useRef(null);
  const mockQuestionStartRef = useRef(null);
  const mockFillValueRef = useRef("");
  const mockSubmitLockRef = useRef(false);

  useEffect(() => { mockFillValueRef.current = mockFillValue; }, [mockFillValue]);

  function toggleMockCat(cat) {
    setMockCats((c) => {
      const next = { ...c, [cat]: !c[cat] };
      if (!Object.values(next).some(Boolean)) return c;
      return next;
    });
  }

  function nextMockQuestion() {
    const pool = CATEGORY_ORDER.filter((c) => mockCats[c]);
    const cat = pool.length ? pick(pool) : "multiplication";
    const q = GENERATORS[cat](undefined, ranges);
    mockQuestionStartRef.current = Date.now();
    setMockQuestion(q);
    setMockFillValue("");
    setMockRevealed(null);
    mockSubmitLockRef.current = false;
  }

  function startMockTest() {
    setMockStatus("playing");
    setMockIdx(0);
    setMockTally({ correct: 0, wrong: 0, skipped: 0, byCat: {}, totalTimeMs: 0, timedCount: 0 });
    setMockReview([]);
    setMockRevealed(null);
    nextMockQuestion();
  }

  // Skip — moves on without recording a right/wrong attempt at all (doesn't
  // count against accuracy either way, just excluded from that denominator).
  function skipMockQuestion() {
    const q = mockQuestion;
    if (!q || mockStatus !== "playing" || mockSubmitLockRef.current) return;
    mockSubmitLockRef.current = true;
    setMockReview((r) => [...r, { prompt: q.prompt, userAnswer: null, correctAnswer: q.answer, correct: false, skipped: true }]);
    setMockTally((t) => ({ ...t, skipped: (t.skipped || 0) + 1 }));
    const isLast = mockIdx + 1 >= mockLength;
    if (isLast) setMockStatus("finished");
    else { setMockIdx((i) => i + 1); nextMockQuestion(); }
  }

  // Show Answer — reveals the correct answer inline (no advance yet); the
  // person reads it, then hits Continue. Unlike Skip, this DOES count
  // toward accuracy as a wrong answer, since "I had to look" is different
  // from "I chose not to attempt it."
  function revealMockAnswer() {
    const q = mockQuestion;
    if (!q || mockStatus !== "playing" || mockSubmitLockRef.current || mockRevealed !== null) return;
    setMockRevealed(q.answer);
  }

  function continueAfterMockReveal() {
    const q = mockQuestion;
    if (!q || mockRevealed === null) return;
    mockSubmitLockRef.current = true;
    const elapsedMs = mockQuestionStartRef.current ? Date.now() - mockQuestionStartRef.current : 0;
    const nextStats = recordAnswer(stats, q.category, q.key, false, elapsedMs);
    setStats(nextStats);
    persist(nextStats);
    const nextHistory = recordDailyHistory(history, false);
    setHistory(nextHistory);
    setMockReview((r) => [...r, { prompt: q.prompt, userAnswer: null, correctAnswer: q.answer, correct: false, revealed: true }]);
    setMockTally((t) => {
      const byCat = { ...t.byCat };
      const c = byCat[q.category] || { correct: 0, total: 0 };
      byCat[q.category] = { correct: c.correct, total: c.total + 1 };
      const clampedMs = Number.isFinite(elapsedMs) ? Math.max(0, Math.min(elapsedMs, 60000)) : 0;
      return {
        ...t,
        wrong: t.wrong + 1,
        byCat,
        totalTimeMs: t.totalTimeMs + clampedMs,
        timedCount: t.timedCount + 1,
      };
    });
    setMockRevealed(null);
    const isLast = mockIdx + 1 >= mockLength;
    if (isLast) setMockStatus("finished");
    else { setMockIdx((i) => i + 1); nextMockQuestion(); }
  }

  function submitMockAnswer(userAnswer) {
    const q = mockQuestion;
    if (!q || mockStatus !== "playing" || mockSubmitLockRef.current || mockRevealed !== null) return;
    mockSubmitLockRef.current = true;

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
        correct = q.tolerance !== undefined
          ? !Number.isNaN(num) && Math.abs(num - parseFloat(q.answer)) <= q.tolerance
          : !Number.isNaN(num) && num === q.answer;
      }
    }

    playTap(soundOn);
    const elapsedMs = mockQuestionStartRef.current ? Date.now() - mockQuestionStartRef.current : 0;
    const nextStats = recordAnswer(stats, q.category, q.key, correct, elapsedMs);
    setStats(nextStats);
    persist(nextStats);
    const nextHistory = recordDailyHistory(history, correct);
    setHistory(nextHistory);

    const newXP = awardXP(correct, 0);
    runBadgeCheck({ stats: nextStats, history: nextHistory, bestStreakEver, level: levelFromXP(newXP) });

    setMockReview((r) => [...r, { prompt: q.prompt, userAnswer, correctAnswer: q.answer, correct }]);
    setMockTally((t) => {
      const byCat = { ...t.byCat };
      const c = byCat[q.category] || { correct: 0, total: 0 };
      byCat[q.category] = { correct: c.correct + (correct ? 1 : 0), total: c.total + 1 };
      const clampedMs = Number.isFinite(elapsedMs) ? Math.max(0, Math.min(elapsedMs, 60000)) : 0;
      return {
        correct: t.correct + (correct ? 1 : 0),
        wrong: t.wrong + (correct ? 0 : 1),
        byCat,
        totalTimeMs: t.totalTimeMs + clampedMs,
        timedCount: t.timedCount + 1,
      };
    });

    const isLast = mockIdx + 1 >= mockLength;
    if (isLast) {
      setMockStatus("finished");
    } else {
      setMockIdx((i) => i + 1);
      nextMockQuestion();
    }
  }

  function handleMockFillSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (mockFillValueRef.current.trim() === "") return;
    submitMockAnswer(mockFillValueRef.current.trim());
  }

  useEffect(() => {
    if (mockStatus === "playing" && mockQuestion && mockQuestion.type === "fill" && mockInputRef.current) {
      mockInputRef.current.focus();
    }
  }, [mockQuestion, mockStatus]);

  // ---- Boss Level state (one fixed, harder timed challenge) ----
  const [bossStatus, setBossStatus] = useState("intro"); // 'intro' | 'playing' | 'finished'
  const [bossTimeLeft, setBossTimeLeft] = useState(BOSS_DURATION);
  const [bossQuestion, setBossQuestion] = useState(null);
  const [bossFillValue, setBossFillValue] = useState("");
  const [bossTally, setBossTally] = useState({ correct: 0, wrong: 0, byCat: {} });
  const [bossCleared, setBossCleared] = useState(false);
  const bossTimerRef = useRef(null);
  const bossInputRef = useRef(null);
  const bossQuestionRef = useRef(null);
  const bossFillValueRef = useRef("");
  const bossSubmitLockRef = useRef(false);
  const BOSS_RANGES = DIFFICULTY_PRESETS.hard;

  useEffect(() => { bossQuestionRef.current = bossQuestion; }, [bossQuestion]);
  useEffect(() => { bossFillValueRef.current = bossFillValue; }, [bossFillValue]);

  function nextBossQuestion() {
    const cat = pick(GAME_CATEGORY_ORDER);
    const q = GENERATORS[cat](undefined, BOSS_RANGES);
    setBossQuestion(q);
    setBossFillValue("");
    bossSubmitLockRef.current = false;
  }

  function startBoss() {
    setBossStatus("playing");
    setBossTimeLeft(BOSS_DURATION);
    setBossTally({ correct: 0, wrong: 0, byCat: {} });
    setBossCleared(false);
    nextBossQuestion();
    if (bossTimerRef.current) clearInterval(bossTimerRef.current);
    bossTimerRef.current = setInterval(() => {
      setBossTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(bossTimerRef.current);
          bossTimerRef.current = null;
          endBoss();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function endBoss() {
    if (bossTimerRef.current) { clearInterval(bossTimerRef.current); bossTimerRef.current = null; }
    setBossStatus("finished");
    setBossTally((tally) => {
      const cleared = tally.correct >= BOSS_TARGET;
      setBossCleared(cleared);
      if (cleared) {
        try { window.localStorage.setItem(pkey("buddhidrill-boss-cleared"), "1"); } catch { /* ignore */ }
        fireConfetti(2200);
        playNewBest(soundOn);
        const newXP = awardXP(true, 0);
        const bonus = addXP(newXP, 100); // flat bonus on top of the per-answer XP already awarded
        setXp(bonus.xp);
        runBadgeCheck({ stats, history, bestStreakEver, level: levelFromXP(bonus.xp) });
      }
      return tally;
    });
  }

  function submitBossAnswer(userAnswer) {
    const q = bossQuestionRef.current;
    if (!q || bossStatus !== "playing" || bossSubmitLockRef.current) return;
    bossSubmitLockRef.current = true;

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
        correct = q.tolerance !== undefined
          ? !Number.isNaN(num) && Math.abs(num - parseFloat(q.answer)) <= q.tolerance
          : !Number.isNaN(num) && num === q.answer;
      }
    }

    playTap(soundOn);
    const nextStats = recordAnswer(stats, q.category, q.key, correct, 0);
    setStats(nextStats);
    persist(nextStats);
    const nextHistory = recordDailyHistory(history, correct);
    setHistory(nextHistory);
    awardXP(correct, 0);

    setBossTally((t) => {
      const byCat = { ...t.byCat };
      const c = byCat[q.category] || { correct: 0, total: 0 };
      byCat[q.category] = { correct: c.correct + (correct ? 1 : 0), total: c.total + 1 };
      return {
        correct: t.correct + (correct ? 1 : 0),
        wrong: t.wrong + (correct ? 0 : 1),
        byCat,
      };
    });

    nextBossQuestion();
  }

  function handleBossFillSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (bossFillValueRef.current.trim() === "") return;
    submitBossAnswer(bossFillValueRef.current.trim());
  }

  useEffect(() => {
    if (bossStatus === "playing" && bossQuestion && bossQuestion.type === "fill" && bossInputRef.current) {
      bossInputRef.current.focus();
    }
  }, [bossQuestion, bossStatus]);

  useEffect(() => () => {
    if (bossTimerRef.current) clearInterval(bossTimerRef.current);
  }, []);

  // ---- Battle mode state ----
  const [battleStage, setBattleStage] = useState("menu"); // menu | create | join | lobby | countdown | playing | results
  const [playerId, setPlayerId] = useState(null); // resolved from Firebase Anonymous Auth right before create/join
  const [playerName, setPlayerName] = useState(() => {
    try {
      const activeP = loadProfiles().find((p) => p.id === loadActiveProfileId());
      if (activeP && activeP.username) return activeP.username;
      return window.localStorage.getItem(pkey("buddhidrill-name")) || "";
    } catch { return ""; }
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
  const battleRoomRef = useRef(null);
  const battleAbandonCheckRef = useRef(null); // interval id for the opponent-side grace-period watch
  const battleAbandonHandledRef = useRef(false); // guards against double-triggering the cleanup

  useEffect(() => { battleStageRef.current = battleStage; }, [battleStage]);
  useEffect(() => { battleCodeRef.current = battleCode; }, [battleCode]);
  useEffect(() => { battleQuestionsRef.current = battleQuestions; }, [battleQuestions]);
  useEffect(() => { battleIdxRef.current = battleIdx; }, [battleIdx]);
  useEffect(() => { battleFeedbackRef.current = battleFeedback; }, [battleFeedback]);
  useEffect(() => { battleFillValueRef.current = battleFillValue; }, [battleFillValue]);
  useEffect(() => { battleRoomRef.current = battleRoom; }, [battleRoom]);

  function clearAbandonWatch() {
    if (battleAbandonCheckRef.current) { clearInterval(battleAbandonCheckRef.current); battleAbandonCheckRef.current = null; }
    battleAbandonHandledRef.current = false;
  }

  // clean up any live listener/timers if the whole app unmounts
  useEffect(() => () => {
    if (battleUnsubRef.current) battleUnsubRef.current();
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    if (battleAdvanceRef.current) clearTimeout(battleAdvanceRef.current);
    if (battleCountdownTimerRef.current) clearTimeout(battleCountdownTimerRef.current);
    clearAbandonWatch();
  }, []);

  // Host side: while the host device is connected, keep the room's
  // "hostDisconnectedAt" marker clear, and (re-)arm the onDisconnect
  // handlers whenever the connection is (re-)established. Firebase forgets
  // onDisconnect registrations across a full reconnect (new session), not
  // just a brief in-session hiccup, so this has to re-run on every
  // reconnect, not just once when the room is created.
  useEffect(() => {
    const db = getFirebaseDb();
    if (!db || !battleCode) return;
    const unsub = onValue(ref(db, ".info/connected"), (snap) => {
      if (snap.val() !== true) return;
      const room = battleRoomRef.current;
      if (!room || room.hostId !== playerId) return;
      set(ref(db, `rooms/${battleCode}/hostDisconnectedAt`), null).catch(() => {});
      onDisconnect(ref(db, `rooms/${battleCode}/hostDisconnectedAt`)).set(serverTimestamp());
      onDisconnect(ref(db, `rooms/${battleCode}/players/${playerId}`)).remove();
    });
    return () => unsub();
  }, [battleCode, playerId]);

  useEffect(() => { feedbackRef.current = feedback; }, [feedback]);
  useEffect(() => { questionRef.current = question; }, [question]);
  useEffect(() => { fillValueRef.current = fillValue; }, [fillValue]);

  // load persisted stats (browser localStorage — works once deployed as a standalone site)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(pkey("buddhidrill-stats"));
      if (raw) setStats({ ...emptyStats(), ...JSON.parse(raw) });
    } catch {
      // no saved stats yet, or storage blocked — start fresh
    } finally {
      setLoaded(true);
    }
  }, []);

  const persist = useCallback((next) => {
    try {
      window.localStorage.setItem(pkey("buddhidrill-stats"), JSON.stringify(next));
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
    // adaptive difficulty quietly scales the active ranges before generation;
    // weak-mode/spaced-repetition weighting below never touches the base `ranges`
    const effectiveRanges = applyAdaptiveRanges(ranges, adaptiveState, adaptiveOn);
    let q = null;
    let guard = 0;
    // in weak mode (and/or spaced repetition), retry generation a few times
    // hoping to land on a weak/overdue key rather than a purely random one
    const weightedPick = weakMode || spacedRepOn;
    if (weightedPick) {
      const weightOf = (cand) => {
        const base = weightForItem(statsSnapshot, cat, cand.key);
        return spacedRepOn ? base * srsPriority(srs, cat, cand.key) : base;
      };
      let bestQ = GENERATORS[cat](forceType, effectiveRanges);
      let bestW = weightOf(bestQ);
      while (guard < 5) {
        guard++;
        const cand = GENERATORS[cat](forceType, effectiveRanges);
        const w = weightOf(cand);
        if (w > bestW) { bestW = w; bestQ = cand; }
      }
      q = bestQ;
    } else {
      q = GENERATORS[cat](forceType, effectiveRanges);
    }
    autoFocusRef.current = !!focusAfter;
    questionStartRef.current = Date.now();
    setQuestion(q);
    setSelected(null);
    setFillValue("");
    setFeedback(null);
  }, [pickCategory, weakMode, answerMode, ranges, adaptiveOn, adaptiveState, spacedRepOn, srs]);

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
    recordQuestionOutcome(question, correct, elapsedMs);
    const nextStats = recordAnswer(stats, question.category, question.key, correct, elapsedMs);
    setStats(nextStats);
    persist(nextStats);
    const nextHistory = recordDailyHistory(history, correct);
    setHistory(nextHistory);

    if (adaptiveOn) {
      setAdaptiveState((prev) => recordAdaptiveOutcome(prev, question.category, correct));
    }
    if (spacedRepOn) {
      setSrs((prev) => recordSRSOutcome(prev, question.category, question.key, correct));
    }

    const newStreak = correct ? session.streak + 1 : 0;
    let newBestStreakEver = bestStreakEver;
    if (newStreak > bestStreakEver) {
      newBestStreakEver = newStreak;
      setBestStreakEver(newStreak);
      try { window.localStorage.setItem(pkey("buddhidrill-best-streak"), String(newStreak)); } catch { /* ignore */ }
    }
    setSession((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
      streak: newStreak,
      best: Math.max(s.best, newStreak),
    }));

    const newXP = awardXP(correct, newStreak);
    runBadgeCheck({
      stats: nextStats, history: nextHistory, bestStreakEver: newBestStreakEver, level: levelFromXP(newXP),
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
        try { window.localStorage.setItem(pkey(`buddhidrill-highscore-${gameDuration}`), String(tally.correct)); } catch { /* ignore */ }
        fireConfetti();
        playNewBest(soundOn);
      }
      return tally;
    });
    runBadgeCheck({ stats, history, bestStreakEver, level: xpProgress.level });
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
    const nextHistory = recordDailyHistory(history, correct);
    setHistory(nextHistory);

    const newStreak = correct ? gameTally.streak + 1 : 0;
    const newXP = awardXP(correct, newStreak);
    runBadgeCheck({
      stats: nextStats, history: nextHistory, bestStreakEver, level: levelFromXP(newXP),
    });

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
    clearAbandonWatch();
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

      // Opponent side: if the host's connection has been down for longer
      // than the grace period, treat the room as abandoned and clean it
      // up. A short blip won't reach this — the host's own reconnect
      // effect clears the marker as soon as it's back online, well before
      // the grace window elapses.
      const amHost = val.hostId === playerId;
      if (!amHost && val.hostDisconnectedAt) {
        if (!battleAbandonCheckRef.current) {
          battleAbandonCheckRef.current = setInterval(() => {
            const room = battleRoomRef.current;
            if (!room || !room.hostDisconnectedAt) { clearAbandonWatch(); return; }
            const elapsed = Date.now() - room.hostDisconnectedAt;
            if (elapsed > HOST_DISCONNECT_GRACE_MS && !battleAbandonHandledRef.current) {
              battleAbandonHandledRef.current = true;
              clearAbandonWatch();
              remove(ref(db, `rooms/${code}`)).catch(() => {});
              if (battleUnsubRef.current) { battleUnsubRef.current(); battleUnsubRef.current = null; }
              setBattleRoom(null);
              setBattleCode("");
              setBattleQuestions(null);
              setBattleError("Your opponent lost connection, so the room was closed.");
              setBattleStage("menu");
            }
          }, 5000);
        }
      } else if (battleAbandonCheckRef.current) {
        clearAbandonWatch();
      }
    });
  }

  async function handleCreateRoom() {
    const db = getFirebaseDb();
    if (!db) { setBattleError("Battle Mode isn't configured yet — see the Firebase setup notes."); return; }
    const name = playerName.trim().slice(0, 16) || "Player 1";
    try { window.localStorage.setItem(pkey("buddhidrill-name"), name); } catch { /* ignore */ }
    setBattleError("");
    setBattleBusy(true);
    try {
      const uid = await ensureFirebaseAuth();
      if (!uid) { setBattleError("Couldn't verify your device for Battle Mode. Check your connection and try again."); setBattleBusy(false); return; }
      setPlayerId(uid);
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
        hostId: uid,
        hostDisconnectedAt: null,
        duration: battleDuration,
        settings: { categories: activeCats, ranges: battleRanges, answerMode: battleAnswerMode, difficultyLabel: battleDifficultyLabel },
        seed: null,
        startAt: null,
        players: {
          [uid]: { name, isHost: true, score: { correct: 0, wrong: 0 }, finishedAt: null, joinedAt: Date.now() },
        },
      };
      await set(ref(db, `rooms/${code}`), roomData);
      onDisconnect(ref(db, `rooms/${code}/players/${uid}`)).remove();
      onDisconnect(ref(db, `rooms/${code}/hostDisconnectedAt`)).set(serverTimestamp());
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
    const code = joinCodeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 4) { setBattleError("Enter the room code your friend shared with you."); return; }
    const name = playerName.trim().slice(0, 16) || "Player 2";
    try { window.localStorage.setItem(pkey("buddhidrill-name"), name); } catch { /* ignore */ }
    setBattleError("");
    setBattleBusy(true);
    try {
      const uid = await ensureFirebaseAuth();
      if (!uid) { setBattleError("Couldn't verify your device for Battle Mode. Check your connection and try again."); setBattleBusy(false); return; }
      setPlayerId(uid);
      const snap = await get(ref(db, `rooms/${code}`));
      if (!snap.exists()) { setBattleError("No room found with that code."); setBattleBusy(false); return; }
      const room = snap.val();
      if (room.status !== "waiting") { setBattleError("That room already started — ask for a new code."); setBattleBusy(false); return; }
      const existingCount = room.players ? Object.keys(room.players).length : 0;
      if (existingCount >= 2) { setBattleError("That room is already full."); setBattleBusy(false); return; }

      await update(ref(db, `rooms/${code}/players/${uid}`), {
        name, isHost: false, score: { correct: 0, wrong: 0 }, finishedAt: null, joinedAt: Date.now(),
      });
      onDisconnect(ref(db, `rooms/${code}/players/${uid}`)).remove();
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
    const nextHistory = recordDailyHistory(history, correct);
    setHistory(nextHistory);

    const newXP = awardXP(correct, 0); // Battle doesn't track a live streak yet, so no combo bonus here
    runBadgeCheck({
      stats: nextStats, history: nextHistory, bestStreakEver, level: levelFromXP(newXP),
    });

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
    clearAbandonWatch();
    const db = getFirebaseDb();
    if (db && battleCode) {
      // cancel any pending onDisconnect ops for this device — we're leaving
      // on purpose right now, so we don't want a deferred one firing later
      // (e.g. re-creating a stray hostDisconnectedAt node under an
      // already-deleted room)
      onDisconnect(ref(db, `rooms/${battleCode}/players/${playerId}`)).cancel().catch(() => {});
      onDisconnect(ref(db, `rooms/${battleCode}/hostDisconnectedAt`)).cancel().catch(() => {});
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
    setXp(0);
    setUnlockedBadges([]);
    setThemeId("classic");
    setBossCleared(false);
    setGameBest(0);
    try {
      window.localStorage.removeItem("buddhidrill-history");
      window.localStorage.removeItem("buddhidrill-best-streak");
      window.localStorage.removeItem("buddhidrill-xp");
      window.localStorage.removeItem("buddhidrill-badges");
      window.localStorage.removeItem("buddhidrill-theme");
      window.localStorage.removeItem("buddhidrill-boss-cleared");
      // sweep every per-duration Game Mode high score (buddhidrill-highscore-30,
      // -60, -90, ...) instead of hardcoding durations, so this stays correct
      // if more durations get added later
      const keysToRemove = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith("buddhidrill-highscore-")) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch { /* ignore */ }
  }

  function confirmReset() {
    handleReset();
    setShowResetConfirm(false);
  }

  function toggleCategory(cat) { makeToggleCategory(setActive)(cat); }

  const applyDifficulty = (...args) => { preAdaptiveLabelRef.current = null; makeApplyDifficulty(setRanges, setDifficultyLabel)(...args); };
  const updateRangePair = (...args) => { preAdaptiveLabelRef.current = null; makeUpdateRangePair(setRanges, setDifficultyLabel)(...args); };
  const updateSingleValue = (...args) => { preAdaptiveLabelRef.current = null; makeUpdateSingleValue(setRanges, setDifficultyLabel)(...args); };

  // regenerate the question when settings change (category toggle, difficulty,
  // custom ranges, answer mode) — never auto-focus here, this isn't the user
  // asking to move to the next question, just a settings tweak
  useEffect(() => {
    if (loaded) nextQuestion(stats, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, answerMode, ranges]);

  const accuracyPct = session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0;

  // Practice Plan (Phase 4) — recomputed whenever stats/srs change, cheap enough
  // not to need memoization at this data size
  const practicePlan = buildPracticePlan(stats, srs);
  const hasAnyStatsData = allTimeSummary(stats).total > 0;

  function startPracticePlan() {
    const next = {};
    for (const cat of CATEGORY_ORDER) next[cat] = practicePlan.categories.includes(cat);
    setActive(next);
    setWeakMode(true);
    if (!spacedRepOn) { setSpacedRepOn(true); saveSpacedRepOnPref(true); }
    setAppMode("practice");
  }

  // Practice/Learn are the only modes that show their running score inline
  // as you go — Game/Mock/Boss/Battle/Team/Daily are all "reveal at the end"
  // by design, so the always-on header stamp + sticky HUD only make sense here.
  const showLiveSessionStats = appMode === "practice" || appMode === "learn";

  return (
    <div
      style={{ ...styles.page, background: theme.bg, "--bd-accent": theme.accent }}
      className={`bd-page${theme.light ? " bd-light" : ""}${bigText ? " bd-big-text" : ""}`}
    >
      <style>{FONT_IMPORT + GLOBAL_CSS}</style>
      {showOnboarding && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          initialName={hasSavedProfiles() ? (profiles.find((p) => p.id === activeProfileId) || {}).name : ""}
        />
      )}
      {showConfetti && <Confetti />}
      {currentBadgeToast && <BadgeUnlockToast badge={currentBadgeToast} />}
      {shareCardData && <ShareCardModal cardData={shareCardData} onClose={() => setShareCardData(null)} />}

      <div style={styles.wrap} className="bd-wrap">
        {/* ADMIT-CARD HEADER */}
        <header style={styles.header} className="bd-header">
          <div style={styles.headerLeft} className="bd-header-left">
            <div style={styles.eyebrow}>LOGIKS · BRAIN GAMES</div>
            <h1 style={styles.title}>Logiks</h1>
            <div style={styles.subtitle}>A playful daily workout for your math &amp; memory</div>
          </div>
          <div style={styles.stampBox} className="bd-stamp">
            {/* Practice/Learn's own running score, accuracy, and streak —
                everywhere else (Game, Mock, Boss, Battle, Team...) has its
                own results screen and reveals its numbers only once that
                round is over, so this would otherwise show stale Practice
                numbers alongside an in-progress Battle/Mock/etc. */}
            {showLiveSessionStats && (
              <>
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
              </>
            )}
            <XPBar level={xpProgress.level} into={xpProgress.into} need={xpProgress.need} pct={xpProgress.pct} />
            <button
              onClick={toggleSound}
              style={styles.soundToggleBtn}
              className="bd-sound-toggle"
              title={soundOn ? "Mute sound effects" : "Unmute sound effects"}
              type="button"
            >
              {soundOn ? "🔊 Sound on" : "🔇 Sound off"}
            </button>
          </div>
        </header>

        {/* PROFILE SWITCHER — Phase 6 item 25 */}
        <ProfileSwitcher
          profiles={profiles}
          activeId={activeProfileId}
          onSwitch={switchProfile}
          onCreate={handleCreateProfile}
          onRename={handleRenameProfile}
          onDelete={handleDeleteProfile}
          onSetAvatar={handleSetProfileAvatar}
        />

        {/* STICKY HUD — Practice/Learn only (score, streak, combo, XP).
            Timed/competitive modes keep their own in-panel counters and
            reveal full stats on their results screen instead. */}
        {showLiveSessionStats && (
          <StickyHUD
            correct={session.correct}
            total={session.total}
            streak={session.streak}
            best={session.best}
            multiplier={comboMultiplier(session.streak)}
            level={xpProgress.level}
            into={xpProgress.into}
            need={xpProgress.need}
            pct={xpProgress.pct}
          />
        )}

        {/* APP MODE — a wrapping grid instead of a horizontal-scroll strip,
            so every mode is visible at a glance on mobile with no side
            scrolling. Boss Level lives in its own banner below, not here —
            it's a one-off challenge, not a mode you switch between. */}
        <div style={styles.modeRow}>
          <span style={styles.modeLabel} className="bd-mode-label">Mode:</span>
          <div style={styles.modeGrid} className="bd-mode-grid">
            {[
              { id: "practice", icon: "📖", label: "Practice" },
              { id: "learn", icon: "🧠", label: "Learn" },
              { id: "mocktest", icon: "📝", label: "Mock Test" },
              { id: "game", icon: "🎮", label: "Game" },
              { id: "battle", icon: "⚔️", label: "Battle" },
              { id: "team", icon: "🧑‍🤝‍🧑", label: "Team" },
              { id: "daily", icon: "🗓️", label: "Daily" },
              { id: "leaderboard", icon: "🏆", label: "Leaders" },
              { id: "progress", icon: "📊", label: "Progress" },
            ].map((opt) => {
              const on = appMode === opt.id;
              return (
                <button
                  key={opt.id}
                  data-active={on ? "true" : "false"}
                  onClick={() => { setAppMode(opt.id); setShowResetConfirm(false); }}
                  style={{
                    ...styles.modeGridBtn,
                    borderColor: on ? "#E8B23D" : "#3E566B",
                    background: on ? "#E8B23D" : "transparent",
                    color: on ? "#0B1929" : "#93A6B8",
                  }}
                >
                  <span style={styles.modeGridIcon}>{opt.icon}</span>
                  <span style={{ ...styles.modeGridLabel, fontWeight: on ? 700 : 600 }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BOSS LEVEL — a standalone one-time challenge, deliberately kept
            out of the mode grid above. Clearing it awards the Boss Slayer
            badge; future badge-gated challenges can live in this same spot. */}
        {appMode !== "boss" && (
          <button
            type="button"
            onClick={() => { setAppMode("boss"); setShowResetConfirm(false); }}
            style={styles.bossBanner}
            className="bd-boss-banner"
          >
            <span style={styles.bossBannerIcon}>🐉</span>
            <span style={styles.bossBannerText}>
              <span style={styles.bossBannerTitle} className="bd-boss-banner-title">Boss Challenge</span>
              <span style={styles.bossBannerSub}>
                {bossCleared ? "Cleared — replay it any time" : `Beat ${BOSS_TARGET} in ${BOSS_DURATION}s for a badge`}
              </span>
            </span>
            {bossCleared && <span style={styles.bossBannerBadge}>✓ Cleared</span>}
          </button>
        )}

        {appMode === "practice" && (
        <>
        {/* PRACTICE PLAN */}
        <PracticePlanCard plan={practicePlan} onStart={startPracticePlan} hasAnyData={hasAnyStatsData} />

        {/* CATEGORY TOGGLES */}
        <CategoryPicker categories={CATEGORY_ORDER} meta={CATEGORY_META} active={active} onToggle={toggleCategory} />

        <div style={styles.smartPracticeCard} className="bd-smart-practice-card">
          <div style={styles.smartPracticeTitle}>SMART PRACTICE</div>
          <SmartToggleRow
            icon="🧠"
            title="Adaptive difficulty"
            description="Quietly widens or narrows question ranges based on your recent accuracy per category."
            on={adaptiveOn}
            onToggle={toggleAdaptive}
          />
          <SmartToggleRow
            icon="⏱️"
            title="Spaced repetition"
            description="Prioritizes items that are due for review on a spaced-repetition schedule."
            on={spacedRepOn}
            onToggle={toggleSpacedRep}
          />
          <SmartToggleRow
            icon="🎯"
            title="Focus weak spots"
            description="Bias questions toward the numbers you get wrong most, or answer slowest."
            on={weakMode}
            onToggle={() => setWeakMode((w) => !w)}
          />
        </div>

        {/* ANSWER MODE TOGGLE */}
        <div style={styles.modeRow}>
          <span style={styles.modeLabel}>Question type:</span>
          <div style={styles.segmentGroup} className="bd-segment-scroll">
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
          <div style={styles.segmentGroup} className="bd-segment-scroll">
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
            <QuestionDifficultyBadge question={question} />
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

        {appMode === "learn" && (
          <LearnPanel
            active={active}
            toggleCategory={toggleCategory}
            learnQuestion={learnQuestion}
            learnRevealed={learnRevealed}
            revealLearnAnswer={revealLearnAnswer}
            nextLearnQuestion={nextLearnQuestion}
          />
        )}

        {appMode === "mocktest" && (
          <MockTestPanel
            mockCats={mockCats}
            toggleMockCat={toggleMockCat}
            mockLength={mockLength}
            setMockLength={setMockLength}
            mockStatus={mockStatus}
            setMockStatus={setMockStatus}
            mockIdx={mockIdx}
            mockQuestion={mockQuestion}
            mockFillValue={mockFillValue}
            setMockFillValue={setMockFillValue}
            mockTally={mockTally}
            mockReview={mockReview}
            mockRevealed={mockRevealed}
            skipMockQuestion={skipMockQuestion}
            revealMockAnswer={revealMockAnswer}
            continueAfterMockReveal={continueAfterMockReveal}
            startMockTest={startMockTest}
            submitMockAnswer={submitMockAnswer}
            handleMockFillSubmit={handleMockFillSubmit}
            mockInputRef={mockInputRef}
          />
        )}

        {appMode === "boss" && (
          <BossPanel
            bossStatus={bossStatus}
            bossTimeLeft={bossTimeLeft}
            bossQuestion={bossQuestion}
            bossFillValue={bossFillValue}
            setBossFillValue={setBossFillValue}
            bossTally={bossTally}
            bossCleared={bossCleared}
            startBoss={startBoss}
            submitBossAnswer={submitBossAnswer}
            handleBossFillSubmit={handleBossFillSubmit}
            bossInputRef={bossInputRef}
          />
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
            onShare={setShareCardData}
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

        {appMode === "team" && (
          <TeamPanel playerName={playerName} />
        )}

        {appMode === "daily" && (
          <DailyChallengePanel
            playerName={playerName}
            soundOn={soundOn}
            onAwardXp={(correct) => awardXP(correct, 0)}
            incomingChallenge={incomingChallenge}
            onClearIncoming={() => setIncomingChallenge(null)}
          />
        )}

        {appMode === "leaderboard" && (
          <LeaderboardPanel weeklyScore={weeklyScore} playerName={playerName} />
        )}

        {appMode === "progress" && (
          <ProgressPanel
            stats={stats}
            history={history}
            session={session}
            bestStreakEver={bestStreakEver}
            xpProgress={xpProgress}
            unlockedBadges={unlockedBadges}
            themeId={themeId}
            setTheme={selectTheme}
            adaptiveOn={adaptiveOn}
            adaptiveState={adaptiveState}
          />
        )}

        {appMode === "progress" && (
          <ReminderSettings
            pref={reminderPref}
            permission={notifPermission}
            supported={notificationsSupported()}
            onToggle={toggleReminder}
            onTimeChange={setReminderTime}
            onRequestPermission={handleRequestNotificationPermission}
          />
        )}

        {appMode === "progress" && (
          <SettingsIOPanel
            settingsState={{
              active, ranges, difficultyLabel, answerMode, themeId, soundOn,
              adaptiveOn, spacedRepOn, reminderPref, bigText,
            }}
            onApplyImportedSettings={(s) => {
              if (s.active) setActive(s.active);
              if (s.ranges) setRanges(s.ranges);
              if (s.difficultyLabel) setDifficultyLabel(s.difficultyLabel);
              if (s.answerMode) setAnswerMode(s.answerMode);
              if (s.themeId) selectTheme(s.themeId);
              if (typeof s.soundOn === "boolean") { setSoundOn(s.soundOn); saveSoundPref(s.soundOn); }
              if (typeof s.adaptiveOn === "boolean") { setAdaptiveOn(s.adaptiveOn); saveAdaptiveOnPref(s.adaptiveOn); }
              if (typeof s.spacedRepOn === "boolean") { setSpacedRepOn(s.spacedRepOn); saveSpacedRepOnPref(s.spacedRepOn); }
              if (s.reminderPref) setReminderPref(s.reminderPref);
              if (typeof s.bigText === "boolean") { setBigText(s.bigText); saveBigTextPref(s.bigText); }
            }}
            bigText={bigText}
            onToggleBigText={toggleBigText}
            onExportProgressImage={() => {
              const summary = allTimeSummary(stats);
              setShareCardData({
                title: `Level ${xpProgress.level}`,
                subtitle: "Logiks progress",
                statLines: [
                  { label: "Total answered", value: summary.total },
                  { label: "Accuracy", value: summary.acc !== null ? `${Math.round(summary.acc * 100)}%` : "—" },
                  { label: "Best streak", value: bestStreakEver },
                  { label: "Badges earned", value: unlockedBadges.length },
                ],
              });
            }}
          />
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

              {!showResetConfirm ? (
                <button style={styles.resetBtn} onClick={() => setShowResetConfirm(true)}>Reset all progress</button>
              ) : (
                <div style={styles.resetConfirmBox} className="bd-pop-in">
                  <div style={styles.resetConfirmText}>
                    This permanently erases everything on this device — stats, streaks, XP &amp; level, badges, high scores, and your theme. This can't be undone.
                  </div>
                  <div style={styles.resetConfirmBtns}>
                    <button style={styles.resetConfirmCancelBtn} onClick={() => setShowResetConfirm(false)}>Cancel</button>
                    <button style={styles.resetConfirmYesBtn} onClick={confirmReset}>Yes, erase everything</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        )}

        {/* COMING SOON TEASER */}
        <div style={styles.comingSoonBox}>
          <div style={styles.comingSoonTitle}>🚧 More drills coming to Logiks</div>
          <div style={styles.comingSoonChips}>
            {["Number Series", "Blood Relations", "Direction Sense", "Coding-Decoding"].map((t) => (
              <span key={t} style={styles.comingSoonChip}>{t}</span>
            ))}
          </div>
        </div>

        <footer style={styles.footer}>Logiks — a playful daily workout for your math &amp; memory. Accuracy is tracked per number and saved on this device.</footer>
      </div>
    </div>
  );
}
