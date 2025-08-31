// types
import * as branches from '@/constants/types'

const branchReducer = (state, action) => {
  switch (action.type) {
    case branches.REQUEST_START:
      return {
        ...state,
        loading: true,
        error: null,
      }
    case branches.REQUEST_SUCCESS:
      return {
        ...state,
        loading: false,
      }
    case branches.REQUEST_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }
    case branches.FETCH_BRANCHES:
      return {
        ...state,
        data: action.payload,
        loading: false,
      }
    case branches.FETCH_BRANCH:
      return {
        ...state,
        currentBranch: action.payload,
        loading: false,
      }
    case branches.ADD_BRANCH:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? [...state.data, action.payload]
          : [action.payload],
        loading: false,
      }
    case branches.UPDATE_BRANCH:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.map((item) =>
              item.id === action.payload.id ? action.payload : item
            )
          : [action.payload],
        currentBranch:
          state.currentBranch?.id === action.payload.id
            ? action.payload
            : state.currentBranch,
        loading: false,
      }
    case branches.DELETE_BRANCH:
      return {
        ...state,
        data: Array.isArray(state.data)
          ? state.data.filter((item) => item.id !== action.payload)
          : [],
        currentBranch:
          state.currentBranch?.id === action.payload
            ? null
            : state.currentBranch,
        loading: false,
      }
    default:
      return state
  }
}

export default branchReducer
