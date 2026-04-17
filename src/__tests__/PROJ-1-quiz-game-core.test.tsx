/**
 * PROJ-1: Quiz Game Core — Unit Tests
 *
 * Tests für die isolierte Spiellogik und Hilfsfunktionen.
 * Supabase wird gemockt, canvas-confetti wird gemockt.
 * Fake-Timer verhindern, dass pending setTimeout-Calls zwischen Tests laufen.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

// ─── Mocks ────────────────────────────────────────────────────────────────────

// canvas-confetti mock (jsdom hat kein Canvas)
vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

// Supabase Fluent-Chain Mock: .from().select().order().limit() → Promise
let mockQueryResult: { data: unknown; error: unknown } = { data: [], error: null }

vi.mock('@/lib/supabase', () => {
  const chainMock = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn(() => Promise.resolve(mockQueryResult)),
  }
  return {
    supabase: {
      from: vi.fn(() => chainMock),
    },
  }
})

import { QuizContainer } from '@/components/quiz/QuizContainer'

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

/** Erstellt N Mock-Fragen mit eindeutigen IDs — alle is_true=true für einfaches Testing */
function makeMockQuestions(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `uuid-${i + 1}`,
    fact_text: `Fun Fact Nummer ${i + 1}`,
    is_true: true,
    explanation: `Erklärung Nummer ${i + 1}`,
    category: 'Tiere',
    created_at: new Date().toISOString(),
  }))
}

function setupSuccessfulLoad(questions = makeMockQuestions(10)) {
  mockQueryResult = { data: questions, error: null }
}
function setupNetworkError() {
  mockQueryResult = { data: null, error: { message: 'Netzwerkfehler' } }
}
function setupTooFewQuestions(n = 5) {
  mockQueryResult = { data: makeMockQuestions(n), error: null }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PROJ-1: Quiz Game Core', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: false })
    setupSuccessfulLoad()
  })

  afterEach(() => {
    vi.runAllTimers()   // alle ausstehenden Timer abfeuern, damit nichts in den nächsten Test leckt
    vi.useRealTimers()
  })

  // ── Fehler-Zustände ───────────────────────────────────────────────────────

  describe('Fehler-Zustände (Edge Cases)', () => {
    it('zeigt Fehlermeldung bei Netzwerkfehler', async () => {
      setupNetworkError()
      render(<QuizContainer />)
      await act(() => vi.runAllTimersAsync())
      expect(screen.getByText('Verbindungsproblem')).toBeInTheDocument()
    })

    it('zeigt Fehlermeldung wenn weniger als 10 Fragen verfügbar', async () => {
      setupTooFewQuestions(5)
      render(<QuizContainer />)
      await act(() => vi.runAllTimersAsync())
      expect(screen.getByText('Zu wenig Fragen')).toBeInTheDocument()
    })

    it('zeigt "Neu laden"-Button im Fehlerfall', async () => {
      setupNetworkError()
      render(<QuizContainer />)
      await act(() => vi.runAllTimersAsync())
      expect(screen.getByRole('button', { name: /neu laden/i })).toBeInTheDocument()
    })

    it('"Neu laden"-Button startet Ladevorgang neu', async () => {
      setupNetworkError()
      render(<QuizContainer />)
      await act(() => vi.runAllTimersAsync())
      expect(screen.getByText('Verbindungsproblem')).toBeInTheDocument()

      setupSuccessfulLoad()
      fireEvent.click(screen.getByRole('button', { name: /neu laden/i }))
      await act(() => vi.runAllTimersAsync())

      expect(screen.getByText('Frage 1 von 10')).toBeInTheDocument()
    })
  })

  // ── Spiel-Zustand ─────────────────────────────────────────────────────────

  describe('Spiel: Frage anzeigen', () => {
    it('zeigt Fortschrittsanzeige „Frage 1 von 10"', async () => {
      render(<QuizContainer />)
      await act(() => vi.runAllTimersAsync())
      expect(screen.getByText('Frage 1 von 10')).toBeInTheDocument()
    })

    it('zeigt RICHTIG- und FALSCH-Buttons', async () => {
      render(<QuizContainer />)
      await act(() => vi.runAllTimersAsync())
      expect(screen.getByRole('button', { name: 'RICHTIG' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'FALSCH' })).toBeInTheDocument()
    })

    it('zeigt einen Fun-Fact-Text', async () => {
      render(<QuizContainer />)
      await act(() => vi.runAllTimersAsync())
      expect(screen.getByText(/Fun Fact Nummer \d+/)).toBeInTheDocument()
    })

    it('zeigt Kategorie-Badge', async () => {
      render(<QuizContainer />)
      await act(() => vi.runAllTimersAsync())
      expect(screen.getByText(/Tiere/)).toBeInTheDocument()
    })

    it('zeigt initialen Score „0 richtig"', async () => {
      render(<QuizContainer />)
      await act(() => vi.runAllTimersAsync())
      expect(screen.getByText(/0\s*richtig/)).toBeInTheDocument()
    })
  })

  // ── Antwort-Interaktion ───────────────────────────────────────────────────

  describe('Spiel: Antworten', () => {
    async function renderAndLoad() {
      render(<QuizContainer />)
      await act(() => vi.runAllTimersAsync())
    }

    it('deaktiviert beide Buttons nach dem ersten Klick', async () => {
      await renderAndLoad()
      fireEvent.click(screen.getByRole('button', { name: 'RICHTIG' }))
      expect(screen.getByRole('button', { name: 'RICHTIG' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'FALSCH' })).toBeDisabled()
    })

    it('zeigt Erklärungstext nach einer Antwort', async () => {
      await renderAndLoad()
      fireEvent.click(screen.getByRole('button', { name: 'RICHTIG' }))
      expect(screen.getByText(/Erklärung Nummer \d+/)).toBeInTheDocument()
    })

    it('zeigt Weiter-Button nach einer Antwort', async () => {
      await renderAndLoad()
      fireEvent.click(screen.getByRole('button', { name: 'RICHTIG' }))
      expect(screen.getByRole('button', { name: /weiter/i })).toBeInTheDocument()
    })

    it('zeigt nächste Frage nach Klick auf Weiter-Button', async () => {
      await renderAndLoad()
      fireEvent.click(screen.getByRole('button', { name: 'RICHTIG' }))
      fireEvent.click(screen.getByRole('button', { name: /weiter/i }))
      await act(() => vi.runAllTimersAsync())
      expect(screen.getByText('Frage 2 von 10')).toBeInTheDocument()
    })

    it('zählt korrekte Antworten: RICHTIG auf wahre Frage = 1 Punkt', async () => {
      await renderAndLoad()
      fireEvent.click(screen.getByRole('button', { name: 'RICHTIG' }))
      expect(screen.getByText(/1\s*richtig/)).toBeInTheDocument()
    })

    it('zählt falsche Antworten NICHT: FALSCH auf wahre Frage = 0 Punkte', async () => {
      await renderAndLoad()
      fireEvent.click(screen.getByRole('button', { name: 'FALSCH' }))
      expect(screen.getByText(/0\s*richtig/)).toBeInTheDocument()
    })
  })

  // ── Ergebnis-Screen ───────────────────────────────────────────────────────

  describe('Ergebnis-Screen', () => {
    async function playAllTenQuestions() {
      render(<QuizContainer />)
      await act(() => vi.runAllTimersAsync())

      for (let i = 0; i < 10; i++) {
        expect(screen.getByRole('button', { name: 'RICHTIG' })).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'RICHTIG' }))
        expect(screen.getByRole('button', { name: /weiter/i })).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: /weiter/i }))
        await act(() => vi.runAllTimersAsync())
      }
    }

    it('zeigt Ergebnis-Screen nach 10 beantworteten Fragen', async () => {
      await playAllTenQuestions()
      expect(screen.getByText('Dein Ergebnis')).toBeInTheDocument()
    })

    it('zeigt Score 10 im Ergebnis-Screen', async () => {
      await playAllTenQuestions()
      // Score-Element: "10" gefolgt von "/ 10"
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('zeigt „Neue Runde"-Button im Ergebnis-Screen', async () => {
      await playAllTenQuestions()
      expect(screen.getByRole('button', { name: /neue runde/i })).toBeInTheDocument()
    })

    it('zeigt „Highscore ansehen"-Button im Ergebnis-Screen', async () => {
      await playAllTenQuestions()
      expect(screen.getByRole('button', { name: /highscore/i })).toBeInTheDocument()
    })

    it('startet neue Runde nach Klick auf „Neue Runde"', async () => {
      await playAllTenQuestions()
      expect(screen.getByRole('button', { name: /neue runde/i })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /neue runde/i }))
      await act(() => vi.runAllTimersAsync())
      expect(screen.getByText('Frage 1 von 10')).toBeInTheDocument()
    })
  })

  // ── Keine Duplikate ───────────────────────────────────────────────────────

  describe('Spiellogik: Keine doppelten Fragen', () => {
    it('zeigt jede Frage in einer Runde nur einmal', async () => {
      render(<QuizContainer />)
      await act(() => vi.runAllTimersAsync())

      const seenFactTexts: string[] = []

      for (let i = 0; i < 10; i++) {
        expect(screen.getByRole('button', { name: 'RICHTIG' })).toBeInTheDocument()

        const factElement = screen.getByText(/Fun Fact Nummer \d+/)
        const currentFact = factElement.textContent ?? ''
        expect(seenFactTexts).not.toContain(currentFact)
        seenFactTexts.push(currentFact)

        fireEvent.click(screen.getByRole('button', { name: 'RICHTIG' }))
        fireEvent.click(screen.getByRole('button', { name: /weiter/i }))
        await act(() => vi.runAllTimersAsync())
      }

      expect(seenFactTexts).toHaveLength(10)
    })
  })
})
