// types
import * as vehicles from '@/constants/types'

const vehicleReducer = (state, action) => {
  switch (action.type) {
    case vehicles.REQUEST_START:
      return {
        ...state,
        loading: true,
        error: null,
      }
    case vehicles.REQUEST_SUCCESS:
      return {
        ...state,
        loading: false,
      }
    case vehicles.REQUEST_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }
    case vehicles.FETCH_VEHICLES:
      return {
        ...state,
        data: Array.isArray(action.payload) ? action.payload : [],
        loading: false,
      }
    case vehicles.FETCH_VEHICLE:
      return {
        ...state,
        currentVehicle: action.payload,
        loading: false,
      }
    case vehicles.ADD_VEHICLE:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? [...state.data, action.payload]
          : [action.payload],
        loading: false,
      }
    case vehicles.UPDATE_VEHICLE:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((item) =>
              item.id === action.payload.id ? action.payload : item
            )
          : [action.payload],
        currentVehicle:
          state.currentVehicle?.id === action.payload.id
            ? action.payload
            : state.currentVehicle,
        loading: false,
      }
    case vehicles.DELETE_VEHICLE:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.filter((item) => item.id !== action.payload)
          : [],
        currentVehicle:
          state.currentVehicle?.id === action.payload
            ? null
            : state.currentVehicle,
        loading: false,
      }
    case vehicles.ADD_MAINTENANCE_RECORD:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((vehicle) => {
              if (vehicle.id === action.payload.vehicleId) {
                return {
                  ...vehicle,
                  maintenanceHistory: [
                    ...(vehicle.maintenanceHistory || []),
                    action.payload.record,
                  ],
                }
              }
              return vehicle
            })
          : [],
        currentVehicle:
          state.currentVehicle?.id === action.payload.vehicleId
            ? {
                ...state.currentVehicle,
                maintenanceHistory: [
                  ...(state.currentVehicle.maintenanceHistory || []),
                  action.payload.record,
                ],
              }
            : state.currentVehicle,
        loading: false,
      }
    case vehicles.ADD_FUEL_RECORD:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((vehicle) => {
              if (vehicle.id === action.payload.vehicleId) {
                return {
                  ...vehicle,
                  fuelHistory: [
                    ...(vehicle.fuelHistory || []),
                    action.payload.record,
                  ],
                }
              }
              return vehicle
            })
          : [],
        currentVehicle:
          state.currentVehicle?.id === action.payload.vehicleId
            ? {
                ...state.currentVehicle,
                fuelHistory: [
                  ...(state.currentVehicle.fuelHistory || []),
                  action.payload.record,
                ],
              }
            : state.currentVehicle,
        loading: false,
      }
    default:
      return state
  }
}

export default vehicleReducer
