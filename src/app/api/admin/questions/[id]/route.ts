import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Basic UUID validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 })
  }

  const { error } = await supabase.from('questions').delete().eq('id', id)

  if (error) {
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Frage' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
