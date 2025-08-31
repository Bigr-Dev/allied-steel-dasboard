// export const runtime = 'nodejs'
// import { refreshSupabaseSession } from '@/config/supabase'
// import { toNextHandler } from '../_lib/expressAdapter'

// export const POST = toNextHandler(refreshSupabaseSession)
// app/api/refresh/route.js
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchServerData } from '../_lib/server-fetch'

// Helper to compute cookie maxAge from unix seconds
function computeMaxAge(expiresAtUnix) {
  const now = Math.floor(Date.now() / 1000)
  return Math.max(0, Number(expiresAtUnix) - now)
}

// POST /api/refresh
// Accepts { refresh_token } in the body, or falls back to cookie refresh_token
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const cookieStore = cookies()
    const refreshToken =
      body?.refresh_token || cookieStore.get('refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Missing refresh_token' },
        { status: 400 }
      )
    }

    // Call your server refresh controller
    // If your server path is different, update 'refresh' below
    const response = await fetchServerData('refresh', 'POST', {
      refresh_token: refreshToken,
    })

    // Your server returns the shape from refreshSupabaseSession:
    // { access_token, refresh_token, expires_at, token_type, user }
    if (!response || response.error) {
      return NextResponse.json(
        { error: response?.error || 'Refresh failed' },
        { status: 401 }
      )
    }

    const {
      access_token,
      refresh_token: newRefresh,
      expires_at,
      token_type,
      user,
    } = response

    if (!access_token || !expires_at) {
      return NextResponse.json(
        { error: 'Invalid refresh response from server' },
        { status: 500 }
      )
    }

    const res = NextResponse.json(
      {
        access_token,
        refresh_token: newRefresh,
        expires_at,
        token_type: token_type || 'bearer',
        user,
      },
      { status: 200 }
    )

    // Set cookies for the app to use
    const baseOpts = {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: computeMaxAge(expires_at),
    }

    // Keep tokens httpOnly
    res.cookies.set('access_token', access_token, baseOpts)
    if (newRefresh) {
      res.cookies.set('refresh_token', newRefresh, baseOpts)
    }

    // Often read on client, so not httpOnly
    res.cookies.set('expires_at', String(expires_at), {
      ...baseOpts,
      httpOnly: false,
    })

    if (user?.id) {
      res.cookies.set('uid', String(user.id), {
        ...baseOpts,
        httpOnly: false,
      })
    }

    return res
  } catch (err) {
    console.error('Refresh error:', err)
    return NextResponse.json(
      { error: 'Unexpected error', details: err?.message },
      { status: 500 }
    )
  }
}
