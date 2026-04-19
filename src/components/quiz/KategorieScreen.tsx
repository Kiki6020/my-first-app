'use client'

import { useEffect, useState } from 'react'
import { KATEGORIEN, ALLE_KATEGORIEN } from '@/lib/categories'

interface KategorieInfo {
  id: string
  emoji: string
  label: string
  questionCount: number
}

interface KategorieScreenProps {
  nickname: string
  onKategorieSelected: (kategorie: string) => void
}

export function KategorieScreen({ nickname, onKategorieSelected }: KategorieScreenProps) {
  const [kategorien, setKategorien] = useState<KategorieInfo[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        setKategorien(data.categories ?? [])
        setTotalCount(data.totalCount ?? 0)
        setLoading(false)
      })
      .catch(() => {
        // Fallback: zeige alle Kategorien mit 0 Fragen
        setKategorien(
          KATEGORIEN.map((k) => ({ ...k, questionCount: 0 }))
        )
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-10">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/6 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-violet-400 text-sm font-semibold">Hallo, {nickname}!</p>
          <h1 className="text-3xl font-black text-white">Welches Thema?</h1>
          <p className="text-zinc-400 text-sm">
            Wähle ein Thema oder spiele alle Fragen gemischt.
          </p>
        </div>

        {/* Alle Kategorien card */}
        <button
          onClick={() => onKategorieSelected('alle')}
          className="w-full rounded-3xl border-2 border-violet-500/60 bg-violet-900/30 hover:bg-violet-800/40 hover:border-violet-400 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] p-5 flex items-center gap-4 shadow-lg shadow-violet-900/20"
        >
          <span className="text-4xl select-none">{ALLE_KATEGORIEN.emoji}</span>
          <div className="flex-1 text-left">
            <p className="text-white text-lg font-black">{ALLE_KATEGORIEN.label}</p>
            <p className="text-violet-300 text-sm font-medium">
              {loading ? '…' : `${totalCount} Fragen`}
            </p>
          </div>
          <span className="text-violet-400 text-xl">→</span>
        </button>

        {/* Separator */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
            oder Thema wählen
          </span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 gap-3">
          {loading
            ? // Skeleton cards
              Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 h-24 animate-pulse"
                />
              ))
            : kategorien.map((kat) => {
                const disabled = kat.questionCount === 0
                return (
                  <button
                    key={kat.id}
                    onClick={() => !disabled && onKategorieSelected(kat.id)}
                    disabled={disabled}
                    className={`rounded-2xl border p-4 flex flex-col gap-2 text-left transition-all duration-200 ${
                      disabled
                        ? 'border-zinc-800 bg-zinc-900/30 opacity-40 cursor-not-allowed'
                        : 'border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-zinc-500 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-sm'
                    }`}
                  >
                    <span className="text-3xl select-none">{kat.emoji}</span>
                    <div>
                      <p
                        className={`font-bold text-sm leading-tight ${
                          disabled ? 'text-zinc-500' : 'text-white'
                        }`}
                      >
                        {kat.label}
                      </p>
                      <p
                        className={`text-xs font-medium mt-0.5 ${
                          disabled ? 'text-zinc-600' : 'text-zinc-400'
                        }`}
                      >
                        {kat.questionCount === 0
                          ? 'Keine Fragen'
                          : `${kat.questionCount} Fragen`}
                      </p>
                    </div>
                  </button>
                )
              })}
        </div>
      </div>
    </div>
  )
}
