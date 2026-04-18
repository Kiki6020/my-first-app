# PROJ-3: Streak-Counter

## Status: Deployed
**Created:** 2026-04-16
**Last Updated:** 2026-04-18 (Deployed to production)

## Dependencies
- Requires: PROJ-1 (Quiz Game Core) — Streak wird während einer laufenden Runde gezählt

## Beschreibung
Ein Streak-Counter zählt wie viele Fragen das Kind hintereinander richtig beantwortet hat. Bei bestimmten Meilensteinen (3x, 5x, 10x) erscheint eine Trommelwirbel-Animation (🥁 Emoji mit Bounce-Effekt) zusammen mit einem selbst aufgenommenen Trommelwirbel-Sound. Der Counter wird zurückgesetzt, sobald eine falsche Antwort gegeben wird.

**Sounddatei:** Die Trommelwirbel-Aufnahme wird mit der iPhone-App „Sprachmemos" aufgenommen, als MP3 konvertiert und unter `public/sounds/trommelwirbel.mp3` im Projekt abgelegt.

## User Stories

- Als Kind möchte ich sehen wie viele Fragen ich hintereinander richtig hatte, damit ich motiviert bin weiterzumachen.
- Als Kind möchte ich bei einer langen Serie eine Trommelwirbel-Animation mit Sound sehen, damit ich mich besonders toll fühle.
- Als Kind möchte ich wissen wenn meine Serie endet, damit ich versuchen kann eine neue zu starten.
- Als Kind möchte ich den Trommelwirbel-Sound hören, damit das Erlebnis aufregender wirkt.

## Acceptance Criteria

- [ ] Ein Streak-Counter wird während einer laufenden Quiz-Runde angezeigt
- [ ] Der Counter erhöht sich bei jeder richtigen Antwort um 1
- [ ] Der Counter wird bei einer falschen Antwort auf 0 zurückgesetzt
- [ ] Bei Streak-Meilenstein 5 erscheint das 🥁 Emoji mit Bounce-Animation und Texten „Wow!" / „5 in Folge" und der Trommelwirbel-Sound ertönt
- [ ] Bei Streak-Meilenstein 10 erscheint das 🥁 Emoji mit maximaler Animation und Texten „Strike!" / „Alle richtig" und der Trommelwirbel-Sound ertönt
- [ ] Der Trommelwirbel-Sound (`public/sounds/trommelwirbel.mp3`) wird bei jedem Meilenstein abgespielt
- [ ] Der Sound wird nicht abgespielt, wenn der Browser keine Audiodatei finden kann (kein Fehler — stumme Fallback)
- [ ] Die Animation ist mind. 1,5 Sekunden sichtbar, blockiert aber nicht die nächste Frage
- [ ] Wenn die Streak endet, erscheint kurz ein neutraler Text „Serie beendet"
- [ ] Der Streak-Counter wird am Ende der Runde auf dem Ergebnis-Screen als Statistik angezeigt (höchste Streak der Runde)
- [ ] Alle Texte sind auf Deutsch

## Edge Cases

- Was passiert, wenn das Kind bei der ersten Frage falsch antwortet? → Counter bleibt bei 0, keine „Serie beendet"-Meldung
- Was passiert, wenn alle 10 Fragen richtig beantwortet werden? → Streak 10 wird angezeigt, Meilenstein-Animation für 10 wird getriggert
- Was passiert, wenn eine Animation noch läuft und das Kind bereits zur nächsten Frage weitergeklickt hat? → Animation wird sofort ausgeblendet
- Was passiert, wenn die Sounddatei `trommelwirbel.mp3` fehlt? → Stummer Betrieb — Animation erscheint trotzdem, kein Fehler
- Was passiert, wenn der Browser Autoplay-Sound blockiert? → Stummer Betrieb — kein Fehler, Animation läuft weiter
- Was passiert, wenn ein Meilenstein erreicht und der Sound schon läuft? → Bestehender Sound stoppen und neu starten

## Sound-Setup (für Betreiber)
1. Trommelwirbel mit iPhone aufnehmen (Sprachmemos-App)
2. Aufnahme als MP3 exportieren (Sprachmemos → Datei teilen → Als MP3 speichern)
3. Datei umbenennen zu `trommelwirbel.mp3`
4. Datei in den Ordner `public/sounds/` im Projekt legen
5. Empfohlene Länge: 2–4 Sekunden

## Technical Requirements
- Streak-State wird nur im React-State (keine Datenbankpersistenz) der laufenden Runde gespeichert
- Animation: 🥁 Emoji mit CSS Keyframe-Animation (Bounce/Scale-Effekt)
- Soundwiedergabe via Web Audio API (`new Audio('/sounds/trommelwirbel.mp3').play()`)
- Meilenstein-Logik: `if (streak === 5 || streak === 10) → showMilestone()` (Meilenstein bei 3 entfernt)
- Höchste Streak der Runde wird am Rundenende an den Score-Screen weitergegeben
- Unterstützte Audio-Formate: MP3 (Pflicht), M4A (optional als Fallback)

---
<!-- Sections below are added by subsequent skills -->

## Implementation Notes (Frontend)
- Streak-State (`streak`, `maxStreak`) als React-State in `QuizContainer`
- Milestone-Overlay (`MilestoneOverlay`-Komponente) erscheint als fixed fullscreen overlay mit `pointer-events-none` — blockiert nicht die nächste Frage
- Design: großer Cyan-Kreis (`w-80 h-80`, `bg-cyan-400`) mit schwarzem Text — klar lesbar, verschwindet nach 3 Sekunden
- Texte zweizeilig: Zeile 1 groß/fett (z.B. „Wow!"), Zeile 2 kleiner (z.B. „5 in Folge")
- CSS-Keyframe-Animationen in `globals.css`: `drum-bounce-md/lg` für Meilensteine 5 und 10
- Sound-Wiedergabe via `new Audio('/sounds/trommelwirbel.mp3')` mit silent catch — kein Fehler wenn Datei fehlt
- `public/sounds/` Ordner wurde angelegt — Sounddatei muss manuell abgelegt werden
- "Serie beendet"-Toast via `animate-streak-end` Keyframe oben auf dem Screen
- `maxStreak` wird am Ergebnis-Screen als "Längste Serie"-Statistik angezeigt
- Milestone-Overlay wird sofort geschlossen wenn Kind auf "Weiter" klickt

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results

**Datum:** 2026-04-17
**Tester:** QA Engineer (Claude)
**Status: APPROVED — Produktionsreif**

### Acceptance Criteria

| # | Kriterium | Status |
|---|-----------|--------|
| AC1 | Streak-Counter während Quiz-Runde angezeigt | ✅ Pass |
| AC2 | Counter erhöht sich bei jeder richtigen Antwort | ✅ Pass |
| AC3 | Counter wird bei falscher Antwort auf 0 zurückgesetzt | ✅ Pass |
| AC4 | Meilenstein 5: Overlay mit „Wow!" / „5 in Folge" + Sound | ✅ Pass |
| AC5 | Meilenstein 10: Overlay mit „Strike!" / „Alle richtig" + Sound | ✅ Pass |
| AC6 | Sound (`trommelwirbel.mp3`) wird bei Meilenstein abgespielt | ✅ Pass (manuell) |
| AC7 | Sound fehlt → stummer Betrieb, kein Fehler | ✅ Pass (Code-Review) |
| AC8 | Animation mind. 1,5s sichtbar, blockiert nicht nächste Frage | ✅ Pass (3s, pointer-events-none) |
| AC9 | „Serie beendet"-Toast bei Streak-Abbruch | ✅ Pass |
| AC10 | Längste Streak auf Ergebnis-Screen | ✅ Pass |
| AC11 | Alle Texte auf Deutsch | ✅ Pass |

### Edge Cases

| Edge Case | Status |
|-----------|--------|
| Erste Frage falsch → kein „Serie beendet"-Toast | ✅ Pass |
| Alle 10 richtig → Streak 10, Strike!-Animation | ✅ Pass |
| Animation läuft, Kind klickt Weiter → sofort ausgeblendet | ✅ Pass |
| Sounddatei fehlt → Animation erscheint trotzdem | ✅ Pass (Code-Review) |
| Browser blockiert Autoplay → stummer Betrieb | ✅ Pass (Code-Review) |

### Regression Tests

| Feature | Status |
|---------|--------|
| PROJ-1: Quiz Game Core (alle 37 Unit-Tests) | ✅ Pass |
| PROJ-2: Nickname & Highscore (alle E2E-Tests) | ✅ Pass |

### Bugs gefunden

| # | Schweregrad | Beschreibung | Lösung |
|---|-------------|--------------|--------|
| 1 | Medium | PROJ-1 Unit-Test `zeigt Score 10` schlug fehl, da neues `maxStreak`-Element ebenfalls "10" enthält | ✅ Behoben — Test auf `getAllByText` + Nachrichtentext umgestellt |

### Test-Suite

- **Unit-Tests (Vitest):** 37 bestanden, 0 fehlgeschlagen
- **E2E-Tests (Playwright):** 28 bestanden (14 Chromium + 14 Mobile Safari)
- **Responsiveness:** Mobile 375px ✅, Desktop ✅
- **Security:** Keine Sicherheitsrisiken (reiner Client-State, keine DB-Schreibzugriffe)

## Deployment

- **Production URL:** https://carlasquiz.vercel.app
- **Deployed:** 2026-04-18
- **Vercel Deployment:** `dpl_6Nnd3NSaSPSeywNi2H1v7t2BQfKN` (State: READY)
