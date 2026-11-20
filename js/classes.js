// Die spielbaren Klassen. Hier lassen sich alle Werte zum Ausbalancieren anpassen.
// speed = Pixel pro Sekunde, cooldown = Sekunden zwischen zwei Angriffen,
// growth = Zuwachs pro Level (hp absolut, dmg als Anteil, 0.07 = +7 % Schaden pro Level).
// abilities = die zwei Fähigkeiten zur Auswahl (Rechtsklick), cooldown in Sekunden.
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
        desc: 'Hebt den Schild und blockt 1,2 s lang jeden Schaden. Du läufst dabei langsamer und kannst nicht angreifen.',
        duration: 1.2, slow: 0.45,
      },
      {
        id: 'whirl', name: 'Wirbelschlag', cooldown: 6,
        desc: 'Dreht sich einmal im Kreis und trifft alle Gegner rund um dich mit 120 % Schaden.',
        radius: 28, dmgFactor: 1.2, knockback: 12,
      },
    ],
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
      },
      {
        id: 'fan', name: 'Fächerschuss', cooldown: 4,
        desc: 'Schießt drei Pfeile gleichzeitig in einem Fächer nach vorne.',
        spread: 0.3,
      },
    ],
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
      },
      {
        id: 'stun', name: 'Bannkreis', cooldown: 6,
        desc: 'Hält alle Gegner um dich herum 3 s lang fest und macht etwas Schaden. Bosse nur 1,5 s.',
        radius: 55, stun: 3, dmgFactor: 0.5,
      },
    ],
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
};
