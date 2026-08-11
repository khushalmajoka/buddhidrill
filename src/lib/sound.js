/* ============================================================
   SOUND — tiny synthesized SFX via the Web Audio API. No audio
   files to ship or load; every sound is a couple of oscillator
   tones shaped with a short gain envelope. Respects a global
   on/off flag persisted to localStorage.
   ============================================================ */

const SOUND_KEY = "buddhidrill-sound";

export function loadSoundPref() {
  try {
    const raw = window.localStorage.getItem(SOUND_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function saveSoundPref(on) {
  try { window.localStorage.setItem(SOUND_KEY, on ? "1" : "0"); } catch { /* ignore */ }
}

let ctx = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  // browsers suspend audio contexts until a user gesture; answering a
  // question always follows a click/tap, so this is safe to call each time
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, startAt, duration, { type = "sine", gain = 0.16, glideTo } = {}) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, startAt + duration);
  amp.gain.setValueAtTime(0.0001, startAt);
  amp.gain.exponentialRampToValueAtTime(gain, startAt + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(amp).connect(c.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

export function playCorrect(enabled) {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  tone(660, t, 0.09, { type: "triangle" });
  tone(880, t + 0.08, 0.14, { type: "triangle" });
}

export function playWrong(enabled) {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  tone(220, t, 0.16, { type: "sawtooth", gain: 0.11, glideTo: 140 });
}

export function playTap(enabled) {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  tone(500, c.currentTime, 0.04, { type: "square", gain: 0.06 });
}

export function playVictory(enabled) {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) => tone(f, t + i * 0.11, 0.22, { type: "triangle", gain: 0.15 }));
}

export function playNewBest(enabled) {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  [523.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.09, 0.2, { type: "sine", gain: 0.14 }));
}
