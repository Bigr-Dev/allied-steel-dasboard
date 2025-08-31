// lib/auth.js
import Login from '@/app/(auth)/login/page'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Returns { token, exp } if valid; otherwise redirects to "/"
export async function getAuthOrRedirect({ leeway = 60 } = {}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  const expRaw = cookieStore.get('expires_at')?.value

  if (!token || !expRaw) {
    redirect('@/app/(auth)/login/page') // missing auth
  }

  // expires_at is expected as Unix seconds (e.g. 1755343812)
  const exp = parseInt(String(expRaw), 10)
  if (!Number.isFinite(exp)) {
    redirect('@/app/(auth)/login/page') // bad cookie
  }

  const now = Math.floor(Date.now() / 1000)

  // If current time is within leeway of expiry, treat as expired
  if (now >= exp - leeway) {
    redirect('/') // expired/near-expiry
  }

  return { token, exp }
}

// Optional standalone check you can reuse elsewhere
export function isExpired(expSeconds, { leeway = 60 } = {}) {
  const exp = parseInt(String(expSeconds), 10)
  if (!Number.isFinite(exp)) return true
  const now = Math.floor(Date.now() / 1000)
  return now >= exp - leeway
}
