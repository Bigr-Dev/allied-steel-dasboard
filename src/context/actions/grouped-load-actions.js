// action load
import * as grouped_loads from '@/constants/types'

// *****************************
// fetch grouped loads
// *****************************
export const fetchGroupedLoadsStart = () => ({
  type: grouped_loads.REQUEST_START,
})
export const fetchGroupedLoadsSuccess = (data) => ({
  type: grouped_loads.FETCH_GROUPED_LOADS,
  payload: data,
})
export const fetchGroupedLoadsFailure = () => ({
  type: grouped_loads.REQUEST_FAILURE,
})

// *****************************
// add grouped loads
// *****************************
export const addGroupedLoadStart = () => ({
  type: grouped_loads.REQUEST_START,
})
export const addGroupedLoadSuccess = (data) => ({
  type: grouped_loads.ADD_GROUPED_LOAD,
  payload: data,
})
export const addGroupedLoadFailure = () => ({
  type: grouped_loads.REQUEST_FAILURE,
})

// *****************************
// update grouped loads
// *****************************
export const updateGroupedLoadStart = () => ({
  type: grouped_loads.REQUEST_START,
})
export const updateGroupedLoadSuccess = (data) => ({
  type: grouped_loads.UPDATE_GROUPED_LOAD,
  payload: data,
})
export const updateGroupedLoadFailure = () => ({
  type: grouped_loads.REQUEST_FAILURE,
})

// *****************************
// delete grouped loads
// *****************************
export const deleteGroupedLoadStart = () => ({
  type: grouped_loads.REQUEST_START,
})
export const deleteGroupedLoadSuccess = (id) => ({
  type: grouped_loads.DELETE_GROUPED_LOAD,
  payload: id,
})
export const deleteGroupedLoadFailure = () => ({
  type: grouped_loads.REQUEST_FAILURE,
})
