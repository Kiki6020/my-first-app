# PROJ-2: Nickname & Highscore-System

## Status: In Progress
**Created:** 2026-04-16
**Last Updated:** 2026-04-17

## Dependencies
- Requires: PROJ-1 (Quiz Game Core) — Score wird am Ende einer Runde übergeben

## Beschreibung
Kinder geben vor dem Spielen einen Spitznamen ein (kein Passwort, kein Account). Nach jeder Runde wird der Score mit dem Spitznamen in der Datenbank gespeichert. Eine Highscore-Liste zeigt die besten Ergebnisse aller Spieler.

## User Stories

- Als Kind möchte ich einen Spitznamen eingeben, damit mein Score der Rangliste zugeordnet werden kann.
- Als Kind möchte ich nach einer Runde meinen Score in der Highscore-Liste sehen, damit ich weiß wie ich im Vergleich zu anderen abschneiden.
- Als Kind möchte ich die Highscore-Liste nach einer Runde direkt sehen, damit ich mich über einen neuen Rekord freuen kann.
- Als Kind möchte ich meinen Spitznamen für die nächste Runde behalten, damit ich ihn nicht jedes Mal neu eingeben muss.
- Als Elternteil möchte ich die Highscore-Liste im Browser öffnen können, damit ich mit Carla zusammen die Rangliste anschauen kann.

## Acceptance Criteria

- [ ] Beim ersten Start der App (oder wenn kein Nickname gespeichert ist) wird ein Nickname-Eingabe-Screen angezeigt
- [ ] Der Nickname muss 2–12 Zeichen lang sein (nur Buchstaben, Zahlen, Bindestriche erlaubt)
- [ ] Der eingegebene Nickname wird im LocalStorage gespeichert und beim nächsten Besuch vorausgefüllt
- [ ] Nach jeder abgeschlossenen Quiz-Runde wird der Score automatisch in Supabase gespeichert (Tabelle: `scores`)
- [ ] Der Ergebnis-Screen zeigt: Nickname, Score (X von 10), Datum und Platz in der Highscore-Liste
- [ ] Die Highscore-Liste zeigt die Top 20 Einträge (Spitzname, Score, Datum), sortiert nach Score absteigend
- [ ] Bei gleichem Score gilt das frühere Datum als besser (Tiebreaker)
- [ ] Der eigene Eintrag ist in der Highscore-Liste visuell hervorgehoben
- [ ] Die Highscore-Liste ist auch ohne aktive Runde über einen Button auf der Startseite erreichbar
- [ ] Alle Texte sind auf Deutsch

## Edge Cases

- Was passiert, wenn ein Kind keinen Spitznamen eingibt und direkt drückt? → Validierungsfehler: „Bitte gib einen Spitznamen ein (2–12 Zeichen)"
- Was passiert, wenn der Spitzname bereits in der Highscore-Liste ist? → Beide Einträge bleiben erhalten (kein Account-System, nur Einträge)
- Was passiert bei einem Netzwerkfehler beim Speichern des Scores? → Toast-Meldung: „Score konnte nicht gespeichert werden" — Quiz-Ergebnis trotzdem anzeigen
- Was passiert, wenn die Highscore-Liste leer ist? → Leere-Zustand: „Noch kein Highscore — sei die Erste!"
- Was passiert bei sehr langem Spitznamen-Text in der Tabelle? → Nickname wird bei 12 Zeichen abgeschnitten (durch Validation sichergestellt)

## Technical Requirements
- Supabase Tabelle: `scores` (id, nickname, score, total_questions, created_at)
- Nickname wird im Browser-LocalStorage unter dem Key `quizNickname` gespeichert
- Highscore-Abfrage: `SELECT * FROM scores ORDER BY score DESC, created_at ASC LIMIT 20`
- Row Level Security (RLS): Jeder darf Scores lesen und einfügen (kein Login nötig)
- Score-Speicherung passiert server-seitig via Next.js API Route (nicht direkt vom Browser)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_Inlined into Frontend implementation — /architecture skipped per user request_

### Komponenten
- `src/components/quiz/NicknameScreen.tsx` — Nickname-Eingabe mit Validierung (2–12 Zeichen, Buchstaben/Zahlen/Bindestriche), speichert in `localStorage['quizNickname']`
- `src/components/quiz/HighscoreList.tsx` — Top-20-Liste, eigener Eintrag violet hervorgehoben
- `src/app/highscore/page.tsx` — Standalone Highscore-Seite
- `src/app/api/scores/route.ts` — GET (top 20) + POST (Score speichern) mit Zod-Validierung
- `src/app/quiz/page.tsx` — Client Component: prüft localStorage, zeigt NicknameScreen oder QuizContainer
- `QuizContainer` — erweitert um `nickname`-Prop, speichert Score nach Rundenende, zeigt Rang

### Datenfluss
1. `/quiz` liest `quizNickname` aus localStorage
2. Kein Nickname → NicknameScreen → speichert in localStorage → QuizContainer
3. Nach Runde: `POST /api/scores` → Supabase `scores`-Tabelle
4. Rang: `GET /api/scores` → Position in Top-20 suchen

## Implementation Notes (Frontend)
_Added: 2026-04-17_

**Gebaut:**
- `src/app/quiz/page.tsx` — umgebaut zu Client Component mit Nickname-State
- `src/components/quiz/NicknameScreen.tsx` — Nickname-Eingabe, Validierung client-seitig
- `src/components/quiz/HighscoreList.tsx` — Top-20-Tabelle, eigener Eintrag hervorgehoben
- `src/app/highscore/page.tsx` — Standalone Highscore-Seite
- `src/app/api/scores/route.ts` — GET + POST API Route mit Zod
- `src/components/quiz/QuizContainer.tsx` — nickname-Prop, Score-Speicherung, Rang-Anzeige, aktiver Highscore-Button
- `src/app/page.tsx` — Highscore-Button auf Startseite
- `src/lib/supabase.ts` — Score-Interface ergänzt

**Hinweis:** Supabase-Tabelle `scores` und RLS-Policies noch nicht angelegt → `/backend` nächster Schritt

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
