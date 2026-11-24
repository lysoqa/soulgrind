// Pfeile, Magiekugeln (Spieler) und Kugeln der Gegner
function updateProjectiles(dt, game) {
  for (const p of game.projectiles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    if (p.kind === 'orb' && Math.random() < (p.small ? 0.3 : 0.7)) {
      const cols = p.gold ? ['#ffd34a', '#fff4c2'] : ['#b07cff', '#e0ccff'];
      game.fx.particle(p.x, p.y, cols[Math.random() < 0.5 ? 0 : 1], 0.3, 10);
    }
    if (p.kind === 'tornado' && Math.random() < 0.8) {
      game.fx.particle(p.x + (Math.random() - 0.5) * p.r * 2, p.y + p.r * 0.6, '#9fb0c2', 0.4, 15);
    }

    if (p.friendly) {
      for (const e of game.enemies) {
        if (e.dead || p.hit.has(e)) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) > e.r + p.r) continue;
        const ang = Math.atan2(p.vy, p.vx);
        if (p.aoe) {
          explode(p, game, e);
        } else {
          applyHitEffects(e, p);
          game.hitEnemy(e, p.dmg, ang, p.knockback);
          p.hit.add(e);
          if (p.kind === 'arrow' && p.hit.size === 2) game.run.pierce2++; // für den Schützen-Erfolg
          if (--p.pierce <= 0) p.dead = true;
        }
        break;
      }
      if (!p.dead && p.life <= 0 && p.aoe) explode(p, game, null);
    } else {
      const pl = game.player;
      const dist = Math.hypot(pl.x - p.x, pl.y - p.y);
      const reflect = pl.reflectRadius();
      if (reflect && dist < reflect + p.r) {
        reflectProjectile(p, pl, game);
      } else if (dist < pl.r + p.r && !pl.projectileImmune) {
        const hit = pl.takeDamage(p.dmg, game, { src: p.src });
        if (hit && p.poison) { // Gift startet neu, stapelt sich nicht
          const po = p.poison === true ? POISON : p.poison;
          pl.poisonT = po.duration;
          pl.poisonDmg = po.tickDmg;
          pl.poisonSrc = `Gift (${p.src || 'Gegner'})`;
        }
        p.dead = true;
      }
    }
    if (p.life <= 0) p.dead = true;
  }
  game.projectiles = game.projectiles.filter((p) => !p.dead);
}

// Eispfeil friert ein, Sturmwalze verlangsamt
function applyHitEffects(e, p) {
  if (p.freeze) {
    Sound.play('freeze');
    const t = e.boss ? p.freeze / 2 : p.freeze;
    e.stunT = Math.max(e.stunT, t);
    e.frozenT = Math.max(e.frozenT, t);
    e.beamState = null;
  }
  if (p.slow) {
    e.slowT = Math.max(e.slowT, p.slowTime);
    e.slowMul = Math.min(e.slowMul, p.slow);
  }
}

// Krieger: Schildblock oder Wirbelschlag wirft ein gegnerisches Geschoss zurück
function reflectProjectile(p, pl, game) {
  const sp = Math.hypot(p.vx, p.vy) * 1.3;
  // zurück in die Richtung, aus der es kam
  const a = Math.atan2(-p.vy, -p.vx);
  p.friendly = true;
  p.reflected = true;
  p.vx = Math.cos(a) * sp;
  p.vy = Math.sin(a) * sp;
  p.life = 1.6;
  p.dmg = Math.round(pl.rollDamage() * pl.reflectFactor());
  p.pierce = 1;
  p.hit = new Set();
  p.aoe = 0;
  p.knockback = 4;
  p.poison = null;
  game.run.reflects++; // für den Krieger-Erfolg
  Sound.play('block');
  game.fx.burst(p.x, p.y, '#7fd4ff', 5);
}

// Magiekugel: voller Schaden am Ziel, weniger Schaden an Gegnern im Umkreis
function explode(p, game, target) {
  p.dead = true;
  game.fx.ring(p.x, p.y, '#b07cff', p.aoe);
  game.fx.burst(p.x, p.y, '#c9a6ff', 10);
  for (const e of game.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (e === target) game.hitEnemy(e, p.dmg, Math.atan2(e.y - p.y, e.x - p.x), p.knockback);
    else if (d <= p.aoe + e.r) game.hitEnemy(e, Math.round(p.dmg * p.aoeFactor), Math.atan2(e.y - p.y, e.x - p.x), p.knockback);
  }
}

function drawProjectiles(ctx, cam, game) {
  for (const p of game.projectiles) {
    const sx = Math.round(p.x - cam.x);
    const sy = Math.round(p.y - cam.y);
    if (p.reflected) {
      // zurückgeworfenes Geschoss: leuchtet blau
      ctx.fillStyle = '#1a1420';
      ctx.fillRect(sx - 2, sy - 3, 5, 7);
      ctx.fillRect(sx - 3, sy - 2, 7, 5);
      ctx.fillStyle = '#7fd4ff';
      ctx.fillRect(sx - 2, sy - 2, 5, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx - 1, sy - 1, 2, 2);
    } else if (p.sprite) {
      drawRotated(ctx, SPR[p.sprite], sx, sy, Math.atan2(p.vy, p.vx), -3); // Goblin-Pfeile, Schattenklingen
    } else if (p.kind === 'arrow') {
      drawRotated(ctx, p.freeze ? SPR.iceArrow : p.gold ? SKIN_SPR.goldArrow : SPR.arrow, sx, sy, Math.atan2(p.vy, p.vx), -4);
    } else if (p.kind === 'tornado') {
      const wob = Math.round(Math.sin(game.time * 25) * 1.5);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(sx - 6, sy + 8, 13, 2);
      drawSprite(ctx, SPR.tornado, sx + wob, sy - 1, { scale: 2, flip: Math.floor(game.time * 12) % 2 === 0 });
    } else if (p.kind === 'orb' && p.small) {
      ctx.fillStyle = p.gold ? 'rgba(255,211,74,0.5)' : 'rgba(176,124,255,0.5)';
      ctx.fillRect(sx - 2, sy - 2, 5, 5);
      ctx.fillStyle = p.gold ? '#fff4c2' : '#e0ccff';
      ctx.fillRect(sx - 1, sy - 1, 3, 3);
    } else if (p.kind === 'orb' && p.gold) {
      ctx.fillStyle = 'rgba(255,211,74,0.5)';
      ctx.fillRect(sx - 3, sy - 3, 7, 7);
      ctx.fillStyle = '#ffd34a';
      ctx.fillRect(sx - 2, sy - 2, 5, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx - 1, sy - 1, 3, 3);
    } else if (p.kind === 'venom') {
      // Giftspucke der Ratten
      ctx.fillStyle = '#1a1420';
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
      ctx.fillStyle = '#b6e04a';
      ctx.fillRect(sx - 1, sy - 1, 2, 2);
    } else if (p.kind === 'thorn') {
      drawRotated(ctx, SPR.thorn, sx, sy, Math.atan2(p.vy, p.vx), -3);
    } else if (p.kind === 'seed') {
      ctx.fillStyle = '#1a1420';
      ctx.fillRect(sx - 2, sy - 2, 5, 5);
      ctx.fillStyle = '#9be05a';
      ctx.fillRect(sx - 1, sy - 1, 3, 3);
      ctx.fillStyle = '#e8ffc2';
      ctx.fillRect(sx, sy - 1, 1, 1);
    } else if (p.kind === 'orb') {
      ctx.fillStyle = 'rgba(176,124,255,0.5)';
      ctx.fillRect(sx - 3, sy - 3, 7, 7);
      ctx.fillStyle = '#b07cff';
      ctx.fillRect(sx - 2, sy - 2, 5, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx - 1, sy - 1, 3, 3);
    } else {
      ctx.fillStyle = '#1a1420';
      ctx.fillRect(sx - 2, sy - 3, 5, 7);
      ctx.fillRect(sx - 3, sy - 2, 7, 5);
      ctx.fillStyle = '#ff5a5a';
      ctx.fillRect(sx - 2, sy - 2, 5, 5);
      ctx.fillStyle = '#ffd0d0';
      ctx.fillRect(sx - 1, sy - 1, 2, 2);
    }
  }
}
