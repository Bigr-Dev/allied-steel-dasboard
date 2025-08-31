// types
import * as orders from '@/constants/types'

const orderReducer = (state, action) => {
  switch (action.type) {
    case orders.REQUEST_START:
      return {
        ...state,
        loading: true,
        error: null,
      }
    case orders.REQUEST_SUCCESS:
      return {
        ...state,
        loading: false,
      }
    case orders.REQUEST_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }
    case orders.FETCH_ORDERS:
      return {
        ...state,
        data: Array.isArray(action.payload) ? action.payload : [],
        loading: false,
      }
    case orders.FETCH_ORDER:
      return {
        ...state,
        currentOrder: action.payload,
        loading: false,
      }
    case orders.ADD_ORDER:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? [...state.data, action.payload]
          : [action.payload],
        loading: false,
      }
    case orders.UPDATE_ORDER:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((item) =>
              item.id === action.payload.id ? action.payload : item
            )
          : [action.payload],
        currentOrder:
          state.currentOrder?.id === action.payload.id
            ? action.payload
            : state.currentOrder,
        loading: false,
      }
    case orders.DELETE_ORDER:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.filter((item) => item.id !== action.payload)
          : [],
        currentOrder:
          state.currentOrder?.id === action.payload ? null : state.currentOrder,
        loading: false,
      }
    default:
      return state
  }
}

export default orderReducer
