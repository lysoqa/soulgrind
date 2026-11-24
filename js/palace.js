// Ebene 3: Palast der Seelen. Roter Teppich, feste Säulen, Kisten (manche sind Fallen),
// erwachende Rüstungen, Wachen, Goblin-Schützen und der Boss Karthul mit Heilerin und Schurke.
// Alle Balance-Werte für Ebene 3 stehen hier oben gebündelt.

// Feste Säulen und Rüstungen im Palast
const PALACE = {
  hall: 224, // Abstand der Teppich-Kreuzungen (Pixel)
  columnOffset: 48, // Säulen stehen so weit schräg neben jeder Kreuzung
  columnSkip: 0.25, // so viele Säulen fehlen zufällig (wirkt weniger gleichförmig)
  columnRadius: 5, // Körpergröße (blockt Held und Gegner)
  armorsPerHall: 2, // Rüstungen pro Kreuzung
  armorLive: 0.45, // Anteil der Rüstungen, die wirklich erwachen (der Rest ist nur Deko)
  armorWake: 55, // so nah muss der Held kommen
  armorWakeTime: 0.9, // so lange zittert sie, bevor sie losläuft
};

// Kisten: selten, anlaufen zum Öffnen
const CHEST = {
  first: 40, // erste Kiste frühestens nach 40 s
  interval: [35, 60], // danach alle 35 bis 60 s
  gold: 15,
  mimicChance: 0.3, // so viele Kisten sind Fallen und greifen an
  mimicWake: 0.6, // kurze Warnung, bevor die falsche Kiste zubeißt
  life: 45, // ungeöffnete Kiste verschwindet nach so vielen Sekunden
  minDist: 70, // erscheint nicht direkt am Helden
};

// Karthul, der Abendschleier (Boss am Ende von Ebene 3). Schaden wächst mit dem Gegnerlevel.
const KARTHUL = {
  spawnDist: 140,
  intro: 2.6, // Auftritt: Seelenwirbel, so lange unverwundbar
  keepDist: 85, // hält etwas Abstand zum Helden
  bladeCd: 2.6, bladeWindup: 0.5, blades: 7, bladeSpread: 0.17, bladeSpeed: 95, bladeDmg: 12, // Schattenklingen im Fächer
  beamCd: 9, beamCharge: 1.0, beamTime: 1.6, beamSweep: 1.7, beamLength: 170, beamWidth: 4, beamDmg: 18, // Seelenstrahl, schwenkt durch die Halle
  rageAt: 0.5, rageCd: 0.7, rageSpeed: 1.3, // ab 50 % Leben: „Der Schleier fällt“, alles schneller
  blinkCd: 7, // in Wut: springt durch den Schatten neben den Helden
  minionDist: 30,
};
// Heilerin: heilt alle 7 s den Boss und den Schurken um 1/6 ihres Lebens
const HEALER = { every: 7, cast: 0.8, heal: 1 / 6, flee: 55 };
// Schurke: 2 s nach dem Erscheinen unsichtbar (nur Fußspuren), lädt einen Sprint auf und stürmt durch dich durch
const ROGUE = {
  hideAfter: 2, dashRange: 80, charge: 0.8, dashSpeed: 260, dashTime: 0.35, dashDmg: 32,
  exposed: 1.6, // danach kurz sichtbar und langsam (gute Gelegenheit zum Treffen)
  cd: 3.5, stepEvery: 0.22, stepLife: 2.5,
};

// ---------- Gegnertypen ----------

// Wache: gleiches Leben wie Zombie/Troll an ihrer Stelle, minimal schneller, aber viel stärker
ENEMY_TYPES.guard = {
  name: 'Wache', sprites: ['guardA', 'guardB'], hp: 80, speed: 19, contact: 28, xp: 11, r: 6, blood: '#9a8ab0', stageOnly: true,
};
// Goblin-Schütze: schießt Pfeile, manchmal 3 schnell hintereinander
ENEMY_TYPES.goblin = {
  name: 'Goblin', sprites: ['goblinA', 'goblinB'], hp: 30, speed: 30, contact: 0, xp: 8, r: 4, blood: '#5fae3e', stageOnly: true,
  ranged: { dist: 90, cd: 2.0, speed: 105, dmg: 8, retreat: 0.5, shots: 1, sprite: 'goblinArrow', burst: { chance: 0.35, n: 3, gap: 0.14 } },
};
ENEMY_TYPES.armor = {
  name: 'Lebende Rüstung', sprites: ['armorA', 'armorB'], hp: 150, speed: 14, contact: 24, xp: 16, r: 6, blood: '#9aa4b1', special: true,
};
ENEMY_TYPES.mimic = {
  name: 'Kisten-Falle', sprites: ['mimicA', 'mimicB'], hp: 110, speed: 34, contact: 20, xp: 14, r: 6, blood: '#8a5a2b', special: true, gold: 5,
  lunge: { range: 40, windup: 0.35, time: 0.18, speed: 230, cd: 1.4 },
};
ENEMY_TYPES.karthul = {
  name: 'Karthul', title: 'Der Abendschleier', sprites: ['karthulA', 'karthulB'], hp: 1500, speed: 18, contact: 20, xp: 800, r: 11,
  blood: '#6a3a8c', special: true, palaceAI: 'karthul',
};
ENEMY_TYPES.healer = {
  name: 'Heilerin', sprites: ['healerA', 'healerB'], hp: 500, speed: 24, contact: 0, xp: 150, r: 6, blood: '#c8f0b0', special: true,
  palaceAI: 'healer', gold: 10,
};
ENEMY_TYPES.rogue = {
  name: 'Schurke', sprites: ['rogueA', 'rogueB'], hp: 300, speed: 42, contact: 0, xp: 150, r: 5, blood: '#6a3a3a', special: true,
  palaceAI: 'rogue', gold: 10,
};

// ---------- Sprites ----------

const GUARD_COLORS = { h: '#b8bcc8', H: '#6d7080', p: '#4a2a6a', P: '#2e1a44', y: '#ffd34a', r: '#c0303a', e: '#ff5a3a', l: '#6a4a2a' };
const GUARD_ROWS = [
  '....rr.......',
  '...krrk....y.',
  '..khhhhk..kyk',
  '..khHHhk..kmk',
  '..khkekk..kmk',
  '..khhhhk..klk',
  '.kkpppppkkklk',
  'khkpyppPkhklk',
  'khkppyPPkkklk',
  '.k.pPpPPk..lk',
  '...kHkkHk..lk',
  '...khk.khk.k.',
  '...kkk.kkk...',
];
SPR.guardA = makeSprite(GUARD_ROWS, GUARD_COLORS);
SPR.guardB = makeSprite(GUARD_ROWS.map((r, i) => (i >= 11 ? (i === 11 ? '..khk...khk..' : '..kkk...kkk..') : r)), GUARD_COLORS);

const GOBLIN_COLORS = { g: '#7fc04a', G: '#4f8a2a', x: '#ffd34a', b: '#6a4a2a', l: '#8a5a2b' };
const GOBLIN_ROWS = [
  'k.kkkk.k..',
  'kgggggggk.',
  '.kgxggxk.l',
  '..kgGgk.kl',
  '.kbbbbbk.l',
  'kgkbbbkgkl',
  '..kbbbk..l',
  '..kgkgk...',
  '..kk.kk...',
];
SPR.goblinA = makeSprite(GOBLIN_ROWS, GOBLIN_COLORS);
SPR.goblinB = makeSprite(GOBLIN_ROWS.map((r, i) => (i === 8 ? '.kk...kk..' : r)), GOBLIN_COLORS);
SPR.goblinArrow = makeSprite(['g......', 'llllllw', 'g......'], { g: '#7fc04a', l: '#6a4a2a', w: '#e8e4d4' });

const ARMOR_COLORS = { h: '#9aa4b1', H: '#5d6673', D: '#3d4450', e: '#1a1420', E: '#ff3a2a', m: '#dfe6ee' };
const ARMOR_ROWS = [
  '...kkkkk.....',
  '..khhhhhk....',
  '..khHeeHk..m.',
  '..khhhhhk..m.',
  '.kkHHHHHkk.m.',
  'khhhHhHhhhkm.',
  'kHkhhhhhkHkk.',
  'kk.kHHHHk.kk.',
  '...kDkkDk....',
  '...khk.khk...',
  '..kkkk.kkkk..',
];
SPR.armorStatue = makeSprite(ARMOR_ROWS, ARMOR_COLORS);
SPR.armorA = makeSprite(ARMOR_ROWS.map((r) => r.replace('eeH', 'EEH')), ARMOR_COLORS);
SPR.armorB = makeSprite(ARMOR_ROWS.map((r, i) => (i === 2 ? r.replace('eeH', 'EEH') : i === 9 ? '..khk...khk..' : i === 10 ? '..kkk...kkk..' : r)), ARMOR_COLORS);

const CHEST_COLORS = { l: '#8a5a2b', L: '#5e3b1c', y: '#ffd34a', Y: '#c99a20', w: '#f5f5d0', r: '#c0303a', x: '#ff3a2a' };
SPR.chest = makeSprite([
  '.kkkkkkkkk.',
  'klllllllllk',
  'kLLLLyLLLLk',
  'kkkkyYykkkk',
  'klllkykllk.',
  'kLLLLLLLLLk',
  'klllllllllk',
  'kkkkkkkkkkk',
], CHEST_COLORS);
SPR.chestOpen = makeSprite([
  '.kkkkkkkkk.',
  'kLLLLLLLLLk',
  'kkkkkkkkkkk',
  'kyYyYyYyYyk',
  'klllkykllk.',
  'kLLLLLLLLLk',
  'klllllllllk',
  'kkkkkkkkkkk',
], CHEST_COLORS);
SPR.mimicA = makeSprite([
  '.kkkkkkkkk.',
  'klllllllxlk',
  'kLLLLyLLLLk',
  'kwkwkwkwkwk',
  'krrrrrrrrrk',
  'kwkwkwkwkwk',
  'kLLLLLLLLLk',
  'klllllllllk',
  'k.kk...kk.k',
], CHEST_COLORS);
SPR.mimicB = makeSprite([
  '.kkkkkkkkk.',
  'klllllllxlk',
  'kLLLLyLLLLk',
  'kwkwkwkwkwk',
  'kkkkkkkkkkk',
  'kwkwkwkwkwk',
  'kLLLLLLLLLk',
  'klllllllllk',
  '.kk.....kk.',
], CHEST_COLORS);

// Karthul: Fürst in einem nachtblauen Schleiermantel mit Krone und glühenden Augen
const KARTHUL_COLORS = { v: '#2a1e44', V: '#170f2a', p: '#6a3a9c', P: '#8a5ac8', y: '#ffd34a', e: '#c89aff', s: '#d8d0e8', m: '#dfe6ee' };
const KARTHUL_ROWS = [
  '......y.y.y...........',
  '......yyyyy...........',
  '.....kVVVVVk..........',
  '....kVVsVsVVk.........',
  '....kVeVVVeVk.........',
  '....kVVVVVVVk.........',
  '...kvkVVVVVkvk....m...',
  '..kvvvkkkkkvvvk..mm...',
  '.kvvpvvvvvvvpvvk.m....',
  'kvvvpvvvyvvvpvvvkm....',
  'kvvvvpvvvvvpvvvvkl....',
  'kvvkvvpvvvpvvkvvkl....',
  'kvk.kvvpvpvvk.kvkl....',
  'kk..kvvvpvvvk..kkl....',
  '...kvvvvvvvvvk...l....',
  '..kvvvVvvvVvvvk.......',
  '..kvvVvvvvvVvvk.......',
  '.kvvVvvvvvvvVvvk......',
  '.kVVVVVVVVVVVVVk......',
  '.kkkkkkkkkkkkkkk......',
];
SPR.karthulA = makeSprite(KARTHUL_ROWS, { ...KARTHUL_COLORS, l: '#5e3b1c' });
// zweites Bild: der Mantelsaum weht
SPR.karthulB = makeSprite(KARTHUL_ROWS.map((r, i) => (i >= 15 ? `.${r.slice(0, -1)}` : r)), { ...KARTHUL_COLORS, l: '#5e3b1c' });
SPR.shadowBlade = makeSprite(['kpk....', 'kPPPPPe', 'kpk....'], { p: '#6a3a9c', P: '#b07cff', e: '#f0e0ff' });

// Heilerin: Frau mit Zepter, helles Gewand
const HEALER_COLORS = { s: '#f2c9a0', h: '#e8c25a', w: '#e8f0e0', W: '#a8c0a0', g: '#7fe07f', y: '#ffd34a' };
const HEALER_ROWS = [
  '...kkkk....g.',
  '..khhhhk..kgk',
  '..khsshk..kyk',
  '.khsesek...l.',
  '.khhssshk..l.',
  '..kkwwwk..kl.',
  '.kwwWwwwkksl.',
  '.kswwwWwk..l.',
  '..kwwWwwk..l.',
  '.kwwwwWwwk.l.',
  '.kWwwwwwWk...',
  '.kkkkkkkkk...',
];
SPR.healerA = makeSprite(HEALER_ROWS, { ...HEALER_COLORS, l: '#8a5a2b' });
SPR.healerB = makeSprite(HEALER_ROWS.map((r, i) => (i === 0 ? '...kkkk...g.g' : r)), { ...HEALER_COLORS, l: '#8a5a2b' });

// Schurke: dunkle Kapuze, zwei Dolche
const ROGUE_COLORS = { d: '#3a2e3a', D: '#241c24', s: '#f2c9a0', x: '#ff4d4d', m: '#dfe6ee' };
const ROGUE_ROWS = [
  '...kkkk...',
  '..kddddk..',
  '.kddDDdk..',
  '.kdDxkxk..',
  '.kdDDDDk..',
  'mkkddddkkm',
  '.kdkDDkdk.',
  '..kdDDdk..',
  '..kdkkdk..',
  '..kk..kk..',
];
SPR.rogueA = makeSprite(ROGUE_ROWS, ROGUE_COLORS);
SPR.rogueB = makeSprite(ROGUE_ROWS.map((r, i) => (i === 9 ? '.kk....kk.' : r)), ROGUE_COLORS);

// Palast-Säule: Marmor mit goldenem Kapitell
SPR.column = makeSprite([
  '.kkkkkkkkk.',
  'kyyYyyyYyyk',
  '.kkkkkkkkk.',
  ...Array(19).fill('..kmMmmMk..'),
  '.kkkkkkkkk.',
  'kYyyyyyyyYk',
  'kkkkkkkkkkk',
], { m: '#e8e0ec', M: '#b0a6b8', y: '#ffd34a', Y: '#c99a20' });

// ---------- Palast-Boden: dunkler Marmor mit rotem Teppich ----------

const PALACE_TILES = [1, 2, 3, 4].map((seed) => {
  const c = document.createElement('canvas');
  c.width = c.height = TILE;
  const g = c.getContext('2d');
  const rnd = seeded(seed * 977);
  g.fillStyle = seed % 2 ? '#2b2433' : '#26202e';
  g.fillRect(0, 0, TILE, TILE);
  // feine Marmor-Adern
  g.fillStyle = '#352d3f';
  let x = Math.floor(rnd() * TILE);
  for (let y = 0; y < TILE; y++) { g.fillRect(x, y, 1, 1); x = (x + (rnd() < 0.5 ? 1 : TILE - 1)) % TILE; }
  g.fillStyle = '#1d1824';
  g.fillRect(0, TILE - 1, TILE, 1);
  g.fillRect(TILE - 1, 0, 1, TILE);
  return c;
});

// Teppich-Bahnen: 2 Kacheln breit, alle PALACE.hall Pixel in beide Richtungen
const CARPET_EVERY = () => PALACE.hall / TILE;
function carpetAt(t) {
  const k = ((t % CARPET_EVERY()) + CARPET_EVERY()) % CARPET_EVERY();
  const mid = CARPET_EVERY() / 2;
  return k === mid - 1 ? 1 : k === mid ? 2 : 0; // 1 = obere/linke Hälfte, 2 = untere/rechte Hälfte
}

function drawPalaceGround(ctx, cam) {
  const x0 = Math.floor(cam.x / TILE);
  const y0 = Math.floor(cam.y / TILE);
  const max = WORLD / TILE;
  for (let ty = y0; ty <= y0 + Math.ceil(H / TILE); ty++) {
    for (let tx = x0; tx <= x0 + Math.ceil(W / TILE); tx++) {
      const sx = tx * TILE - cam.x;
      const sy = ty * TILE - cam.y;
      if (tx < 0 || ty < 0 || tx >= max || ty >= max) {
        ctx.fillStyle = (tx + ty) % 2 ? '#120e16' : '#0f0c13';
        ctx.fillRect(sx, sy, TILE, TILE);
        continue;
      }
      const h = tileHash(tx, ty);
      ctx.drawImage(PALACE_TILES[h % 4], sx, sy);
      const cx = carpetAt(tx);
      const cy = carpetAt(ty);
      if (cx || cy) {
        ctx.fillStyle = '#7a1622';
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = '#8e1e2c';
        if ((tx + ty) % 2) ctx.fillRect(sx + 6, sy + 6, 4, 4); // Muster
        // goldene Borte an den Außenkanten
        ctx.fillStyle = '#c99a20';
        if (cy === 1 && !cx) ctx.fillRect(sx, sy + 1, TILE, 1);
        if (cy === 2 && !cx) ctx.fillRect(sx, sy + TILE - 2, TILE, 1);
        if (cx === 1 && !cy) ctx.fillRect(sx + 1, sy, 1, TILE);
        if (cx === 2 && !cy) ctx.fillRect(sx + TILE - 2, sy, 1, TILE);
      } else if ((h >>> 8) % 100 < 2) {
        // ab und zu eine Kerze auf dem Boden
        const dx = sx + 4 + ((h >>> 16) % 8);
        const dy = sy + 4 + ((h >>> 20) % 8);
        ctx.fillStyle = '#e8e4d4';
        ctx.fillRect(dx, dy, 1, 3);
        ctx.fillStyle = Math.floor(game.time * 6 + h) % 2 ? '#ffd34a' : '#ff9a3c';
        ctx.fillRect(dx, dy - 1, 1, 1);
      }
    }
  }
}

// ---------- Aufbau der Ebene ----------

function setupPalace(game) {
  if (!game.stageDef.palace) return;
  game.chestT = CHEST.first;
  const n = Math.ceil(WORLD / PALACE.hall);
  const o = PALACE.columnOffset;
  const rnd = Math.random;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const cx = i * PALACE.hall + PALACE.hall / 2;
      const cy = j * PALACE.hall + PALACE.hall / 2;
      // Säulen schräg um die Teppich-Kreuzung
      for (const [dx, dy] of [[-o, -o], [o, -o], [-o, o], [o, o]]) {
        const x = cx + dx;
        const y = cy + dy;
        if (rnd() < PALACE.columnSkip || x < 20 || y < 20 || x > WORLD - 20 || y > WORLD - 20) continue;
        game.pillars.push({ x, y, fixed: true, radius: PALACE.columnRadius, age: 0, draw: drawColumn });
      }
      // Rüstungen am Teppichrand zwischen zwei Kreuzungen
      for (let k = 0; k < PALACE.armorsPerHall; k++) {
        const horiz = k % 2 === 0;
        const along = PALACE.hall / 2 - 10 + rnd() * 20;
        const side = rnd() < 0.5 ? -26 : 26;
        const x = horiz ? cx + along : cx + side;
        const y = horiz ? cy + side : cy + along;
        if (x < 20 || y < 20 || x > WORLD - 20 || y > WORLD - 20) continue;
        if (Math.hypot(x - WORLD / 2, y - WORLD / 2) < 90) continue; // nicht direkt am Start
        game.props.push({ kind: 'armor', x, y, live: rnd() < PALACE.armorLive, wakeT: 0, flip: rnd() < 0.5, draw: drawArmorStatue });
      }
    }
  }
}

// ---------- Kisten und Rüstungen ----------

function updatePalace(dt, game) {
  updateFootprints(dt, game);
  if (!game.stageDef.palace) return;
  const p = game.player;

  // neue Kiste irgendwo im Bild
  if (game.phase === 'waves' && (game.chestT -= dt) <= 0) {
    const [a, b] = CHEST.interval;
    game.chestT = a + Math.random() * (b - a);
    for (let tries = 0; tries < 16; tries++) {
      const x = p.x - W / 2 + 20 + Math.random() * (W - 40);
      const y = p.y - H / 2 + 20 + Math.random() * (H - 40);
      if (Math.hypot(x - p.x, y - p.y) < CHEST.minDist) continue;
      if (x < 20 || y < 20 || x > WORLD - 20 || y > WORLD - 20) continue;
      if (game.pillars.some((pl) => Math.hypot(pl.x - x, pl.y - y) < 14)) continue;
      game.props.push({ kind: 'chest', x, y, mimic: Math.random() < CHEST.mimicChance, t: CHEST.life, openT: 0, draw: drawChest });
      game.fx.ring(x, y, '#ffd34a', 14);
      break;
    }
  }

  for (const pr of game.props) {
    const d = Math.hypot(pr.x - p.x, pr.y - p.y);
    if (pr.kind === 'chest') {
      if (pr.openT > 0) {
        // geöffnet: echte Kiste bleibt kurz offen stehen, falsche beißt nach der Warnung zu
        if ((pr.openT -= dt) <= 0) {
          pr.gone = true;
          if (pr.mimic) {
            const e = new Enemy('mimic', enemyLevel(game), pr.x, pr.y);
            e.lungeCd = 0;
            game.enemies.push(e);
            game.fx.burst(pr.x, pr.y, '#8a5a2b', 14);
            Sound.play('mimic');
          }
        }
        continue;
      }
      if ((pr.t -= dt) <= 0) { pr.gone = true; game.fx.burst(pr.x, pr.y, '#5e3b1c', 8); continue; }
      if (d < p.r + 7) openChest(pr, game);
    } else if (pr.kind === 'armor' && pr.live) {
      if (pr.wakeT > 0) {
        if ((pr.wakeT -= dt) <= 0) {
          pr.gone = true;
          game.enemies.push(new Enemy('armor', enemyLevel(game), pr.x, pr.y));
          game.fx.burst(pr.x, pr.y, '#9aa4b1', 10);
        }
      } else if (d < PALACE.armorWake && game.state === 'play') {
        pr.wakeT = PALACE.armorWakeTime;
        Sound.play('awaken');
        game.fx.text(pr.x, pr.y - 14, '!', '#ff5a3a');
      }
    }
  }
  game.props = game.props.filter((pr) => !pr.gone);
}

function openChest(pr, game) {
  if (pr.mimic) {
    pr.openT = CHEST.mimicWake;
    game.fx.text(pr.x, pr.y - 14, 'Eine Falle!', '#ff5a5a');
    game.shake = Math.max(game.shake, 3);
    return;
  }
  pr.openT = 1.2;
  Sound.play('chest');
  game.fx.text(pr.x, pr.y - 14, `+${CHEST.gold} Gold`, '#ffd34a');
  game.fx.burst(pr.x, pr.y, '#ffd34a', 16);
  const n = Math.round(CHEST.gold * (1 + Meta.bonus('goldFind')));
  for (let i = 0; i < n; i++) spawnPickup(game, 'gold', pr.x, pr.y, true);
}

function drawChest(ctx, cam, game) {
  const sx = Math.round(this.x - cam.x);
  const sy = Math.round(this.y - cam.y);
  if (sx < -20 || sy < -20 || sx > W + 20 || sy > H + 20) return;
  if (this.t < 4 && this.openT <= 0 && Math.floor(this.t * 8) % 2 === 0) return; // blinkt kurz vor dem Verschwinden
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(sx - 5, sy + 4, 11, 2);
  if (this.mimic && this.openT > 0) {
    // Falle: zittert und zeigt Zähne
    drawSprite(ctx, Math.floor(game.time * 12) % 2 ? SPR.mimicA : SPR.mimicB, sx + Math.round(Math.sin(game.time * 50)), sy);
    return;
  }
  drawSprite(ctx, this.openT > 0 ? SPR.chestOpen : SPR.chest, sx, sy);
  // Glitzern lockt an
  if (this.openT <= 0 && Math.floor(game.time * 3 + this.x) % 4 === 0) {
    ctx.fillStyle = '#fff4c2';
    ctx.fillRect(sx + 3, sy - 5, 1, 1);
  }
}

function drawArmorStatue(ctx, cam, game) {
  const sx = Math.round(this.x - cam.x);
  const sy = Math.round(this.y - cam.y);
  if (sx < -20 || sy < -20 || sx > W + 20 || sy > H + 20) return;
  ctx.fillStyle = '#1d1824';
  ctx.fillRect(sx - 6, sy + 4, 13, 3); // Sockel
  const shake = this.wakeT > 0 ? Math.round(Math.sin(game.time * 60)) : 0;
  drawSprite(ctx, this.wakeT > 0 ? SPR.armorA : SPR.armorStatue, sx + shake, sy - 1, { flip: this.flip });
}

function drawColumn(ctx, cam) {
  const sx = Math.round(this.x - cam.x);
  const sy = Math.round(this.y - cam.y) + 4;
  if (sx < -20 || sy < -10 || sx > W + 20 || sy > H + 30) return;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(sx - 6, sy - 1, 13, 3);
  const s = SPR.column;
  ctx.drawImage(s.img, sx - Math.floor(s.w / 2), sy - s.h);
}

// ---------- Karthul und seine Diener ----------

function initKarthul(e, game) {
  e.introT = KARTHUL.intro;
  e.bladeT = 2;
  e.bladeWind = 0;
  e.volleyLeft = 0;
  e.beamCd = 6;
  e.beamSt = null;
  e.blinkT = KARTHUL.blinkCd;
  e.keep = true;
  Sound.play('veil');
}

// Wird aus Enemy.update aufgerufen. Gibt die Laufrichtung zurück.
function updatePalaceEnemy(e, dt, game, ux, uy, d) {
  const ai = e.type.palaceAI;
  if (ai === 'karthul') return updateKarthul(e, dt, game, ux, uy, d);
  if (ai === 'healer') return updateHealer(e, dt, game, ux, uy, d);
  return updateRogue(e, dt, game, ux, uy, d);
}

function karthulDmgMul(e) { return 1 + 0.1 * (e.level - 1); }

function updateKarthul(e, dt, game, ux, uy, d) {
  const p = game.player;
  // Auftritt: Seelen wirbeln zusammen, dann erscheint er
  if (e.introT > 0) {
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 40 * (e.introT / KARTHUL.intro);
      game.particles.push({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, vx: -Math.cos(a) * 40, vy: -Math.sin(a) * 40, life: 0.4, max: 0.4, color: Math.random() < 0.5 ? '#b07cff' : '#e0ccff' });
    }
    if ((e.introT -= dt) <= 0) {
      e.introT = 0;
      game.shake = 10;
      Sound.play('bossRoar');
      game.fx.ring(e.x, e.y, '#b07cff', 50);
      game.fx.burst(e.x, e.y, '#c9a6ff', 50);
      game.fx.text(e.x, e.y - 26, 'Die Nacht bricht an.', '#c89aff');
      // Diener erscheinen links und rechts
      for (const [id, side] of [['healer', -1], ['rogue', 1]]) {
        const m = new Enemy(id, e.level, Math.max(10, Math.min(WORLD - 10, e.x + side * KARTHUL.minionDist)), e.y + 6);
        m.keep = true;
        m.master = e;
        m.speed = m.baseSpeed = m.type.speed;
        if (id === 'healer') m.healT = HEALER.every;
        else { m.state = 'visible'; m.stT = ROGUE.hideAfter; m.dashCd = 1; m.stepT = 0; m.stepSide = 1; }
        game.enemies.push(m);
        game.minions.push(m);
        game.fx.burst(m.x, m.y, '#b07cff', 16);
      }
    }
    return { x: 0, y: 0 };
  }

  if (!e.enraged && e.hp / e.maxHp <= KARTHUL.rageAt) {
    e.enraged = true;
    game.shake = 10;
    Sound.play('veil');
    game.fx.text(e.x, e.y - 26, 'Der Schleier fällt!', '#c89aff');
    game.fx.ring(e.x, e.y, '#6a3a9c', 70);
  }
  const cdMul = e.enraged ? KARTHUL.rageCd : 1;
  e.speed = e.baseSpeed * (e.enraged ? KARTHUL.rageSpeed : 1);
  const mul = karthulDmgMul(e);

  // Seelenstrahl: Warnlinie, dann schwenkt der Strahl durch die Halle
  if (e.beamSt === 'charge') {
    if ((e.beamT -= dt) <= 0) { e.beamSt = 'fire'; e.beamT = KARTHUL.beamTime; e.beamHitT = 0; Sound.play('soulBeam'); }
    return { x: 0, y: 0 };
  }
  if (e.beamSt === 'fire') {
    e.beamAngle += (e.beamDir * KARTHUL.beamSweep * dt) / KARTHUL.beamTime;
    e.beamHitT -= dt;
    const ex = e.x + Math.cos(e.beamAngle) * KARTHUL.beamLength;
    const ey = e.y + Math.sin(e.beamAngle) * KARTHUL.beamLength;
    if (e.beamHitT <= 0 && distToSegment(p.x, p.y, e.x, e.y, ex, ey) < p.r + KARTHUL.beamWidth) {
      if (p.takeDamage(KARTHUL.beamDmg * mul, game, { src: 'Karthul' })) e.beamHitT = 0.6;
    }
    if (Math.random() < 0.6) {
      const k = Math.random();
      game.fx.particle(e.x + (ex - e.x) * k, e.y + (ey - e.y) * k, '#e0ccff', 0.3, 15);
    }
    if ((e.beamT -= dt) <= 0) { e.beamSt = null; e.beamCd = KARTHUL.beamCd * cdMul; }
    return { x: 0, y: 0 };
  }
  if ((e.beamCd -= dt) <= 0 && d < KARTHUL.beamLength) {
    e.beamSt = 'charge';
    e.beamT = KARTHUL.beamCharge;
    e.beamDir = Math.random() < 0.5 ? 1 : -1;
    // startet seitlich vom Helden und schwenkt über ihn hinweg
    e.beamAngle = Math.atan2(uy, ux) - e.beamDir * KARTHUL.beamSweep / 2;
    Sound.play('slamWarn');
    return { x: 0, y: 0 };
  }

  // Schattenklingen im Fächer (in Wut zwei Salven)
  if (e.bladeWind > 0) {
    if ((e.bladeWind -= dt) <= 0) {
      fireBlades(e, game, 0);
      if (e.enraged) { e.volleyLeft = 1; e.volleyT = 0.35; }
      e.bladeT = KARTHUL.bladeCd * cdMul;
    }
    return { x: 0, y: 0 };
  }
  if (e.volleyLeft > 0 && (e.volleyT -= dt) <= 0) { e.volleyLeft--; fireBlades(e, game, 0.5); }
  if ((e.bladeT -= dt) <= 0) { e.bladeWind = KARTHUL.bladeWindup; return { x: 0, y: 0 }; }

  // in Wut: springt durch den Schatten
  if (e.enraged && (e.blinkT -= dt) <= 0) {
    e.blinkT = KARTHUL.blinkCd;
    game.fx.burst(e.x, e.y, '#6a3a9c', 24);
    const a = Math.random() * Math.PI * 2;
    e.x = Math.max(20, Math.min(WORLD - 20, p.x + Math.cos(a) * 70));
    e.y = Math.max(20, Math.min(WORLD - 20, p.y + Math.sin(a) * 70));
    game.fx.burst(e.x, e.y, '#b07cff', 24);
    game.fx.ring(e.x, e.y, '#b07cff', 20);
    Sound.play('shadowDash');
  }

  // hält etwas Abstand und kreist um den Helden
  if (d > KARTHUL.keepDist + 15) return { x: ux, y: uy };
  if (d < KARTHUL.keepDist - 15) return { x: -ux * 0.6, y: -uy * 0.6 };
  return { x: -uy * e.strafe * 0.6, y: ux * e.strafe * 0.6 };
}

function fireBlades(e, game, offset) {
  const p = game.player;
  const toPlayer = Math.atan2(p.y - e.y, p.x - e.x);
  const n = KARTHUL.blades;
  Sound.play('blade');
  for (let i = 0; i < n; i++) {
    const a = toPlayer + (i - (n - 1) / 2 + offset) * KARTHUL.bladeSpread;
    game.projectiles.push({
      friendly: false, kind: 'blade', sprite: 'shadowBlade', x: e.x, y: e.y,
      vx: Math.cos(a) * KARTHUL.bladeSpeed, vy: Math.sin(a) * KARTHUL.bladeSpeed,
      life: 220 / KARTHUL.bladeSpeed, r: 2, dmg: KARTHUL.bladeDmg * karthulDmgMul(e), src: 'Karthul',
    });
  }
}

function updateHealer(e, dt, game, ux, uy, d) {
  const boss = e.master;
  e.healFx = Math.max(0, (e.healFx || 0) - dt);
  if (e.castT > 0) {
    if ((e.castT -= dt) <= 0) {
      // heilt den Boss und den Schurken um 1/6 ihres Lebens
      e.healTargets = [];
      for (const t of [boss, ...game.minions]) {
        if (!t || t.dead || t === e || !t.type.palaceAI) continue;
        const amount = Math.round(t.maxHp * HEALER.heal);
        t.hp = Math.min(t.maxHp, t.hp + amount);
        game.fx.text(t.x, t.y - 12 * t.scale - 8, `+${amount}`, '#7fe07f');
        game.fx.burst(t.x, t.y, '#7fe07f', 12);
        e.healTargets.push(t);
      }
      e.healFx = 0.5;
      Sound.play('heal');
      e.healT = HEALER.every;
    }
    return { x: 0, y: 0 };
  }
  if ((e.healT -= dt) <= 0) {
    e.castT = HEALER.cast;
    game.fx.text(e.x, e.y - 14, 'Heilung!', '#7fe07f');
    return { x: 0, y: 0 };
  }
  // flieht vor dem Helden, bleibt sonst hinter dem Boss
  if (d < HEALER.flee) return { x: -ux, y: -uy };
  if (boss && !boss.dead) {
    const tx = boss.x - ux * 28;
    const ty = boss.y - uy * 28;
    const dd = Math.hypot(tx - e.x, ty - e.y);
    if (dd > 8) return { x: (tx - e.x) / dd, y: (ty - e.y) / dd };
  }
  return { x: 0, y: 0 };
}

function updateRogue(e, dt, game, ux, uy, d) {
  const p = game.player;
  e.dashCd -= dt;
  e.invisible = e.state === 'stalk';
  if (e.state === 'visible' || e.state === 'exposed') {
    if ((e.stT -= dt) <= 0) { e.state = 'stalk'; game.fx.burst(e.x, e.y, '#3a2e3a', 12); }
    return e.state === 'exposed' ? { x: ux * 0.3, y: uy * 0.3 } : { x: ux, y: uy };
  }
  if (e.state === 'charge') {
    if ((e.stT -= dt) <= 0) {
      e.state = 'dash';
      e.stT = ROGUE.dashTime;
      e.dashHit = false;
      Sound.play('shadowDash');
    }
    return { x: 0, y: 0 };
  }
  if (e.state === 'dash') {
    e.x = Math.max(10, Math.min(WORLD - 10, e.x + e.dashDir.x * ROGUE.dashSpeed * dt));
    e.y = Math.max(10, Math.min(WORLD - 10, e.y + e.dashDir.y * ROGUE.dashSpeed * dt));
    if (Math.random() < 0.9) game.fx.particle(e.x, e.y, '#6a3a3a', 0.3, 6);
    if (!e.dashHit && Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r + 2) {
      e.dashHit = true;
      p.takeDamage(ROGUE.dashDmg * karthulDmgMul(e), game, { src: 'Schurke' });
    }
    if ((e.stT -= dt) <= 0) { e.state = 'exposed'; e.stT = ROGUE.exposed; e.dashCd = ROGUE.cd; }
    return { x: 0, y: 0 };
  }
  // unsichtbar: schleicht heran und hinterlässt Fußspuren
  if ((e.stepT -= dt) <= 0) {
    e.stepT = ROGUE.stepEvery;
    e.stepSide *= -1;
    const a = Math.atan2(uy, ux);
    game.footprints.push({ x: e.x - Math.sin(a) * 2 * e.stepSide, y: e.y + 4 + Math.cos(a) * 2 * e.stepSide, t: ROGUE.stepLife });
  }
  if (d < ROGUE.dashRange && e.dashCd <= 0) {
    // lädt den Sprint auf: Richtung steht fest, man kann seitlich ausweichen
    e.state = 'charge';
    e.stT = ROGUE.charge;
    e.dashDir = { x: ux, y: uy };
    Sound.play('slamWarn');
    return { x: 0, y: 0 };
  }
  return { x: ux, y: uy };
}

// Betäubt (z. B. Bannkreis): laufende Angriffe brechen ab
function cancelPalaceAttack(e) {
  if (e.beamSt) { e.beamSt = null; e.beamCd = 3; }
  if (e.bladeWind > 0) { e.bladeWind = 0; e.bladeT = 1; }
  if (e.castT > 0) { e.castT = 0; e.healT = 2; }
  if (e.state === 'charge' || e.state === 'dash') { e.state = 'exposed'; e.stT = ROGUE.exposed; e.dashCd = ROGUE.cd; }
}

function updateFootprints(dt, game) {
  for (const f of game.footprints) f.t -= dt;
  game.footprints = game.footprints.filter((f) => f.t > 0);
}

function drawFootprints(ctx, cam, game) {
  for (const f of game.footprints) {
    ctx.fillStyle = `rgba(20,10,20,${Math.min(0.7, f.t / ROGUE.stepLife)})`;
    ctx.fillRect(Math.round(f.x - cam.x), Math.round(f.y - cam.y), 2, 1);
  }
}

// Wird aus Enemy.draw aufgerufen: Warnungen zeichnen. true = Figur selbst nicht zeichnen.
function drawPalaceExtras(e, ctx, cam, game) {
  const sx = Math.round(e.x - cam.x);
  const sy = Math.round(e.y - cam.y);
  const ai = e.type.palaceAI;
  if (ai === 'karthul') {
    if (e.introT > 0) {
      // Seelenwirbel, Karthul wird langsam sichtbar
      const k = 1 - e.introT / KARTHUL.intro;
      ctx.strokeStyle = `rgba(176,124,255,${0.3 + 0.5 * k})`;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(sx, sy, 8 + i * 9 * (1 - k * 0.6), game.time * (4 + i) , game.time * (4 + i) + 2.5);
        ctx.stroke();
      }
      ctx.globalAlpha = k * k;
      drawSprite(ctx, SPR.karthulA, sx, sy, { scale: e.scale, flip: e.facing < 0 });
      ctx.globalAlpha = 1;
      return true;
    }
    if (e.beamSt) {
      const ex = sx + Math.cos(e.beamAngle) * KARTHUL.beamLength;
      const ey = sy + Math.sin(e.beamAngle) * KARTHUL.beamLength;
      if (e.beamSt === 'charge') {
        // Warnung: Startlinie und Bogen, über den der Strahl schwenkt
        const prog = 1 - e.beamT / KARTHUL.beamCharge;
        ctx.strokeStyle = `rgba(255,230,120,${0.4 + 0.6 * prog})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,230,120,0.3)';
        const a0 = e.beamAngle;
        const a1 = e.beamAngle + e.beamDir * KARTHUL.beamSweep;
        ctx.beginPath();
        ctx.arc(sx, sy, KARTHUL.beamLength, Math.min(a0, a1), Math.max(a0, a1));
        ctx.stroke();
      } else {
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#6a3a9c';
        ctx.lineWidth = KARTHUL.beamWidth * 2 + 2;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = '#e0ccff';
        ctx.lineWidth = KARTHUL.beamWidth;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.lineCap = 'butt';
      }
    }
    if (e.bladeWind > 0 && Math.floor(game.time * 20) % 2 === 0) {
      ctx.fillStyle = 'rgba(176,124,255,0.35)';
      ctx.beginPath();
      ctx.arc(sx, sy, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    return false;
  }
  if (ai === 'healer') {
    if (e.castT > 0) {
      const k = 1 - e.castT / HEALER.cast;
      ctx.strokeStyle = `rgba(127,224,127,${0.4 + 0.6 * k})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 4 + 12 * k, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (e.healFx > 0 && e.healTargets) {
      ctx.strokeStyle = `rgba(127,224,127,${e.healFx * 2})`;
      for (const t of e.healTargets) {
        ctx.beginPath();
        ctx.moveTo(sx, sy - 6);
        ctx.lineTo(Math.round(t.x - cam.x), Math.round(t.y - cam.y));
        ctx.stroke();
      }
    }
    return false;
  }
  if (ai === 'rogue') {
    if (e.state === 'stalk') {
      // fast unsichtbar: nur ein kurzes Flimmern ab und zu
      if (Math.random() < 0.03) game.fx.particle(e.x, e.y, '#3a2e3a', 0.3, 4);
      return true;
    }
    if (e.state === 'charge') {
      const prog = 1 - e.stT / ROGUE.charge;
      const len = ROGUE.dashSpeed * ROGUE.dashTime;
      ctx.strokeStyle = `rgba(255,230,120,${0.4 + 0.6 * prog})`; // hell, damit man es auch auf dem roten Teppich sieht
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + e.dashDir.x * len, sy + e.dashDir.y * len);
      ctx.stroke();
      ctx.globalAlpha = 0.3 + 0.5 * prog; // taucht beim Aufladen aus dem Schatten auf
      drawSprite(ctx, SPR.rogueA, sx, sy, { flip: e.dashDir.x < 0 });
      ctx.globalAlpha = 1;
      return true;
    }
    return false;
  }
  return false;
}

// Karthul in Wut: Bildschirm wird dunkler, mit lila Rand
function drawVeil(ctx, game) {
  const b = game.stageBoss;
  if (!b || b.dead || !b.enraged || b.type !== ENEMY_TYPES.karthul || game.state !== 'play') return;
  ctx.fillStyle = 'rgba(10,4,20,0.25)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(60,20,90,0.35)';
  ctx.fillRect(0, 0, W, 4);
  ctx.fillRect(0, H - 4, W, 4);
  ctx.fillRect(0, 0, 4, H);
  ctx.fillRect(W - 4, 0, 4, H);
}
