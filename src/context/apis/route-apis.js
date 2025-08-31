// actions
import * as route_actions from '../actions/route-actions'

// hooks
import { deleteApi, fetchApi, loadAPI, postApi, putApi } from '@/hooks/use-apis'

// api url
const API_URL = 'routes'

// *****************************
// load route data
// *****************************
export const loadRoutes = async (routesDispatch, data) =>
  loadAPI({
    dispatch: routesDispatch,
    start: route_actions.fetchRoutesStart,
    success: route_actions.fetchRoutesSuccess,
    failure: route_actions.fetchRoutesFailure,
    errorMsg: 'Something went wrong, while fetching routes',
    data: data,
  })

// *****************************
// fetch route
// *****************************
export const fetchRoutes = async (routesDispatch) =>
  fetchApi({
    dispatch: routesDispatch,
    start: route_actions.fetchRoutesStart,
    success: route_actions.fetchRoutesSuccess,
    failure: route_actions.fetchRoutesFailure,
    errorMsg: 'Something went wrong, while fetching routes',
    url: API_URL,
  })

// *****************************
// add route
// *****************************
const addRoute = async (route, routesDispatch) =>
  postApi({
    dispatch: routesDispatch,
    start: route_actions.addRouteStart,
    data: route,
    success: route_actions.addRouteSuccess,
    successMsg: `New route, with name: ${route.name} has been created.`,
    failure: route_actions.addRouteFailure,
    errorMsg: 'Something went wrong, while adding route',
    url: API_URL,
  })

// *****************************
// update route
// *****************************
const updateRoute = async (id, route, routesDispatch) =>
  putApi({
    dispatch: routesDispatch,
    start: route_actions.updateRouteStart,
    id,
    data: route,
    success: route_actions.updateRouteSuccess,
    successMsg: `Routes, with id: ${id} and name: ${route.name} was updated.`,
    failure: route_actions.updateRouteFailure,
    errorMsg: 'Something went wrong, while updating route',
    url: API_URL,
  })

// *****************************
// move upsert to hooks or helpers(chat with cam)
// *****************************
export const upsertRoute = async (id, route, routesDispatch) =>
  id ? updateRoute(id, route, routesDispatch) : addRoute(route, routesDispatch)

// *****************************
// delete route
// *****************************
export const deleteRoute = async (id, routesDispatch) =>
  deleteApi({
    dispatch: routesDispatch,
    start: route_actions.deleteRouteStart,
    id,
    success: route_actions.deleteRouteSuccess,
    successMsg: `Routes with id: ${id} has been deleted.`,
    failure: route_actions.deleteRouteFailure,
    errorMsg: 'Something went wrong, while deleting route',
    url: API_URL,
  })
