// middleware.js
import { NextResponse } from 'next/server'

const PUBLIC_ROUTES = new Set(['/login']) // add /register, /forgot-password if you have them
const PUBLIC_PREFIXES = [
  '/api', // don't auth-guard API routes
  '/_next', // Next static/runtime
  '/assets',
  '/images',
  '/favicon.ico',
  '/.well-known', // Chrome/devtools & other probes
]

const LEEWAY_SECONDS = 60
const nowSeconds = () => Math.floor(Date.now() / 1000)

export function middleware(req) {
  const { pathname, search } = req.nextUrl

  // 1) Skip paths that should never be guarded
  for (const p of PUBLIC_PREFIXES) {
    if (pathname === p || pathname.startsWith(p + '/')) {
      return NextResponse.next()
    }
  }
  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next()
  }

  // 2) Read cookies
  const access = req.cookies.get('access_token')?.value
  const expRaw = req.cookies.get('expires_at')?.value
  const exp = Number(expRaw || 0)

  // 3) Not authed → redirect to /login with ?next=<current>
  if (!access || !exp) {
    const url = new URL('/login', req.url)
    if (!url.searchParams.get('next')) {
      url.searchParams.set('next', pathname + search)
    }
    return NextResponse.redirect(url)
  }

  // 4) If you do refresh logic, do it here (near-expiry); otherwise just continue
  if (exp - nowSeconds() <= LEEWAY_SECONDS) {
    // optional: call your refresh endpoint and update cookies on resp
    // If refresh fails, redirect to /login like above.
  }

  return NextResponse.next()
}

// IMPORTANT: exclude api + .well-known here too
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|images|\\.well-known).*)',
  ],
}
