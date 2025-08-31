// actions
import * as auth_actions from '@/context/actions/auth-actions'

// client cookies js
import Cookies from 'js-cookie'

// hooks
import { toast } from '@/hooks/use-toast'
import { fetchData } from '@/lib/fetch'
import { loadAPI } from '@/hooks/use-apis'

// api url
const API_URL = 'users'

// *****************************
// load current user data
// *****************************
export const loadCurrentUser = async (currentUserDispatch, data) =>
  loadAPI({
    dispatch: currentUserDispatch,
    start: auth_actions.fetchCurrentUserStart,
    success: auth_actions.fetchCurrentUserSuccess,
    failure: auth_actions.fetchCurrentUserFailure,
    errorMsg: 'Something went wrong, fetching current user',
    data: data,
  })

// *****************************
// fetch current user
// *****************************
export const fetchCurrentUser = async (currentUserDispatch) => {
  currentUserDispatch(auth_actions.fetchCurrentUserStart())
  console.log('fetching current_user :>> ')
  try {
    const uid = Cookies.get('uid')
    // console.log('uid :>> ', uid)
    if (!uid) {
      console.log('invalid user :>> ')
      currentUserDispatch(
        auth_actions.fetchCurrentUserFailure({ error: 'invalid user' })
      )
      return
    }
    // console.log('url :>> ', `${API_URL}/${uid}`)
    const response = await fetchData(`${API_URL}/${uid}`, 'GET')

    // Handle new standardized response format
    console.log('response :>> ', response)
    const responseData = response
    if (responseData && responseData !== undefined) {
      currentUserDispatch(auth_actions.fetchCurrentUserSuccess(responseData))
    } else {
      // Fallback for old format
      currentUserDispatch(auth_actions.fetchCurrentUserSuccess(responseData))
    }
  } catch (error) {
    currentUserDispatch(auth_actions.fetchCurrentUserFailure(error))
    toast({
      title: 'Something went wrong, fetching current user',
      description:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'Unknown error',
      variant: 'destructive',
    })
  }
}

// *****************************
// clear current user
// *****************************
export const clearCurrentUser = async (currentUserDispatch) => {
  currentUserDispatch(auth_actions.clearCurrentUserStart())

  currentUserDispatch(auth_actions.clearCurrentUserSuccess())
}
