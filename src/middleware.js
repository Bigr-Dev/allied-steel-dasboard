// middleware.js
import { NextResponse } from 'next/server'

const PUBLIC_ROUTES = new Set(['/login'])
const PUBLIC_PREFIXES = [
  '/api',
  '/_next',
  '/assets',
  '/images',
  '/favicon.ico',
  '/.well-known',
]

// Tune this so you refresh slightly before expiry
const LEEWAY_SECONDS = 60
const nowSeconds = () => Math.floor(Date.now() / 1000)

// Util: build login redirect with ?next
function buildLoginURL(req) {
  const { pathname, search } = req.nextUrl
  const url = new URL('/login', req.url)
  if (!url.searchParams.get('next')) {
    url.searchParams.set('next', pathname + (search || ''))
  }
  return url
}

// Util: clear auth cookies on a response
function clearAuthCookies(res) {
  res.cookies.delete('uid')
  res.cookies.delete('access_token')
  res.cookies.delete('refresh_token')
  res.cookies.delete('expires_at')
}

export async function middleware(req) {
  const { pathname } = req.nextUrl

  // 1) Skip public & framework paths
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
  const refresh = req.cookies.get('refresh_token')?.value
  const exp = Number(expRaw || 0)

  // 3) Not authed → clear cookies + redirect to /login?next=
  if (!access || !exp) {
    const res = NextResponse.redirect(buildLoginURL(req))
    clearAuthCookies(res) // clear BEFORE returning redirect
    return res
  }

  // 4) Near expiry → attempt refresh via your API
  const secondsLeft = exp - nowSeconds()
  if (secondsLeft <= LEEWAY_SECONDS) {
    // If we don't even have a refresh token, punt to login
    if (!refresh) {
      const res = NextResponse.redirect(buildLoginURL(req))
      clearAuthCookies(res)
      return res
    }

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/refresh`
      const r = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Your API expects { refresh_token }
        body: JSON.stringify({ refresh_token: refresh }),
      })

      if (r.ok) {
        const data = await r.json()
        const {
          access_token: newAT,
          refresh_token: newRT, // optional, some servers rotate
          expires_at: newExp,
          user,
        } = data

        // Update cookies on the outgoing response
        const res = NextResponse.next()

        if (user?.id) {
          res.cookies.set('uid', user.id, { path: '/' })
        }

        if (newAT) {
          res.cookies.set('access_token', newAT, {
            httpOnly: true,
            path: '/',
          })
        }
        if (newRT) {
          res.cookies.set('refresh_token', newRT, {
            httpOnly: true,
            path: '/',
          })
        }
        if (newExp) {
          res.cookies.set('expires_at', String(newExp), {
            httpOnly: true,
            path: '/',
          })
        }

        return res // proceed to the requested page, now with fresh cookies
      } else {
        // Refresh failed → clear + redirect
        const res = NextResponse.redirect(buildLoginURL(req))
        clearAuthCookies(res)
        return res
      }
    } catch (e) {
      // Network/unknown failure → clear + redirect
      const res = NextResponse.redirect(buildLoginURL(req))
      clearAuthCookies(res)
      return res
    }
  }

  // 5) Token still fresh → continue
  return NextResponse.next()
}

// IMPORTANT: exclude api + .well-known etc.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|images|\\.well-known).*)',
  ],
}
