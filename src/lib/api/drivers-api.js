import { apiRequest } from './base-client'

export const getDrivers = () => {
  return apiRequest('drivers')
}

export const createDriver = (payload) => {
  return apiRequest('drivers', {
    method: 'POST',
    body: payload,
  })
}

export const updateDriver = (id, payload) => {
  return apiRequest(`drivers/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export const deleteDriver = (id) => {
  return apiRequest(`drivers/${id}`, {
    method: 'DELETE',
  })
}