import { apiRequest } from './base-client'

export const autoAssignLoads = (payload) => {
  return apiRequest('vehicle-assignment', {
    method: 'POST',
    body: payload,
  })
}

export const moveAssignment = (payload) => {
  return apiRequest('vehicle-assignment/move', {
    method: 'POST',
    body: payload,
  })
}

export const commitAssignments = (payload) => {
  return apiRequest('vehicle-assignment/commit', {
    method: 'POST',
    body: payload,
  })
}

export const getAssignments = (params = {}) => {
  const searchParams = new URLSearchParams()
  if (params.date) searchParams.set('date', params.date)
  if (params.branch_id) searchParams.set('branch_id', params.branch_id)
  if (params.customer_id) searchParams.set('customer_id', params.customer_id)
  if (params.preview !== undefined) searchParams.set('preview', params.preview)
  
  const query = searchParams.toString()
  return apiRequest(`vehicle-assignment${query ? `?${query}` : ''}`)
}

export const manualAssign = (itemId, vehicleId) => {
  return apiRequest('plans/manual-assign', {
    method: 'POST',
    body: { item_id: itemId, vehicle_id: vehicleId },
  })
}

export const unassignItem = (itemId) => {
  return apiRequest(`unassign/${itemId}`, {
    method: 'POST',
  })
}

export const unassignAll = (planId, plannedUnitId, orderIds) => {
  return apiRequest(`plans/${planId}/unassign`, {
    method: 'POST',
    body: { plan_id: planId, planned_unit_id: plannedUnitId, order_ids: orderIds },
  })
}

export const unassignAllItems = (planId, plannedUnitId, orderIds) => {
  return unassignAll(planId, plannedUnitId, orderIds)
}

export const getPlan = (params = {}) => {
  const searchParams = new URLSearchParams()
  if (params.commit !== undefined) searchParams.set('commit', params.commit)
  const query = searchParams.toString()
  return apiRequest(`plans${query ? `?${query}` : ''}`)
}

export const assignItem = (payload) => {
  return apiRequest('plans/assign', {
    method: 'POST',
    body: payload,
  })
}

export const moveItem = (payload) => {
  return moveAssignment(payload)
}

export const commitPlan = (changes) => {
  return apiRequest('plans/commit', {
    method: 'POST',
    body: { changes },
  })
}