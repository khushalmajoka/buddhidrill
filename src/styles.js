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
  }

  @media (max-width: 400px) {
    .bd-options-grid {
      grid-template-columns: 1fr !important;
    }
  }
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
    color: "#E8B23D",
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
    border: "2px solid #E8B23D",
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
    fontSize: 13,
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

  battleNameRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 12, marginBottom: 12, flexWrap: "wrap",
  },
  battleError: {
    background: "#F6E4E1", color: "#C0392B", borderRadius: 8, padding: "8px 12px",
    fontSize: 12.5, marginBottom: 12, textAlign: "center",
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
    fontFamily: "'JetBrains Mono', monospace", fontSize: 40, fontWeight: 700,
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
    fontFamily: "'JetBrains Mono', monospace", fontSize: 64, fontWeight: 700,
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
  linkBtn: { background: "none", border: "none", color: "#E8B23D", fontWeight: 600, fontSize: 13 },

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
};
