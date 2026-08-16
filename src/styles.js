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

  /* ---- Daylight (light) theme, Phase 6 item 21 ----
     Cards, prompts, and buttons already sit on a cream surface everywhere
     (see the "Always rendered inside the cream .bd-card" convention), so
     the light theme mainly needs to flip the DARK-NAVY structural chrome
     around them: page text, header title/subtitle, stamp box, mode nav,
     and the sticky HUD. Documented trade-off (same as cosmetic themes):
     this reskins the main structural surfaces, not every nested hardcoded
     color in every rarely-seen panel. */
  .bd-light.bd-page { color: #2A2116 !important; }
  .bd-light .bd-header-left h1 { color: #241C0F !important; }
  .bd-light .bd-header-left > div { color: #6B5B3A !important; }
  .bd-light .bd-header { border-bottom-color: #D8CBA6 !important; }
  .bd-light .bd-stamp { background: rgba(255,255,255,0.55) !important; }
  .bd-light .bd-stamp span { color: #3A2E17 !important; }
  .bd-light .bd-sound-toggle { border-color: #C9B98C !important; color: #3A2E17 !important; }
  .bd-light .bd-mode-label { color: #6B5B3A !important; }
  .bd-light .bd-segment-scroll { border-color: #C9B98C !important; }
  .bd-light .bd-segment-scroll > button:not([data-active="true"]) { color: #6B5B3A !important; }
  .bd-light .bd-mode-grid > button:not([data-active="true"]) {
    border-color: #C9B98C !important; color: #6B5B3A !important;
  }
  .bd-light .bd-boss-banner { background: linear-gradient(90deg, rgba(232,178,61,0.22), rgba(232,178,61,0.05)) !important; }
  .bd-light .bd-boss-banner-title { color: #241C0F !important; }
  .bd-light .bd-smart-practice-card { background: rgba(255,255,255,0.5) !important; border-color: #D8CBA6 !important; }
  .bd-light .bd-smart-toggle-row { border-top-color: #E3D9BE !important; }
  .bd-light .bd-smart-toggle-row div { color: #3A3226 !important; }
  .bd-light .bd-smart-toggle-row div div { color: #6B5B3A !important; }
  .bd-light .bd-sticky-hud {
    background: rgba(247,242,228,0.92) !important;
    border-color: #D8CBA6 !important;
  }
  .bd-light .bd-sticky-hud span { color: #3A2E17 !important; }

  /* ---- Bigger text / accessibility mode, Phase 6 item 22 ---- */
  .bd-big-text .bd-prompt { font-size: clamp(30px, 7vw, 42px) !important; }
  .bd-big-text .bd-card,
  .bd-big-text .bd-card * { font-size: 1.16em; }
  .bd-big-text .bd-options-grid button { padding: 16px 14px !important; }
  .bd-big-text .bd-fill-input { font-size: 20px !important; padding: 14px !important; }
  .bd-big-text .bd-submit-btn { padding: 14px 20px !important; }
  .bd-big-text .bd-sticky-hud { font-size: 1.1em; }

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

  /* ---- Smart Practice card (Adaptive / Spaced repetition / Focus weak
     spots) — replaces the old row of three identical on/off chip buttons,
     which gave no room to explain what each toggle actually does. ---- */
  smartPracticeCard: {
    border: "1px solid #233448",
    borderRadius: 14,
    padding: "4px 16px",
    marginBottom: 20,
    background: "rgba(255,255,255,0.02)",
  },
  smartPracticeTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#6B7A89",
    padding: "12px 0 4px",
  },
  smartToggleRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
    padding: "12px 0", borderTop: "1px solid #1B2A3A",
  },
  smartToggleInfo: { display: "flex", flexDirection: "column", gap: 3, minWidth: 0 },
  smartToggleLabel: { display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 700, color: "#E7E1D3" },
  smartToggleDesc: { fontSize: 11.5, color: "#93A6B8", lineHeight: 1.4 },
  switchTrack: {
    position: "relative", width: 40, height: 22, borderRadius: 999, border: "none",
    flexShrink: 0, transition: "background 0.2s ease", padding: 0,
  },
  switchThumb: {
    position: "absolute", top: 2, width: 18, height: 18, borderRadius: "50%",
    background: "#F4EFE3", transition: "left 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  },

  modeRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  modeLabel: { fontSize: 12.5, color: "#93A6B8", fontWeight: 600 },

  /* ---- Mode grid (replaces the old horizontal-scroll mode nav) ----
     Wraps naturally instead of scrolling sideways — every mode is visible
     without a swipe, on any screen width. */
  modeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))",
    gap: 8,
    width: "100%",
  },
  modeGridBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    border: "1.5px solid #3E566B",
    borderRadius: 14,
    padding: "10px 6px",
    minHeight: 64,
    transition: "all 0.15s ease",
  },
  modeGridIcon: { fontSize: 19, lineHeight: 1 },
  modeGridLabel: { fontSize: 10.5, lineHeight: 1.2, textAlign: "center" },

  /* ---- Boss challenge banner — deliberately separate from the mode grid,
     framed as a one-off badge challenge rather than a mode to switch to. ---- */
  bossBanner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    textAlign: "left",
    background: "linear-gradient(90deg, rgba(232,178,61,0.14), rgba(232,178,61,0.03))",
    border: "1.5px dashed #E8B23D",
    borderRadius: 14,
    padding: "12px 16px",
    marginBottom: 20,
  },
  bossBannerIcon: { fontSize: 26 },
  bossBannerText: { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
  bossBannerTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#F4EFE3" },
  bossBannerSub: { fontSize: 11.5, color: "#93A6B8" },
  bossBannerBadge: {
    fontSize: 11, fontWeight: 700, color: "#0B1929", background: "#E8B23D",
    borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap",
  },

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
  difficultyBadge: {
    fontSize: 10.5, fontWeight: 700, border: "1px solid", borderRadius: 999,
    padding: "3px 9px", whiteSpace: "nowrap", background: "rgba(255,255,255,0.03)",
  },
  difficultyBadgeSub: { fontWeight: 500, opacity: 0.85 },

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
  adaptiveArrow: { width: 16, flexShrink: 0, fontSize: 14, fontWeight: 700, textAlign: "center" },
  adaptiveDetail: { fontSize: 11.5, color: "#6B7A89", flex: 1 },

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
  mockUtilityRow: { display: "flex", gap: 10, marginTop: 12, justifyContent: "flex-end" },
  mockUtilityBtn: {
    fontSize: 12, fontWeight: 600, color: "#6B7A89", background: "transparent",
    border: "1.5px solid #D8CFB8", borderRadius: 999, padding: "7px 14px",
  },
  mockRevealBox: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    padding: "18px 16px", marginTop: 6, borderRadius: 12,
    background: "rgba(31,111,92,0.08)", border: "1.5px dashed #1F6F5C",
  },
  mockRevealLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#1F6F5C" },
  mockRevealValue: { fontSize: 26, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#1F2937" },

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

  /* ---- Onboarding (first-run welcome screen) ---- */
  onboardOverlay: {
    position: "fixed", inset: 0, background: "#0B1929",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, zIndex: 100,
  },
  onboardCard: {
    background: "#F4EFE3", borderRadius: 20, padding: "28px 24px 26px",
    maxWidth: 420, width: "100%", maxHeight: "92vh", overflowY: "auto",
    boxShadow: "0 24px 70px rgba(0,0,0,0.5)",
  },
  onboardEyebrow: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#8A4B2B", textAlign: "center",
  },
  onboardTitle: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30,
    color: "#1F2937", textAlign: "center", marginTop: 2,
  },
  onboardSubtitle: {
    fontSize: 13, color: "#6B7A89", textAlign: "center", marginTop: 8, marginBottom: 22, lineHeight: 1.5,
  },
  onboardForm: { display: "flex", flexDirection: "column", gap: 16 },
  onboardLabel: { display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, fontWeight: 700, color: "#3A3226" },
  onboardInput: {
    padding: "12px 14px", borderRadius: 10, border: "1.5px solid #D8CFB8",
    background: "#FFFDF7", color: "#1F2937", fontSize: 16, fontWeight: 500,
  },
  onboardUsernameWrap: { display: "flex", alignItems: "stretch", gap: 0 },
  onboardUsernamePrefix: {
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 0 0 14px", borderRadius: "10px 0 0 10px", border: "1.5px solid #D8CFB8", borderRight: "none",
    background: "#FFFDF7", color: "#8A4B2B", fontWeight: 700, fontSize: 16, lineHeight: 1,
  },
  onboardUsernameInput: { borderRadius: "0 10px 10px 0", flex: 1 },
  onboardHint: { fontSize: 11, color: "#93876A", fontWeight: 500 },
  onboardError: {
    background: "#F6E4E1", border: "1px solid #C0392B", color: "#8E2E1E",
    borderRadius: 10, padding: "9px 12px", fontSize: 12.5, fontWeight: 600,
  },
  onboardSubmitBtn: {
    background: "var(--bd-accent, #E8B23D)", color: "#0B1929", border: "none",
    borderRadius: 12, padding: "13px 16px", fontWeight: 700, fontSize: 15, marginTop: 4,
  },

  /* ---- Generic modal (ShareCardModal) ---- */
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(8,14,22,0.72)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, zIndex: 60,
  },
  modalCard: {
    background: "#F4EFE3", borderRadius: 18, padding: "18px 20px 22px",
    maxWidth: 420, width: "100%", maxHeight: "88vh", overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
  },
  modalHeaderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  modalTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "#1F2937" },
  modalCloseBtn: { background: "none", border: "none", fontSize: 16, color: "#6B7A89", padding: 4 },

  shareCardPreviewWrap: {
    display: "flex", justifyContent: "center", background: "#0B1929",
    borderRadius: 12, padding: 8, marginBottom: 10,
  },
  shareCardCanvas: { width: "100%", maxWidth: 320, borderRadius: 8, display: "block" },
  shareCardNote: { fontSize: 12, color: "#6B7A89", textAlign: "center", marginBottom: 8 },
  shareCardBtnRow: { display: "flex", gap: 10 },

  primaryBtn: {
    flex: 1, background: "var(--bd-accent, #E8B23D)", color: "#0B1929", border: "none",
    borderRadius: 10, padding: "12px 16px", fontWeight: 700, fontSize: 14,
  },
  secondaryBtn: {
    background: "transparent", color: "#4B5A6B", border: "1.5px solid #D8CFB8",
    borderRadius: 10, padding: "9px 14px", fontWeight: 600, fontSize: 13,
  },

  /* ---- Leaderboard / daily challenge rows ---- */
  leaderboardRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
    padding: "8px 4px", borderBottom: "1px solid #E3D9BE", fontSize: 13.5,
  },
  leaderboardRank: { fontWeight: 700, color: "#8A4B2B", minWidth: 30 },
  leaderboardName: { flex: 1, color: "#3A3226", fontWeight: 600 },
  leaderboardScore: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#1F2937" },
  leaderboardMeRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 10, margin: "10px 0", flexWrap: "wrap",
  },

  challengeShareBox: {
    marginTop: 14, background: "rgba(31,41,55,0.04)", border: "1px solid #E3D9BE",
    borderRadius: 12, padding: "12px 14px",
  },
  challengeShareRow: { display: "flex", gap: 8, marginTop: 6 },
  challengeShareInput: {
    flex: 1, padding: "9px 12px", borderRadius: 8, border: "1.5px solid #D8CFB8",
    background: "#FFFDF7", color: "#1F2937", fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
  },

  /* ---- Team / group mode ---- */
  teamColumns: { display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" },
  teamColumn: {
    flex: "1 1 160px", background: "rgba(31,41,55,0.04)", border: "1px solid #E3D9BE",
    borderRadius: 12, padding: "12px 14px",
  },

  /* ---- Profile switcher ---- */
  profileSwitcherWrap: { position: "relative", marginBottom: 18, display: "flex" },
  profileSwitcherBtn: {
    background: "rgba(255,255,255,0.06)", border: "1.5px solid #3E566B", color: "#E7E1D3",
    borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 600,
  },
  profileSwitcherMenu: {
    // was zIndex: 40, same as .stickyHud (also 40) — on mobile, once the page
    // scrolls the sticky HUD becomes a later paint in the same stacking
    // context and covers the open dropdown. Needs to sit above it (but below
    // the badge toast/modal layers at 50/60).
    position: "absolute", top: "110%", left: 0, zIndex: 45, minWidth: 240,
    background: "#F4EFE3", borderRadius: 12, padding: "10px 12px",
    boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
  },
  profileRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 2px" },
  profileRowBtn: { background: "none", border: "none", color: "#1F2937", fontSize: 13.5, textAlign: "left", flex: 1 },
  profileRowActions: { display: "flex", gap: 4 },
  profileMiniBtn: { background: "none", border: "none", fontSize: 13, padding: "2px 5px", borderRadius: 6 },
  profileNewRow: { display: "flex", gap: 6, marginTop: 8, paddingTop: 8, borderTop: "1px solid #E3D9BE" },
  profileNewInput: {
    flex: 1, padding: "7px 10px", borderRadius: 8, border: "1.5px solid #D8CFB8",
    background: "#FFFDF7", color: "#1F2937", fontSize: 13,
  },

  /* ---- Settings import/export & accessibility block ---- */
  settingsIOBlock: {
    background: "rgba(31,41,55,0.04)", border: "1px solid #E3D9BE", borderRadius: 12,
    padding: "14px 16px", marginTop: 18, display: "flex", flexDirection: "column", gap: 10,
  },
  settingsIORow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
};
