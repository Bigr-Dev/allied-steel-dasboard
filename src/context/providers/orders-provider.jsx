'use client'

import { createContext, useContext, useReducer } from 'react'
import { initialOrderState } from '../initial-states/orders-state'
import { initialLoadsState } from '../initial-states/load-state'
import { initialRoutesState } from '../initial-states/routes-state'
import orderReducer from '../reducers/order-reducer'
import loadReducer from '../reducers/load-reducer'
import routeReducer from '../reducers/route-reducers'
import { deleteOrder, upsertOrder } from '../apis/order-apis'
import { deleteLoad, fetchLoads, upsertLoad } from '../apis/load-apis'
import { deleteRoute, upsertRoute } from '../apis/route-apis'

const OrdersContext = createContext()

export const OrdersProvider = ({ children }) => {
  const [orders, ordersDispatch] = useReducer(
    orderReducer,
    initialOrderState
  )
  
  const [loads, loadsDispatch] = useReducer(
    loadReducer,
    initialLoadsState
  )
  
  const [routes, routesDispatch] = useReducer(
    routeReducer,
    initialRoutesState
  )

  return (
    <OrdersContext.Provider
      value={{
        orders,
        ordersDispatch,
        upsertOrder,
        deleteOrder,
        loads,
        loadsDispatch,
        fetchLoads,
        upsertLoad,
        deleteLoad,
        routes,
        routesDispatch,
        upsertRoute,
        deleteRoute,
      }}
    >
      {children}
    </OrdersContext.Provider>
  )
}

export const useOrders = () => {
  const context = useContext(OrdersContext)
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider')
  }
  return context
}