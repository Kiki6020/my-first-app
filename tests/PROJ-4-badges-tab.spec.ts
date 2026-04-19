/**
 * PROJ-4 (Badges Tab): Admin-Panel Badges Tab — E2E Tests (Playwright)
 *
 * Testet den „🏅 Badges"-Tab im Admin-Panel:
 * - Tab-Sichtbarkeit und Ladeverhalten
 * - Badge-Zähler und Lösch-Flow
 * - Sicherheit (unauthentifizierter Zugriff)
 *
 * WICHTIG: Tests laufen seriell (test.describe.configure serial), da alle
 * auf denselben Admin-Benutzer und dieselbe Datenbank zugreifen.
 */

import { test, expect, type Page } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Tirolischlei1!'
const TEST_NICKNAME = 'qa_badge'

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

/** Loggt in den Admin-Bereich ein. */
async function loginAsAdmin(page: Page) {
  await page.goto('/admin')
  const tabsVisible = page.getByRole('tab', { name: /Importieren/i })
  try {
    await tabsVisible.waitFor({ timeout: 3000 })
    return // Bereits eingeloggt
  } catch {
    // noch nicht eingeloggt
  }
  const passwordInput = page.getByPlaceholder('Passwort')
  await passwordInput.waitFor({ timeout: 10000 })
  await passwordInput.fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await expect(page.getByRole('tab', { name: /Importieren/i })).toBeVisible({ timeout: 15000 })
}

/** Navigiert zum Badges-Tab. */
async function goToBadgesTab(page: Page) {
  await loginAsAdmin(page)
  await page.getByRole('tab', { name: /Badges/i }).click()
  // Warten bis Ladeanimation weg ist
  await expect(page.locator('.animate-spin').first()).toBeHidden({ timeout: 10000 })
}

/** Legt einen Test-Badge via /api/badges/check an (gibt keinen Badge wenn bereits vorhanden). */
async function seedTestBadge(page: Page): Promise<boolean> {
  // Zuerst Admin-Session holen (für späteres deleteAllBadges)
  const response = await page.request.post('/api/badges/check', {
    data: {
      nickname: TEST_NICKNAME,
      category: 'Tiere',
      correctQuestionIds: ['qa-test-id-1'],
      totalShown: 1,
    },
  })
  const body = await response.json()
  return body.newBadge === true
}

/** Löscht alle Badges via Admin-API (mit Session). */
async function deleteAllBadgesViaApi(page: Page) {
  // Admin-Session herstellen
  await page.request.post('/api/admin/login', {
    data: { password: ADMIN_PASSWORD },
  })
  await page.request.delete('/api/admin/badges')
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('PROJ-4 Badges Tab: Admin-Panel', () => {

  // Cleanup: Test-Badge nach allen Tests entfernen
  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await deleteAllBadgesViaApi(page)
    await ctx.close()
  })

  // AC1: „🏅 Badges"-Tab ist nach dem Login sichtbar
  test('AC1: Badges-Tab ist im Admin-Panel sichtbar', async ({ page }) => {
    await loginAsAdmin(page)
    const badgesTab = page.getByRole('tab', { name: /Badges/i })
    await expect(badgesTab).toBeVisible()
    await expect(badgesTab).toContainText('🏅')
  })

  // AC2: Tab-Überschrift und Beschreibung werden korrekt angezeigt
  test('AC2: Tab-Titel und Beschreibung stimmen', async ({ page }) => {
    await goToBadgesTab(page)
    await expect(page.getByText('Badges zurücksetzen')).toBeVisible()
    await expect(page.getByText(/Alle vergebenen Kategorie-Badges löschen/i)).toBeVisible()
  })

  // AC3 + AC4: Wenn Badges vorhanden → Zähler und Lösch-Button sichtbar
  test('AC3: Badge-Zähler und Lösch-Button werden angezeigt wenn Badges existieren', async ({ page }) => {
    await deleteAllBadgesViaApi(page) // Start clean
    await seedTestBadge(page)         // Einen Badge anlegen
    await goToBadgesTab(page)

    // Zähler mit 🏅 Emoji
    await expect(page.getByText(/\d+ Badge/i)).toBeVisible()

    // Lösch-Button
    await expect(page.getByRole('button', { name: /Alle Badges löschen/i })).toBeVisible()
  })

  // AC5: Lösch-Button öffnet Bestätigungs-Dialog
  test('AC4: Klick auf Lösch-Button öffnet Bestätigungs-Dialog', async ({ page }) => {
    await goToBadgesTab(page)

    // Sicherstellen, dass Badges vorhanden sind
    const badgeCount = page.getByText(/\d+ Badge/i)
    const isVisible = await badgeCount.isVisible().catch(() => false)
    if (!isVisible) {
      await seedTestBadge(page)
      await page.reload()
      await goToBadgesTab(page)
    }

    await page.getByRole('button', { name: /Alle Badges löschen/i }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByText('Alle Badges löschen?')).toBeVisible()
    await expect(page.getByText(/werden dauerhaft gelöscht/i)).toBeVisible()
  })

  // AC6: Dialog-Inhalt zeigt Badge-Anzahl und Warnung
  test('AC5: Dialog zeigt korrekte Warnung mit Badge-Anzahl', async ({ page }) => {
    await goToBadgesTab(page)

    const badgeCount = page.getByText(/\d+ Badge/i)
    const isVisible = await badgeCount.isVisible().catch(() => false)
    if (!isVisible) {
      await seedTestBadge(page)
      await page.reload()
      await goToBadgesTab(page)
    }

    await page.getByRole('button', { name: /Alle Badges löschen/i }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    // Dialog enthält Warnung über neu verdienen
    await expect(dialog.getByText(/müssen sich ihre Kategorie-Badges neu verdienen/i)).toBeVisible()
  })

  // AC7: "Abbrechen" schließt Dialog ohne zu löschen
  test('AC6: Abbrechen schließt Dialog ohne Badges zu löschen', async ({ page }) => {
    await goToBadgesTab(page)

    const badgeCount = page.getByText(/\d+ Badge/i)
    const isVisible = await badgeCount.isVisible().catch(() => false)
    if (!isVisible) {
      await seedTestBadge(page)
      await page.reload()
      await goToBadgesTab(page)
    }

    // Anzahl merken
    const countText = await page.getByText(/\d+ Badge/i).textContent()

    await page.getByRole('button', { name: /Alle Badges löschen/i }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()

    // Abbrechen
    await page.getByRole('button', { name: 'Abbrechen' }).click()
    await expect(page.getByRole('alertdialog')).toBeHidden({ timeout: 3000 })

    // Zähler unverändert
    await expect(page.getByText(countText!)).toBeVisible()
    await expect(page.getByRole('button', { name: /Alle Badges löschen/i })).toBeVisible()
  })

  // AC8 + AC9: "Alle löschen" löscht Badges, zeigt Erfolgsmeldung
  test('AC7: Alle löschen → Badges gelöscht, Erfolgsmeldung erscheint', async ({ page }) => {
    // Sicherstellen dass mindestens 1 Badge vorhanden
    await deleteAllBadgesViaApi(page)
    await seedTestBadge(page)
    await goToBadgesTab(page)

    await expect(page.getByText(/\d+ Badge/i)).toBeVisible()
    await page.getByRole('button', { name: /Alle Badges löschen/i }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()

    await page.getByRole('button', { name: 'Alle löschen' }).click()

    // Erfolgsmeldung erscheint
    await expect(page.getByText(/Alle Badges wurden gelöscht/i)).toBeVisible({ timeout: 10000 })

    // Lösch-Button weg
    await expect(page.getByRole('button', { name: /Alle Badges löschen/i })).toBeHidden()
  })

  // AC: Leerer Zustand (nach Löschen via UI) zeigt Erfolgsmeldung statt Lösch-Button
  // Hinweis: Dieser Test überprüft den UI-Zustand NACH dem UI-Löschen, nicht den DB-Zustand.
  // Parallel-Worker können die DB beeinflussen, daher prüfen wir nur den Component-State nach dem UI-Delete.
  test('AC8: Leerer Zustand nach UI-Löschen zeigt Erfolgsmeldung statt Lösch-Button', async ({ page }) => {
    // Einen Badge anlegen
    await seedTestBadge(page)
    await goToBadgesTab(page)

    // Sicherstellen, dass Badges vorhanden
    let deleteBtn = page.getByRole('button', { name: /Alle Badges löschen/i })
    if (!(await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      // Kein Badge sichtbar — möglicherweise durch Parallel-Worker gelöscht; aktualisieren
      await page.reload()
      await goToBadgesTab(page)
      deleteBtn = page.getByRole('button', { name: /Alle Badges löschen/i })
      if (!(await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
        // Immer noch kein Badge → Badge-Anlage nochmal versuchen
        await seedTestBadge(page)
        await page.reload()
        await goToBadgesTab(page)
        deleteBtn = page.getByRole('button', { name: /Alle Badges löschen/i })
      }
    }

    // UI-Delete durchführen
    await deleteBtn.click()
    await page.getByRole('button', { name: 'Alle löschen' }).click()

    // Nach UI-Delete: Erfolgsmeldung sichtbar, Lösch-Button weg
    await expect(page.getByText(/Alle Badges wurden gelöscht/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /Alle Badges löschen/i })).toBeHidden({ timeout: 5000 })
  })

  // SEC1: GET /api/admin/badges ohne Session → 401
  test('SEC1: GET /api/admin/badges ohne Authentifizierung → 401', async ({ page }) => {
    const response = await page.request.get('/api/admin/badges', {
      headers: { Cookie: '' }, // Keine Session-Cookie
    })
    // Neues Context ohne Session
    const ctx = await page.context().browser()!.newContext()
    const freshPage = await ctx.newPage()
    const res = await freshPage.request.get('/api/admin/badges')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Nicht autorisiert')
    await ctx.close()
  })

  // SEC2: DELETE /api/admin/badges ohne Session → 401
  test('SEC2: DELETE /api/admin/badges ohne Authentifizierung → 401', async ({ page }) => {
    const ctx = await page.context().browser()!.newContext()
    const freshPage = await ctx.newPage()
    const res = await freshPage.request.delete('/api/admin/badges')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Nicht autorisiert')
    await ctx.close()
  })

  // RES: Badges-Tab auf Mobile (375px) bedienbar
  test('RES1: Badges-Tab auf Mobile (375px) bedienbar', async ({ browser }) => {
    const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } })
    const page = await mobileCtx.newPage()
    await loginAsAdmin(page)
    const badgesTab = page.getByRole('tab', { name: /Badges/i })
    await expect(badgesTab).toBeVisible()
    await badgesTab.click()
    await expect(page.getByText('Badges zurücksetzen')).toBeVisible()
    await mobileCtx.close()
  })

})
