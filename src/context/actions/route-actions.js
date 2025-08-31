// action route
import * as routes from '@/constants/types'

// *****************************
// fetch routes
// *****************************
export const fetchRoutesStart = () => ({
  type: routes.REQUEST_START,
})
export const fetchRoutesSuccess = (data) => ({
  type: routes.FETCH_ROUTES,
  payload: data,
})
export const fetchRoutesFailure = () => ({
  type: routes.REQUEST_FAILURE,
})

// *****************************
// add route
// *****************************
export const addRouteStart = () => ({
  type: routes.REQUEST_START,
})
export const addRouteSuccess = (data) => ({
  type: routes.ADD_ROUTE,
  payload: data,
})
export const addRouteFailure = () => ({
  type: routes.REQUEST_FAILURE,
})

// *****************************
// update route
// *****************************
export const updateRouteStart = () => ({
  type: routes.REQUEST_START,
})
export const updateRouteSuccess = (data) => ({
  type: routes.UPDATE_ROUTE,
  payload: data,
})
export const updateRouteFailure = () => ({
  type: routes.REQUEST_FAILURE,
})

// *****************************
// delete route
// *****************************
export const deleteRouteStart = () => ({
  type: routes.REQUEST_START,
})
export const deleteRouteSuccess = (id) => ({
  type: routes.DELETE_ROUTE,
  payload: id,
})
export const deleteRouteFailure = () => ({
  type: routes.REQUEST_FAILURE,
})
