/**
 * PROJ-4: Fragen-Import — E2E Tests (Playwright)
 *
 * Testet alle Acceptance Criteria gegen die laufende App.
 * Login wird über die echte /api/admin/login API durchgeführt.
 * Das ADMIN_PASSWORD muss in .env.local gesetzt sein.
 *
 * WICHTIG: Tests laufen seriell (test.describe.configure serial), da alle
 * auf denselben Admin-Benutzer und dieselbe Datenbank zugreifen.
 */

import { test, expect, type Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import os from 'os'

test.describe.configure({ mode: 'serial' })

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Tirolischlei1!'

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

/** Loggt in den Admin-Bereich ein und wartet auf das Admin-Dashboard. */
async function loginAsAdmin(page: Page) {
  await page.goto('/admin')
  // Warten bis entweder die Login-Form oder das Dashboard sichtbar ist
  const passwordInput = page.getByPlaceholder('Passwort')
  const tabsVisible = page.getByRole('tab', { name: /Importieren/i })

  try {
    await tabsVisible.waitFor({ timeout: 3000 })
    return // Bereits eingeloggt
  } catch {
    // noch nicht eingeloggt
  }

  await passwordInput.waitFor({ timeout: 10000 })
  await passwordInput.fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await expect(page.getByRole('tab', { name: /Importieren/i })).toBeVisible({ timeout: 15000 })
}

/** Erstellt eine temporäre CSV-Datei mit Testfragen. */
function createCsvFile(rows: { frage: string; antwort: string; erklaerung: string; kategorie: string }[]): string {
  const header = 'frage,antwort,erklaerung,kategorie'
  const lines = rows.map(
    (r) => `"${r.frage}","${r.antwort}","${r.erklaerung}","${r.kategorie}"`
  )
  const content = [header, ...lines].join('\n')
  const tmpFile = path.join(os.tmpdir(), `test-fragen-${Date.now()}.csv`)
  fs.writeFileSync(tmpFile, content, 'utf-8')
  return tmpFile
}

/** Erstellt eine temporäre JSON-Datei mit Testfragen. */
function createJsonFile(rows: object[]): string {
  const tmpFile = path.join(os.tmpdir(), `test-fragen-${Date.now()}.json`)
  fs.writeFileSync(tmpFile, JSON.stringify(rows), 'utf-8')
  return tmpFile
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('PROJ-4: Fragen-Import', () => {

  // AC1: Die Admin-Seite ist unter /admin erreichbar
  test('AC1: Admin-Seite ist unter /admin erreichbar', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/admin/)
    // Entweder Login-Formular oder Admin-Dashboard muss sichtbar sein
    await Promise.race([
      page.getByPlaceholder('Passwort').waitFor({ timeout: 10000 }),
      page.getByText('Admin-Bereich').first().waitFor({ timeout: 10000 }),
    ])
  })

  // AC2: Die Admin-Seite ist durch ein Passwort geschützt
  test('AC2: Falsches Passwort zeigt Fehlermeldung', async ({ page }) => {
    // Erst sicherstellen, dass wir ausgeloggt sind
    await page.request.delete('/api/admin/login')
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Wenn bereits eingeloggt: ausloggen
    const logoutBtn = page.getByRole('button', { name: /Abmelden/i })
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
      await page.waitForLoadState('networkidle')
    }

    await page.getByPlaceholder('Passwort').waitFor({ timeout: 5000 })
    await page.getByPlaceholder('Passwort').fill('falschesPasswort123')
    await page.getByRole('button', { name: 'Anmelden' }).click()
    await expect(page.getByText('Falsches Passwort')).toBeVisible({ timeout: 5000 })
  })

  test('AC2: Korrektes Passwort öffnet das Admin-Dashboard', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByText('Admin-Bereich').first()).toBeVisible()
    await expect(page.getByRole('tab', { name: /Importieren/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Fragen verwalten/i })).toBeVisible()
  })

  // AC3: CSV-Import
  test('AC3: CSV-Datei wird hochgeladen und Vorschau wird angezeigt', async ({ page }) => {
    await loginAsAdmin(page)

    const csvFile = createCsvFile([
      {
        frage: 'QA-Test-Frage CSV Einzigartig 99887766.',
        antwort: 'wahr',
        erklaerung: 'Das ist eine Testfrage für QA.',
        kategorie: 'Tiere',
      },
    ])

    await page.getByRole('tab', { name: /Importieren/i }).click()
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(csvFile)

    await expect(page.getByRole('heading', { name: 'Vorschau' })).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('QA-Test-Frage CSV Einzigartig 99887766.')).toBeVisible()

    fs.unlinkSync(csvFile)
  })

  // AC4: JSON-Import
  test('AC4: JSON-Datei wird hochgeladen und Vorschau wird angezeigt', async ({ page }) => {
    await loginAsAdmin(page)

    const jsonFile = createJsonFile([
      {
        frage: 'QA-Test-Frage JSON Einzigartig 11223344.',
        antwort: 'falsch',
        erklaerung: 'Das ist eine JSON-Testfrage für QA.',
        kategorie: 'Weltraum',
      },
    ])

    await page.getByRole('tab', { name: /Importieren/i }).click()
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(jsonFile)

    await expect(page.getByRole('heading', { name: 'Vorschau' })).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('QA-Test-Frage JSON Einzigartig 11223344.')).toBeVisible()

    fs.unlinkSync(jsonFile)
  })

  // AC5: Vorschau zeigt Anzahl gültiger Fragen als Badge
  test('AC5: Vorschau zeigt Anzahl der gültigen Fragen', async ({ page }) => {
    await loginAsAdmin(page)

    const csvFile = createCsvFile([
      { frage: 'Vorschau-Frage A.', antwort: 'wahr', erklaerung: 'Erklärung A.', kategorie: 'Natur' },
      { frage: 'Vorschau-Frage B.', antwort: 'falsch', erklaerung: 'Erklärung B.', kategorie: 'Natur' },
    ])

    await page.getByRole('tab', { name: /Importieren/i }).click()
    await page.locator('input[type="file"]').setInputFiles(csvFile)

    await expect(page.getByRole('heading', { name: 'Vorschau' })).toBeVisible({ timeout: 8000 })
    // Badge mit "gültig" muss sichtbar sein (z.B. "2 gültig")
    await expect(page.locator('text=/\\d+ gültig/')).toBeVisible({ timeout: 5000 })

    fs.unlinkSync(csvFile)
  })

  // AC6: Abbrechen-Button löscht die Vorschau
  test('AC6: Abbrechen-Button löscht die Vorschau', async ({ page }) => {
    await loginAsAdmin(page)

    const csvFile = createCsvFile([
      { frage: 'Abbrechen-Test-Frage.', antwort: 'wahr', erklaerung: 'Erklärung.', kategorie: 'Tiere' },
    ])

    await page.getByRole('tab', { name: /Importieren/i }).click()
    await page.locator('input[type="file"]').setInputFiles(csvFile)
    await expect(page.getByRole('heading', { name: 'Vorschau' })).toBeVisible({ timeout: 8000 })

    await page.getByRole('button', { name: 'Abbrechen' }).click()
    await expect(page.getByRole('heading', { name: 'Vorschau' })).not.toBeVisible()

    fs.unlinkSync(csvFile)
  })

  // AC7: Duplikate werden erkannt und markiert
  test('AC7: Bekannte Duplikate werden in der Vorschau als "Duplikat" markiert', async ({ page }) => {
    await loginAsAdmin(page)

    // Seed-Frage: Delfine schlafen mit einem Auge offen. (100% in der DB)
    const csvFile = createCsvFile([
      {
        frage: 'Delfine schlafen mit einem Auge offen.',
        antwort: 'wahr',
        erklaerung: 'Delfine schlafen tatsächlich mit einer Gehirnhälfte.',
        kategorie: 'Tiere',
      },
    ])

    await page.getByRole('tab', { name: /Importieren/i }).click()
    // Warten bis die existingTexts geladen sind (API-Call im useEffect)
    await page.waitForLoadState('networkidle')
    await page.locator('input[type="file"]').setInputFiles(csvFile)
    await expect(page.getByRole('heading', { name: 'Vorschau' })).toBeVisible({ timeout: 8000 })
    // Duplikat-Badge soll sichtbar sein
    await expect(page.locator('text=/\\d+ Duplikat/')).toBeVisible({ timeout: 5000 })

    fs.unlinkSync(csvFile)
  })

  // Edge Case: Ungültige CSV-Spalten → Fehlermeldung
  test('Edge Case: CSV mit falschen Spalten zeigt Fehlermeldung', async ({ page }) => {
    await loginAsAdmin(page)

    const tmpFile = path.join(os.tmpdir(), `test-bad-${Date.now()}.csv`)
    fs.writeFileSync(tmpFile, 'question,answer,explanation,category\n"A question","true","Explanation","Nature"', 'utf-8')

    await page.getByRole('tab', { name: /Importieren/i }).click()
    await page.locator('input[type="file"]').setInputFiles(tmpFile)
    await expect(page.getByText('Ungültiges Format')).toBeVisible({ timeout: 5000 })

    fs.unlinkSync(tmpFile)
  })

  // Edge Case: Leere Datei → Fehlermeldung
  test('Edge Case: Leere CSV-Datei zeigt Fehlermeldung', async ({ page }) => {
    await loginAsAdmin(page)

    const tmpFile = path.join(os.tmpdir(), `test-empty-${Date.now()}.csv`)
    fs.writeFileSync(tmpFile, '', 'utf-8')

    await page.getByRole('tab', { name: /Importieren/i }).click()
    await page.locator('input[type="file"]').setInputFiles(tmpFile)
    await expect(page.getByText(/enthält keine Fragen|Ungültiges Format/i)).toBeVisible({ timeout: 5000 })

    fs.unlinkSync(tmpFile)
  })

  // Edge Case: Ungültige Antwort → Zeile als ungültig markiert
  test('Edge Case: Zeile mit ungültigem antwort-Wert wird als "ungültig" markiert', async ({ page }) => {
    await loginAsAdmin(page)

    const csvFile = createCsvFile([
      { frage: 'Frage mit ungültiger Antwort.', antwort: 'vielleicht', erklaerung: 'Erklärung.', kategorie: 'Natur' },
    ])

    await page.getByRole('tab', { name: /Importieren/i }).click()
    await page.locator('input[type="file"]').setInputFiles(csvFile)
    await expect(page.getByRole('heading', { name: 'Vorschau' })).toBeVisible({ timeout: 8000 })
    // "ungültig" Badge in der Vorschau
    await expect(page.locator('text=/\\d+ ungültig/')).toBeVisible({ timeout: 5000 })

    fs.unlinkSync(csvFile)
  })

  // AC9: Paginierte Frageliste (20 pro Seite)
  test('AC9: Fragen-Tab zeigt paginierte Liste mit Seitennavigation', async ({ page }) => {
    await loginAsAdmin(page)

    await page.getByRole('tab', { name: /Fragen verwalten/i }).click()
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Fragen gesamt/i)).toBeVisible()
    // Bei 100+ Fragen: Pagination vorhanden
    await expect(page.getByText(/Seite \d+ von \d+/i)).toBeVisible()
  })

  // AC9: Pagination - Weiter-Button funktioniert
  test('AC9: Pagination — Nächste Seite lädt andere Fragen', async ({ page }) => {
    await loginAsAdmin(page)
    await page.getByRole('tab', { name: /Fragen verwalten/i }).click()
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Seite 1 von')).toBeVisible()

    // ChevronRight icon button finden und klicken
    const iconButtons = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') })
    await iconButtons.click({ timeout: 5000 })
    await expect(page.getByText('Seite 2 von')).toBeVisible({ timeout: 5000 })
  })

  // AC10: Löschen mit Bestätigungs-Dialog
  test('AC10: Löschen-Button öffnet Bestätigungs-Dialog', async ({ page }) => {
    await loginAsAdmin(page)
    await page.getByRole('tab', { name: /Fragen verwalten/i }).click()
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })

    // Löschen-Buttons in der Tabelle (Trash2-Icon-Buttons)
    const deleteButtons = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') })
    await deleteButtons.first().click()
    await expect(page.getByText('Frage löschen?')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('dauerhaft gelöscht')).toBeVisible()
    // Abbrechen statt wirklich löschen
    await page.getByRole('button', { name: 'Abbrechen' }).click()
    await expect(page.getByText('Frage löschen?')).not.toBeVisible()
  })

  // AC: Download CSV-Vorlage
  test('AC: CSV-Vorlage kann heruntergeladen werden', async ({ page }) => {
    await loginAsAdmin(page)
    await page.getByRole('tab', { name: /Importieren/i }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /CSV-Vorlage/i }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('fragen-vorlage.csv')
  })

  // Security: Unauthentifizierter Zugriff auf Admin-API → 401
  test('Security: /api/admin/questions ohne Cookie → 401', async ({ page }) => {
    // Neuen Request-Context ohne Cookies erstellen
    const response = await page.request.get('/api/admin/questions?page=1', {
      headers: { cookie: '' },
    })
    expect(response.status()).toBe(401)
  })

  // AC: Abmelden-Button
  test('AC: Abmelden-Button beendet die Sitzung', async ({ page }) => {
    await loginAsAdmin(page)
    await page.getByRole('button', { name: /Abmelden/i }).click()
    await expect(page.getByPlaceholder('Passwort')).toBeVisible({ timeout: 5000 })
  })

  // Responsiveness: Mobile (375px)
  test('Responsiveness: Admin-Login auf Mobile (375px) bedienbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    // Ausloggen für diesen Test
    await page.request.delete('/api/admin/login')
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    // Ggf. Logout-Button vorhanden
    const logoutBtn = page.getByRole('button', { name: /Abmelden/i })
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
    }
    await expect(page.getByPlaceholder('Passwort')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible()
  })

  // AC11: Seed-Daten vorhanden (min. 100 Fragen)
  test('AC11: Seed-Daten sind in der Datenbank vorhanden (≥100 Fragen)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.getByRole('tab', { name: /Fragen verwalten/i }).click()
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 })
    // Mindestens 100 Fragen gesamt
    await expect(page.locator('text=/^(10[0-9]|[1-9]\\d{2,}) Fragen gesamt/')).toBeVisible({ timeout: 5000 })
  })

  // Note: Rate Limiting (3 Versuche → 30s Sperrzeit) wird manuell und via curl-Test verifiziert.
  // Ein E2E-Test würde die localhost-IP für alle nachfolgenden Tests sperren.

})
