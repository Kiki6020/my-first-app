'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HighscoreList } from '@/components/quiz/HighscoreList'

export default function HighscorePage() {
  const [nickname, setNickname] = useState<string | undefined>(undefined)

  useEffect(() => {
    const saved = localStorage.getItem('quizNickname')
    setNickname(saved ?? undefined)
  }, [])

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-5xl select-none">🏆</span>
          <h1 className="text-3xl font-black text-white">Highscore</h1>
          <p className="text-zinc-400 text-sm">Die besten 20 Ergebnisse aller Zeiten</p>
        </div>

        {/* Highscore list */}
        <HighscoreList currentNickname={nickname} />

        {/* Actions */}
        <div className="flex flex-col gap-3 pb-8">
          <Link href="/quiz" className="w-full">
            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold rounded-2xl bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40 transition-all hover:scale-105"
            >
              Quiz spielen →
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button
              variant="ghost"
              className="w-full h-12 rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Zurück zur Startseite
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
