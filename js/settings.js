// Einstellungen (Optionen-Menü). Bleiben im Speicher des Spiels erhalten.
const Settings = {
  KEY: 'soulgrind.settings',
  autoFireKey: 'KeyQ', // Taste für Auto-Schuss

  // Diese Tasten sind schon belegt und können nicht gewählt werden
  RESERVED: ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'Escape', 'F1', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'],

  load() {
    try {
      const d = JSON.parse(localStorage.getItem(this.KEY)) || {};
      if (d.autoFireKey) this.autoFireKey = d.autoFireKey;
    } catch (e) { /* Standardwerte */ }
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify({ autoFireKey: this.autoFireKey })); } catch (e) { /* egal */ }
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
