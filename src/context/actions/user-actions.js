import * as users from '@/constants/types'

// *****************************
// fetch users
// *****************************
export const fetchUsersStart = () => ({
  type: users.REQUEST_START,
})

export const fetchUsersSuccess = (data) => ({
  type: users.FETCH_USERS,
  payload: data,
})

export const fetchUsersFailure = () => ({
  type: users.REQUEST_FAILURE,
})

// *****************************
// add users
// *****************************
export const addUserStart = () => ({
  type: users.REQUEST_START,
})

export const addUserSuccess = (data) => ({
  type: users.ADD_USER,
  payload: data,
})

export const addUserFailure = () => ({
  type: users.REQUEST_FAILURE,
})

// *****************************
// update user
// *****************************
export const updateUserStart = () => ({
  type: users.REQUEST_START,
})

export const updateUserSuccess = (data) => ({
  type: users.UPDATE_USER,
  payload: data,
})

export const updateUserFailure = () => ({
  type: users.REQUEST_FAILURE,
})

// *****************************
// delete user
// *****************************
export const deleteUserStart = () => ({
  type: users.REQUEST_START,
})

export const deleteUserSuccess = (id) => ({
  type: users.DELETE_USER,
  payload: id,
})

export const deleteUserFailure = () => ({
  type: users.REQUEST_FAILURE,
})
