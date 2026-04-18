/**
 * PROJ-4: Fragen-Import — Unit Tests
 *
 * Tests für die Parsing- und Duplikaterkennung-Logik.
 * Da die Hilfsfunktionen in admin/page.tsx nicht exportiert sind,
 * werden sie hier nachgebaut und isoliert getestet.
 */

import { describe, it, expect } from 'vitest'

// ─── Helpers (nachgebaut aus src/app/admin/page.tsx) ──────────────────────────

interface PreviewQuestion {
  fact_text: string
  is_true: boolean
  explanation: string
  category: string
  isDuplicate?: boolean
  isInvalid?: boolean
}

function parseCsvRow(row: Record<string, string>): PreviewQuestion | null {
  const frage = (row['frage'] ?? '').trim()
  const antwortRaw = (row['antwort'] ?? '').trim().toLowerCase()
  const erklaerung = (row['erklaerung'] ?? '').trim()
  const kategorie = (row['kategorie'] ?? '').trim()

  if (!frage || !erklaerung || !kategorie) return null

  if (antwortRaw !== 'wahr' && antwortRaw !== 'falsch') {
    return {
      fact_text: frage,
      is_true: false,
      explanation: erklaerung,
      category: kategorie,
      isInvalid: true,
    }
  }

  return {
    fact_text: frage,
    is_true: antwortRaw === 'wahr',
    explanation: erklaerung,
    category: kategorie,
  }
}

function parseJsonQuestions(json: unknown): PreviewQuestion[] {
  if (!Array.isArray(json)) return []
  return json
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const obj = item as Record<string, unknown>
      const frage = typeof obj['frage'] === 'string' ? obj['frage'].trim() : ''
      const antwortRaw =
        typeof obj['antwort'] === 'string' ? obj['antwort'].trim().toLowerCase() : ''
      const erklaerung =
        typeof obj['erklaerung'] === 'string' ? obj['erklaerung'].trim() : ''
      const kategorie =
        typeof obj['kategorie'] === 'string' ? obj['kategorie'].trim() : ''
      if (!frage || !erklaerung || !kategorie) return null
      if (antwortRaw !== 'wahr' && antwortRaw !== 'falsch') {
        return {
          fact_text: frage,
          is_true: false,
          explanation: erklaerung,
          category: kategorie,
          isInvalid: true,
        }
      }
      return {
        fact_text: frage,
        is_true: antwortRaw === 'wahr',
        explanation: erklaerung,
        category: kategorie,
      }
    })
    .filter((q): q is PreviewQuestion => q !== null)
}

function markDuplicates(
  preview: PreviewQuestion[],
  existingTexts: Set<string>
): PreviewQuestion[] {
  const seen = new Set<string>()
  return preview.map((q) => {
    const lower = q.fact_text.toLowerCase()
    const isDuplicate = existingTexts.has(lower) || seen.has(lower)
    seen.add(lower)
    return { ...q, isDuplicate }
  })
}

// ─── parseCsvRow ──────────────────────────────────────────────────────────────

describe('parseCsvRow', () => {
  it('Happy path: parst eine gültige Zeile mit antwort=wahr', () => {
    const result = parseCsvRow({
      frage: 'Delfine schlafen mit einem Auge offen.',
      antwort: 'wahr',
      erklaerung: 'Delfine schlafen mit einer Gehirnhälfte.',
      kategorie: 'Tiere',
    })
    expect(result).toEqual({
      fact_text: 'Delfine schlafen mit einem Auge offen.',
      is_true: true,
      explanation: 'Delfine schlafen mit einer Gehirnhälfte.',
      category: 'Tiere',
    })
  })

  it('Happy path: parst eine gültige Zeile mit antwort=falsch', () => {
    const result = parseCsvRow({
      frage: 'Pinguine können fliegen.',
      antwort: 'falsch',
      erklaerung: 'Pinguine können nicht fliegen.',
      kategorie: 'Tiere',
    })
    expect(result).toEqual({
      fact_text: 'Pinguine können fliegen.',
      is_true: false,
      explanation: 'Pinguine können nicht fliegen.',
      category: 'Tiere',
    })
  })

  it('Ungültige Antwort (weder wahr noch falsch) → isInvalid=true', () => {
    const result = parseCsvRow({
      frage: 'Eine Frage.',
      antwort: 'vielleicht',
      erklaerung: 'Erklärung.',
      kategorie: 'Natur',
    })
    expect(result).not.toBeNull()
    expect(result?.isInvalid).toBe(true)
  })

  it('Antwort ist case-insensitiv (WAHR → is_true=true)', () => {
    const result = parseCsvRow({
      frage: 'Eine Frage.',
      antwort: 'WAHR',
      erklaerung: 'Erklärung.',
      kategorie: 'Natur',
    })
    expect(result?.is_true).toBe(true)
    expect(result?.isInvalid).toBeUndefined()
  })

  it('Fehlende Pflichtfelder → null', () => {
    expect(parseCsvRow({ frage: '', antwort: 'wahr', erklaerung: 'x', kategorie: 'y' })).toBeNull()
    expect(parseCsvRow({ frage: 'x', antwort: 'wahr', erklaerung: '', kategorie: 'y' })).toBeNull()
    expect(parseCsvRow({ frage: 'x', antwort: 'wahr', erklaerung: 'x', kategorie: '' })).toBeNull()
  })

  it('Leerzeichen werden getrimmt', () => {
    const result = parseCsvRow({
      frage: '  Frage mit Leerzeichen  ',
      antwort: ' wahr ',
      erklaerung: ' Erklärung ',
      kategorie: ' Tiere ',
    })
    expect(result?.fact_text).toBe('Frage mit Leerzeichen')
    expect(result?.is_true).toBe(true)
  })
})

// ─── parseJsonQuestions ───────────────────────────────────────────────────────

describe('parseJsonQuestions', () => {
  it('Happy path: parst valides JSON-Array', () => {
    const input = [
      {
        frage: 'Delfine schlafen mit einem Auge offen.',
        antwort: 'wahr',
        erklaerung: 'Erklärung.',
        kategorie: 'Tiere',
      },
    ]
    const result = parseJsonQuestions(input)
    expect(result).toHaveLength(1)
    expect(result[0].fact_text).toBe('Delfine schlafen mit einem Auge offen.')
    expect(result[0].is_true).toBe(true)
  })

  it('Nicht-Array-Input → leeres Array', () => {
    expect(parseJsonQuestions(null)).toEqual([])
    expect(parseJsonQuestions({})).toEqual([])
    expect(parseJsonQuestions('string')).toEqual([])
    expect(parseJsonQuestions(42)).toEqual([])
  })

  it('Ungültiger antwort-Wert → isInvalid=true, Zeile bleibt im Ergebnis', () => {
    const input = [
      {
        frage: 'Eine Frage.',
        antwort: 'ja',
        erklaerung: 'Erklärung.',
        kategorie: 'Natur',
      },
    ]
    const result = parseJsonQuestions(input)
    expect(result).toHaveLength(1)
    expect(result[0].isInvalid).toBe(true)
  })

  it('Null-Einträge im Array werden übersprungen', () => {
    const input = [
      null,
      { frage: 'Frage.', antwort: 'wahr', erklaerung: 'Erklärung.', kategorie: 'Natur' },
      42,
    ]
    const result = parseJsonQuestions(input)
    expect(result).toHaveLength(1)
  })

  it('Einträge mit fehlenden Pflichtfeldern werden übersprungen', () => {
    const input = [
      { frage: '', antwort: 'wahr', erklaerung: 'x', kategorie: 'y' },
      { frage: 'Frage.', antwort: 'wahr', erklaerung: '', kategorie: 'y' },
    ]
    const result = parseJsonQuestions(input)
    expect(result).toHaveLength(0)
  })

  it('Gemischtes Array: gültig, ungültig, fehlend', () => {
    const input = [
      { frage: 'Frage 1.', antwort: 'wahr', erklaerung: 'Erklärung 1.', kategorie: 'Natur' },
      { frage: 'Frage 2.', antwort: 'ungültig', erklaerung: 'Erklärung 2.', kategorie: 'Natur' },
      { frage: '', antwort: 'wahr', erklaerung: 'x', kategorie: 'y' },
    ]
    const result = parseJsonQuestions(input)
    expect(result).toHaveLength(2)
    expect(result[0].isInvalid).toBeUndefined()
    expect(result[1].isInvalid).toBe(true)
  })
})

// ─── markDuplicates ───────────────────────────────────────────────────────────

describe('markDuplicates', () => {
  const makeQ = (text: string): PreviewQuestion => ({
    fact_text: text,
    is_true: true,
    explanation: 'Erklärung.',
    category: 'Tiere',
  })

  it('Keine Duplikate: isDuplicate ist undefined/false für alle', () => {
    const preview = [makeQ('Frage A.'), makeQ('Frage B.')]
    const result = markDuplicates(preview, new Set())
    expect(result[0].isDuplicate).toBe(false)
    expect(result[1].isDuplicate).toBe(false)
  })

  it('Erkennt Duplikate gegen existierende Fragen (case-insensitiv)', () => {
    const existing = new Set(['delfine schlafen mit einem auge offen.'])
    const preview = [makeQ('Delfine schlafen mit einem Auge offen.')]
    const result = markDuplicates(preview, existing)
    expect(result[0].isDuplicate).toBe(true)
  })

  it('Erkennt Duplikate innerhalb des Uploads (gleiche Frage zweimal)', () => {
    const preview = [makeQ('Frage A.'), makeQ('Frage A.')]
    const result = markDuplicates(preview, new Set())
    expect(result[0].isDuplicate).toBe(false) // erste Instanz ist nicht Duplikat
    expect(result[1].isDuplicate).toBe(true)  // zweite Instanz ist Duplikat
  })

  it('Kombiniert beides: extern und intern', () => {
    const existing = new Set(['frage a.'])
    const preview = [makeQ('Frage A.'), makeQ('Frage B.'), makeQ('Frage B.')]
    const result = markDuplicates(preview, existing)
    expect(result[0].isDuplicate).toBe(true)  // extern
    expect(result[1].isDuplicate).toBe(false) // neu
    expect(result[2].isDuplicate).toBe(true)  // intern
  })

  it('Vergleich ist case-insensitiv', () => {
    const existing = new Set(['frage a.'])
    const preview = [makeQ('FRAGE A.'), makeQ('frage a.')]
    const result = markDuplicates(preview, existing)
    expect(result[0].isDuplicate).toBe(true)
    expect(result[1].isDuplicate).toBe(true)
  })
})
