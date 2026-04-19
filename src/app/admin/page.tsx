'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Upload, Trash2, ChevronLeft, ChevronRight, LogOut, Download, FileDown } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreviewQuestion {
  fact_text: string
  is_true: boolean
  explanation: string
  category: string
  isDuplicate?: boolean
  isInvalid?: boolean
}

interface DbQuestion {
  id: string
  fact_text: string
  is_true: boolean
  explanation: string
  category: string
  created_at: string
}

interface DbScore {
  id: string
  nickname: string
  score: number
  total_questions: number
  created_at: string
}

// ─── CSV template ─────────────────────────────────────────────────────────────

const CSV_TEMPLATE =
  'frage,antwort,erklaerung,kategorie\n' +
  '"Delfine schlafen mit einem Auge offen.",wahr,"Delfine schlafen tatsächlich mit einer Gehirnhälfte.",Tiere\n' +
  '"Pinguine können fliegen.",falsch,"Pinguine haben Flügel, aber sie können nicht fliegen.",Tiere'

function downloadCsvTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'fragen-vorlage.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseCsvRow(row: Record<string, string>): PreviewQuestion | null {
  const frage = (row['frage'] ?? '').trim()
  const antwortRaw = (row['antwort'] ?? '').trim().toLowerCase()
  const erklaerung = (row['erklaerung'] ?? '').trim()
  const kategorie = (row['kategorie'] ?? '').trim()

  if (!frage || !erklaerung || !kategorie) return null

  if (antwortRaw !== 'wahr' && antwortRaw !== 'falsch') {
    return {
      fact_text: frage,
      is_true: false,
      explanation: erklaerung,
      category: kategorie,
      isInvalid: true,
    }
  }

  return {
    fact_text: frage,
    is_true: antwortRaw === 'wahr',
    explanation: erklaerung,
    category: kategorie,
  }
}

function parseJsonQuestions(json: unknown): PreviewQuestion[] {
  if (!Array.isArray(json)) return []
  return json
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const obj = item as Record<string, unknown>
      const frage = typeof obj['frage'] === 'string' ? obj['frage'].trim() : ''
      const antwortRaw =
        typeof obj['antwort'] === 'string' ? obj['antwort'].trim().toLowerCase() : ''
      const erklaerung =
        typeof obj['erklaerung'] === 'string' ? obj['erklaerung'].trim() : ''
      const kategorie =
        typeof obj['kategorie'] === 'string' ? obj['kategorie'].trim() : ''
      if (!frage || !erklaerung || !kategorie) return null
      if (antwortRaw !== 'wahr' && antwortRaw !== 'falsch') {
        return {
          fact_text: frage,
          is_true: false,
          explanation: erklaerung,
          category: kategorie,
          isInvalid: true,
        }
      }
      return {
        fact_text: frage,
        is_true: antwortRaw === 'wahr',
        explanation: erklaerung,
        category: kategorie,
      }
    })
    .filter((q): q is PreviewQuestion => q !== null)
}

function markDuplicates(
  preview: PreviewQuestion[],
  existingTexts: Set<string>
): PreviewQuestion[] {
  const seen = new Set<string>()
  return preview.map((q) => {
    const lower = q.fact_text.toLowerCase()
    const isDuplicate = existingTexts.has(lower) || seen.has(lower)
    seen.add(lower)
    return { ...q, isDuplicate }
  })
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Fehler')
      } else {
        onLoggedIn()
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm p-8 flex flex-col gap-6 shadow-2xl">
          <div className="text-center flex flex-col gap-2">
            <span className="text-5xl">🔐</span>
            <h1 className="text-white text-2xl font-black">Admin-Bereich</h1>
            <p className="text-zinc-400 text-sm">Nur für Betreiber</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-12 rounded-xl"
              autoFocus
              required
            />
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold"
            >
              {loading ? 'Prüfen…' : 'Anmelden'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Import Tab ───────────────────────────────────────────────────────────────

function ImportTab() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<PreviewQuestion[] | null>(null)
  const [parseError, setParseError] = useState('')
  const [importState, setImportState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [importResult, setImportResult] = useState<{
    imported: number
    duplicates: number
  } | null>(null)
  // Existing question texts for duplicate detection (loaded once on mount)
  const [existingTexts, setExistingTexts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/admin/questions?all=true')
      .then((r) => r.json())
      .then((data) => {
        const texts = new Set<string>(
          (data.questions ?? []).map((q: { fact_text: string }) =>
            q.fact_text.toLowerCase()
          )
        )
        setExistingTexts(texts)
      })
      .catch(() => {})
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError('')
    setPreview(null)
    setImportState('idle')
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (!text || text.trim().length === 0) {
        setParseError('Die Datei enthält keine Fragen')
        return
      }

      if (file.name.endsWith('.json')) {
        // JSON
        try {
          const json = JSON.parse(text)
          const parsed = parseJsonQuestions(json)
          if (parsed.length === 0) {
            setParseError('Ungültiges Format – bitte verwende die Vorlage')
            return
          }
          setPreview(markDuplicates(parsed.slice(0, 200), existingTexts))
        } catch {
          setParseError('Ungültiges JSON-Format')
        }
      } else {
        // CSV
        const result = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
        })

        const requiredCols = ['frage', 'antwort', 'erklaerung', 'kategorie']
        const headers = result.meta.fields ?? []
        const hasAllCols = requiredCols.every((c) => headers.includes(c))
        if (!hasAllCols) {
          setParseError('Ungültiges Format – bitte verwende die Vorlage')
          return
        }

        const parsed = result.data
          .map(parseCsvRow)
          .filter((q): q is PreviewQuestion => q !== null)
        if (parsed.length === 0) {
          setParseError('Die Datei enthält keine Fragen')
          return
        }
        setPreview(markDuplicates(parsed.slice(0, 200), existingTexts))
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImport() {
    if (!preview) return
    const valid = preview.filter((q) => !q.isInvalid && !q.isDuplicate)
    if (valid.length === 0) return

    setImportState('loading')
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: valid }),
      })
      const data = await res.json()
      if (!res.ok) {
        setImportState('error')
      } else {
        setImportResult(data)
        setImportState('success')
        setPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch {
      setImportState('error')
    }
  }

  function handleCancel() {
    setPreview(null)
    setParseError('')
    setImportState('idle')
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validCount = preview?.filter((q) => !q.isInvalid && !q.isDuplicate).length ?? 0
  const duplicateCount = preview?.filter((q) => q.isDuplicate).length ?? 0
  const invalidCount = preview?.filter((q) => q.isInvalid).length ?? 0

  return (
    <div className="flex flex-col gap-6">
      {/* Upload area */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-white font-bold text-lg">Fragen importieren</h2>
            <p className="text-zinc-400 text-sm mt-0.5">
              CSV oder JSON Datei hochladen (max. 200 Fragen)
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCsvTemplate}
            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-2"
          >
            <Download className="w-4 h-4" />
            CSV-Vorlage
          </Button>
        </div>

        <label className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-zinc-700 hover:border-violet-500/60 cursor-pointer transition-colors bg-zinc-900/40">
          <Upload className="w-8 h-8 text-zinc-500" />
          <span className="text-zinc-400 text-sm text-center">
            CSV oder JSON Datei auswählen
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {parseError && (
          <div className="rounded-xl bg-red-950/40 border border-red-700/50 p-3 text-red-300 text-sm">
            ❌ {parseError}
          </div>
        )}

        {importState === 'success' && importResult && (
          <div className="rounded-xl bg-emerald-950/40 border border-emerald-700/50 p-3 text-emerald-300 text-sm">
            ✅ {importResult.imported} Fragen importiert
            {importResult.duplicates > 0
              ? `, ${importResult.duplicates} Duplikate übersprungen`
              : ''}
          </div>
        )}

        {importState === 'error' && (
          <div className="rounded-xl bg-red-950/40 border border-red-700/50 p-3 text-red-300 text-sm">
            ❌ Import fehlgeschlagen. Bitte nochmal versuchen.
          </div>
        )}
      </div>

      {/* Preview table */}
      {preview && preview.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-white font-bold">Vorschau</h3>
            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
              {validCount} gültig
            </Badge>
            {duplicateCount > 0 && (
              <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30">
                {duplicateCount} Duplikate
              </Badge>
            )}
            {invalidCount > 0 && (
              <Badge className="bg-red-600/20 text-red-400 border-red-600/30">
                {invalidCount} ungültig
              </Badge>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto max-h-80">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 w-8">#</TableHead>
                    <TableHead className="text-zinc-400">Frage</TableHead>
                    <TableHead className="text-zinc-400 w-20">Antwort</TableHead>
                    <TableHead className="text-zinc-400 w-24">Kategorie</TableHead>
                    <TableHead className="text-zinc-400 w-20">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((q, i) => (
                    <TableRow
                      key={i}
                      className={`border-zinc-800 ${
                        q.isInvalid
                          ? 'bg-red-950/20'
                          : q.isDuplicate
                          ? 'bg-amber-950/20'
                          : ''
                      }`}
                    >
                      <TableCell className="text-zinc-500 text-xs">{i + 1}</TableCell>
                      <TableCell className="text-zinc-200 text-sm max-w-xs truncate">
                        {q.fact_text}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            q.is_true
                              ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs'
                              : 'bg-red-600/20 text-red-400 border-red-600/30 text-xs'
                          }
                        >
                          {q.is_true ? 'wahr' : 'falsch'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm">{q.category}</TableCell>
                      <TableCell>
                        {q.isInvalid ? (
                          <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">
                            ungültig
                          </Badge>
                        ) : q.isDuplicate ? (
                          <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30 text-xs">
                            Duplikat
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">
                            ok
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {validCount > 0 && (
            <div className="flex gap-3">
              <Button
                onClick={handleImport}
                disabled={importState === 'loading'}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl"
              >
                {importState === 'loading'
                  ? 'Importiere…'
                  : `${validCount} Fragen importieren`}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl"
              >
                Abbrechen
              </Button>
            </div>
          )}

          {validCount === 0 && (
            <div className="flex items-center gap-3">
              <p className="text-zinc-500 text-sm">
                Keine importierbaren Fragen gefunden (alle ungültig oder Duplikate).
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl"
              >
                Zurücksetzen
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Questions List Tab ───────────────────────────────────────────────────────

function QuestionsTab() {
  const [questions, setQuestions] = useState<DbQuestion[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const loadQuestions = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/questions?page=${p}`)
      const data = await res.json()
      setQuestions(data.questions ?? [])
      setTotal(data.total ?? 0)
    } catch {
      // silent — user can retry
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQuestions(page)
  }, [page, loadQuestions])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' })
      await loadQuestions(page)
    } catch {
      // silent
    } finally {
      setDeletingId(null)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/admin/questions?all=true')
      const data = await res.json()
      const rows: { frage: string; antwort: string; erklaerung: string; kategorie: string }[] =
        (data.questions ?? []).map((q: DbQuestion) => ({
          frage: q.fact_text,
          antwort: q.is_true ? 'wahr' : 'falsch',
          erklaerung: q.explanation,
          kategorie: q.category,
        }))
      const csv = Papa.unparse(rows, { header: true })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `carlas-quiz-fragen-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-lg">Alle Fragen</h2>
          <p className="text-zinc-400 text-sm mt-0.5">{total} Fragen gesamt</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 gap-2"
          >
            <FileDown className="w-4 h-4" />
            {exporting ? 'Exportiere…' : 'Als CSV exportieren'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadQuestions(page)}
            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            Aktualisieren
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-zinc-700 border-t-cyan-400 animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 p-10 text-center text-zinc-500">
          Noch keine Fragen vorhanden.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Frage</TableHead>
                    <TableHead className="text-zinc-400 w-20">Antwort</TableHead>
                    <TableHead className="text-zinc-400 w-24">Kategorie</TableHead>
                    <TableHead className="text-zinc-400 w-16 text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((q) => (
                    <TableRow key={q.id} className="border-zinc-800">
                      <TableCell className="text-zinc-200 text-sm max-w-xs">
                        <p className="truncate">{q.fact_text}</p>
                        <p className="text-zinc-500 text-xs mt-0.5 truncate">{q.explanation}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            q.is_true
                              ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs'
                              : 'bg-red-600/20 text-red-400 border-red-600/30 text-xs'
                          }
                        >
                          {q.is_true ? 'wahr' : 'falsch'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm">{q.category}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletingId === q.id}
                              className="text-zinc-500 hover:text-red-400 hover:bg-red-950/30 w-8 h-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Frage löschen?</AlertDialogTitle>
                              <AlertDialogDescription className="text-zinc-400">
                                &ldquo;{q.fact_text}&rdquo; wird dauerhaft gelöscht.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                                Abbrechen
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(q.id)}
                                className="bg-red-600 hover:bg-red-500 text-white"
                              >
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-zinc-500 text-sm">
                Seite {page} von {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 w-8 h-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 w-8 h-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Highscores Tab ───────────────────────────────────────────────────────────

function HighscoresTab() {
  const [scores, setScores] = useState<DbScore[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadScores = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/scores')
      const data = await res.json()
      setScores(data.scores ?? [])
    } catch {
      // silent — user can reload
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadScores()
  }, [loadScores])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/admin/scores/${id}`, { method: 'DELETE' })
    } catch {
      // silent
    } finally {
      setDeletingId(null)
      await loadScores()
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-lg">Highscores</h2>
          <p className="text-zinc-400 text-sm mt-0.5">{scores.length} Einträge</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadScores}
          className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
        >
          Aktualisieren
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-zinc-700 border-t-cyan-400 animate-spin" />
        </div>
      ) : scores.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 p-10 text-center text-zinc-500">
          Noch keine Highscores vorhanden.
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Spitzname</TableHead>
                  <TableHead className="text-zinc-400 w-20">Score</TableHead>
                  <TableHead className="text-zinc-400 w-40">Datum & Uhrzeit</TableHead>
                  <TableHead className="text-zinc-400 w-16 text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((s, i) => (
                  <TableRow key={s.id} className="border-zinc-800">
                    <TableCell className="text-zinc-200 text-sm font-medium">
                      <span className="text-zinc-500 text-xs mr-2">#{i + 1}</span>
                      {s.nickname}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-violet-600/20 text-violet-300 border-violet-600/30 text-xs">
                        {s.score}/{s.total_questions}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {formatDate(s.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingId === s.id}
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-950/30 w-8 h-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Highscore löschen?</AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-400">
                              Der Eintrag von &ldquo;{s.nickname}&rdquo; ({s.score}/{s.total_questions} Punkte) wird dauerhaft gelöscht.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                              Abbrechen
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(s.id)}
                              className="bg-red-600 hover:bg-red-500 text-white"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  // The middleware already verified the session cookie, so if we render here,
  // the user is authenticated. We only need the login form for a fresh session.
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Verify session by hitting a protected endpoint
    fetch('/api/admin/questions?page=1')
      .then((res) => {
        if (res.ok) setIsLoggedIn(true)
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  async function handleLogout() {
    await fetch('/api/admin/login', { method: 'DELETE' })
    setIsLoggedIn(false)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-zinc-700 border-t-cyan-400 animate-spin" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginForm onLoggedIn={() => setIsLoggedIn(true)} />
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-black">
              🔐 Admin-Bereich
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Carla&apos;s Quiz verwalten</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-zinc-400 hover:text-white gap-2"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="import">
          <TabsList className="bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <TabsTrigger
              value="import"
              className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white text-zinc-400"
            >
              📥 Importieren
            </TabsTrigger>
            <TabsTrigger
              value="questions"
              className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white text-zinc-400"
            >
              📋 Fragen verwalten
            </TabsTrigger>
            <TabsTrigger
              value="highscores"
              className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white text-zinc-400"
            >
              🏆 Highscores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-6">
            <ImportTab />
          </TabsContent>

          <TabsContent value="questions" className="mt-6">
            <QuestionsTab />
          </TabsContent>

          <TabsContent value="highscores" className="mt-6">
            <HighscoresTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
