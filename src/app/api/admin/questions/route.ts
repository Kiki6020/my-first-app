import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PAGE_SIZE = 20
const BATCH_LIMIT = 200

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const questionImportSchema = z.object({
  fact_text: z.string().min(5).max(500),
  is_true: z.boolean(),
  explanation: z.string().min(5).max(1000),
  category: z.string().min(1).max(50),
})

const importBodySchema = z.object({
  questions: z.array(questionImportSchema).min(1).max(BATCH_LIMIT),
})

// ─── GET /api/admin/questions?page=1 (or ?all=true for export) ───────────────

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // Export mode: return all questions (no pagination)
  if (searchParams.get('all') === 'true') {
    const { data, error } = await supabase
      .from('questions')
      .select('fact_text, is_true, explanation, category')
      .order('category', { ascending: true })
      .order('fact_text', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Fehler beim Laden der Fragen' },
        { status: 500 }
      )
    }
    return NextResponse.json({ questions: data })
  }

  // Paginated mode
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('questions')
    .select('id, fact_text, is_true, explanation, category, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json(
      { error: 'Fehler beim Laden der Fragen' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    questions: data,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  })
}

// ─── DELETE /api/admin/questions — delete all questions ──────────────────────

export async function DELETE() {
  const { error } = await supabase
    .from('questions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    return NextResponse.json(
      { error: 'Fehler beim Löschen aller Fragen' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}

// ─── POST /api/admin/questions — bulk import ──────────────────────────────────

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const result = importBodySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    )
  }

  const { questions } = result.data

  // Upsert: skip duplicates (ON CONFLICT DO NOTHING via ignoreDuplicates)
  const { data, error } = await supabase
    .from('questions')
    .upsert(questions, { onConflict: 'fact_text', ignoreDuplicates: true })
    .select('id')

  if (error) {
    return NextResponse.json(
      { error: 'Fehler beim Importieren der Fragen' },
      { status: 500 }
    )
  }

  const imported = data?.length ?? 0
  const duplicates = questions.length - imported

  return NextResponse.json({ imported, duplicates }, { status: 201 })
}
