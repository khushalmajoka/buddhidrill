import { styles } from "../styles";
import { CATEGORY_META } from "../constants";
import SettingsPanel from "./SettingsPanel";

export default function BattlePanel({
  battleStage, setBattleStage, playerId, playerName, setPlayerName,
  joinCodeInput, setJoinCodeInput, battleDuration, setBattleDuration,
  battleError, battleBusy, battleRoom, battleCode, battleQuestions, battleIdx,
  battleSelected, battleFillValue, setBattleFillValue, battleFeedback,
  battleScore, battleTimeLeft, battleCountdown, battleInputRef,
  handleCreateRoom, handleJoinRoom, handleSyncRoomSettings, handleStartBattle,
  handleRematch, handleLeaveRoom, submitBattleAnswer, handleBattleFillSubmit,
  battleActive, toggleBattleCategory, battleRanges, battleAnswerMode, setBattleAnswerMode,
  battleDifficultyLabel, applyBattleDifficulty, updateBattleRangePair, updateBattleSingleValue,
  battleShowCustomize, setBattleShowCustomize,
}) {
  const players = (battleRoom && battleRoom.players) || {};
  const playerIds = Object.keys(players);
  const me = players[playerId];
  const opponentId = playerIds.find((id) => id !== playerId);
  const opponent = opponentId ? players[opponentId] : null;
  const isHost = !!(me && me.isHost) || (battleRoom && battleRoom.hostId === playerId);
  const roomCatLabels = battleRoom && battleRoom.settings
    ? battleRoom.settings.categories.map((c) => CATEGORY_META[c].label)
    : [];

  return (
    <div style={styles.gamePanel} className="bd-card">

      {battleStage === "menu" && (
        <>
          <div style={styles.gameSetupTitle}>⚔️ Battle a friend</div>
          <div style={styles.battleNameRow}>
            <span style={styles.rangeLabel}>Your name</span>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Khushal"
              maxLength={16}
              style={styles.rangeInput}
              className="bd-fill-input"
            />
          </div>
          {battleError && <div style={styles.battleError}>{battleError}</div>}
          <div style={styles.battleMenuBtns}>
            <button style={styles.gameStartBtn} onClick={() => setBattleStage("create")}>Create Room</button>
            <button style={styles.battleSecondaryBtn} onClick={() => setBattleStage("join")}>Join Room</button>
          </div>
          <div style={styles.gameHint}>Same questions, same order, same timer — whoever gets more right wins.</div>
        </>
      )}

      {battleStage === "create" && (
        <>
          <div style={styles.gameSetupTitle}>Create a room</div>
          <div style={styles.battleNameRow}>
            <span style={styles.rangeLabel}>Your name</span>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Khushal"
              maxLength={16}
              style={styles.rangeInput}
              className="bd-fill-input"
            />
          </div>

          <div style={styles.battleSettingsSummary}>
            <div style={styles.rangeLabel}>Battle settings</div>
            <SettingsPanel
              active={battleActive}
              onToggle={toggleBattleCategory}
              answerMode={battleAnswerMode}
              onSetAnswerMode={setBattleAnswerMode}
              difficultyLabel={battleDifficultyLabel}
              onApplyDifficulty={applyBattleDifficulty}
              ranges={battleRanges}
              onUpdateRangePair={updateBattleRangePair}
              onUpdateSingleValue={updateBattleSingleValue}
              showCustomize={battleShowCustomize}
              onToggleCustomize={() => setBattleShowCustomize((s) => !s)}
            />
          </div>

          <div style={styles.gameDurationRow}>
            <span style={styles.modeLabel}>Battle length:</span>
            <div style={styles.segmentGroup}>
              {[30, 60, 90, 120, 180].map((d) => (
                <button
                  key={d}
                  onClick={() => setBattleDuration(d)}
                  style={{
                    ...styles.segmentBtn,
                    background: battleDuration === d ? "#E8B23D" : "transparent",
                    color: battleDuration === d ? "#0B1929" : "#93A6B8",
                    fontWeight: battleDuration === d ? 700 : 500,
                  }}
                >
                  {d < 60 ? `${d}s` : `${d / 60}m`}
                </button>
              ))}
            </div>
          </div>

          {battleError && <div style={styles.battleError}>{battleError}</div>}
          <div style={styles.battleMenuBtns}>
            <button style={styles.gameStartBtn} disabled={battleBusy} onClick={handleCreateRoom}>
              {battleBusy ? "Creating…" : "Create Room →"}
            </button>
            <button style={styles.linkBtn} onClick={() => setBattleStage("menu")}>← Back</button>
          </div>
        </>
      )}

      {battleStage === "join" && (
        <>
          <div style={styles.gameSetupTitle}>Join a room</div>
          <div style={styles.battleNameRow}>
            <span style={styles.rangeLabel}>Your name</span>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Khushal"
              maxLength={16}
              style={styles.rangeInput}
              className="bd-fill-input"
            />
          </div>
          <div style={styles.battleNameRow}>
            <span style={styles.rangeLabel}>Room code</span>
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. K7QXM"
              maxLength={6}
              style={{ ...styles.rangeInput, letterSpacing: "0.15em", fontWeight: 700 }}
              className="bd-fill-input"
            />
          </div>
          {battleError && <div style={styles.battleError}>{battleError}</div>}
          <div style={styles.battleMenuBtns}>
            <button style={styles.gameStartBtn} disabled={battleBusy} onClick={handleJoinRoom}>
              {battleBusy ? "Joining…" : "Join Room →"}
            </button>
            <button style={styles.linkBtn} onClick={() => setBattleStage("menu")}>← Back</button>
          </div>
        </>
      )}

      {battleStage === "lobby" && battleRoom && (
        <>
          <div style={styles.gameSetupTitle}>Room code</div>
          <div style={styles.battleCodeDisplay}>{battleCode}</div>
          <div style={styles.gameHint}>Share this code with your friend — they tap "Join Room" and type it in.</div>

          <div style={styles.battlePlayersRow}>
            <div style={styles.battlePlayerCard}>
              <div style={styles.battlePlayerName}>{me ? me.name : playerName || "You"} {isHost && "👑"}</div>
              <div style={styles.gameHint}>You</div>
            </div>
            <div style={styles.battleVs}>VS</div>
            <div style={styles.battlePlayerCard}>
              {opponent ? (
                <>
                  <div style={styles.battlePlayerName}>{opponent.name} {opponent.isHost && "👑"}</div>
                  <div style={styles.gameHint}>Ready</div>
                </>
              ) : (
                <div style={styles.gameHint}>Waiting for a friend…</div>
              )}
            </div>
          </div>

          <div style={styles.battleSettingsSummary}>
            <div style={styles.rangeLabel}>Current room settings</div>
            <div style={styles.battleTagRow}>
              {roomCatLabels.map((l) => <span key={l} style={styles.battleTag}>{l}</span>)}
            </div>
            <div style={styles.gameHint}>
              Difficulty: {battleRoom.settings.difficultyLabel} · Mode: {battleRoom.settings.answerMode} · Length: {battleRoom.duration}s
            </div>
          </div>

          {isHost ? (
            <>
              <div style={styles.battleSettingsSummary}>
                <div style={styles.rangeLabel}>Edit settings (only you can see this until you update or start)</div>
                <SettingsPanel
                  active={battleActive}
                  onToggle={toggleBattleCategory}
                  answerMode={battleAnswerMode}
                  onSetAnswerMode={setBattleAnswerMode}
                  difficultyLabel={battleDifficultyLabel}
                  onApplyDifficulty={applyBattleDifficulty}
                  ranges={battleRanges}
                  onUpdateRangePair={updateBattleRangePair}
                  onUpdateSingleValue={updateBattleSingleValue}
                  showCustomize={battleShowCustomize}
                  onToggleCustomize={() => setBattleShowCustomize((s) => !s)}
                />
              </div>
              <div style={styles.gameDurationRow}>
                <span style={styles.modeLabel}>Battle length:</span>
                <div style={styles.segmentGroup}>
                  {[30, 60, 90, 120, 180].map((d) => (
                    <button
                      key={d}
                      onClick={() => setBattleDuration(d)}
                      style={{
                        ...styles.segmentBtn,
                        background: battleDuration === d ? "#E8B23D" : "transparent",
                        color: battleDuration === d ? "#0B1929" : "#93A6B8",
                        fontWeight: battleDuration === d ? 700 : 500,
                      }}
                    >
                      {d < 60 ? `${d}s` : `${d / 60}m`}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.battleMenuBtns}>
                <button style={styles.battleSecondaryBtn} onClick={handleSyncRoomSettings}>
                  Update Room (let your friend see these settings now)
                </button>
              </div>
              <button
                style={{ ...styles.gameStartBtn, opacity: opponent ? 1 : 0.5 }}
                disabled={!opponent}
                onClick={handleStartBattle}
              >
                {opponent ? "Start Battle →" : "Waiting for a player…"}
              </button>
            </>
          ) : (
            <div style={{ ...styles.gameHint, textAlign: "center", marginTop: 16 }}>
              Waiting for the host to start the battle…
            </div>
          )}

          <button style={styles.linkBtn} onClick={handleLeaveRoom}>Leave Room</button>
        </>
      )}

      {battleStage === "countdown" && (
        <div style={styles.gameResults}>
          <div style={styles.gameResultsTitle}>Get ready!</div>
          <div style={styles.battleCountdownNum}>{battleCountdown || "GO"}</div>
          <div style={styles.gameHint}>Same questions, same order — go!</div>
        </div>
      )}

      {battleStage === "playing" && battleQuestions && (() => {
        const q = battleQuestions[battleIdx % battleQuestions.length];
        return (
          <>
            <div style={styles.gameTopBar}>
              <span style={{ ...styles.catPill, background: CATEGORY_META[q.category].ink }}>
                {CATEGORY_META[q.category].label}
              </span>
              <span style={styles.gameTimer}>⏱ {battleTimeLeft}s</span>
            </div>

            <div style={styles.battleScoreRow}>
              <div style={styles.battleScoreBox}>
                <div style={styles.gameHint}>You</div>
                <div style={styles.battleScoreNum}>{battleScore.correct}</div>
              </div>
              <div style={styles.battleScoreBox}>
                <div style={styles.gameHint}>{opponent ? opponent.name : "Opponent"}</div>
                <div style={styles.battleScoreNum}>{opponent && opponent.score ? opponent.score.correct : 0}</div>
              </div>
            </div>

            <div style={styles.gamePromptText} className="bd-prompt">{q.prompt}</div>

            {q.type === "mcq" ? (
              <div style={styles.optionsGrid} className="bd-options-grid">
                {q.options.map((opt, i) => {
                  const isSelected = battleSelected !== null && String(opt) === String(battleSelected);
                  const isCorrectOpt = battleFeedback && String(opt) === String(q.answer);
                  let bg = "#FFFDF7", border = "#D8CFB8", color = "#1F2937";
                  if (battleFeedback) {
                    if (isCorrectOpt) { bg = "#E4F0E9"; border = "#1F6F5C"; color = "#1F6F5C"; }
                    else if (isSelected) { bg = "#F6E4E1"; border = "#C0392B"; color = "#C0392B"; }
                  }
                  return (
                    <button
                      key={i}
                      disabled={!!battleFeedback}
                      onClick={() => submitBattleAnswer(opt)}
                      style={{ ...styles.optionBtn, background: bg, borderColor: border, color }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={handleBattleFillSubmit} style={styles.fillRow} className="bd-fill-row">
                <input
                  ref={battleInputRef}
                  type="text"
                  inputMode={q.inputMode === "text" ? "text" : "decimal"}
                  value={battleFillValue}
                  disabled={!!battleFeedback}
                  onChange={(e) => setBattleFillValue(e.target.value)}
                  placeholder={q.placeholder || "type your answer"}
                  className="bd-fill-input"
                  style={{
                    ...styles.fillInput,
                    borderColor: battleFeedback === "correct" ? "#1F6F5C" : battleFeedback === "wrong" ? "#C0392B" : "#B9AE94",
                  }}
                />
                <button type="submit" disabled={!!battleFeedback} style={styles.submitBtn} className="bd-submit-btn">Check</button>
              </form>
            )}

            {battleFeedback && (
              <div style={{
                ...styles.feedbackBar,
                background: battleFeedback === "correct" ? "#E4F0E9" : "#F6E4E1",
                color: battleFeedback === "correct" ? "#1F6F5C" : "#C0392B",
              }}>
                {battleFeedback === "correct" ? "✓ Correct" : `✕ answer: ${q.answer}`}
              </div>
            )}
          </>
        );
      })()}

      {battleStage === "results" && (
        <div style={styles.gameResults}>
          <div style={styles.gameResultsTitle}>⏹ Battle over!</div>
          <div style={styles.battleResultsRow}>
            <div style={styles.battleResultBox}>
              <div style={styles.gameHint}>You</div>
              <div style={styles.gameResultsScore}>{battleScore.correct}</div>
            </div>
            <div style={styles.battleVs}>VS</div>
            <div style={styles.battleResultBox}>
              <div style={styles.gameHint}>{opponent ? opponent.name : "Opponent"}</div>
              <div style={styles.gameResultsScore}>{opponent && opponent.score ? opponent.score.correct : 0}</div>
            </div>
          </div>

          {(() => {
            const oppCorrect = opponent && opponent.score ? opponent.score.correct : 0;
            if (!opponent) return <div style={styles.gameHint}>Waiting for opponent's final score…</div>;
            if (battleScore.correct > oppCorrect) return <div style={styles.gameNewBest}>🏆 You win!</div>;
            if (battleScore.correct < oppCorrect) return <div style={styles.battleLoseText}>{opponent.name} wins this one</div>;
            return <div style={styles.gameNewBest}>🤝 It's a tie!</div>;
          })()}

          {opponent && !opponent.finishedAt && (
            <div style={{ ...styles.gameHint, marginTop: 8 }}>{opponent.name} is still finishing up — score above updates live.</div>
          )}

          <div style={styles.gameResultsBtns}>
            {isHost && <button style={styles.gameStartBtn} onClick={handleRematch}>Rematch</button>}
            <button style={styles.linkBtn} onClick={handleLeaveRoom}>Leave Room</button>
          </div>
        </div>
      )}
    </div>
  );
}
