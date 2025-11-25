'use client'

import { createContext, useContext, useReducer } from 'react'
import { initialDriversState } from '../initial-states/driver-state'
import driverReducer from '../reducers/driver-reducer'
import { deleteDriver, upsertDriver } from '../apis/driver-apis'

const DriversContext = createContext()

export const DriversProvider = ({ children }) => {
  const [drivers, driversDispatch] = useReducer(
    driverReducer,
    initialDriversState
  )

  return (
    <DriversContext.Provider
      value={{
        drivers,
        driversDispatch,
        upsertDriver,
        deleteDriver,
      }}
    >
      {children}
    </DriversContext.Provider>
  )
}

export const useDrivers = () => {
  const context = useContext(DriversContext)
  if (!context) {
    throw new Error('useDrivers must be used within a DriversProvider')
  }
  return context
}