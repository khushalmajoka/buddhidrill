import { useState } from "react";

/* ============================================================
   CONFETTI — a short-lived burst of falling pieces, pure CSS
   animation (no canvas, no library). Mount this conditionally
   (e.g. `{show && <Confetti />}`) and let it self-remove via the
   parent's timeout — it doesn't unmount itself.
   ============================================================ */
const COLORS = ["#E8B23D", "#1F6F5C", "#B2662B", "#8A4B2B", "#6B3FA0", "#2B5A8A", "#C0392B"];

function makePieces(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.25,
    duration: 1.1 + Math.random() * 0.9,
    color: COLORS[i % COLORS.length],
    rotate: Math.round(Math.random() * 360),
    size: 6 + Math.round(Math.random() * 6),
    drift: (Math.random() - 0.5) * 60,
  }));
}

export default function Confetti({ count = 42 }) {
  // computed once on mount via a lazy initializer, so re-renders while the
  // burst is on screen don't reshuffle the pieces mid-animation
  const [pieces] = useState(() => makePieces(count));

  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 999,
    }} aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: -20,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            opacity: 0.9,
            borderRadius: 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `bd-confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            "--bd-drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
