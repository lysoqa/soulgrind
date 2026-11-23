// Einstellungen (Optionen-Menü). Bleiben im Speicher des Spiels erhalten.
const Settings = {
  KEY: 'soulgrind.settings',
  autoFireKey: 'KeyQ', // Taste für Auto-Schuss
  musicVol: 0.5, // Lautstärke Musik (0 bis 1)
  sfxVol: 0.7, // Lautstärke Effekte (0 bis 1)
  muted: false, // Ton ganz aus

  // Diese Tasten sind schon belegt und können nicht gewählt werden
  RESERVED: ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'Escape', 'F1', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'],

  load() {
    try {
      const d = JSON.parse(localStorage.getItem(this.KEY)) || {};
      if (d.autoFireKey) this.autoFireKey = d.autoFireKey;
      if (typeof d.musicVol === 'number') this.musicVol = d.musicVol;
      if (typeof d.sfxVol === 'number') this.sfxVol = d.sfxVol;
      if (typeof d.muted === 'boolean') this.muted = d.muted;
    } catch (e) { /* Standardwerte */ }
  },
  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify({ autoFireKey: this.autoFireKey, musicVol: this.musicVol, sfxVol: this.sfxVol, muted: this.muted }));
    } catch (e) { /* egal */ }
  },

  // Lesbarer Name einer Taste, z. B. KeyQ -> Q, ShiftLeft -> Shift
  keyLabel(code) {
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
    const names = {
      Space: 'Leertaste', ShiftLeft: 'Shift', ShiftRight: 'Shift rechts', ControlLeft: 'Strg', ControlRight: 'Strg rechts',
      AltLeft: 'Alt', AltRight: 'Alt Gr', Tab: 'Tab', CapsLock: 'Feststell', Enter: 'Enter', Backspace: 'Rück',
      ArrowUp: 'Pfeil hoch', ArrowDown: 'Pfeil runter', ArrowLeft: 'Pfeil links', ArrowRight: 'Pfeil rechts',
    };
    return names[code] || code;
  },
};
Settings.load();
