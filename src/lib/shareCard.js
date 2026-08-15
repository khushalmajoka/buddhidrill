/* ============================================================
   SHAREABLE RESULT CARD (Phase 5, item 16)
   Draws a branded 1080x1350 (portrait, story-friendly) PNG straight
   to a <canvas> using the Canvas 2D API — no html2canvas or other
   dependency, no network round-trip. Used for Game/Boss/Mock
   Test/Daily Challenge result screens and the Progress "export as
   image" action.
   ============================================================ */

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// opts: { title, subtitle, statLines: [{label, value}], accent, footer }
export function drawResultCard(canvas, opts) {
  const W = 1080, H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const accent = opts.accent || "#E8B23D";

  // background
  const bg = ctx.createRadialGradient(W * 0.15, -H * 0.1, 50, W * 0.15, -H * 0.1, W * 1.3);
  bg.addColorStop(0, "#16273D");
  bg.addColorStop(0.55, "#0B1929");
  bg.addColorStop(1, "#081422");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // subtle grid texture
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 54) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 54) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // eyebrow
  ctx.fillStyle = accent;
  ctx.font = "700 30px 'Space Grotesk', sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("BUDDHIDRILL · BRAIN GAMES", 70, 130);

  // title
  ctx.fillStyle = "#F5F1E6";
  ctx.font = "700 78px 'Space Grotesk', sans-serif";
  wrapText(ctx, opts.title || "Result", 70, 220, W - 140, 84);

  if (opts.subtitle) {
    ctx.fillStyle = "#93A6B8";
    ctx.font = "500 34px 'Inter', sans-serif";
    ctx.fillText(opts.subtitle, 70, 300);
  }

  // stat card
  const cardY = 400;
  const cardH = H - cardY - 240;
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  roundRect(ctx, 60, cardY, W - 120, cardH, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(232,178,61,0.35)";
  ctx.lineWidth = 2;
  roundRect(ctx, 60, cardY, W - 120, cardH, 28);
  ctx.stroke();

  const lines = opts.statLines || [];
  const rowH = cardH / Math.max(lines.length, 1);
  lines.forEach((line, i) => {
    const rowY = cardY + rowH * i;
    if (i > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath(); ctx.moveTo(100, rowY); ctx.lineTo(W - 100, rowY); ctx.stroke();
    }
    ctx.fillStyle = "#93A6B8";
    ctx.font = "600 32px 'Inter', sans-serif";
    ctx.fillText(line.label.toUpperCase(), 100, rowY + rowH * 0.42);
    ctx.fillStyle = "#F5F1E6";
    ctx.font = "700 64px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(String(line.value), W - 100, rowY + rowH * 0.72);
    ctx.textAlign = "left";
  });

  // footer
  ctx.fillStyle = accent;
  ctx.font = "700 34px 'Space Grotesk', sans-serif";
  ctx.fillText(opts.footer || "buddhidrill.app", 70, H - 90);
  ctx.fillStyle = "#5B6B7A";
  ctx.font = "500 26px 'Inter', sans-serif";
  ctx.fillText(new Date().toLocaleDateString(), 70, H - 50);

  return canvas;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  let curY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, curY);
}

export function canvasToPngBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

export async function downloadCanvasPng(canvas, filename) {
  const blob = await canvasToPngBlob(canvas);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "buddhidrill.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

// Best-effort native share sheet (mobile); falls back to caller doing a
// plain download if the Web Share API (or file sharing) isn't available.
export async function shareCanvasPng(canvas, filename, shareText) {
  const blob = await canvasToPngBlob(canvas);
  if (!blob) return false;
  const file = new File([blob], filename || "buddhidrill.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "BuddhiDrill", text: shareText || "" });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
