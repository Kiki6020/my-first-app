import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('scores')
    .select('id, nickname, score, total_questions, created_at')
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: 'Fehler beim Laden der Highscores' },
      { status: 500 }
    )
  }

  return NextResponse.json({ scores: data })
}
