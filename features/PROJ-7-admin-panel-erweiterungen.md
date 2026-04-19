# PROJ-7: Admin-Panel Erweiterungen

## Status: Deployed
**Created:** 2026-04-19
**Last Updated:** 2026-04-19

> **Hinweis:** Diese Spec dokumentiert Features, die nachträglich ohne eigenen Requirements-Durchlauf implementiert wurden. Status ist direkt „Deployed", da alle drei Funktionen bereits live sind.

## Dependencies
- Requires: PROJ-4 (Fragen-Import) — Fragen-Tab mit Tabelle existiert im Admin-Panel
- Requires: PROJ-2 (Nickname & Highscore-System) — Highscore-Tabelle existiert
- Requires: PROJ-5 (Kategorien & Badges) — Badges-Tabelle existiert

## Übersicht
Drei nachträglich ergänzte Admin-Funktionen im Admin-Panel (`/admin`):

1. **Bulk-Delete Fragen** — alle Fragen auf einmal löschen
2. **Bulk-Delete Highscores** — alle Highscores auf einmal löschen
3. **Badges-Tab mit Reset** — Übersicht aller vergebenen Badges + Komplett-Reset

---

## User Stories

- Als Betreiber möchte ich alle Fragen auf einmal löschen können, damit ich die Datenbank schnell für einen Neustart leeren kann.
- Als Betreiber möchte ich alle Highscores auf einmal löschen können, damit ich die Rangliste zurücksetzen kann (z.B. zu Schuljahresbeginn).
- Als Betreiber möchte ich alle vergebenen Badges auf einmal sehen und zurücksetzen können, damit ich den Fortschritt der Kinder neu starten kann.
- Als Betreiber möchte ich vor jedem Bulk-Delete eine Bestätigung eingeben müssen, damit ich nicht aus Versehen Daten lösche.

---

## Acceptance Criteria

### Bulk-Delete Fragen (im Tab „Fragen verwalten")
- [x] AC1: Es gibt einen „Alle Fragen löschen"-Button im Fragen-Tab des Admin-Panels.
- [x] AC2: Klick auf den Button öffnet einen Bestätigungs-Dialog mit Warnung vor unwiederbringlichem Datenverlust.
- [x] AC3: Nur nach expliziter Bestätigung werden alle Fragen aus der Datenbank gelöscht.
- [x] AC4: Nach erfolgreichem Löschen ist die Fragenliste leer und eine Erfolgsmeldung erscheint.
- [x] AC5: „Abbrechen" schließt den Dialog ohne zu löschen.

### Bulk-Delete Highscores (im Tab „Highscores")
- [x] AC6: Es gibt einen „Alle Highscores löschen"-Button im Highscore-Tab des Admin-Panels.
- [x] AC7: Klick auf den Button öffnet einen Bestätigungs-Dialog.
- [x] AC8: Nur nach Bestätigung werden alle Highscore-Einträge gelöscht.
- [x] AC9: Nach dem Löschen ist die Highscore-Tabelle leer.
- [x] AC10: „Abbrechen" schließt den Dialog ohne zu löschen.

### Badges-Tab
- [x] AC11: Im Admin-Panel gibt es einen eigenen Tab „Badges".
- [x] AC12: Der Tab zeigt alle in der Datenbank gespeicherten Badge-Einträge (Spitzname, Kategorie, Vergabe-Datum).
- [x] AC13: Es gibt einen „Alle Badges zurücksetzen"-Button.
- [x] AC14: Klick öffnet einen Bestätigungs-Dialog.
- [x] AC15: Nach Bestätigung werden alle Badge-Einträge gelöscht; die Tabelle ist danach leer.

---

## Edge Cases

- **Leere Tabelle:** Bulk-Delete auf bereits leere Tabelle löst keinen Fehler aus — Erfolgsmeldung erscheint trotzdem.
- **Netzwerkfehler:** Schlägt die Lösch-Anfrage fehl, bleibt der Dialog offen und eine Fehlermeldung wird angezeigt.
- **Kein Admin-Login:** Alle drei Funktionen sind nur nach Admin-Authentifizierung erreichbar — kein unautorisierter Zugriff möglich.
- **Gleichzeitige Nutzung:** Löscht ein anderer Admin-Tab gerade Daten, ist das Ergebnis korrekt (Supabase-Transaktionen).

---

## Technical Requirements
- Security: Admin-Authentifizierung erforderlich (bestehende Admin-Auth aus PROJ-4)
- Alle Lösch-Operationen laufen über Supabase-RLS-gesicherte API-Routen
- Bestätigungs-Dialoge verwenden shadcn/ui `AlertDialog`

---

<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_Nachträglich nicht erstellt — Feature wurde direkt implementiert._

## QA Test Results
_Nachträglich nicht erstellt — Feature wurde direkt deployed und manuell getestet._

## Deployment
**Deployed:** 2026-04-19 — Live in Produktion auf Vercel.
