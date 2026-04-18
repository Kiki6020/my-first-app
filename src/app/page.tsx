import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      {/* Decorative background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 text-center max-w-lg">
        {/* Icon */}
        <div className="text-7xl select-none">👑</div>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight">
            <span className="text-white">Carla</span>
            <span className="text-cyan-400">'s</span>
            <span className="text-white"> Quiz</span>
          </h1>
          <p className="text-zinc-400 text-lg sm:text-xl font-medium">
            Richtig oder falsch? Teste dein Wissen!
          </p>
        </div>

        {/* Info chips */}
        <div className="flex gap-3 flex-wrap justify-center">
          <span className="px-4 py-1.5 rounded-full bg-zinc-800 text-zinc-300 text-sm font-medium border border-zinc-700">
            10 Fragen pro Runde
          </span>
          <span className="px-4 py-1.5 rounded-full bg-zinc-800 text-zinc-300 text-sm font-medium border border-zinc-700">
            Richtig / Falsch
          </span>
          <span className="px-4 py-1.5 rounded-full bg-zinc-800 text-zinc-300 text-sm font-medium border border-zinc-700">
            🎉 Konfetti bei richtiger Antwort
          </span>
        </div>

        {/* Start button */}
        <div className="w-full max-w-xs flex flex-col gap-3">
          <Link href="/quiz" className="w-full">
            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold rounded-2xl bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40 transition-all hover:scale-105 hover:shadow-violet-700/50"
            >
              Quiz starten →
            </Button>
          </Link>
          <Link href="/highscore" className="w-full">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 rounded-2xl border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 text-sm font-medium"
            >
              🏆 Highscore ansehen
            </Button>
          </Link>
        </div>

        {/* Admin link — subtle, for parents/operators */}
        <Link
          href="/admin"
          className="text-zinc-700 hover:text-zinc-500 text-xs transition-colors"
        >
          ⚙️ Admin
        </Link>
      </div>
    </main>
  )
}
