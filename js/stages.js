// Ebenen, Ebenen-Bosse (Volghard, El'Matho), Dornenpflanzen, Trolle, Ratten, Wichte und Steinsäulen.
// Alle Balance-Werte für Ebenen stehen hier oben gebündelt.

// ---------- Ebenen ----------
// duration = Sekunden bis zum Boss (null = endlos), levelBonus = Gegner so viele Level stärker,
// replace = Gegnertyp austauschen (Liste = zufällig einer davon), weightMul = Häufigkeit ändern,
// pillars = Steinsäulen erscheinen. Nach dem Boss der letzten Ebene hat man gewonnen.
const STAGES = [
  { name: 'Wald', music: 'forest', ground: 'grass', duration: 300, boss: 'volghard', levelBonus: 0, replace: {}, pillars: false },
  {
    name: 'Katakomben', music: 'catacombs', ground: 'crypt', duration: 420, boss: 'elmatho', levelBonus: 2, pillars: true,
    replace: { zombie: 'troll', skeleton: ['rat', 'wight'] }, // Skelett-Plätze: halb Ratten, halb Wichte
    weightMul: { bat: 0.8 }, // etwas weniger Fledermäuse
  },
];

// Volghard, der Naturbaum (Boss am Ende von Ebene 1). hp/dmg wachsen wie bei allen Gegnern mit dem Gegnerlevel.
const VOLGHARD = {
  spawnDist: 140, // so weit weg vom Helden erscheint er
  thornCd: 1.9, // Sekunden zwischen zwei Dornensalven
  windup: 0.45, // kurzes Zittern als Warnung vor jeder Salve
  ringThorns: 10, // Dornen beim Rundumschuss
  fanThorns: 5, // Dornen beim gezielten Fächer (abwechselnd mit dem Rundumschuss)
  fanSpread: 0.2,
  thornSpeed: 72,
  thornRange: 200,
  plantCd: 5, // Sekunden zwischen zwei neuen Pflanzen
  maxPlants: 7, // höchstens so viele Pflanzen gleichzeitig
};

// El'Matho, König der Trolle (Boss am Ende von Ebene 2). Schaden wächst mit dem Gegnerlevel.
const ELMATHO = {
  spawnDist: 150,
  slamCd: 6, slamWindup: 1.0, slamRadius: 55, slamDmg: 26, // Bodenstampfer mit Warnkreis
  rockCd: 3.5, rockFlight: 1.1, rockRadius: 14, rockDmg: 18, // Felswurf, Schatten zeigt den Einschlag
  summonCd: 14, summonCount: [2, 3], maxTrolls: 6, // ruft Trolle zur Hilfe
  rageAt: 0.5, rageSpeed: 1.5, rageCd: 0.65, // ab 50 % Leben: 50 % schneller, Angriffe öfter
};

// Gift der Dornenpflanzen: fester Schaden pro Treffer, dann Schaden pro Sekunde.
// Ein neuer Treffer startet die Dauer neu, Gift stapelt sich nicht.
const POISON = { hitDmg: 5, tickDmg: 1, duration: 5 };

// Steinsäulen in Ebene 2
const PILLAR = {
  interval: [4, 7], // neue Säule alle 4 bis 7 Sekunden
  max: 7, // höchstens so viele gleichzeitig
  life: 18, // Sekunden, bis die Säule wieder versinkt
  rise: 1.0, // Sekunden pro Animationsstufe (Spitze, fast oben, oben)
  minDist: 45, // nie näher am Helden
  viewMargin: -15, // erscheinen im Bild (negativ = so viele Pixel vom Bildrand entfernt)
  spacing: 45, // Mindestabstand zwischen zwei Säulen
  radius: 4, // Körpergröße (blockt Held und Gegner)
  slowRadius: 24, // Umkreis, in dem der Held verlangsamt wird
  slow: 0.55, // Lauftempo im Umkreis (0.55 = 45 % langsamer)
};

// ---------- Neue Gegnertypen ----------

// stageOnly = kommt nur als Austausch in einer Ebene vor (nicht als normaler Zufallsgegner)
ENEMY_TYPES.troll = {
  name: 'Troll', sprites: ['trollA', 'trollB'], hp: 80, speed: 17, contact: 18, xp: 9, r: 6, blood: '#7d8a6a', stageOnly: true,
};
// Ratte: wie ein Skelett-Schütze, aber weniger Schaden. Dafür Gift: 2 Schaden pro Sekunde, 5 s lang
ENEMY_TYPES.rat = {
  name: 'Ratte', sprites: ['ratA', 'ratB'], hp: 28, speed: 30, contact: 0, xp: 7, r: 4, blood: '#8a6a5a', stageOnly: true,
  ranged: { dist: 85, cd: 1.9, speed: 90, dmg: 4, retreat: 0.5, kind: 'venom', poison: { tickDmg: 2, duration: 5 } },
};
// Wicht: schnell, holt kurz aus und springt dann zu
ENEMY_TYPES.wight = {
  name: 'Wicht', sprites: ['wightA', 'wightB'], hp: 45, speed: 38, contact: 14, xp: 9, r: 5, blood: '#8a8fb0', stageOnly: true,
  lunge: { range: 34, windup: 0.3, time: 0.16, speed: 220, cd: 1.6 },
};
ENEMY_TYPES.elmatho = {
  name: "El'Matho", title: 'König der Trolle', sprites: ['elmathoA', 'elmathoB'], hp: 1500, speed: 16, contact: 22, xp: 600, r: 12,
  blood: '#7d8a6a', special: true, king: true,
};
ENEMY_TYPES.plant = {
  name: 'Dornenpflanze', sprites: ['plantA', 'plantB'], hp: 40, speed: 0, contact: 0, xp: 5, r: 5, blood: '#5fae3e',
  special: true, anchored: true, // kein Zufallsgegner, lässt sich nicht wegschubsen
  ranged: { dist: 0, cd: 1.6, speed: 100, dmg: 0, shots: 1, kind: 'seed', range: 190, fixedDmg: POISON.hitDmg, poison: true },
};
ENEMY_TYPES.volghard = {
  name: 'Volghard', title: 'Der verdorbene Baum', sprites: ['volghardA', 'volghardB'], hp: 1600, speed: 15, contact: 18, xp: 400, r: 11, blood: '#3a4a2a',
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

// Volghard: runtergekommener, toter Baum mit kahlen Ästen, etwas Moos und glühenden Augen
const VOLGHARD_COLORS = { L: '#2e2218', l: '#4a3626', G: '#26301c', g: '#465428', x: '#ff5a2a', X: '#ffb05a' };
const VOLGHARD_ROWS = [
  '.k......kk.......k....',
  'kLk....kLLk.....kLk...',
  '.kLk..kLLk...k.kLk.k..',
  '..kLkkLLk..kkLkLLk.kLk',
  'k..kLLLk.kkLLLkLk.kLk.',
  'Lk.kGLLkkLLLGgLLkkLk..',
  '.kLLgGLLLLGgGkLLLLk...',
  '..kkLLLGLLLLLLLLkk.k..',
  '.kGgkkLLLLLLGLLk..kLk.',
  'kGgGk.kkLLLLLkk.kkLk..',
  '.kgk...kLLlLLLkkLLk...',
  '..g....kLxXLxXLkk.....',
  '.......kLLLLLLk.......',
  '.......kLlkkLLk.......',
  '......kLLLLlLLLk......',
  '......kLlLLLLlLk......',
  '.....kLLLlLLLLLLk.....',
  '....kLLkLLlLLLkLLk....',
  '...kLk.kLLLLLLk.kLk...',
  '..kLk..kLLLLLLk..kLk..',
  '..kk..kLLk..kLLk..kk..',
  '.....kLLk....kLLk.....',
  '.....kkk......kkk.....',
];
SPR.volghardA = makeSprite(VOLGHARD_ROWS, VOLGHARD_COLORS);
// zweites Bild: die kahlen Äste wiegen sich einen Pixel zur Seite
SPR.volghardB = makeSprite(VOLGHARD_ROWS.map((r, i) => (i < 10 ? `.${r.slice(0, -1)}` : r)), VOLGHARD_COLORS);

// Ratte (schießt Giftspucke)
const RAT_COLORS = { a: '#8a7a6a', A: '#5e5246', x: '#ff4d4d', p: '#ff9aa8' };
SPR.ratA = makeSprite([
  '.......kk..',
  '......kaak.',
  '.kkkkkaaxak',
  'kaaaaaaaaap',
  '.kaaAaaaak.',
  'k.kAkkkAk..',
  '....k...k..',
], RAT_COLORS);
SPR.ratB = makeSprite([
  '.......kk..',
  '......kaak.',
  '.kkkkkaaxak',
  'kaaaaaaaaap',
  '.kaaAaaaak.',
  '.k.kAkkAk..',
  '...k...k...',
], RAT_COLORS);

// Wicht (bleicher Kapuzengeist mit Krallen)
const WIGHT_COLORS = { V: '#4a4f6a', v: '#c8cde0', w: '#e8f0ff', e: '#7fd4ff' };
SPR.wightA = makeSprite([
  '...kkkkk....',
  '..kVVVVVk...',
  '.kVVvvvVVk..',
  '.kVvkekeVk..',
  '.kVvvvvvVk..',
  '..kVkkkVk...',
  '.kVVVVVVVk..',
  'kwkVVVVVVkwk',
  '.k.kVVVVk.k.',
  '...kVVVVk...',
  '...kVkkVk...',
  '...kk..kk...',
], WIGHT_COLORS);
SPR.wightB = makeSprite([
  '............',
  '...kkkkk....',
  '..kVVVVVk...',
  '.kVVvvvVVk..',
  '.kVvkekeVk..',
  '.kVvvvvvVk..',
  '..kVkkkVk...',
  'kwkVVVVVVkwk',
  '.k.VVVVVVk.k',
  '...kVVVVk...',
  '...kVkkVk...',
  '...kk..kk...',
], WIGHT_COLORS);

// El'Matho, König der Trolle: großer Troll mit Krone, Königsschurz und Keule
const ELMATHO_COLORS = { t: '#8a9a7a', T: '#5f6e52', y: '#ffd34a', r: '#d93a4a', x: '#ff4d4d', w: '#f5f5d0', P: '#6b2a8c', L: '#5e3b1c', l: '#8a5a2b' };
const ELMATHO_ROWS = [
  '......y.y.y.y.........',
  '......yyyyyyy.........',
  '.....kyryyyryk........',
  '....kttttttttttk......',
  '...kttTttttttTttk.....',
  '...kttxktttkxttk......',
  '...ktttttTttttttk.....',
  '...kttwkkkkkwttk......',
  '..kkktttttttttkkk.....',
  '.kttttTTTTTTTttttk....',
  'kttTttttttttttTttk.ll.',
  'kttTtttTTTTtttTttklLLl',
  'kttktttttttttktttkLLL.',
  'ktk.kPPPPPPPPk.kttkL..',
  'kk..kPPyPPyPPk..kkkL..',
  '....kPPPPPPPPk....kL..',
  '....kttk..kttk.....L..',
  '...ktttk..ktttk.......',
  '...kTTTk..kTTTk.......',
  '...kkkkk..kkkkk.......',
];
SPR.elmathoA = makeSprite(ELMATHO_ROWS, ELMATHO_COLORS);
SPR.elmathoB = makeSprite(ELMATHO_ROWS.map((r, i) => (i >= 16 ? (i % 2 ? `.${r.slice(0, -1)}` : `${r.slice(1)}.`) : r)), ELMATHO_COLORS);

SPR.boulder = makeSprite([
  '..kkkk..',
  '.kooOOk.',
  'kooooOOk',
  'koOooOOk',
  'kooooOOk',
  'kOooOOOk',
  '.kOOOOk.',
  '..kkkk..',
], { o: '#8c8c96', O: '#5d5d68' });
SPR.bone = makeSprite(['k...k', '.ooo.', 'k...k'], { o: '#d8d2c0' });
SPR.skull = makeSprite(['.kkk.', 'kooo.', 'kxoxk', '.koo.', '..k..'], { o: '#d8d2c0', x: '#1a1420' });

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

// ---------- Katakomben-Boden ----------

const CRYPT = [1, 2, 3, 4].map((seed) => {
  const c = document.createElement('canvas');
  c.width = c.height = TILE;
  const g = c.getContext('2d');
  const rnd = seeded(seed * 431);
  g.fillStyle = '#35303a';
  g.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 30; i++) {
    g.fillStyle = rnd() < 0.5 ? '#2e2a33' : '#3d3843';
    g.fillRect(Math.floor(rnd() * TILE), Math.floor(rnd() * TILE), 1, 1);
  }
  g.fillStyle = '#25212a';
  g.fillRect(0, TILE - 1, TILE, 1);
  g.fillRect(seed % 2 ? 5 : 11, 0, 1, TILE - 1);
  return c;
});

function drawCryptGround(ctx, cam) {
  const x0 = Math.floor(cam.x / TILE);
  const y0 = Math.floor(cam.y / TILE);
  const max = WORLD / TILE;
  for (let ty = y0; ty <= y0 + Math.ceil(H / TILE); ty++) {
    for (let tx = x0; tx <= x0 + Math.ceil(W / TILE); tx++) {
      const sx = tx * TILE - cam.x;
      const sy = ty * TILE - cam.y;
      if (tx < 0 || ty < 0 || tx >= max || ty >= max) {
        ctx.fillStyle = (tx + ty) % 2 ? '#141117' : '#110f14';
        ctx.fillRect(sx, sy, TILE, TILE);
        continue;
      }
      const h = tileHash(tx, ty);
      ctx.drawImage(CRYPT[h % 4], sx, sy);
      const deco = (h >>> 8) % 100;
      const dx = sx + 3 + ((h >>> 16) % 9);
      const dy = sy + 3 + ((h >>> 20) % 9);
      if (deco < 3) drawSprite(ctx, SPR.skull, dx, dy);
      else if (deco < 8) drawSprite(ctx, SPR.bone, dx, dy);
      else if (deco < 14) { // Riss
        ctx.fillStyle = '#1e1b22';
        ctx.fillRect(dx - 2, dy, 2, 1); ctx.fillRect(dx, dy + 1, 2, 1); ctx.fillRect(dx + 2, dy + 2, 1, 1);
      }
    }
  }
}

// ---------- Ebenen-Bosse ----------

function spawnStageBoss(game) {
  const id = game.stageDef.boss;
  const cfg = id === 'elmatho' ? ELMATHO : VOLGHARD;
  const p = game.player;
  let pos = null;
  for (let tries = 0; tries < 16 && !pos; tries++) {
    const a = Math.random() * Math.PI * 2;
    const x = p.x + Math.cos(a) * cfg.spawnDist;
    const y = p.y + Math.sin(a) * cfg.spawnDist;
    if (x > 30 && y > 30 && x < WORLD - 30 && y < WORLD - 30) pos = { x, y };
  }
  if (!pos) pos = { x: WORLD / 2, y: WORLD / 2 };
  const e = new Enemy(id, enemyLevel(game), pos.x, pos.y);
  e.boss = true;
  e.bossBar = true;
  e.speed = e.baseSpeed = e.type.speed; // kein Zufallstempo
  if (id === 'volghard') {
    e.thornT = 2;
    e.plantT = 3;
    e.windupT = 0;
    e.volley = 0;
  } else {
    e.slamT = 3;
    e.slamWind = 0;
    e.rockT = 2;
    e.summonT = 8;
  }
  e.spawnedAt = game.runTime;
  e.fightTime = 0;
  game.enemies.push(e);
  game.stageBoss = e;
  game.shake = 8;
  Sound.play('bossRoar');
  const col = id === 'elmatho' ? '#8a9a7a' : '#465428';
  game.fx.ring(e.x, e.y, col, 40);
  game.fx.burst(e.x, e.y, col, 40);
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
          life: VOLGHARD.thornRange / VOLGHARD.thornSpeed, r: 2, dmg, src: 'Volghard',
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

// ---------- El'Matho ----------

// Bewegung und Angriffe von El'Matho. Gibt die Laufrichtung zurück.
function updateElMatho(e, dt, game, ux, uy, d) {
  const p = game.player;
  if (!e.enraged && e.hp / e.maxHp <= ELMATHO.rageAt) {
    e.enraged = true;
    game.shake = 10;
    game.fx.text(e.x, e.y - 22, 'Wut!', '#ff5a5a');
    game.fx.ring(e.x, e.y, '#ff2a2a', 50);
  }
  const cdMul = e.enraged ? ELMATHO.rageCd : 1;
  e.speed = e.baseSpeed * (e.enraged ? ELMATHO.rageSpeed : 1);
  const dmgMul = 1 + 0.1 * (e.level - 1);

  // Bodenstampfer: steht still, Warnkreis füllt sich, dann Schockwelle
  if (e.slamWind > 0) {
    if ((e.slamWind -= dt) <= 0) {
      Sound.play('slam');
      if (Math.hypot(p.x - e.x, p.y - e.y) < ELMATHO.slamRadius + p.r) p.takeDamage(ELMATHO.slamDmg * dmgMul, game, { src: "El'Matho" });
      game.shake = 10;
      game.fx.ring(e.x, e.y, '#ff9a3c', ELMATHO.slamRadius);
      game.fx.ring(e.x, e.y, '#8a6a4a', ELMATHO.slamRadius * 1.2);
      game.fx.burst(e.x, e.y + 8, '#6a5a4a', 30);
      e.slamT = ELMATHO.slamCd * cdMul;
    }
    return { x: 0, y: 0 };
  }
  if ((e.slamT -= dt) <= 0 && d < ELMATHO.slamRadius * 1.5) {
    e.slamWind = ELMATHO.slamWindup * (e.enraged ? 0.8 : 1);
    e.slamMax = e.slamWind;
    Sound.play('slamWarn');
    return { x: 0, y: 0 };
  }

  // Felswurf auf die Stelle, an der der Held gerade steht
  if ((e.rockT -= dt) <= 0) {
    e.rockT = ELMATHO.rockCd * cdMul;
    game.hazards.push({
      kind: 'rock', x0: e.x, y0: e.y - 10, x: p.x, y: p.y, t: ELMATHO.rockFlight, max: ELMATHO.rockFlight,
      radius: ELMATHO.rockRadius, dmg: ELMATHO.rockDmg * dmgMul, src: "El'Matho",
    });
  }

  // Trolle rufen
  if ((e.summonT -= dt) <= 0) {
    e.summonT = ELMATHO.summonCd * cdMul;
    const trolls = game.enemies.filter((o) => !o.dead && o.type === ENEMY_TYPES.troll).length;
    const [a, b] = ELMATHO.summonCount;
    const n = Math.min(a + Math.floor(Math.random() * (b - a + 1)), ELMATHO.maxTrolls - trolls);
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const x = Math.max(10, Math.min(WORLD - 10, e.x + Math.cos(ang) * 30));
      const y = Math.max(10, Math.min(WORLD - 10, e.y + Math.sin(ang) * 30));
      game.enemies.push(new Enemy('troll', e.level, x, y));
      game.fx.burst(x, y, '#7d8a6a', 12);
    }
    if (n > 0) game.fx.text(e.x, e.y - 22, 'Zu mir!', '#b9b4a6');
  }
  return { x: ux, y: uy };
}

function drawElMathoWarnings(e, ctx, cam, game) {
  if (!(e.slamWind > 0)) return;
  const sx = Math.round(e.x - cam.x);
  const sy = Math.round(e.y - cam.y);
  const prog = 1 - e.slamWind / e.slamMax;
  ctx.fillStyle = 'rgba(255,40,40,0.15)';
  ctx.beginPath();
  ctx.arc(sx, sy, ELMATHO.slamRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,60,40,0.3)';
  ctx.beginPath();
  ctx.arc(sx, sy, ELMATHO.slamRadius * prog, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,60,40,${0.5 + 0.5 * prog})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(sx, sy, ELMATHO.slamRadius, 0, Math.PI * 2);
  ctx.stroke();
}

// Gefahren am Boden (Felsbrocken von El'Matho)
function updateHazards(dt, game) {
  const p = game.player;
  for (const h of game.hazards) {
    h.t -= dt;
    if (h.t > 0) continue;
    if (p && Math.hypot(p.x - h.x, p.y - h.y) < h.radius + p.r) p.takeDamage(h.dmg, game, { src: h.src });
    game.shake = Math.max(game.shake, 4);
    Sound.play('rock');
    game.fx.ring(h.x, h.y, '#8c8c96', h.radius);
    game.fx.burst(h.x, h.y, '#6d6d78', 14);
  }
  game.hazards = game.hazards.filter((h) => h.t > 0);
}

function drawHazards(ctx, cam, game) {
  for (const h of game.hazards) {
    const prog = 1 - h.t / h.max;
    const tx = Math.round(h.x - cam.x);
    const ty = Math.round(h.y - cam.y);
    // Schatten am Einschlagort wird größer
    ctx.fillStyle = `rgba(0,0,0,${0.2 + 0.25 * prog})`;
    ctx.beginPath();
    ctx.ellipse(tx, ty, Math.max(1, h.radius * prog), Math.max(1, h.radius * 0.5 * prog), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,60,40,0.5)';
    ctx.beginPath();
    ctx.ellipse(tx, ty, h.radius, h.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Fels fliegt im Bogen
    const x = h.x0 + (h.x - h.x0) * prog - cam.x;
    const y = h.y0 + (h.y - h.y0) * prog - cam.y - Math.sin(prog * Math.PI) * 50;
    drawSprite(ctx, SPR.boulder, x, y, { scale: 2 });
  }
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
  const m = PILLAR.viewMargin;
  for (let tries = 0; tries < 16; tries++) {
    // irgendwo im Bild (plus etwas Rand), damit man sie herauswachsen sieht
    const x = p.x - W / 2 - m + Math.random() * (W + 2 * m);
    const y = p.y - H / 2 - m + Math.random() * (H + 2 * m);
    if (Math.hypot(x - p.x, y - p.y) < PILLAR.minDist) continue;
    if (x < 20 || y < 20 || x > WORLD - 20 || y > WORLD - 20) continue;
    if (game.pillars.some((o) => Math.hypot(o.x - x, o.y - y) < PILLAR.spacing)) continue;
    game.pillars.push({ x, y, age: 0, draw: drawPillar });
    Sound.play('pillar');
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
