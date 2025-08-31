// types
import * as users from '@/constants/types'

const userReducer = (state, action) => {
  switch (action.type) {
    case users.REQUEST_START:
      return {
        ...state,
        loading: true,
        error: null,
      }
    case users.REQUEST_SUCCESS:
      return {
        ...state,
        loading: false,
      }
    case users.REQUEST_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }
    case users.FETCH_USERS:
      return {
        ...state,
        data: Array.isArray(action.payload) ? action.payload : [],
        loading: false,
      }
    case users.FETCH_USER:
      return {
        ...state,
        currentUser: action.payload,
        loading: false,
      }
    case users.ADD_USER:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? [...state.data, action.payload]
          : [action.payload],
        loading: false,
      }
    case users.UPDATE_USER:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((item) =>
              item.id === action.payload.id ? action.payload : item
            )
          : [action.payload],

        loading: false,
      }
    case users.DELETE_USER:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.filter((item) => item.id !== action.payload)
          : [],
        currentUser:
          state.currentUser?.id === action.payload ? null : state.currentUser,
        loading: false,
      }
    default:
      return state
  }
}

export default userReducer
