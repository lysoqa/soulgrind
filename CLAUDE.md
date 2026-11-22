# Soulgrind – Hinweise für Claude

Pixel-Action-RPG im Stil eines Bullet-Hell-Grinders: grinden, leveln, sterben, neu anfangen.
Der Nutzer vibecodet das Spiel, spricht Deutsch und ist kein Profi-Entwickler. Erklärungen kurz und verständlich halten, Antworten auf Deutsch.

**Hintergrund:** `VERLAUF.md` (in diesem Ordner) erklärt bisherige Entscheidungen, Versionen und offene Punkte. Zu Beginn lesen und bei wichtigen neuen Entscheidungen unten ergänzen.

## Projekt-Aufbau

Zwei Repos, lokal **nebeneinander** im selben Ordner:

| Ordner | Repo | Inhalt |
|---|---|---|
| `Soulgrind-Game` | `lysoqa/soulgrind` (öffentlich) | dieses Spiel |
| `Soulgrind` | `lysoqa/spielhalle` (öffentlich) | Electron-Launcher „Spielhalle“ |

Der Launcher startet das Spiel bei `npm start` direkt aus `../Soulgrind-Game`. Installiert holt er es aus den GitHub-Releases dieses Repos.

## Technik

- Reines JavaScript + Canvas, **keine Engine, kein Build-Schritt**. `index.html` lädt die Dateien in `js/` als klassische Scripts (gemeinsame globale Variablen, Reihenfolge in `index.html` beachten).
- Interne Auflösung 384×216, ganzzahlig hochskaliert. `ctx.imageSmoothingEnabled = false`, alles auf ganze Pixel runden.
- Sprites sind Pixel-Raster aus Zeichen (`makeSprite` in `sprites.js`, Farben in `PAL`). Alle Figuren schauen nach rechts und werden gespiegelt.
- Eigene 3×5-Pixelschrift in `font.js` (nur Großbuchstaben, Umlaute Ä Ö Ü, `Font.wrap` für Zeilenumbruch). Fehlende Zeichen dort ergänzen.

| Datei | Inhalt |
|---|---|
| `js/classes.js` | Klassen, ihre 2 Fähigkeiten und ihre Ult (alle Balance-Werte) |
| `js/stats.js` | Stats für die Level-Up-Auswahl |
| `js/player.js` | Held: Bewegung, Angriffe, Fähigkeiten, XP-Kurve |
| `js/enemies.js` | Gegnertypen, Mini-Bosse, Spawns |
| `js/stages.js` | Ebenen, Boss Volghard, Pflanzen, Trolle, Steinsäulen, Steinboden (alle Ebenen-Werte) |
| `js/settings.js` | Optionen (Taste für Auto-Schuss), localStorage |
| `js/loot.js` | Gold, Herzen, Fledermaus-Schwarm, Boden-Effekte der Upgrades (Feuerspur, Rankenpfad, Meteor) |
| `js/projectiles.js` | Pfeile, Magiekugeln, Gegnerschüsse, Zurückwerfen, Eispfeile |
| `js/records.js` | Spielstände (localStorage) |
| `js/hud.js` | HUD und alle Bildschirme (Auswahl, Stat-Wahl, Pause, Tod) |
| `js/main.js` | Spielschleife, Zustände, `GAME_VERSION` |

## Spielregeln (vom Nutzer festgelegt)

- **Permadeath:** Tod = Held weg. Prestige-Punkte für tote Helden sind geplant, aber noch nicht gebaut.
- **Klassen:** Krieger (Schwert + Schild, Nahkampf), Schütze (Bogen), Magier (Buch, Magie mit Flächenschaden). Schütze und Magier dürfen nicht zu schnell schießen.
- **Fähigkeiten (Rechtsklick):** pro Klasse 2, Auswahl nach der Klassenwahl mit Beschreibung und Abklingzeit.
  Krieger: Schildblock 5 s / Wirbelschlag 6 s. Schütze: Hechtsprung (kurz unverwundbar) 5 s / Fächerschuss 4 s. Magier: Teleport zum Cursor (begrenzt) 10 s / Bannkreis (3 s Stun, wenig Schaden) 6 s.
- **Säulen (Ebene 2):** erscheinen im Sichtfeld (plus Rand), 1 s pro Animationsstufe, damit man sie kommen sieht.
- **Level:** max. 20, XP-Bedarf steigt stark. Bei jedem Level-Up 1 von 3 Stats wählen.
- **Stats:** max. Rang 5 pro Stat, max. 5 verschiedene Stats pro Run, 2 Rerolls pro Run.
  Schaden +3 %, Rüstung -3 % Schaden, Max. Leben +8 %, Erholung +0,1 HP/s, Geschosstempo +6 %, Lauftempo +3 %, Mehr XP +3 %, Angriffstempo +3 % (pro Rang).
- **Ults (Taste R):** laden pro Kill auf, bei 100 % einsetzbar, je 5 s. Krieger: Wirbelsturm (Dauer-Wirbelwind, größere Reichweite, +60 % Lauftempo, durch Gegner laufen, -80 % Schaden aus allen Quellen), 4 %/Kill. Schütze: Pfeilrausch (viel Lauf- und Angriffstempo, Pfeile durchbohren 5 Gegner), 3 %/Kill. Magier: Feuerbrand (Feuerzone am Mauszeiger, Dauerschaden), 4 %/Kill. Ult wird bei der Fähigkeitswahl erklärt.
- **Gift (Dornenpflanzen):** 5 Schaden pro Treffer + 1 pro Sekunde für 5 s, stapelt sich nicht (neuer Treffer startet die Dauer neu).
- **Skelette** ab 2:00 Rundenzeit seltener.
- **Spielstände:** pro Klasse beste Zeit pro Ebene (grün = geschafft) und Kills, im Startmenü. Runs mit Dev-Modus zählen nicht.
- **Developer-Modus:** F1 im Spiel, nur wenn das Spiel aus dem Ordner `Soulgrind-Game` läuft (nicht in installierten Versionen).
- **Gegner:** Zombie, Fledermaus, Skelett-Schütze, Echse (selten, bleibt stehen, Warnlinie, ausweichbarer Strahl).
- **Rundentimer:** je länger, desto mehr Gegner. Alle 3 Minuten ein Mini-Boss **ohne Ankündigung**, nur größer und stärker.
- **Ebenen:** Ebene 1 (Wald) 5 Min., dann Timer-Stopp, Rest besiegen, Boss Volghard (Naturbaum, Dornen, wenige Pflanzen). Danach „Ebene geschafft“, gleicher Held in Ebene 2 (Steinebene: Trolle statt Zombies, animierte Steinsäulen mit Bremse und Bodyblock). Ebene 2 vorerst endlos.
- **Auto-Schuss:** Q schaltet an/aus (alle Klassen, Ziel = Maus). Taste im Optionen-Menü änderbar.
- **Hauptmenü:** Spielen / Upgrades (Coming Soon, nicht klickbar) / Erfolge (Coming Soon, nicht klickbar) / Optionen.
- **Gold:** 50 % Chance auf 1 Gold pro Gegner, Mini-Boss 10, Volghard 25. Hinlaufen zum Einsammeln (Magnet). Gold einer Ebene ist erst sicher, wenn die Ebene geschafft ist. Stirbt man vorher, ist das Gold dieser Ebene weg. Gesamt-Gold für alle Klassen, im Hauptmenü sichtbar.
- **Herzen:** 8 % pro Gegner, heilen 20, liegen 15 s.
- **Fledermaus-Schwarm:** selten, 6 bis 9 Fledermäuse fliegen schnell geradeaus durch, sterben mit einem Treffer, wenig XP, wenig Schaden.
- **Krieger:** Schildblock und Wirbelschlag werfen gegnerische Geschosse zurück.
- **Skelette** weichen nur mit 50 % Tempo zurück.
- **Upgrades nach Ebene 1:** Wahl zwischen Upgrade der gewählten Fähigkeit oder der Ult (Werte unter `upgrade` in `classes.js`). Krieger: Spiegelschild / Sturmwalze / Feuersturm. Schütze: Rankenpfad / Frostfächer / Windläufer. Magier: Arkansprung / Doppelbann / Meteor.
- ESC-Menü: Weiter / Run abbrechen.

## Releases

1. `GAME_VERSION` in `js/main.js` erhöhen und committen.
2. `.\release.ps1 <version> -NotesFile <datei.md>`. Das Skript prüft Version und sauberen Working Tree, packt die Zip (mit `/` als Pfadtrenner, nicht `Compress-Archive`), pusht und erstellt das GitHub-Release.
3. Patch Notes auf Deutsch, für Spieler geschrieben (Markdown).

## Testen

Automatisch über ein kleines Electron-Skript aus dem Launcher-Ordner (`..\Soulgrind\node_modules\electron\dist\electron.exe <testskript.js>`), das `index.html` lädt, per `executeJavaScript` Szenarien aufbaut (z. B. `game.start('mage', 1)`, Gegner setzen, `Input.rightPressed = true`) und mit `capturePage()` Screenshots macht. Code in `executeJavaScript` in `{ … }` einschließen, sonst kollidieren `const`-Namen zwischen Aufrufen. Ein Prozess-Timeout setzen, damit ein hängender Test kein Fenster offen lässt. Das Testfenster ist für den Nutzer sichtbar, kurz Bescheid sagen.

Der Nutzer testet das Spielgefühl selbst. Balance-Werte immer an einer Stelle bündeln und im Ergebnis sagen, wo sie stehen.

## Windows-Stolpersteine

- Nach einer Neuinstallation von Node/Git/gh kennt eine bereits offene Shell die Befehle nicht. PATH neu laden:
  `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`
- Windows PowerShell 5.1 zerlegt Argumente mit `"` falsch: Commit-Nachrichten mit Anführungszeichen über eine Datei übergeben (`git commit -F datei.txt`).
- `.ps1`-Dateien mit Umlauten als UTF-8 **mit BOM** speichern, sonst zeigt PowerShell 5.1 Umlaute falsch.
- Commits mit der GitHub-noreply-Adresse des Nutzers, nie mit einer privaten E-Mail. Vor dem ersten Commit `git config --local user.email` prüfen. Ist nichts gesetzt (z. B. auf einem anderen PC), in **beiden** Ordnern (`Soulgrind-Game` und `Soulgrind`) selbst einrichten:
  `git config --local user.name lysoqa` und `git config --local user.email 339582153+lysoqa@users.noreply.github.com`
