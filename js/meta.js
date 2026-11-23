// Dauerhafte Upgrades im Hauptmenü (Tab "Upgrades"), bezahlt mit Gold. Gelten für alle Klassen.
const META = {
  costs: [25, 50, 100, 175, 300], // Preis für Stufe 1 bis 5
  upgrades: [
    { id: 'damage', name: 'Schaden', per: 0.03, desc: '+3 % Schaden pro Stufe', icon: 'damage' },
    { id: 'maxHp', name: 'Max. Leben', per: 0.05, desc: '+5 % maximales Leben pro Stufe', icon: 'maxHp' },
    { id: 'armor', name: 'Rüstung', per: 0.02, desc: '-2 % erlittener Schaden pro Stufe', icon: 'armor' },
    { id: 'moveSpeed', name: 'Lauftempo', per: 0.02, desc: '+2 % Lauftempo pro Stufe', icon: 'moveSpeed' },
    { id: 'xpGain', name: 'Mehr XP', per: 0.05, desc: '+5 % XP pro Stufe', icon: 'xpGain' },
    { id: 'goldFind', name: 'Goldfund', per: 0.05, desc: '+5 % Gold pro Stufe', icon: null },
    { id: 'cooldown', name: 'Abklingzeit', per: 0.02, desc: '-2 % Abklingzeit der Fähigkeit pro Stufe', icon: 'attackSpeed' },
  ],
};

const Meta = {
  KEY: 'soulgrind.meta',
  levels: {},
  load() {
    try { this.levels = JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { this.levels = {}; }
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.levels)); } catch (e) { /* egal */ }
  },
  level(id) { return this.levels[id] || 0; },
  bonus(id) {
    const u = META.upgrades.find((x) => x.id === id);
    return u ? this.level(id) * u.per : 0;
  },
  // Preis der nächsten Stufe, null wenn ausgebaut
  cost(id) { return META.costs[this.level(id)] ?? null; },
  buy(id) {
    const c = this.cost(id);
    if (c === null || Records.gold < c) return false;
    Records.spendGold(c);
    Tracker.addGoldSpent(c);
    this.levels[id] = this.level(id) + 1;
    this.save();
    return true;
  },
};
Meta.load();
