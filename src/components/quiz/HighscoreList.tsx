'use client'

import { useEffect, useState } from 'react'
import { BadgeSammlung } from '@/components/quiz/BadgeSammlung'

export interface ScoreEntry {
  id: string
  nickname: string
  score: number
  total_questions: number
  created_at: string
}

interface HighscoreListProps {
  currentNickname?: string
  currentScore?: number
}

function rankEmoji(rank: number): string | null {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function HighscoreList({ currentNickname, currentScore }: HighscoreListProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/scores')
      .then((res) => res.json())
      .then((data) => {
        setScores(data.scores ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="w-8 h-8 rounded-full border-4 border-zinc-700 border-t-cyan-400 animate-spin" />
        <p className="text-zinc-400 text-sm">Lade Highscores…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 flex flex-col items-center gap-3">
        <span className="text-4xl">📡</span>
        <p className="text-zinc-400">Highscores konnten nicht geladen werden.</p>
      </div>
    )
  }

  if (scores.length === 0) {
    return (
      <div className="text-center py-16 flex flex-col items-center gap-3">
        <span className="text-5xl">🏆</span>
        <p className="text-white text-xl font-bold">Noch kein Highscore</p>
        <p className="text-zinc-400">Sei die Erste!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Badge-Sammlung des eingeloggten Spielers */}
      {currentNickname && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <BadgeSammlung nickname={currentNickname} />
        </div>
      )}

      <div className="flex flex-col gap-2">
      {scores.map((entry, idx) => {
        const rank = idx + 1
        const emoji = rankEmoji(rank)
        const isOwn =
          currentNickname !== undefined &&
          entry.nickname === currentNickname &&
          (currentScore === undefined || entry.score === currentScore)

        return (
          <div
            key={entry.id}
            className={`flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all ${
              isOwn
                ? 'bg-violet-900/40 border-violet-500/60 ring-1 ring-violet-500/30'
                : 'bg-zinc-900/60 border-zinc-800'
            }`}
          >
            {/* Rank */}
            <div className="w-8 text-center flex-shrink-0">
              {emoji ? (
                <span className="text-xl">{emoji}</span>
              ) : (
                <span className="text-zinc-500 font-bold text-sm">{rank}</span>
              )}
            </div>

            {/* Nickname */}
            <div className="flex-1 min-w-0">
              <span
                className={`font-bold truncate block text-sm sm:text-base ${
                  isOwn ? 'text-violet-300' : 'text-white'
                }`}
              >
                {entry.nickname}
                {isOwn && (
                  <span className="ml-2 text-xs text-violet-400 font-normal">(du)</span>
                )}
              </span>
              <span className="text-zinc-500 text-xs">{formatDate(entry.created_at)}</span>
            </div>

            {/* Score */}
            <div
              className={`font-black text-lg flex-shrink-0 ${
                isOwn ? 'text-violet-300' : 'text-cyan-400'
              }`}
            >
              {entry.score}
              <span className="text-zinc-500 text-sm font-normal">
                /{entry.total_questions}
              </span>
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}
