// Assignment Board Actions
export const ASSIGNMENT_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOAD_DATA_SUCCESS: 'LOAD_DATA_SUCCESS',
  LOAD_DATA_ERROR: 'LOAD_DATA_ERROR',
  MOVE_ORDER: 'MOVE_ORDER',
  MOVE_ORDER_SUCCESS: 'MOVE_ORDER_SUCCESS',
  MOVE_ORDER_ERROR: 'MOVE_ORDER_ERROR',
  ADD_CHANGE: 'ADD_CHANGE',
  CLEAR_CHANGES: 'CLEAR_CHANGES',
  UNDO_LAST_CHANGE: 'UNDO_LAST_CHANGE',
  SET_ACTIVE_ITEM: 'SET_ACTIVE_ITEM',
}

// Initial State
export const initialAssignmentBoardState = {
  assignedUnits: [],
  unassigned: [],
  plan: null,
  loading: false,
  error: null,
  activeItem: null,
  changes: [],
  undoStack: [],
}

// Reducer
export function assignmentBoardReducer(state, action) {
  switch (action.type) {
    case ASSIGNMENT_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null,
      }

    case ASSIGNMENT_ACTIONS.LOAD_DATA_SUCCESS:
      return {
        ...state,
        assignedUnits: action.payload.assigned_units || [],
        unassigned: action.payload.unassigned || [],
        plan: action.payload.plan || null,
        loading: false,
        error: null,
      }

    case ASSIGNMENT_ACTIONS.LOAD_DATA_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }

    case ASSIGNMENT_ACTIONS.MOVE_ORDER:
      return handleMoveOrder(state, action.payload)

    case ASSIGNMENT_ACTIONS.MOVE_ORDER_SUCCESS:
      return {
        ...state,
        assignedUnits: action.payload.assigned_units || state.assignedUnits,
        unassigned: action.payload.unassigned || state.unassigned,
      }

    case ASSIGNMENT_ACTIONS.MOVE_ORDER_ERROR:
      // Revert to previous state from undo stack
      const lastState = state.undoStack[state.undoStack.length - 1]
      if (lastState) {
        return {
          ...state,
          assignedUnits: lastState.assignedUnits,
          unassigned: lastState.unassigned,
          error: action.payload,
        }
      }
      return {
        ...state,
        error: action.payload,
      }

    case ASSIGNMENT_ACTIONS.ADD_CHANGE:
      return {
        ...state,
        changes: [...state.changes, action.payload],
        undoStack: [
          ...state.undoStack.slice(-9), // Keep last 10 states
          {
            assignedUnits: state.assignedUnits,
            unassigned: state.unassigned,
            timestamp: Date.now(),
          },
        ],
      }

    case ASSIGNMENT_ACTIONS.CLEAR_CHANGES:
      return {
        ...state,
        changes: [],
        undoStack: [],
      }

    case ASSIGNMENT_ACTIONS.UNDO_LAST_CHANGE:
      if (state.undoStack.length === 0) return state
      
      const previousState = state.undoStack[state.undoStack.length - 1]
      return {
        ...state,
        assignedUnits: previousState.assignedUnits,
        unassigned: previousState.unassigned,
        undoStack: state.undoStack.slice(0, -1),
        changes: state.changes.slice(0, -1),
      }

    case ASSIGNMENT_ACTIONS.SET_ACTIVE_ITEM:
      return {
        ...state,
        activeItem: action.payload,
      }

    default:
      return state
  }
}

// Helper function to handle optimistic move
function handleMoveOrder(state, payload) {
  const { item_id, from_plan_unit_id, to_plan_unit_id } = payload

  if (!from_plan_unit_id && to_plan_unit_id) {
    // Assign from unassigned to vehicle
    return handleAssignItem(state, item_id, to_plan_unit_id)
  } else if (from_plan_unit_id && !to_plan_unit_id) {
    // Unassign from vehicle to unassigned
    return handleUnassignItem(state, item_id)
  } else if (from_plan_unit_id && to_plan_unit_id && from_plan_unit_id !== to_plan_unit_id) {
    // Move between vehicles
    const unassignedState = handleUnassignItem(state, item_id)
    return handleAssignItem(unassignedState, item_id, to_plan_unit_id)
  }

  return state
}

function handleAssignItem(state, itemId, vehicleId) {
  const item = state.unassigned.find((item) => item.item_id === itemId)
  if (!item) return state

  const newUnassigned = state.unassigned.filter((item) => item.item_id !== itemId)
  
  const newAssignedUnits = state.assignedUnits.map((unit) => {
    if (unit.plan_unit_id === vehicleId) {
      const updatedUnit = { ...unit }
      updatedUnit.used_capacity_kg += item.weight_left

      let customerGroup = updatedUnit.customers.find(
        (c) => c.customer_name === item.customer_name
      )
      if (!customerGroup) {
        customerGroup = {
          customer_id: null,
          customer_name: item.customer_name,
          suburb_name: item.suburb_name,
          route_name: item.route_name,
          orders: [],
        }
        updatedUnit.customers.push(customerGroup)
      }

      let order = customerGroup.orders.find((o) => o.order_id === item.order_id)
      if (!order) {
        order = {
          order_id: item.order_id,
          total_assigned_weight_kg: 0,
          items: [],
        }
        customerGroup.orders.push(order)
      }

      order.items.push({
        item_id: item.item_id,
        description: item.description,
        assigned_weight_kg: item.weight_left,
        assignment_id: `assign-${Date.now()}`,
      })
      order.total_assigned_weight_kg += item.weight_left

      return updatedUnit
    }
    return unit
  })

  return {
    ...state,
    assignedUnits: newAssignedUnits,
    unassigned: newUnassigned,
  }
}

function handleUnassignItem(state, itemId) {
  let foundItem = null
  let sourceUnit = null

  for (const unit of state.assignedUnits) {
    for (const customer of unit.customers) {
      for (const order of customer.orders) {
        const item = order.items.find((item) => item.item_id === itemId)
        if (item) {
          foundItem = {
            ...item,
            customer_name: customer.customer_name,
            route_name: customer.route_name,
            suburb_name: customer.suburb_name,
            weight_left: item.assigned_weight_kg,
          }
          sourceUnit = unit
          break
        }
      }
      if (foundItem) break
    }
    if (foundItem) break
  }

  if (!foundItem || !sourceUnit) return state

  const newUnassigned = [
    ...state.unassigned,
    {
      load_id: `load-${Date.now()}`,
      order_id: foundItem.order_id || `order-${Date.now()}`,
      item_id: foundItem.item_id,
      customer_name: foundItem.customer_name,
      suburb_name: foundItem.suburb_name,
      route_name: foundItem.route_name,
      weight_left: foundItem.assigned_weight_kg,
      description: foundItem.description,
    },
  ]

  const newAssignedUnits = state.assignedUnits.map((unit) => {
    if (unit.plan_unit_id === sourceUnit.plan_unit_id) {
      const updatedUnit = { ...unit }
      updatedUnit.used_capacity_kg -= foundItem.assigned_weight_kg

      updatedUnit.customers = updatedUnit.customers
        .map((customer) => {
          const updatedCustomer = { ...customer }
          updatedCustomer.orders = updatedCustomer.orders
            .map((order) => {
              const updatedOrder = { ...order }
              updatedOrder.items = updatedOrder.items.filter(
                (item) => item.item_id !== itemId
              )
              updatedOrder.total_assigned_weight_kg = updatedOrder.items.reduce(
                (sum, item) => sum + item.assigned_weight_kg,
                0
              )
              return updatedOrder
            })
            .filter((order) => order.items.length > 0)
          return updatedCustomer
        })
        .filter((customer) => customer.orders.length > 0)

      return updatedUnit
    }
    return unit
  })

  return {
    ...state,
    assignedUnits: newAssignedUnits,
    unassigned: newUnassigned,
  }
}