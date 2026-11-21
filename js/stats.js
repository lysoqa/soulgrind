// Stats, die man bei jedem Level-Up wählen kann.
// per = Bonus pro Rang (0.03 = +3 %). Jeder Stat geht bis Rang 5, pro Run sind höchstens 5 verschiedene Stats möglich.
const STAT_MAX_RANK = 5;
const STAT_MAX_DISTINCT = 5;
const REROLLS_PER_RUN = 2;

const STATS = {
  damage: {
    name: 'Schaden', per: 0.03, desc: '+3 % Schaden',
    icon: ['.....mM', '....mM.', '...mM..', 'y.mM...', '.yM....', '.by....', 'b..y...'],
  },
  armor: {
    name: 'Rüstung', per: 0.03, desc: '-3 % erlittener Schaden',
    icon: ['.hhhhh.', 'hhrrrhh', 'hrryrrh', 'hrrrrrh', '.hrrrh.', '..hrh..', '...h...'],
  },
  maxHp: {
    name: 'Max. Leben', per: 0.08, desc: '+8 % maximales Leben',
    icon: ['.rr.rr.', 'rxrrrrr', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'],
  },
  recovery: {
    name: 'Erholung', per: 0.1, desc: '+0,1 Leben pro Sekunde',
    icon: ['..zzz..', '..zzz..', 'zzzzzzz', 'zzzzzzz', 'zzzzzzz', '..zzz..', '..zzz..'],
  },
  projSpeed: {
    name: 'Geschosstempo', per: 0.06, desc: '+6 % Geschosstempo', ranged: true,
    icon: ['.......', '....m..', '.....m.', 'wllllmm', '.....m.', '....m..', '.......'],
  },
  moveSpeed: {
    name: 'Lauftempo', per: 0.03, desc: '+3 % Lauftempo',
    icon: ['..LL...', '..LL...', '..LL...', '..LLl..', '..LLlll', '.bbbbbb', '.......'],
  },
  xpGain: {
    name: 'Mehr XP', per: 0.03, desc: '+3 % XP',
    icon: ['...y...', '...y...', 'yyyyyyy', '.yyyyy.', '..yyy..', '.yy.yy.', 'y.....y'],
  },
  attackSpeed: {
    name: 'Angriffstempo', per: 0.03, desc: '+3 % Angriffstempo',
    icon: ['....yy.', '...yy..', '..yy...', '.yyyyy.', '...yy..', '..yy...', '.yy....'],
  },
};
for (const s of Object.values(STATS)) s.sprite = makeSprite(s.icon);

// Wählbare Stats für einen Spieler: noch nicht auf Rang 5, und nach 5 verschiedenen nur noch diese
function availableStats(player) {
  const owned = Object.keys(player.stats);
  const full = owned.length >= STAT_MAX_DISTINCT;
  return Object.keys(STATS).filter((id) => {
    if (STATS[id].ranged && player.cls.attack === 'melee') return false; // Krieger hat keine Geschosse
    if ((player.stats[id] || 0) >= STAT_MAX_RANK) return false;
    return !full || owned.includes(id);
  });
}

function rollStatOptions(player, avoid = []) {
  const pool = availableStats(player);
  const fresh = pool.filter((id) => !avoid.includes(id));
  const pick = (list, n) => [...list].sort(() => Math.random() - 0.5).slice(0, n);
  let options = pick(fresh, 3);
  if (options.length < 3) options = options.concat(pick(pool.filter((id) => !options.includes(id)), 3 - options.length));
  return options;
}
