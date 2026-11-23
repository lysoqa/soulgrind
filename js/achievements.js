// Erfolge pro Klasse und ihre Belohnungen (Skins). Fortschritt kommt aus der Statistik (Tracker).
// stat = Zähler in der Klassen-Statistik, goal = Ziel. locked = gibt es noch nicht (z. B. Ebene 3).
const ACHIEVEMENTS = {
  warrior: [
    { id: 'w_reflect', name: 'Spiegelmeister', desc: 'Reflektiere 250 Schüsse', stat: 'reflects', goal: 250, reward: 'goldShield' },
    { id: 'w_kill5000', name: 'Schlächter', desc: 'Töte 5000 Monster', stat: 'kills', goal: 5000, reward: 'blueShirt' },
    { id: 'w_kill10000', name: 'Kriegsherr', desc: 'Töte 10000 Monster', stat: 'kills', goal: 10000, reward: 'goldSword' },
    { id: 'w_stage3', name: 'Kraken Bezwinger', desc: 'Besiege den Boss von Ebene 3', locked: true, reward: 'crown' },
  ],
  archer: [
    { id: 'a_pierce', name: 'Durchschlag', desc: 'Durchbohre 250 mal mindestens 2 Gegner mit einem Pfeil', stat: 'pierce2', goal: 250, reward: 'goldAura' },
    { id: 'a_kill5000', name: 'Jäger', desc: 'Töte 5000 Monster', stat: 'kills', goal: 5000, reward: 'goldArrows' },
    { id: 'a_kill10000', name: 'Meisterschütze', desc: 'Töte 10000 Monster', stat: 'kills', goal: 10000, reward: 'goldBow' },
    { id: 'a_stage3', name: 'Phantomtänzer', desc: 'Besiege den Boss von Ebene 3', locked: true, reward: 'crown' },
  ],
  mage: [
    { id: 'm_banish', name: 'Bannmeister', desc: 'Verbanne 250 Gegner mit deiner Fähigkeit', stat: 'banished', goal: 250, reward: 'goldParticles' },
    { id: 'm_kill5000', name: 'Hexer', desc: 'Töte 5000 Monster', stat: 'kills', goal: 5000, reward: 'goldOrbs' },
    { id: 'm_kill10000', name: 'Erzmagier', desc: 'Töte 10000 Monster', stat: 'kills', goal: 10000, reward: 'goldBook' },
    { id: 'm_stage3', name: 'Schattenflamme', desc: 'Besiege den Boss von Ebene 3', locked: true, reward: 'crown' },
  ],
};

const REWARDS = {
  goldShield: 'Goldenes Schild',
  blueShirt: 'Blaues Hemd',
  goldSword: 'Goldenes Schwert',
  goldAura: 'Goldene Aura bei Fähigkeiten',
  goldArrows: 'Goldene Pfeile',
  goldBow: 'Goldener Bogen',
  goldParticles: 'Goldene Partikel bei Fähigkeiten',
  goldOrbs: 'Goldene Geschosse',
  goldBook: 'Goldenes Buch',
  crown: 'Goldene Krone + Titel',
};

const achievementProgress = (classId, a) => (a.locked ? 0 : Math.min(a.goal, Tracker.of(classId)[a.stat] || 0));
const achievementDone = (classId, a) => !a.locked && achievementProgress(classId, a) >= a.goal;

// Angelegte Skins und schon gemeldete Erfolge
const Cosmetics = {
  KEY: 'soulgrind.cosmetics',
  on: {}, // classId -> { rewardId: true }
  seen: {}, // achievementId -> true (schon als "freigeschaltet" gemeldet)
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(this.KEY)) || {};
      this.on = d.on || {};
      this.seen = d.seen || {};
    } catch (e) { /* leer */ }
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify({ on: this.on, seen: this.seen })); } catch (e) { /* egal */ }
  },
  // Skin angelegt UND freigeschaltet?
  has(classId, reward) {
    if (!this.on[classId] || !this.on[classId][reward]) return false;
    return ACHIEVEMENTS[classId].some((a) => a.reward === reward && achievementDone(classId, a));
  },
  toggle(classId, reward) {
    this.on[classId] = this.on[classId] || {};
    this.on[classId][reward] = !this.on[classId][reward];
    this.save();
  },
  // Neu geschaffte Erfolge finden, melden und ihre Belohnung gleich anlegen
  checkNew(classId) {
    const fresh = [];
    for (const a of ACHIEVEMENTS[classId] || []) {
      if (this.seen[a.id] || !achievementDone(classId, a)) continue;
      this.seen[a.id] = true;
      this.on[classId] = this.on[classId] || {};
      this.on[classId][a.reward] = true;
      fresh.push(a);
    }
    if (fresh.length) this.save();
    return fresh;
  },
};
Cosmetics.load();

// ---------- Skin-Grafiken: vorhandene Sprites umfärben ----------

function recolorSprite(s, map) {
  const c = document.createElement('canvas');
  c.width = s.w;
  c.height = s.h;
  const g = c.getContext('2d');
  g.drawImage(s.img, 0, 0);
  const img = g.getImageData(0, 0, s.w, s.h);
  const hex = (r, gg, b) => `#${[r, gg, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  const rows = [];
  for (let y = 0; y < s.h; y++) {
    let row = '';
    for (let x = 0; x < s.w; x++) {
      const i = (y * s.w + x) * 4;
      row += img.data[i + 3] ? 'X' : '.';
    }
    rows.push(row);
  }
  // Pixel einzeln neu setzen (makeSprite braucht Zeichen, darum über eigene Farbtabelle)
  const colors = {};
  let next = 0;
  const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const out = rows.map((row, y) => [...row].map((ch, x) => {
    if (ch === '.') return '.';
    const i = (y * s.w + x) * 4;
    let col = hex(img.data[i], img.data[i + 1], img.data[i + 2]);
    col = map[col] || col;
    let key = Object.keys(colors).find((k) => colors[k] === col);
    if (!key) { key = keys[next++]; colors[key] = col; }
    return key;
  }).join(''));
  return makeSprite(out, colors);
}

const GOLD = { light: '#fff4c2', main: '#ffd34a', dark: '#c99a20', deep: '#8a6a10' };
const SKIN_SPR = {
  blueShirt: recolorSprite(SPR.warrior, { '#b8333a': '#4a6fa5', '#7a1f2b': '#2f4a75' }),
  goldShield: recolorSprite(SPR.shield, { '#9aa4b1': GOLD.main, '#5d6673': GOLD.dark, '#b8333a': GOLD.dark, '#ffd34a': GOLD.light }),
  goldSword: recolorSprite(SPR.sword, { '#dfe6ee': GOLD.light, '#9fb0c2': GOLD.main, '#5a3a22': GOLD.deep }),
  goldArrow: recolorSprite(SPR.arrow, { '#8a5a2b': GOLD.main, '#dfe6ee': GOLD.light, '#9fb0c2': GOLD.dark }),
  goldBow: recolorSprite(SPR.bow, { '#8a5a2b': GOLD.main }),
  goldBook: recolorSprite(SPR.book, { '#4a6fa5': GOLD.dark, '#ffd34a': GOLD.light, '#e8e4d4': GOLD.main }),
};

// Sprites für den Helden, je nach angelegten Skins
function heroSprite(classId) {
  if (classId === 'warrior' && Cosmetics.has('warrior', 'blueShirt')) return SKIN_SPR.blueShirt;
  return SPR[CLASSES[classId].sprite];
}
const shieldSprite = () => (Cosmetics.has('warrior', 'goldShield') ? SKIN_SPR.goldShield : SPR.shield);
const swordSprite = () => (Cosmetics.has('warrior', 'goldSword') ? SKIN_SPR.goldSword : SPR.sword);
const bowSprite = () => (Cosmetics.has('archer', 'goldBow') ? SKIN_SPR.goldBow : SPR.bow);
const arrowSprite = () => (Cosmetics.has('archer', 'goldArrows') ? SKIN_SPR.goldArrow : SPR.arrow);
const bookSprite = () => (Cosmetics.has('mage', 'goldBook') ? SKIN_SPR.goldBook : SPR.book);
