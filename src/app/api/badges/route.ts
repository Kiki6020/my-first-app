import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const querySchema = z.object({
  nickname: z
    .string()
    .min(2, 'Nickname muss mindestens 2 Zeichen haben')
    .max(12, 'Nickname darf maximal 12 Zeichen haben'),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const result = querySchema.safeParse({ nickname: searchParams.get('nickname') })

  if (!result.success) {
    return NextResponse.json({ error: 'Ungültiger Nickname' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('nickname_badges')
    .select('category, unlocked_at')
    .eq('nickname', result.data.nickname)

  if (error) {
    // Table might not exist yet — return empty list instead of error
    return NextResponse.json({ badges: [] })
  }

  return NextResponse.json({ badges: data ?? [] })
}
