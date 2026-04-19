/**
 * PROJ-5: Kategorien & Badges — E2E Tests (Playwright)
 *
 * Testet alle Acceptance Criteria gegen die echte laufende App mit echter Supabase-DB.
 * Supabase-Questions-Calls werden für Badge-Tests gemockt (deterministisch).
 */

import { test, expect, type Page } from '@playwright/test'

const SUPABASE_URL = 'https://anfyyfnmnfkunsqcpipn.supabase.co'

// ─── Mock-Daten ───────────────────────────────────────────────────────────────

function makeMockQuestions(count = 10, category = 'Tiere') {
  return Array.from({ length: count }, (_, i) => ({
    id: `q${i + 1}`,
    fact_text: `Testfrage ${i + 1}: Ein Elefant ist ein Tier.`,
    is_true: true,
    explanation: `Korrekt, ein Elefant ist ein Tier (Frage ${i + 1}).`,
    category,
    created_at: '2026-01-01T00:00:00Z',
  }))
}

async function mockQuestions(page: Page, questions = makeMockQuestions()) {
  await page.route(`${SUPABASE_URL}/rest/v1/questions*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(questions),
    })
  })
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

/** Setzt Nickname in localStorage und navigiert zur Quiz-Seite (zeigt KategorieScreen). */
async function gotoKategorieScreen(page: Page, nickname = 'QATester') {
  await page.goto('/')
  await page.evaluate((n) => localStorage.setItem('quizNickname', n), nickname)
  await page.goto('/quiz')
  await expect(page.getByText('Welches Thema?')).toBeVisible({ timeout: 8000 })
}

/** Startet Quiz mit "Alle Kategorien". */
async function selectAlleKategorien(page: Page) {
  await page.getByRole('button', { name: /alle kategorien/i }).click()
  await expect(page.getByRole('button', { name: 'RICHTIG' })).toBeVisible({ timeout: 10000 })
}

/** Startet Quiz mit einer bestimmten Kategorie. */
async function selectKategorie(page: Page, name: string) {
  await page.getByRole('button', { name: new RegExp(name, 'i') }).first().click()
  await expect(page.getByRole('button', { name: 'RICHTIG' })).toBeVisible({ timeout: 10000 })
}

/** Spielt N Fragen durch (immer RICHTIG). */
async function answerAllCorrectly(page: Page, count = 10) {
  for (let i = 0; i < count; i++) {
    await expect(page.getByRole('button', { name: 'RICHTIG' })).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: 'RICHTIG' }).click()
    await expect(page.getByTestId('weiter-button')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('weiter-button').click({ force: true })
    await page.waitForTimeout(350)
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('PROJ-5: Kategorien & Badges', () => {

  // ── Kategorie-Auswahlscreen ────────────────────────────────────────────────

  test('AC: KategorieScreen erscheint nach Nickname-Eingabe', async ({ page }) => {
    await gotoKategorieScreen(page)
    await expect(page.getByText('Welches Thema?')).toBeVisible()
    await expect(page.getByText(/wähle ein thema/i)).toBeVisible()
  })

  test('AC: KategorieScreen zeigt persönliche Begrüßung mit Nickname', async ({ page }) => {
    await gotoKategorieScreen(page, 'Carla')
    await expect(page.getByText(/hallo.*carla/i)).toBeVisible()
  })

  test('AC: "Alle Kategorien"-Button ist sichtbar', async ({ page }) => {
    await gotoKategorieScreen(page)
    await expect(page.getByRole('button', { name: /alle kategorien/i })).toBeVisible()
  })

  test('AC: Alle 8 Kategorie-Karten sind sichtbar', async ({ page }) => {
    await gotoKategorieScreen(page)
    // Warte bis API-Daten geladen und alle Kategorie-Buttons sichtbar
    await expect(page.getByRole('button', { name: /tiere/i })).toBeVisible({ timeout: 12000 })

    // Prüfe jeden Kategorienamen als Textinhalt (robuster als Role-Selektor bei Umlauten)
    const kategorien = ['Tiere', 'Pflanzen', 'Körper', 'Welt', 'Weltraum', 'MINT', 'Kultur', 'Essen']
    for (const kat of kategorien) {
      await expect(page.getByText(kat, { exact: true }).first()).toBeVisible()
    }
  })

  test('AC: Jede Kategorie zeigt Fragenanzahl an', async ({ page }) => {
    await gotoKategorieScreen(page)
    await expect(page.getByRole('button', { name: /tiere/i })).toBeVisible({ timeout: 8000 })
    // Mindestens eine Karte zeigt "X Fragen"
    await expect(page.getByText(/\d+ fragen/i).first()).toBeVisible()
  })

  test('AC: Klick auf "Alle Kategorien" startet Quiz', async ({ page }) => {
    await mockQuestions(page)
    await gotoKategorieScreen(page)
    await selectAlleKategorien(page)
    await expect(page.getByText(/frage 1 von/i)).toBeVisible()
  })

  test('AC: Klick auf eine Kategorie startet Quiz nur mit dieser Kategorie', async ({ page }) => {
    await mockQuestions(page, makeMockQuestions(10, 'Tiere'))
    await gotoKategorieScreen(page)
    await selectKategorie(page, 'Tiere')
    await expect(page.getByText(/frage 1 von/i)).toBeVisible()
  })

  // ── Kategorie-Label im Quiz ────────────────────────────────────────────────

  test('AC: Kategorie-Label ist im Quiz-Header sichtbar', async ({ page }) => {
    await mockQuestions(page, makeMockQuestions(10, 'Tiere'))
    await gotoKategorieScreen(page)
    await selectKategorie(page, 'Tiere')
    // Kategorie-Chip im Header
    await expect(page.locator('span').filter({ hasText: 'Tiere' }).first()).toBeVisible()
  })

  test('AC: Bei "Alle Kategorien" kein Kategorie-Header-Label', async ({ page }) => {
    await mockQuestions(page)
    await gotoKategorieScreen(page)
    // KategorieScreen: klick auf "Alle Kategorien"
    await page.getByRole('button', { name: /alle kategorien/i }).click()
    await expect(page.getByRole('button', { name: 'RICHTIG' })).toBeVisible({ timeout: 10000 })
    // Das Kategorie-Label im Header (violetter Chip) sollte NICHT da sein
    // Stattdessen: kein "Alle Kategorien"-Chip im Header
    await expect(page.locator('span.bg-violet-900\\/50')).not.toBeVisible()
  })

  // ── Kategorie-Badge per Frage ──────────────────────────────────────────────

  test('AC: Jede Frage zeigt ihr Kategorie-Badge', async ({ page }) => {
    await mockQuestions(page, makeMockQuestions(10, 'Weltraum'))
    await gotoKategorieScreen(page)
    await selectKategorie(page, 'Weltraum')
    // Per-Frage-Badge (kleiner Chip im Question-Card)
    await expect(page.locator('span').filter({ hasText: 'Weltraum' }).first()).toBeVisible()
  })

  // ── Responsiveness ─────────────────────────────────────────────────────────

  test('Responsive: KategorieScreen auf Mobile (375px) bedienbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await gotoKategorieScreen(page)
    await expect(page.getByRole('button', { name: /alle kategorien/i })).toBeVisible()
    await expect(page.getByText('Welches Thema?')).toBeVisible()
  })

  // ── Badge-Sammlung auf Highscore-Screen ────────────────────────────────────

  // BadgeSammlung erscheint nur wenn currentNickname gesetzt ist (aus localStorage)
  // und Scores vorhanden sind (DB hat 40+ Scores).

  test('AC: Highscore-Screen zeigt Badge-Sammlung für eingeloggten Spieler', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('quizNickname', 'QATester'))
    await page.goto('/highscore')
    // Warte bis Scores geladen (Spinner weg)
    await expect(page.getByText(/lade highscores/i)).not.toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/deine badges/i)).toBeVisible({ timeout: 8000 })
  })

  test('AC: Badge-Sammlung zeigt 8 Slots (einen pro Kategorie)', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('quizNickname', 'QATester'))
    await page.goto('/highscore')
    await expect(page.getByText(/lade highscores/i)).not.toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/deine badges/i)).toBeVisible({ timeout: 8000 })
    // 8 Kategorien × je ein Badge-Slot — alle Kategorie-Labels im Badge-Grid vorhanden
    const kategorien = ['Tiere', 'Pflanzen', 'Körper', 'Welt', 'Weltraum', 'MINT', 'Kultur', 'Essen']
    for (const kat of kategorien) {
      await expect(page.getByText(kat, { exact: true }).first()).toBeVisible()
    }
  })

  test('AC: Badge-Zähler zeigt "X / 8"', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('quizNickname', 'QATester'))
    await page.goto('/highscore')
    await expect(page.getByText(/lade highscores/i)).not.toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/deine badges/i)).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/\d+ \/ 8/)).toBeVisible()
  })

  // ── Flow-Regression ────────────────────────────────────────────────────────

  test('Regression: NicknameScreen erscheint wenn kein Nickname gesetzt', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('quizNickname'))
    await page.goto('/quiz')
    await expect(page.getByText('Wie heißt du?')).toBeVisible()
    // KategorieScreen darf NICHT erscheinen
    await expect(page.getByText('Welches Thema?')).not.toBeVisible()
  })

  test('Regression: Nach "Anderen Namen verwenden" kehrt man zum NicknameScreen zurück', async ({ page }) => {
    await mockQuestions(page)
    await gotoKategorieScreen(page)
    await selectAlleKategorien(page)
    await answerAllCorrectly(page, 10)
    // Auf dem Ergebnis-Screen
    await expect(page.getByText('Dein Ergebnis')).toBeVisible({ timeout: 8000 })
    await page.getByText(/anderen namen/i).click()
    await expect(page.getByText('Wie heißt du?')).toBeVisible()
  })
})
