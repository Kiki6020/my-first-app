import { NextRequest, NextResponse } from 'next/server'
import { makeSessionToken } from '@/lib/admin-token'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect admin routes
  const isAdminRoute =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin')

  if (!isAdminRoute) return NextResponse.next()

  // Login endpoint is always allowed
  if (pathname === '/api/admin/login') return NextResponse.next()

  const token = request.cookies.get('admin_session')?.value
  const expected = await makeSessionToken()

  if (token !== expected) {
    // API routes → 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }
    // Page routes → let the page render (client-side login form handles it)
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
}
