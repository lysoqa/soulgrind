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

## Offene Punkte und Ideen
- **Erholung** (+0,1 Leben/s pro Rang, wie vom Nutzer vorgegeben) ist sehr schwach, weil es zusätzlich eine Grund-Regeneration gibt (2 % Leben/s nach 4 s ohne Treffer). Noch nicht entschieden, ob die Grund-Regeneration wegfällt oder Erholung stärker wird.
- Als Nächstes vorgeschlagen: ein paar Runden spielen und Balance notieren, dann **Prestige-Punkte**, danach **Loot**.
- Mögliche Launcher-Erweiterung: Selbst-Update des Launchers.
- Selbst gewählte Werte (vom Nutzer nicht vorgegeben) dürfen jederzeit angepasst werden: Wirbelschlag-Abklingzeit/Schaden, Boss-Stärke, Spawn-Raten, XP-Kurve.
