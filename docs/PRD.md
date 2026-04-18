# Product Requirements Document

## Vision
Ein spielerisches Fun Facts Quiz für Kinder im Volksschulalter (ca. 6–10 Jahre). Kinder beantworten Richtig/Falsch-Fragen zu spannenden Fakten aus Natur, Tiere, Weltraum und mehr. Durch Gamification-Elemente wie Konfetti, Streak-Counter und Highscore-Listen macht das Lernen neuer Fakten Spaß.

## Target Users

**Primär: Carla und ihre Freunde/Geschwister (6–10 Jahre)**
- Spielen das Quiz zum Spaß und zum Lernen
- Wollen Punkte sammeln und mit anderen vergleichen
- Brauchen einfache Bedienung ohne Login (nur Spitzname)

**Sekundär: Eltern / Betreiber**
- Wollen neue Fragen hinzufügen (CSV/JSON-Import)
- Wollen sicherstellen, dass die Fragen kindgerecht sind

## Core Features (Roadmap)

| Priorität | Feature | Status |
|-----------|---------|--------|
| P0 (MVP) | Quiz Game Core (Richtig/Falsch, 10 Runden, Konfetti, Antwort-Feedback) | Deployed |
| P0 (MVP) | Nickname & Highscore-System (Spitzname, Score speichern, Rangliste) | Deployed |
| P0 (MVP) | Streak-Counter (Trommelwirbel-Animation bei Treffer-Serien) | Deployed |
| P0 (MVP) | Fragen-Import (CSV/JSON Upload für neue Fragen + 100 Seed-Fragen) | Deployed |
| P1 | Kategorien & Badges (7 Themen, Kategorie-Meister-Badge pro Spitzname) | Planned |

## Success Metrics
- Carla spielt das Quiz mehrmals täglich
- Highscore-Liste wird aktiv genutzt (mind. 3 verschiedene Spitznamen)
- Neue Fragen können ohne technisches Wissen importiert werden
- 0 kritische Bugs im Produktivbetrieb

## Constraints
- Kleines Projekt für den Heimgebrauch
- Betreiber (Eltern) haben wenig technisches Know-how → Admin-Funktion muss einfach sein
- App und alle Inhalte müssen auf Deutsch sein
- Geeignet für Kinder ab ca. 6 Jahren (einfache Sprache, große Schrift, bunte UI)

## Non-Goals
- Kein vollständiges Lernmanagementsystem
- Kein Eltern-Dashboard / Statistiken
- Keine Mehrsprachigkeit in der MVP-Version
- Keine In-App-Käufe oder Werbung
- Kein Multiplayer-Modus in Echtzeit

---

Funktionale Anforderungen werden in den Feature-Specs unter `/features/` detailliert.
