import * as stop_points from '@/constants/types'

// *****************************
// fetch stop points
// *****************************
export const fetchStopPointsStart = () => ({
  type: stop_points.REQUEST_START,
})

export const fetchStopPointsSuccess = (data) => ({
  type: stop_points.FETCH_STOP_POINTS,
  payload: data,
})

export const fetchStopPointsFailure = () => ({
  type: stop_points.REQUEST_FAILURE,
})

// *****************************
// add stop points
// *****************************
export const addStopPointStart = () => ({
  type: stop_points.REQUEST_START,
})

export const addStopPointSuccess = (data) => ({
  type: stop_points.ADD_STOP_POINT,
  payload: data,
})

export const addStopPointFailure = () => ({
  type: stop_points.REQUEST_FAILURE,
})

// *****************************
// update stop points
// *****************************
export const updateStopPointStart = () => ({
  type: stop_points.REQUEST_START,
})

export const updateStopPointSuccess = (data) => ({
  type: stop_points.UPDATE_STOP_POINT,
  payload: data,
})

export const updateStopPointFailure = () => ({
  type: stop_points.REQUEST_FAILURE,
})

// *****************************
// delete stop points
// *****************************
export const deleteStopPointStart = () => ({
  type: stop_points.REQUEST_START,
})

export const deleteStopPointSuccess = (id) => ({
  type: stop_points.DELETE_STOP_POINT,
  payload: id,
})

export const deleteStopPointFailure = () => ({
  type: stop_points.REQUEST_FAILURE,
})
