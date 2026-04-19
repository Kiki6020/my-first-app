import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { KATEGORIEN } from '@/lib/categories'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('questions')
    .select('category')

  if (error) {
    return NextResponse.json(
      { error: 'Fehler beim Laden der Kategorien' },
      { status: 500 }
    )
  }

  // Count questions per category
  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const cat = (row.category as string) ?? 'Welt'
    counts.set(cat, (counts.get(cat) ?? 0) + 1)
  }

  const categories = KATEGORIEN.map((k) => ({
    id: k.id,
    emoji: k.emoji,
    label: k.label,
    questionCount: counts.get(k.id) ?? 0,
  }))

  const totalCount = (data ?? []).length

  return NextResponse.json({ categories, totalCount })
}
