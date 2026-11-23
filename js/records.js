// Spielstände: beste Zeit pro Ebene und Kills, getrennt nach Klasse.
// Gespeichert im Browser-Speicher des Spiels (bleibt über Updates erhalten).
// Runs, in denen der Developer-Modus benutzt wurde, zählen nicht.
const Records = {
  KEY: 'soulgrind.records',
  data: {},

  load() {
    try { this.data = JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { this.data = {}; }
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* ohne Speicher geht es auch */ }
  },

  forClass(classId) {
    if (!this.data[classId]) this.data[classId] = { best: {}, cleared: {}, kills: 0 };
    return this.data[classId];
  },

  // Zeit in einer Ebene eintragen. Gibt true zurück, wenn es eine neue Bestleistung ist.
  // Eine geschaffte Ebene schlägt immer eine nicht geschaffte.
  submitStage(classId, stageNum, seconds, cleared) {
    const r = this.forClass(classId);
    const oldTime = r.best[stageNum];
    const oldCleared = !!r.cleared[stageNum];
    const better = oldTime === undefined || (cleared && !oldCleared) || (cleared === oldCleared && seconds > oldTime);
    if (better) {
      r.best[stageNum] = Math.floor(seconds);
      if (cleared) r.cleared[stageNum] = true;
      this.save();
    }
    return better;
  },

  addKills(classId, n) {
    if (n <= 0) return;
    this.forClass(classId).kills += n;
    this.save();
  },

  totalKills() {
    return Object.values(this.data).reduce((sum, r) => sum + (r.kills || 0), 0);
  },

  // Gold gehört allen Klassen zusammen (für spätere Upgrades)
  GOLD_KEY: 'soulgrind.gold',
  gold: 0,
  loadGold() {
    try { this.gold = Number(localStorage.getItem(this.GOLD_KEY)) || 0; } catch (e) { this.gold = 0; }
  },
  addGold(n) {
    if (n <= 0) return;
    this.gold += n;
    try { localStorage.setItem(this.GOLD_KEY, String(this.gold)); } catch (e) { /* egal */ }
  },
  spendGold(n) {
    this.gold = Math.max(0, this.gold - n);
    try { localStorage.setItem(this.GOLD_KEY, String(this.gold)); } catch (e) { /* egal */ }
  },
};
Records.load();
Records.loadGold();
