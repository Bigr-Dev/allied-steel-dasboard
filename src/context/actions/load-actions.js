import * as loads from '@/constants/types'

// *****************************
// fetch loads
// *****************************
export const fetchLoadsStart = () => ({
  type: loads.REQUEST_START,
})

export const fetchLoadsSuccess = (data) => ({
  type: loads.FETCH_LOADS,
  payload: data,
})

export const fetchLoadsFailure = () => ({
  type: loads.REQUEST_FAILURE,
})

// *****************************
// upload loads
// *****************************
export const uploadLoadsStart = () => ({
  type: loads.REQUEST_START,
})

export const uploadLoadsSuccess = (data) => ({
  type: loads.UPLOAD_LOADS,
  payload: data,
})

export const uploadLoadsFailure = () => ({
  type: loads.REQUEST_FAILURE,
})

// *****************************
// add  load
// *****************************
export const addLoadStart = () => ({
  type: loads.REQUEST_START,
})

export const addLoadSuccess = (data) => ({
  type: loads.ADD_LOAD,
  payload: data,
})

export const addLoadFailure = () => ({
  type: loads.REQUEST_FAILURE,
})

// *****************************
// update  load
// *****************************
export const updateLoadStart = () => ({
  type: loads.REQUEST_START,
})

export const updateLoadSuccess = (data) => ({
  type: loads.UPDATE_LOAD,
  payload: data,
})

export const updateLoadFailure = () => ({
  type: loads.REQUEST_FAILURE,
})

// *****************************
// delete  load
// *****************************
export const deleteLoadStart = () => ({
  type: loads.REQUEST_START,
})

export const deleteLoadSuccess = (id) => ({
  type: loads.DELETE_LOAD,
  payload: id,
})

export const deleteLoadFailure = () => ({
  type: loads.REQUEST_FAILURE,
})

// *****************************
// update  load status
// *****************************
export const updateLoadStatusStart = () => ({
  type: loads.REQUEST_START,
})

export const updateLoadStatusSuccess = (id, status, data) => ({
  type: loads.UPDATE_LOAD_STATUS,
  payload: { id, status, data },
})

export const updateLoadStatusFailure = () => ({
  type: loads.REQUEST_FAILURE,
})

// *****************************
// add  load waypoint
// *****************************
export const addLoadWaypointStart = () => ({
  type: loads.REQUEST_START,
})

export const addLoadWaypointSuccess = (loadId, data) => ({
  type: loads.ADD_LOAD_WAYPOINT,
  payload: { loadId, waypoint: data },
})

export const addLoadWaypointFailure = () => ({
  type: loads.REQUEST_FAILURE,
})

// *****************************
// add  load update
// *****************************
export const addLoadUpdateStart = () => ({
  type: loads.REQUEST_START,
})

export const addLoadUpdateSuccess = (loadId, data) => ({
  type: loads.ADD_LOAD_UPDATE,
  payload: { loadId, update: data },
})

export const addLoadUpdateFailure = () => ({
  type: loads.REQUEST_FAILURE,
})

// *****************************
// add  load expense
// *****************************
export const addLoadExpenseStart = () => ({
  type: loads.REQUEST_START,
})

export const addLoadExpenseSuccess = (loadId, data) => ({
  type: loads.ADD_LOAD_EXPENSE,
  payload: { loadId, expense: data },
})

export const addLoadExpenseFailure = () => ({
  type: loads.REQUEST_FAILURE,
})
