import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Question {
  id: string
  fact_text: string
  is_true: boolean
  explanation: string
  category: string
  created_at: string
}

export interface Score {
  id: string
  nickname: string
  score: number
  total_questions: number
  created_at: string
}

export interface Badge {
  nickname: string
  category: string
  unlocked_at: string
}
