// actions
import * as vehicle_actions from '../actions/vehicle-actions'

// client cookies js
import Cookies from 'js-cookie'

// hooks
import { toast } from '@/hooks/use-toast'
import { deleteApi, fetchApi, loadAPI, postApi, putApi } from '@/hooks/use-apis'

// api url
const API_URL = 'vehicles'

// *****************************
// load vehicles data
// *****************************
export const loadVehicles = async (vehiclesDispatch, data) => {
  //  console.log('data :>> ', data)
  return loadAPI({
    dispatch: vehiclesDispatch,
    start: vehicle_actions.fetchVehiclesStart,
    success: vehicle_actions.fetchVehiclesSuccess,
    failure: vehicle_actions.fetchVehiclesFailure,
    errorMsg: 'Something went wrong, while fetching vehicles',
    data: data,
  })
}

// *****************************
// fetch vehicles
// *****************************
export const fetchVehicles = async (vehiclesDispatch) => {
  fetchApi({
    dispatch: vehiclesDispatch,
    start: vehicle_actions.fetchVehiclesStart,
    success: vehicle_actions.fetchVehiclesSuccess,
    failure: vehicle_actions.fetchVehiclesFailure,
    errorMsg: 'Something went wrong, while fetching vehicles',
    url: API_URL,
  })
}

// *****************************
// add vehicle
// *****************************
export const addVehicle = async (vehicle, vehiclesDispatch) =>
  postApi({
    dispatch: vehiclesDispatch,
    start: vehicle_actions.addVehicleStart,
    data: vehicle,
    success: vehicle_actions.addVehicleSuccess,
    successMsg: `New vehicle, with id: ${vehicle.id} and name: ${vehicle.name} has been created.`,
    failure: vehicle_actions.addVehicleFailure,
    errorMsg: 'Something went wrong, while adding vehicle',
    url: API_URL,
  })

// *****************************
// update vehicle
// *****************************
export const updateVehicle = async (id, vehicle, vehiclesDispatch) =>
  putApi({
    dispatch: vehiclesDispatch,
    start: vehicle_actions.updateVehicleStart,
    id,
    data: vehicle,
    success: vehicle_actions.updateVehicleSuccess,
    successMsg: `Vehicle, with id: ${id} and model: ${vehicle.model} was updated.`,
    failure: vehicle_actions.updateVehicleFailure,
    errorMsg: 'Something went wrong, while updating vehicle',
    url: API_URL,
  })

// *****************************
// move upsert to hooks or helpers(chat with cam)
// *****************************

export const upsertVehicle = async (id, vehicle, vehiclesDispatch) =>
  id
    ? updateVehicle(id, vehicle, vehiclesDispatch)
    : addVehicle(vehicle, vehiclesDispatch)

// *****************************
// delete vehicle
// *****************************
export const deleteVehicle = async (id, vehiclesDispatch) =>
  deleteApi({
    dispatch: vehiclesDispatch,
    start: vehicle_actions.deleteVehicleStart,
    id,
    success: vehicle_actions.deleteVehicleSuccess,
    successMsg: `Vehicle with id: ${id} has been deleted.`,
    failure: vehicle_actions.deleteVehicleFailure,
    errorMsg: 'Something went wrong, while deleting vehicle',
    url: API_URL,
  })

// *****************************
// add maintenance record
// *****************************
export const addMaintenanceRecord = async (
  vehicleId,
  record,
  vehiclesDispatch
) => {
  vehiclesDispatch(vehicle_actions.addMaintenanceRecordStart())
  try {
    const token = Cookies.get('firebaseIdToken')
    const response = await axios.post(
      `${API_URL}/${vehicleId}/maintenance`,
      record,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    // Handle new standardized response format
    const responseData = response.data
    if (responseData.success && responseData.data !== undefined) {
      vehiclesDispatch(
        vehicle_actions.addMaintenanceRecordSuccess(responseData.data)
      )
    } else {
      // Fallback for old format
      vehiclesDispatch(
        vehicle_actions.addMaintenanceRecordSuccess(responseData)
      )
    }
  } catch (error) {
    console.error(
      `Error adding maintenance record for vehicle ${vehicleId}:`,
      error
    )
    vehiclesDispatch(vehicle_actions.addMaintenanceRecordFailure(error))
  }
}

// *****************************
// add fuel record
// *****************************
export const addFuelRecord = async (vehicleId, record, vehiclesDispatch) => {
  vehiclesDispatch(vehicle_actions.addFuelRecordStart())
  try {
    const token = Cookies.get('firebaseIdToken')
    const response = await axios.post(`${API_URL}/${vehicleId}/fuel`, record, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // Handle new standardized response format
    const responseData = response.data
    if (responseData.success && responseData.data !== undefined) {
      vehiclesDispatch(vehicle_actions.addFuelRecordSuccess(responseData.data))
    } else {
      // Fallback for old format
      vehiclesDispatch(vehicle_actions.addFuelRecordSuccess(responseData))
    }
  } catch (error) {
    console.error(`Error adding fuel record for vehicle ${vehicleId}:`, error)
    vehiclesDispatch(vehicle_actions.addFuelRecordFailure(error))
  }
}
