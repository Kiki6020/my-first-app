'use client'

import { useEffect, useState } from 'react'
import { QuizContainer } from '@/components/quiz/QuizContainer'
import { NicknameScreen } from '@/components/quiz/NicknameScreen'

export default function QuizPage() {
  const [nickname, setNickname] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('quizNickname')
    setNickname(saved)
    setMounted(true)
  }, [])

  const handleNicknameSet = (name: string) => {
    localStorage.setItem('quizNickname', name)
    setNickname(name)
  }

  const handleChangeNickname = () => {
    localStorage.removeItem('quizNickname')
    setNickname(null)
  }

  if (!mounted) return null

  if (!nickname) {
    return <NicknameScreen onNicknameSet={handleNicknameSet} />
  }

  return (
    <QuizContainer nickname={nickname} onChangeNickname={handleChangeNickname} />
  )
}
