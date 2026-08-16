/* ============================================================
   DAILY PRACTICE REMINDER
   Browser notifications can't reliably fire from a fully closed tab
   without a service worker + push server, so this is a deliberately
   honest best-effort version: while Logiks is open in a tab, it
   checks once a minute whether the person's preferred time has passed
   and they haven't practiced yet today, and fires a single native
   Notification if so (never more than once per day).
   ============================================================ */

import { pkey } from "./profiles";

const REMINDER_KEY = "buddhidrill-reminder";
const FIRED_PREFIX = "buddhidrill-reminder-fired-";

export function loadReminderPref() {
  try {
    const raw = window.localStorage.getItem(pkey(REMINDER_KEY));
    return raw ? JSON.parse(raw) : { enabled: false, time: "18:00" };
  } catch {
    return { enabled: false, time: "18:00" };
  }
}

export function saveReminderPref(pref) {
  try { window.localStorage.setItem(pkey(REMINDER_KEY), JSON.stringify(pref)); } catch { /* ignore */ }
}

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  try { return await Notification.requestPermission(); } catch { return "denied"; }
}

export function fireReminderNotification() {
  if (!notificationsSupported()) return;
  try {
    new Notification("Logiks", {
      body: "Haven't done today's math workout yet — quick 5-minute drill?",
    });
  } catch { /* ignore — some browsers block Notification() outside a user gesture in edge cases */ }
}

// starts a once-a-minute check loop; returns a cleanup function to stop it.
// getPref()/hasPracticedToday() are called fresh each tick so the loop
// always sees the latest state without needing to be restarted on change.
export function startReminderLoop({ getPref, hasPracticedToday }) {
  const check = () => {
    if (!notificationsSupported() || Notification.permission !== "granted") return;
    const pref = getPref();
    if (!pref.enabled) return;
    const now = new Date();
    const [h, m] = pref.time.split(":").map((x) => parseInt(x, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    const todayKey = now.toISOString().slice(0, 10);
    const firedKey = `${FIRED_PREFIX}${todayKey}`;
    if (now >= target && !hasPracticedToday() && !window.localStorage.getItem(pkey(firedKey))) {
      fireReminderNotification();
      try { window.localStorage.setItem(pkey(firedKey), "1"); } catch { /* ignore */ }
    }
  };
  check();
  const id = setInterval(check, 60 * 1000);
  return () => clearInterval(id);
}
