import { useEffect, useRef, useState } from "react";
import { styles } from "../styles";
import { drawResultCard, downloadCanvasPng, shareCanvasPng } from "../lib/shareCard";

// cardData: { title, subtitle, statLines, accent, footer }
export default function ShareCardModal({ cardData, onClose }) {
  const canvasRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (canvasRef.current && cardData) drawResultCard(canvasRef.current, cardData);
  }, [cardData]);

  if (!cardData) return null;

  const filename = `buddhidrill-${(cardData.title || "result").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;

  async function handleShare() {
    setBusy(true); setNote("");
    const shared = await shareCanvasPng(canvasRef.current, filename, "Check out my BuddhiDrill result!");
    if (!shared) {
      const ok = await downloadCanvasPng(canvasRef.current, filename);
      setNote(ok ? "Image downloaded — share it anywhere you like!" : "Couldn't generate the image. Try again.");
    }
    setBusy(false);
  }

  async function handleDownload() {
    setBusy(true); setNote("");
    const ok = await downloadCanvasPng(canvasRef.current, filename);
    setNote(ok ? "Image downloaded!" : "Couldn't generate the image. Try again.");
    setBusy(false);
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeaderRow}>
          <span style={styles.modalTitle}>📸 Share your result</span>
          <button style={styles.modalCloseBtn} onClick={onClose} type="button" aria-label="Close">✕</button>
        </div>
        <div style={styles.shareCardPreviewWrap}>
          <canvas ref={canvasRef} style={styles.shareCardCanvas} />
        </div>
        {note && <div style={styles.shareCardNote}>{note}</div>}
        <div style={styles.shareCardBtnRow}>
          <button style={styles.primaryBtn} onClick={handleShare} disabled={busy} type="button">
            {busy ? "Working…" : "📤 Share"}
          </button>
          <button style={styles.secondaryBtn} onClick={handleDownload} disabled={busy} type="button">
            ⬇️ Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
