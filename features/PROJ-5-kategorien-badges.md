# PROJ-5: Kategorien & Badges

## Status: Architected
**Created:** 2026-04-18
**Last Updated:** 2026-04-18

## Dependencies
- PROJ-1 (Quiz Game Core) – Quizablauf und Fragen-Logik
- PROJ-2 (Nickname & Highscore) – Spitzname für Badge-Speicherung, Highscore-Screen für Badge-Sammlung
- PROJ-4 (Fragen-Import) – `questions`-Tabelle braucht ein `category`-Feld

## Beschreibung
Quizfragen werden in Kategorien eingeteilt (Tiere, Pflanzen, Körper, Welt, Weltraum, MINT, Kultur). Kinder wählen vor dem Quiz ein Thema oder spielen alle Kategorien gemischt. Zusätzlich gibt es freischaltbare Badges: Wer alle Fragen einer Kategorie mindestens einmal richtig beantwortet hat, erhält den „Kategorie-Meister"-Badge. Badges werden pro Spitzname dauerhaft gespeichert und in einer Sammlung angezeigt.

## Kategorien
Die 7 Kategorien (plus „Alle Kategorien"):
- 🐘 **Tiere** – Fragen rund um Tiere
- 🌿 **Pflanzen** – Fragen über Pflanzen und Natur
- 🫀 **Körper** – Fragen über den menschlichen Körper
- 🌍 **Welt** – Fragen über Länder, Geographie, Kultur
- 🚀 **Weltraum** – Fragen über Planeten, Sterne, Universum
- 🔬 **MINT** – Fragen aus Mathematik, Informatik, Naturwissenschaft und Technik
- 🎨 **Kultur** – Fragen über Kunst, Musik, Geschichte

## User Stories

- Als Kind möchte ich nach der Spitzname-Eingabe ein Thema auswählen, damit ich Fragen über mein Lieblingsthema bekomme.
- Als Kind möchte ich auch „Alle Kategorien" wählen können, damit ich eine bunte Mischung aus allem bekomme.
- Als Kind möchte ich sehen, welcher Kategorie eine Frage gehört, damit ich weiß, worüber ich gerade lerne.
- Als Kind möchte ich einen Badge erhalten, wenn ich alle Fragen einer Kategorie richtig beantwortet habe, damit ich mich besonders gut fühle.
- Als Kind möchte ich ein Popup sehen, wenn ich einen neuen Badge freischalte, damit ich das sofort mitbekomme.
- Als Kind möchte ich meine gesammelten Badges in der Highscore-Liste sehen, damit ich meine Sammlung zeigen kann.
- Als Elternteil/Admin möchte ich Fragen einer Kategorie zuordnen können (beim Fragen-Import), damit das Kategorie-System funktioniert.

## Acceptance Criteria

### Kategorie-Auswahl
- [ ] Nach der Spitzname-Eingabe erscheint ein Kategorie-Auswahlscreen
- [ ] Der Screen zeigt alle 7 Kategorien mit Emoji und Name als Buttons/Karten
- [ ] Es gibt einen zusätzlichen Button „🌈 Alle Kategorien" (zufällig gemischt)
- [ ] Jede Kategorie zeigt an, wie viele Fragen verfügbar sind (z.B. „12 Fragen")
- [ ] Kategorien ohne Fragen (0 Fragen) sind ausgegraut und nicht auswählbar
- [ ] Nach der Auswahl startet das Quiz nur mit Fragen aus der gewählten Kategorie
- [ ] Bei „Alle Kategorien" wird wie bisher zufällig aus allen Fragen gezogen
- [ ] Oben im Quiz ist die gewählte Kategorie sichtbar (kleines Label)
- [ ] Alle Texte sind auf Deutsch

### Fragen-Kategorisierung (Admin / Datenbank)
- [ ] Die `questions`-Tabelle hat ein Pflichtfeld `category` (Text, einer der 7 Kategorienamen)
- [ ] Beim Fragen-Import (CSV/JSON) kann die Kategorie pro Frage angegeben werden
- [ ] Bestehende Fragen ohne Kategorie werden automatisch „Welt" zugeordnet (Fallback)
- [ ] Im Admin-Panel kann die Kategorie einer Frage bearbeitet werden

### Badges
- [ ] Es gibt genau 7 Kategorie-Meister-Badges (einen pro Kategorie)
- [ ] Ein Badge wird freigeschaltet, sobald der Spieler alle Fragen einer Kategorie mindestens einmal richtig beantwortet hat
- [ ] Nach dem Freischalten erscheint ein animiertes Popup (z.B. „🏆 Neuer Badge! Kategorie-Meister: Tiere")
- [ ] Das Popup ist kindgerecht gestaltet (groß, bunt, mit Animation)
- [ ] Das Popup verschwindet nach 3 Sekunden oder per Klick
- [ ] Badges werden in Supabase pro Spitzname gespeichert (`nickname_badges`-Tabelle)
- [ ] Bereits freigeschaltete Badges werden nicht erneut als Popup gezeigt
- [ ] Auf dem Highscore-Screen gibt es eine Badge-Sammlung für den eingeloggten Spitznamen
- [ ] Nicht freigeschaltete Badges werden als graue Silhouette angezeigt
- [ ] Freigeschaltete Badges werden farbig und mit Freischalt-Datum angezeigt

## Edge Cases

- Was passiert, wenn eine Kategorie weniger als 10 Fragen hat? → Das Quiz läuft mit allen verfügbaren Fragen dieser Kategorie (weniger als 10 Runden), ein Hinweis wird angezeigt: „Diese Kategorie hat nur X Fragen."
- Was passiert, wenn zwei verschiedene Kinder denselben Spitznamen verwenden? → Badges werden für diesen Spitznamen gemeinsam gespeichert (kein Account-System, gleicher Spitzname = gleiche Person, wie bei Highscores)
- Was passiert, wenn eine Frage keine Kategorie hat (Altdaten)? → Fallback auf „Welt"; kein Absturz
- Was passiert, wenn ein Kind den Badge-Screen schnell wegklickt? → Badge ist bereits gespeichert, kein Verlust
- Was passiert, wenn das Kind denselben Spitznamen wechselt? → Badges des neuen Spitznamens werden geladen
- Was passiert bei Netzwerkfehler beim Badge-Speichern? → Fehler still loggen, kein Absturz; beim nächsten Quiz-Ende erneut versuchen

## Technical Requirements
- Neue Supabase-Tabelle: `nickname_badges` (nickname TEXT, category TEXT, unlocked_at TIMESTAMP, PRIMARY KEY (nickname, category))
- `questions`-Tabelle: neues Feld `category TEXT NOT NULL DEFAULT 'Welt'`
- Fragen-API: gefilterte Abfrage mit `WHERE category = $1` (oder ohne Filter für „Alle")
- Badge-Check nach jeder Quizrunde: Prüfe ob alle Fragen der Kategorie bereits richtig beantwortet (via `quiz_results` oder separatem Tracking)
- Mobile-first Design (große Kategorie-Karten, gut tippbar für Kinder)
- Kategorie-Label im Quiz immer sichtbar (farbiges Tag/Chip)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Bestehende Architektur (Ist-Zustand)

PROJ-5 fügt zwischen NicknameScreen und QuizContainer einen neuen Schritt ein: die Kategorie-Auswahl.

### A) Komponenten-Struktur

```
Seite (page.tsx)                        ← Flow-Steuerung erweitert
+-- NicknameScreen                      ← unverändert
+-- KategorieScreen        [NEU]        ← Kategorie auswählen
|   +-- KategorieKarte (×8)             ← 7 Kategorien + "Alle"
|       +-- Emoji + Name
|       +-- Fragenanzahl-Badge
|       +-- Gesperrt-Zustand (grau)
+-- QuizContainer                       ← erweitert
|   +-- KategoriLabel (oben)  [NEU]     ← kleine Chip-Anzeige während Quiz
|   +-- [bestehende UI unverändert]
|   +-- BadgePopup             [NEU]    ← Animiertes Freischalt-Popup
+-- HighscoreList                       ← erweitert
    +-- BadgeSammlung          [NEU]    ← Badges des eingeloggten Spielers
        +-- BadgeSymbol (×7)            ← farbig (freigeschaltet) oder grau
```

### B) Datenmodell

**Bestehende Tabelle `questions` — wird erweitert:**
- Neues Feld `category TEXT NOT NULL DEFAULT 'Welt'`
- Migration: alle bestehenden Fragen erhalten Fallback `'Welt'`

**Neue Tabelle `nickname_badges`:**
- `nickname TEXT` — Spitzname des Spielers
- `category TEXT` — Kategorie des Badges (z.B. "Tiere")
- `unlocked_at TIMESTAMP` — Zeitstempel der Freischaltung
- Primärschlüssel: (nickname + category) — jeder Badge einmalig pro Spieler

### C) Erweiterter Quiz-Flow

```
1. Spitzname eingeben
       ↓
2. Kategorie wählen       [NEU]
   (oder "Alle Kategorien")
       ↓
3. Quiz spielen
   - Fragen gefiltert nach Kategorie  [NEU]
   - Kategorie-Label oben sichtbar    [NEU]
       ↓
4. Ergebnis-Screen
   - Badge-Check im Hintergrund       [NEU]
   - ggf. Badge-Popup anzeigen        [NEU]
       ↓
5. Highscore-Screen
   - Badge-Sammlung des Spielers      [NEU]
```

### D) Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Kategorie-Auswahl als eigener Screen (nicht Dropdown) | Kinder brauchen große, tippbare Flächen — Karten mit Emoji sind intuitiver |
| Fragenanzahl beim Laden vorberechnen | Ein API-Aufruf zählt Fragen pro Kategorie → zeigt "12 Fragen" in jeder Karte |
| Badge-Check serverseitig (API-Route) | Verhindert Manipulation durch den Browser |
| Badge-Popup via shadcn `Dialog` | Bereits installiert — kein Custom-Code nötig |
| Fallback "Welt" für Altdaten | Migration setzt Kategorie für alle bestehenden Fragen — kein Datenverlust |

### E) Neue API-Routes

| Route | Zweck |
|---|---|
| `GET /api/questions?category=Tiere` | Fragen gefiltert nach Kategorie (oder alle) |
| `GET /api/categories` | Liste aller Kategorien mit Fragenanzahl |
| `GET /api/badges?nickname=Carla` | Freigeschaltete Badges eines Spitznamens |
| `POST /api/badges/check` | Badge-Check nach Quiz-Ende (serverseitig) |

### F) Dependencies

Keine neuen npm-Pakete nötig. Verwendete shadcn-Komponenten sind bereits installiert: `Dialog`, `Card`, `Badge`, `Button`. Animationen via Tailwind CSS.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
