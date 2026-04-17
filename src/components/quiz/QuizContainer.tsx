'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { supabase, type Question } from '@/lib/supabase'
import confetti from 'canvas-confetti'
import { ArrowRight } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type GamePhase = 'loading' | 'playing' | 'feedback' | 'result' | 'error'
type ErrorType = 'network' | 'too_few_questions'
type AnswerResult = 'correct' | 'incorrect'

interface RoundAnswer {
  question: Question
  userAnswer: boolean
  correct: boolean
}

// ─── Confetti helper ──────────────────────────────────────────────────────────

function fireConfetti() {
  const end = Date.now() + 2000
  const colors = ['#22d3ee', '#a855f7', '#6366f1', '#fbbf24', '#ffffff']

  const frame = () => {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    })
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

// ─── Category Emojis ─────────────────────────────────────────────────────────

const CATEGORY_EMOJIS: Record<string, string> = {
  Tiere: '🐾',
  Weltraum: '🚀',
  Natur: '🌿',
  Koerper: '🫀',
  Körper: '🫀',
  Essen: '🍎',
  Welt: '🌍',
}

function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category] ?? '❓'
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QuizContainer() {
  const [phase, setPhase] = useState<GamePhase>('loading')
  const [errorType, setErrorType] = useState<ErrorType>('network')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<RoundAnswer[]>([])
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const answeredRef = useRef(false)

  const loadQuestions = useCallback(async () => {
    setPhase('loading')
    answeredRef.current = false
    setCurrentIndex(0)
    setAnswers([])
    setLastResult(null)
    setSelectedAnswer(null)
    setIsVisible(true)

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')

      if (error) {
        setErrorType('network')
        setPhase('error')
        return
      }

      // Shuffle all questions client-side, then take 10 — ensures true randomness
      // across the full question pool (ORDER BY RANDOM() not used due to Supabase tier limits)
      const shuffled = [...(data as Question[])].sort(() => Math.random() - 0.5)

      if (shuffled.length < 10) {
        setErrorType('too_few_questions')
        setPhase('error')
        return
      }

      setQuestions(shuffled.slice(0, 10))
      setPhase('playing')
    } catch {
      setErrorType('network')
      setPhase('error')
    }
  }, [])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const handleAnswer = useCallback(
    (answer: boolean) => {
      if (answeredRef.current) return
      answeredRef.current = true

      const current = questions[currentIndex]
      const correct = answer === current.is_true
      const result: AnswerResult = correct ? 'correct' : 'incorrect'

      setSelectedAnswer(answer)
      setLastResult(result)
      setPhase('feedback')

      if (correct) {
        fireConfetti()
      }

      const newAnswers = [
        ...answers,
        { question: current, userAnswer: answer, correct },
      ]
      setAnswers(newAnswers)
    },
    [questions, currentIndex, answers]
  )

  const handleAdvance = useCallback(() => {
    if (currentIndex + 1 >= 10) {
      setPhase('result')
    } else {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentIndex((i) => i + 1)
        setSelectedAnswer(null)
        setLastResult(null)
        answeredRef.current = false
        setIsVisible(true)
        setPhase('playing')
      }, 300)
    }
  }, [currentIndex])

  const score = answers.filter((a) => a.correct).length

  // ── Render ──────────────────────────────────────────────────────────────────

  if (phase === 'loading') return <LoadingScreen />
  if (phase === 'error') return <ErrorScreen type={errorType} onRetry={loadQuestions} />
  if (phase === 'result') return <ResultScreen score={score} onNewRound={loadQuestions} />

  const current = questions[currentIndex]
  const progressValue = ((currentIndex + (phase === 'feedback' ? 1 : 0)) / 10) * 100

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-8">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 text-sm font-medium">
            Frage {currentIndex + 1} von 10
          </span>
          <span className="text-cyan-400 font-bold text-sm">
            {score} richtig
          </span>
        </div>

        {/* Progress bar */}
        <Progress
          value={progressValue}
          className="h-2 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-violet-500 [&>div]:transition-all [&>div]:duration-500"
        />

        {/* Question card */}
        <div
          className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm p-7 sm:p-9 shadow-2xl">
            {/* Category badge */}
            {current.category && (
              <span className="inline-block mb-4 px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider border border-zinc-700">
                {getCategoryEmoji(current.category)} {current.category}
              </span>
            )}

            {/* Fact text */}
            <p className="text-white text-xl sm:text-2xl font-semibold leading-snug mb-8">
              {current.fact_text}
            </p>

            {/* Answer buttons */}
            <div className="grid grid-cols-2 gap-4">
              <AnswerButton
                label="RICHTIG"
                value={true}
                selectedAnswer={selectedAnswer}
                correctAnswer={phase === 'feedback' ? current.is_true : null}
                phase={phase}
                onAnswer={handleAnswer}
              />
              <AnswerButton
                label="FALSCH"
                value={false}
                selectedAnswer={selectedAnswer}
                correctAnswer={phase === 'feedback' ? current.is_true : null}
                phase={phase}
                onAnswer={handleAnswer}
              />
            </div>

            {/* Feedback explanation */}
            {phase === 'feedback' && (
              <div className="mt-6 flex flex-col gap-4">
                <div
                  className={`rounded-2xl p-4 border text-sm font-medium leading-relaxed transition-all duration-300 ${
                    lastResult === 'correct'
                      ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
                      : 'bg-red-950/60 border-red-700/50 text-red-300'
                  }`}
                >
                  <span className="mr-2">
                    {lastResult === 'correct' ? '✅' : '❌'}
                  </span>
                  {current.explanation}
                </div>

                {/* Weiter button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleAdvance}
                    className="w-16 h-16 rounded-full bg-violet-600 hover:bg-violet-500 active:scale-95 text-white shadow-lg shadow-violet-900/40 transition-all duration-200 hover:scale-110 flex items-center justify-center border-2 border-violet-400/30 animate-pulse hover:animate-none"
                    aria-label="Weiter zur nächsten Frage"
                  >
                    <ArrowRight className="w-7 h-7" strokeWidth={3} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Answer Button ─────────────────────────────────────────────────────────────

interface AnswerButtonProps {
  label: string
  value: boolean
  selectedAnswer: boolean | null
  correctAnswer: boolean | null
  phase: GamePhase
  onAnswer: (answer: boolean) => void
}

function AnswerButton({ label, value, selectedAnswer, correctAnswer, phase, onAnswer }: AnswerButtonProps) {
  const isSelected = selectedAnswer === value
  const isFeedback = phase === 'feedback'
  const isCorrect = correctAnswer === value
  const isDisabled = isFeedback

  let buttonClass =
    'h-16 text-lg font-black rounded-2xl border-2 transition-all duration-200 '

  if (!isFeedback) {
    // Playing state: both buttons same neutral violet color
    buttonClass += 'bg-violet-600 hover:bg-violet-500 border-violet-500 text-white hover:scale-105 active:scale-95 shadow-lg shadow-violet-900/30'
  } else {
    // Feedback state: only the correct answer turns green
    if (isCorrect) {
      buttonClass += 'bg-emerald-500 border-emerald-400 text-white ring-4 ring-emerald-400/40'
    } else if (isSelected && !isCorrect) {
      // Wrong button that was clicked: muted, no special highlight
      buttonClass += 'bg-zinc-800 border-zinc-600 text-zinc-400 opacity-70'
    } else {
      buttonClass += 'bg-zinc-800 border-zinc-700 text-zinc-500'
    }
  }

  return (
    <button
      className={buttonClass}
      disabled={isDisabled}
      onClick={() => onAnswer(value)}
    >
      {label}
    </button>
  )
}

// ─── Loading Screen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-zinc-700 border-t-cyan-400 animate-spin" />
      <p className="text-zinc-400 text-base font-medium">Fragen werden geladen…</p>
    </div>
  )
}

// ─── Error Screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ type, onRetry }: { type: ErrorType; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center flex flex-col gap-6">
        <span className="text-5xl">{type === 'network' ? '📡' : '📭'}</span>
        <div className="flex flex-col gap-2">
          <h2 className="text-white text-xl font-bold">
            {type === 'network' ? 'Verbindungsproblem' : 'Zu wenig Fragen'}
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {type === 'network'
              ? 'Leider konnte keine Verbindung zur Datenbank hergestellt werden. Bitte neu laden.'
              : 'Zu wenig Fragen verfügbar. Bitte zuerst Fragen importieren.'}
          </p>
        </div>
        <Button
          onClick={onRetry}
          className="w-full h-12 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold"
        >
          Neu laden
        </Button>
      </div>
    </div>
  )
}

// ─── Result Screen ────────────────────────────────────────────────────────────

function ResultScreen({ score, onNewRound }: { score: number; onNewRound: () => void }) {
  useEffect(() => {
    // Celebration confetti on result screen
    setTimeout(() => {
      if (score >= 7) {
        fireConfetti()
        setTimeout(fireConfetti, 800)
      }
    }, 300)
  }, [score])

  const emoji =
    score === 10 ? '🏆' : score >= 7 ? '🎉' : score >= 5 ? '💪' : '🤔'
  const message =
    score === 10
      ? 'Perfekt! Alles richtig!'
      : score >= 7
      ? 'Sehr gut gemacht!'
      : score >= 5
      ? 'Nicht schlecht!'
      : 'Weiter üben – du schaffst das!'

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-sm w-full flex flex-col items-center gap-8">
        {/* Score display */}
        <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm p-8 text-center flex flex-col items-center gap-5 shadow-2xl">
          <span className="text-6xl">{emoji}</span>

          <div className="flex flex-col gap-1">
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest">
              Dein Ergebnis
            </p>
            <p className="text-white text-5xl font-black">
              {score}
              <span className="text-zinc-500 text-3xl font-bold"> / 10</span>
            </p>
          </div>

          <p className="text-zinc-300 text-lg font-semibold">{message}</p>

          {/* Score bar */}
          <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-1000"
              style={{ width: `${(score / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-3">
          <Button
            onClick={onNewRound}
            size="lg"
            className="w-full h-14 text-lg font-bold rounded-2xl bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40 transition-all hover:scale-105"
          >
            Neue Runde →
          </Button>
          <Button
            variant="outline"
            size="lg"
            disabled
            className="w-full h-12 rounded-2xl border-zinc-700 text-zinc-500 text-sm font-medium cursor-not-allowed"
          >
            🏅 Highscore ansehen (kommt bald)
          </Button>
        </div>
      </div>
    </div>
  )
}
