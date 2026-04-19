'use client'

import { useEffect, useState } from 'react'
import { QuizContainer } from '@/components/quiz/QuizContainer'
import { NicknameScreen } from '@/components/quiz/NicknameScreen'
import { KategorieScreen } from '@/components/quiz/KategorieScreen'

export default function QuizPage() {
  const [nickname, setNickname] = useState<string | null>(null)
  const [kategorie, setKategorie] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('quizNickname')
    setNickname(saved)
    setMounted(true)
  }, [])

  const handleNicknameSet = (name: string) => {
    localStorage.setItem('quizNickname', name)
    setNickname(name)
    setKategorie(null)
  }

  const handleChangeNickname = () => {
    localStorage.removeItem('quizNickname')
    setNickname(null)
    setKategorie(null)
  }

  if (!mounted) return null

  if (!nickname) {
    return <NicknameScreen onNicknameSet={handleNicknameSet} />
  }

  if (!kategorie) {
    return (
      <KategorieScreen
        nickname={nickname}
        onKategorieSelected={setKategorie}
      />
    )
  }

  return (
    <QuizContainer
      nickname={nickname}
      category={kategorie}
      onChangeNickname={handleChangeNickname}
    />
  )
}
