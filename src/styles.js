/* ============================================================
   STYLE TOKENS — plain inline-style objects (no CSS-in-JS lib) plus
   the small chunk of real CSS needed for @media rules and the font
   import, injected via a <style> tag in App.jsx.
   ============================================================ */

export const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');`;

export const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  input::placeholder { color: #A79A7C; }
  button { cursor: pointer; font-family: inherit; }
  button:disabled { cursor: default; }

  /* ---- Segmented control / tab-bar overflow guard ----
     Several controls (mode nav, duration pickers, difficulty toggles) are
     single-row flex "pills" sized by their content. With enough options
     (e.g. the 7-item mode nav) they're wider than a phone screen — this
     turns them into a horizontally-scrollable strip instead of blowing
     out the page width and forcing the whole app to scroll sideways. */
  .bd-segment-scroll {
    overflow-x: auto;
    max-width: 100%;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .bd-segment-scroll::-webkit-scrollbar { display: none; }
  .bd-segment-scroll > button,
  .bd-segment-scroll > span {
    flex-shrink: 0;
  }

  /* ---- Mobile responsiveness ---- */
  @media (max-width: 640px) {
    .bd-page { padding: 18px 10px 44px !important; }
    .bd-wrap { padding-left: 2px; padding-right: 2px; }

    .bd-header {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 14px !important;
    }
    .bd-header-left {
      flex: none !important;
    }
    .bd-stamp {
      min-width: 0 !important;
      width: 100% !important;
    }

    .bd-card {
      padding: 16px 14px 16px !important;
    }

    .bd-prompt {
      padding: 14px 4px 18px !important;
    }

    .bd-options-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 8px !important;
    }

    .bd-fill-row {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    .bd-fill-input {
      width: 100% !important;
      font-size: 16px !important;
    }
    .bd-submit-btn {
      width: 100% !important;
    }

    /* comfortable tap targets on touchscreens (44px is the usual iOS/Android
       guideline) — bump the compact desktop padding up a little */
    .bd-segment-scroll > button {
      padding: 9px 15px !important;
    }
    .bd-tap-target {
      min-height: 44px !important;
    }

    .bd-sticky-hud {
      gap: 8px !important;
      padding: 8px 10px !important;
      font-size: 11px !important;
    }
    .bd-sticky-hud .bd-hud-divider {
      display: none !important;
    }
  }

  @media (max-width: 400px) {
    .bd-options-grid {
      grid-template-columns: 1fr !important;
    }
  }

  /* ---- Micro-animations ---- */
  @keyframes bd-confetti-fall {
    0% { transform: translate(0, 0) rotate(0deg); opacity: 0.95; }
    100% { transform: translate(var(--bd-drift, 0px), 110vh) rotate(540deg); opacity: 0; }
  }
  @keyframes bd-pop-in {
    0% { transform: scale(0.7); opacity: 0; }
    60% { transform: scale(1.08); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  .bd-pop-in { animation: bd-pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

  @keyframes bd-pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(232,178,61,0.55); }
    50% { box-shadow: 0 0 0 10px rgba(232,178,61,0); }
  }
  .bd-pulse-glow { animation: bd-pulse-glow 1.1s ease-out 2; }
`;

export const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(1200px 600px at 10% -10%, #16273D 0%, #0B1929 55%, #081422 100%)",
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: "28px 16px 60px",
    color: "#E7E1D3",
  },
  wrap: { maxWidth: 880, margin: "0 auto" },

  header: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: "2px dashed #33465B",
    paddingBottom: 18,
    marginBottom: 20,
  },
  headerLeft: { flex: "1 1 260px" },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.18em",
    color: "var(--bd-accent, #E8B23D)",
    marginBottom: 6,
    fontWeight: 600,
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "clamp(28px, 5vw, 40px)",
    fontWeight: 700,
    margin: 0,
    color: "#F4EFE3",
    letterSpacing: "-0.01em",
  },
  subtitle: { fontSize: 13, color: "#93A6B8", marginTop: 6 },

  stampBox: {
    border: "2px solid var(--bd-accent, #E8B23D)",
    borderRadius: 10,
    padding: "10px 16px",
    background: "rgba(232,178,61,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 190,
  },
  stampRow: { display: "flex", justifyContent: "space-between", gap: 14, fontFamily: "'JetBrains Mono', monospace" },
  stampLabel: { fontSize: 10, letterSpacing: "0.1em", color: "#93A6B8" },
  stampVal: { fontSize: 14, fontWeight: 700, color: "#F4EFE3" },
  stampSub: { fontSize: 10, color: "#93A6B8", fontWeight: 500 },
  soundToggleBtn: {
    marginTop: 4,
    alignSelf: "flex-start",
    background: "transparent",
    border: "1.5px solid #3E566B",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 10.5,
    fontWeight: 600,
    color: "#93A6B8",
  },

  /* ---- Sticky HUD (always visible while playing) ---- */
  stickyHud: {
    position: "sticky",
    top: 0,
    zIndex: 40,
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
    background: "rgba(11,25,41,0.92)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    border: "1.5px solid var(--bd-accent, #E8B23D)",
    borderRadius: 12,
    padding: "10px 16px",
    marginBottom: 20,
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
  },
  hudItem: { display: "flex", flexDirection: "column", gap: 2, fontFamily: "'JetBrains Mono', monospace" },
  hudLabel: { fontSize: 9.5, letterSpacing: "0.08em", color: "#93A6B8", whiteSpace: "nowrap" },
  hudValue: { fontSize: 14, fontWeight: 700, color: "#F4EFE3", whiteSpace: "nowrap" },
  hudSub: { fontSize: 10, color: "#93A6B8", fontWeight: 500 },
  hudDivider: { width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.12)" },
  hudXpTrack: { height: 5, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden", marginTop: 3, minWidth: 90 },
  hudXpFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, var(--bd-accent, #E8B23D), #F4D06F)",
    transition: "width 0.3s ease",
  },

  chipsRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20, alignItems: "center" },
  chip: {
    border: "1.5px solid",
    borderRadius: 999,
    padding: "7px 14px",
    fontSize: 12.5,
    fontWeight: 600,
    background: "transparent",
    transition: "all 0.15s ease",
  },
  chipTag: { fontFamily: "'JetBrains Mono', monospace", marginRight: 4, opacity: 0.85 },

  modeRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  modeLabel: { fontSize: 12.5, color: "#93A6B8", fontWeight: 600 },
  segmentGroup: {
    display: "flex",
    border: "1.5px solid #3E566B",
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  segmentBtn: {
    border: "none",
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 12.5,
    background: "transparent",
  },

  customizePanel: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #233448",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  rangeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  rangeLabel: { fontSize: 13, color: "#C6D4E0" },
  rangeInputs: { display: "flex", alignItems: "center", gap: 6 },
  rangeInput: {
    width: 60,
    padding: "6px 8px",
    borderRadius: 8,
    border: "1.5px solid #3E566B",
    background: "#0F2033",
    color: "#F4EFE3",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 16,
    textAlign: "center",
  },
  rangeDash: { color: "#5E7590" },
  customizeHint: { fontSize: 11.5, color: "#5E7590", marginTop: 4 },

  gamePanel: {
    background: "#F4EFE3",
    borderRadius: 16,
    padding: "22px 24px 24px",
    boxShadow: "0 20px 40px -18px rgba(0,0,0,0.55)",
    marginBottom: 26,
  },
  gameSetupTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#1F2937",
    marginBottom: 14,
    textAlign: "center",
  },
  gameCatRow: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  gameCatChip: {
    border: "1.5px solid",
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
  },
  gameHint: { textAlign: "center", fontSize: 12, color: "#8A7F63", marginTop: 10 },
  gameDurationRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
    flexWrap: "wrap",
  },
  gameBestLine: { textAlign: "center", fontSize: 12.5, color: "#8A7F63", marginTop: 14 },
  gameStartBtn: {
    display: "block",
    margin: "20px auto 0",
    border: "none",
    borderRadius: 999,
    padding: "13px 30px",
    background: "#1F2937",
    color: "#F4EFE3",
    fontWeight: 700,
    fontSize: 15,
  },
  gameTopBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  gameTimer: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#8A4B2B", fontSize: 15 },
  gameScoreLive: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#1F2937", fontSize: 13 },
  gamePromptText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "clamp(24px, 5.5vw, 32px)",
    fontWeight: 700,
    color: "#1F2937",
    textAlign: "center",
    padding: "16px 8px 22px",
  },
  gameResults: { textAlign: "center", padding: "10px 0" },
  gameResultsTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#1F2937" },
  gameResultsScore: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 44,
    fontWeight: 700,
    color: "#1F6F5C",
    margin: "6px 0 2px",
  },
  gameResultsSub: { fontSize: 13, color: "#8A7F63" },
  gameNewBest: { fontSize: 13, fontWeight: 700, color: "#E8A23D", marginTop: 8 },
  gameResultsBreakdown: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    maxWidth: 260,
    margin: "18px auto 0",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: "#1F2937",
  },
  gameResultsRow: { display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #D8CFB8", paddingBottom: 4 },
  gameResultsBtns: { display: "flex", gap: 12, justifyContent: "center", marginTop: 20, flexWrap: "wrap" },

  gameResultsStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: 10,
    maxWidth: 420,
    margin: "18px auto 0",
  },
  gameResultsStatCard: {
    background: "rgba(31,41,55,0.04)",
    border: "1px solid #E3D9BE",
    borderRadius: 12,
    padding: "10px 8px",
    textAlign: "center",
  },
  gameResultsStatNum: { fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "#1F2937" },
  gameResultsStatLabel: { fontSize: 10.5, color: "#8A7F63", marginTop: 2, fontWeight: 600 },

  gameResultsCatBreakdown: { maxWidth: 340, margin: "6px auto 0", textAlign: "left" },
  gameResultsCatRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 7 },
  gameResultsCatLabel: { width: 92, flexShrink: 0, fontSize: 11, fontWeight: 600, color: "#4B5A6B", textAlign: "right" },
  gameResultsCatTrack: { flex: 1, height: 10, borderRadius: 999, background: "rgba(31,41,55,0.08)", overflow: "hidden" },
  gameResultsCatFill: { height: "100%", borderRadius: 999 },
  gameResultsCatNum: { width: 40, flexShrink: 0, fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", color: "#4B5A6B" },

  battleNameRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 12, marginBottom: 12, flexWrap: "wrap",
  },
  battleError: {
    background: "#F6E4E1", color: "#C0392B", borderRadius: 8, padding: "8px 12px",
    fontSize: 12.5, marginBottom: 12, textAlign: "center",
  },
  battleDisconnectBanner: {
    background: "#FCF1DA", color: "#9A6B1B", border: "1.5px solid #E8B23D",
    borderRadius: 10, padding: "9px 12px", fontSize: 12.5, marginBottom: 14,
    textAlign: "center", fontWeight: 600,
  },
  battleMenuBtns: { display: "flex", flexDirection: "column", gap: 10, marginTop: 14, alignItems: "center" },
  battleSecondaryBtn: {
    border: "1.5px solid #1F2937", borderRadius: 999, padding: "11px 26px",
    background: "transparent", color: "#1F2937", fontWeight: 700, fontSize: 14,
  },
  battleSettingsSummary: {
    background: "rgba(31,41,55,0.04)", borderRadius: 10, padding: "12px 14px", margin: "14px 0",
  },
  battleTagRow: { display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0" },
  battleTag: {
    fontSize: 11.5, fontWeight: 600, color: "#1F2937", background: "#E8DFC8",
    borderRadius: 999, padding: "3px 10px",
  },
  battleCodeDisplay: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(28px, 9vw, 40px)", fontWeight: 700,
    letterSpacing: "0.15em", textAlign: "center", color: "#1F2937", margin: "8px 0 4px",
  },
  battlePlayersRow: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "18px 0", flexWrap: "wrap",
  },
  battlePlayerCard: {
    flex: "1 1 140px", textAlign: "center", background: "rgba(31,41,55,0.04)",
    borderRadius: 10, padding: "12px 10px",
  },
  battlePlayerName: { fontWeight: 700, color: "#1F2937", fontSize: 14 },
  battleVs: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#8A7F63", fontSize: 13 },
  battleCountdownNum: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(40px, 16vw, 64px)", fontWeight: 700,
    color: "#E8B23D", margin: "14px 0",
  },
  battleScoreRow: { display: "flex", justifyContent: "center", gap: 24, margin: "0 0 8px", flexWrap: "wrap" },
  battleScoreBox: { textAlign: "center" },
  battleScoreNum: { fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 700, color: "#1F2937" },
  battleResultsRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 20, margin: "10px 0", flexWrap: "wrap" },
  battleResultBox: { textAlign: "center" },
  battleLoseText: { fontSize: 13, fontWeight: 700, color: "#8A7F63", marginTop: 8 },

  paperCard: {
    background: "#F4EFE3",
    borderRadius: 16,
    padding: "22px 24px 20px",
    boxShadow: "0 20px 40px -18px rgba(0,0,0,0.55)",
    marginBottom: 26,
  },
  paperTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  catPill: {
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    padding: "4px 10px",
    borderRadius: 999,
    textTransform: "uppercase",
  },
  itemTag: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#8A7F63" },

  emptyState: { padding: "30px 0", textAlign: "center", color: "#8A7F63", fontSize: 14 },

  promptText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "clamp(26px, 5.5vw, 34px)",
    fontWeight: 700,
    color: "#1F2937",
    textAlign: "center",
    padding: "22px 8px 26px",
  },

  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 10,
  },
  optionBtn: {
    border: "2px solid",
    borderRadius: 10,
    padding: "14px 10px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 18,
    fontWeight: 700,
  },

  fillRow: { display: "flex", gap: 10, justifyContent: "center" },
  fillInput: {
    border: "2px solid",
    borderRadius: 10,
    padding: "12px 16px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 18,
    fontWeight: 700,
    width: 180,
    textAlign: "center",
    background: "#FFFDF7",
    color: "#1F2937",
    outline: "none",
  },
  submitBtn: {
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    background: "#1F2937",
    color: "#F4EFE3",
    fontWeight: 700,
    fontSize: 14,
  },

  feedbackBar: {
    marginTop: 16,
    borderRadius: 10,
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 14,
    flexWrap: "wrap",
    gap: 10,
  },
  nextBtn: {
    border: "none",
    borderRadius: 8,
    padding: "7px 14px",
    background: "#1F2937",
    color: "#F4EFE3",
    fontWeight: 700,
    fontSize: 13,
  },

  heatmapSection: { marginTop: 6 },
  heatmapHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  heatmapTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#F4EFE3", margin: 0 },
  linkBtn: { background: "none", border: "none", color: "var(--bd-accent, #E8B23D)", fontWeight: 600, fontSize: 13 },

  heatBlock: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #233448",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 12,
  },
  heatBlockTitle: {
    fontSize: 12.5,
    fontWeight: 700,
    letterSpacing: "0.04em",
    color: "#C6D4E0",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  heatGrid: { display: "flex", flexWrap: "wrap", gap: "10px 6px" },
  bubbleWrap: { display: "flex", flexDirection: "column", alignItems: "center", width: 40 },
  bubble: { width: 22, height: 22, borderRadius: "50%", border: "1px solid rgba(0,0,0,0.15)" },
  bubbleLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: "#8FA2B5", marginTop: 3 },

  legendRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8FA2B5", margin: "10px 2px 18px" },
  legendLabel: { marginRight: 2 },
  legendDot: { width: 14, height: 14, borderRadius: "50%", display: "inline-block" },

  resetBtn: {
    display: "block",
    margin: "0 auto",
    background: "transparent",
    border: "1.5px solid #C0392B",
    color: "#E08279",
    borderRadius: 999,
    padding: "8px 18px",
    fontSize: 12.5,
    fontWeight: 600,
  },
  resetConfirmBox: {
    maxWidth: 360,
    margin: "0 auto",
    background: "rgba(192,57,43,0.06)",
    border: "1.5px solid #C0392B",
    borderRadius: 14,
    padding: "14px 16px",
    textAlign: "center",
  },
  resetConfirmText: { fontSize: 12.5, color: "#8A7F63", lineHeight: 1.5, marginBottom: 12 },
  resetConfirmBtns: { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" },
  resetConfirmCancelBtn: {
    border: "1.5px solid #3E566B",
    background: "transparent",
    color: "#5B6B7A",
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 12.5,
    fontWeight: 600,
  },
  resetConfirmYesBtn: {
    border: "none",
    background: "#C0392B",
    color: "#FFF8F2",
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 12.5,
    fontWeight: 700,
  },

  /* ============================================================
     "CARD" (light) CONTEXT TOKENS
     Game/Battle/Settings panels sit on the cream `.bd-card` background
     (#F4EFE3), not the dark navy page background — labels, inputs, and
     segmented controls need their own light-appropriate colors here
     rather than reusing the dark-page tokens above.
     ============================================================ */
  cardLabel: { fontSize: 13, color: "#4B5A6B", fontWeight: 600 },
  cardModeLabel: { fontSize: 12.5, color: "#5B6B7A", fontWeight: 700 },
  cardHint: { fontSize: 11.5, color: "#8A7F63", marginTop: 4 },

  cardFieldGroup: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 12, flex: "1 1 200px" },
  cardFieldRow: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 4 },
  cardTextInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid #D8CFB8",
    background: "#FFFDF7",
    color: "#1F2937",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 16,
  },

  cardRangeRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
  },
  cardRangeInput: {
    width: 60,
    padding: "6px 8px",
    borderRadius: 8,
    border: "1.5px solid #D8CFB8",
    background: "#FFFDF7",
    color: "#1F2937",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 16,
    textAlign: "center",
  },
  cardRangeDash: { color: "#8A7F63" },
  cardCustomizePanel: {
    background: "rgba(31,41,55,0.04)",
    border: "1px solid #E3D9BE",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  cardSegmentGroup: {
    display: "flex",
    border: "1.5px solid #D8CFB8",
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  cardSegmentBtn: {
    border: "none",
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 12.5,
    background: "transparent",
    color: "#6B7A89",
  },

  /* ============================================================
     CATEGORY PICKER — a scalable grid (not a wrapping pill row) so
     it stays usable as more drill categories get added over time.
     Used by Practice (dark), Game & Battle (light).
     ============================================================ */
  pickerWrap: { marginBottom: 20 },
  pickerHeaderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" },
  weakModeRow: { display: "flex", justifyContent: "flex-end", marginBottom: 20, marginTop: -8 },
  pickerActionsRow: { display: "flex", gap: 10 },
  pickerActionBtn: { background: "none", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 },
  pickerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 8,
  },
  pickerCard: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1.5px solid",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  pickerCheck: {
    width: 16, height: 16, borderRadius: 5, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, border: "1.5px solid",
  },
  pickerTag: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, opacity: 0.75, marginRight: 2 },

  /* ============================================================
     PROGRESS TAB — summary cards + accuracy-by-category bar chart +
     a day-by-day learning-curve chart, all hand-rolled SVG (no chart
     dependency needed).
     ============================================================ */
  progressPanel: {
    background: "#F4EFE3",
    borderRadius: 16,
    padding: "22px 24px 24px",
    boxShadow: "0 20px 40px -18px rgba(0,0,0,0.55)",
    marginBottom: 26,
  },
  statCardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    background: "rgba(31,41,55,0.04)",
    border: "1px solid #E3D9BE",
    borderRadius: 12,
    padding: "12px 14px",
    textAlign: "center",
  },
  statCardNum: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 24,
    fontWeight: 700,
    color: "#1F2937",
  },
  statCardLabel: { fontSize: 11, color: "#8A7F63", marginTop: 2, fontWeight: 600 },

  progressSectionTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: "#1F2937",
    margin: "22px 0 12px",
  },

  catBarRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 9 },
  catBarLabel: { width: 118, flexShrink: 0, fontSize: 12, fontWeight: 600, color: "#4B5A6B", textAlign: "right" },
  catBarTrack: { flex: 1, height: 14, borderRadius: 999, background: "rgba(31,41,55,0.08)", overflow: "hidden" },
  catBarFill: { height: "100%", borderRadius: 999 },
  catBarPct: { width: 44, flexShrink: 0, fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", color: "#4B5A6B" },

  learningCurveEmpty: { fontSize: 12.5, color: "#8A7F63", textAlign: "center", padding: "20px 0" },

  /* ---- Streak calendar (contribution heatmap) ---- */
  streakCalHeader: { display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  streakCalStreakNum: { fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: "#1F2937" },
  streakCalRow: { display: "flex", gap: 6, alignItems: "flex-start" },
  streakCalDayLabels: { display: "flex", flexDirection: "column", gap: 3, paddingTop: 0, flexShrink: 0 },
  streakCalDayLabel: { fontSize: 9, color: "#8A7F63", height: 12, lineHeight: "12px", fontFamily: "'JetBrains Mono', monospace" },
  streakCalScroll: { overflowX: "auto", paddingBottom: 4 },
  streakCalGrid: { display: "flex", gap: 3 },
  streakCalCol: { display: "flex", flexDirection: "column", gap: 3 },
  streakCalCell: { width: 12, height: 12, borderRadius: 3 },

  footer: { textAlign: "center", fontSize: 11.5, color: "#5E7590", marginTop: 30 },

  comingSoonBox: {
    border: "1.5px dashed #3E566B",
    borderRadius: 12,
    padding: "14px 16px",
    marginTop: 20,
    textAlign: "center",
  },
  comingSoonTitle: { fontSize: 13, fontWeight: 700, color: "#C6D4E0", marginBottom: 10 },
  comingSoonChips: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  comingSoonChip: {
    fontSize: 11.5,
    color: "#8FA2B5",
    border: "1px solid #33465B",
    borderRadius: 999,
    padding: "4px 12px",
  },

  /* ============================================================
     GAMIFICATION — XP bar (header), badge-unlock toast, badge grid
     and theme picker (Progress tab)
     ============================================================ */
  xpBarWrap: { marginTop: 6, display: "flex", flexDirection: "column", gap: 3 },
  xpBarTopRow: { display: "flex", justifyContent: "space-between", gap: 10, fontFamily: "'JetBrains Mono', monospace" },
  xpBarLevel: { fontSize: 10.5, fontWeight: 700, color: "var(--bd-accent, #E8B23D)", letterSpacing: "0.05em" },
  xpBarNums: { fontSize: 10, color: "#93A6B8" },
  xpBarTrack: { height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" },
  xpBarFill: {
    height: "100%",
    borderRadius: 999,
    background: "var(--bd-accent, #E8B23D)",
    transition: "width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },

  badgeToast: {
    position: "fixed",
    top: 18,
    right: 18,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#F4EFE3",
    border: "2px solid var(--bd-accent, #E8B23D)",
    borderRadius: 14,
    padding: "10px 16px",
    boxShadow: "0 16px 32px -12px rgba(0,0,0,0.55)",
    maxWidth: "calc(100vw - 36px)",
  },
  badgeToastIcon: { fontSize: 26 },
  badgeToastTitle: { fontSize: 10.5, fontWeight: 700, color: "#8A7F63", letterSpacing: "0.06em" },
  badgeToastLabel: { fontSize: 14.5, fontWeight: 700, color: "#1F2937" },

  badgeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 10,
    marginBottom: 6,
  },
  badgeCard: {
    background: "rgba(31,41,55,0.04)",
    border: "1px solid #E3D9BE",
    borderRadius: 12,
    padding: "12px 10px",
    textAlign: "center",
  },
  badgeCardIcon: { fontSize: 26, marginBottom: 4 },
  badgeCardLabel: { fontSize: 12, fontWeight: 700, color: "#1F2937" },
  badgeCardDesc: { fontSize: 10.5, color: "#8A7F63", marginTop: 3, lineHeight: 1.35 },

  themeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 10,
  },
  themeSwatch: {
    border: "2px solid",
    borderRadius: 12,
    padding: "12px 12px 10px",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minHeight: 64,
  },
  themeSwatchDot: { width: 14, height: 14, borderRadius: "50%", display: "block" },
  themeSwatchLabel: { fontSize: 12.5, fontWeight: 700, color: "#F4EFE3" },
  themeSwatchLock: { fontSize: 10, color: "#C6BFAA" },
  themeSwatchSelected: {
    fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", color: "#0B1929",
    background: "#F4EFE3", borderRadius: 999, padding: "2px 8px", alignSelf: "flex-start",
  },

  /* ---- Learn Mode ---- */
  learnExplainBox: {
    background: "rgba(31,111,92,0.08)",
    border: "1px solid #BFE0D3",
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 14,
    lineHeight: 1.5,
    color: "#1F2937",
    margin: "10px 0",
  },

  /* ---- Mock Test ---- */
  mockReviewList: { display: "flex", flexDirection: "column", gap: 8, marginTop: 10 },
  mockReviewRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 10,
    background: "rgba(31,41,55,0.03)",
  },
  mockReviewIcon: { fontSize: 15, width: 18, textAlign: "center", flexShrink: 0 },
  mockReviewPrompt: { flex: 1, fontSize: 12.5, color: "#1F2937" },
  mockReviewAnswer: { fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", color: "#6B7A89", flexShrink: 0 },
  mockProgressLabel: { fontSize: 12.5, color: "#8A7F63", fontFamily: "'JetBrains Mono', monospace" },

  /* ---- Boss Level ---- */
  bossIntroTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 22,
    fontWeight: 700,
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  bossIntroHint: { textAlign: "center", fontSize: 13, color: "#8A7F63", marginBottom: 6, lineHeight: 1.5 },
  bossTargetLine: { textAlign: "center", fontSize: 13.5, fontWeight: 700, color: "#8A4B2B", marginBottom: 18 },
  bossResultBanner: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: 700,
    borderRadius: 12,
    padding: "12px 16px",
    margin: "10px 0 18px",
  },

  /* ---- Phase 4: Practice Plan, Adaptive Difficulty, Reminders ---- */
  practicePlanCard: {
    background: "rgba(232,178,61,0.08)",
    border: "1.5px solid #E8B23D",
    borderRadius: 14,
    padding: "16px 18px",
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  practicePlanTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: "#F4EFE3",
  },
  practicePlanDesc: { fontSize: 12.5, color: "#93A6B8", lineHeight: 1.5 },
  practicePlanTags: { display: "flex", flexWrap: "wrap", gap: 6 },
  practicePlanTag: {
    fontSize: 11.5,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 999,
    color: "#F4EFE3",
  },
  practicePlanBtn: {
    alignSelf: "flex-start",
    background: "#E8B23D",
    color: "#0B1929",
    fontWeight: 700,
    border: "none",
    borderRadius: 999,
    padding: "9px 18px",
    fontSize: 13,
    cursor: "pointer",
  },

  reminderCard: {
    background: "rgba(31,41,55,0.04)",
    border: "1px solid #E3D9BE",
    borderRadius: 12,
    padding: "14px 16px",
    marginTop: 8,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  reminderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  reminderTimeInput: {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1.5px solid #D8CFB8",
    background: "#FFFDF7",
    color: "#1F2937",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
  },
  reminderToggleBtn: {
    border: "1.5px solid",
    borderRadius: 999,
    padding: "7px 14px",
    fontSize: 12.5,
    fontWeight: 700,
    background: "transparent",
    transition: "all 0.15s ease",
  },
};
