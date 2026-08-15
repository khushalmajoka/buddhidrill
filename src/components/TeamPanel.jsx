import { useEffect, useRef, useState } from "react";
import { ref, set, get, update, remove, onValue, onDisconnect, serverTimestamp } from "firebase/database";
import { styles } from "../styles";
import { CATEGORY_META, DIFFICULTY_PRESETS } from "../constants";
import { getFirebaseDb, newRoomCode, ensureFirebaseAuth } from "../firebase";
import { generateBattleQuestions } from "../battle/battleEngine";
import { DAILY_CHALLENGE_CATEGORIES } from "../lib/dailyChallenge";

/* ============================================================
   TEAM / GROUP MODE (Phase 5, item 20)
   Up to several players split across Team A / Team B, all racing
   through the SAME seeded question set for a fixed 60s window (same
   deterministic-seed trick as Battle Mode and Daily Challenge — see
   battle/battleEngine.js). Each player answers independently and as
   fast as they can; each correct answer nudges their own score in the
   shared room, and every client's live team totals update via a
   Realtime Database subscription. Final result = which team scored
   more, combined.

   REQUIRED FIREBASE RULES ADDITION (mirrors the existing `rooms`
   rules for Battle Mode — see setup notes shipped with this update):

   "teamRooms": {
     "$code": {
       ".read": true,
       ".write": "!data.exists() || auth != null",
       "players": {
         "$uid": {
           ".write": "auth != null && auth.uid === $uid"
         }
       }
     }
   }
   ============================================================ */

const TEAM_DURATION = 60;
const TEAM_CATEGORIES = DAILY_CHALLENGE_CATEGORIES;

export default function TeamPanel({ playerName }) {
  const [stage, setStage] = useState("menu"); // menu | join | lobby | playing | results
  const [code, setCode] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [uid, setUid] = useState(null);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TEAM_DURATION);
  const [question, setQuestion] = useState(null);
  const [fillValue, setFillValue] = useState("");
  const questionsRef = useRef([]);
  const qIndexRef = useRef(0);
  const scoreRef = useRef(0);
  const timerRef = useRef(null);
  const roomUnsubRef = useRef(null);
  const codeRef = useRef("");

  const configured = !!getFirebaseDb();

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (roomUnsubRef.current) roomUnsubRef.current();
  }, []);

  function subscribeRoom(roomCode) {
    const db = getFirebaseDb();
    if (roomUnsubRef.current) roomUnsubRef.current();
    roomUnsubRef.current = onValue(ref(db, `teamRooms/${roomCode}`), (snap) => {
      const val = snap.val();
      if (!val) { setRoom(null); return; }
      setRoom(val);
      if (val.status === "playing" && stage !== "playing") setStage("playing");
      if (val.status === "finished" && stage === "playing") setStage("results");
    });
  }

  async function handleCreate() {
    const db = getFirebaseDb();
    if (!db) { setError("Team Mode isn't configured yet — see the Firebase setup notes."); return; }
    setBusy(true); setError("");
    try {
      const id = await ensureFirebaseAuth();
      if (!id) throw new Error("Sign-in failed.");
      setUid(id);
      const roomCode = newRoomCode();
      const seed = Math.floor(Math.random() * 0xffffffff);
      const roomData = {
        hostId: id, seed, status: "lobby", createdAt: serverTimestamp(),
        players: { [id]: { name: (playerName || "Player").slice(0, 16), team: "A", score: 0, joinedAt: Date.now() } },
      };
      await set(ref(db, `teamRooms/${roomCode}`), roomData);
      onDisconnect(ref(db, `teamRooms/${roomCode}/players/${id}`)).remove();
      codeRef.current = roomCode;
      setCode(roomCode);
      subscribeRoom(roomCode);
      setStage("lobby");
    } catch (e) {
      setError(e.message || "Couldn't create a room.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    const db = getFirebaseDb();
    if (!db) { setError("Team Mode isn't configured yet — see the Firebase setup notes."); return; }
    const roomCode = joinInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (roomCode.length < 4) { setError("Enter the room code your friend shared with you."); return; }
    setBusy(true); setError("");
    try {
      const id = await ensureFirebaseAuth();
      if (!id) throw new Error("Sign-in failed.");
      setUid(id);
      const snap = await get(ref(db, `teamRooms/${roomCode}`));
      if (!snap.exists()) throw new Error("No room found with that code.");
      const val = snap.val();
      const teamACount = Object.values(val.players || {}).filter((p) => p.team === "A").length;
      const teamBCount = Object.values(val.players || {}).filter((p) => p.team === "B").length;
      const team = teamACount <= teamBCount ? "A" : "B";
      await update(ref(db, `teamRooms/${roomCode}/players/${id}`), {
        name: (playerName || "Player").slice(0, 16), team, score: 0, joinedAt: Date.now(),
      });
      onDisconnect(ref(db, `teamRooms/${roomCode}/players/${id}`)).remove();
      codeRef.current = roomCode;
      setCode(roomCode);
      subscribeRoom(roomCode);
      setStage("lobby");
    } catch (e) {
      setError(e.message || "Couldn't join that room.");
    } finally {
      setBusy(false);
    }
  }

  function switchTeam(team) {
    const db = getFirebaseDb();
    if (!db || !uid) return;
    update(ref(db, `teamRooms/${codeRef.current}/players/${uid}`), { team }).catch(() => {});
  }

  async function startMatch() {
    const db = getFirebaseDb();
    if (!db || !room) return;
    await update(ref(db, `teamRooms/${codeRef.current}`), { status: "playing", startedAt: serverTimestamp() });
  }

  function finishForMe() {
    const db = getFirebaseDb();
    if (!db || !uid) return;
    update(ref(db, `teamRooms/${codeRef.current}/players/${uid}`), { finishedAt: Date.now() }).then(async () => {
      // if everyone's done (or host), flip the room to finished
      const snap = await get(ref(db, `teamRooms/${codeRef.current}/players`));
      const players = Object.values(snap.val() || {});
      if (players.length && players.every((p) => p.finishedAt)) {
        update(ref(db, `teamRooms/${codeRef.current}`), { status: "finished" }).catch(() => {});
      }
    }).catch(() => {});
  }

  // once status flips to "playing", every client independently builds the
  // same question sequence from the shared seed and starts its own local timer
  useEffect(() => {
    if (stage !== "playing" || !room) return;
    questionsRef.current = generateBattleQuestions(room.seed, TEAM_CATEGORIES, DIFFICULTY_PRESETS.medium, "mixed");
    qIndexRef.current = 0;
    scoreRef.current = 0;
    setQuestion(questionsRef.current[0]);
    setTimeLeft(TEAM_DURATION);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          finishForMe();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, room && room.seed]);

  function submitAnswer(userAnswer) {
    const q = questionsRef.current[qIndexRef.current];
    if (!q) return;
    let correct;
    if (q.type === "mcq") {
      correct = String(userAnswer) === String(q.answer);
    } else {
      const num = Number(String(userAnswer).trim());
      correct = !Number.isNaN(num) && num === q.answer;
    }
    if (correct) {
      scoreRef.current += 1;
      const db = getFirebaseDb();
      if (db && uid) update(ref(db, `teamRooms/${codeRef.current}/players/${uid}`), { score: scoreRef.current }).catch(() => {});
    }
    qIndexRef.current += 1;
    setQuestion(questionsRef.current[qIndexRef.current]);
    setFillValue("");
  }

  function handleFillSubmit(e) {
    e.preventDefault();
    if (fillValue.trim() === "") return;
    submitAnswer(fillValue.trim());
  }

  async function leaveRoom() {
    const db = getFirebaseDb();
    if (db && uid && codeRef.current) {
      remove(ref(db, `teamRooms/${codeRef.current}/players/${uid}`)).catch(() => {});
    }
    if (roomUnsubRef.current) roomUnsubRef.current();
    if (timerRef.current) clearInterval(timerRef.current);
    setStage("menu");
    setRoom(null);
    setCode("");
    codeRef.current = "";
  }

  const players = room ? Object.entries(room.players || {}).map(([id, p]) => ({ id, ...p })) : [];
  const teamATotal = players.filter((p) => p.team === "A").reduce((s, p) => s + (p.score || 0), 0);
  const teamBTotal = players.filter((p) => p.team === "B").reduce((s, p) => s + (p.score || 0), 0);

  return (
    <div style={styles.gamePanel} className="bd-card">
      {!configured && stage === "menu" && (
        <div style={styles.cardHint}>Team Mode needs Firebase configured (same setup as Battle Mode) to sync players.</div>
      )}

      {stage === "menu" && configured && (
        <>
          <div style={styles.gameSetupTitle}>🧑‍🤝‍🧑 Team / Group Mode</div>
          <div style={styles.gameHint}>Split into Team A vs Team B — everyone races the same {TEAM_DURATION}s question set, team scores combine.</div>
          {error && <div style={styles.battleError}>{error}</div>}
          <button style={styles.gameStartBtn} onClick={handleCreate} disabled={busy}>🏁 Create a Room</button>
          <button style={{ ...styles.secondaryBtn, marginTop: 10 }} onClick={() => setStage("join")}>🔑 Join a Room</button>
        </>
      )}

      {stage === "join" && (
        <>
          <div style={styles.gameSetupTitle}>Join a Team Room</div>
          {error && <div style={styles.battleError}>{error}</div>}
          <input
            value={joinInput} onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
            placeholder="ROOM CODE" style={styles.challengeShareInput}
          />
          <div style={styles.gameResultsBtns}>
            <button style={styles.gameStartBtn} onClick={handleJoin} disabled={busy}>Join</button>
            <button style={styles.linkBtn} onClick={() => setStage("menu")}>Back</button>
          </div>
        </>
      )}

      {stage === "lobby" && room && (
        <>
          <div style={styles.gameSetupTitle}>Room {code}</div>
          <div style={styles.gameHint}>Share this code with your friends. Pick a team, then the host starts the match.</div>
          <div style={styles.teamColumns}>
            {["A", "B"].map((team) => (
              <div key={team} style={styles.teamColumn}>
                <div style={styles.progressSectionTitle}>Team {team}</div>
                {players.filter((p) => p.team === team).map((p) => (
                  <div key={p.id} style={styles.leaderboardRow}>
                    <span style={styles.leaderboardName}>{p.name}{p.id === uid ? " (you)" : ""}</span>
                  </div>
                ))}
                {uid && (
                  <button style={styles.secondaryBtn} onClick={() => switchTeam(team)}>Join Team {team}</button>
                )}
              </div>
            ))}
          </div>
          <div style={styles.gameResultsBtns}>
            {uid === room.hostId && <button style={styles.gameStartBtn} onClick={startMatch}>Start Match →</button>}
            <button style={styles.linkBtn} onClick={leaveRoom}>Leave Room</button>
          </div>
        </>
      )}

      {stage === "playing" && question && (
        <>
          <div style={styles.gameTopBar}>
            <span style={{ ...styles.catPill, background: CATEGORY_META[question.category].ink }}>
              {CATEGORY_META[question.category].label}
            </span>
            <span style={styles.gameTimer}>⏱ {timeLeft}s</span>
            <span style={styles.gameScoreLive}>A {teamATotal} — B {teamBTotal}</span>
          </div>
          <div style={styles.gamePromptText} className="bd-prompt">{question.prompt}</div>
          {question.type === "mcq" ? (
            <div style={styles.optionsGrid} className="bd-options-grid">
              {question.options.map((opt, i) => (
                <button key={i} onClick={() => submitAnswer(opt)} style={{ ...styles.optionBtn, background: "#FFFDF7", borderColor: "#D8CFB8", color: "#1F2937" }}>
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleFillSubmit} style={styles.fillRow} className="bd-fill-row">
              <input
                type="text" inputMode="decimal" value={fillValue} onChange={(e) => setFillValue(e.target.value)}
                placeholder="type your answer" className="bd-fill-input" style={{ ...styles.fillInput, borderColor: "#B9AE94" }} autoFocus
              />
              <button type="submit" style={styles.submitBtn} className="bd-submit-btn">Next →</button>
            </form>
          )}
        </>
      )}

      {stage === "results" && room && (
        <div style={styles.gameResults} className="bd-pop-in">
          <div style={styles.gameResultsTitle}>
            {teamATotal === teamBTotal ? "🤝 It's a tie!" : teamATotal > teamBTotal ? "🏆 Team A wins!" : "🏆 Team B wins!"}
          </div>
          <div style={styles.gameResultsScore}>A {teamATotal} — B {teamBTotal}</div>
          <div style={styles.gameResultsCatBreakdown}>
            {players.sort((a, b) => (b.score || 0) - (a.score || 0)).map((p) => (
              <div key={p.id} style={styles.leaderboardRow}>
                <span style={styles.leaderboardName}>Team {p.team} · {p.name}</span>
                <span style={styles.leaderboardScore}>{p.score || 0}</span>
              </div>
            ))}
          </div>
          <div style={styles.gameResultsBtns}>
            <button style={styles.linkBtn} onClick={leaveRoom}>Leave Room</button>
          </div>
        </div>
      )}
    </div>
  );
}
