const MAX_LEVEL = 20;
// Benötigte XP pro Level, steigt mit jedem Level stärker an (L1: 30, L5: 358, L10: 1102, L19: 3170)
const xpForLevel = (level) => Math.round(20 * Math.pow(level, 1.7) + 10 * level);

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

class Player {
  constructor(cls, ability, x, y) {
    this.cls = cls;
    this.ability = ability; // gewählte Fähigkeit (Rechtsklick)
    this.x = x;
    this.y = y;
    this.r = 4;
    this.level = 1;
    this.xp = 0;
    this.stats = {}; // gewählte Stats: id -> Rang
    this.rerolls = REROLLS_PER_RUN;
    this.maxHp = cls.hp;
    this.hp = this.maxHp;
    this.aim = 0;
    this.cd = 0; // Angriffs-Abklingzeit
    this.abilityCd = 0; // Abklingzeit der Fähigkeit
    this.blockT = 0; // Schildblock aktiv
    this.spin = null; // Wirbelschlag-Animation
    this.dash = null; // Hechtsprung
    this.invulnT = 0; // unverwundbar
    this.hurtT = 0;
    this.castT = 0;
    this.lastHit = -99;
    this.walkT = 0;
    this.moving = false;
    this.moveDir = { x: 1, y: 0 };
    this.swing = null;
    this.kills = 0;
  }

  rank(id) { return this.stats[id] || 0; }
  bonus(id) { return this.rank(id) * STATS[id].per; }

  get dmgMul() { return (1 + this.cls.growth.dmg * (this.level - 1)) * (1 + this.bonus('damage')); }
  get speed() { return this.cls.speed * (1 + this.bonus('moveSpeed')); }
  get cooldown() { return this.cls.cooldown / (1 + this.bonus('attackSpeed')); }
  get projSpeed() { return this.cls.projSpeed * (1 + this.bonus('projSpeed')); }
  get abilityActive() { return this.blockT > 0 || !!this.spin || !!this.dash; }

  recalcMaxHp() {
    const old = this.maxHp;
    this.maxHp = Math.round((this.cls.hp + this.cls.growth.hp * (this.level - 1)) * (1 + this.bonus('maxHp')));
    this.hp = Math.min(this.maxHp, this.hp + Math.max(0, this.maxHp - old));
  }

  addStat(id) {
    this.stats[id] = this.rank(id) + 1;
    if (id === 'maxHp') this.recalcMaxHp();
  }

  rollDamage() {
    const [a, b] = this.cls.damage;
    return Math.round((a + Math.random() * (b - a)) * this.dmgMul);
  }

  update(dt, game) {
    let dx = 0, dy = 0;
    if (Input.down('KeyW')) dy--;
    if (Input.down('KeyS')) dy++;
    if (Input.down('KeyA')) dx--;
    if (Input.down('KeyD')) dx++;
    const len = Math.hypot(dx, dy);
    this.moving = len > 0;
    if (len) this.moveDir = { x: dx / len, y: dy / len };

    if (this.dash) {
      // Während des Sprungs bewegt sich der Held von selbst
      const step = Math.min(dt, this.dash.t);
      this.x += this.dash.vx * step;
      this.y += this.dash.vy * step;
      this.dash.t -= dt;
      if (Math.random() < 0.8) game.fx.particle(this.x, this.y + 3, '#62a050', 0.3, 10);
      if (this.dash.t <= 0) this.dash = null;
    } else if (len) {
      const speed = this.speed * (this.blockT > 0 ? this.ability.slow : 1);
      this.x += this.moveDir.x * speed * dt;
      this.y += this.moveDir.y * speed * dt;
      this.walkT += dt;
    }
    this.x = Math.max(8, Math.min(WORLD - 8, this.x));
    this.y = Math.max(8, Math.min(WORLD - 8, this.y));

    const m = game.mouseWorld();
    this.aim = Math.atan2(m.y - this.y, m.x - this.x);

    this.cd -= dt;
    this.hurtT -= dt;
    this.castT -= dt;
    this.invulnT -= dt;
    this.blockT = Math.max(0, this.blockT - dt);
    this.abilityCd = Math.max(0, this.abilityCd - dt);
    if (this.swing && (this.swing.t += dt) >= this.swing.dur) this.swing = null;
    if (this.spin && (this.spin.t += dt) >= this.spin.dur) this.spin = null;

    if (Input.rightPressed && this.abilityCd <= 0) {
      this.useAbility(game);
      this.abilityCd = this.ability.cooldown;
    }

    if (Input.mouse.left && this.cd <= 0 && this.blockT <= 0 && !this.spin) {
      this.attack(game);
      this.cd = this.cooldown;
    }

    // Langsame Regeneration, wenn man 4 Sekunden keinen Schaden bekommen hat
    if (game.time - this.lastHit > 4) this.hp += this.maxHp * 0.02 * dt;
    // Erholung (Stat) wirkt immer
    this.hp += this.bonus('recovery') * dt;
    this.hp = Math.min(this.maxHp, this.hp);
  }

  // ---------- Fähigkeiten (Rechtsklick) ----------

  useAbility(game) {
    const ab = this.ability;
    switch (ab.id) {
      case 'block':
        this.blockT = ab.duration;
        game.fx.ring(this.x, this.y, '#7fd4ff', 14);
        break;

      case 'whirl':
        this.spin = { t: 0, dur: 0.3, start: this.aim };
        for (const e of game.enemies) {
          if (e.dead) continue;
          const d = Math.hypot(e.x - this.x, e.y - this.y);
          if (d <= ab.radius + e.r) {
            game.hitEnemy(e, Math.round(this.rollDamage() * ab.dmgFactor), Math.atan2(e.y - this.y, e.x - this.x), ab.knockback);
          }
        }
        game.fx.ring(this.x, this.y, '#f1ede2', ab.radius);
        break;

      case 'dash': {
        const dir = this.moving ? this.moveDir : { x: Math.cos(this.aim), y: Math.sin(this.aim) };
        this.dash = { t: ab.time, vx: (dir.x * ab.distance) / ab.time, vy: (dir.y * ab.distance) / ab.time };
        this.invulnT = ab.invuln;
        game.fx.burst(this.x, this.y, '#62a050', 8);
        break;
      }

      case 'fan':
        for (const off of [-ab.spread, 0, ab.spread]) this.fireProjectile(game, this.aim + off);
        break;

      case 'teleport': {
        const m = game.mouseWorld();
        let tx = m.x - this.x;
        let ty = m.y - this.y;
        const d = Math.hypot(tx, ty);
        if (d > ab.range) { tx = (tx / d) * ab.range; ty = (ty / d) * ab.range; }
        game.fx.burst(this.x, this.y, '#b07cff', 16);
        game.fx.ring(this.x, this.y, '#b07cff', 10);
        this.x = Math.max(8, Math.min(WORLD - 8, this.x + tx));
        this.y = Math.max(8, Math.min(WORLD - 8, this.y + ty));
        game.fx.burst(this.x, this.y, '#e0ccff', 16);
        game.fx.ring(this.x, this.y, '#b07cff', 14);
        break;
      }

      case 'stun':
        for (const e of game.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - this.x, e.y - this.y) > ab.radius + e.r) continue;
          e.stunT = e.boss ? ab.stun / 2 : ab.stun;
          game.hitEnemy(e, Math.round(this.rollDamage() * ab.dmgFactor), Math.atan2(e.y - this.y, e.x - this.x), 0);
        }
        game.fx.ring(this.x, this.y, '#7fd4ff', ab.radius);
        game.fx.ring(this.x, this.y, '#ffffff', ab.radius * 0.6);
        this.castT = 0.3;
        break;
    }
  }

  // ---------- Angriff (Linksklick) ----------

  attack(game) {
    const c = this.cls;
    const a = this.aim;
    if (c.attack === 'melee') {
      this.swing = { t: 0, dur: 0.16, a };
      for (const e of game.enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d > c.range + e.r) continue;
        const diff = Math.abs(angleDiff(Math.atan2(e.y - this.y, e.x - this.x), a));
        if (diff <= c.arc / 2 || d < e.r + 5) game.hitEnemy(e, this.rollDamage(), a, c.knockback);
      }
      return;
    }
    this.fireProjectile(game, a);
    if (c.attack === 'orb') this.castT = 0.2;
  }

  fireProjectile(game, a) {
    const c = this.cls;
    const speed = this.projSpeed;
    const proj = {
      friendly: true,
      kind: c.attack,
      // Geschoss startet in der Mitte des Helden, damit es auch Gegner trifft, die direkt auf dir stehen
      x: this.x,
      y: this.y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: c.range / speed,
      r: c.attack === 'orb' ? 3 : 2,
      dmg: this.rollDamage(),
      pierce: c.pierce || 1,
      hit: new Set(),
      aoe: c.aoe || 0,
      aoeFactor: c.aoeFactor || 0,
      knockback: c.knockback,
    };

    // Nahschuss: Ein Gegner, der den Helden berührt, wird immer getroffen, egal wohin gezielt wird
    let touching = null;
    let best = Infinity;
    for (const e of game.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d < e.r + this.r + 3 && d < best) { best = d; touching = e; }
    }
    if (touching) {
      if (proj.aoe) {
        proj.x = touching.x;
        proj.y = touching.y;
        explode(proj, game, touching);
        return;
      }
      game.hitEnemy(touching, proj.dmg, Math.atan2(touching.y - this.y, touching.x - this.x), proj.knockback);
      proj.hit.add(touching);
      if (--proj.pierce <= 0) return;
    }
    game.projectiles.push(proj);
  }

  takeDamage(amount, game) {
    if (game.state !== 'play') return;
    if (this.invulnT > 0) return;
    if (this.blockT > 0) {
      game.fx.text(this.x, this.y - 12, 'Block', '#7fd4ff');
      return;
    }
    amount = Math.max(1, Math.round(amount * (1 - this.bonus('armor'))));
    this.hp -= amount;
    this.hurtT = 0.15;
    this.lastHit = game.time;
    game.shake = 3;
    game.fx.text(this.x, this.y - 12, `-${amount}`, '#ff5a5a');
    if (this.hp <= 0) {
      this.hp = 0;
      game.die();
    }
  }

  gainXp(amount, game) {
    if (this.level >= MAX_LEVEL) return;
    this.xp += amount * (1 + this.bonus('xpGain'));
    while (this.level < MAX_LEVEL && this.xp >= xpForLevel(this.level)) {
      this.xp -= xpForLevel(this.level);
      this.level++;
      this.recalcMaxHp();
      this.hp = this.maxHp;
      game.levelUp();
    }
    if (this.level >= MAX_LEVEL) this.xp = 0;
  }

  // ---------- Zeichnen ----------

  draw(ctx, cam, game) {
    const sx = Math.round(this.x - cam.x);
    const sy = Math.round(this.y - cam.y);
    const bob = this.moving && Math.floor(this.walkT * 8) % 2 ? 1 : 0;
    const flip = Math.cos(this.aim) < 0;
    const behind = Math.sin(this.aim) < -0.35; // Waffe hinter dem Körper, wenn nach oben gezielt wird

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(sx - 4, sy + 5, 9, 2);

    if (this.dash) ctx.globalAlpha = 0.55; // halb durchsichtig = unverwundbar
    if (behind) this.drawWeapon(ctx, sx, sy, flip, game);
    drawSprite(ctx, SPR[this.cls.sprite], sx, sy - bob, { flip, white: this.hurtT > 0 });
    if (!behind) this.drawWeapon(ctx, sx, sy, flip, game);
    if (this.cls.id === 'warrior') this.drawShield(ctx, sx, sy, flip, game);
    ctx.globalAlpha = 1;
  }

  drawWeapon(ctx, sx, sy, flip, game) {
    const c = this.cls;
    if (c.attack === 'melee') {
      let ang = this.aim + (flip ? -0.5 : 0.5);
      if (this.spin) {
        const p = this.spin.t / this.spin.dur;
        ang = this.spin.start + Math.PI * 2 * p;
        ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - p)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy + 1, this.ability.radius - 6, this.spin.start, ang);
        ctx.stroke();
      } else if (this.swing) {
        const p = this.swing.t / this.swing.dur;
        ang = this.swing.a - c.arc / 2 + c.arc * p;
        ctx.strokeStyle = `rgba(255,255,255,${0.85 * (1 - p)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy + 1, c.range - 5, this.swing.a - c.arc / 2, ang);
        ctx.stroke();
      }
      if (this.blockT <= 0) drawRotated(ctx, SPR.sword, sx, sy + 2, ang, 1);
    } else if (c.attack === 'arrow') {
      drawRotated(ctx, SPR.bow, sx, sy + 1, this.aim, 3);
      if (this.cd <= 0) drawRotated(ctx, SPR.arrow, sx, sy + 1, this.aim, 1);
    } else {
      const bx = sx + (flip ? -7 : 7);
      const by = sy + 1 + Math.round(Math.sin(game.time * 3));
      if (this.castT > 0) {
        ctx.fillStyle = 'rgba(176,124,255,0.45)';
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      drawSprite(ctx, SPR.book, bx, by, { flip });
    }
  }

  drawShield(ctx, sx, sy, flip, game) {
    if (this.blockT > 0) {
      const pulse = 11 + Math.round(Math.sin(game.time * 20));
      ctx.strokeStyle = 'rgba(127,212,255,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, pulse, 0, Math.PI * 2);
      ctx.stroke();
      drawSprite(ctx, SPR.shield, sx + Math.cos(this.aim) * 8, sy + Math.sin(this.aim) * 8 + 1);
    } else {
      drawSprite(ctx, SPR.shield, sx + (flip ? 5 : -5), sy + 2, { flip });
    }
  }
}
