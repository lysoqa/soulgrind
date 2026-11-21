// Gegnertypen. hp/contact/xp sind Werte auf Gegnerlevel 1 und wachsen mit dem Gegnerlevel.
const ENEMY_TYPES = {
  zombie: {
    name: 'Zombie', sprites: ['zombie'], hp: 50, speed: 20, contact: 12, xp: 6, r: 5, blood: '#4f7a3e',
  },
  bat: {
    name: 'Fledermaus', sprites: ['batA', 'batB'], hp: 18, speed: 55, contact: 7, xp: 4, r: 4, blood: '#6b4a8c',
    zigzag: true,
  },
  skeleton: {
    name: 'Skelett-Schütze', sprites: ['skeleton'], hp: 35, speed: 26, contact: 0, xp: 8, r: 5, blood: '#e8e4d4',
    ranged: { dist: 95, cd: 1.9, speed: 85, dmg: 9 },
  },
  lizard: {
    name: 'Echse', sprites: ['lizard'], hp: 45, speed: 22, contact: 0, xp: 10, r: 5, blood: '#5fae3e',
    // bleibt stehen, zeigt eine Warnlinie (charge) und feuert dann einen Strahl in diese Richtung
    beam: { dist: 110, cd: 4, charge: 0.8, fire: 0.25, length: 170, width: 3, dmg: 16 },
  },
};

SPR.lizard = makeSprite([
  '............',
  '.....kkkk...',
  '....kqqqqk..',
  '....kqqxqkk.',
  '....kqqqqqqk',
  '...kqqqQQQk.',
  '..kqqffffqk.',
  '.kqqqffffqk.',
  'kqk.kqqqqk..',
  'kk..kqkkqk..',
  '....kk..kk..',
  '............',
], { q: '#5fae3e', Q: '#3b7326', f: '#e8c25a' });

// Abstand eines Punktes zu einer Strecke (für den Strahl)
function distToSegment(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1, vy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - (x1 + vx * t), py - (y1 + vy * t));
}

// Mini-Boss: gleicher Gegnertyp, nur größer und stärker. Jeder weitere Boss wird noch etwas stärker.
const BOSS = { scale: 2, hp: 12, dmg: 2, xp: 10, speed: 0.8, growthPerBoss: 0.5 };

class Enemy {
  constructor(typeId, level, x, y, bossIndex = 0) {
    const t = ENEMY_TYPES[typeId];
    const boss = bossIndex > 0;
    const bossMul = boss ? 1 + BOSS.growthPerBoss * (bossIndex - 1) : 1;
    const hpMul = (1 + 0.15 * (level - 1)) * (boss ? BOSS.hp * bossMul : 1);
    const dmgMul = (1 + 0.1 * (level - 1)) * (boss ? BOSS.dmg * bossMul : 1);
    this.type = t;
    this.boss = boss;
    this.scale = boss ? BOSS.scale : 1;
    this.level = level;
    this.x = x;
    this.y = y;
    this.r = t.r * this.scale;
    this.maxHp = Math.round(t.hp * hpMul);
    this.hp = this.maxHp;
    this.speed = t.speed * (1 + 0.02 * (level - 1)) * (0.9 + Math.random() * 0.2) * (boss ? BOSS.speed : 1);
    this.contact = t.contact * dmgMul;
    this.bulletDmg = t.ranged ? t.ranged.dmg * dmgMul : 0;
    this.xp = Math.round(t.xp * (1 + 0.1 * (level - 1)) * (boss ? BOSS.xp * bossMul : 1));
    this.seed = Math.random() * 100;
    this.fireT = t.ranged ? 1 + Math.random() : 0;
    this.beamDmg = t.beam ? t.beam.dmg * dmgMul : 0;
    this.beamCd = 1.5 + Math.random() * 1.5;
    this.beamState = null; // null | 'charge' | 'fire'
    this.windupT = 0; // nur Volghard: Warnzittern vor einer Dornensalve
    this.beamT = 0;
    this.beamAngle = 0;
    this.beamHit = false;
    this.stunT = 0;
    this.strafe = Math.random() < 0.5 ? 1 : -1;
    this.contactT = 0;
    this.flash = 0;
    this.facing = 1;
    this.dead = false;
  }

  update(dt, game) {
    const p = game.player;
    const t = this.type;
    let dx = p.x - this.x;
    let dy = p.y - this.y;
    let d = Math.hypot(dx, dy) || 1;
    const ux = dx / d;
    const uy = dy / d;
    let mx = ux, my = uy;
    this.contactT -= dt;
    this.flash -= dt;

    if (this.stunT > 0) {
      // betäubt: keine Bewegung, kein Angriff, Strahl wird abgebrochen
      this.stunT -= dt;
      this.beamState = null;
      mx = 0; my = 0;
    } else if (t.beam) {
      const b = t.beam;
      if (this.beamState === 'charge') {
        mx = 0; my = 0;
        if ((this.beamT -= dt) <= 0) { this.beamState = 'fire'; this.beamT = b.fire; this.beamHit = false; }
      } else if (this.beamState === 'fire') {
        mx = 0; my = 0;
        const len = b.length * this.scale;
        const ex = this.x + Math.cos(this.beamAngle) * len;
        const ey = this.y + Math.sin(this.beamAngle) * len;
        if (!this.beamHit && distToSegment(p.x, p.y, this.x, this.y, ex, ey) < p.r + b.width * this.scale) {
          p.takeDamage(this.beamDmg, game);
          this.beamHit = true;
        }
        if ((this.beamT -= dt) <= 0) { this.beamState = null; this.beamCd = b.cd * (0.8 + Math.random() * 0.4); }
      } else {
        if (d > b.dist + 15) { mx = ux; my = uy; }
        else if (d < b.dist - 25) { mx = -ux; my = -uy; }
        else { mx = 0; my = 0; }
        this.beamCd -= dt;
        if (this.beamCd <= 0 && d < b.length * this.scale) {
          this.beamState = 'charge';
          this.beamT = b.charge;
          this.beamAngle = Math.atan2(dy, dx); // Richtung wird festgelegt, danach kann man ausweichen
        }
      }
    } else if (t.tree) {
      const m = updateVolghard(this, dt, game, ux, uy);
      mx = m.x; my = m.y;
    } else if (t.ranged) {
      if (d > t.ranged.dist + 15) { mx = ux; my = uy; }
      else if (d < t.ranged.dist - 15) { mx = -ux; my = -uy; }
      else { mx = -uy * this.strafe * 0.7; my = ux * this.strafe * 0.7; }
      if (Math.random() < dt * 0.3) this.strafe *= -1;
      this.fireT -= dt;
      if (this.fireT <= 0 && d < (t.ranged.range || 180)) {
        this.shoot(game, Math.atan2(dy, dx));
        this.fireT = t.ranged.cd * (0.8 + Math.random() * 0.4) * (this.boss ? 0.7 : 1);
      }
    } else if (t.zigzag) {
      const wave = Math.sin(game.time * 7 + this.seed) * 0.9;
      mx = ux - uy * wave;
      my = uy + ux * wave;
      const l = Math.hypot(mx, my) || 1;
      mx /= l; my /= l;
    }

    this.x += mx * this.speed * dt;
    this.y += my * this.speed * dt;
    if (this.stunT <= 0 && !this.beamState) this.facing = dx < 0 ? -1 : 1;

    // Gegner dürfen nicht in den Helden hineinlaufen
    dx = p.x - this.x;
    dy = p.y - this.y;
    d = Math.hypot(dx, dy) || 0.01;
    const minDist = this.r + p.r;
    const touching = d < minDist + 1;
    const passThrough = p.ultActive && p.ult.id === 'storm'; // Krieger-Ult: Held läuft durch Gegner
    if (d < minDist && !passThrough) {
      if (t.anchored) { // feststehende Gegner (Pflanzen) schieben stattdessen den Helden weg
        p.x = this.x + (dx / d) * minDist;
        p.y = this.y + (dy / d) * minDist;
      } else {
        this.x = p.x - (dx / d) * minDist;
        this.y = p.y - (dy / d) * minDist;
      }
    }

    if (t.contact && touching && this.contactT <= 0 && this.stunT <= 0) {
      p.takeDamage(this.contact, game);
      this.contactT = 0.8;
      // nach dem Treffer kurz zurückprallen, statt am Helden zu kleben
      const push = this.boss ? 4 : 12;
      this.x -= (dx / d) * push;
      this.y -= (dy / d) * push;
    }
  }

  shoot(game, angle) {
    const r = this.type.ranged;
    let shots = r.shots || (this.level >= 6 ? 3 : 1); // ab Level 6 schießen Skelette 3 Kugeln
    if (this.boss) shots += 2;
    const sp = r.speed * (1 + 0.02 * (this.level - 1));
    for (let i = 0; i < shots; i++) {
      const a = angle + (i - (shots - 1) / 2) * 0.25;
      game.projectiles.push({
        friendly: false, kind: r.kind || 'bullet', x: this.x, y: this.y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: (r.range || 200) / sp, r: this.boss ? 3 : 2,
        dmg: r.fixedDmg || this.bulletDmg, poison: r.poison || null,
      });
    }
  }

  draw(ctx, cam, game) {
    const sx = Math.round(this.x - cam.x);
    const sy = Math.round(this.y - cam.y);
    const sprites = this.type.sprites;
    const spr = SPR[sprites[Math.floor((game.time + this.seed) * 7) % sprites.length]];
    const hover = this.type.zigzag ? -3 * this.scale : 0;
    const half = Math.round(spr.h * this.scale / 2);

    const shadow = Math.round(this.r * 1.8);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(sx - Math.floor(shadow / 2), sy + half - 1, shadow, 2 * this.scale);
    if (this.beamState) {
      const b = this.type.beam;
      const len = b.length * this.scale;
      const ex = sx + Math.cos(this.beamAngle) * len;
      const ey = sy + Math.sin(this.beamAngle) * len;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      if (this.beamState === 'charge') {
        // Warnlinie: wird kurz vor dem Schuss heller
        ctx.strokeStyle = `rgba(255,50,40,${0.5 + 0.5 * (1 - this.beamT / b.charge)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#ff9a3c';
        ctx.lineWidth = b.width * 2 * this.scale;
        ctx.stroke();
        ctx.strokeStyle = '#fff4c2';
        ctx.lineWidth = Math.max(1, b.width * this.scale - 1);
        ctx.stroke();
      }
    }
    // Volghard zittert kurz, bevor er Dornen schießt
    const shakeX = this.windupT > 0 ? Math.round(Math.sin(game.time * 60)) : 0;
    drawSprite(ctx, spr, sx + shakeX, sy + hover, { flip: this.facing < 0, white: this.flash > 0, scale: this.scale });

    // Betäubung: kreisende Sterne über dem Kopf
    if (this.stunT > 0) {
      ctx.fillStyle = '#ffd34a';
      for (let i = 0; i < 3; i++) {
        const a = game.time * 6 + (i * Math.PI * 2) / 3;
        ctx.fillRect(Math.round(sx + Math.cos(a) * 5 * this.scale), Math.round(sy + hover - half - 2 + Math.sin(a) * 1.5), 1, 1);
      }
    }

    if (this.hp < this.maxHp && !this.bossBar) {
      const w = 12 * this.scale;
      const y = sy + hover - half - 4;
      ctx.fillStyle = '#1a1420';
      ctx.fillRect(sx - w / 2, y, w, 2);
      ctx.fillStyle = '#e04848';
      ctx.fillRect(sx - w / 2, y, Math.max(1, Math.round((w * this.hp) / this.maxHp)), 2);
    }
  }
}

// Skelette werden ab dieser Rundenzeit seltener (sonst schießen später zu viele gleichzeitig)
const SKELETON_LATE = { from: 120, factor: 0.5 };

// Wählt einen Gegnertyp passend zum Level (die Ebene kann Typen austauschen, z. B. Zombie > Troll)
function pickEnemyType(level, stage, runTime = 0) {
  const skeletonMul = runTime >= SKELETON_LATE.from ? SKELETON_LATE.factor : 1;
  const weights = {
    zombie: 45,
    bat: 30 + level,
    skeleton: level >= 2 ? (15 + level * 2) * skeletonMul : 0,
    lizard: level >= 3 ? 5 + level * 0.5 : 0, // selten, erst ab Gegnerlevel 3
  };
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let pick = 'zombie';
  for (const [id, w] of Object.entries(weights)) {
    if ((r -= w) < 0) { pick = id; break; }
  }
  return stage.replace[pick] || pick;
}

function spawnPoint(game) {
  const p = game.player;
  for (let tries = 0; tries < 8; tries++) {
    const a = Math.random() * Math.PI * 2;
    const dist = 220 + Math.random() * 50;
    const x = Math.max(10, Math.min(WORLD - 10, p.x + Math.cos(a) * dist));
    const y = Math.max(10, Math.min(WORLD - 10, p.y + Math.sin(a) * dist));
    if (Math.hypot(x - p.x, y - p.y) > 150) return { x, y };
  }
  return null;
}

// Gegnerlevel: Level des Helden plus 1 pro überlebter Minute (Timer startet jede Ebene neu) plus Ebenen-Bonus
const enemyLevel = (game) => game.player.level + Math.floor(game.runTime / 60) + game.stageDef.levelBonus;

function spawnEnemy(game) {
  const pt = spawnPoint(game);
  if (!pt) return;
  const lvl = enemyLevel(game);
  game.enemies.push(new Enemy(pickEnemyType(lvl, game.stageDef, game.runTime), lvl, pt.x, pt.y));
}

function spawnBoss(game, index) {
  const pt = spawnPoint(game);
  if (!pt) return;
  // Mini-Boss aus den normalen Gegnern dieser Ebene (mit Austausch, z. B. Troll statt Zombie)
  const st = game.stageDef;
  const types = [...new Set(Object.keys(ENEMY_TYPES).filter((id) => !ENEMY_TYPES[id].special && id !== 'troll').map((id) => st.replace[id] || id))];
  const lvl = enemyLevel(game);
  game.enemies.push(new Enemy(types[Math.floor(Math.random() * types.length)], lvl, pt.x, pt.y, index));
}

// Mehr Gegner mit höherem Level und längerer Rundenzeit
const maxEnemies = (level, minutes) => Math.min(70, 7 + level * 2 + Math.floor(minutes * 4));
const spawnDelay = (level, minutes) => Math.max(0.15, 1.3 - level * 0.04 - minutes * 0.08);
const BOSS_INTERVAL = 180; // alle 3 Minuten ein Mini-Boss
