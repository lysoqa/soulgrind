// Die spielbaren Klassen. Hier lassen sich alle Werte zum Ausbalancieren anpassen.
// speed = Pixel pro Sekunde, cooldown = Sekunden zwischen zwei Angriffen,
// growth = Zuwachs pro Level (hp absolut, dmg als Anteil, 0.07 = +7 % Schaden pro Level).
// abilities = die zwei Fähigkeiten zur Auswahl (Rechtsklick), cooldown in Sekunden.
// upgrade = Verbesserung, die man nach Ebene 1 wählen kann (Fähigkeit ODER Ult).
const CLASSES = {
  warrior: {
    id: 'warrior',
    name: 'Krieger',
    gear: 'Schwert + Schild',
    sprite: 'warrior',
    hp: 150,
    speed: 50,
    attack: 'melee',
    damage: [22, 30],
    cooldown: 0.45,
    range: 24, // Reichweite des Schwerthiebs
    arc: Math.PI * 0.8, // Breite des Hiebs (Halbkreis vor dir)
    knockback: 8,
    growth: { hp: 18, dmg: 0.07 },
    pips: { Leben: 5, Schaden: 4, Tempo: 3, Reichweite: 1 },
    hint: 'Linksklick: Schwerthieb im Halbkreis vor dir',
    abilities: [
      {
        id: 'block', name: 'Schildblock', cooldown: 5,
        desc: 'Hebt den Schild und blockt 1,2 s lang jeden Schaden. Geschosse prallen zurück. Du läufst langsamer und greifst nicht an.',
        duration: 1.2, slow: 0.45,
        reflectFactor: 1, // zurückgeworfene Geschosse: Schaden wie ein Schwerthieb
        upgrade: {
          name: 'Spiegelschild', duration: 2, reflectFactor: 2,
          desc: 'Hält 2 s statt 1,2 s. Zurückgeworfene Geschosse machen doppelten Schaden. Du bist dabei unverwundbar.',
        },
      },
      {
        id: 'whirl', name: 'Wirbelschlag', cooldown: 6,
        desc: 'Dreht sich einmal im Kreis und trifft alle Gegner rund um dich mit 120 % Schaden. Wirft Geschosse zurück.',
        radius: 28, dmgFactor: 1.2, knockback: 12, reflectFactor: 1,
        upgrade: {
          name: 'Sturmwalze',
          desc: 'Schickt zusätzlich einen großen Wirbelsturm zum Mauszeiger. Er rollt durch Gegner, macht viel Schaden und verlangsamt sie.',
          speed: 90, range: 170, radius: 10, dmgFactor: 1.6, slow: 0.5, slowTime: 2.5,
        },
      },
    ],
    // Ult (Taste R): lädt pro Kill auf, bei 100 % einsetzbar
    ult: {
      id: 'storm', name: 'Wirbelsturm', perKill: 0.04, duration: 5,
      desc: '5 s Dauer-Wirbelwind mit großer Reichweite. Du bist 60 % schneller, läufst durch Gegner und nimmst 80 % weniger Schaden.',
      radius: 38, tick: 0.25, dmgFactor: 0.5, knockback: 4, dmgTaken: 0.2, moveSpeed: 0.6, // +60 % Lauftempo
      upgrade: {
        name: 'Feuersturm', moveSpeed: 0.8, // zusammen +80 % Lauftempo
        desc: '20 % mehr Lauftempo. Beim Laufen hinterlässt du eine Feuerspur, die Gegner in Brand setzt.',
        trailEvery: 0.08, trailLife: 2, trailRadius: 7, burnTime: 2, burnTick: 0.5, burnFactor: 0.3,
      },
    },
  },
  archer: {
    id: 'archer',
    name: 'Schütze',
    gear: 'Bogen',
    sprite: 'archer',
    hp: 110,
    speed: 62,
    attack: 'arrow',
    damage: [20, 28],
    cooldown: 0.7,
    projSpeed: 230,
    range: 175,
    pierce: 2, // Pfeil trifft bis zu 2 Gegner
    knockback: 3,
    growth: { hp: 12, dmg: 0.07 },
    pips: { Leben: 3, Schaden: 3, Tempo: 5, Reichweite: 5 },
    hint: 'Linksklick: Pfeil · durchbohrt bis zu 2 Gegner',
    abilities: [
      {
        id: 'dash', name: 'Hechtsprung', cooldown: 5,
        desc: 'Kurzer Sprung in Laufrichtung. Während des Sprungs kannst du nicht getroffen werden.',
        distance: 55, time: 0.15, invuln: 0.3,
        upgrade: {
          name: 'Rankenpfad', life: 8, width: 9, slow: 0.35, // Gegner nur noch 35 % Tempo
          desc: 'Dein Sprung hinterlässt 8 s lang einen grünen Rankenpfad, der Gegner stark verlangsamt. Dich bremst er nicht.',
        },
      },
      {
        id: 'fan', name: 'Fächerschuss', cooldown: 4,
        desc: 'Schießt drei Pfeile gleichzeitig in einem Fächer nach vorne.',
        spread: 0.3,
        upgrade: {
          name: 'Frostfächer', iceShots: 3, freeze: 3,
          desc: 'Die 3 Pfeile und deine nächsten 3 Schüsse sind Eispfeile. Getroffene Gegner frieren 3 s ein (Bosse 1,5 s).',
        },
      },
    ],
    ult: {
      id: 'frenzy', name: 'Pfeilrausch', perKill: 0.03, duration: 5,
      desc: '5 s viel schneller laufen und schießen. Jeder Pfeil durchbohrt bis zu 5 Gegner.',
      moveSpeed: 0.5, attackSpeed: 1.0, pierce: 5, // +50 % Lauftempo, +100 % Angriffstempo
      upgrade: {
        name: 'Windläufer', attackSpeed: 1.6, projectileImmune: true,
        desc: 'Gegnerische Geschosse fliegen während der Ult durch dich hindurch, und du schießt noch schneller.',
      },
    },
  },
  mage: {
    id: 'mage',
    name: 'Magier',
    gear: 'Buch',
    sprite: 'mage',
    hp: 90,
    speed: 54,
    attack: 'orb',
    damage: [16, 22],
    cooldown: 0.9,
    projSpeed: 135,
    range: 130,
    aoe: 24, // Explosionsradius
    aoeFactor: 0.6, // Schaden an Gegnern in der Nähe
    knockback: 4,
    growth: { hp: 10, dmg: 0.08 },
    pips: { Leben: 2, Schaden: 4, Tempo: 3, Reichweite: 4 },
    hint: 'Linksklick: Magiekugel · explodiert und trifft Gegner in der Nähe',
    abilities: [
      {
        id: 'teleport', name: 'Teleport', cooldown: 10,
        desc: 'Teleportiert dich zum Mauszeiger. Mittlere Reichweite.',
        range: 110,
        upgrade: {
          name: 'Arkansprung', cooldown: 7.5, orbs: 8, orbDmg: 0.6, orbRange: 80, orbSpeed: 120,
          desc: 'Abklingzeit 7,5 s statt 10 s. Beim Verschwinden und Ankommen fliegen 8 kleine Magiekugeln rundherum los.',
        },
      },
      {
        id: 'stun', name: 'Bannkreis', cooldown: 6,
        desc: 'Hält alle Gegner um dich herum 3 s lang fest und macht etwas Schaden. Bosse nur 1,5 s.',
        radius: 55, stun: 3, dmgFactor: 0.5,
        upgrade: {
          name: 'Doppelbann',
          desc: 'Ein zweiter Bannkreis erscheint gleichzeitig am Mauszeiger.',
        },
      },
    ],
    ult: {
      id: 'firezone', name: 'Feuerbrand', perKill: 0.04, duration: 5,
      desc: 'Entfacht 5 s lang eine Feuerzone am Mauszeiger, die alle Gegner darin ständig verbrennt.',
      radius: 36, tick: 0.25, dmgFactor: 0.45,
      upgrade: {
        name: 'Meteor', delay: 1, dmgFactor: 8, // 8-facher Schaden, auch gegen Bosse
        desc: 'Kurz nach dem Zünden schlägt ein Meteor in die Feuerzone ein und macht riesigen Schaden, auch an Bossen.',
      },
    },
  },
};
const CLASS_ORDER = ['warrior', 'archer', 'mage'];

// Icons der Fähigkeiten (9x9 Pixel)
const ABILITY_ICONS = {
  block: SPR.shield,
  whirl: makeSprite([
    '..mmmmm..', '.m.....m.', 'm..yyy..m', 'm.y...y.m', 'm.y.b.y.m', 'm.y...y.m', 'm..yyy..m', '.m.....M.', '..mmmmM..',
  ]),
  dash: makeSprite([
    '.........', 'g...g....', '.g...g...', '..g...g..', '...g...g.', '..g...g..', '.g...g...', 'g...g....', '.........',
  ]),
  fan: makeSprite([
    'm...m...m', '.l..l..l.', '..l.l.l..', '...lll...', '....l....', '....l....', '...www...', '.........', '.........',
  ]),
  teleport: makeSprite([
    '....p....', '....p....', '..p.P.p..', '...PPP...', 'ppPPwPPpp', '...PPP...', '..p.P.p..', '....p....', '....p....',
  ]),
  stun: makeSprite([
    '..ccccc..', '.c.....c.', 'c..y.y..c', 'c...y...c', 'c..y.y..c', 'c.......c', '.c.....c.', '..ccccc..', '.........',
  ]),
  // Ults
  storm: makeSprite([
    '.m..m..m.', '..m.m.m..', 'm..yyy..m', '.my...ym.', 'mmy.b.ymm', '.my...ym.', 'm..yyy..m', '..m.m.m..', '.m..m..m.',
  ]),
  frenzy: makeSprite([
    'm.m.m....', '.lllllll.', 'm.m.m...m', '.......mm', 'm.m.m.mmm', '.......mm', 'm.m.m...m', '.lllllll.', 'm.m.m....',
  ]),
  firezone: makeSprite([
    '....y....', '...yry...', '..y.r.y..', '.yrrRrry.', 'yrRRyRRry', '.rRyyyRr.', '..rRRRr..', '.RRRRRRR.', '.........',
  ]),
};
