// types
import * as routes from '@/constants/types'

const routeReducer = (state, action) => {
  switch (action.type) {
    case routes.REQUEST_START:
      return {
        ...state,
        loading: true,
        error: null,
      }
    case routes.REQUEST_SUCCESS:
      return {
        ...state,
        loading: false,
      }
    case routes.REQUEST_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }
    case routes.FETCH_ROUTES:
      return {
        ...state,
        data: Array.isArray(action.payload) ? action.payload : [],
        loading: false,
      }
    case routes.FETCH_ROUTE:
      return {
        ...state,
        currentRoute: action.payload,
        loading: false,
      }
    case routes.ADD_ROUTE:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? [...state.data, action.payload]
          : [action.payload],
        loading: false,
      }
    case routes.UPDATE_ROUTE:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((item) =>
              item.id === action.payload.id ? action.payload : item
            )
          : [action.payload],
        currentRoute:
          state.currentRoute?.id === action.payload.id
            ? action.payload
            : state.currentRoute,
        loading: false,
      }
    case routes.DELETE_ROUTE:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.filter((item) => item.id !== action.payload)
          : [],
        currentRoute:
          state.currentRoute?.id === action.payload ? null : state.currentRoute,
        loading: false,
      }
    // case routes.ASSIGN_ROUTE:
    //   return {
    //     ...state,
    //     data: Array.isArray(state.data)
    //       ? state.data.map((route) => {
    //           if (route.id === action.payload.routeId) {
    //             return {
    //               ...route,
    //               currentVehicle: action.payload.vehicleId,
    //             }
    //           }
    //           return route
    //         })
    //       : [],
    //     currentRoute:
    //       state.currentRoute?.id === action.payload.routeId
    //         ? {
    //             ...state.currentRoute,
    //             currentVehicle: action.payload.vehicleId,
    //           }
    //         : state.currentRoute,
    //     loading: false,
    //   }
    default:
      return state
  }
}

export default routeReducer
