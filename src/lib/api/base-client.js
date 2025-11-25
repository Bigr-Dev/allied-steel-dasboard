import Cookies from 'js-cookie'

class APIError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

export async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const token = Cookies.get('access_token')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
  }

  try {
    const response = await fetch(`${baseUrl}/${path}`, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new APIError(
        errorData.message || errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError('Network error or server unavailable', 0, {
      originalError: error.message,
    })
  }
}

export { APIError }