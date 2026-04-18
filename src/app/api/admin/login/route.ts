import { NextRequest, NextResponse } from 'next/server'
import { makeSessionToken } from '@/lib/admin-token'
import { z } from 'zod'

// ─── Rate limiting (in-memory — good enough for home project) ─────────────────
const LOCKOUT_DURATION_MS = 30_000
const MAX_ATTEMPTS = 3

interface RateEntry {
  attempts: number
  lockedUntil: number | null
}

const rateLimitMap = new Map<string, RateEntry>()

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function checkRateLimit(ip: string): { allowed: boolean; waitSeconds: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip) ?? { attempts: 0, lockedUntil: null }

  if (entry.lockedUntil !== null) {
    if (now < entry.lockedUntil) {
      return {
        allowed: false,
        waitSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
      }
    }
    // Lockout expired — reset
    rateLimitMap.set(ip, { attempts: 0, lockedUntil: null })
  }

  return { allowed: true, waitSeconds: 0 }
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const entry = rateLimitMap.get(ip) ?? { attempts: 0, lockedUntil: null }
  const newAttempts = entry.attempts + 1
  rateLimitMap.set(ip, {
    attempts: newAttempts,
    lockedUntil: newAttempts >= MAX_ATTEMPTS ? now + LOCKOUT_DURATION_MS : null,
  })
}

function clearAttempts(ip: string): void {
  rateLimitMap.delete(ip)
}

// ─── Route handler ─────────────────────────────────────────────────────────────
const bodySchema = z.object({
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  // Rate limit check
  const { allowed, waitSeconds } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: `Zu viele Versuche. Bitte warte ${waitSeconds} Sekunden.` },
      { status: 429 }
    )
  }

  // Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const result = bodySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Passwort fehlt' }, { status: 400 })
  }

  const adminPassword = process.env.ADMIN_PASSWORD ?? ''
  if (result.data.password !== adminPassword) {
    recordFailedAttempt(ip)
    return NextResponse.json(
      { error: 'Falsches Passwort' },
      { status: 401 }
    )
  }

  clearAttempts(ip)

  const token = await makeSessionToken()
  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // secure: true in production (Vercel sets HTTPS automatically)
    maxAge: 60 * 60 * 8, // 8 hours
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('admin_session')
  return response
}
