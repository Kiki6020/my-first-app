/**
 * PROJ-6: Highscore löschen im Admin-Panel — E2E Tests (Playwright)
 *
 * Testet alle Acceptance Criteria gegen die laufende App.
 * Seed-Daten werden über /api/scores eingesetzt und am Ende bereinigt.
 * Tests laufen seriell, da sie auf dieselbe Datenbank zugreifen.
 */

import { test, expect, type Page } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Tirolischlei1!'
const TEST_NICKNAME = 'QATest-P6'  // max 12 chars, matches /^[a-zA-Z0-9äöüÄÖÜß\-]+$/

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

async function loginAsAdmin(page: Page) {
  await page.goto('/admin')

  const tabs = page.getByRole('tab', { name: /Importieren/i })
  try {
    await tabs.waitFor({ timeout: 3000 })
    return // already logged in
  } catch {
    // fall through to login
  }

  await page.getByPlaceholder('Passwort').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await expect(page.getByRole('tab', { name: /Importieren/i })).toBeVisible({ timeout: 15000 })
}

async function gotoHighscoresTab(page: Page) {
  await loginAsAdmin(page)
  await page.getByRole('tab', { name: /Highscores/i }).click()
  // Wait until table OR empty state is visible (data has loaded)
  await expect(
    page.getByRole('columnheader', { name: 'Spitzname' }).or(
      page.getByText('Noch keine Highscores vorhanden')
    )
  ).toBeVisible({ timeout: 10000 })
}

/** Fügt einen Test-Score über die API ein. Gibt die ID zurück. */
async function seedTestScore(page: Page, score = 7): Promise<string> {
  const res = await page.request.post('/api/scores', {
    data: { nickname: TEST_NICKNAME, score, total_questions: 10 },
  })
  if (!res.ok()) {
    throw new Error(`seedTestScore failed: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  return body.score?.id as string
}

/** Löscht einen Score über die Admin-API (Cleanup). */
async function cleanupScore(page: Page, id: string) {
  await page.request.delete(`/api/admin/scores/${id}`)
}

// ─── Setup ───────────────────────────────────────────────────────────────────

/** Loggt über die API ein (setzt admin_session Cookie im Browser-Kontext). */
async function apiLogin(page: Page) {
  await page.request.post('/api/admin/login', {
    data: { password: ADMIN_PASSWORD },
  })
}

/** Bereinigt alle Test-Scores vor jedem Test (Überreste aus fehlgeschlagenen Runs). */
test.beforeEach(async ({ page }) => {
  await apiLogin(page)
  const res = await page.request.get('/api/admin/scores')
  if (!res.ok()) return
  const body = await res.json()
  for (const s of (body.scores ?? []) as { id: string; nickname: string }[]) {
    if (s.nickname === TEST_NICKNAME) {
      await page.request.delete(`/api/admin/scores/${s.id}`)
    }
  }
})

// ─── Tests ───────────────────────────────────────────────────────────────────

test('AC1: Highscores-Tab ist im Admin-Panel sichtbar', async ({ page }) => {
  await loginAsAdmin(page)
  await expect(page.getByRole('tab', { name: /Highscores/i })).toBeVisible()
})

test('AC2: Tab zeigt Tabelle mit Spitzname, Score, Datum und Löschen-Button', async ({ page }) => {
  const id = await seedTestScore(page)

  await gotoHighscoresTab(page)

  // Spaltenüberschriften
  await expect(page.getByRole('columnheader', { name: 'Spitzname' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Score' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: /Datum/i })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Aktion' })).toBeVisible()

  // Test-Eintrag sichtbar
  await expect(page.getByRole('cell', { name: TEST_NICKNAME }).first()).toBeVisible()
  await expect(page.getByText('7/10').first()).toBeVisible()

  await cleanupScore(page, id)
})

test('AC3: Tabelle ist nach Score absteigend sortiert', async ({ page }) => {
  // Seed zwei Scores mit unterschiedlichen Punktzahlen
  const id1 = await seedTestScore(page, 3)
  const id2 = await seedTestScore(page, 9)

  await gotoHighscoresTab(page)

  // Alle Zeilen holen und prüfen ob höherer Score zuerst kommt
  const rows = page.getByRole('row')
  const rowCount = await rows.count()

  // Alle Score-Badges finden (Format: "X/10")
  const scores: number[] = []
  for (let i = 1; i < rowCount; i++) {
    const badgeText = await rows.nth(i).getByText(/\/10/).textContent()
    if (badgeText) {
      const val = parseInt(badgeText.split('/')[0].trim())
      if (!isNaN(val)) scores.push(val)
    }
  }

  // Sortierung: jeder Score muss ≤ dem vorherigen sein
  for (let i = 1; i < scores.length; i++) {
    expect(scores[i]).toBeLessThanOrEqual(scores[i - 1])
  }

  await cleanupScore(page, id1)
  await cleanupScore(page, id2)
})

test('AC4: Löschen-Button öffnet AlertDialog mit Spitzname und Score', async ({ page }) => {
  const id = await seedTestScore(page, 5)

  await gotoHighscoresTab(page)

  // Zeile mit Nickname UND Score=5 finden (eindeutige Kombination auch bei Altdaten)
  const row = page.getByRole('row').filter({ hasText: TEST_NICKNAME }).filter({ hasText: '5/10' }).first()
  await row.getByRole('button').first().click()

  // AlertDialog sichtbar mit Name und Score
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await expect(page.getByRole('alertdialog')).toContainText(TEST_NICKNAME)
  await expect(page.getByRole('alertdialog')).toContainText('5/10')

  // Abbrechen schließt Dialog ohne zu löschen
  await page.getByRole('button', { name: 'Abbrechen' }).click()
  await expect(page.getByRole('alertdialog')).not.toBeVisible()
  await expect(row).toBeVisible()

  await cleanupScore(page, id)
})

test('AC5: Eintrag verschwindet nach dem Löschen', async ({ page }) => {
  const id = await seedTestScore(page, 6)

  await gotoHighscoresTab(page)

  // Zeile mit Nickname UND Score=6 finden
  const row = page.getByRole('row').filter({ hasText: TEST_NICKNAME }).filter({ hasText: '6/10' }).first()
  await expect(row).toBeVisible()

  // Löschen bestätigen
  await row.getByRole('button').first().click()
  await page.getByRole('button', { name: 'Löschen' }).click()

  // Eintrag weg (warten auf UI-Update)
  await expect(row).not.toBeVisible({ timeout: 5000 })

  // Kein Cleanup nötig — wurde gerade gelöscht
  void id
})

test('AC6: DELETE /api/admin/scores/[id] löscht einen Score', async ({ page }) => {
  // beforeEach hat bereits eingeloggt; seedTestScore braucht kein Login
  const id = await seedTestScore(page, 4)

  // Direkter API-Call (admin_session Cookie ist durch beforeEach gesetzt)
  const res = await page.request.delete(`/api/admin/scores/${id}`)
  const resBody = await res.text()
  expect(res.ok(), `DELETE /api/admin/scores/${id} returned ${res.status()}: ${resBody}`).toBeTruthy()

  // Score ist weg aus der Liste
  const listRes = await page.request.get('/api/admin/scores')
  const body = await listRes.json()
  const ids = (body.scores as { id: string }[]).map((s) => s.id)
  expect(ids).not.toContain(id)
})

test('AC7: Leerer Zustand zeigt Meldung wenn keine Highscores vorhanden', async ({ page }) => {
  // GET /api/admin/scores mocken → leere Liste
  await page.route('/api/admin/scores', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ scores: [] }),
      })
    } else {
      route.continue()
    }
  })

  await gotoHighscoresTab(page)

  await expect(page.getByText('Noch keine Highscores vorhanden')).toBeVisible()
})

test('AC8: Löschen-Button ist während des Vorgangs deaktiviert', async ({ page }) => {
  const id = await seedTestScore(page, 8)

  await gotoHighscoresTab(page)

  // DELETE-Request verzögern, damit wir den disabled-Zustand prüfen können
  await page.route(`/api/admin/scores/${id}`, async (route) => {
    await new Promise((r) => setTimeout(r, 800))
    route.continue()
  })

  const row = page.getByRole('row').filter({ hasText: TEST_NICKNAME }).filter({ hasText: '8/10' }).first()
  const deleteBtn = row.getByRole('button').first()
  await deleteBtn.click()

  // Dialog-Löschen-Button klicken
  await page.getByRole('button', { name: 'Löschen' }).click()

  // Button ist während Löschvorgang deaktiviert
  await expect(deleteBtn).toBeDisabled({ timeout: 2000 })

  // Warten bis Vorgang abgeschlossen
  await expect(row).not.toBeVisible({ timeout: 8000 })
})

test('Edge Case: Alle löschen-Button löscht alle Einträge und zeigt Leerstand', async ({ page }) => {
  // Zwei Test-Scores seeden
  await seedTestScore(page, 7)
  await seedTestScore(page, 3)

  // GET mocken: zuerst 2 Einträge, nach DELETE leer
  let deleted = false
  await page.route('/api/admin/scores', (route) => {
    if (route.request().method() === 'GET') {
      if (!deleted) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            scores: [
              { id: 'mock-1', nickname: 'MockA', score: 7, total_questions: 10, created_at: new Date().toISOString() },
              { id: 'mock-2', nickname: 'MockB', score: 3, total_questions: 10, created_at: new Date().toISOString() },
            ],
          }),
        })
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [] }) })
      }
    } else if (route.request().method() === 'DELETE') {
      deleted = true
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    } else {
      route.continue()
    }
  })

  await gotoHighscoresTab(page)

  // "Alle löschen"-Button sichtbar und klickbar
  const deleteAllBtn = page.getByRole('button', { name: /Alle löschen/i })
  await expect(deleteAllBtn).toBeVisible()
  await deleteAllBtn.click()

  // AlertDialog zeigt Anzahl
  await expect(page.getByRole('alertdialog')).toContainText('2')

  // Bestätigen
  await page.getByRole('alertdialog').getByRole('button', { name: 'Alle löschen' }).click()

  // Leerer Zustand
  await expect(page.getByText('Noch keine Highscores vorhanden')).toBeVisible({ timeout: 5000 })

  // Cleanup der echt geseedeten Daten
  const listRes = await page.request.get('/api/admin/scores')
  const body = await listRes.json()
  for (const s of body.scores as { id: string; nickname: string }[]) {
    if (s.nickname === TEST_NICKNAME) {
      await page.request.delete(`/api/admin/scores/${s.id}`)
    }
  }
})
