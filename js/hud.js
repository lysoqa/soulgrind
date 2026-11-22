// Anzeigen: Lebensleiste, XP-Leiste, Level, Timer, Stats, Block, Auswahl- und Todesbildschirm
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function drawBar(ctx, x, y, w, h, frac, color, back = '#2a2230') {
  ctx.fillStyle = '#1a1420';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, frac))), h);
}

function drawPips(ctx, x, y, rank, { size = 2, gap = 1, highlight = -1, time = 0 } = {}) {
  for (let k = 0; k < STAT_MAX_RANK; k++) {
    let color = k < rank ? '#8b3dff' : '#3a3046';
    if (k === highlight && Math.floor(time * 4) % 2 === 0) color = '#ffd34a';
    ctx.fillStyle = color;
    ctx.fillRect(x + k * (size + gap), y, size, size + 1);
  }
}

function drawHUD(ctx, game) {
  const p = game.player;
  const w = 150;
  const x = Math.round((W - w) / 2);

  // Leben
  drawBar(ctx, x, H - 22, w, 7, p.hp / p.maxHp, p.hp / p.maxHp < 0.3 ? '#ff5a5a' : '#d93a4a');
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x, H - 22, Math.round((w * p.hp) / p.maxHp), 2);
  Font.draw(ctx, `${Math.ceil(p.hp)}/${p.maxHp}`, W / 2, H - 21, { align: 'center' });

  // XP
  const maxed = p.level >= MAX_LEVEL;
  drawBar(ctx, x, H - 11, w, 4, maxed ? 1 : p.xp / xpForLevel(p.level), '#ffd34a');
  Font.draw(ctx, `LV ${p.level}`, x - 5, H - 16, { align: 'right', color: '#ffd34a' });
  Font.draw(ctx, maxed ? 'MAX' : `${Math.floor(p.xp)}/${xpForLevel(p.level)} XP`, x + w + 5, H - 12, { color: '#b9b4a6' });

  // Oben: Klasse, Kills, Rundenzeit
  Font.draw(ctx, p.cls.name, 6, 6, { color: '#f1ede2' });
  Font.draw(ctx, `Kills ${p.kills}`, 6, 14, { color: '#b9b4a6' });
  // Gold: diese Ebene (unsicher) und schon gesichertes
  drawSprite(ctx, SPR.coin, W - 9, 25);
  Font.draw(ctx, `${game.runGold}`, W - 14, 23, { align: 'right', color: '#ffd34a' });
  if (game.bankedGold > 0) Font.draw(ctx, `${game.bankedGold} sicher`, W - 6, 31, { align: 'right', color: '#8b8a95', shadow: null });
  const frozen = game.phase !== 'waves';
  Font.draw(ctx, fmtTime(game.runTime), W / 2, 5, { align: 'center', scale: 2, color: frozen ? '#ffd34a' : '#f1ede2' });
  Font.draw(ctx, `Ebene ${game.stage + 1} · ${game.stageDef.name}`, W - 6, 6, { align: 'right', color: '#b9b4a6' });

  if (game.phase === 'clear') {
    const left = game.enemies.filter((e) => !e.dead).length;
    const blink = Math.floor(game.time * 2) % 2 === 0;
    Font.draw(ctx, `Besiege alle Gegner · ${left} übrig`, W / 2, 20, { align: 'center', color: blink ? '#ffd34a' : '#e0b030' });
  }

  // Lebensleiste des Ebenen-Bosses
  const boss = game.stageBoss;
  if (game.phase === 'boss' && boss && !boss.dead) {
    const bw = 180;
    const bx = Math.round((W - bw) / 2);
    Font.draw(ctx, boss.type.name, W / 2, 20, { align: 'center', scale: 2, color: '#9be05a', shadow: '#1a3010' });
    drawBar(ctx, bx, 33, bw, 5, boss.hp / boss.maxHp, '#4f9a3a');
  }

  if (game.autoFire) Font.draw(ctx, `Auto (${Settings.keyLabel(Settings.autoFireKey)})`, x - 5, H - 27, { align: 'right', color: '#7fe07f' });

  // Gewählte Stats links
  Object.entries(p.stats).forEach(([id, rank], i) => {
    const y = 26 + i * 10;
    drawSprite(ctx, STATS[id].sprite, 9, y + 3);
    drawPips(ctx, 15, y + 1, rank, { size: 3 });
  });

  // Fähigkeit (Rechtsklick) mit Abklingzeit
  {
    const bx = x + w + 10;
    const by = H - 34;
    ctx.fillStyle = '#1a1420';
    ctx.fillRect(bx - 1, by - 1, 16, 16);
    ctx.fillStyle = p.abilityActive ? '#2d5a73' : '#2a2230';
    ctx.fillRect(bx, by, 14, 14);
    drawSprite(ctx, ABILITY_ICONS[p.ability.id], bx + 7, by + 7);
    if (p.abilityCd > 0 && !p.abilityActive) {
      const frac = p.abilityCd / p.abilityCooldown;
      ctx.fillStyle = 'rgba(10,8,14,0.7)';
      ctx.fillRect(bx, by, 14, Math.ceil(14 * frac));
      Font.draw(ctx, Math.ceil(p.abilityCd), bx + 7, by + 5, { align: 'center' });
    }
    Font.draw(ctx, 'RK', bx + 18, by + 5, { color: '#8b8a95' });

    // Ult (R): füllt sich von unten mit jedem Kill
    const ux = bx + 32;
    const u = p.ult;
    const ready = p.ultReady;
    const glow = ready && Math.floor(game.time * 4) % 2 === 0;
    ctx.fillStyle = glow ? '#ffd34a' : '#1a1420';
    ctx.fillRect(ux - 1, by - 1, 16, 16);
    ctx.fillStyle = p.ultActive ? '#5a3a10' : '#2a2230';
    ctx.fillRect(ux, by, 14, 14);
    if (!p.ultActive && !ready) {
      const fh = Math.round(14 * p.ultCharge);
      ctx.fillStyle = '#5a4a20';
      ctx.fillRect(ux, by + 14 - fh, 14, fh);
    }
    drawSprite(ctx, ABILITY_ICONS[u.id], ux + 7, by + 7);
    if (p.ultActive) Font.draw(ctx, Math.ceil(p.ultT), ux + 7, by + 5, { align: 'center', color: '#ffd34a' });
    else if (!ready) {
      ctx.fillStyle = 'rgba(10,8,14,0.45)';
      ctx.fillRect(ux, by, 14, 14);
      Font.draw(ctx, `${Math.floor(p.ultCharge * 100)}`, ux + 7, by + 5, { align: 'center', color: '#b9b4a6' });
    }
    Font.draw(ctx, 'R', ux + 18, by + 5, { color: ready ? '#ffd34a' : '#8b8a95' });
  }

  // Gift
  if (p.poisonT > 0) Font.draw(ctx, `Gift ${Math.ceil(p.poisonT)}s`, W / 2, H - 31, { align: 'center', color: '#9be05a' });

  // Developer-Modus
  if (DEV_MODE) {
    Font.draw(ctx, game.devGod ? 'F1 Dev · unverwundbar' : 'F1 Dev', W - 6, 14, { align: 'right', color: '#8b3dff', shadow: null });
  }

  // Level-Up-Banner (nur wenn keine Auswahl offen ist)
  if (game.levelBanner > 0 && !game.choice) {
    const t = game.levelBanner;
    const y = 40 - Math.round(Math.max(0, t - 1.2) * 20);
    Font.draw(ctx, 'Level Up!', W / 2, y, { align: 'center', scale: 3, color: '#ffd34a' });
  }
}

// ---------- Stat-Auswahl nach Level-Up ----------

function choiceRects(n) {
  const cw = 100, ch = 96, gap = 10;
  const x0 = Math.round((W - (cw * n + gap * (n - 1))) / 2);
  return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (cw + gap), y: 54, w: cw, h: ch }));
}

function rerollRect() {
  return { x: W / 2 - 66, y: 160, w: 132, h: 14 };
}

function drawChoice(ctx, game) {
  const p = game.player;
  const c = game.choice;
  ctx.fillStyle = 'rgba(10,8,14,0.78)';
  ctx.fillRect(0, 0, W, H);

  Font.draw(ctx, `Level ${p.level}!`, W / 2, 14, { align: 'center', scale: 3, color: '#ffd34a' });
  Font.draw(ctx, 'Wähle einen Bonus · Klicken oder 1 / 2 / 3', W / 2, 38, { align: 'center', color: '#b9b4a6' });

  choiceRects(c.options.length).forEach((r, i) => {
    const id = c.options[i];
    const s = STATS[id];
    const rank = p.rank(id);
    const hover = i === c.hover;
    const y = r.y - (hover ? 2 : 0);

    ctx.fillStyle = '#000';
    ctx.fillRect(r.x + 3, y + 3, r.w, r.h);
    ctx.fillStyle = hover ? '#241c30' : '#1a1422';
    ctx.fillRect(r.x, y, r.w, r.h);
    ctx.strokeStyle = hover ? '#f1ede2' : '#3a3046';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, y + 0.5, r.w - 1, r.h - 1);

    if (rank === 0) {
      ctx.fillStyle = '#8b3dff';
      ctx.fillRect(r.x + r.w - 22, y + 4, 18, 9);
      Font.draw(ctx, 'Neu', r.x + r.w - 13, y + 6, { align: 'center', shadow: null });
    }
    drawSprite(ctx, s.sprite, r.x + r.w / 2, y + 24, { scale: 3 });
    Font.draw(ctx, s.name, r.x + r.w / 2, y + 42, { align: 'center' });
    Font.draw(ctx, s.desc, r.x + r.w / 2, y + 54, { align: 'center', color: '#b9b4a6', shadow: null });
    drawPips(ctx, r.x + r.w / 2 - 17, y + 68, rank, { size: 6, gap: 1, highlight: rank, time: game.time });
    Font.draw(ctx, `Rang ${rank} > ${rank + 1}`, r.x + r.w / 2, y + 80, { align: 'center', color: '#8b8a95', shadow: null });
    Font.draw(ctx, i + 1, r.x + 4, y + r.h - 8, { color: '#5d5868', shadow: null });
  });

  const rr = rerollRect();
  const canReroll = p.rerolls > 0;
  const overReroll = canReroll && inRect(Input.mouse, rr);
  ctx.fillStyle = overReroll ? '#3a2a55' : '#1a1422';
  ctx.fillRect(rr.x, rr.y, rr.w, rr.h);
  ctx.strokeStyle = canReroll ? '#8b3dff' : '#3a3046';
  ctx.strokeRect(rr.x + 0.5, rr.y + 0.5, rr.w - 1, rr.h - 1);
  Font.draw(ctx, `Neu würfeln (R) · ${p.rerolls} übrig`, W / 2, rr.y + 5, {
    align: 'center', color: canReroll ? '#f1ede2' : '#5d5868', shadow: null,
  });

  const owned = Object.keys(p.stats).length;
  const hint = owned >= STAT_MAX_DISTINCT ? 'Alle 5 Stat-Plätze belegt: nur noch Aufwertungen' : `Stat-Plätze ${owned}/${STAT_MAX_DISTINCT}`;
  Font.draw(ctx, hint, W / 2, 181, { align: 'center', color: '#8b8a95' });
}

// ---------- Klassenauswahl ----------

function cardRects() {
  const cw = 112, ch = 130, gap = 10;
  const x0 = Math.round((W - (cw * 3 + gap * 2)) / 2);
  return CLASS_ORDER.map((id, i) => ({ id, x: x0 + i * (cw + gap), y: 50, w: cw, h: ch }));
}

function drawSelect(ctx, game) {
  ctx.fillStyle = '#100c16';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { // Hintergrund-Pixel
    ctx.fillStyle = i % 3 ? '#1c1626' : '#2a2038';
    ctx.fillRect((i * 97 + Math.floor(game.time * (4 + (i % 5)))) % W, (i * 53) % H, 1, 1);
  }

  Font.draw(ctx, 'Soulgrind', W / 2, 10, { align: 'center', scale: 4, color: '#8b3dff', shadow: '#2a1050' });
  Font.draw(ctx, 'Wähle deine Klasse', W / 2, 36, { align: 'center', color: '#b9b4a6' });

  game.hoverCard = -1;
  cardRects().forEach((r, i) => {
    const cls = CLASSES[r.id];
    const hover = inRect(Input.mouse, r);
    if (hover) game.hoverCard = i;
    const y = r.y - (hover ? 2 : 0);

    ctx.fillStyle = '#000';
    ctx.fillRect(r.x + 3, y + 3, r.w, r.h);
    ctx.fillStyle = hover ? '#241c30' : '#1a1422';
    ctx.fillRect(r.x, y, r.w, r.h);
    ctx.strokeStyle = hover ? '#f1ede2' : '#3a3046';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, y + 0.5, r.w - 1, r.h - 1);

    Font.draw(ctx, cls.name, r.x + r.w / 2, y + 7, { align: 'center', scale: 2 });
    const bob = hover && Math.floor(game.time * 4) % 2 ? 1 : 0;
    drawSprite(ctx, SPR[cls.sprite], r.x + r.w / 2, y + 40 - bob, { scale: 3 });
    Font.draw(ctx, cls.gear, r.x + r.w / 2, y + 62, { align: 'center', color: '#ffd34a' });

    Object.entries(cls.pips).forEach(([label, val], j) => {
      const py = y + 71 + j * 8;
      Font.draw(ctx, label, r.x + 8, py, { color: '#b9b4a6', shadow: null });
      for (let k = 0; k < 5; k++) {
        ctx.fillStyle = k < val ? '#8b3dff' : '#3a3046';
        ctx.fillRect(r.x + 62 + k * 8, py, 6, 5);
      }
    });
    Font.draw(ctx, i + 1, r.x + r.w - 6, y + r.h - 9, { align: 'right', color: '#5d5868', shadow: null });

    // Spielstand dieser Klasse: beste Zeit pro Ebene (grün = geschafft) und Kills
    const rec = Records.forClass(r.id);
    ctx.fillStyle = '#2a2038';
    ctx.fillRect(r.x + 4, y + 107, r.w - 8, 1);
    STAGES.forEach((st, k) => {
      const n = k + 1;
      const best = rec.best[n];
      const color = rec.cleared[n] ? '#9be05a' : best !== undefined ? '#f1ede2' : '#5d5868';
      Font.draw(ctx, `E${n} ${best !== undefined ? fmtTime(best) : '-'}`, r.x + 8 + k * 50, y + 111, { color, shadow: null });
    });
    Font.draw(ctx, `Kills ${rec.kills}`, r.x + 8, y + 120, { color: '#b9b4a6', shadow: null });
  });

  const hint = game.hoverCard >= 0 ? CLASSES[CLASS_ORDER[game.hoverCard]].hint : `WASD laufen · Maus zielen · Linksklick angreifen · ${Settings.keyLabel(Settings.autoFireKey)} Auto · R Ult`;
  Font.draw(ctx, hint, W / 2, 188, { align: 'center', color: '#b9b4a6' });
  Font.draw(ctx, 'Klicken oder 1 / 2 / 3 drücken · ESC zurück', W / 2, 199, { align: 'center', color: '#5d5868', shadow: null });
  Font.draw(ctx, `Kills gesamt ${Records.totalKills()}`, 4, H - 8, { color: '#5d5868', shadow: null });
  drawBackButton(ctx);
  Font.draw(ctx, `v${GAME_VERSION}${DEV_MODE ? ' dev' : ''}`, W - 4, H - 8, { align: 'right', color: '#3a3046', shadow: null });
}

// ---------- Fähigkeit wählen (nach der Klasse) ----------

function abilityRects(n) {
  const cw = 150, ch = 100, gap = 12;
  const x0 = Math.round((W - (cw * n + gap * (n - 1))) / 2);
  return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (cw + gap), y: 50, w: cw, h: ch }));
}

function backRect() {
  return { x: 8, y: 8, w: 52, h: 13 };
}

function drawBackButton(ctx) {
  const b = backRect();
  const overBack = inRect(Input.mouse, b);
  ctx.fillStyle = overBack ? '#2a2038' : '#1a1422';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = '#3a3046';
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
  Font.draw(ctx, '< Zurück', b.x + b.w / 2, b.y + 4, { align: 'center', shadow: null, color: overBack ? '#f1ede2' : '#b9b4a6' });
}

function drawAbilitySelect(ctx, game) {
  const cls = CLASSES[game.pickedClass];
  ctx.fillStyle = '#100c16';
  ctx.fillRect(0, 0, W, H);

  drawSprite(ctx, SPR[cls.sprite], W / 2, 18, { scale: 2 });
  Font.draw(ctx, cls.name, W / 2, 30, { align: 'center', scale: 2 });
  Font.draw(ctx, 'Wähle deine Fähigkeit (Rechtsklick)', W / 2, 42, { align: 'center', color: '#b9b4a6' });

  abilityRects(cls.abilities.length).forEach((r, i) => {
    const ab = cls.abilities[i];
    const hover = i === game.hoverAbility;
    const y = r.y - (hover ? 2 : 0);

    ctx.fillStyle = '#000';
    ctx.fillRect(r.x + 3, y + 3, r.w, r.h);
    ctx.fillStyle = hover ? '#241c30' : '#1a1422';
    ctx.fillRect(r.x, y, r.w, r.h);
    ctx.strokeStyle = hover ? '#f1ede2' : '#3a3046';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, y + 0.5, r.w - 1, r.h - 1);

    drawSprite(ctx, ABILITY_ICONS[ab.id], r.x + r.w / 2, y + 17, { scale: 3 });
    Font.draw(ctx, ab.name, r.x + r.w / 2, y + 33, { align: 'center', scale: 2, color: '#ffd34a' });
    Font.wrap(ab.desc, r.w - 16).forEach((line, j) => {
      Font.draw(ctx, line, r.x + r.w / 2, y + 48 + j * 8, { align: 'center', color: '#b9b4a6', shadow: null });
    });
    ctx.fillStyle = '#2a2038';
    ctx.fillRect(r.x + 8, y + r.h - 17, r.w - 16, 11);
    Font.draw(ctx, `Abklingzeit ${String(ab.cooldown).replace('.', ',')} s`, r.x + r.w / 2, y + r.h - 14, { align: 'center', shadow: null });
    Font.draw(ctx, i + 1, r.x + 4, y + 4, { color: '#5d5868', shadow: null });
  });

  drawBackButton(ctx);

  // Ult der Klasse (immer dabei, Taste R)
  const u = cls.ult;
  const kills = Math.ceil(1 / u.perKill - 1e-9);
  const ub = { x: 30, y: 158, w: W - 60, h: 36 };
  ctx.fillStyle = '#1a1422';
  ctx.fillRect(ub.x, ub.y, ub.w, ub.h);
  ctx.strokeStyle = '#8a6a20';
  ctx.strokeRect(ub.x + 0.5, ub.y + 0.5, ub.w - 1, ub.h - 1);
  drawSprite(ctx, ABILITY_ICONS[u.id], ub.x + 14, ub.y + 18, { scale: 2 });
  Font.draw(ctx, `Ult (R): ${u.name}`, ub.x + 30, ub.y + 5, { color: '#ffd34a', shadow: null });
  Font.draw(ctx, `Lädt ${Math.round(u.perKill * 100)} % pro Kill · voll nach ${kills} Kills`, ub.x + ub.w - 6, ub.y + 5, { align: 'right', color: '#8b8a95', shadow: null });
  Font.wrap(u.desc, ub.w - 38).forEach((line, j) => {
    Font.draw(ctx, line, ub.x + 30, ub.y + 15 + j * 8, { color: '#b9b4a6', shadow: null });
  });

  Font.draw(ctx, 'Klicken oder 1 / 2 · ESC zurück', W / 2, 203, { align: 'center', color: '#5d5868', shadow: null });
}

// ---------- Tod und Pause ----------

function drawDead(ctx, game) {
  ctx.fillStyle = 'rgba(16,6,10,0.75)';
  ctx.fillRect(0, 0, W, H);
  const s = game.lastRun;
  Font.draw(ctx, 'Du bist gefallen', W / 2, 46, { align: 'center', scale: 3, color: '#ff5a5a', shadow: '#3a0a10' });
  Font.draw(ctx, `${s.cls} · Level ${s.level} · Ebene ${s.stage}`, W / 2, 78, { align: 'center', scale: 2 });
  Font.draw(ctx, `Überlebt ${fmtTime(s.time)}`, W / 2, 96, { align: 'center', color: '#f1ede2' });
  if (s.newBest) Font.draw(ctx, 'Neue Bestzeit!', W / 2, 140, { align: 'center', color: '#ffd34a' });
  else if (s.dev) Font.draw(ctx, 'Dev-Modus benutzt · nicht gespeichert', W / 2, 140, { align: 'center', color: '#8b3dff' });
  Font.draw(ctx, `Kills ${s.kills} · Bosse ${s.bosses}`, W / 2, 106, { align: 'center', color: '#b9b4a6' });
  Font.draw(ctx, 'Dein Held ist für immer verloren.', W / 2, 118, { align: 'center', color: '#8b8a95' });
  const goldLine = s.goldKept > 0 ? `${s.goldKept} Gold gesichert · ${s.goldLost} Gold verloren` : `${s.goldLost} Gold verloren`;
  Font.draw(ctx, goldLine, W / 2, 128, { align: 'center', color: '#c99a20' });
  if (game.deadT > 1.2 && Math.floor(game.time * 2) % 2 === 0) {
    Font.draw(ctx, 'Klicken für einen neuen Helden', W / 2, 156, { align: 'center', color: '#ffd34a' });
  }
}

// Feuerzone der Magier-Ult: flackernder Glutboden
function drawFireZones(ctx, cam, game) {
  for (const z of game.zones) {
    const sx = Math.round(z.x - cam.x);
    const sy = Math.round(z.y - cam.y);
    const fade = Math.min(1, z.t / 0.5);
    ctx.globalAlpha = 0.35 * fade;
    ctx.fillStyle = '#ff5a2a';
    ctx.beginPath();
    ctx.arc(sx, sy, z.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.5 * fade;
    ctx.fillStyle = '#ffd34a';
    ctx.beginPath();
    ctx.arc(sx, sy, z.radius * (0.45 + 0.08 * Math.sin(game.time * 12)), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#ff9a3c';
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI * 2) / 24 - game.time * 1.5;
      ctx.fillRect(Math.round(sx + Math.cos(a) * z.radius), Math.round(sy + Math.sin(a) * z.radius), 1, 1);
    }
    ctx.globalAlpha = 1;
  }
}

// ---------- Developer-Menü (F1) ----------

const DEV_ACTIONS = [
  'Zur nächsten Ebene springen',
  'Timer auf 5 s vor dem Ebenen-Boss',
  '+1 Level',
  'Ult sofort voll',
  'Unverwundbar an / aus',
  'Alle Gegner töten',
];

function drawDevMenu(ctx, game) {
  ctx.fillStyle = 'rgba(10,6,20,0.8)';
  ctx.fillRect(0, 0, W, H);
  Font.draw(ctx, 'Developer', W / 2, 30, { align: 'center', scale: 3, color: '#8b3dff' });
  DEV_ACTIONS.forEach((label, i) => {
    Font.draw(ctx, `${i + 1}   ${label}`, W / 2 - 80, 66 + i * 14, { color: '#f1ede2' });
  });
  Font.draw(ctx, `Unverwundbar: ${game.devGod ? 'an' : 'aus'}`, W / 2, 158, { align: 'center', color: '#b9b4a6' });
  Font.draw(ctx, 'Taste 1-6 · F1 oder ESC schließt', W / 2, 176, { align: 'center', color: '#8b8a95' });
  Font.draw(ctx, 'Runs mit Dev-Modus zählen nicht für die Spielstände.', W / 2, 190, { align: 'center', color: '#5d5868', shadow: null });
}

function upgradeRects(n) {
  const cw = 164, ch = 104, gap = 12;
  const x0 = Math.round((W - (cw * n + gap * (n - 1))) / 2);
  return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (cw + gap), y: 72, w: cw, h: ch }));
}

function drawStageClear(ctx, game) {
  const s = game.lastClear;
  const p = game.player;
  const next = STAGES[game.stage + 1];
  ctx.fillStyle = 'rgba(8,14,8,0.82)';
  ctx.fillRect(0, 0, W, H);
  Font.draw(ctx, `Ebene ${s.stage} geschafft!`, W / 2, 10, { align: 'center', scale: 3, color: '#9be05a', shadow: '#1a3010' });
  if (s.boss) Font.draw(ctx, `${s.boss} ist besiegt.${s.newBest ? ' Neuer Rekord!' : ''}`, W / 2, 33, { align: 'center', color: '#f1ede2' });
  Font.draw(ctx, `${p.cls.name} · Level ${p.level} · Kills ${p.kills}`, W / 2, 43, { align: 'center', color: '#b9b4a6' });
  drawSprite(ctx, SPR.coin, W / 2 - 46, 55);
  Font.draw(ctx, `+${s.gold} Gold gesichert`, W / 2 - 40, 53, { color: '#ffd34a' });
  if (!next) return;

  const ready = game.clearT > 1.2;
  const opts = s.options;
  if (opts.length) {
    Font.draw(ctx, 'Wähle ein Upgrade · Klicken oder 1 / 2', W / 2, 63, { align: 'center', color: ready ? '#ffd34a' : '#5d5868' });
    upgradeRects(opts.length).forEach((r, i) => {
      const o = opts[i];
      const hover = ready && i === game.upgradeHover;
      const y = r.y - (hover ? 2 : 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(r.x + 3, y + 3, r.w, r.h);
      ctx.fillStyle = hover ? '#241c30' : '#1a1422';
      ctx.fillRect(r.x, y, r.w, r.h);
      ctx.strokeStyle = hover ? '#ffd34a' : o.kind === 'ult' ? '#8a6a20' : '#3a3046';
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 0.5, y + 0.5, r.w - 1, r.h - 1);
      Font.draw(ctx, `${o.kind === 'ult' ? 'Ult' : 'Fähigkeit'}: ${o.base.name}`, r.x + r.w / 2, y + 5, { align: 'center', color: '#8b8a95', shadow: null });
      drawSprite(ctx, ABILITY_ICONS[o.base.id], r.x + r.w / 2, y + 23, { scale: 2 });
      Font.draw(ctx, o.up.name, r.x + r.w / 2, y + 37, { align: 'center', scale: 2, color: '#ffd34a' });
      Font.wrap(o.up.desc, r.w - 14).forEach((line, j) => {
        Font.draw(ctx, line, r.x + r.w / 2, y + 53 + j * 8, { align: 'center', color: '#b9b4a6', shadow: null });
      });
      Font.draw(ctx, i + 1, r.x + 4, y + 4, { color: '#5d5868', shadow: null });
    });
  } else if (ready && Math.floor(game.time * 2) % 2 === 0) {
    Font.draw(ctx, 'Klicken zum Weitergehen', W / 2, 120, { align: 'center', color: '#ffd34a' });
  }
  Font.draw(ctx, `Als Nächstes: Ebene ${s.stage + 1} · ${next.name} · Leben wird aufgefüllt`, W / 2, 190, { align: 'center', color: '#8b8a95' });
}

// ---------- Hauptmenü und Optionen ----------

function menuButtons() {
  const w = 150, h = 18, x = (W - w) / 2;
  return [
    { id: 'play', label: 'Spielen', x, y: 78, w, h },
    { id: 'upgrades', label: 'Upgrades', soon: true, x, y: 102, w, h },
    { id: 'achievements', label: 'Erfolge', soon: true, x, y: 126, w, h },
    { id: 'options', label: 'Optionen', x, y: 150, w, h },
  ];
}

function drawMenuBackground(ctx, game) {
  ctx.fillStyle = '#100c16';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = i % 3 ? '#1c1626' : '#2a2038';
    ctx.fillRect((i * 97 + Math.floor(game.time * (4 + (i % 5)))) % W, (i * 53) % H, 1, 1);
  }
}

function drawMenu(ctx, game) {
  drawMenuBackground(ctx, game);
  Font.draw(ctx, 'Soulgrind', W / 2, 18, { align: 'center', scale: 5, color: '#8b3dff', shadow: '#2a1050' });
  Font.draw(ctx, 'Grinden · Leveln · Sterben · Neu anfangen', W / 2, 52, { align: 'center', color: '#8b8a95' });

  menuButtons().forEach((b, i) => {
    const hover = i === game.menuHover && !b.soon;
    ctx.fillStyle = '#000';
    ctx.fillRect(b.x + 2, b.y + 2, b.w, b.h);
    ctx.fillStyle = b.soon ? '#151019' : hover ? '#3a2a55' : '#1a1422';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = b.soon ? '#2a2230' : hover ? '#f1ede2' : '#8b3dff';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    if (b.soon) {
      Font.draw(ctx, b.label, b.x + 10, b.y + 7, { color: '#5d5868', shadow: null });
      Font.draw(ctx, 'Coming Soon...', b.x + b.w - 8, b.y + 7, { align: 'right', color: '#5d5868', shadow: null });
    } else {
      Font.draw(ctx, b.label, W / 2, b.y + 5, { align: 'center', scale: 2, color: hover ? '#ffffff' : '#f1ede2' });
    }
  });

  drawSprite(ctx, SPR.coin, 9, H - 13);
  Font.draw(ctx, `${Records.gold} Gold`, 15, H - 15, { color: '#ffd34a' });
  Font.draw(ctx, `Kills gesamt ${Records.totalKills()}`, 6, H - 7, { color: '#5d5868', shadow: null });
  Font.draw(ctx, `v${GAME_VERSION}${DEV_MODE ? ' dev' : ''}`, W - 4, H - 8, { align: 'right', color: '#3a3046', shadow: null });
}

function optionsButtons() {
  return [
    { x: W / 2 + 10, y: 70, w: 90, h: 16 }, // Taste für Auto-Schuss
    { x: (W - 110) / 2, y: 170, w: 110, h: 16 }, // Zurück
  ];
}

function drawOptions(ctx, game) {
  drawMenuBackground(ctx, game);
  Font.draw(ctx, 'Optionen', W / 2, 18, { align: 'center', scale: 4, color: '#8b3dff', shadow: '#2a1050' });
  const [keyBtn, back] = optionsButtons();

  Font.draw(ctx, 'Auto-Schuss an / aus', keyBtn.x - 14, keyBtn.y + 5, { align: 'right', color: '#f1ede2' });
  const overKey = inRect(Input.mouse, keyBtn);
  ctx.fillStyle = game.rebinding ? '#3a2a55' : overKey ? '#2a2038' : '#1a1422';
  ctx.fillRect(keyBtn.x, keyBtn.y, keyBtn.w, keyBtn.h);
  ctx.strokeStyle = game.rebinding ? '#ffd34a' : '#8b3dff';
  ctx.strokeRect(keyBtn.x + 0.5, keyBtn.y + 0.5, keyBtn.w - 1, keyBtn.h - 1);
  const label = game.rebinding ? (Math.floor(game.time * 3) % 2 ? 'Taste drücken' : '') : Settings.keyLabel(Settings.autoFireKey);
  Font.draw(ctx, label, keyBtn.x + keyBtn.w / 2, keyBtn.y + 5, { align: 'center', color: game.rebinding ? '#ffd34a' : '#ffffff', shadow: null });

  const hint = game.rebinding ? 'Drück die neue Taste · ESC bricht ab' : 'Klick auf die Taste, um sie zu ändern (Standard: Q)';
  Font.draw(ctx, hint, W / 2, 96, { align: 'center', color: '#8b8a95', shadow: null });
  if (game.optionsMsg) Font.draw(ctx, game.optionsMsg, W / 2, 108, { align: 'center', color: game.optionsMsg === 'Gespeichert' ? '#7fe07f' : '#ff8a8a' });

  const overBack = inRect(Input.mouse, back);
  ctx.fillStyle = overBack ? '#3a2a55' : '#1a1422';
  ctx.fillRect(back.x, back.y, back.w, back.h);
  ctx.strokeStyle = '#8b3dff';
  ctx.strokeRect(back.x + 0.5, back.y + 0.5, back.w - 1, back.h - 1);
  Font.draw(ctx, 'Zurück (ESC)', W / 2, back.y + 5, { align: 'center', color: '#f1ede2', shadow: null });
}

function pauseButtons() {
  const w = 130, h = 16;
  return [
    { x: (W - w) / 2, y: 92, w, h, label: 'Weiter (ESC)' },
    { x: (W - w) / 2, y: 114, w, h, label: 'Run abbrechen' },
  ];
}

function drawPause(ctx, game) {
  ctx.fillStyle = 'rgba(10,8,14,0.7)';
  ctx.fillRect(0, 0, W, H);
  Font.draw(ctx, 'Pause', W / 2, 52, { align: 'center', scale: 4 });
  pauseButtons().forEach((b, i) => {
    const hover = inRect(Input.mouse, b);
    const danger = i === 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(b.x + 2, b.y + 2, b.w, b.h);
    ctx.fillStyle = hover ? (danger ? '#5a1a24' : '#3a2a55') : '#1a1422';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = danger ? '#d93a4a' : '#8b3dff';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    Font.draw(ctx, b.label, W / 2, b.y + 6, { align: 'center', color: danger ? '#ff8a8a' : '#f1ede2' });
  });
  Font.draw(ctx, 'Beim Abbrechen ist dein Held verloren.', W / 2, 140, { align: 'center', color: '#8b8a95', shadow: null });
  const p = game.player;
  Font.draw(ctx, `${p.cls.name} · ${p.ability.name} · Level ${p.level} · ${fmtTime(game.runTime)}`, W / 2, 160, { align: 'center', color: '#5d5868', shadow: null });
}

function drawCrosshair(ctx) {
  const x = Math.round(Input.mouse.x);
  const y = Math.round(Input.mouse.y);
  ctx.fillStyle = '#1a1420';
  ctx.fillRect(x - 4, y - 1, 9, 3);
  ctx.fillRect(x - 1, y - 4, 3, 9);
  ctx.fillStyle = '#f1ede2';
  ctx.fillRect(x - 3, y, 2, 1);
  ctx.fillRect(x + 2, y, 2, 1);
  ctx.fillRect(x, y - 3, 1, 2);
  ctx.fillRect(x, y + 2, 1, 2);
}
