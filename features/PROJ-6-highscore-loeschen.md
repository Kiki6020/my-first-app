# PROJ-6: Highscore löschen im Admin-Panel

## Status: Planned
**Created:** 2026-04-19
**Last Updated:** 2026-04-19

## Dependencies
- Requires: PROJ-2 (Nickname & Highscore-System) — scores-Tabelle und API-Routen existieren bereits
- Requires: PROJ-4 (Fragen-Import) — Admin-Panel und Login-Mechanismus existieren bereits

## User Stories
- Als Admin (Elternteil) möchte ich einen einzelnen Highscore-Eintrag löschen können, damit ich Test-Einträge oder unpassende Spitznamen aus der Rangliste entfernen kann.
- Als Admin möchte ich alle Highscores mit Datum und Uhrzeit sehen, damit ich Test-Einträge von echten Spielergebnissen unterscheiden kann.
- Als Admin möchte ich vor dem Löschen einen Bestätigungs-Dialog sehen, damit ich nicht versehentlich echte Highscores lösche.

## Acceptance Criteria
- [ ] AC1: Im Admin-Panel gibt es einen neuen Tab "🏆 Highscores" neben den bestehenden Tabs.
- [ ] AC2: Der Tab zeigt eine Tabelle aller Highscores mit den Spalten: Spitzname, Score (z. B. "8/10"), Datum & Uhrzeit, und Löschen-Button.
- [ ] AC3: Die Tabelle ist nach Score absteigend sortiert (bei gleichem Score: neueste zuerst) — gleiche Reihenfolge wie die öffentliche Rangliste.
- [ ] AC4: Jede Zeile hat einen Löschen-Button (Trash-Icon). Beim Klick erscheint ein AlertDialog mit dem Spitznamen und Score zur Bestätigung.
- [ ] AC5: Nach dem Löschen wird die Tabelle automatisch aktualisiert und der Eintrag ist verschwunden.
- [ ] AC6: Eine neue API-Route `DELETE /api/admin/scores/[id]` löscht einen einzelnen Score. Die Route ist nur für eingeloggte Admins zugänglich (Session-Cookie wie bestehende Admin-Routen).
- [ ] AC7: Wenn kein Highscore vorhanden ist, zeigt die Tabelle einen leeren Zustand: "Noch keine Highscores vorhanden."
- [ ] AC8: Der Löschen-Button ist während des Lösch-Vorgangs deaktiviert (verhindert Doppelklick).

## Edge Cases
- **Kein Eintrag mehr vorhanden:** Nach dem Löschen des letzten Eintrags zeigt die Tabelle den leeren Zustand.
- **Netzwerkfehler beim Löschen:** Fehlgeschlagene DELETE-Anfrage zeigt keine Crash — Tabelle bleibt unverändert, Button wird wieder aktiv.
- **Gleichzeitige Löschung:** Wenn ein Eintrag bereits gelöscht wurde (z. B. anderes Browser-Fenster), gibt die API 404 zurück — Tabelle wird trotzdem neu geladen.
- **Viele Einträge:** Die Tabelle zeigt alle Einträge (kein Paging in MVP, da maximal ein paar Dutzend Einträge zu erwarten sind).
- **Session abgelaufen:** API gibt 401 zurück → Admin-Panel leitet zur Login-Seite weiter (bestehendes Verhalten).

## Technical Requirements
- Security: DELETE-Route erfordert gültiges Admin-Session-Cookie (analog zu `/api/admin/questions/[id]`)
- API: `DELETE /api/admin/scores/[id]` — id ist die UUID des Scores aus der Datenbank
- No new tables needed — verwendet die bestehende `scores`-Tabelle

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Übersicht
PROJ-6 erweitert das bestehende Admin-Panel um einen dritten Tab. Es wird **kein neues Datenbankschema** benötigt — die vorhandene `scores`-Tabelle und der bestehende Session-Cookie-Mechanismus werden wiederverwendet.

### Komponenten-Struktur

```
Admin Page (src/app/admin/page.tsx) — bestehende Datei
+-- LoginForm                         (unverändert)
+-- TabsList
|   +-- Tab "📥 Importieren"          (unverändert)
|   +-- Tab "📋 Fragen verwalten"     (unverändert)
|   +-- Tab "🏆 Highscores"           ← NEU
+-- HighscoresTab                     ← NEU (neue Komponente in derselben Datei)
    +-- Tabelle mit allen Scores
    |   +-- Zeile: Spitzname | Score | Datum & Uhrzeit | Löschen-Button
    +-- AlertDialog (Bestätigung)     (bestehende shadcn-Komponente)
    +-- Leerer Zustand                ("Noch keine Highscores vorhanden.")
```

### Neue API-Route

| Route | Methode | Zweck | Auth |
|-------|---------|-------|------|
| `/api/admin/scores/[id]` | DELETE | Einzelnen Score löschen | Session-Cookie (wie `/api/admin/questions/[id]`) |

Die bestehende öffentliche Route `GET /api/scores` wird für das Laden der Liste im Admin-Tab wiederverwendet (liefert bis zu 20 Einträge — ausreichend für ein Heimprojekt).

### Datenfluss

```
HighscoresTab lädt  →  GET /api/scores  →  Supabase scores-Tabelle
                                           (score DESC, created_at DESC)

Admin klickt Löschen  →  AlertDialog erscheint
Admin bestätigt       →  DELETE /api/admin/scores/[id]  →  Supabase
                      →  Tabelle wird neu geladen
```

### Tech-Entscheidungen

| Entscheidung | Wahl | Warum |
|---|---|---|
| Wo wird der Tab gebaut? | In der bestehenden `src/app/admin/page.tsx` | Keine neue Datei nötig — Pattern ist identisch mit `QuestionsTab` |
| Wie wird Auth geprüft? | Session-Cookie via bestehendes Middleware-Muster | Konsistent mit allen anderen Admin-Routen, kein zusätzlicher Aufwand |
| Wie wird die Liste geladen? | Bestehende `GET /api/scores`-Route | Die scores-Tabelle bleibt sehr klein (Heimgebrauch), kein neuer Endpunkt nötig |
| Bestätigungs-Dialog | shadcn AlertDialog (bereits installiert) | Gleiche Komponente wie beim Fragen-Löschen — kein neues Paket |
| Paging? | Kein Paging | Max. ein paar Dutzend Einträge erwartet |

### Keine neuen Pakete erforderlich
Alle benötigten shadcn-Komponenten (Table, AlertDialog, Button, Badge, Tabs) sind bereits installiert.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
