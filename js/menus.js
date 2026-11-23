// Hauptmenü und seine Unterseiten: Upgrades, Erfolge, Statistik, Optionen. Dazu der Siegbildschirm.

const fmtNum = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const fmtLong = (s) => {
  s = Math.floor(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

function drawMenuBackground(ctx, game) {
  ctx.fillStyle = '#100c16';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = i % 3 ? '#1c1626' : '#2a2038';
    ctx.fillRect((i * 97 + Math.floor(game.time * (4 + (i % 5)))) % W, (i * 53) % H, 1, 1);
  }
}

function drawButton(ctx, r, label, { hover = false, color = '#8b3dff', scale = 1, disabled = false } = {}) {
  ctx.fillStyle = '#000';
  ctx.fillRect(r.x + 2, r.y + 2, r.w, r.h);
  ctx.fillStyle = disabled ? '#151019' : hover ? '#3a2a55' : '#1a1422';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = disabled ? '#2a2230' : hover ? '#f1ede2' : color;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  const th = 5 * scale;
  Font.draw(ctx, label, r.x + r.w / 2, r.y + Math.round((r.h - th) / 2), {
    align: 'center', scale, color: disabled ? '#5d5868' : hover ? '#ffffff' : '#f1ede2', shadow: scale > 1 ? '#1a1420' : null,
  });
}

// ---------- Hauptmenü ----------

function menuButtons() {
  const w = 150, h = 16, x = (W - w) / 2;
  return [
    { id: 'play', label: 'Spielen', x, y: 58, w, h },
    { id: 'upgrades', label: 'Upgrades', x, y: 78, w, h },
    { id: 'achievements', label: 'Erfolge', x, y: 98, w, h },
    { id: 'stats', label: 'Statistik', x, y: 118, w, h },
    { id: 'options', label: 'Optionen', x, y: 138, w, h },
  ];
}

const discordRect = () => ({ x: W / 2 - 62, y: 160, w: 124, h: 20 });

function drawMenu(ctx, game) {
  drawMenuBackground(ctx, game);
  Font.draw(ctx, 'Soulgrind', W / 2, 14, { align: 'center', scale: 5, color: '#8b3dff', shadow: '#2a1050' });
  Font.draw(ctx, 'Grinden · Leveln · Sterben · Neu anfangen', W / 2, 44, { align: 'center', color: '#8b8a95' });
  menuButtons().forEach((b, i) => drawButton(ctx, b, b.label, { hover: i === game.menuHover, scale: 2 }));

  // Discord-Einladung
  const d = discordRect();
  const over = inRect(Input.mouse, d);
  Font.draw(ctx, 'Tritt dem Discord bei!', W / 2, d.y + 2, { align: 'center', color: '#b9b4a6' });
  const link = 'discord.gg/ad2RtwyGyv';
  const col = over ? '#c2ccff' : '#8ea1ff';
  Font.draw(ctx, link, W / 2, d.y + 11, { align: 'center', color: col });
  const lw = Font.width(link);
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(W / 2 - lw / 2), d.y + 17, lw, 1);

  drawSprite(ctx, SPR.coin, 9, H - 13);
  Font.draw(ctx, `${fmtNum(Records.gold)} Gold`, 15, H - 15, { color: '#ffd34a' });
  Font.draw(ctx, `Kills gesamt ${fmtNum(Records.totalKills())}`, 6, H - 7, { color: '#5d5868', shadow: null });
  Font.draw(ctx, `v${GAME_VERSION}${DEV_MODE ? ' dev' : ''}`, W - 4, H - 8, { align: 'right', color: '#3a3046', shadow: null });
}

// ---------- Unterseiten allgemein ----------

const TAB_TITLES = { upgrades: 'Upgrades', achievements: 'Erfolge', stats: 'Statistik', options: 'Optionen' };

// Reiter oben: Statistik = Insgesamt + jede Klasse, Erfolge = jede Klasse
function tabLabels(state) {
  if (state === 'stats') return ['Insgesamt', ...CLASS_ORDER.map((id) => CLASSES[id].name)];
  if (state === 'achievements') return CLASS_ORDER.map((id) => CLASSES[id].name);
  return [];
}
function tabRects(state) {
  const labels = tabLabels(state);
  const w = 78, gap = 4;
  const x0 = Math.round((W - (w * labels.length + gap * (labels.length - 1))) / 2);
  return labels.map((label, i) => ({ x: x0 + i * (w + gap), y: 28, w, h: 12, label }));
}

function drawTab(ctx, game) {
  drawMenuBackground(ctx, game);
  Font.draw(ctx, TAB_TITLES[game.state], W / 2, 8, { align: 'center', scale: 3, color: '#8b3dff', shadow: '#2a1050' });
  if (game.state !== 'options') drawBackButton(ctx);
  tabRects(game.state).forEach((r, i) => {
    const active = i === game.tab;
    const hover = inRect(Input.mouse, r);
    ctx.fillStyle = active ? '#3a2a55' : hover ? '#241c30' : '#1a1422';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = active ? '#ffd34a' : '#3a3046';
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    Font.draw(ctx, r.label, r.x + r.w / 2, r.y + 4, { align: 'center', color: active ? '#ffd34a' : '#b9b4a6', shadow: null });
  });
  if (game.state === 'upgrades') drawUpgradesTab(ctx, game);
  else if (game.state === 'achievements') drawAchievementsTab(ctx, game);
  else if (game.state === 'stats') drawStatsTab(ctx, game);
  else drawOptions(ctx, game);
}

// ---------- Upgrades (Gold) ----------

function metaRowRects() {
  return META.upgrades.map((u, i) => {
    const row = { x: 20, y: 34 + i * 25, w: W - 40, h: 22 };
    return { row, buy: { x: row.x + row.w - 82, y: row.y + 4, w: 76, h: 14 } };
  });
}

function drawUpgradesTab(ctx, game) {
  drawSprite(ctx, SPR.coin, W - 14, 13);
  Font.draw(ctx, fmtNum(Records.gold), W - 20, 11, { align: 'right', color: '#ffd34a' });
  const rows = metaRowRects();
  META.upgrades.forEach((u, i) => {
    const { row, buy } = rows[i];
    const lvl = Meta.level(u.id);
    const cost = Meta.cost(u.id);
    const flash = game.menuFlash && game.menuFlash.i === i && game.time - game.menuFlash.t < 0.4;
    ctx.fillStyle = flash ? '#3a3010' : '#1a1422';
    ctx.fillRect(row.x, row.y, row.w, row.h);
    ctx.strokeStyle = '#3a3046';
    ctx.strokeRect(row.x + 0.5, row.y + 0.5, row.w - 1, row.h - 1);
    drawSprite(ctx, u.icon ? STATS[u.icon].sprite : SPR.coin, row.x + 10, row.y + 11);
    Font.draw(ctx, u.name, row.x + 20, row.y + 4, { color: '#f1ede2', shadow: null });
    Font.draw(ctx, u.desc, row.x + 20, row.y + 13, { color: '#8b8a95', shadow: null });
    for (let k = 0; k < META.costs.length; k++) {
      ctx.fillStyle = k < lvl ? '#ffd34a' : '#3a3046';
      ctx.fillRect(row.x + 196 + k * 9, row.y + 8, 7, 6);
    }
    if (cost === null) {
      Font.draw(ctx, 'Max', buy.x + buy.w / 2, buy.y + 5, { align: 'center', color: '#9be05a', shadow: null });
    } else {
      const afford = Records.gold >= cost;
      drawButton(ctx, buy, `${cost} Gold`, { hover: afford && inRect(Input.mouse, buy), color: afford ? '#ffd34a' : '#3a3046', disabled: !afford });
    }
  });
}

// ---------- Erfolge ----------

function achievementRows() {
  return [0, 1, 2, 3].map((i) => {
    const row = { x: 16, y: 46 + i * 41, w: W - 32, h: 37 };
    return { row, btn: { x: row.x + row.w - 70, y: row.y + 20, w: 64, h: 13 } };
  });
}

// kleine Vorschau der Belohnung
const REWARD_PREVIEW = {
  goldShield: () => SKIN_SPR.goldShield, blueShirt: () => SKIN_SPR.blueShirt, goldSword: () => SKIN_SPR.goldSword,
  goldArrows: () => SKIN_SPR.goldArrow, goldBow: () => SKIN_SPR.goldBow, goldBook: () => SKIN_SPR.goldBook,
};

function drawAchievementsTab(ctx, game) {
  const cls = CLASS_ORDER[game.tab] || CLASS_ORDER[0];
  const rows = achievementRows();
  ACHIEVEMENTS[cls].forEach((a, i) => {
    const { row, btn } = rows[i];
    const done = achievementDone(cls, a);
    const prog = achievementProgress(cls, a);
    ctx.fillStyle = done ? '#1e1a10' : '#1a1422';
    ctx.fillRect(row.x, row.y, row.w, row.h);
    ctx.strokeStyle = done ? '#8a6a20' : '#3a3046';
    ctx.strokeRect(row.x + 0.5, row.y + 0.5, row.w - 1, row.h - 1);
    Font.draw(ctx, a.name, row.x + 6, row.y + 4, { color: done ? '#ffd34a' : a.locked ? '#5d5868' : '#f1ede2', shadow: null });
    Font.draw(ctx, a.desc, row.x + 6, row.y + 12, { color: a.locked ? '#5d5868' : '#b9b4a6', shadow: null });
    if (a.locked) {
      Font.draw(ctx, 'Kommt mit Ebene 3', row.x + 6, row.y + 25, { color: '#5d5868', shadow: null });
    } else {
      const bw = 150;
      drawBar(ctx, row.x + 7, row.y + 25, bw, 4, prog / a.goal, done ? '#ffd34a' : '#8b3dff');
      Font.draw(ctx, `${fmtNum(prog)} / ${fmtNum(a.goal)}`, row.x + bw + 14, row.y + 24, { color: '#8b8a95', shadow: null });
    }
    // Belohnung rechts
    Font.draw(ctx, `Belohnung: ${REWARDS[a.reward]}`, row.x + row.w - 6, row.y + 4, { align: 'right', color: done ? '#ffd34a' : '#8b8a95', shadow: null });
    const prev = REWARD_PREVIEW[a.reward];
    if (prev) drawSprite(ctx, prev(), btn.x - 14, btn.y + 6);
    if (done) {
      const on = Cosmetics.has(cls, a.reward);
      drawButton(ctx, btn, on ? 'Ablegen' : 'Anlegen', { hover: inRect(Input.mouse, btn), color: on ? '#9be05a' : '#ffd34a' });
    }
  });
}

// ---------- Statistik ----------

function drawStatsTab(ctx, game) {
  const scope = game.tab === 0 ? 'all' : CLASS_ORDER[game.tab - 1];
  const d = Tracker.of(scope);
  const colW = 118;
  const cols = [10, 133, 256];
  const lh = 7;
  const cursor = cols.map(() => 46);
  const head = (c, text) => {
    Font.draw(ctx, text, cols[c], cursor[c], { color: '#8b3dff', shadow: null });
    cursor[c] += lh + 2;
  };
  const line = (c, label, value, color = '#f1ede2') => {
    Font.draw(ctx, label, cols[c], cursor[c], { color: '#8b8a95', shadow: null });
    Font.draw(ctx, String(value), cols[c] + colW, cursor[c], { align: 'right', color, shadow: null });
    cursor[c] += lh;
  };
  const gap = (c) => { cursor[c] += 4; };

  head(0, 'Allgemein');
  line(0, 'Runs gespielt', fmtNum(d.runs));
  line(0, 'Siege', fmtNum(d.wins), '#9be05a');
  line(0, 'Tode', fmtNum(d.deaths));
  line(0, 'Abgebrochen', fmtNum(d.aborts));
  line(0, 'Spielzeit', fmtLong(d.playTime));
  line(0, 'Ebenen geschafft', fmtNum(d.stagesCleared));
  line(0, 'Gold verdient', fmtNum(d.goldEarned), '#ffd34a');
  if (scope === 'all') line(0, 'Gold ausgegeben', fmtNum(d.goldSpent), '#ffd34a');
  gap(0);
  head(0, 'Rekorde');
  line(0, 'Längster Run', fmtLong(d.best.time));
  line(0, 'Höchstes Level', d.best.level);
  line(0, 'Meiste Kills', fmtNum(d.best.kills));
  line(0, 'Meistes Gold', fmtNum(d.best.gold), '#ffd34a');
  line(0, 'Meiste Bosse', d.best.bosses);
  line(0, 'Schnellster Boss', d.best.fastestBoss ? fmtLong(d.best.fastestBoss) : '-');

  head(1, 'Kampf');
  line(1, 'Kills', fmtNum(d.kills));
  line(1, 'Fähigkeiten benutzt', fmtNum(d.abilities));
  line(1, 'Ults benutzt', fmtNum(d.ults));
  line(1, 'Bosse besiegt', fmtNum(d.bosses));
  line(1, 'Schaden gemacht', fmtNum(d.dmgDealt));
  line(1, 'Schaden erlitten', fmtNum(d.dmgTaken));
  line(1, 'Höchster Treffer', fmtNum(d.maxHit));
  line(1, 'Herzen gesammelt', fmtNum(d.hearts));
  gap(1);
  head(1, 'Kills pro Gegner');
  const kills = Object.entries(d.killsByType).sort((a, b) => b[1] - a[1]).slice(0, 7);
  if (!kills.length) line(1, 'Noch keine', '');
  kills.forEach(([name, n]) => line(1, name, fmtNum(n)));

  head(2, 'Builds');
  const stat = topEntry(d.statPicks);
  line(2, 'Top-Stat', stat ? stat[0] : '-');
  line(2, 'Rerolls benutzt', fmtNum(d.rerolls));
  const ab = topEntry(d.abilityPicks);
  line(2, 'Top-Fähigkeit', ab ? ab[0] : '-');
  if (d.bestBuild) {
    line(2, 'Bester Build', fmtLong(d.bestBuild.time), '#ffd34a');
    const st = Object.entries(d.bestBuild.stats).sort((a, b) => b[1] - a[1]);
    if (scope === 'all') line(2, '  Klasse', d.bestBuild.cls);
    st.slice(0, 5).forEach(([id, r]) => line(2, `  ${STATS[id] ? STATS[id].name : id}`, `Rang ${r}`));
  } else {
    line(2, 'Bester Build', '-');
  }
  gap(2);
  head(2, 'Tode');
  const deaths = Object.entries(d.deathsBy).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!deaths.length) line(2, 'Noch keine', '');
  deaths.forEach(([name, n]) => line(2, name, `${n}x`, '#ff8a8a'));

  Font.draw(ctx, 'Nur Runs ohne Dev-Modus zählen. Alles wird auf diesem PC gespeichert.', W / 2, H - 9, { align: 'center', color: '#3a3046', shadow: null });
}

// ---------- Optionen ----------

function optionsButtons() {
  const x = W / 2 + 10;
  return {
    key: { x, y: 52, w: 90, h: 16 }, // Taste für Auto-Schuss
    music: { x, y: 82, w: 120, h: 9 }, // Musik-Regler (anklicken oder ziehen)
    sfx: { x, y: 102, w: 120, h: 9 }, // Effekte-Regler
    mute: { x, y: 120, w: 90, h: 16 }, // Ton an / aus
    back: { x: (W - 110) / 2, y: 180, w: 110, h: 16 }, // Zurück
  };
}

function drawSlider(ctx, r, value, label) {
  Font.draw(ctx, label, r.x - 14, r.y + 2, { align: 'right', color: '#f1ede2' });
  ctx.fillStyle = '#1a1420';
  ctx.fillRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
  ctx.fillStyle = '#2a2230';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = inRect(Input.mouse, r) ? '#b07cff' : '#8b3dff';
  ctx.fillRect(r.x, r.y, Math.round(r.w * value), r.h);
  ctx.fillStyle = '#f1ede2';
  ctx.fillRect(r.x + Math.round(r.w * value) - 1, r.y - 2, 3, r.h + 4);
  Font.draw(ctx, `${Math.round(value * 100)} %`, r.x + r.w + 8, r.y + 2, { color: '#b9b4a6', shadow: null });
}

function drawOptions(ctx, game) {
  const o = optionsButtons();
  const keyBtn = o.key;
  const back = o.back;
  drawSlider(ctx, o.music, Settings.musicVol, 'Musik');
  drawSlider(ctx, o.sfx, Settings.sfxVol, 'Effekte');
  Font.draw(ctx, 'Ton', o.mute.x - 14, o.mute.y + 5, { align: 'right', color: '#f1ede2' });
  drawButton(ctx, o.mute, Settings.muted ? 'Aus' : 'An', { hover: inRect(Input.mouse, o.mute), color: Settings.muted ? '#d93a4a' : '#9be05a' });
  Font.draw(ctx, 'Auto-Schuss an / aus', keyBtn.x - 14, keyBtn.y + 5, { align: 'right', color: '#f1ede2' });
  const overKey = inRect(Input.mouse, keyBtn);
  ctx.fillStyle = game.rebinding ? '#3a2a55' : overKey ? '#2a2038' : '#1a1422';
  ctx.fillRect(keyBtn.x, keyBtn.y, keyBtn.w, keyBtn.h);
  ctx.strokeStyle = game.rebinding ? '#ffd34a' : '#8b3dff';
  ctx.strokeRect(keyBtn.x + 0.5, keyBtn.y + 0.5, keyBtn.w - 1, keyBtn.h - 1);
  const label = game.rebinding ? (Math.floor(game.time * 3) % 2 ? 'Taste drücken' : '') : Settings.keyLabel(Settings.autoFireKey);
  Font.draw(ctx, label, keyBtn.x + keyBtn.w / 2, keyBtn.y + 5, { align: 'center', color: game.rebinding ? '#ffd34a' : '#ffffff', shadow: null });

  const hint = game.rebinding ? 'Drück die neue Taste · ESC bricht ab' : 'Klick auf die Taste, um sie zu ändern (Standard: Q)';
  Font.draw(ctx, hint, W / 2, 148, { align: 'center', color: '#8b8a95', shadow: null });
  if (game.optionsMsg) Font.draw(ctx, game.optionsMsg, W / 2, 160, { align: 'center', color: game.optionsMsg === 'Gespeichert' ? '#7fe07f' : '#ff8a8a' });
  drawButton(ctx, back, 'Zurück (ESC)', { hover: inRect(Input.mouse, back) });
}

// ---------- Neue Erfolge (Tod und Sieg) ----------

function drawNewAchievements(ctx, game, y) {
  (game.newAchievements || []).slice(0, 3).forEach((a, i) => {
    Font.draw(ctx, `Erfolg: ${a.name} · ${REWARDS[a.reward]} freigeschaltet!`, W / 2, y + i * 9, { align: 'center', color: '#ffd34a' });
  });
}

// ---------- Sieg ----------

function drawVictory(ctx, game) {
  const s = game.lastClear;
  const p = game.player;
  ctx.fillStyle = 'rgba(20,14,4,0.85)';
  ctx.fillRect(0, 0, W, H);
  Font.draw(ctx, 'Sieg!', W / 2, 16, { align: 'center', scale: 5, color: '#ffd34a', shadow: '#3a2a08' });
  if (s.boss) Font.draw(ctx, `${s.boss} ist besiegt. Die Katakomben sind befreit.`, W / 2, 50, { align: 'center', color: '#f1ede2' });
  Font.draw(ctx, `${p.cls.name} · Level ${p.level} · Kills ${p.kills} · ${fmtLong(game.run.playTime)}`, W / 2, 62, { align: 'center', color: '#b9b4a6' });
  drawSprite(ctx, SPR.coin, W / 2 - 50, 77);
  Font.draw(ctx, `${game.bankedGold} Gold aus diesem Run gesichert`, W / 2 - 44, 75, { align: 'left', color: '#ffd34a' });
  Font.draw(ctx, 'Ebene 3 kommt bald ...', W / 2, 96, { align: 'center', scale: 2, color: '#8b3dff', shadow: '#2a1050' });
  Font.draw(ctx, 'Dein Held hat seine Reise beendet.', W / 2, 118, { align: 'center', color: '#8b8a95' });
  drawNewAchievements(ctx, game, 134);
  if (game.deadT > 1.5 && Math.floor(game.time * 2) % 2 === 0) {
    Font.draw(ctx, 'Klicken für das Hauptmenü', W / 2, 186, { align: 'center', color: '#ffd34a' });
  }
}
