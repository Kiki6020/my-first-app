import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('nickname_badges')
    .select('nickname, category, unlocked_at')
    .order('unlocked_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: 'Fehler beim Laden der Badges' },
      { status: 500 }
    )
  }

  return NextResponse.json({ badges: data ?? [], total: data?.length ?? 0 })
}

export async function DELETE() {
  const { error } = await supabase
    .from('nickname_badges')
    .delete()
    .neq('nickname', '')

  if (error) {
    return NextResponse.json(
      { error: 'Fehler beim Löschen aller Badges' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
