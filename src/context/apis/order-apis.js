// actions
import * as order_actions from '../actions/order-actions'

// hooks
import { deleteApi, fetchApi, loadAPI, postApi, putApi } from '@/hooks/use-apis'

// api url
const API_URL = 'orders'

// *****************************
// load orders data
// *****************************
export const loadOrders = async (ordersDispatch, data) =>
  loadAPI({
    dispatch: ordersDispatch,
    start: order_actions.fetchOrdersStart,
    success: order_actions.fetchOrdersSuccess,
    failure: order_actions.fetchOrdersFailure,
    errorMsg: 'Something went wrong, while fetching orders',
    data: data,
  })

// *****************************
// fetch order
// *****************************
export const fetchOrders = async (ordersDispatch) =>
  fetchApi({
    dispatch: ordersDispatch,
    start: order_actions.fetchOrdersStart,
    success: order_actions.fetchOrdersSuccess,
    failure: order_actions.fetchOrdersFailure,
    url: API_URL,
    errorMsg: 'Something went wrong, while fetching orders',
  })

const addOrder = async (order, ordersDispatch) =>
  postApi({
    dispatch: ordersDispatch,
    start: order_actions.addOrderStart,
    data: order,
    success: order_actions.addOrderSuccess,
    successMsg: `New order, with name: ${order.name} has been created.`,
    failure: order_actions.addOrderFailure,
    errorMsg: 'Something went wrong, while adding order',
    url: API_URL,
  })

// *****************************
// update order
// *****************************
const updateOrder = async (id, order, ordersDispatch) =>
  putApi({
    dispatch: ordersDispatch,
    start: order_actions.updateOrderStart,
    id,
    data: order,
    success: order_actions.updateOrderSuccess,
    successMsg: `${order.name} with id: ${id} has been updated.`,
    failure: order_actions.updateOrderFailure,
    errorMsg: 'Something went wrong, while updating order',
    url: API_URL,
  })

// *****************************
// move upsert to hooks or helpers(chat with cam)
// *****************************
export const upsertOrder = async (id, orders, ordersDispatch) =>
  id
    ? updateOrder(id, orders, ordersDispatch)
    : addOrder(orders, ordersDispatch)

// *****************************
// delete order
// *****************************
export const deleteOrder = async (id, ordersDispatch) =>
  deleteApi({
    dispatch: ordersDispatch,
    start: order_actions.deleteOrderStart,
    id,
    success: order_actions.deleteOrderSuccess,
    successMsg: `Order with id: ${id} has been deleted.`,
    failure: order_actions.deleteOrderFailure,
    errorMsg: 'Something went wrong, while deleting order',
    url: API_URL,
  })
