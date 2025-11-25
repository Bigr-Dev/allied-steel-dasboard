import { apiRequest } from './base-client'

export const getUsers = () => {
  return apiRequest('users')
}

export const createUser = (payload) => {
  return apiRequest('users', {
    method: 'POST',
    body: payload,
  })
}

export const updateUser = (id, payload) => {
  return apiRequest(`users/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export const deleteUser = (id) => {
  return apiRequest(`users/${id}`, {
    method: 'DELETE',
  })
}