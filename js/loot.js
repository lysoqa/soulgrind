// Beute (Gold, Herzen), Fledermaus-Schwarm und Boden-Effekte der Upgrades
// (Feuerspur, Rankenpfad, Meteor). Alle Werte stehen hier oben gebündelt.

const LOOT = {
  goldChance: 0.2, // Chance auf 1 Gold pro Gegner
  goldMiniBoss: 10, // Mini-Boss lässt so viel Gold fallen
  goldStageBoss: { volghard: 25, elmatho: 40 }, // Ebenen-Bosse
  goldLife: 30, // Sekunden, bis eine Münze verschwindet
  heartChance: 0.08, // Chance auf ein Herz pro Gegner
  heartHeal: 20,
  heartLife: 15,
  magnet: 30, // ab diesem Abstand fliegt Beute zum Helden
  pullSpeed: 170,
};

const SWARM = {
  firstAfter: 45, // frühestens nach 45 s in einer Ebene
  interval: [25, 45], // dann alle 25 bis 45 s
  count: [6, 9], // so viele Fledermäuse
  speed: 125,
  xpFactor: 0.3, // weniger XP als eine normale Fledermaus
  contact: 4, // wenig Schaden bei Berührung (wächst mit dem Level)
};

// ---------- Sprites ----------

SPR.coin = makeSprite(['.kkk.', 'kyyyk', 'kywyk', 'kyyyk', '.kkk.'], { y: '#ffd34a', w: '#fff4c2' });
SPR.heart = makeSprite(['.kk.kk.', 'krrkrrk', 'krwrrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...'], { r: '#e04848', w: '#ffd0d0' });
SPR.snow = makeSprite(['c.c.c', '.ccc.', 'ccwcc', '.ccc.', 'c.c.c'], { c: '#7fd4ff', w: '#ffffff' });
SPR.iceArrow = makeSprite(['c.....w.', 'cbbbbbww', 'c.....w.'], { c: '#7fd4ff', b: '#4a8fd0', w: '#e0f4ff' });
SPR.tornado = makeSprite([
  'mmmmmmmmm',
  '.mMmmmMm.',
  '.mmMmmmm.',
  '..mMmmm..',
  '..mmmMm..',
  '...mMm...',
  '...mmm...',
  '....mM...',
  '....m....',
], { m: '#dfe6ee', M: '#9fb0c2' });
SPR.meteor = makeSprite([
  '..kkkk..',
  '.krrRRk.',
  'krryrrRk',
  'kryyyrRk',
  'krryrRRk',
  'kRrrRRRk',
  '.kRRRRk.',
  '..kkkk..',
], { r: '#ff7a2a', R: '#a8401a', y: '#ffd34a' });

// ---------- Beute ----------

function dropLoot(game, e) {
  if (e.type === ENEMY_TYPES.plant) return; // Pflanzen lassen nichts fallen (Volghard macht ständig neue)
  const find = 1 + Meta.bonus('goldFind'); // Goldfund-Upgrade aus dem Menü
  let gold = 0;
  if (e.bossBar) gold = Math.round((LOOT.goldStageBoss[Object.keys(ENEMY_TYPES).find((k) => ENEMY_TYPES[k] === e.type)] || 25) * find);
  else if (e.boss) gold = Math.round(LOOT.goldMiniBoss * find);
  else if (Math.random() < Math.min(1, LOOT.goldChance * find)) gold = 1;
  for (let i = 0; i < gold; i++) spawnPickup(game, 'gold', e.x, e.y, gold > 1);
  if (!e.boss && Math.random() < LOOT.heartChance) spawnPickup(game, 'heart', e.x, e.y, false);
}

function spawnPickup(game, kind, x, y, scatter) {
  const a = Math.random() * Math.PI * 2;
  const v = scatter ? 20 + Math.random() * 50 : 10;
  game.pickups.push({
    kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
    t: kind === 'gold' ? LOOT.goldLife : LOOT.heartLife, pulled: false, seed: Math.random() * 10,
  });
}

function collectPickup(game, pk) {
  const p = game.player;
  if (pk.kind === 'gold') {
    game.runGold++;
    game.fx.text(p.x, p.y - 14, '+1 Gold', '#ffd34a');
  } else {
    p.hp = Math.min(p.maxHp, p.hp + LOOT.heartHeal);
    game.run.hearts++;
    game.fx.text(p.x, p.y - 14, `+${LOOT.heartHeal}`, '#7fe07f');
    game.fx.burst(p.x, p.y, '#e04848', 8);
  }
}

function updatePickups(dt, game) {
  const p = game.player;
  for (const pk of game.pickups) {
    pk.t -= dt;
    pk.x += pk.vx * dt;
    pk.y += pk.vy * dt;
    pk.vx *= 0.9;
    pk.vy *= 0.9;
    if (!p || game.state !== 'play') continue;
    const dx = p.x - pk.x;
    const dy = p.y - pk.y;
    const d = Math.hypot(dx, dy);
    if (d < LOOT.magnet) pk.pulled = true;
    if (pk.pulled) {
      pk.x += (dx / (d || 1)) * LOOT.pullSpeed * dt;
      pk.y += (dy / (d || 1)) * LOOT.pullSpeed * dt;
    }
    if (d < p.r + 3) { collectPickup(game, pk); pk.t = 0; }
  }
  game.pickups = game.pickups.filter((pk) => pk.t > 0);
}

function drawPickups(ctx, cam, game) {
  for (const pk of game.pickups) {
    if (pk.t < 3 && Math.floor(pk.t * 8) % 2 === 0) continue; // blinkt kurz vor dem Verschwinden
    const sx = Math.round(pk.x - cam.x);
    const sy = Math.round(pk.y - cam.y + Math.sin(game.time * 4 + pk.seed) * 1.5);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(sx - 2, Math.round(pk.y - cam.y) + 4, 5, 1);
    drawSprite(ctx, pk.kind === 'gold' ? SPR.coin : SPR.heart, sx, sy);
  }
}

// ---------- Fledermaus-Schwarm ----------

ENEMY_TYPES.swarmBat = {
  name: 'Fledermaus', sprites: ['batA', 'batB'], hp: 1, speed: SWARM.speed, contact: SWARM.contact, xp: 4 * SWARM.xpFactor, r: 4,
  blood: '#6b4a8c', special: true, straight: true,
};

function updateSwarm(dt, game) {
  if (game.phase !== 'waves') return;
  if ((game.swarmT -= dt) > 0) return;
  const [a, b] = SWARM.interval;
  game.swarmT = a + Math.random() * (b - a);
  const p = game.player;
  // Schwarm startet außerhalb des Bildes und fliegt quer am Helden vorbei
  const from = Math.random() * Math.PI * 2;
  const sx = p.x + Math.cos(from) * 230;
  const sy = p.y + Math.sin(from) * 230;
  const tx = p.x + (Math.random() - 0.5) * 60;
  const ty = p.y + (Math.random() - 0.5) * 60;
  const dir = Math.atan2(ty - sy, tx - sx);
  const [c1, c2] = SWARM.count;
  const n = c1 + Math.floor(Math.random() * (c2 - c1 + 1));
  const lvl = enemyLevel(game);
  for (let i = 0; i < n; i++) {
    const side = (i - (n - 1) / 2) * 7;
    const back = Math.random() * 20;
    const e = new Enemy('swarmBat', lvl, sx - Math.cos(dir) * back - Math.sin(dir) * side, sy - Math.sin(dir) * back + Math.cos(dir) * side);
    e.maxHp = e.hp = 1; // stirbt mit einem Treffer
    e.speed = SWARM.speed;
    e.dir = { x: Math.cos(dir), y: Math.sin(dir) };
    e.flyT = 5; // fliegt danach davon
    game.enemies.push(e);
  }
}

// ---------- Boden-Effekte der Upgrades ----------

// Feuerspur (Krieger-Ult-Upgrade) und Rankenpfad (Schützen-Sprung-Upgrade)
function updateGroundFx(dt, game) {
  for (const f of game.groundFx) {
    f.t -= dt;
    for (const e of game.enemies) {
      if (e.dead) continue;
      if (f.kind === 'fire') {
        if (Math.hypot(e.x - f.x, e.y - f.y) > f.radius + e.r) continue;
        if (e.burnT <= 0) e.burnTick = 0;
        e.burnT = f.burnTime;
        e.burnDmg = f.burnDmg;
        e.burnEvery = f.burnTick;
      } else if (f.kind === 'vines') {
        if (distToSegment(e.x, e.y, f.x1, f.y1, f.x2, f.y2) > f.width + e.r) continue;
        e.slowT = 0.15;
        e.slowMul = Math.min(e.slowMul || 1, f.slow);
      }
    }
  }
  game.groundFx = game.groundFx.filter((f) => f.t > 0);

  // Meteore (Magier-Ult-Upgrade)
  for (const m of game.meteors) {
    m.t -= dt;
    if (m.t > 0) continue;
    game.shake = 9;
    game.fx.ring(m.x, m.y, '#ffd34a', m.radius);
    game.fx.ring(m.x, m.y, '#ff5a2a', m.radius * 1.3);
    game.fx.burst(m.x, m.y, '#ff9a3c', 40);
    game.fx.burst(m.x, m.y, '#4a3a30', 20);
    for (const e of game.enemies) {
      if (e.dead || Math.hypot(e.x - m.x, e.y - m.y) > m.radius + e.r) continue;
      game.hitEnemy(e, m.dmg, Math.atan2(e.y - m.y, e.x - m.x), 10);
    }
  }
  game.meteors = game.meteors.filter((m) => m.t > 0);
}

function drawGroundFx(ctx, cam, game) {
  for (const f of game.groundFx) {
    const fade = Math.min(1, f.t / 0.5);
    if (f.kind === 'fire') {
      const sx = Math.round(f.x - cam.x);
      const sy = Math.round(f.y - cam.y);
      ctx.globalAlpha = 0.45 * fade;
      ctx.fillStyle = '#ff5a2a';
      ctx.beginPath();
      ctx.arc(sx, sy, f.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = fade;
      const col = ['#ff5a2a', '#ff9a3c', '#ffd34a'][Math.floor(game.time * 12 + f.seed) % 3];
      ctx.fillStyle = col;
      ctx.fillRect(sx - 1, sy - 2 - Math.round(Math.sin(game.time * 15 + f.seed) * 1.5), 2, 2);
    } else if (f.kind === 'vines') {
      ctx.globalAlpha = 0.35 * fade;
      ctx.strokeStyle = '#3f8f3a';
      ctx.lineWidth = f.width * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(Math.round(f.x1 - cam.x), Math.round(f.y1 - cam.y));
      ctx.lineTo(Math.round(f.x2 - cam.x), Math.round(f.y2 - cam.y));
      ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.globalAlpha = fade;
      // Blätter entlang des Pfads
      const len = Math.hypot(f.x2 - f.x1, f.y2 - f.y1);
      for (let i = 0; i <= len; i += 6) {
        const k = len ? i / len : 0;
        const off = Math.sin(i * 1.7 + f.seed) * f.width * 0.7;
        const nx = len ? -(f.y2 - f.y1) / len : 0;
        const ny = len ? (f.x2 - f.x1) / len : 0;
        ctx.fillStyle = i % 12 ? '#62a050' : '#9be05a';
        ctx.fillRect(Math.round(f.x1 + (f.x2 - f.x1) * k + nx * off - cam.x), Math.round(f.y1 + (f.y2 - f.y1) * k + ny * off - cam.y), 2, 1);
      }
    }
  }
  ctx.globalAlpha = 1;

  // Meteor: Schatten am Boden wird größer, Gestein fällt von oben rechts
  for (const m of game.meteors) {
    const p = 1 - Math.max(0, m.t) / m.delay;
    const sx = Math.round(m.x - cam.x);
    const sy = Math.round(m.y - cam.y);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, Math.max(1, m.radius * 0.6 * p), Math.max(1, m.radius * 0.3 * p), 0, 0, Math.PI * 2);
    ctx.fill();
    const fx = sx + (1 - p) * 70;
    const fy = sy - (1 - p) * 140;
    ctx.strokeStyle = 'rgba(255,154,60,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx + 12, fy - 24);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    drawSprite(ctx, SPR.meteor, fx, fy, { scale: 2 });
  }
}
