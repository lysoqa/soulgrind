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
| `js/settings.js` | Optionen (Taste für Auto-Schuss, Lautstärke Musik/Effekte, Ton aus), localStorage |
| `js/audio.js` | Soundeffekte (`SFX`), Musik (`MUSIC`) und kurze Melodien (`JINGLES`), alles im Code erzeugt (Web Audio API). `Sound.play('name')` für Effekte |
| `js/loot.js` | Gold, Herzen, Fledermaus-Schwarm, Boden-Effekte der Upgrades (Feuerspur, Rankenpfad, Meteor) |
| `js/projectiles.js` | Pfeile, Magiekugeln, Gegnerschüsse, Zurückwerfen, Eispfeile |
| `js/records.js` | Spielstände und Gesamt-Gold (localStorage) |
| `js/tracker.js` | Statistik (pro Run gesammelt in `game.run`, am Run-Ende eingetragen) |
| `js/achievements.js` | Erfolge, Belohnungen, Skins (umgefärbte Sprites) |
| `js/meta.js` | Gold-Upgrades aus dem Menü (Preise, Stufen) |
| `js/hud.js` | HUD und Spiel-Bildschirme (Auswahl, Stat-Wahl, Pause, Tod, Ebene geschafft) |
| `js/menus.js` | Hauptmenü, Upgrades, Erfolge, Statistik, Optionen, Siegbildschirm |
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
- **Ebenen:** Ebene 1 (Wald) 5 Min., dann Timer-Stopp, Rest besiegen, Boss Volghard (toter, düsterer Baum, Dornen, Pflanzen). Danach „Ebene geschafft“ mit Upgrade-Wahl, gleicher Held in Ebene 2 **Katakomben** (7 Min.): Trolle statt Zombies, Skelett-Plätze halb Ratten (Giftspucke 2/s für 5 s), halb Wichte (springen zu), etwas weniger Fledermäuse, animierte Steinsäulen im Bild. Boss **El'Matho, König der Trolle** (Bodenstampfer mit Warnkreis, Felswurf mit Schatten, ruft Trolle, Wut ab 50 %). Danach Sieg und zurück ins Menü. Ebene 3 kommt später.
- **Gold-Upgrades (Menü):** 7 Upgrades, je 5 Stufen, Preise 25/50/100/175/300.
- **Erfolge:** pro Klasse 4 (Spezial-Zähler 250, 5000 Kills, 10000 Kills, Boss Ebene 3 noch gesperrt). Belohnungen = Skins, im Erfolge-Tab an-/ablegbar.
- **Statistik:** Reiter Insgesamt + jede Klasse. Lokal gespeichert. Online-Rangliste ist für ein eigenes späteres Update geplant (braucht einen Online-Speicher, z. B. Supabase, den der Nutzer anlegt).
- **Discord-Link** im Hauptmenü: https://discord.gg/ad2RtwyGyv (der Launcher öffnet Links ab Spielhalle 0.3.0 im Browser).
- **Sound:** Effekte und Chiptune-Musik werden im Code erzeugt, keine Sounddateien. Musik: Menü, Wald, Katakomben, Bosskampf. Melodien für Ebene geschafft, Sieg, Tod. Musik in Pause und Stat-Wahl leiser. `tools/sound-preview.html` zum Anhören (im normalen Browser öffnen).
- **Auto-Schuss:** Q schaltet an/aus (alle Klassen, Ziel = Maus). Taste im Optionen-Menü änderbar.
- **Hauptmenü:** Spielen / Upgrades / Erfolge / Statistik / Optionen, darunter der Discord-Link.
- **Gold:** 20 % Chance auf 1 Gold pro Gegner, Mini-Boss 10, Volghard 25. Hinlaufen zum Einsammeln (Magnet). Gold einer Ebene ist erst sicher, wenn die Ebene geschafft ist. Stirbt man vorher, ist das Gold dieser Ebene weg. Gesamt-Gold für alle Klassen, im Hauptmenü sichtbar.
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
