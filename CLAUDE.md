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
| `js/classes.js` | Klassen und ihre 2 Fähigkeiten (alle Balance-Werte) |
| `js/stats.js` | Stats für die Level-Up-Auswahl |
| `js/player.js` | Held: Bewegung, Angriffe, Fähigkeiten, XP-Kurve |
| `js/enemies.js` | Gegnertypen, Mini-Bosse, Spawns |
| `js/projectiles.js` | Pfeile, Magiekugeln, Gegnerschüsse |
| `js/hud.js` | HUD und alle Bildschirme (Auswahl, Stat-Wahl, Pause, Tod) |
| `js/main.js` | Spielschleife, Zustände, `GAME_VERSION` |

## Spielregeln (vom Nutzer festgelegt)

- **Permadeath:** Tod = Held weg. Prestige-Punkte für tote Helden sind geplant, aber noch nicht gebaut.
- **Klassen:** Krieger (Schwert + Schild, Nahkampf), Schütze (Bogen), Magier (Buch, Magie mit Flächenschaden). Schütze und Magier dürfen nicht zu schnell schießen.
- **Fähigkeiten (Rechtsklick):** pro Klasse 2, Auswahl nach der Klassenwahl mit Beschreibung und Abklingzeit.
  Krieger: Schildblock 5 s / Wirbelschlag 6 s. Schütze: Hechtsprung (kurz unverwundbar) 5 s / Fächerschuss 4 s. Magier: Teleport zum Cursor (begrenzt) 10 s / Bannkreis (3 s Stun, wenig Schaden) 6 s.
- **Level:** max. 20, XP-Bedarf steigt stark. Bei jedem Level-Up 1 von 3 Stats wählen.
- **Stats:** max. Rang 5 pro Stat, max. 5 verschiedene Stats pro Run, 2 Rerolls pro Run.
  Schaden +2 %, Rüstung -2 % Schaden, Max. Leben +7 %, Erholung +0,1 HP/s, Geschosstempo +5 %, Lauftempo +2 %, Mehr XP +2 %, Angriffstempo +2 %.
- **Gegner:** Zombie, Fledermaus, Skelett-Schütze, Echse (selten, bleibt stehen, Warnlinie, ausweichbarer Strahl).
- **Rundentimer:** je länger, desto mehr Gegner. Alle 3 Minuten ein Mini-Boss **ohne Ankündigung**, nur größer und stärker.
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
