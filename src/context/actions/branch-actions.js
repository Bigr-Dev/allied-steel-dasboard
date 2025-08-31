// action branches
import * as branches from '@/constants/types'

// *****************************
// fetch cost centres
// *****************************
export const fetchBranchesStart = () => ({
  type: branches.REQUEST_START,
})
export const fetchBranchesSuccess = (data) => ({
  type: branches.FETCH_BRANCHES,
  payload: data,
})
export const fetchBranchesFailure = () => ({
  type: branches.REQUEST_FAILURE,
})

// *****************************
// add cost centre
// *****************************
export const addBranchStart = () => ({
  type: branches.REQUEST_START,
})
export const addBranchSuccess = (data) => ({
  type: branches.ADD_BRANCH,
  payload: data,
})
export const addBranchFailure = () => ({
  type: branches.REQUEST_FAILURE,
})

// *****************************
// update cost centre
// *****************************
export const updateBranchStart = () => ({
  type: branches.REQUEST_START,
})
export const updateBranchSuccess = (data) => ({
  type: branches.UPDATE_BRANCH,
  payload: data,
})
export const updateBranchFailure = () => ({
  type: branches.REQUEST_FAILURE,
})

// *****************************
// delete cost centre
// *****************************
export const deleteBranchStart = () => ({
  type: branches.REQUEST_START,
})
export const deleteBranchSuccess = (id) => ({
  type: branches.DELETE_BRANCH,
  payload: id,
})
export const deleteBranchFailure = () => ({
  type: branches.REQUEST_FAILURE,
})
