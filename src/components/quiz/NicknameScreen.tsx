'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface NicknameScreenProps {
  onNicknameSet: (nickname: string) => void
  prefilled?: string
}

function validate(v: string): string | null {
  if (v.length < 2) return 'Bitte gib einen Spitznamen ein (2–12 Zeichen)'
  if (v.length > 12) return 'Spitzname darf maximal 12 Zeichen haben'
  if (!/^[a-zA-Z0-9äöüÄÖÜß\-]+$/.test(v))
    return 'Nur Buchstaben, Zahlen und Bindestriche erlaubt'
  return null
}

export function NicknameScreen({ onNicknameSet, prefilled = '' }: NicknameScreenProps) {
  const [value, setValue] = useState(prefilled)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    const err = validate(trimmed)
    if (err) {
      setError(err)
      return
    }
    onNicknameSet(trimmed)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        <div className="text-6xl select-none">👋</div>

        <div className="text-center flex flex-col gap-2">
          <h1 className="text-3xl font-black text-white">Wie heißt du?</h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            Gib deinen Spitznamen ein, damit dein Score in der Rangliste erscheint.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Input
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                if (error) setError('')
              }}
              placeholder="Dein Spitzname…"
              maxLength={12}
              autoFocus
              autoComplete="off"
              className="h-14 text-xl text-center rounded-2xl bg-zinc-800 border-zinc-700 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 placeholder:text-zinc-500 text-white"
            />
            {error ? (
              <p className="text-red-400 text-sm text-center font-medium">{error}</p>
            ) : (
              <p className="text-zinc-600 text-xs text-center">
                2–12 Zeichen · Buchstaben, Zahlen, Bindestriche
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg font-bold rounded-2xl bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40 transition-all hover:scale-105"
          >
            Los geht&apos;s →
          </Button>
        </form>
      </div>
    </div>
  )
}
