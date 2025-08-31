// types
import * as auth from '@/constants/types'

const authReducer = (state, action) => {
  switch (action.type) {
    case auth.REQUEST_START:
      return {
        ...state,
        loading: true,
        error: null,
      }
    case auth.REQUEST_SUCCESS:
      return {
        ...state,
        loading: false,
      }
    case auth.REQUEST_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }

    case auth.FETCH_CURRENT_USER:
      return {
        ...state,
        currentUser: action.payload,
        loading: false,
      }

    case auth.CLEAR_CURRENT_USER:
      return {
        ...state,
        currentUser: {},
        loading: false,
      }
    default:
      return state
  }
}
export default authReducer
