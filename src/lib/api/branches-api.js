import { apiRequest } from './base-client'

export const getBranches = () => {
  return apiRequest('branches')
}

export const createBranch = (payload) => {
  return apiRequest('branches', {
    method: 'POST',
    body: payload,
  })
}

export const updateBranch = (id, payload) => {
  return apiRequest(`branches/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export const deleteBranch = (id) => {
  return apiRequest(`branches/${id}`, {
    method: 'DELETE',
  })
}