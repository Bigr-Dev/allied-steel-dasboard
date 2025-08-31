// actions
import * as driver_actions from '../actions/driver-actions'

// client cookies js
import Cookies from 'js-cookie'

// hooks
import { toast } from '@/hooks/use-toast'
import { deleteApi, fetchApi, loadAPI, postApi, putApi } from '@/hooks/use-apis'

// api url
const API_URL = 'drivers'

// *****************************
// load drivers data
// *****************************
export const loadDrivers = async (driversDispatch, data) =>
  loadAPI({
    dispatch: driversDispatch,
    start: driver_actions.fetchDriversStart,
    success: driver_actions.fetchDriversSuccess,
    failure: driver_actions.fetchDriversFailure,
    errorMsg: 'Something went wrong, while fetching drivers',
    data: data,
  })

// *****************************
// fetch drivers
// *****************************
export const fetchDrivers = async (driversDispatch) => {
  fetchApi({
    dispatch: driversDispatch,
    start: driver_actions.fetchDriversStart,
    success: driver_actions.fetchDriversSuccess,
    failure: driver_actions.fetchDriversFailure,
    errorMsg: 'Something went wrong, while fetching drivers',
    url: API_URL,
  })
}

// *****************************
// add driver
// *****************************
const addDriver = async (driver, driversDispatch) =>
  postApi({
    dispatch: driversDispatch,
    start: driver_actions.addDriverStart,
    data: driver,
    success: driver_actions.addDriverSuccess,
    successMsg: `New driver, with name: ${driver.name} has been created.`,
    failure: driver_actions.addDriverFailure,
    errorMsg: 'Something went wrong, while adding driver',
    url: API_URL,
  })

// *****************************
//update driver
// *****************************
const updateDriver = async (id, driver, driversDispatch) =>
  putApi({
    dispatch: driversDispatch,
    start: driver_actions.updateDriverStart,
    id,
    data: driver,
    success: driver_actions.updateDriverSuccess,
    successMsg: `Driver, with id: ${id} and name: ${driver.name} was updated.`,
    failure: driver_actions.updateDriverFailure,
    errorMsg: 'Something went wrong, while updating driver',
    url: API_URL,
  })

// *****************************
// move upsert to hooks or helpers(chat with cam)
// *****************************
export const upsertDriver = async (id, driver, driversDispatch) =>
  id
    ? updateDriver(id, driver, driversDispatch)
    : addDriver(driver, driversDispatch)

// *****************************
// delete driver
// *****************************
export const deleteDriver = async (id, driversDispatch) =>
  deleteApi({
    dispatch: driversDispatch,
    start: driver_actions.deleteDriverStart,
    id,
    success: driver_actions.deleteDriverSuccess,
    successMsg: `Driver with id: ${id} has been deleted.`,
    failure: driver_actions.deleteDriverFailure,
    errorMsg: 'Something went wrong, while deleting driver',
    url: API_URL,
  })

// *****************************
// assign vehicle to driver
// *****************************
export const assignDriver = async (driverId, vehicleId, driversDispatch) => {
  driversDispatch(driver_actions.assignDriverStart())
  try {
    const token = Cookies.get('firebaseIdToken')
    if (!token) {
      driversDispatch(
        driver_actions.assignDriverFailure({ error: 'invalid user' })
      )
      return
    }
    const response = await axios.post(
      `${API_URL}/${driverId}/assign-vehicle`,
      {
        vehicleId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    // Handle new standardized response format
    const responseData = response.data
    if (responseData.success && responseData.data !== undefined) {
      driversDispatch(driver_actions.assignDriverSuccess(responseData.data))
    } else {
      // Fallback for old format
      driversDispatch(driver_actions.assignDriverSuccess(responseData))
    }

    toast({
      title: 'Driver updated successfully',
      description: responseData?.message || `Driver has been assigned vehicle.`,
    })
  } catch (error) {
    driversDispatch(driver_actions.assignDriverFailure(error))
    toast({
      title: 'Something went wrong while adding vehicle to driver',
      description:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        `Error assigning vehicle to driver ${driverId}:`,
      variant: 'destructive',
    })
  }
}
