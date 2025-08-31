// types
import * as grouped_loads from '@/constants/types'

const groupedLoadReducer = (state, action) => {
  switch (action.type) {
    case grouped_loads.REQUEST_START:
      return {
        ...state,
        loading: true,
        error: null,
      }
    case grouped_loads.REQUEST_SUCCESS:
      return {
        ...state,
        loading: false,
      }
    case grouped_loads.REQUEST_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }
    case grouped_loads.FETCH_GROUPED_LOADS:
      return {
        ...state,
        data: Array.isArray(action.payload) ? action.payload : [],
        loading: false,
      }
    case grouped_loads.FETCH_GROUPED_LOAD:
      return {
        ...state,
        currentLoad: action.payload,
        loading: false,
      }
    case grouped_loads.ADD_GROUPED_LOAD:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? [...state.data, action.payload]
          : [action.payload],
        loading: false,
      }
    case grouped_loads.UPDATE_GROUPED_LOAD:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((item) =>
              item.id === action.payload.id ? action.payload : item
            )
          : [action.payload],
        currentLoad:
          state.currentLoad?.id === action.payload.id
            ? action.payload
            : state.currentLoad,
        loading: false,
      }
    case grouped_loads.DELETE_GROUPED_LOAD:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.filter((item) => item.id !== action.payload)
          : [],
        currentLoad:
          state.currentLoad?.id === action.payload ? null : state.currentLoad,
        loading: false,
      }
    case grouped_loads.UPDATE_LOAD_STATUS:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((load) => {
              if (load.id === action.payload.id) {
                return {
                  ...load,
                  status: action.payload.status,
                }
              }
              return load
            })
          : [],
        currentLoad:
          state.currentLoad?.id === action.payload.id
            ? {
                ...state.currentLoad,
                status: action.payload.status,
              }
            : state.currentLoad,
        loading: false,
      }
    case grouped_loads.ADD_LOAD_WAYPOINT:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((load) => {
              if (load.id === action.payload.loadId) {
                return {
                  ...load,
                  waypoints: [
                    ...(load.waypoints || []),
                    action.payload.waypoint,
                  ],
                }
              }
              return load
            })
          : [],
        currentLoad:
          state.currentLoad?.id === action.payload.loadId
            ? {
                ...state.currentLoad,
                waypoints: [
                  ...(state.currentLoad.waypoints || []),
                  action.payload.waypoint,
                ],
              }
            : state.currentLoad,
        loading: false,
      }
    case grouped_loads.ADD_LOAD_UPDATE:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((load) => {
              if (load.id === action.payload.loadId) {
                return {
                  ...load,
                  updates: [...(load.updates || []), action.payload.update],
                }
              }
              return load
            })
          : [],
        currentLoad:
          state.currentLoad?.id === action.payload.loadId
            ? {
                ...state.currentLoad,
                updates: [
                  ...(state.currentLoad.updates || []),
                  action.payload.update,
                ],
              }
            : state.currentLoad,
        loading: false,
      }
    case grouped_loads.ADD_LOAD_EXPENSE:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((load) => {
              if (load.id === action.payload.loadId) {
                return {
                  ...load,
                  expenses: [...(load.expenses || []), action.payload.expense],
                }
              }
              return load
            })
          : [],
        currentLoad:
          state.currentLoad?.id === action.payload.loadId
            ? {
                ...state.currentLoad,
                expenses: [
                  ...(state.currentLoad.expenses || []),
                  action.payload.expense,
                ],
              }
            : state.currentLoad,
        loading: false,
      }
    default:
      return state
  }
}

export default groupedLoadReducer
