// types
import * as drivers from '@/constants/types'

const driverReducer = (state, action) => {
  switch (action.type) {
    case drivers.REQUEST_START:
      return {
        ...state,
        loading: true,
        error: null,
      }
    case drivers.REQUEST_SUCCESS:
      return {
        ...state,
        loading: false,
      }
    case drivers.REQUEST_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }
    case drivers.FETCH_DRIVERS:
      return {
        ...state,
        data: Array.isArray(action.payload) ? action.payload : [],
        loading: false,
      }
    case drivers.FETCH_DRIVER:
      return {
        ...state,
        currentDriver: action.payload,
        loading: false,
      }
    case drivers.ADD_DRIVER:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? [...state.data, action.payload]
          : [action.payload],
        loading: false,
      }
    case drivers.UPDATE_DRIVER:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((item) =>
              item.id === action.payload.id ? action.payload : item
            )
          : [action.payload],
        currentDriver:
          state.currentDriver?.id === action.payload.id
            ? action.payload
            : state.currentDriver,
        loading: false,
      }
    case drivers.DELETE_DRIVER:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.filter((item) => item.id !== action.payload)
          : [],
        currentDriver:
          state.currentDriver?.id === action.payload
            ? null
            : state.currentDriver,
        loading: false,
      }
    case drivers.ASSIGN_DRIVER:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((driver) => {
              if (driver.id === action.payload.driverId) {
                return {
                  ...driver,
                  currentVehicle: action.payload.vehicleId,
                }
              }
              return driver
            })
          : [],
        currentDriver:
          state.currentDriver?.id === action.payload.driverId
            ? {
                ...state.currentDriver,
                currentVehicle: action.payload.vehicleId,
              }
            : state.currentDriver,
        loading: false,
      }
    default:
      return state
  }
}

export default driverReducer
