// Soundeffekte und Musik, komplett im Code erzeugt (Web Audio API, keine Sounddateien).
// Retro-Klang wie auf alten Konsolen: Rechteck-, Dreieck-, Sinus-Wellen und Rauschen.
const Sound = {
  ctx: null,
  master: null,
  sfxGain: null,
  musicGain: null,
  volume: { music: 0.5, sfx: 0.7, muted: false },
  lastPlayed: {}, // damit häufige Sounds (Treffer) nicht nerven
  noiseBuf: null,

  // Der Browser erlaubt Ton erst nach einem Klick oder Tastendruck, darum wird erst dann gestartet
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.connect(this.master);
    this.musicGain = this.ctx.createGain();
    this.musicGain.connect(this.master);
    // ein Puffer mit Rauschen für Schläge, Explosionen, Schlagzeug
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.applyVolume();
    return true;
  },

  duck: 1, // Musik leiser (z. B. in der Pause)

  applyVolume() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.volume.muted ? 0 : 1, t, 0.02);
    this.sfxGain.gain.setTargetAtTime(this.volume.sfx, t, 0.02);
    this.musicGain.gain.setTargetAtTime(this.volume.music * 0.6 * this.duck, t, 0.05);
  },

  // Lautstärke aus den Einstellungen übernehmen (im Spiel)
  fromSettings() {
    this.volume.music = Settings.musicVol;
    this.volume.sfx = Settings.sfxVol;
    this.volume.muted = Settings.muted;
    this.applyVolume();
  },

  setDuck(v) {
    if (this.duck === v) return;
    this.duck = v;
    this.applyVolume();
  },

  // ---------- Bausteine ----------

  // Ton mit Tonhöhen-Rutsch: wave = square | triangle | sine | sawtooth
  tone({ wave = 'square', f = 440, f2 = null, dur = 0.1, vol = 0.3, at = 0, attack = 0.005, out = null, vib = 0 }) {
    const c = this.ctx;
    const t = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    if (vib) { // Vibrato
      const lfo = c.createOscillator();
      const lg = c.createGain();
      lfo.frequency.value = 7;
      lg.gain.value = vib;
      lfo.connect(lg).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(out || this.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.02);
  },

  // Rauschen durch einen Filter: lowpass = dumpf (Schlag), highpass = zischend, bandpass = Wusch
  noise({ dur = 0.1, vol = 0.3, at = 0, filter = 'lowpass', f = 2000, f2 = null, q = 1, out = null }) {
    const c = this.ctx;
    const t = c.currentTime + at;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const fl = c.createBiquadFilter();
    fl.type = filter;
    fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    fl.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(fl).connect(g).connect(out || this.sfxGain);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  },

  // ---------- Soundeffekte ----------

  play(name) {
    if (!this.ctx || this.volume.muted) return;
    const s = SFX[name];
    if (!s) return;
    const now = this.ctx.currentTime;
    if (now - (this.lastPlayed[name] || -1) < (s.gap || 0)) return; // gedrosselt
    this.lastPlayed[name] = now;
    s.fn(this);
  },

  // ---------- Musik ----------

  track: null,
  step: 0,
  nextTime: 0,
  timer: null,

  playMusic(id) {
    if (!this.ctx) return;
    if (this.track && this.track.id === id) return;
    this.stopMusic();
    const tr = MUSIC[id];
    if (!tr) return;
    this.track = { id, ...tr, voice: this.ctx.createGain() };
    this.track.voice.gain.value = 0;
    this.track.voice.gain.setTargetAtTime(1, this.ctx.currentTime, 0.3); // sanft einblenden
    this.track.voice.connect(this.musicGain);
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 25);
  },

  stopMusic() {
    if (!this.track) return;
    const v = this.track.voice;
    v.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15); // sanft ausblenden
    setTimeout(() => v.disconnect(), 800);
    clearInterval(this.timer);
    this.track = null;
  },

  // Plant die nächsten Noten etwas im Voraus, damit nichts stockt
  schedule() {
    const tr = this.track;
    if (!tr) return;
    const stepDur = 60 / tr.bpm / 2; // Achtelnoten
    const len = tr.parts[0].notes.length;
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      const at = this.nextTime - this.ctx.currentTime;
      for (const part of tr.parts) {
        const n = part.notes[this.step % len];
        if (!n || n === '.' || n === '-') continue;
        if (part.drum) { DRUMS[n](this, at, part.vol || 1, tr.voice); continue; }
        // Notenlänge: bis zur nächsten Note (Punkte verlängern)
        let k = 1;
        while (part.notes[(this.step + k) % len] === '.' && k < len) k++;
        this.tone({ wave: part.wave, f: noteFreq(n), dur: stepDur * k * 0.95, vol: part.vol, at, attack: part.attack || 0.01, out: tr.voice, vib: part.vib || 0 });
      }
      this.step++;
      this.nextTime += stepDur;
    }
  },

  // Einmalige Melodie (Sieg, Tod), unterbricht die Musik
  jingle(id) {
    if (!this.ctx) return;
    this.stopMusic();
    const j = JINGLES[id];
    let at = 0.05;
    for (const [n, len, wave, vol] of j.notes) {
      if (n !== '-') this.tone({ wave: wave || 'square', f: noteFreq(n), dur: len * 0.95, vol: vol || 0.25, at, out: this.musicGain });
      at += len;
    }
  },
};

// Notenname -> Frequenz, z. B. 'A4' = 440 Hz, 'F#5', 'Bb3'
function noteFreq(name) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) return 440;
  const base = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]];
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return 440 * Math.pow(2, (base + acc + (Number(m[3]) - 4) * 12) / 12);
}

// ---------- Effekt-Liste ----------
// gap = Mindestabstand in Sekunden, damit sich häufige Sounds nicht stapeln
const SFX = {
  swing: { label: 'Schwerthieb', gap: 0.05, fn: (s) => s.noise({ dur: 0.1, vol: 0.25, filter: 'bandpass', f: 3000, f2: 700, q: 2 }) },
  arrow: { label: 'Pfeil', gap: 0.05, fn: (s) => { s.tone({ wave: 'square', f: 1100, f2: 500, dur: 0.06, vol: 0.12 }); s.noise({ dur: 0.05, vol: 0.1, filter: 'highpass', f: 4000 }); } },
  orb: { label: 'Magiekugel', gap: 0.05, fn: (s) => s.tone({ wave: 'sine', f: 280, f2: 700, dur: 0.18, vol: 0.2, vib: 30 }) },
  hit: { label: 'Treffer', gap: 0.04, fn: (s) => { s.noise({ dur: 0.05, vol: 0.18, f: 1800 }); s.tone({ wave: 'square', f: 180, f2: 90, dur: 0.05, vol: 0.08 }); } },
  kill: { label: 'Gegner besiegt', gap: 0.04, fn: (s) => { s.tone({ wave: 'square', f: 420, f2: 90, dur: 0.14, vol: 0.12 }); s.noise({ dur: 0.12, vol: 0.12, f: 1200 }); } },
  hurt: { label: 'Held getroffen', gap: 0.12, fn: (s) => { s.tone({ wave: 'sawtooth', f: 240, f2: 110, dur: 0.16, vol: 0.18 }); s.noise({ dur: 0.08, vol: 0.12, f: 900 }); } },
  gold: { label: 'Gold', gap: 0.03, fn: (s) => { s.tone({ wave: 'square', f: 1319, dur: 0.05, vol: 0.08 }); s.tone({ wave: 'square', f: 1976, dur: 0.12, vol: 0.08, at: 0.05 }); } },
  heart: { label: 'Herz', fn: (s) => ['C6', 'E6', 'G6'].forEach((n, i) => s.tone({ wave: 'sine', f: noteFreq(n), dur: 0.12, vol: 0.18, at: i * 0.06 })) },
  levelup: { label: 'Level Up', fn: (s) => ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((n, i) => s.tone({ wave: 'square', f: noteFreq(n), dur: i === 4 ? 0.3 : 0.08, vol: 0.13, at: i * 0.07 })) },
  ability: { label: 'Fähigkeit', gap: 0.1, fn: (s) => s.noise({ dur: 0.28, vol: 0.22, filter: 'bandpass', f: 500, f2: 3500, q: 3 }) },
  block: { label: 'Block / Zurückwerfen', gap: 0.06, fn: (s) => { s.tone({ wave: 'square', f: 1500, dur: 0.12, vol: 0.08 }); s.tone({ wave: 'sine', f: 2250, dur: 0.2, vol: 0.08 }); } },
  ult: { label: 'Ult', fn: (s) => { s.tone({ wave: 'sawtooth', f: 150, f2: 900, dur: 0.5, vol: 0.18 }); s.noise({ dur: 0.6, vol: 0.2, filter: 'bandpass', f: 400, f2: 4000, q: 2 }); s.tone({ wave: 'square', f: 523, dur: 0.4, vol: 0.08, at: 0.35 }); } },
  freeze: { label: 'Einfrieren', gap: 0.08, fn: (s) => { s.tone({ wave: 'sine', f: 2400, f2: 1600, dur: 0.25, vol: 0.1, vib: 80 }); s.noise({ dur: 0.15, vol: 0.06, filter: 'highpass', f: 6000 }); } },
  fire: { label: 'Feuer', gap: 0.15, fn: (s) => s.noise({ dur: 0.35, vol: 0.18, filter: 'lowpass', f: 1200, f2: 400 }) },
  meteor: { label: 'Meteor', fn: (s) => { s.tone({ wave: 'sine', f: 1600, f2: 250, dur: 0.9, vol: 0.12 }); s.noise({ dur: 0.7, vol: 0.45, f: 600, f2: 80, at: 0.9 }); s.tone({ wave: 'sine', f: 70, f2: 30, dur: 0.6, vol: 0.4, at: 0.9 }); } },
  poison: { label: 'Gift', gap: 0.3, fn: (s) => [0, 0.08, 0.16].forEach((at, i) => s.tone({ wave: 'sine', f: 300 + i * 60, f2: 200, dur: 0.07, vol: 0.1, at })) },
  swarm: { label: 'Fledermaus-Schwarm', fn: (s) => { for (let i = 0; i < 10; i++) s.noise({ dur: 0.05, vol: 0.12, filter: 'bandpass', f: 1800 + Math.random() * 800, q: 4, at: i * 0.06 }); } },
  bossRoar: { label: 'Boss erscheint', fn: (s) => { s.tone({ wave: 'sawtooth', f: 130, f2: 55, dur: 1.1, vol: 0.25, vib: 6 }); s.noise({ dur: 1.0, vol: 0.25, filter: 'lowpass', f: 700, f2: 150 }); } },
  slamWarn: { label: 'Bodenstampfer: Warnung', gap: 0.5, fn: (s) => [0, 0.25, 0.5].forEach((at) => s.tone({ wave: 'square', f: 220, dur: 0.12, vol: 0.12, at })) },
  slam: { label: 'Bodenstampfer: Einschlag', fn: (s) => { s.noise({ dur: 0.6, vol: 0.5, f: 500, f2: 60 }); s.tone({ wave: 'sine', f: 80, f2: 28, dur: 0.6, vol: 0.45 }); } },
  rock: { label: 'Felsbrocken', gap: 0.1, fn: (s) => { s.noise({ dur: 0.3, vol: 0.3, f: 700, f2: 100 }); s.tone({ wave: 'sine', f: 110, f2: 50, dur: 0.25, vol: 0.25 }); } },
  pillar: { label: 'Säule wächst', gap: 0.3, fn: (s) => s.noise({ dur: 0.5, vol: 0.15, f: 300, f2: 900 }) },
  chest: { label: 'Kiste öffnen', fn: (s) => { s.noise({ dur: 0.12, vol: 0.2, f: 900 }); ['E6', 'G6', 'B6', 'E7'].forEach((n, i) => s.tone({ wave: 'square', f: noteFreq(n), dur: 0.1, vol: 0.07, at: 0.1 + i * 0.05 })); } },
  mimic: { label: 'Kisten-Falle', fn: (s) => { s.tone({ wave: 'sawtooth', f: 180, f2: 60, dur: 0.4, vol: 0.2, vib: 20 }); s.noise({ dur: 0.2, vol: 0.2, f: 1500 }); } },
  awaken: { label: 'Rüstung erwacht', gap: 0.2, fn: (s) => { [0, 0.12, 0.24].forEach((at) => s.tone({ wave: 'square', f: 900, f2: 700, dur: 0.06, vol: 0.08, at })); s.tone({ wave: 'sine', f: 90, f2: 60, dur: 0.4, vol: 0.2, at: 0.3 }); } },
  veil: { label: 'Karthul erscheint', fn: (s) => { s.tone({ wave: 'sine', f: 60, f2: 200, dur: 2.2, vol: 0.25, vib: 8 }); s.noise({ dur: 2.2, vol: 0.12, filter: 'bandpass', f: 300, f2: 2500, q: 4 }); } },
  blade: { label: 'Schattenklingen', gap: 0.1, fn: (s) => { s.noise({ dur: 0.2, vol: 0.2, filter: 'bandpass', f: 2500, f2: 600, q: 3 }); s.tone({ wave: 'sine', f: 700, f2: 350, dur: 0.2, vol: 0.08 }); } },
  soulBeam: { label: 'Seelenstrahl', fn: (s) => { s.tone({ wave: 'sawtooth', f: 110, dur: 1.6, vol: 0.1, vib: 12 }); s.tone({ wave: 'sine', f: 880, dur: 1.6, vol: 0.06, vib: 30 }); } },
  shadowDash: { label: 'Schattensprung', gap: 0.2, fn: (s) => s.noise({ dur: 0.25, vol: 0.25, filter: 'bandpass', f: 400, f2: 3000, q: 2 }) },
  heal: { label: 'Heilerin heilt', fn: (s) => ['A5', 'C#6', 'E6', 'A6'].forEach((n, i) => s.tone({ wave: 'sine', f: noteFreq(n), dur: 0.25, vol: 0.12, at: i * 0.07 })) },
  click: { label: 'Menü-Klick', gap: 0.03, fn: (s) => s.tone({ wave: 'square', f: 660, dur: 0.04, vol: 0.08 }) },
  buy: { label: 'Upgrade gekauft', fn: (s) => { s.play('gold'); ['G5', 'C6'].forEach((n, i) => s.tone({ wave: 'triangle', f: noteFreq(n), dur: 0.15, vol: 0.2, at: 0.08 + i * 0.08 })); } },
  achievement: { label: 'Erfolg', fn: (s) => [['C5', 0], ['G5', 0.1], ['C6', 0.2], ['E6', 0.3], ['G6', 0.4]].forEach(([n, at]) => s.tone({ wave: 'square', f: noteFreq(n), dur: 0.25, vol: 0.1, at })) },
};

// ---------- Schlagzeug ----------
const DRUMS = {
  k: (s, at, v, out) => s.tone({ wave: 'sine', f: 140, f2: 40, dur: 0.18, vol: 0.5 * v, at, out }), // Bassdrum
  s: (s, at, v, out) => s.noise({ dur: 0.12, vol: 0.22 * v, filter: 'bandpass', f: 1800, q: 0.8, at, out }), // Snare
  h: (s, at, v, out) => s.noise({ dur: 0.03, vol: 0.08 * v, filter: 'highpass', f: 7000, at, out }), // Hi-Hat
  t: (s, at, v, out) => s.tone({ wave: 'sine', f: 200, f2: 70, dur: 0.16, vol: 0.4 * v, at, out }), // Tom (Trommel)
  d: (s, at, v, out) => s.tone({ wave: 'sine', f: 1800, f2: 900, dur: 0.08, vol: 0.06 * v, at, out }), // Tropfen (Katakomben)
};

// ---------- Musik ----------
// Achtelnoten-Raster. '.' = Ton hält an, '-' = Pause. Jeder Track ist eine Schleife.
const bars = (...b) => b.flat();
const MUSIC = {
  menu: {
    label: 'Hauptmenü', bpm: 76,
    parts: [
      { wave: 'triangle', vol: 0.16, notes: bars(
        ['A4', 'C5', 'E5', 'C5', 'A4', 'C5', 'E5', 'C5'], ['G4', 'B4', 'E5', 'B4', 'G4', 'B4', 'E5', 'B4'],
        ['F4', 'A4', 'C5', 'A4', 'F4', 'A4', 'C5', 'A4'], ['E4', 'G#4', 'B4', 'G#4', 'E4', 'G#4', 'B4', 'E5']) },
      { wave: 'sine', vol: 0.18, notes: bars(
        ['A2', '.', '.', '.', '.', '.', '.', '.'], ['E2', '.', '.', '.', '.', '.', '.', '.'],
        ['F2', '.', '.', '.', '.', '.', '.', '.'], ['E2', '.', '.', '.', '.', '.', '.', '.']) },
      { wave: 'square', vol: 0.05, vib: 4, notes: bars(
        ['-', '-', '-', '-', 'E5', '.', 'D5', 'C5'], ['B4', '.', '.', '.', '-', '-', '-', '-'],
        ['-', '-', '-', '-', 'A5', '.', 'G5', 'F5'], ['E5', '.', '.', '.', '-', '-', '-', '-']) },
    ],
  },
  forest: {
    label: 'Ebene 1: Wald', bpm: 112,
    parts: [
      { wave: 'square', vol: 0.09, notes: bars(
        ['E5', '.', 'C5', 'A4', 'C5', '.', 'E5', '.'], ['F5', '.', 'E5', 'C5', 'A4', '.', 'C5', '.'],
        ['G5', '.', 'E5', 'C5', 'E5', '.', 'G5', '.'], ['D5', '.', 'B4', 'G4', 'B4', '.', 'D5', '-'],
        ['A5', '.', 'G5', 'E5', 'C5', '.', 'E5', '.'], ['F5', '.', 'A5', '.', 'C6', '.', 'A5', '.'],
        ['G5', '.', 'E5', '.', 'C5', '.', 'E5', 'G5'], ['B5', '.', '.', '.', 'A5', '.', 'G5', '-']) },
      { wave: 'triangle', vol: 0.22, notes: bars(
        ['A2', 'A2', 'A3', 'A2', 'A2', 'A2', 'A3', 'A2'], ['F2', 'F2', 'F3', 'F2', 'F2', 'F2', 'F3', 'F2'],
        ['C3', 'C3', 'C2', 'C3', 'C3', 'C3', 'C2', 'C3'], ['G2', 'G2', 'G3', 'G2', 'G2', 'G2', 'G3', 'G2'],
        ['A2', 'A2', 'A3', 'A2', 'A2', 'A2', 'A3', 'A2'], ['F2', 'F2', 'F3', 'F2', 'F2', 'F2', 'F3', 'F2'],
        ['C3', 'C3', 'C2', 'C3', 'C3', 'C3', 'C2', 'C3'], ['E2', 'E2', 'E3', 'E2', 'E2', 'E2', 'E3', 'E2']) },
      { drum: true, vol: 0.8, notes: bars(...Array(8).fill(['k', 'h', 's', 'h', 'k', 'k', 's', 'h'])) },
    ],
  },
  catacombs: {
    // 0.9.0: düsterer, wie eine Orgel in einer Gruft, mit Wassertropfen
    label: 'Ebene 2: Katakomben', bpm: 80,
    parts: [
      { wave: 'triangle', vol: 0.15, vib: 6, notes: bars(
        ['D5', '.', '.', '.', 'Eb5', '.', 'D5', '.'], ['C5', '.', '.', '.', 'A4', '.', '.', '.'],
        ['Bb4', '.', '.', '.', 'A4', '.', 'G4', '.'], ['A4', '.', '.', '.', '-', '-', '-', '-'],
        ['D5', '.', 'F5', '.', 'Eb5', '.', 'D5', '.'], ['C5', '.', 'D5', '.', 'Bb4', '.', '.', '.'],
        ['A4', '.', 'G4', '.', 'F4', '.', 'G4', '.'], ['A4', '.', '.', '.', '.', '.', '.', '-']) },
      { wave: 'square', vol: 0.035, vib: 3, notes: bars(
        ...['D4', 'F4', 'D4', 'C#4', 'D4', 'D4', 'Bb3', 'A3'].map((n) => [n, '.', '.', '.', '.', '.', '.', '.'])) },
      { wave: 'triangle', vol: 0.26, notes: bars(
        ['D2', '.', '.', '.', '.', '.', '.', '.'], ['D2', '.', '.', '.', 'A1', '.', '.', '.'],
        ['G1', '.', '.', '.', '.', '.', '.', '.'], ['A1', '.', '.', '.', '.', '.', '.', '.'],
        ['D2', '.', '.', '.', '.', '.', '.', '.'], ['Bb1', '.', '.', '.', '.', '.', '.', '.'],
        ['G1', '.', '.', '.', 'A1', '.', '.', '.'], ['D2', '.', '.', '.', 'A1', '.', '.', '.']) },
      { drum: true, vol: 0.7, notes: bars(...Array(4).fill([['k', '-', '-', '-', 'd', '-', 'h', '-'], ['k', '-', '-', 'h', 's', '-', '-', 'd']]).flat()) },
    ],
  },
  bossTroll: {
    // El'Matho: schwer und stampfend, mit Trommeln
    label: "Bosskampf: El'Matho", bpm: 132,
    parts: [
      { wave: 'square', vol: 0.08, notes: bars(
        ['E5', '-', 'E5', 'F5', 'G5', '.', 'F5', 'E5'], ['D5', '-', 'D5', 'E5', 'F5', '.', 'E5', 'D5'],
        ['E5', '-', 'E5', 'F5', 'G5', '.', 'Bb5', 'A5'], ['G5', '.', 'F5', '.', 'E5', '.', '.', '.']) },
      { wave: 'sawtooth', vol: 0.08, notes: bars(
        ['E2', 'E2', '-', 'E2', 'E2', '-', 'E2', 'F2'], ['D2', 'D2', '-', 'D2', 'D2', '-', 'D2', 'E2'],
        ['E2', 'E2', '-', 'E2', 'E2', '-', 'E2', 'F2'], ['C2', 'C2', '-', 'C2', 'B1', '-', 'B1', 'B1']) },
      { drum: true, vol: 1, notes: bars(...Array(3).fill(['k', '-', 'k', 's', 'k', 't', 's', 't']), ['k', 't', 't', 's', 't', 't', 's', 's']) },
    ],
  },
  palace: {
    // Ebene 3: höfisch und unheimlich, wie ein Cembalo in einem leeren Thronsaal
    label: 'Ebene 3: Palast der Seelen', bpm: 96,
    parts: [
      { wave: 'square', vol: 0.05, notes: bars(
        ['A4', 'C5', 'E5', 'A5', 'E5', 'C5', 'A4', 'C5'], ['G#4', 'B4', 'E5', 'G#5', 'E5', 'B4', 'G#4', 'B4'],
        ['F4', 'A4', 'C5', 'F5', 'C5', 'A4', 'F4', 'A4'], ['E4', 'G#4', 'B4', 'E5', 'B4', 'G#4', 'D5', 'B4'],
        ['A4', 'C5', 'E5', 'A5', 'E5', 'C5', 'A4', 'C5'], ['D4', 'F4', 'A4', 'D5', 'A4', 'F4', 'D4', 'F4'],
        ['E4', 'G#4', 'B4', 'E5', 'B4', 'G#4', 'B4', 'D5'], ['A4', 'E4', 'A4', 'C5', 'E5', '.', '.', '-']) },
      { wave: 'triangle', vol: 0.13, vib: 5, notes: bars(
        ['E5', '.', '.', '.', 'A5', '.', 'G#5', '.'], ['B5', '.', '.', '.', '.', '.', '-', '-'],
        ['C6', '.', 'B5', '.', 'A5', '.', 'F5', '.'], ['G#5', '.', '.', '.', '-', '-', '-', '-'],
        ['E5', '.', '.', '.', 'A5', '.', 'B5', '.'], ['C6', '.', '.', '.', 'D6', '.', 'C6', '.'],
        ['B5', '.', 'A5', '.', 'G#5', '.', 'B5', '.'], ['A5', '.', '.', '.', '.', '.', '-', '-']) },
      { wave: 'sine', vol: 0.2, notes: bars(
        ...['A2', 'E2', 'F2', 'E2', 'A2', 'D2', 'E2', 'A2'].map((n) => [n, '.', '.', '.', '.', '.', '.', '.'])) },
      { drum: true, vol: 0.5, notes: bars(...Array(8).fill(['k', '-', 'h', '-', 's', '-', 'h', '-'])) },
    ],
  },
  bossKarthul: {
    // Karthul: episch, schnell, mit treibendem Bass
    label: 'Bosskampf: Karthul', bpm: 160,
    parts: [
      { wave: 'square', vol: 0.09, notes: bars(
        ['D5', '.', 'A5', '.', 'F5', '.', 'D5', 'E5'], ['F5', '.', 'G5', '.', 'A5', '.', '.', '.'],
        ['Bb5', '.', 'A5', '.', 'G5', '.', 'F5', 'E5'], ['A5', '.', '.', '.', 'C#5', '.', '.', '.'],
        ['D5', '.', 'A5', '.', 'F5', '.', 'D5', 'E5'], ['F5', '.', 'G5', '.', 'A5', '.', 'D6', '.'],
        ['C6', '.', 'Bb5', '.', 'A5', '.', 'G5', '.'], ['A5', '.', 'C#6', '.', 'D6', '.', '.', '.']) },
      { wave: 'triangle', vol: 0.12, notes: bars(
        ...['D4', 'F4', 'G4', 'A4', 'D4', 'F4', 'Bb4', 'A4'].map((n) => [n, '.', '.', '.', '.', '.', '.', '.'])) },
      { wave: 'sawtooth', vol: 0.075, notes: bars(
        ...[['D2', 'D3'], ['D2', 'D3'], ['Bb1', 'Bb2'], ['A1', 'A2'], ['D2', 'D3'], ['F2', 'F3'], ['Bb1', 'Bb2'], ['A1', 'A2']].map(([a, b]) => [a, b, a, b, a, b, a, b])) },
      { drum: true, vol: 0.95, notes: bars(...Array(7).fill(['k', 'h', 's', 'h', 'k', 'k', 's', 'h']), ['s', 's', 't', 't', 'k', 's', 's', 's']) },
    ],
  },
  boss: {
    label: 'Bosskampf', bpm: 150,
    parts: [
      { wave: 'square', vol: 0.09, notes: bars(
        ['E5', 'E5', 'G5', 'E5', 'B5', '.', 'A5', 'G5'], ['E5', 'E5', 'G5', 'E5', 'C6', '.', 'B5', 'G5'],
        ['F#5', 'F#5', 'A5', 'F#5', 'D6', '.', 'C6', 'A5'], ['D#5', '.', 'F#5', '.', 'B5', '.', 'A5', 'F#5']) },
      { wave: 'sawtooth', vol: 0.07, notes: bars(
        ['E2', 'E3', 'E2', 'E3', 'E2', 'E3', 'E2', 'E3'], ['C2', 'C3', 'C2', 'C3', 'C2', 'C3', 'C2', 'C3'],
        ['D2', 'D3', 'D2', 'D3', 'D2', 'D3', 'D2', 'D3'], ['B1', 'B2', 'B1', 'B2', 'B1', 'B2', 'D#2', 'F#2']) },
      { drum: true, vol: 0.9, notes: bars(...Array(4).fill(['k', 'h', 's', 'h', 'k', 'k', 's', 's'])) },
    ],
  },
};

// ---------- Kurze Melodien ----------
// [Note, Länge in Sekunden, Welle, Lautstärke]
const JINGLES = {
  victory: { label: 'Sieg', notes: [['C5', 0.12], ['E5', 0.12], ['G5', 0.12], ['C6', 0.36], ['-', 0.06], ['A5', 0.12], ['C6', 0.12], ['E6', 0.6, 'square', 0.3]] },
  stageClear: { label: 'Ebene geschafft', notes: [['G4', 0.1], ['C5', 0.1], ['E5', 0.1], ['G5', 0.4], ['E5', 0.1], ['G5', 0.5]] },
  death: { label: 'Tod', notes: [['A4', 0.3, 'triangle', 0.3], ['F4', 0.3, 'triangle', 0.3], ['D4', 0.3, 'triangle', 0.3], ['A3', 0.9, 'triangle', 0.35]] },
};
