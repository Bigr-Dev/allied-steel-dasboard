// actions
import * as user_actions from '../actions/user-actions'

// client cookies js
import Cookies from 'js-cookie'

// hooks
import { toast } from '@/hooks/use-toast'
import { deleteApi, fetchApi, loadAPI, postApi, putApi } from '@/hooks/use-apis'

// api url
const API_URL = 'users'

// *****************************
// load users data
// *****************************
export const loadUsers = async (usersDispatch, data) =>
  loadAPI({
    dispatch: usersDispatch,
    start: user_actions.fetchUsersStart,
    success: user_actions.fetchUsersSuccess,
    failure: user_actions.fetchUsersFailure,
    errorMsg: 'Something went wrong, while fetching users',
    data: data,
  })

// *****************************
// fetch users
// *****************************
export const fetchUsers = async (usersDispatch) => {
  fetchApi({
    dispatch: usersDispatch,
    start: user_actions.fetchUsersStart,
    success: user_actions.fetchUsersSuccess,
    failure: user_actions.fetchUsersFailure,
    errorMsg: 'Something went wrong, while fetching users',
    url: API_URL,
  })
}

// *****************************
// add user
// *****************************
const addUser = async (user, usersDispatch) =>
  postApi({
    dispatch: usersDispatch,
    start: user_actions.addUserStart,
    data: user,
    success: user_actions.addUserSuccess,
    successMsg: `New user, with name: ${user.name} has been created.`,
    failure: user_actions.addUserFailure,
    errorMsg: 'Something went wrong, while adding user',
    url: API_URL,
  })

// *****************************
// update user
// *****************************
const updateUser = async (id, user, usersDispatch) =>
  putApi({
    dispatch: usersDispatch,
    start: user_actions.updateUserStart,
    id,
    data: user,
    success: user_actions.updateUserSuccess,
    successMsg: `User, with id: ${id} and name: ${user.name} was updated.`,
    failure: user_actions.updateUserFailure,
    errorMsg: 'Something went wrong, while updating user',
    url: API_URL,
  })

export const upsertUser = async (id, user, usersDispatch) =>
  id ? updateUser(id, user, usersDispatch) : addUser(user, usersDispatch)

// *****************************
// delete user
// *****************************
export const deleteUser = async (id, usersDispatch) =>
  deleteApi({
    dispatch: usersDispatch,
    start: user_actions.deleteUserStart,
    id,
    success: user_actions.deleteUserSuccess,
    successMsg: `User with id: ${id} has been deleted.`,
    failure: user_actions.deleteUserFailure,
    errorMsg: 'Something went wrong, while deleting user',
    url: API_URL,
  })
