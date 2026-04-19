'use client'

import { useEffect, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { getKategorieEmoji, getKategorieLabel } from '@/lib/categories'

interface BadgePopupProps {
  category: string
  onClose: () => void
}

export function BadgePopup({ category, onClose }: BadgePopupProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-close after 3 seconds
  useEffect(() => {
    timerRef.current = setTimeout(onClose, 3000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [onClose])

  const emoji = getKategorieEmoji(category)
  const label = getKategorieLabel(category)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="bg-zinc-900 border-zinc-700 rounded-3xl max-w-xs mx-auto text-center p-0 overflow-hidden shadow-2xl shadow-amber-900/30"
        // Remove the default close button (X) — the popup auto-closes
        aria-describedby="badge-popup-desc"
      >
        {/* Animated colored top band */}
        <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 py-8 flex flex-col items-center gap-2 animate-badge-shine">
          <span className="text-6xl select-none animate-badge-bounce">{emoji}</span>
        </div>

        {/* Content */}
        <div className="px-6 py-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <p className="text-amber-400 text-lg font-black tracking-wide">
              Neuer Badge!
            </p>
          </div>
          <p id="badge-popup-desc" className="text-white text-xl font-black">
            Kategorie-Meister:
          </p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-800 border border-zinc-700">
            <span className="text-2xl">{emoji}</span>
            <span className="text-white font-bold text-lg">{label}</span>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Du hast alle Fragen in dieser Kategorie richtig beantwortet. Super!
          </p>

          {/* Click-to-close hint */}
          <button
            onClick={onClose}
            className="mt-1 text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
          >
            Tippe zum Schließen
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
