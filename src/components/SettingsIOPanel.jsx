import { useRef, useState } from "react";
import { styles } from "../styles";
import { buildSettingsSnapshot, exportSettingsFile, importSettingsFile } from "../lib/settingsIO";

// Small utility block rendered inside the Progress tab: big-text toggle,
// export/import settings, and export-progress-as-image trigger. Kept as one
// component since these are all "housekeeping" actions that share a spot.
export default function SettingsIOPanel({
  settingsState, onApplyImportedSettings, bigText, onToggleBigText, onExportProgressImage,
}) {
  const fileInputRef = useRef(null);
  const [msg, setMsg] = useState("");

  function handleExport() {
    const snap = buildSettingsSnapshot(settingsState);
    const ok = exportSettingsFile(snap);
    setMsg(ok ? "Settings exported!" : "Export failed — try again.");
    setTimeout(() => setMsg(""), 2500);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const settings = await importSettingsFile(file);
      onApplyImportedSettings(settings);
      setMsg("Settings imported!");
    } catch (err) {
      setMsg(err.message || "Import failed.");
    }
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <div style={styles.settingsIOBlock}>
      <div style={styles.progressSectionTitle}>Utility &amp; accessibility</div>

      <div style={styles.settingsIORow}>
        <span style={styles.cardLabel}>Bigger text mode</span>
        <button
          onClick={onToggleBigText}
          style={{ ...styles.secondaryBtn, background: bigText ? "#E8B23D" : undefined, color: bigText ? "#0B1929" : undefined }}
          type="button"
        >
          {bigText ? "✓ On" : "Off"}
        </button>
      </div>

      <div style={styles.settingsIORow}>
        <span style={styles.cardLabel}>Settings backup</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.secondaryBtn} onClick={handleExport} type="button">⬇️ Export</button>
          <button style={styles.secondaryBtn} onClick={handleImportClick} type="button">⬆️ Import</button>
          <input ref={fileInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={handleFileChange} />
        </div>
      </div>

      <div style={styles.settingsIORow}>
        <span style={styles.cardLabel}>Progress card</span>
        <button style={styles.secondaryBtn} onClick={onExportProgressImage} type="button">📸 Export as image</button>
      </div>

      {msg && <div style={styles.shareCardNote}>{msg}</div>}
    </div>
  );
}
