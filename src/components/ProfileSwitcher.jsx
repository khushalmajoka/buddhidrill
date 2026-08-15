import { useState } from "react";
import { styles } from "../styles";
import { avatarChoices } from "../lib/profiles";

// Switching profiles reloads the page (see App.jsx) so every piece of
// per-profile state (stats, XP, badges, theme, adaptive/SRS, etc.)
// re-initializes cleanly from the newly-active profile's namespaced
// localStorage keys, instead of trying to hand-patch dozens of pieces
// of React state in place.
export default function ProfileSwitcher({ profiles, activeId, onSwitch, onCreate, onRename, onDelete, onSetAvatar }) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const active = profiles.find((p) => p.id === activeId) || profiles[0];

  return (
    <div style={styles.profileSwitcherWrap}>
      <button style={styles.profileSwitcherBtn} onClick={() => setOpen((o) => !o)} type="button">
        {active.avatar} {active.name} ▾
      </button>
      {open && (
        <div style={styles.profileSwitcherMenu}>
          {profiles.map((p) => (
            <div key={p.id} style={styles.profileRow}>
              <button
                style={{ ...styles.profileRowBtn, fontWeight: p.id === activeId ? 700 : 500 }}
                onClick={() => { onSwitch(p.id); setOpen(false); }}
                type="button"
              >
                {p.avatar} {p.name}{p.id === activeId ? " ✓" : ""}
              </button>
              <div style={styles.profileRowActions}>
                <button
                  style={styles.profileMiniBtn}
                  title="Rename"
                  onClick={() => { const n = window.prompt("New profile name:", p.name); if (n) onRename(p.id, n); }}
                  type="button"
                >✏️</button>
                <button
                  style={styles.profileMiniBtn}
                  title="Change avatar"
                  onClick={() => {
                    const choices = avatarChoices();
                    const cur = choices.indexOf(p.avatar);
                    onSetAvatar(p.id, choices[(cur + 1) % choices.length]);
                  }}
                  type="button"
                >🎭</button>
                {profiles.length > 1 && (
                  <button
                    style={styles.profileMiniBtn}
                    title="Delete profile"
                    onClick={() => { if (window.confirm(`Delete profile "${p.name}"? This can't be undone.`)) onDelete(p.id); }}
                    type="button"
                  >🗑️</button>
                )}
              </div>
            </div>
          ))}
          <div style={styles.profileNewRow}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New player name"
              style={styles.profileNewInput}
              onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) { onCreate(newName.trim()); setNewName(""); } }}
            />
            <button
              style={styles.profileMiniBtn}
              onClick={() => { if (newName.trim()) { onCreate(newName.trim()); setNewName(""); } }}
              type="button"
            >➕ Add</button>
          </div>
        </div>
      )}
    </div>
  );
}
