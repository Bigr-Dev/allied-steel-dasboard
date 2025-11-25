import { apiRequest } from './base-client'

export const getPlans = (params = {}) => {
  const searchParams = new URLSearchParams()
  if (params.limit) searchParams.set('limit', params.limit)
  if (params.offset) searchParams.set('offset', params.offset)
  if (params.include_units) searchParams.set('include_units', params.include_units)
  if (params.include_counts) searchParams.set('include_counts', params.include_counts)
  if (params.include_unassigned) searchParams.set('include_unassigned', params.include_unassigned)
  
  const query = searchParams.toString()
  return apiRequest(`plans${query ? `?${query}` : ''}`)
}

export const getPlan = (planId) => {
  return apiRequest(`plans/${planId}`)
}

export const createPlan = (payload) => {
  return apiRequest('plans/add-plan', {
    method: 'POST',
    body: payload,
  })
}

export const deletePlan = (planId) => {
  return apiRequest(`plans/${planId}`, {
    method: 'DELETE',
  })
}

export const autoAssignPlan = (payload) => {
  return apiRequest('plans/auto-assign', {
    method: 'POST',
    body: payload,
  })
}

export const addUnit = (planId, payload) => {
  return apiRequest(`plans/${planId}/units/add-unit`, {
    method: 'POST',
    body: payload,
  })
}

export const bulkAssign = (planId, payload) => {
  return apiRequest(`plans/${planId}/bulk-assign`, {
    method: 'POST',
    body: payload,
  })
}