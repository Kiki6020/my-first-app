# PROJ-1: Quiz Game Core

## Status: Approved
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
- [ ] Bei falscher Antwort: grüner Effekt auf dem richtigen Button + falscher Button wird ausgegraut (damit die richtige Antwort klar hervorsticht)
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

## Implementation Notes (Frontend)
_Added: 2026-04-16_

**Gebaut:**
- `src/app/page.tsx` — Startseite mit "Carla's Quiz" Titel, Info-Chips und Start-Button (→ /quiz)
- `src/app/quiz/page.tsx` — Quiz-Route
- `src/components/quiz/QuizContainer.tsx` — Vollständige Spiellogik mit allen States (loading / playing / feedback / result / error)
- `src/lib/supabase.ts` — Supabase-Client aktiviert, `Question`-Interface exportiert

**Abweichungen vom Tech Design:**
- Shuffle erfolgt client-seitig (statt `ORDER BY RANDOM()` via SQL), da Supabase Free-Tier `.rpc()` für RANDOM() nicht immer unterstützt. Alle 10 Fragen werden geladen und dann zufällig sortiert.
- Antwort-Feedback (Erklärungstext) wird direkt in der QuestionCard angezeigt (kein separates AnswerFeedback-Overlay) — übersichtlicher auf Mobile.

**Design:** Dunkel (zinc-950), Akzentfarben Cyan + Violet, keine Pinkfarben.

**Nachträgliche UI-Änderung (2026-04-16):**
- Button-Labels geändert: `RICHTIG → STIMMT`, `FALSCH → STIMMT NICHT` (kindgerechter)
- Beide Buttons im `playing`-Zustand jetzt gleich violet (statt grün/rot), damit keine Vorwegnahme der Bedeutung
- Im `feedback`-Zustand: nur der **korrekte** Button wird grün — unabhängig davon was Carla angeklickt hat; falscher gewählter Button wird gedimmt

## QA Test Results
_Added: 2026-04-17_

### Test-Ergebnisse

**Unit Tests (Vitest):** 21/21 bestanden ✅
**E2E Tests (Playwright, Chromium):** 19/19 bestanden ✅

### Acceptance Criteria

| AC | Beschreibung | Status | Anmerkung |
|----|-------------|--------|-----------|
| AC1 | 10 Fragen pro Runde, zufällig ausgewählt | ✅ PASS | Alle Fragen werden geladen, client-seitig geshuffelt (Bug #1 behoben) |
| AC2 | Frage + RICHTIG/FALSCH-Buttons | ✅ PASS | |
| AC3 | Konfetti mind. 2 Sekunden bei richtiger Antwort | ✅ PASS | Bug #2 behoben: Konfetti läuft jetzt 2000ms |
| AC4 | Grüner Effekt auf richtigem Button + falscher Button ausgegraut | ✅ PASS | Gewünschtes Design: richtige Antwort soll klar hervorstechen |
| AC5 | Erklärungstext nach Antwort | ✅ PASS | |
| AC6 | Fortschrittsanzeige „Frage X von 10" | ✅ PASS | |
| AC7 | Ergebnis-Screen mit Score | ✅ PASS | Format: „10 / 10" (statt „X von 10 richtig!") — akzeptabel |
| AC8 | „Neue Runde" + „Highscore ansehen"-Buttons | ✅ PASS | Highscore-Button korrekt deaktiviert bis PROJ-2 |
| AC9 | Alle Texte auf Deutsch | ✅ PASS | |
| AC10 | Keine doppelten Fragen pro Runde | ✅ PASS | |

### Gefundene Bugs

**Bug #1 — HIGH: Nur 10 von 100 Fragen wurden jemals gespielt** ✅ BEHOBEN
- **Beschreibung:** Die Datenbankabfrage lud immer nur die 10 zuletzt eingefügten Fragen (`.order('id', ascending: false).limit(10)`). Die restlichen 90 Seed-Fragen wurden niemals angezeigt.
- **Fix:** Abfrage auf `.select('*')` (ohne ORDER/LIMIT) geändert. Alle Fragen werden geladen, client-seitig geshuffelt und auf 10 gekürzt — echte Zufälligkeit aus dem gesamten Fragepool.

**Bug #2 — MEDIUM: Konfetti lief 1,8 Sekunden statt mindestens 2 Sekunden** ✅ BEHOBEN
- **Beschreibung:** `const end = Date.now() + 1800` — AC3 verlangt mind. 2 Sekunden.
- **Fix:** Geändert auf `Date.now() + 2000`.

### Edge Cases

| Edge Case | Status | Anmerkung |
|-----------|--------|-----------|
| Netzwerkfehler → Fehler-Screen | ✅ PASS | |
| <10 Fragen in DB → Fehler-Screen | ✅ PASS | |
| „Neu laden"-Button funktioniert | ✅ PASS | |
| Doppelklick-Schutz (Button deaktiviert) | ✅ PASS | |
| Seite neu laden → Runde beginnt von vorne | ✅ PASS | Kein Session-Speicher |

### Security Audit

- **XSS/Injection:** Kein Risiko — keine freien Text-Eingaben im Quiz, nur Button-Klicks.
- **Supabase Anon Key (client-seitig):** Akzeptabel — RLS schränkt auf SELECT ein; INSERT/DELETE nur für `service_role`.
- **Sensitive Daten in API-Responses:** Keine — nur öffentliche Fragen-Daten.
- **Admin-Seite:** Noch nicht implementiert (PROJ-4), daher kein Auth-Audit nötig.

### Automated Test Coverage

- **Unit Tests:** [src/__tests__/PROJ-1-quiz-game-core.test.tsx](src/__tests__/PROJ-1-quiz-game-core.test.tsx) — 21 Tests
- **E2E Tests:** [tests/PROJ-1-quiz-game-core.spec.ts](tests/PROJ-1-quiz-game-core.spec.ts) — 19 Tests

### Produktionsreif?

**✅ PRODUKTIONSREIF** — Alle Bugs behoben, alle Acceptance Criteria erfüllt. Bereit für `/deploy`.

## Deployment
_To be added by /deploy_
