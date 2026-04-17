import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const postSchema = z.object({
  nickname: z
    .string()
    .min(2, 'Nickname muss mindestens 2 Zeichen haben')
    .max(12, 'Nickname darf maximal 12 Zeichen haben')
    .regex(
      /^[a-zA-Z0-9äöüÄÖÜß\-]+$/,
      'Nur Buchstaben, Zahlen und Bindestriche erlaubt'
    ),
  score: z.number().int().min(0).max(10),
  total_questions: z.number().int().min(1).max(10),
})

export async function GET() {
  const { data, error } = await supabase
    .from('scores')
    .select('id, nickname, score, total_questions, created_at')
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(20)

  if (error) {
    return NextResponse.json(
      { error: 'Fehler beim Laden der Highscores' },
      { status: 500 }
    )
  }

  return NextResponse.json({ scores: data })
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const result = postSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('scores')
    .insert([result.data])
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: 'Fehler beim Speichern des Scores' },
      { status: 500 }
    )
  }

  return NextResponse.json({ score: data }, { status: 201 })
}
