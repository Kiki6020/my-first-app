/**
 * Generates the admin session token using Web Crypto API (works in both
 * Edge Runtime and Node.js 18+).
 */
export async function makeSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET ?? 'fallback-secret'
  const password = process.env.ADMIN_PASSWORD ?? ''

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(password + ':admin-session')
  )
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
