/**
 * PROJ-2: Nickname & Highscore-System — Unit Tests
 *
 * Testet die Formular-Validierung des NicknameScreen sowie die
 * Hervorhebungs-Logik der HighscoreList in Isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NicknameScreen } from '@/components/quiz/NicknameScreen'
import { HighscoreList, type ScoreEntry } from '@/components/quiz/HighscoreList'

// ─── NicknameScreen Validierung ───────────────────────────────────────────────

describe('NicknameScreen: Validierung', () => {
  const onNicknameSet = vi.fn()

  beforeEach(() => {
    onNicknameSet.mockClear()
  })

  it('zeigt Validierungsfehler bei leerem Feld', () => {
    render(<NicknameScreen onNicknameSet={onNicknameSet} />)
    fireEvent.click(screen.getByRole('button', { name: /los geht/i }))
    expect(screen.getByText(/bitte gib einen spitznamen ein/i)).toBeInTheDocument()
    expect(onNicknameSet).not.toHaveBeenCalled()
  })

  it('zeigt Validierungsfehler bei zu kurzem Spitznamen (1 Zeichen)', () => {
    render(<NicknameScreen onNicknameSet={onNicknameSet} />)
    fireEvent.change(screen.getByPlaceholderText(/spitzname/i), {
      target: { value: 'A' },
    })
    fireEvent.click(screen.getByRole('button', { name: /los geht/i }))
    expect(screen.getByText(/bitte gib einen spitznamen ein/i)).toBeInTheDocument()
    expect(onNicknameSet).not.toHaveBeenCalled()
  })

  it('akzeptiert einen Spitznamen mit genau 2 Zeichen (Untergrenze)', () => {
    render(<NicknameScreen onNicknameSet={onNicknameSet} />)
    fireEvent.change(screen.getByPlaceholderText(/spitzname/i), {
      target: { value: 'AB' },
    })
    fireEvent.click(screen.getByRole('button', { name: /los geht/i }))
    expect(onNicknameSet).toHaveBeenCalledWith('AB')
  })

  it('akzeptiert einen Spitznamen mit genau 12 Zeichen (Obergrenze)', () => {
    render(<NicknameScreen onNicknameSet={onNicknameSet} />)
    fireEvent.change(screen.getByPlaceholderText(/spitzname/i), {
      target: { value: 'ABCDEFGHijkl' }, // 12 Zeichen
    })
    fireEvent.click(screen.getByRole('button', { name: /los geht/i }))
    expect(onNicknameSet).toHaveBeenCalledWith('ABCDEFGHijkl')
  })

  it('zeigt Validierungsfehler bei ungültigen Sonderzeichen', () => {
    render(<NicknameScreen onNicknameSet={onNicknameSet} />)
    fireEvent.change(screen.getByPlaceholderText(/spitzname/i), {
      target: { value: 'Hallo!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /los geht/i }))
    expect(screen.getByText(/nur buchstaben/i)).toBeInTheDocument()
    expect(onNicknameSet).not.toHaveBeenCalled()
  })

  it('akzeptiert Bindestriche im Spitznamen', () => {
    render(<NicknameScreen onNicknameSet={onNicknameSet} />)
    fireEvent.change(screen.getByPlaceholderText(/spitzname/i), {
      target: { value: 'Super-Kind' },
    })
    fireEvent.click(screen.getByRole('button', { name: /los geht/i }))
    expect(onNicknameSet).toHaveBeenCalledWith('Super-Kind')
  })

  it('akzeptiert deutsche Umlaute im Spitznamen', () => {
    render(<NicknameScreen onNicknameSet={onNicknameSet} />)
    fireEvent.change(screen.getByPlaceholderText(/spitzname/i), {
      target: { value: 'Björn' },
    })
    fireEvent.click(screen.getByRole('button', { name: /los geht/i }))
    expect(onNicknameSet).toHaveBeenCalledWith('Björn')
  })

  it('trimmt Leerzeichen vor der Validierung', () => {
    render(<NicknameScreen onNicknameSet={onNicknameSet} />)
    // Leerzeichen allein ergibt nach trim() einen leeren String → Fehler
    fireEvent.change(screen.getByPlaceholderText(/spitzname/i), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /los geht/i }))
    expect(onNicknameSet).not.toHaveBeenCalled()
  })

  it('füllt den Spitznamen aus prop prefilled vor', () => {
    render(<NicknameScreen onNicknameSet={onNicknameSet} prefilled="Carla" />)
    const input = screen.getByPlaceholderText(/spitzname/i) as HTMLInputElement
    expect(input.value).toBe('Carla')
  })

  it('löscht Fehlermeldung bei neuer Eingabe', () => {
    render(<NicknameScreen onNicknameSet={onNicknameSet} />)
    // Erst Fehler erzeugen
    fireEvent.click(screen.getByRole('button', { name: /los geht/i }))
    expect(screen.getByText(/bitte gib einen spitznamen ein/i)).toBeInTheDocument()
    // Dann tippen → Fehler verschwindet
    fireEvent.change(screen.getByPlaceholderText(/spitzname/i), {
      target: { value: 'X' },
    })
    expect(screen.queryByText(/bitte gib einen spitznamen ein/i)).not.toBeInTheDocument()
  })
})

// ─── HighscoreList: Eigener Eintrag hervorgehoben ─────────────────────────────

// fetch mock für HighscoreList
const makeFetchMock = (scores: ScoreEntry[]) => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ scores }),
  } as unknown as Response)
}

const NOW = new Date().toISOString()

function makeEntry(overrides: Partial<ScoreEntry> = {}): ScoreEntry {
  return {
    id: 'uuid-1',
    nickname: 'Carla',
    score: 8,
    total_questions: 10,
    created_at: NOW,
    ...overrides,
  }
}

describe('HighscoreList: Eigener Eintrag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hebt eigenen Eintrag hervor wenn Nickname und Score übereinstimmen', async () => {
    makeFetchMock([makeEntry({ nickname: 'Carla', score: 8 })])
    render(<HighscoreList currentNickname="Carla" currentScore={8} />)
    // Warten auf geladene Liste
    const ownEntry = await screen.findByText('(du)')
    expect(ownEntry).toBeInTheDocument()
  })

  it('hebt eigenen Eintrag NICHT hervor wenn anderer Nickname', async () => {
    makeFetchMock([makeEntry({ nickname: 'Max', score: 8 })])
    render(<HighscoreList currentNickname="Carla" currentScore={8} />)
    await screen.findByText('Max')
    expect(screen.queryByText('(du)')).not.toBeInTheDocument()
  })

  it('hebt eigenen Eintrag NICHT hervor wenn anderer Score', async () => {
    makeFetchMock([makeEntry({ nickname: 'Carla', score: 7 })])
    render(<HighscoreList currentNickname="Carla" currentScore={8} />)
    await screen.findByText('Carla')
    expect(screen.queryByText('(du)')).not.toBeInTheDocument()
  })

  it('zeigt Platz-Emojis für die ersten drei Ränge', async () => {
    makeFetchMock([
      makeEntry({ id: '1', nickname: 'Alpha', score: 10 }),
      makeEntry({ id: '2', nickname: 'Beta', score: 9 }),
      makeEntry({ id: '3', nickname: 'Gamma', score: 8 }),
      makeEntry({ id: '4', nickname: 'Delta', score: 7 }),
    ])
    render(<HighscoreList />)
    await screen.findByText('Alpha')
    expect(screen.getByText('🥇')).toBeInTheDocument()
    expect(screen.getByText('🥈')).toBeInTheDocument()
    expect(screen.getByText('🥉')).toBeInTheDocument()
    // Platz 4 hat kein Emoji — zeigt Zahl "4"
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('zeigt Leerer-Zustand-Meldung wenn keine Einträge', async () => {
    makeFetchMock([])
    render(<HighscoreList />)
    await screen.findByText(/noch kein highscore/i)
    expect(screen.getByText(/sei die erste/i)).toBeInTheDocument()
  })

  it('zeigt Fehlermeldung bei fetch-Fehler', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Netzwerkfehler'))
    render(<HighscoreList />)
    await screen.findByText(/konnten nicht geladen werden/i)
  })
})
