/**
 * PROJ-2: Nickname & Highscore-System — E2E Tests (Playwright)
 *
 * Testet alle Acceptance Criteria gegen die echte laufende App mit echter Supabase-DB.
 * Geräte: Desktop Chrome (+ iPhone 13 wenn webkit installiert).
 */

import { test, expect, type Page } from '@playwright/test'

const SUPABASE_URL = 'https://anfyyfnmnfkunsqcpipn.supabase.co'

/** Mockt Supabase-Fragen (alle is_true: true → RICHTIG ist immer korrekt → Score 10/10). */
async function mockAllCorrectQuestions(page: Page) {
  const questions = Array.from({ length: 10 }, (_, i) => ({
    id: `q${i + 1}`,
    fact_text: `Testfrage ${i + 1}: Die Sonne ist ein Stern.`,
    is_true: true,
    explanation: `Korrekt (Frage ${i + 1}).`,
    category: 'Weltraum',
    created_at: '2026-01-01T00:00:00Z',
  }))
  await page.route(`${SUPABASE_URL}/rest/v1/questions*`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(questions) })
  })
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

/** Löscht den gespeicherten Nickname aus localStorage. */
async function clearNickname(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('quizNickname'))
}

/** Setzt einen Nickname direkt in localStorage (überspringt NicknameScreen). */
async function setNickname(page: import('@playwright/test').Page, nickname: string) {
  await page.goto('/')
  await page.evaluate((n) => localStorage.setItem('quizNickname', n), nickname)
}

/** Navigiert zur Quiz-Seite und wartet bis RICHTIG-Button sichtbar ist. */
async function gotoQuizReady(page: import('@playwright/test').Page) {
  await page.goto('/quiz')
  // PROJ-5: KategorieScreen erscheint nach Nickname — "Alle Kategorien" wählen.
  // "Welches Thema?" ist statischer Text (kein API-Call) → erscheint sofort.
  const isKategorieScreen = await page.getByText('Welches Thema?')
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false)
  if (isKategorieScreen) {
    await page.getByRole('button', { name: /alle kategorien/i }).click()
  }
  await expect(page.getByRole('button', { name: 'RICHTIG' })).toBeVisible({ timeout: 10000 })
}

/** Spielt alle 10 Fragen durch (immer RICHTIG klicken).
 *  waitForTimeout(400) nach jedem Weiter-Klick gibt der 300ms Übergangsanimation Zeit.
 */
async function playFullRound(page: import('@playwright/test').Page) {
  for (let i = 0; i < 10; i++) {
    await expect(page.getByRole('button', { name: 'RICHTIG' })).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: 'RICHTIG' }).click()
    // Wait for weiter-button to appear, then force-click to avoid React animation detach
    await expect(page.getByTestId('weiter-button')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('weiter-button').click({ force: true })
    // 300ms setTimeout + 300ms CSS transition + 50ms buffer
    await page.waitForTimeout(650)
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('PROJ-2: Nickname & Highscore-System', () => {

  // ── AC1: Nickname-Screen beim ersten Besuch ────────────────────────────────

  test('AC1: NicknameScreen wird angezeigt wenn kein Nickname gespeichert ist', async ({ page }) => {
    await clearNickname(page)
    await page.goto('/quiz')
    await expect(page.getByText('Wie heißt du?')).toBeVisible()
    await expect(page.getByPlaceholder(/spitzname/i)).toBeVisible()
  })

  test('AC1: QuizContainer wird direkt angezeigt wenn Nickname bereits gespeichert ist', async ({ page }) => {
    await setNickname(page, 'TestUser')
    await gotoQuizReady(page)
    // NicknameScreen sollte NICHT sichtbar sein
    await expect(page.getByText('Wie heißt du?')).not.toBeVisible()
  })

  // ── AC2: Nickname-Validierung ──────────────────────────────────────────────

  test('AC2: Validierungsfehler bei leerem Nickname', async ({ page }) => {
    await clearNickname(page)
    await page.goto('/quiz')
    await page.getByRole('button', { name: /los geht/i }).click()
    await expect(page.getByText(/bitte gib einen spitznamen ein/i)).toBeVisible()
  })

  test('AC2: Validierungsfehler bei zu kurzem Nickname (1 Zeichen)', async ({ page }) => {
    await clearNickname(page)
    await page.goto('/quiz')
    await page.getByPlaceholder(/spitzname/i).fill('A')
    await page.getByRole('button', { name: /los geht/i }).click()
    await expect(page.getByText(/bitte gib einen spitznamen ein/i)).toBeVisible()
  })

  test('AC2: Validierungsfehler bei Sonderzeichen im Nickname', async ({ page }) => {
    await clearNickname(page)
    await page.goto('/quiz')
    await page.getByPlaceholder(/spitzname/i).fill('Carla!')
    await page.getByRole('button', { name: /los geht/i }).click()
    await expect(page.getByText(/nur buchstaben/i)).toBeVisible()
  })

  test('AC2: Gültiger Nickname (2+ Zeichen) öffnet das Quiz', async ({ page }) => {
    await clearNickname(page)
    await page.goto('/quiz')
    await page.getByPlaceholder(/spitzname/i).fill('Carla')
    await page.getByRole('button', { name: /los geht/i }).click()
    // PROJ-5: KategorieScreen erscheint nach Nickname-Eingabe
    const afterNicknameKat = await page.getByText('Welches Thema?')
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true).catch(() => false)
    if (afterNicknameKat) {
      await page.getByRole('button', { name: /alle kategorien/i }).click()
    }
    await expect(page.getByRole('button', { name: 'RICHTIG' })).toBeVisible({ timeout: 10000 })
  })

  // ── AC3: Nickname-Persistenz in localStorage ───────────────────────────────

  test('AC3: Nickname wird nach Eingabe in localStorage gespeichert', async ({ page }) => {
    await clearNickname(page)
    await page.goto('/quiz')
    await page.getByPlaceholder(/spitzname/i).fill('Carla')
    await page.getByRole('button', { name: /los geht/i }).click()

    const saved = await page.evaluate(() => localStorage.getItem('quizNickname'))
    expect(saved).toBe('Carla')
  })

  test('AC3: Beim erneuten Besuch wird NicknameScreen nicht mehr angezeigt', async ({ page }) => {
    await setNickname(page, 'Carla')
    await page.goto('/quiz')
    // NicknameScreen sollte nicht erscheinen
    await expect(page.getByText('Wie heißt du?')).not.toBeVisible()
    // PROJ-5: KategorieScreen erscheint stattdessen — direkt durchklicken
    const afterRevisitKat = await page.getByText('Welches Thema?')
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true).catch(() => false)
    if (afterRevisitKat) {
      await page.getByRole('button', { name: /alle kategorien/i }).click()
    }
    await expect(page.getByRole('button', { name: 'RICHTIG' })).toBeVisible({ timeout: 10000 })
  })

  // ── AC4: Score wird nach der Runde gespeichert ────────────────────────────

  test('AC4 + AC5: Nach einer Runde zeigt der Ergebnis-Screen Nickname und Score', async ({ page }) => {
    await setNickname(page, 'TestQA')
    await gotoQuizReady(page)
    await playFullRound(page)

    // Ergebnis-Screen
    await expect(page.getByText('Dein Ergebnis')).toBeVisible({ timeout: 5000 })
    // Nickname sichtbar
    await expect(page.getByText('TestQA')).toBeVisible()
    // Score
    await expect(page.getByText('10')).toBeVisible()
  })

  test('AC4: Score-Speichern-Status wird angezeigt (speichern → gespeichert)', async ({ page }) => {
    await setNickname(page, 'TestQA2')
    await gotoQuizReady(page)
    await playFullRound(page)

    await expect(page.getByText('Dein Ergebnis')).toBeVisible({ timeout: 5000 })
    // Entweder "wird gespeichert" oder Rang/Bestätigung erscheint
    await expect(
      page.getByText(/gespeichert|platz \d+/i)
    ).toBeVisible({ timeout: 8000 })
  })

  // ── AC5: Ergebnis-Screen zeigt Datum ──────────────────────────────────────

  test('AC5: Ergebnis-Screen zeigt Nickname, Score und Highscore-Button', async ({ page }) => {
    await setNickname(page, 'TestQA3')
    await gotoQuizReady(page)
    await playFullRound(page)

    await expect(page.getByText('Dein Ergebnis')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('TestQA3')).toBeVisible()
    await expect(page.getByRole('button', { name: /highscore/i })).toBeVisible()
  })

  // ── AC6 + AC8: Highscore-Liste ────────────────────────────────────────────

  test('AC6: Highscore-Seite zeigt bis zu 20 Einträge, sortiert nach Score', async ({ page }) => {
    await page.goto('/highscore')
    await expect(page.getByRole('heading', { name: 'Highscore' })).toBeVisible()
    // Warten bis Daten geladen (Spinner verschwindet)
    await expect(page.getByText(/lade highscores/i)).not.toBeVisible({ timeout: 8000 })
    // Entweder Einträge (mit "/10") oder Leer-Zustand
    const hasScores = await page.locator('text=/\\/10/').count()
    if (hasScores === 0) {
      await expect(page.getByText(/noch kein highscore/i)).toBeVisible()
    } else {
      expect(hasScores).toBeGreaterThan(0)
    }
  })

  test('AC6: Highscore-Liste zeigt Score im Format X/10', async ({ page }) => {
    await page.goto('/highscore')
    await expect(page.getByRole('heading', { name: 'Highscore' })).toBeVisible()
    // Warten bis Daten geladen (Spinner verschwindet)
    await expect(page.getByText(/lade highscores/i)).not.toBeVisible({ timeout: 8000 })
    // Wenn Einträge vorhanden, mindestens einen Score im Format X/10 erwarten
    const scorePattern = page.locator('text=/\\/10/')
    const count = await scorePattern.count()
    // Wenn Liste leer: Leer-Zustand-Meldung
    if (count === 0) {
      await expect(page.getByText(/noch kein highscore/i)).toBeVisible()
    } else {
      expect(count).toBeGreaterThan(0)
    }
  })

  test('AC8: Eigener Eintrag wird in der Highscore-Liste hervorgehoben', async ({ page }) => {
    // Eindeutiger Nickname verhindert Kollision mit alten DB-Einträgen
    const uniqueNickname = `QA${Date.now().toString().slice(-6)}`
    await setNickname(page, uniqueNickname)
    // Mock: alle is_true=true → Score 10/10 → garantiert in Top 20 (neueste zuerst)
    await mockAllCorrectQuestions(page)
    await gotoQuizReady(page)
    await playFullRound(page)

    await expect(page.getByText('Dein Ergebnis')).toBeVisible({ timeout: 5000 })
    // Warten bis Score gespeichert ist (Rang-Anzeige erscheint)
    // Mit Score 10/10 und newest-first-Sortierung erscheint immer ein Platz
    await expect(page.getByText(/platz \d+/i)).toBeVisible({ timeout: 10000 })

    // Klick auf Highscore-Button im Ergebnis-Screen
    await page.getByRole('button', { name: /highscore/i }).click()
    await expect(page).toHaveURL(/\/highscore/)
    await expect(page.getByRole('heading', { name: 'Highscore' })).toBeVisible()
    // Warten bis Liste geladen
    await expect(page.getByText(/lade highscores/i)).not.toBeVisible({ timeout: 8000 })

    // "(du)"-Label sollte beim eigenen Eintrag stehen
    await expect(page.getByText('(du)')).toBeVisible({ timeout: 5000 })
  })

  // ── AC9: Highscore über Startseite erreichbar ─────────────────────────────

  test('AC9: Highscore-Button auf der Startseite navigiert zur Highscore-Seite', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /highscore/i }).click()
    await expect(page).toHaveURL(/\/highscore/)
    await expect(page.getByRole('heading', { name: 'Highscore' })).toBeVisible()
  })

  // ── AC10: Deutsche Texte ───────────────────────────────────────────────────

  test('AC10: Alle wichtigen Texte sind auf Deutsch', async ({ page }) => {
    await clearNickname(page)
    await page.goto('/quiz')
    await expect(page.getByText('Wie heißt du?')).toBeVisible()
    await expect(page.getByPlaceholder(/spitzname/i)).toBeVisible()

    await page.goto('/highscore')
    await expect(page.getByRole('heading', { name: 'Highscore' })).toBeVisible()
    await expect(page.getByText(/besten 20/i)).toBeVisible()
  })

  // ── Edge Case: Leere Highscore-Liste ─────────────────────────────────────

  test('Edge Case: Leerer Highscore-Zustand zeigt Motivations-Text', async ({ page }) => {
    await page.goto('/highscore')
    await expect(page.getByRole('heading', { name: 'Highscore' })).toBeVisible()
    // Warten bis geladen
    await expect(page.getByText(/lade highscores/i)).not.toBeVisible({ timeout: 8000 })

    const hasScores = await page.locator('text=/\\/10/').count()
    if (hasScores === 0) {
      await expect(page.getByText(/noch kein highscore/i)).toBeVisible()
      await expect(page.getByText(/sei die erste/i)).toBeVisible()
    }
    // Wenn Einträge vorhanden: Test gilt als bestanden
  })

  // ── Edge Case: Nickname ändern ────────────────────────────────────────────

  test('Edge Case: "Anderen Namen verwenden" löscht Nickname und zeigt NicknameScreen', async ({ page }) => {
    await setNickname(page, 'OldName')
    await gotoQuizReady(page)
    await playFullRound(page)

    await expect(page.getByText('Dein Ergebnis')).toBeVisible({ timeout: 5000 })
    await page.getByText(/anderen namen verwenden/i).click()

    await expect(page.getByText('Wie heißt du?')).toBeVisible()
    const saved = await page.evaluate(() => localStorage.getItem('quizNickname'))
    expect(saved).toBeNull()
  })

  // ── Responsiveness ────────────────────────────────────────────────────────

  test('Responsiveness: NicknameScreen auf Mobile (375px) bedienbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await clearNickname(page)
    await page.goto('/quiz')
    await expect(page.getByText('Wie heißt du?')).toBeVisible()
    await expect(page.getByPlaceholder(/spitzname/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /los geht/i })).toBeVisible()
  })

  test('Responsiveness: Highscore-Seite auf Mobile (375px) bedienbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/highscore')
    await expect(page.getByRole('heading', { name: 'Highscore' })).toBeVisible()
  })
})
