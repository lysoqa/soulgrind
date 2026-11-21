// Spielschleife, Kamera, Effekte und Spielzustände (Auswahl, Spielen, Tod)
const GAME_VERSION = '0.4.1';
const W = 384;
const H = 216;
const WORLD = 1600;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
Input.init(canvas);

function fit() {
  const scale = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
  canvas.style.width = `${W * scale}px`;
  canvas.style.height = `${H * scale}px`;
}
addEventListener('resize', fit);
fit();

const game = {
  state: 'select', // select (Klasse) | ability (Fähigkeit) | play | cleared (Ebene geschafft) | dead
  stage: 0, // Index in STAGES
  phase: 'waves', // waves (Gegnerwellen) | clear (Rest besiegen) | boss (Ebenen-Boss)
  stageBoss: null,
  pillars: [],
  pillarT: 0,
  clearT: 0,
  autoFire: loadAutoFire(),
  pickedClass: null,
  hoverAbility: -1,
  paused: false,
  choice: null, // offene Stat-Auswahl nach einem Level-Up
  pendingChoices: 0,
  time: 0,
  runTime: 0,
  cam: { x: 0, y: 0 },
  player: null,
  enemies: [],
  projectiles: [],
  particles: [],
  texts: [],
  rings: [],
  shake: 0,
  spawnT: 0,
  nextBoss: BOSS_INTERVAL,
  bossCount: 0,
  bossKills: 0,
  levelBanner: 0,
  deadT: 0,
  hoverCard: -1,
  lastRun: null,

  pickClass(classId) {
    this.pickedClass = classId;
    this.hoverAbility = -1;
    this.state = 'ability';
  },

  start(classId, abilityIndex) {
    const cls = CLASSES[classId];
    this.player = new Player(cls, cls.abilities[abilityIndex], WORLD / 2, WORLD / 2);
    this.particles = [];
    this.texts = [];
    this.rings = [];
    this.bossCount = 0;
    this.bossKills = 0;
    this.levelBanner = 0;
    this.paused = false;
    this.choice = null;
    this.pendingChoices = 0;
    this.enterStage(0);
  },

  // Ebene beginnen: Timer, Gegner und Säulen fangen von vorne an, der Held bleibt
  enterStage(index) {
    this.stage = index;
    this.phase = 'waves';
    this.stageBoss = null;
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.texts = [];
    this.rings = [];
    this.pillars = [];
    this.pillarT = 3;
    this.runTime = 0;
    this.spawnT = 1;
    this.nextBoss = BOSS_INTERVAL;
    const p = this.player;
    p.x = WORLD / 2;
    p.y = WORLD / 2;
    p.hp = p.maxHp;
    this.cam.x = p.x - W / 2;
    this.cam.y = p.y - H / 2;
    for (let i = 0; i < 4; i++) spawnEnemy(this);
    this.state = 'play';
  },

  get stageDef() { return STAGES[this.stage]; },
  get minutes() { return this.runTime / 60; },

  // Volghard besiegt: übrige Pflanzen verwelken, Bildschirm „Ebene geschafft“
  stageCleared() {
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.dead = true;
      this.fx.burst(e.x, e.y, e.type.blood, 10);
    }
    this.projectiles = [];
    this.state = 'cleared';
    this.clearT = 0;
    this.lastClear = { stage: this.stage + 1, name: this.stageDef.name, boss: this.stageBoss.type.name, time: this.runTime };
  },

  toggleAutoFire() {
    this.autoFire = !this.autoFire;
    try { localStorage.setItem('soulgrind.autoFire', this.autoFire ? '1' : '0'); } catch (e) { /* egal */ }
    this.fx.text(this.player.x, this.player.y - 16, this.autoFire ? 'Auto-Schuss an' : 'Auto-Schuss aus', this.autoFire ? '#7fe07f' : '#b9b4a6');
  },

  mouseWorld() {
    return { x: this.cam.x + Input.mouse.x, y: this.cam.y + Input.mouse.y };
  },

  hitEnemy(e, dmg, angle, knockback) {
    if (e.dead) return;
    e.hp -= dmg;
    e.flash = 0.08;
    const kb = e.type.anchored ? 0 : e.boss ? knockback * 0.2 : knockback;
    e.x += Math.cos(angle) * kb;
    e.y += Math.sin(angle) * kb;
    this.fx.text(e.x, e.y - 10 * e.scale, dmg, '#f1ede2');
    this.fx.burst(e.x, e.y, e.type.blood, 3);
    if (e.hp <= 0) {
      e.dead = true;
      this.player.kills++;
      if (e.boss) {
        this.bossKills++;
        this.shake = 6;
        this.fx.ring(e.x, e.y, '#ffd34a', 40);
      }
      this.fx.burst(e.x, e.y, e.type.blood, e.boss ? 40 : 12);
      this.fx.text(e.x, e.y - 4, `+${Math.round(e.xp * (1 + this.player.bonus('xpGain')))} XP`, '#ffd34a');
      this.player.gainXp(e.xp, this);
      if (e === this.stageBoss) this.stageCleared();
    }
  },

  levelUp() {
    this.levelBanner = 2;
    this.fx.ring(this.player.x, this.player.y, '#ffd34a', 30);
    this.fx.burst(this.player.x, this.player.y, '#ffd34a', 20);
    this.pendingChoices++;
    this.openChoice();
  },

  // ---------- Stat-Auswahl ----------

  openChoice() {
    if (this.choice || this.pendingChoices <= 0) return;
    const options = rollStatOptions(this.player);
    if (!options.length) { this.pendingChoices = 0; return; } // alles ausgebaut
    this.choice = { options, openedAt: this.time, hover: -1 };
  },

  pickStat(i) {
    const id = this.choice && this.choice.options[i];
    if (!id) return;
    this.player.addStat(id);
    this.fx.text(this.player.x, this.player.y - 16, `${STATS[id].name} ${this.player.rank(id)}`, '#b07cff');
    this.choice = null;
    this.pendingChoices--;
    Input.mouse.left = false; // der Klick soll nicht gleich angreifen
    this.openChoice();
  },

  reroll() {
    if (!this.choice || this.player.rerolls <= 0) return;
    this.player.rerolls--;
    this.choice.options = rollStatOptions(this.player, this.choice.options);
  },

  updateChoice() {
    const c = this.choice;
    const ready = this.time - c.openedAt > 0.35; // kurz warten, damit Dauerfeuer nicht sofort etwas auswählt
    c.hover = choiceRects(c.options.length).findIndex((r) => inRect(Input.mouse, r));
    const overReroll = inRect(Input.mouse, rerollRect());
    ['Digit1', 'Digit2', 'Digit3'].forEach((k, i) => { if (ready && Input.wasPressed(k)) this.pickStat(i); });
    if (Input.wasPressed('KeyR')) this.reroll();
    if (ready && Input.leftPressed) {
      if (c.hover >= 0) this.pickStat(c.hover);
      else if (overReroll) this.reroll();
    }
  },

  // ---------- Pausenmenü (ESC) ----------

  updatePauseMenu() {
    if (!Input.leftPressed) return;
    const [resume, abort] = pauseButtons();
    if (inRect(Input.mouse, resume)) {
      this.paused = false;
      Input.mouse.left = false;
    } else if (inRect(Input.mouse, abort)) {
      this.abortRun();
    }
  },

  // Run abbrechen und zurück ins Hauptmenü (der Held ist danach weg)
  abortRun() {
    this.paused = false;
    this.choice = null;
    this.pendingChoices = 0;
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.state = 'select';
  },

  die() {
    const p = this.player;
    this.state = 'dead';
    this.deadT = 0;
    this.choice = null;
    this.lastRun = { cls: p.cls.name, level: p.level, kills: p.kills, bosses: this.bossKills, time: this.runTime, stage: this.stage + 1 };
    this.fx.burst(p.x, p.y, '#d93a4a', 30);
  },

  fx: {
    particle(x, y, color, life = 0.5, speed = 40) {
      const a = Math.random() * Math.PI * 2;
      const v = Math.random() * speed;
      game.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, color });
    },
    burst(x, y, color, n) {
      for (let i = 0; i < n; i++) this.particle(x, y, color, 0.3 + Math.random() * 0.4, 60);
    },
    text(x, y, str, color) {
      game.texts.push({ x: x + (Math.random() * 6 - 3), y, str: String(str), color, life: 0.8 });
    },
    ring(x, y, color, radius) {
      game.rings.push({ x, y, color, radius, life: 0.35, max: 0.35 });
    },
  },

  update(dt) {
    this.time += dt;

    if (this.state === 'select') {
      ['Digit1', 'Digit2', 'Digit3'].forEach((k, i) => { if (Input.wasPressed(k)) this.pickClass(CLASS_ORDER[i]); });
      if (Input.leftPressed && this.hoverCard >= 0) this.pickClass(CLASS_ORDER[this.hoverCard]);
      return;
    }

    if (this.state === 'ability') {
      const n = CLASSES[this.pickedClass].abilities.length;
      this.hoverAbility = abilityRects(n).findIndex((r) => inRect(Input.mouse, r));
      ['Digit1', 'Digit2'].forEach((k, i) => { if (Input.wasPressed(k)) this.start(this.pickedClass, i); });
      if (Input.wasPressed('Escape') || (Input.leftPressed && inRect(Input.mouse, backRect()))) {
        this.state = 'select';
      } else if (Input.leftPressed && this.hoverAbility >= 0) {
        Input.mouse.left = false; // erster Klick soll nicht gleich angreifen
        this.start(this.pickedClass, this.hoverAbility);
      }
      return;
    }

    if (this.state === 'play' && this.choice) { this.updateChoice(); return; }
    if (this.state === 'play' && Input.wasPressed('Escape')) this.paused = !this.paused;
    if (this.paused) { this.updatePauseMenu(); return; }

    if (this.state === 'play') {
      if (Input.wasPressed('KeyQ')) this.toggleAutoFire();
      this.player.update(dt, this);
      this.updatePhase(dt);
    }

    if (this.state === 'cleared') {
      this.clearT += dt;
      if (this.clearT > 1.2 && Input.leftPressed && STAGES[this.stage + 1]) {
        Input.mouse.left = false; // der Klick soll nicht gleich angreifen
        this.enterStage(this.stage + 1);
      }
    }

    if (this.state === 'dead') {
      this.deadT += dt;
      if (this.deadT > 1.2 && Input.leftPressed) this.state = 'select';
    }

    for (const e of this.enemies) if (!e.dead) e.update(dt, this);
    separateEnemies(this.enemies);
    updatePillars(dt, this);
    if (this.player) {
      for (const e of this.enemies) if (!e.dead) blockByPillars(e, this, e.speed * dt);
      blockByPillars(this.player, this);
    }
    updateProjectiles(dt, this);
    const p = this.player;
    this.enemies = this.enemies.filter((e) => !e.dead && (e.boss || Math.hypot(e.x - p.x, e.y - p.y) < 450));

    for (const pt of this.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.9;
      pt.vy *= 0.9;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
    for (const t of this.texts) { t.y -= 22 * dt; t.life -= dt; }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const r of this.rings) r.life -= dt;
    this.rings = this.rings.filter((r) => r.life > 0);
    this.levelBanner = Math.max(0, this.levelBanner - dt);
    this.shake = Math.max(0, this.shake - dt * 15);

    // Kamera folgt dem Spieler weich
    this.cam.x += (p.x - W / 2 - this.cam.x) * Math.min(1, dt * 8);
    this.cam.y += (p.y - H / 2 - this.cam.y) * Math.min(1, dt * 8);
  },

  // Ablauf einer Ebene: Wellen bis zum Zeitlimit, dann Rest besiegen, dann Ebenen-Boss
  updatePhase(dt) {
    const st = this.stageDef;
    if (this.phase === 'waves') {
      this.runTime += dt;
      if (st.duration && this.runTime >= st.duration) {
        this.runTime = st.duration; // Timer bleibt stehen
        this.phase = 'clear';
        return;
      }
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        const lvl = this.player.level;
        if (this.enemies.length < maxEnemies(lvl, this.minutes)) spawnEnemy(this);
        this.spawnT = spawnDelay(lvl, this.minutes);
      }
      if (this.runTime >= this.nextBoss) {
        this.bossCount++;
        spawnBoss(this, this.bossCount);
        this.nextBoss += BOSS_INTERVAL;
      }
    } else if (this.phase === 'clear') {
      if (!this.enemies.some((e) => !e.dead)) {
        this.phase = 'boss';
        spawnStageBoss(this);
      }
    }
  },

  draw() {
    if (this.state === 'select' || this.state === 'ability') {
      if (this.state === 'select') drawSelect(ctx, this);
      else drawAbilitySelect(ctx, this);
      drawCrosshair(ctx);
      return;
    }
    const cam = {
      x: Math.round(this.cam.x + (Math.random() - 0.5) * this.shake),
      y: Math.round(this.cam.y + (Math.random() - 0.5) * this.shake),
    };
    if (this.stageDef.ground === 'stone') drawStoneGround(ctx, cam);
    else drawGround(ctx, cam);
    drawPillarZones(ctx, cam, this);

    const actors = [...this.enemies, ...this.pillars];
    if (this.state !== 'dead') actors.push(this.player);
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) a.draw(ctx, cam, this);

    drawProjectiles(ctx, cam, this);

    for (const pt of this.particles) {
      ctx.globalAlpha = Math.min(1, pt.life / pt.max + 0.2);
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.round(pt.x - cam.x), Math.round(pt.y - cam.y), 1, 1);
    }
    ctx.globalAlpha = 1;
    for (const r of this.rings) {
      const p = 1 - r.life / r.max;
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = 1 - p;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(Math.round(r.x - cam.x), Math.round(r.y - cam.y), Math.max(1, r.radius * (0.4 + 0.6 * p)), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.life * 3);
      Font.draw(ctx, t.str, t.x - cam.x, t.y - cam.y, { align: 'center', color: t.color });
    }
    ctx.globalAlpha = 1;

    if (this.state === 'play') {
      if (this.player.hurtT > 0) {
        ctx.fillStyle = 'rgba(255,40,40,0.12)';
        ctx.fillRect(0, 0, W, H);
      }
      drawHUD(ctx, this);
      if (this.choice) drawChoice(ctx, this);
      else if (this.paused) drawPause(ctx, this);
    } else if (this.state === 'cleared') {
      drawStageClear(ctx, this);
    } else {
      drawDead(ctx, this);
    }
    drawCrosshair(ctx);
  },
};

const inRect = (m, r) => m.x >= r.x && m.x < r.x + r.w && m.y >= r.y && m.y < r.y + r.h;

// Auto-Schuss (Q) bleibt über Runs hinweg gespeichert
function loadAutoFire() {
  try { return localStorage.getItem('soulgrind.autoFire') === '1'; } catch (e) { return false; }
}

// Gegner schieben sich leicht auseinander, damit sie nicht übereinander stehen.
// Feststehende Gegner (Pflanzen) bewegen sich dabei nicht.
function separateEnemies(enemies) {
  for (let i = 0; i < enemies.length; i++) {
    const a = enemies[i];
    for (let j = i + 1; j < enemies.length; j++) {
      const b = enemies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      const min = a.r + b.r;
      if (d > 0 && d < min) {
        const fa = a.type.anchored ? 0 : b.type.anchored ? 1 : 0.5;
        const fb = b.type.anchored ? 0 : a.type.anchored ? 1 : 0.5;
        const push = min - d;
        a.x -= (dx / d) * push * fa;
        a.y -= (dy / d) * push * fa;
        b.x += (dx / d) * push * fb;
        b.y += (dy / d) * push * fb;
      }
    }
  }
}

addEventListener('blur', () => { if (game.state === 'play') game.paused = true; });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.draw();
  Input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
