# PROJ-1: Quiz Game Core

## Status: Planned
**Created:** 2026-04-16
**Last Updated:** 2026-04-16

## Dependencies
- Keine (Basis-Feature)

## Beschreibung
Das Herzstück der App: Kinder spielen eine Runde mit 10 zufälligen Richtig/Falsch-Fragen aus der Datenbank. Bei richtiger Antwort gibt es eine Erfolgsanimation (Konfetti), bei falscher Antwort wird die korrekte Antwort hervorgehoben. Am Ende der Runde wird der erreichte Score angezeigt.

## User Stories

- Als Kind möchte ich eine Richtig/Falsch-Frage sehen, damit ich herausfinden kann, ob der Fun Fact stimmt.
- Als Kind möchte ich bei einer richtigen Antwort eine Konfetti-Animation sehen, damit ich mich über meinen Erfolg freue.
- Als Kind möchte ich bei einer falschen Antwort sehen, was die richtige Antwort war, damit ich es beim nächsten Mal besser weiß.
- Als Kind möchte ich nach 10 Fragen meinen Gesamtscore sehen, damit ich weiß wie gut ich war.
- Als Kind möchte ich nach der Runde eine neue Runde starten können, damit ich weiter spielen kann.
- Als Kind möchte ich wissen, bei welcher Frage ich bin (z.B. „Frage 3 von 10"), damit ich weiß wie weit ich bin.

## Acceptance Criteria

- [ ] Pro Runde werden exakt 10 Fragen aus der Datenbank zufällig ausgewählt
- [ ] Jede Frage zeigt den Fun Fact als Text und zwei Buttons: „RICHTIG" und „FALSCH"
- [ ] Bei richtiger Antwort: grüner Effekt auf dem geklickten Button + Konfetti-Animation (mind. 2 Sekunden sichtbar)
- [ ] Bei falscher Antwort: roter Effekt auf dem geklickten Button + grüner Rahmen auf dem richtigen Button
- [ ] Nach der Antwort wird kurz der Erklärungstext (Fact-Erklärung) angezeigt, bevor die nächste Frage kommt
- [ ] Ein Fortschrittsanzeiger zeigt „Frage X von 10"
- [ ] Am Ende: Ergebnis-Screen zeigt Score (z.B. „7 von 10 richtig!")
- [ ] Der Ergebnis-Screen hat einen Button „Neue Runde" und einen Button „Highscore ansehen"
- [ ] Alle Texte sind auf Deutsch
- [ ] Die gleiche Frage kommt in einer Runde nicht zweimal vor

## Edge Cases

- Was passiert, wenn weniger als 10 Fragen in der Datenbank sind? → Fehlermeldung anzeigen: „Zu wenig Fragen verfügbar. Bitte zuerst Fragen importieren."
- Was passiert bei einem Netzwerkfehler beim Laden der Fragen? → Fehler-Screen mit „Verbindungsproblem – bitte neu laden"
- Was passiert, wenn der Nutzer die Seite während einer Runde neu lädt? → Runde beginnt von vorne (kein Session-Speicher)
- Was passiert, wenn ein Kind versehentlich doppelt klickt? → Erste Antwort zählt, Button wird nach erstem Klick deaktiviert

## Technical Requirements
- Fragen werden aus Supabase geladen (Tabelle: `questions`)
- Zufällige Auswahl via SQL `ORDER BY RANDOM() LIMIT 10`
- Konfetti via npm-Paket (z.B. `canvas-confetti`)
- Animations-Übergang zwischen Fragen: ca. 300ms Fade
- Antwort-Buttons nach Klick sofort deaktivieren (kein Double-Submit)
- Mobile-first Design (Volksschulkinder nutzen oft Tablets)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_Added: 2026-04-16_

### Komponenten-Struktur

```
Quiz-Seite (/quiz)
+-- QuizContainer  (steuert den gesamten Spielablauf)
    |
    +-- [Zustand: Laden]
    |   +-- Lade-Spinner ("Fragen werden geladen…")
    |
    +-- [Zustand: Fehler]
    |   +-- FehlerScreen
    |       +-- Fehlermeldung (Netzwerk oder zu wenig Fragen)
    |       +-- "Neu laden"-Button
    |
    +-- [Zustand: Frage aktiv]
    |   +-- ProgressBar ("Frage 3 von 10")
    |   +-- QuestionCard
    |   |   +-- Fun-Fact-Text (groß, gut lesbar)
    |   |   +-- RICHTIG-Button (grün)
    |   |   +-- FALSCH-Button (rot)
    |   +-- AnswerFeedback (erscheint nach Klick, ~2 Sek.)
    |   |   +-- Erklärungstext zum Fun Fact
    |   |   +-- Visuelles Feedback (grün = richtig / rot = falsch)
    |   +-- ConfettiOverlay (bei richtiger Antwort)
    |
    +-- [Zustand: Runde beendet]
        +-- ResultScreen
            +-- Score-Anzeige ("7 von 10 richtig!")
            +-- "Neue Runde starten"-Button
            +-- "Highscore ansehen"-Button (→ PROJ-2)
```

### Datenmodell

**Tabelle `questions` in Supabase:**

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | UUID | Eindeutige ID der Frage |
| `fact_text` | Text | Der Fun Fact, der angezeigt wird |
| `is_true` | Boolean | Ist der Fun Fact tatsächlich wahr? |
| `explanation` | Text | Kurze Erklärung nach der Antwort |
| `category` | Text | Thema (z.B. Tiere, Weltraum) – für PROJ-5 |
| `created_at` | Timestamp | Wann die Frage hinzugefügt wurde |

**Spielzustand (nur im Browser, kein Persistenz):**

| Feld | Bedeutung |
|---|---|
| `questions[]` | Die 10 zufällig geladenen Fragen der aktuellen Runde |
| `currentIndex` | Welche Frage gerade angezeigt wird (0–9) |
| `answers[]` | Welche Antworten das Kind gegeben hat |
| `score` | Anzahl richtiger Antworten |
| `gamePhase` | `loading` / `playing` / `feedback` / `result` / `error` |

> Kein Session-Speicher: Seite neu laden = Runde beginnt von vorne.

### Tech-Entscheidungen

| Entscheidung | Gewählt | Warum |
|---|---|---|
| Datenspeicherung | Supabase (PostgreSQL) | Zentrale Datenhaltung für PROJ-4 (Fragen-Import) notwendig |
| Zufällige Auswahl | `ORDER BY RANDOM() LIMIT 10` via Supabase | Einfachste serverseitige Lösung, keine Client-Logik nötig |
| Spielzustand | React `useState` im QuizContainer | Kein komplexes State-Management nötig |
| Konfetti | `canvas-confetti` | Leichtgewichtig, bewährt, einfach einzusetzen |
| UI-Komponenten | shadcn/ui: Card, Button, Progress, Badge | Bereits installiert, konsistentes Design |
| Route | `/quiz` (Next.js App Router) | Klare Trennung vom Rest der App |
| Animationen | Tailwind CSS Transitions (~300ms) | Kein zusätzliches Paket nötig |

### Abhängigkeiten (npm)

| Paket | Zweck |
|---|---|
| `canvas-confetti` | Konfetti-Animation bei richtiger Antwort |
| `@types/canvas-confetti` | TypeScript-Typen dazu |
| `@supabase/supabase-js` | Datenbankanbindung (wahrscheinlich bereits installiert) |

### Seitenfluss

```
Start → Fragen laden (10 zufällige aus Supabase)
  → Fehler? → Fehler-Screen
  → Frage anzeigen → Kind klickt RICHTIG/FALSCH
  → Buttons deaktivieren → Feedback zeigen (~2 Sek.)
  → Richtig? → Konfetti
  → Nächste Frage … nach Frage 10 → Ergebnis-Screen
  → "Neue Runde" oder "Highscore ansehen"
```

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
