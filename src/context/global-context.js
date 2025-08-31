'use client'

// react
import { createContext, useContext } from 'react'

// initial state
import { initialBranchesState } from './initial-states/branch-state'
import { initialCustomerState } from './initial-states/customer-state'
// import { initialDashboardState } from './initial-states/dashboard-state'
import { initialDriversState } from './initial-states/driver-state'
import { initialLoadsState } from './initial-states/load-state'
// import { initialStopPointsState } from './initial-states/stop-point-state'
import { initialUsersState } from './initial-states/user-state'
import { initialOrderState } from './initial-states/orders-state'
import { initialVehiclesState } from './initial-states/vehicle-state'
import { initialRoutesState } from './initial-states/routes-state'
import { initialGroupedLoadsState } from './initial-states/grouped-load-state'

export const initialState = {
  initialBranchesState,
  // initialDashboardState,
  initialCustomerState,
  initialDriversState,
  initialLoadsState,
  initialGroupedLoadsState,
  initialRoutesState,
  initialUsersState,
  initialVehiclesState,
  initialOrderState,
}

export const GlobalContext = createContext(initialState)

export const useGlobalContext = () => {
  const context = useContext(GlobalContext)
  return context
}
