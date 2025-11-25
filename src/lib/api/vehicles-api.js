import { apiRequest } from './base-client'

export const getVehicles = () => {
  return apiRequest('vehicles')
}

export const createVehicle = (payload) => {
  return apiRequest('vehicles', {
    method: 'POST',
    body: payload,
  })
}

export const updateVehicle = (id, payload) => {
  return apiRequest(`vehicles/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export const deleteVehicle = (id) => {
  return apiRequest(`vehicles/${id}`, {
    method: 'DELETE',
  })
}