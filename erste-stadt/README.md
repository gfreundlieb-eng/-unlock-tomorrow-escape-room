# Das Geheimnis der ersten Stadt

Browserbasiertes 3D-Escape-Game für den Geschichtsunterricht (Klasse 6, Realschule NRW):
von der Steinzeithöhle über vier Rätselkammern bis in die frühe Stadt Uruk in Mesopotamien.

- **Spielzeit:** ca. 30–35 Minuten (Unterrichtsstunde 67 Minuten)
- **Geräte:** iPads / Tablets (Touch), funktioniert auch am PC (Maus, WASD)
- **Stufen:** Entdecker und Experten
- **Ohne Installation, ohne Anmeldung, ohne Internet:** das ganze Spiel steckt in **einer** Datei: `index.html`
- **Lehrkraft-Übersicht** mit Lösungen, Zeitplan und Sicherung: [`lehrkraft.html`](lehrkraft.html) (druckbar)

## Starten

**Am einfachsten:** `index.html` herunterladen und im Browser öffnen (Doppelklick bzw. in Safari öffnen).

## Veröffentlichen

### GitHub Pages
1. Im Repository auf **Settings → Pages** gehen.
2. Unter „Build and deployment“ **Deploy from a branch** wählen, Branch `main` (bzw. den gewünschten Branch) und Ordner `/ (root)` auswählen, speichern.
3. Nach 1–2 Minuten ist das Spiel erreichbar unter
   `https://<benutzername>.github.io/<repository>/erste-stadt/`
   (die Lehrkraft-Übersicht unter `…/erste-stadt/lehrkraft.html` – diesen Link **nicht** an die Klasse geben).
4. Den Link als QR-Code oder Kurzlink an die Klasse geben.

### TaskCards
- **Variante A (empfohlen):** Den GitHub-Pages-Link als **Link-Karte** in die Pinnwand einfügen.
- **Variante B:** `index.html` als **Datei** an eine Karte anhängen. Die Lernenden laden die Datei herunter und öffnen sie im Browser (auf dem iPad: „Teilen“ → „In Safari öffnen“ bzw. über die Dateien-App).

## Für Entwickler

Quelltext in `src/`, gebaut wird mit Node.js:

```bash
node build.mjs                 # erzeugt index.html (three.js wird aus vendor/ eingebettet)
node test/playthrough.cjs      # spielt beide Stufen automatisch durch (Playwright + Chromium)
```

| Datei | Inhalt |
|---|---|
| `src/content.js` | alle Texte, Rätsel, Lösungen und Tipps (beide Stufen) |
| `src/scenes.js` | 3D-Welten: Höhle mit Tor, 4 Kammern, Uruk |
| `src/engine.js` | Touch-Steuerung, Bewegung, Interaktion, Zwischensequenzen |
| `src/puzzles.js` | Rätseltypen: Zuordnen, Reihenfolge, Tabelle, Lückentext, Auswahl, Zahlenschloss, Ausgrabung, Suche |
| `src/main.js` | Spielablauf, Fortschritt, Forscherbuch, Hilfesystem, Speichern |

Verwendet [three.js](https://threejs.org) r160 (MIT-Lizenz, `vendor/three-LICENSE.txt`). Alle Grafiken werden im Browser erzeugt; es gibt keine externen Abhängigkeiten zur Laufzeit.
