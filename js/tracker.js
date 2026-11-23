// Statistik: wird lokal gespeichert, einmal gesamt ("all") und einmal pro Klasse.
// Während eines Runs sammelt das Spiel alles in game.run. Am Ende des Runs wird es hier eingetragen.
// Runs mit Developer-Modus zählen nicht.
const Tracker = {
  KEY: 'soulgrind.stats',
  data: {},

  blank() {
    return {
      runs: 0, deaths: 0, aborts: 0, wins: 0, playTime: 0, goldEarned: 0, goldSpent: 0, stagesCleared: 0,
      kills: 0, abilities: 0, ults: 0, bosses: 0, dmgDealt: 0, dmgTaken: 0, maxHit: 0, hearts: 0,
      reflects: 0, pierce2: 0, banished: 0, rerolls: 0,
      killsByType: {}, deathsBy: {}, statPicks: {}, abilityPicks: {},
      best: { time: 0, level: 0, kills: 0, gold: 0, bosses: 0, fastestBoss: 0 },
      bestBuild: null, // Stats aus dem längsten Run: { time, stats, cls }
    };
  },

  load() {
    try { this.data = JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { this.data = {}; }
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* ohne Speicher geht es auch */ }
  },

  // Daten für "all" oder eine Klasse (fehlende Felder werden ergänzt, falls später neue dazukommen)
  of(scope) {
    const d = (this.data[scope] = this.data[scope] || {});
    const b = this.blank();
    for (const k of Object.keys(b)) if (d[k] === undefined) d[k] = b[k];
    for (const k of Object.keys(b.best)) if (d.best[k] === undefined) d.best[k] = b.best[k];
    return d;
  },

  // Leerer Zwischenspeicher für einen Run
  newRun() {
    return {
      playTime: 0, kills: 0, abilities: 0, ults: 0, bosses: 0, dmgDealt: 0, dmgTaken: 0, maxHit: 0, hearts: 0,
      reflects: 0, pierce2: 0, banished: 0, rerolls: 0, stagesCleared: 0,
      killsByType: {}, statPicks: {}, fastestBoss: 0, lastHitBy: null,
    };
  },

  // Run eintragen. result: 'death' | 'abort' | 'win'
  commitRun(game, result) {
    const r = game.run;
    const p = game.player;
    if (!r || !p) return;
    const scopes = [this.of('all'), this.of(p.cls.id)];
    const addMap = (m, src) => { for (const [k, v] of Object.entries(src)) m[k] = (m[k] || 0) + v; };
    for (const d of scopes) {
      d.runs++;
      if (result === 'death') d.deaths++;
      if (result === 'abort') d.aborts++;
      if (result === 'win') d.wins++;
      for (const k of ['playTime', 'kills', 'abilities', 'ults', 'bosses', 'dmgDealt', 'dmgTaken', 'hearts', 'reflects', 'pierce2', 'banished', 'rerolls', 'stagesCleared']) d[k] += r[k];
      d.goldEarned += game.bankedGold;
      d.maxHit = Math.max(d.maxHit, r.maxHit);
      addMap(d.killsByType, r.killsByType);
      addMap(d.statPicks, r.statPicks);
      d.abilityPicks[p.ability.name] = (d.abilityPicks[p.ability.name] || 0) + 1;
      if (result === 'death') {
        const by = r.lastHitBy || 'Unbekannt';
        d.deathsBy[by] = (d.deathsBy[by] || 0) + 1;
      }
      const b = d.best;
      b.time = Math.max(b.time, r.playTime);
      b.level = Math.max(b.level, p.level);
      b.kills = Math.max(b.kills, r.kills);
      b.gold = Math.max(b.gold, game.bankedGold);
      b.bosses = Math.max(b.bosses, r.bosses);
      if (r.fastestBoss && (!b.fastestBoss || r.fastestBoss < b.fastestBoss)) b.fastestBoss = r.fastestBoss;
      if (!d.bestBuild || r.playTime > d.bestBuild.time) d.bestBuild = { time: r.playTime, stats: { ...p.stats }, cls: p.cls.name };
    }
    this.save();
  },

  addGoldSpent(n) {
    this.of('all').goldSpent += n;
    this.save();
  },
};
Tracker.load();

// Häufigster Eintrag einer Zählliste, z. B. meistgewählter Stat
function topEntry(map) {
  let best = null;
  for (const [k, v] of Object.entries(map || {})) if (!best || v > best[1]) best = [k, v];
  return best;
}
