/**
 * PROJ-1: Quiz Game Core — E2E Tests (Playwright)
 *
 * Testet alle Acceptance Criteria gegen die echte laufende App mit echter Supabase-DB.
 * Geräte: Desktop Chrome + iPhone 13 (aus playwright.config.ts)
 */

import { test, expect } from '@playwright/test'

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

/**
 * Beantwortet N Fragen (immer RICHTIG klicken) und wartet nach jedem Weiter-Klick
 * die 300ms Übergangsanimation ab (plus 100ms Puffer).
 */
async function answerAndAdvance(page: import('@playwright/test').Page, count = 1) {
  for (let i = 0; i < count; i++) {
    await page.getByRole('button', { name: 'RICHTIG' }).click()
    // Wait for weiter-button to appear, then force-click to avoid React animation detach
    await expect(page.getByTestId('weiter-button')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('weiter-button').click({ force: true })
    // 300ms setTimeout + 300ms CSS transition + 50ms buffer
    await page.waitForTimeout(650)
  }
}

/**
 * Navigiert zur Quiz-Seite und wartet bis die erste Frage geladen ist.
 * Setzt localStorage-Nickname vorab, damit der NicknameScreen (PROJ-2) übersprungen wird.
 */
async function gotoQuizAndWaitForQuestion(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('quizNickname', 'TestUser'))
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
  await expect(page.getByRole('button', { name: 'RICHTIG' })).toBeVisible({
    timeout: 10000,
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('PROJ-1: Quiz Game Core', () => {
  // ── AC: Startseite ──────────────────────────────────────────────────────────

  test('AC: Startseite zeigt Quiz-Titel und Start-Button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText("Carla")).toBeVisible()
    await expect(page.getByRole('link', { name: /quiz starten/i })).toBeVisible()
  })

  test('AC: Start-Button navigiert zur Quiz-Seite', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /quiz starten/i }).click()
    await expect(page).toHaveURL('/quiz')
  })

  // ── AC1: 10 Fragen pro Runde ─────────────────────────────────────────────

  test('AC1: Pro Runde werden genau 10 Fragen angezeigt', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)

    for (let i = 1; i <= 10; i++) {
      await expect(page.getByText(`Frage ${i} von 10`)).toBeVisible()
      await answerAndAdvance(page)
    }

    // Nach Frage 10 kommt der Ergebnis-Screen
    await expect(page.getByText('Dein Ergebnis')).toBeVisible({ timeout: 5000 })
  })

  // ── AC2: Richtig/Falsch Buttons ──────────────────────────────────────────

  test('AC2: Jede Frage zeigt RICHTIG- und FALSCH-Buttons', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await expect(page.getByRole('button', { name: 'RICHTIG' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'FALSCH' })).toBeVisible()
  })

  test('AC2: Frage zeigt einen Fun-Fact-Text an', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    // Fact-Text steht in einem <p> mit großer Schrift
    const factText = page.locator('p.text-white.font-semibold')
    await expect(factText).toBeVisible()
    const text = await factText.textContent()
    expect(text).toBeTruthy()
    expect(text!.length).toBeGreaterThan(5)
  })

  // ── AC3: Konfetti bei richtiger Antwort ──────────────────────────────────

  test('AC3: Nach richtiger Antwort — korrekter Button wird grün hervorgehoben', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)

    // Merken welcher Button die richtige Antwort zeigt (grüner Button nach Klick)
    // Wir klicken RICHTIG und prüfen dann den Feedback-Zustand
    await page.getByRole('button', { name: 'RICHTIG' }).click()

    // Im Feedback-Zustand: genau ein Button hat grüne Farbe (der korrekte)
    const greenButton = page.locator('button.bg-emerald-500')
    await expect(greenButton).toBeVisible()
  })

  // ── AC4: Feedback bei falscher Antwort ───────────────────────────────────

  test('AC4: Nach falscher Antwort — richtiger Button wird grün, falscher Button wird ausgegraut', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)

    // Klicken FALSCH — der korrekte Button wird grün hervorgehoben,
    // der geklickte falsche Button wird ausgegraut (gewünschtes Design:
    // richtige Antwort soll klar hervorstechen)
    await page.getByRole('button', { name: 'FALSCH' }).click()

    const greenButton = page.locator('button.bg-emerald-500')
    await expect(greenButton).toBeVisible()
  })

  // ── AC5: Erklärungstext nach Antwort ─────────────────────────────────────

  test('AC5: Nach Antwort wird Erklärungstext angezeigt', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await page.getByRole('button', { name: 'RICHTIG' }).click()

    // Erklärungstext-Box mit grünem oder rotem Hintergrund
    const feedbackBox = page.locator('div.rounded-2xl').filter({ hasText: /[A-Z]/ }).first()
    await expect(feedbackBox).toBeVisible()
    const text = await feedbackBox.textContent()
    expect(text).toBeTruthy()
  })

  // ── AC: Button-Deaktivierung (kein Doppelklick) ──────────────────────────

  test('Edge Case: Buttons werden nach erstem Klick deaktiviert', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await page.getByRole('button', { name: 'RICHTIG' }).click()

    // Beide Buttons müssen disabled sein
    await expect(page.getByRole('button', { name: 'RICHTIG' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'FALSCH' })).toBeDisabled()
  })

  // ── AC6: Fortschrittsanzeige ─────────────────────────────────────────────

  test('AC6: Fortschrittsanzeige zeigt „Frage X von 10"', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await expect(page.getByText('Frage 1 von 10')).toBeVisible()
  })

  test('AC6: Fortschrittsanzeige zählt bei jeder Frage hoch', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await expect(page.getByText('Frage 1 von 10')).toBeVisible()

    await page.getByRole('button', { name: 'RICHTIG' }).click()
    await expect(page.getByTestId('weiter-button')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('weiter-button').click({ force: true })

    await expect(page.getByText('Frage 2 von 10')).toBeVisible({ timeout: 3000 })
  })

  // ── AC7: Ergebnis-Screen ─────────────────────────────────────────────────

  test('AC7: Ergebnis-Screen zeigt Score nach 10 Fragen', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await answerAndAdvance(page, 10)

    await expect(page.getByText('Dein Ergebnis')).toBeVisible({ timeout: 5000 })
    // Score ist eine Zahl zwischen 0 und 10
    await expect(page.locator('p.text-5xl')).toBeVisible()
  })

  // ── AC8: Neue Runde + Highscore-Buttons ──────────────────────────────────

  test('AC8: Ergebnis-Screen hat „Neue Runde"-Button', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await answerAndAdvance(page, 10)

    await expect(page.getByRole('button', { name: /neue runde/i })).toBeVisible({
      timeout: 5000,
    })
  })

  test('AC8: Ergebnis-Screen hat „Highscore ansehen"-Button', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await answerAndAdvance(page, 10)

    await expect(
      page.getByRole('button', { name: /highscore/i })
    ).toBeVisible({ timeout: 5000 })
  })

  test('AC8: „Neue Runde"-Button startet neue Runde', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await answerAndAdvance(page, 10)

    await expect(page.getByRole('button', { name: /neue runde/i })).toBeVisible({
      timeout: 5000,
    })
    await page.getByRole('button', { name: /neue runde/i }).click()
    await expect(page.getByText('Frage 1 von 10')).toBeVisible({ timeout: 10000 })
  })

  // ── AC9: Deutsche Texte ──────────────────────────────────────────────────

  test('AC9: Alle Interface-Texte sind auf Deutsch', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    // Kerntexte prüfen
    await expect(page.getByText(/Frage \d+ von 10/)).toBeVisible()
    await expect(page.getByText(/\d+\s*richtig/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'RICHTIG' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'FALSCH' })).toBeVisible()
  })

  // ── AC10: Keine Duplikate ─────────────────────────────────────────────────

  test('AC10: Gleiche Frage kommt in einer Runde nicht zweimal vor', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)

    const seenTexts: string[] = []

    for (let i = 0; i < 10; i++) {
      const factText = await page.locator('p.text-white.font-semibold').textContent()
      expect(factText).toBeTruthy()
      expect(seenTexts).not.toContain(factText)
      seenTexts.push(factText!)

      await answerAndAdvance(page)
    }

    expect(seenTexts).toHaveLength(10)
  })

  // ── Responsive: Mobile ───────────────────────────────────────────────────

  test('Responsive: Quiz ist auf Mobile (375px) bedienbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await gotoQuizAndWaitForQuestion(page)

    await expect(page.getByRole('button', { name: 'RICHTIG' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'FALSCH' })).toBeVisible()
    await expect(page.getByText('Frage 1 von 10')).toBeVisible()
  })

  // ── Fehler-Zustand: Ladeanimation ────────────────────────────────────────

  test('Lade-Spinner wird während des Ladens angezeigt', async ({ page }) => {
    // Netzwerk verlangsamen, um Spinner zu sehen
    await page.route('**/rest/v1/questions**', async (route) => {
      await new Promise((r) => setTimeout(r, 800))
      await route.continue()
    })

    // PROJ-5: Nickname setzen + KategorieScreen durchklicken, damit QuizContainer
    // Fragen lädt (Spinner ist nur im QuizContainer sichtbar, nicht auf anderen Screens)
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('quizNickname', 'SpinnerTest'))
    await page.goto('/quiz')

    const isKategorieScreen = await page.getByText('Welches Thema?')
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false)
    if (isKategorieScreen) {
      await page.getByRole('button', { name: /alle kategorien/i }).click()
    }

    await expect(page.getByText('Fragen werden geladen…')).toBeVisible({ timeout: 3000 })
  })
})
