// types
import * as customers from '@/constants/types'

const customerReducer = (state, action) => {
  switch (action.type) {
    case customers.REQUEST_START:
      return {
        ...state,
        loading: true,
        error: null,
      }
    case customers.REQUEST_SUCCESS:
      return {
        ...state,
        loading: false,
      }
    case customers.REQUEST_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }
    case customers.FETCH_CUSTOMERS:
      return {
        ...state,
        data: Array.isArray(action.payload) ? action.payload : [],
        loading: false,
      }
    case customers.FETCH_CUSTOMER:
      return {
        ...state,
        currentCustomer: action.payload,
        loading: false,
      }
    case customers.ADD_CUSTOMER:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? [...state.data, action.payload]
          : [action.payload],
        loading: false,
      }
    case customers.UPDATE_CUSTOMER:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((item) =>
              item.id === action.payload.id ? action.payload : item
            )
          : [action.payload],
        currentCustomer:
          state.currentCustomer?.id === action.payload.id
            ? action.payload
            : state.currentCustomer,
        loading: false,
      }
    case customers.DELETE_CUSTOMER:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.filter((item) => item.id !== action.payload)
          : [],
        currentCustomer:
          state.currentCustomer?.id === action.payload
            ? null
            : state.currentCustomer,
        loading: false,
      }
    default:
      return state
  }
}

export default customerReducer
