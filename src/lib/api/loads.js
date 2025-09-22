import { fetchData } from '@/lib/fetch'

/**
 * Get loads data with optional filtering parameters
 * @param {Object} params - Query parameters
 * @param {string} [params.branch_id] - Filter by branch ID
 * @param {string} [params.route_id] - Filter by route ID
 * @param {string} [params.route_name] - Filter by route name
 * @param {string} [params.date] - Filter by date (YYYY-MM-DD)
 * @param {string} [params.status] - Filter by status
 * @param {string} [params.customer_name] - Filter by customer name
 * @param {boolean} [params.includeItems] - Include load items in response
 * @param {number} [params.page] - Page number for pagination
 * @param {number} [params.limit] - Items per page
 * @returns {Promise<Object>} Loads data with pagination info
 */
export async function getLoads(params = {}) {
  try {
    // Build query string from non-empty parameters
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString())
      }
    })

    const queryString = queryParams.toString()
    const url = queryString ? `loads?${queryString}` : 'loads'

    const response = await fetchData(url, 'GET')

    // Ensure consistent response structure
    if (response.success !== undefined) {
      return response.data
    }

    return response
  } catch (error) {
    console.error('Error fetching loads:', error)
    throw new Error(error.message || 'Failed to fetch loads data')
  }
}

/**
 * Get flattened load items with full context
 * @param {Object} params - Query parameters
 * @param {string} [params.branch_id] - Filter by branch ID
 * @param {string} [params.route_id] - Filter by route ID
 * @param {string} [params.route_name] - Filter by route name
 * @param {string} [params.customer_name] - Filter by customer name
 * @returns {Promise<Object>} Flattened items with count
 */
export async function getLoadItems(params = {}) {
  try {
    // Build query string from non-empty parameters
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString())
      }
    })

    const queryString = queryParams.toString()
    const url = queryString ? `loads/items?${queryString}` : 'loads/items'

    const response = await fetchData(url, 'GET')

    // Ensure consistent response structure
    if (response.success !== undefined) {
      return response.data
    }

    return response
  } catch (error) {
    console.error('Error fetching load items:', error)
    throw new Error(error.message || 'Failed to fetch load items')
  }
}

/**
 * Reassign an order to a different load stop
 * @param {string} orderId - The order ID to reassign
 * @param {Object} body - Reassignment parameters
 * @param {string} body.load_stop_id - Target load stop ID (required)
 * @param {boolean} [body.enforce_same_branch=true] - Enforce same branch constraint
 * @param {boolean} [body.enforce_same_route=false] - Enforce same route constraint
 * @returns {Promise<Object>} Reassignment result
 */
export async function reassignOrder(orderId, body) {
  try {
    if (!orderId) {
      throw new Error('Order ID is required')
    }

    if (!body.load_stop_id) {
      throw new Error('Load stop ID is required')
    }

    const response = await fetchData(
      `load-orders/${orderId}/reassign`,
      'POST',
      body
    )

    // Ensure consistent response structure
    if (response.success !== undefined) {
      return response.data
    }

    return response
  } catch (error) {
    console.error('Error reassigning order:', error)

    // Handle specific error cases
    if (error.message?.includes('409') || error.message?.includes('UNIQUE')) {
      throw new Error(
        'Duplicate sales order on target load. Please choose a different load stop.'
      )
    }

    throw new Error(error.message || 'Failed to reassign order')
  }
}
