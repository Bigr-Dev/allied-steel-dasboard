import * as vehicles from '@/constants/types'

// *****************************
// fetch vehicles
// *****************************
export const fetchVehiclesStart = () => ({
  type: vehicles.REQUEST_START,
})

export const fetchVehiclesSuccess = (data) => ({
  type: vehicles.FETCH_VEHICLES,
  payload: data,
})

export const fetchVehiclesFailure = () => ({
  type: vehicles.REQUEST_FAILURE,
})

// *****************************
// add vehicle
// *****************************
export const addVehicleStart = () => ({
  type: vehicles.REQUEST_START,
})

export const addVehicleSuccess = (data) => ({
  type: vehicles.ADD_VEHICLE,
  payload: data,
})

export const addVehicleFailure = () => ({
  type: vehicles.REQUEST_FAILURE,
})

// *****************************
// update vehicle
// *****************************
export const updateVehicleStart = () => ({
  type: vehicles.REQUEST_START,
})

export const updateVehicleSuccess = (data) => ({
  type: vehicles.UPDATE_VEHICLE,
  payload: data,
})

export const updateVehicleFailure = () => ({
  type: vehicles.REQUEST_FAILURE,
})

// *****************************
// delete vehicle
// *****************************
export const deleteVehicleStart = () => ({
  type: vehicles.REQUEST_START,
})

export const deleteVehicleSuccess = (id) => ({
  type: vehicles.DELETE_VEHICLE,
  payload: id,
})

export const deleteVehicleFailure = () => ({
  type: vehicles.REQUEST_FAILURE,
})

// *****************************
// add maintenance record
// *****************************
export const addMaintenanceRecordStart = () => ({
  type: vehicles.REQUEST_START,
})

export const addMaintenanceRecordSuccess = (vehicleId, data) => ({
  type: vehicles.ADD_MAINTENANCE_RECORD,
  payload: { vehicleId, record: data },
})

export const addMaintenanceRecordFailure = () => ({
  type: vehicles.REQUEST_FAILURE,
})

// *****************************
// add fuel record
// *****************************
export const addFuelRecordStart = () => ({
  type: vehicles.REQUEST_START,
})

export const addFuelRecordSuccess = (vehicleId, data) => ({
  type: vehicles.ADD_FUEL_RECORD,
  payload: { vehicleId, record: data },
})

export const addFuelRecordFailure = () => ({
  type: vehicles.REQUEST_FAILURE,
})
