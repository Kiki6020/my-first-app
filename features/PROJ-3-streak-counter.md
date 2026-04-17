# PROJ-3: Streak-Counter

## Status: In Progress
**Created:** 2026-04-16
**Last Updated:** 2026-04-17 (Frontend implementiert + Design finalisiert)

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
_To be added by /qa_

## Deployment
_To be added by /deploy_
