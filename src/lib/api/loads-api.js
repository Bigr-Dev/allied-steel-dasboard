import { apiRequest } from './base-client'

export const getLoads = (filters = {}) => {
  const searchParams = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, value)
    }
  })
  
  const query = searchParams.toString()
  return apiRequest(`loads${query ? `?${query}` : ''}`)
}

export const getOrders = () => {
  return apiRequest('orders')
}

export const createOrder = (payload) => {
  return apiRequest('orders', {
    method: 'POST',
    body: payload,
  })
}

export const updateOrder = (id, payload) => {
  return apiRequest(`orders/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export const deleteOrder = (id) => {
  return apiRequest(`orders/${id}`, {
    method: 'DELETE',
  })
}

export const getRoutes = () => {
  return apiRequest('routes')
}

export const createRoute = (payload) => {
  return apiRequest('routes', {
    method: 'POST',
    body: payload,
  })
}

export const updateRoute = (id, payload) => {
  return apiRequest(`routes/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export const deleteRoute = (id) => {
  return apiRequest(`routes/${id}`, {
    method: 'DELETE',
  })
}