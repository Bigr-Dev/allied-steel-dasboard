// action order
import * as orders from '@/constants/types'

// *****************************
// fetch orders
// *****************************
export const fetchOrdersStart = () => ({
  type: orders.REQUEST_START,
})
export const fetchOrdersSuccess = (data) => ({
  type: orders.FETCH_ORDERS,
  payload: data,
})
export const fetchOrdersFailure = () => ({
  type: orders.REQUEST_FAILURE,
})

// *****************************
// add order
// *****************************
export const addOrderStart = () => ({
  type: orders.REQUEST_START,
})
export const addOrderSuccess = (data) => ({
  type: orders.ADD_ORDER,
  payload: data,
})
export const addOrderFailure = () => ({
  type: orders.REQUEST_FAILURE,
})

// *****************************
// update order
// *****************************
export const updateOrderStart = () => ({
  type: orders.REQUEST_START,
})
export const updateOrderSuccess = (data) => ({
  type: orders.UPDATE_ORDER,
  payload: data,
})
export const updateOrderFailure = () => ({
  type: orders.REQUEST_FAILURE,
})

// *****************************
// delete order
// *****************************
export const deleteOrderStart = () => ({
  type: orders.REQUEST_START,
})
export const deleteOrderSuccess = (id) => ({
  type: orders.DELETE_ORDER,
  payload: id,
})
export const deleteOrderFailure = () => ({
  type: orders.REQUEST_FAILURE,
})
