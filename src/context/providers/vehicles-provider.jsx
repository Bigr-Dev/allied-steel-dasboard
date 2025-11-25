'use client'

import { createContext, useContext, useReducer } from 'react'
import { initialVehiclesState } from '../initial-states/vehicle-state'
import vehicleReducer from '../reducers/vehicle-apis'
import { deleteVehicle, upsertVehicle } from '../apis/vehicle-apis'

const VehiclesContext = createContext()

export const VehiclesProvider = ({ children }) => {
  const [vehicles, vehiclesDispatch] = useReducer(
    vehicleReducer,
    initialVehiclesState
  )

  return (
    <VehiclesContext.Provider
      value={{
        vehicles,
        vehiclesDispatch,
        upsertVehicle,
        deleteVehicle,
      }}
    >
      {children}
    </VehiclesContext.Provider>
  )
}

export const useVehicles = () => {
  const context = useContext(VehiclesContext)
  if (!context) {
    throw new Error('useVehicles must be used within a VehiclesProvider')
  }
  return context
}