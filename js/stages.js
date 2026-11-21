// Ebenen, Ebenen-Boss Volghard, Dornenpflanzen, Trolle und Steinsäulen.
// Alle Balance-Werte für Ebenen stehen hier oben gebündelt.

// ---------- Ebenen ----------
// duration = Sekunden bis zum Boss (null = endlos), levelBonus = Gegner so viele Level stärker,
// replace = Gegnertyp austauschen, pillars = Steinsäulen erscheinen
const STAGES = [
  { name: 'Wald', ground: 'grass', duration: 300, boss: 'volghard', levelBonus: 0, replace: {}, pillars: false },
  { name: 'Steinebene', ground: 'stone', duration: null, boss: null, levelBonus: 2, replace: { zombie: 'troll' }, pillars: true },
];

// Volghard, der Naturbaum (Boss am Ende von Ebene 1). hp/dmg wachsen wie bei allen Gegnern mit dem Gegnerlevel.
const VOLGHARD = {
  spawnDist: 140, // so weit weg vom Helden erscheint er
  thornCd: 2.3, // Sekunden zwischen zwei Dornensalven
  windup: 0.45, // kurzes Zittern als Warnung vor jeder Salve
  ringThorns: 10, // Dornen beim Rundumschuss
  fanThorns: 5, // Dornen beim gezielten Fächer (abwechselnd mit dem Rundumschuss)
  fanSpread: 0.2,
  thornSpeed: 72,
  thornRange: 200,
  plantCd: 7, // Sekunden zwischen zwei neuen Pflanzen
  maxPlants: 5, // höchstens so viele Pflanzen gleichzeitig
};

// Gift der Dornenpflanzen: fester Schaden pro Treffer, dann Schaden pro Sekunde.
// Ein neuer Treffer startet die Dauer neu, Gift stapelt sich nicht.
const POISON = { hitDmg: 5, tickDmg: 1, duration: 5 };

// Steinsäulen in Ebene 2
const PILLAR = {
  interval: [4, 7], // neue Säule alle 4 bis 7 Sekunden
  max: 7, // höchstens so viele gleichzeitig
  life: 18, // Sekunden, bis die Säule wieder versinkt
  rise: 0.4, // Sekunden pro Animationsstufe (Spitze, fast oben, oben)
  minDist: 45, // nie näher am Helden
  maxDist: 160,
  spacing: 45, // Mindestabstand zwischen zwei Säulen
  radius: 4, // Körpergröße (blockt Held und Gegner)
  slowRadius: 24, // Umkreis, in dem der Held verlangsamt wird
  slow: 0.55, // Lauftempo im Umkreis (0.55 = 45 % langsamer)
};

// ---------- Neue Gegnertypen ----------

ENEMY_TYPES.troll = {
  name: 'Troll', sprites: ['trollA', 'trollB'], hp: 80, speed: 17, contact: 18, xp: 9, r: 6, blood: '#7d8a6a',
};
ENEMY_TYPES.plant = {
  name: 'Dornenpflanze', sprites: ['plantA', 'plantB'], hp: 40, speed: 0, contact: 0, xp: 5, r: 5, blood: '#5fae3e',
  special: true, anchored: true, // kein Zufallsgegner, lässt sich nicht wegschubsen
  ranged: { dist: 0, cd: 1.6, speed: 100, dmg: 0, shots: 1, kind: 'seed', range: 190, fixedDmg: POISON.hitDmg, poison: true },
};
ENEMY_TYPES.volghard = {
  name: 'Volghard', sprites: ['volghardA', 'volghardB'], hp: 1200, speed: 13, contact: 18, xp: 400, r: 11, blood: '#4f9a3a',
  special: true, tree: true,
  thornDmg: 10,
};

// ---------- Sprites ----------

SPR.trollA = makeSprite([
  '....kkkkk....',
  '...ktttttk...',
  '..kttTtwtwk..',
  '..ktttttttk..',
  '..ktwkkkwtk..',
  '.kkktttttkkk.',
  'ktttTTtttTttk',
  'kttTtttttTttk',
  'ktk.kLLLLk.kk',
  'kk..kLLlLk...',
  '....ktk.ktk..',
  '...kttk.kttk.',
  '...kkkk.kkkk.',
], { t: '#8a9a7a', T: '#5f6e52', L: '#5e3b1c', l: '#8a5a2b' });
SPR.trollB = makeSprite([
  '.............',
  '....kkkkk....',
  '...ktttttk...',
  '..kttTtwtwk..',
  '..ktttttttk..',
  '..ktwkkkwtk..',
  '.kkktttttkkk.',
  'ktttTTtttTttk',
  'kttTtttttTttk',
  'ktk.kLLLLk.kk',
  'kk..kLLlLk...',
  '...kttk.kttk.',
  '...kkkk.kkkk.',
], { t: '#8a9a7a', T: '#5f6e52', L: '#5e3b1c', l: '#8a5a2b' });

const PLANT_COLORS = { f: '#c94a6a', F: '#8a2a4a', g: '#5fae3e', G: '#3b7326' };
SPR.plantA = makeSprite([
  '...kkkk...',
  '..kffffk..',
  '.kfFffFfk.',
  '.kkwkkwkk.',
  '.kffffffk.',
  '..kkGgkk..',
  '.kgk.gkgk.',
  'kggk.gkggk',
  '.kk.kGk.k.',
  '...kGGGk..',
  '...kkkkk..',
], PLANT_COLORS);
SPR.plantB = makeSprite([
  '...kkkk...',
  '..kffffk..',
  '.kfFffFfk.',
  '.kwkkkkwk.',
  '.kffffffk.',
  '..kkGgkk..',
  '.kgk.gkgk.',
  'kggk.gkggk',
  '.kk.kGk.k.',
  '...kGGGk..',
  '...kkkkk..',
], PLANT_COLORS);

const VOLGHARD_COLORS = { g: '#4f9a3a', G: '#2f6a2a', L: '#4a2e16', l: '#7a5028', x: '#d6ff6a', f: '#ff7aa8' };
const VOLGHARD_ROWS = [
  '......kkkkkkkk......',
  '....kkGgggGGggkk....',
  '...kGggfgGgggggGk...',
  '..kGgggGGggggfggGk..',
  '.kGggGggggGGgggggGk.',
  '.kgggggGgggggGgggGk.',
  'kGgfgggggGggggggfgGk',
  'kggggGGgggggGggggggk',
  '.kGgggggGgggggGgggk.',
  '..kkGggkLLLLkggGkk..',
  '....kkkLLLLLLkkk....',
  '.......kLxLLxk......',
  '.......kLLLLLk......',
  '.......kLLkkLk......',
  '......kLLLLLLLk.....',
  '......kLlLLLlLk.....',
  '.....kLLlLLLlLLk....',
  '....kLLkLLLLLkLLk...',
  '...kLk.kLLLLLk.kLk..',
  '...kk..kLLLLLk..kk..',
  '......kLLk.kLLk.....',
  '.....kLLk...kLLk....',
  '.....kkk.....kkk....',
];
SPR.volghardA = makeSprite(VOLGHARD_ROWS, VOLGHARD_COLORS);
// zweites Bild: Krone wiegt sich einen Pixel zur Seite
SPR.volghardB = makeSprite(VOLGHARD_ROWS.map((r, i) => (i < 10 ? `.${r.slice(0, -1)}` : r)), VOLGHARD_COLORS);

SPR.thorn = makeSprite([
  'k.....',
  'LLLlly',
  'k.....',
], { L: '#4a2e16', l: '#7a5028', y: '#e8e4d4' });

SPR.pillar = makeSprite([
  '..kkk..',
  '.kOoOk.',
  'kOoooOk',
  'kOoOOOk',
  'kooOOOk',
  'kOoOOOk',
  'kOooOOk',
  'kOoOOOk',
  'kooOOOk',
  'kOoOOOk',
  'kOooOOk',
  'kOoOOOk',
  'kkOOOkk',
], { o: '#a8a8b2', O: '#6d6d78' });

// ---------- Steinboden ----------

const STONE = [1, 2, 3, 4].map((seed) => {
  const c = document.createElement('canvas');
  c.width = c.height = TILE;
  const g = c.getContext('2d');
  const rnd = seeded(seed * 613);
  g.fillStyle = '#5b5a63';
  g.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 30; i++) {
    g.fillStyle = rnd() < 0.5 ? '#525159' : '#66656f';
    g.fillRect(Math.floor(rnd() * TILE), Math.floor(rnd() * TILE), 1, 1);
  }
  // Fugen zwischen Steinplatten
  g.fillStyle = '#47464e';
  g.fillRect(0, TILE - 1, TILE, 1);
  g.fillRect(seed % 2 ? 6 : 10, 0, 1, TILE - 1);
  return c;
});

function drawStoneGround(ctx, cam) {
  const x0 = Math.floor(cam.x / TILE);
  const y0 = Math.floor(cam.y / TILE);
  const max = WORLD / TILE;
  for (let ty = y0; ty <= y0 + Math.ceil(H / TILE); ty++) {
    for (let tx = x0; tx <= x0 + Math.ceil(W / TILE); tx++) {
      const sx = tx * TILE - cam.x;
      const sy = ty * TILE - cam.y;
      if (tx < 0 || ty < 0 || tx >= max || ty >= max) {
        ctx.fillStyle = (tx + ty) % 2 ? '#2a2930' : '#26252b';
        ctx.fillRect(sx, sy, TILE, TILE);
        continue;
      }
      const h = tileHash(tx, ty);
      ctx.drawImage(STONE[h % 4], sx, sy);
      const deco = (h >>> 8) % 100;
      const dx = sx + 3 + ((h >>> 16) % 9);
      const dy = sy + 3 + ((h >>> 20) % 9);
      if (deco < 5) drawSprite(ctx, SPR.rock, dx, dy);
      else if (deco < 12) { // Riss
        ctx.fillStyle = '#3e3d44';
        ctx.fillRect(dx - 2, dy, 2, 1); ctx.fillRect(dx, dy + 1, 2, 1); ctx.fillRect(dx + 2, dy + 2, 1, 1);
      }
    }
  }
}

// ---------- Volghard ----------

function spawnStageBoss(game) {
  const p = game.player;
  let pos = null;
  for (let tries = 0; tries < 16 && !pos; tries++) {
    const a = Math.random() * Math.PI * 2;
    const x = p.x + Math.cos(a) * VOLGHARD.spawnDist;
    const y = p.y + Math.sin(a) * VOLGHARD.spawnDist;
    if (x > 30 && y > 30 && x < WORLD - 30 && y < WORLD - 30) pos = { x, y };
  }
  if (!pos) pos = { x: WORLD / 2, y: WORLD / 2 };
  const e = new Enemy('volghard', enemyLevel(game), pos.x, pos.y);
  e.boss = true;
  e.bossBar = true;
  e.speed = e.type.speed; // kein Zufallstempo
  e.thornT = 2;
  e.plantT = 4;
  e.windupT = 0;
  e.volley = 0;
  game.enemies.push(e);
  game.stageBoss = e;
  game.shake = 8;
  game.fx.ring(e.x, e.y, '#4f9a3a', 40);
  game.fx.burst(e.x, e.y, '#4f9a3a', 40);
}

// Bewegung und Angriffe von Volghard. Gibt die Laufrichtung zurück.
function updateVolghard(e, dt, game, ux, uy) {
  const p = game.player;
  const dmg = e.type.thornDmg * (1 + 0.1 * (e.level - 1));

  if (e.windupT > 0) {
    if ((e.windupT -= dt) <= 0) {
      const toPlayer = Math.atan2(p.y - e.y, p.x - e.x);
      const ring = e.volley % 2 === 0;
      const n = ring ? VOLGHARD.ringThorns : VOLGHARD.fanThorns;
      for (let i = 0; i < n; i++) {
        const a = ring ? toPlayer + (i * Math.PI * 2) / n : toPlayer + (i - (n - 1) / 2) * VOLGHARD.fanSpread;
        game.projectiles.push({
          friendly: false, kind: 'thorn', x: e.x, y: e.y,
          vx: Math.cos(a) * VOLGHARD.thornSpeed, vy: Math.sin(a) * VOLGHARD.thornSpeed,
          life: VOLGHARD.thornRange / VOLGHARD.thornSpeed, r: 2, dmg,
        });
      }
      e.volley++;
      e.thornT = VOLGHARD.thornCd;
    }
    return { x: 0, y: 0 }; // steht beim Schießen still
  }

  if ((e.thornT -= dt) <= 0) e.windupT = VOLGHARD.windup;

  const plants = game.enemies.filter((o) => !o.dead && o.type === ENEMY_TYPES.plant).length;
  if ((e.plantT -= dt) <= 0) {
    e.plantT = VOLGHARD.plantCd;
    if (plants < VOLGHARD.maxPlants) {
      // Pflanze wächst zwischen Volghard und dem Helden aus dem Boden
      const a = Math.atan2(uy, ux) + (Math.random() - 0.5) * 2;
      const dist = 30 + Math.random() * 25;
      const x = Math.max(10, Math.min(WORLD - 10, e.x + Math.cos(a) * dist));
      const y = Math.max(10, Math.min(WORLD - 10, e.y + Math.sin(a) * dist));
      const plant = new Enemy('plant', e.level, x, y);
      plant.fireT = 1.5;
      game.enemies.push(plant);
      game.fx.burst(x, y, '#5fae3e', 14);
      game.fx.ring(x, y, '#5fae3e', 10);
    }
  }
  return { x: ux, y: uy };
}

// ---------- Steinsäulen ----------

const pillarActive = (pl) => pl.age >= PILLAR.rise * 2 && pl.age < PILLAR.life;

// Sichtbare Höhe in Pixeln: Spitze, fast oben, oben (und beim Versinken rückwärts)
function pillarRows(pl) {
  const steps = [3, 9, SPR.pillar.h];
  if (pl.age >= PILLAR.life) {
    const k = Math.floor((pl.age - PILLAR.life) / PILLAR.rise);
    return k >= 2 ? 0 : steps[1 - k];
  }
  return steps[Math.min(2, Math.floor(pl.age / PILLAR.rise))];
}

function updatePillars(dt, game) {
  for (const pl of game.pillars) pl.age += dt;
  game.pillars = game.pillars.filter((pl) => pl.age < PILLAR.life + PILLAR.rise * 2);
  if (!game.stageDef.pillars || game.state !== 'play') return;

  game.pillarT -= dt;
  if (game.pillarT > 0) return;
  const [a, b] = PILLAR.interval;
  game.pillarT = a + Math.random() * (b - a);
  if (game.pillars.length >= PILLAR.max) return;

  const p = game.player;
  for (let tries = 0; tries < 12; tries++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = PILLAR.minDist + Math.random() * (PILLAR.maxDist - PILLAR.minDist);
    const x = p.x + Math.cos(ang) * dist;
    const y = p.y + Math.sin(ang) * dist;
    if (x < 20 || y < 20 || x > WORLD - 20 || y > WORLD - 20) continue;
    if (game.pillars.some((o) => Math.hypot(o.x - x, o.y - y) < PILLAR.spacing)) continue;
    game.pillars.push({ x, y, age: 0, draw: drawPillar });
    return;
  }
}

// Schiebt Held oder Gegner aus einer Säule heraus (Bodyblock).
// Gegner (slide > 0) rutschen dabei seitlich an der Säule vorbei, statt dahinter hängen zu bleiben.
function blockByPillars(obj, game, slide = 0) {
  for (const pl of game.pillars) {
    if (!pillarActive(pl)) continue;
    let dx = obj.x - pl.x;
    let dy = obj.y - pl.y;
    let d = Math.hypot(dx, dy);
    const min = obj.r + PILLAR.radius;
    if (d >= min) continue;
    if (d < 0.01) { dx = 1; dy = 0; d = 1; }
    const nx = dx / d;
    const ny = dy / d;
    obj.x = pl.x + nx * min;
    obj.y = pl.y + ny * min;
    if (slide > 0) {
      // Richtung zum Helden auf die Säulenkante umlenken
      const p = game.player;
      let tx = -ny, ty = nx;
      if (tx * (p.x - obj.x) + ty * (p.y - obj.y) < 0) { tx = -tx; ty = -ty; }
      obj.x += tx * slide;
      obj.y += ty * slide;
    }
  }
}

// Faktor fürs Lauftempo des Helden (1 = normal)
function pillarSlow(game, x, y) {
  for (const pl of game.pillars) {
    if (pillarActive(pl) && Math.hypot(x - pl.x, y - pl.y) < PILLAR.slowRadius) return PILLAR.slow;
  }
  return 1;
}

// Staubkreis am Boden, zeigt den Bremsbereich
function drawPillarZones(ctx, cam, game) {
  for (const pl of game.pillars) {
    if (!pillarActive(pl)) continue;
    const sx = Math.round(pl.x - cam.x);
    const sy = Math.round(pl.y - cam.y);
    ctx.fillStyle = 'rgba(30,28,34,0.18)';
    ctx.beginPath();
    ctx.arc(sx, sy, PILLAR.slowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7d7c86';
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI * 2) / 16 + game.time * 0.3;
      ctx.fillRect(Math.round(sx + Math.cos(a) * PILLAR.slowRadius), Math.round(sy + Math.sin(a) * PILLAR.slowRadius), 1, 1);
    }
  }
}

function drawPillar(ctx, cam) {
  const n = pillarRows(this);
  const sx = Math.round(this.x - cam.x);
  const sy = Math.round(this.y - cam.y) + 4; // Fuß der Säule auf Höhe der Füße
  const s = SPR.pillar;
  // aufgeworfene Erde am Boden
  ctx.fillStyle = '#3e3d44';
  ctx.fillRect(sx - 5, sy - 1, 11, 2);
  ctx.fillStyle = '#7d7c86';
  ctx.fillRect(sx - 4, sy - 1, 1, 1);
  ctx.fillRect(sx + 4, sy, 1, 1);
  if (n > 0) ctx.drawImage(s.img, 0, 0, s.w, n, sx - Math.floor(s.w / 2), sy - n, s.w, n);
}
