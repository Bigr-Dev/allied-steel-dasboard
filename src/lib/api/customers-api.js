import { apiRequest } from './base-client'

export const getCustomers = () => {
  return apiRequest('customers')
}

export const createCustomer = (payload) => {
  return apiRequest('customers', {
    method: 'POST',
    body: payload,
  })
}

export const updateCustomer = (id, payload) => {
  return apiRequest(`customers/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export const deleteCustomer = (id) => {
  return apiRequest(`customers/${id}`, {
    method: 'DELETE',
  })
}