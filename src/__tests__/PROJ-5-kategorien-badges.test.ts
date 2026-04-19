/**
 * PROJ-5: Kategorien & Badges — Unit Tests
 *
 * Testet die Utility-Funktionen aus categories.ts und die Badge-Check-Logik.
 * Keine externen Abhängigkeiten nötig — reine Funktionslogik.
 */

import { describe, it, expect } from 'vitest'
import {
  KATEGORIEN,
  ALLE_KATEGORIEN,
  getKategorie,
  getKategorieEmoji,
  getKategorieLabel,
} from '@/lib/categories'

// ─── KATEGORIEN Konstante ────────────────────────────────────────────────────

describe('PROJ-5: categories.ts — KATEGORIEN', () => {
  it('enthält genau 8 Kategorien (7 Themen + Essen)', () => {
    expect(KATEGORIEN).toHaveLength(8)
  })

  it('enthält alle 8 erwarteten Kategorie-IDs', () => {
    const ids = KATEGORIEN.map((k) => k.id)
    expect(ids).toContain('Tiere')
    expect(ids).toContain('Pflanzen')
    expect(ids).toContain('Körper')
    expect(ids).toContain('Welt')
    expect(ids).toContain('Weltraum')
    expect(ids).toContain('MINT')
    expect(ids).toContain('Kultur')
    expect(ids).toContain('Essen')
  })

  it('jede Kategorie hat id, emoji und label', () => {
    for (const kat of KATEGORIEN) {
      expect(kat.id).toBeTruthy()
      expect(kat.emoji).toBeTruthy()
      expect(kat.label).toBeTruthy()
    }
  })

  it('ALLE_KATEGORIEN hat id="alle" und ein Emoji', () => {
    expect(ALLE_KATEGORIEN.id).toBe('alle')
    expect(ALLE_KATEGORIEN.emoji).toBeTruthy()
    expect(ALLE_KATEGORIEN.label).toBeTruthy()
  })
})

// ─── getKategorie ─────────────────────────────────────────────────────────────

describe('PROJ-5: getKategorie()', () => {
  it('gibt die richtige Kategorie für eine gültige ID zurück', () => {
    const kat = getKategorie('Tiere')
    expect(kat).toBeDefined()
    expect(kat?.id).toBe('Tiere')
    expect(kat?.emoji).toBe('🐘')
  })

  it('gibt undefined für eine unbekannte ID zurück', () => {
    expect(getKategorie('Unbekannt')).toBeUndefined()
  })

  it('gibt undefined für leeren String zurück', () => {
    expect(getKategorie('')).toBeUndefined()
  })
})

// ─── getKategorieEmoji ────────────────────────────────────────────────────────

describe('PROJ-5: getKategorieEmoji()', () => {
  it('gibt das richtige Emoji für eine bekannte Kategorie zurück', () => {
    expect(getKategorieEmoji('Tiere')).toBe('🐘')
    expect(getKategorieEmoji('Weltraum')).toBe('🚀')
    expect(getKategorieEmoji('Essen')).toBe('🍎')
    expect(getKategorieEmoji('MINT')).toBe('🔬')
    expect(getKategorieEmoji('Kultur')).toBe('🎨')
  })

  it('gibt das Regenbogen-Emoji für "alle" zurück', () => {
    expect(getKategorieEmoji('alle')).toBe('🌈')
  })

  it('gibt ❓ für unbekannte Kategorie zurück', () => {
    expect(getKategorieEmoji('Unbekannt')).toBe('❓')
  })
})

// ─── getKategorieLabel ────────────────────────────────────────────────────────

describe('PROJ-5: getKategorieLabel()', () => {
  it('gibt den richtigen Label für eine bekannte Kategorie zurück', () => {
    expect(getKategorieLabel('Tiere')).toBe('Tiere')
    expect(getKategorieLabel('Körper')).toBe('Körper')
    expect(getKategorieLabel('Essen')).toBe('Essen')
  })

  it('gibt "Alle Kategorien" für "alle" zurück', () => {
    expect(getKategorieLabel('alle')).toBe('Alle Kategorien')
  })

  it('gibt die ID selbst zurück für unbekannte Kategorie (Fallback)', () => {
    expect(getKategorieLabel('Unbekannt')).toBe('Unbekannt')
  })
})

// ─── Badge-Check-Logik (Option A) ─────────────────────────────────────────────

describe('PROJ-5: Badge-Check-Logik (Option A)', () => {
  /**
   * Spiegelt die serverseitige Prüflogik aus /api/badges/check/route.ts wider.
   * Badge wird vergeben wenn correctQuestionIds.length === totalShown (alle richtig).
   */
  function checkBadgeEligible(correctQuestionIds: string[], totalShown: number): boolean {
    return correctQuestionIds.length === totalShown && totalShown > 0
  }

  it('Badge wenn alle 10 Fragen richtig beantwortet', () => {
    const ids = Array.from({ length: 10 }, (_, i) => `id-${i}`)
    expect(checkBadgeEligible(ids, 10)).toBe(true)
  })

  it('Kein Badge wenn eine Frage falsch', () => {
    const ids = Array.from({ length: 9 }, (_, i) => `id-${i}`)
    expect(checkBadgeEligible(ids, 10)).toBe(false)
  })

  it('Kein Badge wenn alle Fragen falsch', () => {
    expect(checkBadgeEligible([], 10)).toBe(false)
  })

  it('Badge bei weniger Fragen (Kategorie hat nur 6) wenn alle richtig', () => {
    const ids = Array.from({ length: 6 }, (_, i) => `id-${i}`)
    expect(checkBadgeEligible(ids, 6)).toBe(true)
  })

  it('Kein Badge bei totalShown=0 (Edge Case: leere Session)', () => {
    expect(checkBadgeEligible([], 0)).toBe(false)
  })
})
