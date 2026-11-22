# Soulgrind – bisheriger Verlauf und Entscheidungen

Zusammenfassung der ersten Sitzung (20.11.2026), damit neue Sitzungen den Hintergrund kennen.
Neue wichtige Entscheidungen bitte unten ergänzen.

## Die Idee
- Pixel-Action-RPG, inspiriert vom Prinzip klassischer Bullet-Hell-Grinder: grinden, leveln, sterben.
- **Permadeath:** Stirbt der Held, ist er weg. Dafür soll es später **Prestige-Punkte** geben (noch nicht gebaut).
- Name „Soulgrind“ hat der Nutzer aus mehreren Vorschlägen gewählt.
- Später sollen **Attribute** kommen (darum hat der Schild keinen passiven Schutz bekommen).

## Arbeitsweise des Nutzers
- Spricht Deutsch, vibecodet, kein Profi. Kurz und verständlich erklären.
- Bei größeren Features gern **erst einen Plan zeigen**, dann bauen.
- Nach fertigen Features meist direkt **committen, pushen und ein Release** erstellen.
- Testet das Spielgefühl selbst; automatische Tests prüfen nur die Funktion.
- Ein Freund spielt über den Launcher mit. Deshalb sind **beide Repos öffentlich** (kein Token nötig).
- Arbeitet ab jetzt am **Heim-PC** (Projekte unter `%USERPROFILE%\Projekte`, nicht auf dem OneDrive-Desktop).

## Launcher „Spielhalle“ (Repo lysoqa/spielhalle)
- Vorbild war der Launcher der Kollegen des Nutzers: Spiele-Regal mit Kacheln, große Versionsnummer, Patch Notes aus GitHub Releases.
- **v0.1.0:** Grundversion (Regal, Installieren/Updaten aus Releases, Spielzeit, Einstellungen mit verschlüsseltem Token).
- **v0.2.0:** Soulgrind kommt aus eigenem Repo; nur bei `npm start` direkt aus `../Soulgrind-Game`. Klare Meldung, wenn ein privates Repo einen Token braucht.
- Installer ist nicht signiert (SmartScreen-Warnung beim Installieren ist normal).

## Spiel Soulgrind (Repo lysoqa/soulgrind)
- **v0.1.0:** Klassenwahl (Krieger, Schütze, Magier), Gegner Zombie (ersetzt den ursprünglich geplanten Schleim), Fledermaus, Skelett-Schütze, XP und Level bis 20, Todesbildschirm.
- **v0.2.0:**
  - Bugfix: Fledermäuse blieben im Helden stecken und waren unverwundbar. Lösung: Gegner werden aus dem Helden geschoben, prallen nach Treffern zurück, und Gegner, die den Helden berühren, werden von jedem Schuss getroffen („Nahschuss“).
  - Weniger XP pro Gegner, steilere Level-Kurve.
  - Stat-Auswahl bei jedem Level-Up (1 aus 3, max. Rang 5, max. 5 verschiedene Stats, 2 Rerolls pro Run).
  - Rundentimer; mit der Zeit mehr und stärkere Gegner. Mini-Boss alle 3 Minuten **ohne Ankündigung**.
- **v0.3.0:**
  - 2 Fähigkeiten pro Klasse (Rechtsklick), Auswahl nach der Klassenwahl mit Erklärung und Abklingzeit.
    Krieger: Schildblock 5 s / Wirbelschlag 6 s (selbst gewählt: 120 % Schaden).
    Schütze: Hechtsprung 5 s (kurz unverwundbar) / Fächerschuss 4 s.
    Magier: Teleport zum Cursor, max. 110 px, 10 s / Bannkreis 6 s (3 s Stun, Bosse 1,5 s, 50 % Schaden).
  - Neuer seltener Gegner Echse: bleibt stehen, rote Warnlinie, dann ausweichbarer Strahl.
  - ESC-Menü: Weiter / Run abbrechen.

- **v0.4.0 (21.11.2026), Ebenen und Auto-Schuss:**
  - **Auto-Schuss:** Q schaltet ihn an/aus, für alle Klassen, gezielt wird weiter mit der Maus. Die Einstellung bleibt gespeichert.
  - **Ebene 1 (Wald)** dauert 10 Minuten (ab 0.4.1: **5 Minuten**, Wunsch des Nutzers). Bei Ablauf bleibt der Timer stehen, es kommen keine neuen Gegner mehr. Erst wenn alle übrigen Gegner tot sind, erscheint der Boss **Volghard** etwas entfernt vom Helden, mit Name und Lebensleiste.
  - **Volghard:** Naturbaum, langsam, schießt Dornen (abwechselnd rundum und als gezielter Fächer, mit kurzem Zittern als Warnung) und lässt wenige Dornenpflanzen wachsen (höchstens 3). Pflanzen stehen fest, schießen und lassen sich zerstören. Ein zusätzlicher „Sofort-töten-Ansturm“ stand nur versehentlich in der Idee und wird **nicht** gebaut.
  - Nach dem Sieg erscheint „Ebene geschafft“. Der gleiche Held geht mit Level und Stats in Ebene 2, sein Leben wird aufgefüllt. Timer, Gegnerdichte und Mini-Boss-Takt starten neu, die Gegner sind 2 Level stärker als in Ebene 1 und werden wieder mit der Zeit stärker.
  - **Ebene 2 (Steinebene):** Steinboden, Trolle statt Zombies. Kleine Steinsäulen wachsen in 3 Stufen aus dem Boden (Spitze, fast oben, oben). Erst wenn sie ganz oben sind, blocken sie Held und Gegner und bremsen den Helden im Umkreis. Sie erscheinen nicht direkt am Helden und versinken nach einer Weile wieder. Gegner rutschen an Säulen vorbei. Ebene 2 läuft vorerst endlos, ein Boss für sie kommt später.
  - Alle Werte stehen in `js/stages.js`.

- **v0.4.1:** Ebene 1 dauert 5 statt 10 Minuten.
- **v0.5.0 (21.11.2026), Ults, Spielstände, Dev-Modus:**
  - Volghard stärker (mehr Leben und Schaden, schnellere Salven). Mehr Pflanzen (bis 5, alle 7 s), die schneller und mit schnelleren Geschossen schießen und **vergiften**: 5 Schaden pro Treffer + 1 pro Sekunde für 5 s, nicht stapelbar. Gift-Schaden ist bewusst fest (wächst nicht mit dem Level).
  - Skelette ab 2:00 halb so oft (Im-Kreis-Laufen ist das Gegenmittel, aber später schossen zu viele).
  - Alle Prozent-Stats +1 % pro Rang (Erholung unverändert, weil kein Prozentwert).
  - **Ults auf R**, alle 5 s lang, laden pro Kill (während die Ult läuft, lädt sie nicht). Krieger Wirbelsturm 4 %/Kill (läuft durch Gegner, -80 % Schaden auch gegen Gift), Schütze Pfeilrausch 3 %/Kill (+50 % Lauftempo, doppeltes Angriffstempo, Pfeile durchbohren 5), Magier Feuerbrand 4 %/Kill (Zone am Cursor). Erklärung samt Kills bis voll steht bei der Fähigkeitswahl.
  - **Spielstände** pro Klasse auf den Klassenkarten: beste Zeit pro Ebene (grün = geschafft) und Kills, unten Kills gesamt. Gespeichert im localStorage des Spiels, bleibt über Updates erhalten.
  - **Developer-Modus** (F1) nur aus dem Projektordner `Soulgrind-Game`, nicht in installierten Versionen. Kann Ebene springen, Timer vor Boss setzen, Level, Ult füllen, unverwundbar, alle Gegner töten. Dev-Runs zählen nicht für Spielstände.

- **v0.5.1 (Hotfix):** Krieger-Ult Wirbelsturm gibt zusätzlich +60 % Lauftempo.

- **v0.6.0 (22.11.2026), Menü, Gold, Upgrades:** (Patch Notes bewusst ohne Spoiler, Wunsch des Nutzers)
  - Hauptmenü mit Spielen / Upgrades (Coming Soon) / Erfolge (Coming Soon) / Optionen. In den Optionen lässt sich die Auto-Schuss-Taste ändern (Standard Q). Nach Tod oder Abbruch geht es zurück ins Hauptmenü.
  - **Gold** (für die späteren Upgrades im Menü): 50 % Chance auf 1 Gold pro Gegner, Mini-Boss 10, Volghard 25. Wird mit Magnet eingesammelt. Erst beim Schaffen einer Ebene gesichert. Stirbt man in Ebene 2, bleibt nur das Gold aus Ebene 1. Pflanzen geben bewusst kein Gold (Volghard macht ständig neue). Dev-Runs speichern kein Gold.
  - **Herzen:** 8 % pro Gegner (nicht von Bossen), +20 Leben, liegen 15 s.
  - **Fledermaus-Schwarm:** ab 45 s alle 25 bis 45 s, 6 bis 9 Stück, fliegen geradeaus durch, 1 Treffer, 30 % XP, wenig Kontaktschaden (jede höchstens einmal).
  - **Krieger-Balance gegen Skelette:** Skelette weichen mit 50 % Tempo zurück. Schildblock und Wirbelschlag werfen Geschosse zurück (Schaden wie ein Schwerthieb).
  - **Säulen:** erscheinen im Sichtfeld, 1 s pro Animationsstufe.
  - **Upgrade-Wahl nach Ebene 1:** Fähigkeit ODER Ult. Spiegelschild (2 s, doppelter Rückwurfschaden, unverwundbar), Sturmwalze (Tornado zum Cursor, verlangsamt), Feuersturm (+20 % Tempo, Feuerspur mit Brand), Rankenpfad (8 s Bremsfeld für Gegner), Frostfächer (Fächer + nächste 3 Schüsse frieren 3 s ein), Windläufer (Geschosse treffen nicht, schneller schießen), Arkansprung (7,5 s CD, 8 Kugeln bei Start und Ziel), Doppelbann (zweiter Bann am Cursor), Meteor (8-facher Schaden in der Feuerzone, auch an Bossen).

## Offene Punkte und Ideen
- **Menü-Upgrades für Gold** und **Erfolge** sind als „Coming Soon“ im Hauptmenü, noch nicht gebaut.
- **Boss für Ebene 2** fehlt noch (der Nutzer liefert die Idee).
- **Erholung** (+0,1 Leben/s pro Rang, wie vom Nutzer vorgegeben) ist sehr schwach, weil es zusätzlich eine Grund-Regeneration gibt (2 % Leben/s nach 4 s ohne Treffer). Noch nicht entschieden, ob die Grund-Regeneration wegfällt oder Erholung stärker wird.
- Als Nächstes vorgeschlagen: ein paar Runden spielen und Balance notieren, dann **Prestige-Punkte**, danach **Loot**.
- Mögliche Launcher-Erweiterung: Selbst-Update des Launchers.
- Selbst gewählte Werte (vom Nutzer nicht vorgegeben) dürfen jederzeit angepasst werden: Wirbelschlag-Abklingzeit/Schaden, Boss-Stärke, Spawn-Raten, XP-Kurve.
