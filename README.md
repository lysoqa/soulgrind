# Soulgrind

Pixel-Action-RPG: grinden, leveln, sterben, neu anfangen.

## Spielen / Testen

- Im Launcher (Spielhalle) mit `npm start` startet Soulgrind direkt aus diesem Ordner.
- Oder `index.html` im Browser öffnen.

**Steuerung:** WASD laufen · Maus zielen · Linksklick angreifen · Rechtsklick blocken (Krieger) · ESC Pause

## Neues Update veröffentlichen

1. Änderungen committen
2. Release erstellen:

```powershell
.\release.ps1 0.2.0 "Was ist neu …"
```

Das Skript packt das Spiel als `.zip`, pusht und erstellt das GitHub-Release.
Der Launcher zeigt danach „Update auf 0.2.0“.

## Aufbau

| Datei | Inhalt |
|---|---|
| `js/classes.js` | Werte der Klassen (Krieger, Schütze, Magier) |
| `js/enemies.js` | Gegnertypen und Spawns |
| `js/player.js` | Bewegung, Angriffe, Level |
| `js/projectiles.js` | Pfeile, Magie, Gegnerschüsse |
| `js/sprites.js` | Pixel-Grafiken und Boden |
| `js/hud.js` | Anzeigen und Bildschirme |
| `js/font.js` | Pixel-Schrift |
| `js/input.js` | Tastatur und Maus |
| `js/main.js` | Spielschleife |
