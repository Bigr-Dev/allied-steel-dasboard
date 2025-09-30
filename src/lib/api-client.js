// API client utilities for consistent error handling and request formatting

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

class APIError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for authentication
    ...options,
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new APIError(
        errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }

    // Network or other errors
    throw new APIError('Network error or server unavailable', 0, {
      originalError: error.message,
    })
  }
}

// Assignment API methods
export const assignmentAPI = {
  // Get vehicle assignment data
  getAssignments: (params = {}) => {
    const searchParams = new URLSearchParams()

    if (params.date) searchParams.set('date', params.date)
    if (params.branch_id) searchParams.set('branch_id', params.branch_id)
    if (params.customer_id) searchParams.set('customer_id', params.customer_id)
    if (params.preview !== undefined)
      searchParams.set('preview', params.preview)

    const query = searchParams.toString()
    console.log('url', `/api/vehicle-assignment${query ? `?${query}` : ''}`)
    return apiRequest(`/api/vehicle-assignment${query ? `?${query}` : ''}`)
  },

  // Manually assign item to vehicle
  assignItem: (itemId, vehicleId) => {
    return apiRequest('/api/manual-assign', {
      method: 'POST',
      body: JSON.stringify({
        item_id: itemId,
        vehicle_id: vehicleId,
      }),
    })
  },

  // Unassign single item
  unassignItem: (itemId) => {
    return apiRequest(`/api/unassign/${itemId}`, {
      method: 'POST',
    })
  },

  // Unassign all items from vehicle
  unassignAllItems: (vehicleId) => {
    return apiRequest('/api/unassign/all', {
      method: 'POST',
      body: JSON.stringify({
        vehicle_id: vehicleId,
      }),
    })
  },

  // Auto-assign items
  autoAssign: (params) => {
    return apiRequest('/api/auto-assign', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  moveItem: (payload) => {
    return apiRequest('/api/vehicle-assignment/move', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  commitPlan: (changes) => {
    return apiRequest('/api/vehicle-assignment/commit', {
      method: 'POST',
      body: JSON.stringify({
        commit: true,
        changes: changes,
      }),
    })
  },
}

// Utility function for handling API errors in components
export function handleAPIError(error, toast) {
  console.error('API Error:', error)

  let title = 'Error'
  let description = 'An unexpected error occurred'

  if (error instanceof APIError) {
    switch (error.status) {
      case 400:
        title = 'Invalid Request'
        description = error.message || 'Please check your input and try again'
        break
      case 401:
        title = 'Unauthorized'
        description = 'Please log in to continue'
        break
      case 403:
        title = 'Access Denied'
        description = 'You do not have permission to perform this action'
        break
      case 404:
        title = 'Not Found'
        description = 'The requested resource was not found'
        break
      case 500:
        title = 'Server Error'
        description = 'Something went wrong on our end. Please try again later.'
        break
      default:
        description = error.message || description
    }
  }

  toast({
    title,
    description,
    variant: 'destructive',
  })
}
