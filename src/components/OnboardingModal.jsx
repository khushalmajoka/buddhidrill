import { useState } from "react";
import { styles } from "../styles";
import { normalizeUsername, usernameFormatError, isUsernameAvailable, claimUsername } from "../lib/usernames";

// Shown once, the very first time Logiks is opened on a device (see the
// hasSavedProfiles() check in App.jsx). Blocks the rest of the app behind
// it (no dismiss/skip) since name + username are used all over the place
// afterwards — Battle/Team lobbies, the weekly leaderboard, share cards.
export default function OnboardingModal({ onComplete, initialName }) {
  const [name, setName] = useState(initialName || "");
  const [dob, setDob] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanName = name.trim();
    if (!cleanName) { setError("Let us know what to call you."); return; }

    const formatErr = usernameFormatError(username);
    if (formatErr) { setError(formatErr); return; }
    const cleanUsername = normalizeUsername(username);

    if (!dob) { setError("Add your date of birth to continue."); return; }
    const dobDate = new Date(dob);
    if (Number.isNaN(dobDate.getTime()) || dob > todayStr) { setError("That date of birth doesn't look right."); return; }

    setChecking(true);
    const available = await isUsernameAvailable(cleanUsername);
    if (!available) {
      setChecking(false);
      setError(`@${cleanUsername} is already taken — try another.`);
      return;
    }
    await claimUsername(cleanUsername);
    setChecking(false);
    onComplete({ name: cleanName, username: cleanUsername, dob });
  }

  return (
    <div
      style={styles.onboardOverlay}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* stopPropagation above matters: App.jsx has document-level Enter
          handlers for Practice/Game/Battle keyboard shortcuts that call
          preventDefault() and, since they're attached to `document`, would
          otherwise swallow the Enter keypress before the browser's native
          "Enter submits the form" behavior ever gets to run here. */}      <div style={styles.onboardCard}>
        <div style={styles.onboardEyebrow}>WELCOME TO</div>
        <div style={styles.onboardTitle}>Logiks</div>
        <div style={styles.onboardSubtitle}>
          A quick intro before your first drill — this stays on this device and powers your leaderboard name and share cards.
        </div>

        <form onSubmit={handleSubmit} style={styles.onboardForm}>
          <label style={styles.onboardLabel}>
            Your name
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Khushal"
              maxLength={20}
              style={styles.onboardInput}
            />
          </label>

          <label style={styles.onboardLabel}>
            Date of birth
            <input
              type="date"
              value={dob}
              max={todayStr}
              onChange={(e) => setDob(e.target.value)}
              style={styles.onboardInput}
            />
          </label>

          <label style={styles.onboardLabel}>
            Pick a unique username
            <div style={styles.onboardUsernameWrap}>
              <span style={styles.onboardUsernamePrefix}>@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="e.g. khushal_23"
                maxLength={20}
                style={{ ...styles.onboardInput, ...styles.onboardUsernameInput }}
              />
            </div>
            <span style={styles.onboardHint}>Letters, numbers, underscores — 3 to 20 characters. This is what shows on the leaderboard.</span>
          </label>

          {error && <div style={styles.onboardError}>{error}</div>}

          <button type="submit" style={styles.onboardSubmitBtn} disabled={checking}>
            {checking ? "Checking username…" : "Let's go →"}
          </button>
        </form>
      </div>
    </div>
  );
}
