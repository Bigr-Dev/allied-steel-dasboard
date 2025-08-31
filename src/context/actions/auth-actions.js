// action auth
import * as auth from '@/constants/types'

// *****************************
// fetch current user
// *****************************
export const fetchCurrentUserStart = () => ({
  type: auth.REQUEST_START,
})
export const fetchCurrentUserSuccess = (data) => ({
  type: auth.FETCH_CURRENT_USER,
  payload: data,
})
export const fetchCurrentUserFailure = () => ({
  type: auth.REQUEST_FAILURE,
})

// *****************************
// clear current user
// *****************************
export const clearCurrentUserStart = () => ({
  type: auth.REQUEST_START,
})
export const clearCurrentUserSuccess = () => ({
  type: auth.CLEAR_CURRENT_USER,
  payload: {},
})
export const clearCurrentUserFailure = () => ({
  type: auth.REQUEST_FAILURE,
})
