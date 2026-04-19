import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const checkSchema = z.object({
  nickname: z
    .string()
    .min(2, 'Nickname muss mindestens 2 Zeichen haben')
    .max(12, 'Nickname darf maximal 12 Zeichen haben'),
  category: z.string().min(1),
  correctQuestionIds: z.array(z.string()),
  totalShown: z.number().int().min(1),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const result = checkSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    )
  }

  const { nickname, category, correctQuestionIds, totalShown } = result.data

  // "Alle Kategorien" spielen gibt keine Badges
  if (category === 'alle') {
    return NextResponse.json({ newBadge: false })
  }

  // Badge nur wenn alle Fragen der Session richtig beantwortet wurden (Option A)
  const allAnsweredCorrectly = correctQuestionIds.length === totalShown
  if (!allAnsweredCorrectly) {
    return NextResponse.json({ newBadge: false })
  }

  // Badge schon vorhanden?
  const { data: existingBadge } = await supabase
    .from('nickname_badges')
    .select('category')
    .eq('nickname', nickname)
    .eq('category', category)
    .maybeSingle()

  if (existingBadge) {
    return NextResponse.json({ newBadge: false })
  }

  // Badge freischalten!
  const { error: insertError } = await supabase
    .from('nickname_badges')
    .insert([{ nickname, category, unlocked_at: new Date().toISOString() }])

  if (insertError) {
    // Unique-Constraint-Verletzung (Race Condition) → Badge existiert bereits
    return NextResponse.json({ newBadge: false })
  }

  return NextResponse.json({ newBadge: true, category })
}
