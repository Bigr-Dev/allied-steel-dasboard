// // middleware.ts

// import { NextResponse } from 'next/server'

// /**
//  * Config: where to POST to refresh.
//  * Point this to your server controller that uses refreshSupabaseSession.
//  * Example: https://api.yourdomain.com/auth/refresh
//  * You can keep it in env as well.
//  */
// const REFRESH_ENDPOINT =
//   process.env.NEXT_PUBLIC_REFRESH_ENDPOINT ||
//   'http://localhost:8800/api/refresh'

// // How long before expiry we should refresh (seconds)
// const LEEWAY_SECONDS = 60

// // Which paths are public (no auth required)
// function isPublicPath(pathname) {
//   return (
//     pathname === '/login' ||
//     pathname.startsWith('/public') ||
//     pathname.startsWith('/api/public')
//   )
// }
// console.log('getting refresh token :>> ')
// // Helper: safe number parse
// function toInt(x) {
//   const n = Number(x)
//   return Number.isFinite(n) ? n : undefined
// }

// // Helper: are we within the leeway window to refresh?
// function isNearExpiry(exp, leeway = LEEWAY_SECONDS) {
//   if (!exp) return true
//   const now = Math.floor(Date.now() / 1000)
//   return now >= exp - leeway
// }

// export async function middleware(req) {
//   const { pathname } = req.nextUrl
//   console.log('pathname :>> ', pathname)
//   if (isPublicPath(pathname)) {
//     return NextResponse.next()
//   }

//   const accessToken = req.cookies.get('access_token')?.value
//   const refreshToken = req.cookies.get('refresh_token')?.value
//   const expRaw = req.cookies.get('expires_at')?.value
//   const exp = toInt(expRaw)

//   // If there is no auth at all → go to /login
//   if (!accessToken || !exp) {
//     const url = new URL('/login', req.url)
//     // console.log('req.url :>> ', req.url)
//     url.searchParams.set('next', pathname)
//     return NextResponse.redirect(url)
//   }

//   // If we are NOT near expiry → continue
//   if (!isNearExpiry(exp)) {
//     return NextResponse.next()
//   }

//   // Near expiry: attempt refresh if we have a refresh_token
//   if (!refreshToken) {
//     const url = new URL('/login')
//     url.searchParams.set(pathname)
//     return NextResponse.redirect(url)
//   }

//   try {
//     const res = await fetch(REFRESH_ENDPOINT, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       // IMPORTANT: Edge middleware runs at the edge; include the token in body per your controller
//       body: JSON.stringify({ refresh_token: refreshToken }),
//     })

//     if (!res.ok) {
//       // Refresh failed → clear and redirect
//       const url = new URL('/login', req.url)
//       url.searchParams.set('next', pathname)
//       const resp = NextResponse.redirect(url)
//       resp.cookies.set('access_token', '', { path: '/', maxAge: 0 })
//       resp.cookies.set('refresh_token', '', { path: '/', maxAge: 0 })
//       resp.cookies.set('expires_at', '', { path: '/', maxAge: 0 })
//       resp.cookies.set('uid', '', { path: '/', maxAge: 0 })
//       return resp
//     }

//     const data = await res.json()

//     const now = Math.floor(Date.now() / 1000)
//     const maxAge = Math.max(0, (data.expires_at ?? 0) - now)

//     const resp = NextResponse.next()

//     // Set refreshed cookies (httpOnly recommended for tokens)
//     // NOTE: Edge supports httpOnly cookies with NextResponse.
//     const common = {
//       path: '/',
//       httpOnly: true,
//       sameSite: 'lax',
//       secure: true, // true in prod
//       maxAge,
//     }

//     if (data.access_token) {
//       resp.cookies.set('access_token', data.access_token, common)
//     }
//     if (data.refresh_token) {
//       resp.cookies.set('refresh_token', data.refresh_token, common)
//     }
//     if (data.expires_at) {
//       resp.cookies.set('expires_at', String(data.expires_at), {
//         ...common,
//         httpOnly: false, // often okay as non-secret; keep if you read it client-side
//       })
//     }
//     if (data.user?.id) {
//       resp.cookies.set('uid', data.user.id, {
//         ...common,
//         httpOnly: false,
//       })
//     }

//     return resp
//   } catch (e) {
//     // Network or other error → redirect to login
//     const url = new URL('/login', req.url)
//     url.searchParams.set('next', pathname)
//     const resp = NextResponse.redirect(url)
//     resp.cookies.set('access_token', '', { path: '/', maxAge: 0 })
//     resp.cookies.set('refresh_token', '', { path: '/', maxAge: 0 })
//     resp.cookies.set('expires_at', '', { path: '/', maxAge: 0 })
//     resp.cookies.set('uid', '', { path: '/', maxAge: 0 })
//     return resp
//   }
// }

// export const config = {
//   matcher: [
//     // Everything except static assets & Next internals
//     '/((?!_next/static|_next/image|favicon.ico|assets|images).*)',
//   ],
// }
// middleware.ts
import { NextResponse } from 'next/server'

const REFRESH_ENDPOINT =
  process.env.NEXT_PUBLIC_REFRESH_ENDPOINT ||
  'http://localhost:8800/api/refresh'

const LEEWAY_SECONDS = 60

function isPublicPath(pathname) {
  return (
    pathname === '/login' ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/api/public')
  )
}

function toInt(x) {
  if (!x) return undefined
  // accept both "1755343812" and 1755343812 and ms -> s
  const n = Number(x)
  if (!Number.isFinite(n)) return undefined
  return n > 2e10 ? Math.floor(n / 1000) : Math.floor(n) // convert ms to s if needed
}

function isNearExpiry(exp, leeway = LEEWAY_SECONDS) {
  if (!exp) return true
  const now = Math.floor(Date.now() / 1000)
  return now >= exp - leeway
}

export async function middleware(req) {
  const urlObj = new URL(req.url)
  const { pathname, search } = urlObj
  console.log('pathname :middleware>> ', pathname)
  console.log('search :middleware>> ', search)
  if (isPublicPath(pathname)) return NextResponse.next()

  const cookieStore = req.cookies // Next adds .cookies in middleware Request
  const accessToken = cookieStore.get('access_token')?.value
  const refreshToken = cookieStore.get('refresh_token')?.value
  const exp = toInt(cookieStore.get('expires_at')?.value)

  // No auth → /login?next=<current>
  if (!accessToken || !exp) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', pathname + search)
    return NextResponse.redirect(url)
  }

  if (!isNearExpiry(exp)) return NextResponse.next()

  // Near expiry, but no refresh token → /login
  if (!refreshToken) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', pathname + search)
    return NextResponse.redirect(url)
  }

  try {
    const res = await fetch(REFRESH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      // credentials not needed; this is server-to-server from the edge
    })

    if (!res.ok) throw new Error('refresh failed')

    const data = await res.json()
    const now = Math.floor(Date.now() / 1000)
    const expSec = toInt(String(data.expires_at))
    const maxAge = expSec ? Math.max(1, expSec - now) : 60 * 60 * 24 // fallback 1 day

    const resp = NextResponse.next()
    const common = {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production', // <-- key fix
      maxAge,
    }

    if (data.access_token)
      resp.cookies.set('access_token', data.access_token, common)
    if (data.refresh_token)
      resp.cookies.set('refresh_token', data.refresh_token, common)
    if (expSec) {
      resp.cookies.set('expires_at', String(expSec), {
        ...common,
        httpOnly: false, // readable client-side if you need it
      })
    }
    if (data.user?.id) {
      resp.cookies.set('uid', data.user.id, {
        ...common,
        httpOnly: false,
      })
    }

    return resp
  } catch {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', pathname + search)
    const resp = NextResponse.redirect(url)
    // clear cookies
    for (const c of ['access_token', 'refresh_token', 'expires_at', 'uid']) {
      resp.cookies.set(c, '', { path: '/', maxAge: 0 })
    }
    return resp
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|images).*)'],
}
