import * as drivers from '@/constants/types'

// *****************************
// fetch drivers
// *****************************
export const fetchDriversStart = () => ({
  type: drivers.REQUEST_START,
})

export const fetchDriversSuccess = (data) => ({
  type: drivers.FETCH_DRIVERS,
  payload: data,
})

export const fetchDriversFailure = () => ({
  type: drivers.REQUEST_FAILURE,
})

// *****************************
// add driver
// *****************************
export const addDriverStart = () => ({
  type: drivers.REQUEST_START,
})

export const addDriverSuccess = (data) => {
  //  console.log('data from action :>> ', data)
  return {
    type: drivers.ADD_DRIVER,
    payload: data,
  }
}

export const addDriverFailure = () => ({
  type: drivers.REQUEST_FAILURE,
})

// *****************************
// update driver
// *****************************
export const updateDriverStart = () => ({
  type: drivers.REQUEST_START,
})

export const updateDriverSuccess = (data) => ({
  type: drivers.UPDATE_DRIVER,
  payload: data,
})

export const updateDriverFailure = () => ({
  type: drivers.REQUEST_FAILURE,
})

// *****************************
// delete driver
// *****************************
export const deleteDriverStart = () => ({
  type: drivers.REQUEST_START,
})

export const deleteDriverSuccess = (id) => ({
  type: drivers.DELETE_DRIVER,
  payload: id,
})

export const deleteDriverFailure = () => ({
  type: drivers.REQUEST_FAILURE,
})

// *****************************
// assign driver to vehicle
// *****************************
export const assignDriverStart = () => ({
  type: drivers.REQUEST_START,
})

export const assignDriverSuccess = (driverId, vehicleId, data) => ({
  type: drivers.ASSIGN_DRIVER,
  payload: { driverId, vehicleId, data },
})

export const assignDriverFailure = () => ({
  type: drivers.REQUEST_FAILURE,
})
