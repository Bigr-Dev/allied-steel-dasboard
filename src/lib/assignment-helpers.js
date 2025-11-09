import { fetchData } from './fetch'

// Plan Management API calls
export const assignmentAPI = {
  // Get all plans
  getPlans: async () => {
    return await fetchData('plans', 'GET')
  },

  // Get specific plan with units and orders
  getPlan: async (planId) => {
    return await fetchData(`plans/${planId}`, 'GET')
  },

  // Create new plan
  createPlan: async (planData) => {
    return await fetchData('plans/add-plan', 'POST', planData)
  },

  // Delete plan
  deletePlan: async (planId) => {
    return await fetchData(`plans/${planId}`, 'DELETE')
  },

  // Auto-assign orders
  autoAssign: async (planId, branchId = null, commit = false) => {
    return await fetchData('plans/auto-assign', 'POST', {
      plan_id: planId,
      branch_id: branchId,
      commit
    })
  },

  // Manual assignment operations
  bulkAssign: async (planId, assignments) => {
    return await fetchData(`plans/${planId}/bulk-assign`, 'POST', assignments)
  },

  unassign: async (planId, orderIds) => {
    return await fetchData(`plans/${planId}/unassign`, 'POST', { order_ids: orderIds })
  },

  // Unit management
  addUnit: async (planId, unitData) => {
    return await fetchData(`plans/${planId}/units`, 'POST', unitData)
  },

  updateNote: async (unitId, note) => {
    return await fetchData('plans/units/note', 'POST', {
      planned_unit_id: unitId,
      note
    })
  },

  removeUnit: async (unitId) => {
    return await fetchData('plans/units/remove', 'POST', {
      planned_unit_id: unitId
    })
  }
}

// Loads Management
export const loadsAPI = {
  getLoads: async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.date) params.append('date', filters.date)
    if (filters.branch_id) params.append('branch_id', filters.branch_id)
    if (filters.route_id) params.append('route_id', filters.route_id)
    if (filters.customer_name) params.append('customer_name', filters.customer_name)
    
    const url = params.toString() ? `loads?${params.toString()}` : 'loads'
    return await fetchData(url, 'GET')
  }
}

// Helper functions for data transformation
export const transformPlanData = (planData) => {
  return {
    plan: planData.plan || {},
    units: planData.units || [],
    unassigned_orders: planData.unassigned_orders || [],
    assigned_orders: planData.assigned_orders || []
  }
}

export const flattenLoadsHierarchy = (loadsData) => {
  const flattened = []
  
  loadsData.branches?.forEach(branch => {
    branch.routes?.forEach(route => {
      route.suburbs?.forEach(suburb => {
        suburb.customers?.forEach(customer => {
          customer.orders?.forEach(order => {
            flattened.push({
              ...order,
              branch_name: branch.name,
              route_name: route.name,
              suburb_name: suburb.name,
              customer_name: customer.name,
              assignment_status: order.assignment_plan_id ? 
                (order.is_split ? 'Split' : 'Assigned') : 'Unassigned'
            })
          })
        })
      })
    })
  })
  
  return flattened
}