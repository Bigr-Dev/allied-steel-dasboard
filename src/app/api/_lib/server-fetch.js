import { cookies } from 'next/headers'

export async function fetchServerData(url, method, data) {
  // Retrieve the access token from cookies if any
  const cookieStore = await cookies()
  const token = cookieStore?.get('access_token')?.value

  // Set up the options for the fetch request //https://allied-steel-dasboard.vercel.app/
  const options = {
    method: method,
    headers: {
      // 'Access-Control-Allow-Origin': 'http://localhost:3000',

      // 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '', // Correct Authorization header
    },
    body: data ? JSON.stringify(data) : null,
  }
  //NEXT_PUBLIC_BASE_URL
  try {
    // console.log('url from server fetch :>> ', url)
    // Perform the fetch request
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/${url}`,
      options
    )

    // If the URL is 'login', handle the special case and store tokens
    if (url === 'login' && response.ok) {
      const responseData = await response.json()

      // Set the tokens in cookies if login is successful
      const { access_token, refresh_token, expires_at, user } = responseData
      const cookie = await cookies()

      // Set cookies in the response
      cookie.set('uid', user?.id, {
        // httpOnly: true,
        maxAge: expires_at, // Set the expiration time
        // secure: process.env.NODE_ENV === 'production', // Ensure secure cookies in production
        path: '/', // Cookie available for the entire domain
      })

      cookie.set('access_token', access_token, {
        httpOnly: true,
        maxAge: expires_at, // Set the expiration time
        // secure: process.env.NODE_ENV === 'production', // Ensure secure cookies in production
        path: '/', // Cookie available for the entire domain
      })

      cookie.set('refresh_token', refresh_token, {
        httpOnly: true,
        //  secure: process.env.NODE_ENV === 'production', // Secure in production
        path: '/', // Cookie available for the entire domain
      })

      cookie.set('expires_at', expires_at, {
        httpOnly: true,
        //   secure: process.env.NODE_ENV === 'production',
        path: '/', // Cookie available for the entire domain
      })

      // Return the response after storing the tokens
      return responseData
    }

    // If not a login request, check if the response is okay
    // if (!response.ok) {
    //   console.log('response :>> ', response)
    //   const errorData = (await response.json()) || response.status // Get the error details from the response
    //   throw new Error(
    //     `Error: ${response.status || response.statusText || '404'} - ${
    //       errorData?.message || 'Unknown error'
    //     }`
    //   )
    // }

    // Return the parsed response body for other requests
    return response.json()
  } catch (error) {
    console.error('Fetch error:', error)
    throw new Error('Failed to fetch data. Please try again later.')
  }
}

export async function refreshServerSession() {
  const cookieStore = await cookies()
  const rt = cookieStore.get('refresh_token')?.value

  if (!rt) {
    // Nothing to refresh with
    return { ok: false, error: 'No refresh token' }
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: rt }),
  })

  if (!res.ok) {
    return { ok: false, error: 'Refresh failed', status: res.status }
  }

  const data = await res.json()

  // Expected response shape: { access_token, refresh_token?, expires_at, user? }
  const { access_token, refresh_token, expires_at, user } = data

  // Update cookies
  // Note: here we mirror your login cookie behavior
  cookieStore.set('uid', user?.id ?? '', { path: '/' })
  cookieStore.set('access_token', access_token, { httpOnly: true, path: '/' })
  if (refresh_token) {
    cookieStore.set('refresh_token', refresh_token, {
      httpOnly: true,
      path: '/',
    })
  }
  cookieStore.set('expires_at', String(expires_at), {
    httpOnly: true,
    path: '/',
  })

  return { ok: true, ...data }
}

export async function serverLogout({ global = true } = {}) {
  const cookieStore = await cookies()
  const rt = cookieStore.get('refresh_token')?.value
  // console.log('rt :>> ', rt)
  // Hit your server’s /logout endpoint and pass the refresh token
  const result = await fetchServerData('logout', 'POST', {
    refresh_token: rt || null,
    global,
  })

  // Clear cookies on the Next.js side no matter what
  cookieStore.delete('uid')
  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')
  cookieStore.delete('expires_at')

  return result
}
