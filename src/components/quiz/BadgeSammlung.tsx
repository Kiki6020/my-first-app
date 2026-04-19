'use client'

import { useEffect, useState } from 'react'
import { KATEGORIEN } from '@/lib/categories'

interface BadgeEntry {
  category: string
  unlocked_at: string
}

interface BadgeSammlungProps {
  nickname: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function BadgeSammlung({ nickname }: BadgeSammlungProps) {
  const [badges, setBadges] = useState<BadgeEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/badges?nickname=${encodeURIComponent(nickname)}`)
      .then((res) => res.json())
      .then((data) => {
        setBadges(data.badges ?? [])
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [nickname])

  const unlockedCount = badges.length

  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🏅</span>
        <h2 className="text-white font-black text-base">Deine Badges</h2>
        {!loading && (
          <span className="ml-auto text-zinc-500 text-sm font-medium">
            {unlockedCount} / {KATEGORIEN.length}
          </span>
        )}
      </div>

      {/* Badge grid */}
      {loading ? (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {KATEGORIEN.map((kat) => {
            const badgeEntry = badges.find((b) => b.category === kat.id)
            const unlocked = !!badgeEntry

            return (
              <div
                key={kat.id}
                className={`relative flex flex-col items-center gap-1 rounded-2xl border p-2 transition-all ${
                  unlocked
                    ? 'border-amber-500/50 bg-amber-900/20'
                    : 'border-zinc-800 bg-zinc-900/40'
                }`}
                title={
                  unlocked
                    ? `${kat.label} – freigeschaltet am ${formatDate(badgeEntry!.unlocked_at)}`
                    : `${kat.label} – noch nicht freigeschaltet`
                }
              >
                <span
                  className={`text-2xl select-none transition-all ${
                    unlocked ? '' : 'grayscale opacity-30'
                  }`}
                >
                  {kat.emoji}
                </span>
                <p
                  className={`text-center leading-tight font-semibold ${
                    unlocked ? 'text-amber-300 text-[10px]' : 'text-zinc-600 text-[10px]'
                  }`}
                >
                  {kat.label}
                </p>
                {unlocked && (
                  <span className="absolute -top-1.5 -right-1.5 text-base select-none">
                    🏆
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && unlockedCount === 0 && (
        <p className="text-zinc-500 text-xs text-center">
          Spiele alle Fragen einer Kategorie richtig, um Badges freizuschalten!
        </p>
      )}

      {!loading && unlockedCount === KATEGORIEN.length && (
        <p className="text-amber-400 text-xs text-center font-bold">
          🎉 Alle Badges gesammelt – du bist ein Quiz-Champion!
        </p>
      )}
    </div>
  )
}
