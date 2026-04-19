/**
 * PROJ-3: Streak-Counter — E2E Tests (Playwright)
 *
 * Testet alle Acceptance Criteria gegen die laufende App.
 * Supabase-Fragen werden gemockt (alle is_true: true), damit Streak-Logik
 * deterministisch testbar ist.
 */

import { test, expect, type Page } from '@playwright/test'

const SUPABASE_URL = 'https://anfyyfnmnfkunsqcpipn.supabase.co'

// ─── Mock-Daten ───────────────────────────────────────────────────────────────

function makeMockQuestions(count = 10) {
  return Array.from({ length: count }, (_, i) => ({
    id: `q${i + 1}`,
    fact_text: `Testfrage ${i + 1}: Die Sonne ist ein Stern.`,
    is_true: true,
    explanation: `Das ist korrekt, weil die Sonne ein Stern ist (Frage ${i + 1}).`,
    category: 'Weltraum',
    created_at: '2026-01-01T00:00:00Z',
  }))
}

/** Interceptiert den Supabase-Questions-Aufruf und gibt Testdaten zurück. */
async function mockQuestions(page: Page) {
  await page.route(`${SUPABASE_URL}/rest/v1/questions*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeMockQuestions()),
    })
  })
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

async function gotoQuizAndWaitForQuestion(page: Page) {
  await mockQuestions(page)
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('quizNickname', 'StreakTester'))
  await page.goto('/quiz')
  // PROJ-5: KategorieScreen erscheint nach Nickname — "Alle Kategorien" wählen.
  // "Welches Thema?" ist statischer Text → erscheint sofort nach Seitenrendering.
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

/** Beantwortet N Fragen korrekt (RICHTIG + Weiter). */
async function answerCorrectly(page: Page, count: number) {
  for (let i = 0; i < count; i++) {
    await page.getByRole('button', { name: 'RICHTIG' }).click()
    await expect(page.getByTestId('weiter-button')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('weiter-button').click({ force: true })
    await page.waitForTimeout(400)
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('PROJ-3: Streak-Counter mit Trommelwirbel-Animation', () => {

  // ── AC: Streak-Badge im Header ────────────────────────────────────────────

  test('AC: Streak-Badge erscheint nach erster richtiger Antwort', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await page.getByRole('button', { name: 'RICHTIG' }).click()
    await expect(page.getByText('🥁 1')).toBeVisible()
  })

  test('AC: Streak-Counter erhöht sich bei jeder richtigen Antwort', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await answerCorrectly(page, 1)
    await page.getByRole('button', { name: 'RICHTIG' }).click()
    await expect(page.getByText('🥁 2')).toBeVisible()
  })

  test('AC: Streak-Counter wird bei falscher Antwort auf 0 zurückgesetzt', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await answerCorrectly(page, 2)
    // Badge zeigt aktuell ≥1
    await expect(page.locator('span.text-amber-400')).toBeVisible()
    // Falsche Antwort → FALSCH klicken (alle Fragen sind is_true: true, also ist FALSCH falsch)
    await page.getByRole('button', { name: 'FALSCH' }).click()
    // Badge verschwindet (streak = 0)
    await expect(page.locator('span.text-amber-400')).not.toBeVisible({ timeout: 2000 })
  })

  // ── AC: „Serie beendet"-Toast ────────────────────────────────────────────

  test('AC: „Serie beendet"-Toast erscheint wenn Streak nach mind. 1 richtigem abbricht', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await answerCorrectly(page, 2)
    await page.getByRole('button', { name: 'FALSCH' }).click()
    await expect(page.getByText('Serie beendet')).toBeVisible({ timeout: 2000 })
  })

  test('AC: Kein „Serie beendet"-Toast bei erster falscher Antwort (Streak war 0)', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await page.getByRole('button', { name: 'FALSCH' }).click()
    await expect(page.getByText('Serie beendet')).not.toBeVisible({ timeout: 1500 })
  })

  // ── AC: Meilenstein-Overlay bei Streak 5 ────────────────────────────────

  test('AC: Trommelwirbel-Overlay erscheint bei Streak 5 mit „Wow!" und „5 in Folge"', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await answerCorrectly(page, 4)
    await page.getByRole('button', { name: 'RICHTIG' }).click()
    await expect(page.getByText('Wow!')).toBeVisible({ timeout: 2000 })
    await expect(page.getByText('5 in Folge')).toBeVisible()
  })

  test('AC: Trommelwirbel-Overlay bei Streak 5 zeigt 🥁 mit Bounce-Animation', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await answerCorrectly(page, 4)
    await page.getByRole('button', { name: 'RICHTIG' }).click()
    await expect(page.locator('.animate-drum-md')).toBeVisible({ timeout: 2000 })
  })

  test('AC: Trommelwirbel-Overlay verschwindet nach ~3 Sekunden', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await answerCorrectly(page, 4)
    await page.getByRole('button', { name: 'RICHTIG' }).click()
    await expect(page.getByText('Wow!')).toBeVisible({ timeout: 2000 })
    await page.waitForTimeout(3500)
    await expect(page.getByText('Wow!')).not.toBeVisible()
  })

  test('AC: Trommelwirbel-Overlay verschwindet sofort beim Klick auf Weiter', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await answerCorrectly(page, 4)
    await page.getByRole('button', { name: 'RICHTIG' }).click()
    await expect(page.getByText('Wow!')).toBeVisible({ timeout: 2000 })
    await page.getByTestId('weiter-button').click({ force: true })
    await expect(page.getByText('Wow!')).not.toBeVisible()
  })

  // ── AC: Meilenstein-Overlay bei Streak 10 ───────────────────────────────

  test('AC: Trommelwirbel-Overlay bei Streak 10 zeigt „Strike!" / „Alle richtig"', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    await answerCorrectly(page, 9)
    await page.getByRole('button', { name: 'RICHTIG' }).click()
    await expect(page.getByText('Strike!')).toBeVisible({ timeout: 2000 })
    await expect(page.getByText('Alle richtig')).toBeVisible()
  })

  // ── AC: Ergebnis-Screen — maxStreak ─────────────────────────────────────

  test('AC: Längste Serie auf Ergebnis-Screen — Streak 3 korrekt angezeigt', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    // 3 richtig, dann Rest falsch
    await answerCorrectly(page, 3)
    for (let i = 3; i < 10; i++) {
      await page.getByRole('button', { name: 'FALSCH' }).click()
      await expect(page.getByTestId('weiter-button')).toBeVisible({ timeout: 5000 })
      await page.getByTestId('weiter-button').click({ force: true })
      await page.waitForTimeout(500)
    }
    // Warte bis Ergebnis-Screen geladen ist
    await expect(page.getByText('Dein Ergebnis')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('p:has-text("ngste Serie")')).toBeVisible({ timeout: 3000 })
    // Streak-Zahl in Amber hervorgehoben
    await expect(page.locator('span.text-amber-400').filter({ hasText: '3' })).toBeVisible()
  })

  test('AC: Längste Serie wird NICHT angezeigt wenn alle Antworten falsch waren', async ({ page }) => {
    await gotoQuizAndWaitForQuestion(page)
    for (let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: 'FALSCH' }).click()
      if (i < 9) {
        await expect(page.getByTestId('weiter-button')).toBeVisible({ timeout: 5000 })
        await page.getByTestId('weiter-button').click({ force: true })
        await page.waitForTimeout(400)
      }
    }
    await expect(page.getByText('Längste Serie:')).not.toBeVisible({ timeout: 3000 })
  })

  // ── Responsiveness ────────────────────────────────────────────────────────

  test('Responsiveness: Streak-Badge auf Mobile (375px) sichtbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await gotoQuizAndWaitForQuestion(page)
    await page.getByRole('button', { name: 'RICHTIG' }).click()
    await expect(page.getByText('🥁 1')).toBeVisible()
  })

  test('Responsiveness: Meilenstein-Overlay auf Mobile (375px) lesbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await gotoQuizAndWaitForQuestion(page)
    await answerCorrectly(page, 4)
    await page.getByRole('button', { name: 'RICHTIG' }).click()
    await expect(page.getByText('Wow!')).toBeVisible({ timeout: 2000 })
    await expect(page.getByText('5 in Folge')).toBeVisible()
  })

})
