// actions
import * as branch_actions from '../actions/branch-actions'

// hooks
import { deleteApi, fetchApi, loadAPI, postApi, putApi } from '@/hooks/use-apis'
import { branchesAPI } from '@/lib/api'

// api url
const API_URL = 'branches'

// *****************************
// load branch data
// *****************************
export const loadBranches = async (branchesDispatch, data) =>
  loadAPI({
    dispatch: branchesDispatch,
    start: branch_actions.fetchBranchesStart,
    success: branch_actions.fetchBranchesSuccess,
    failure: branch_actions.fetchBranchesFailure,
    errorMsg: 'Something went wrong, while fetching branches',
    data: data,
  })

// *****************************
// fetch branch
// *****************************
export const fetchBranches = async (branchesDispatch) =>
  fetchApi({
    dispatch: branchesDispatch,
    start: branch_actions.fetchBranchesStart,
    success: branch_actions.fetchBranchesSuccess,
    failure: branch_actions.fetchBranchesFailure,
    errorMsg: 'Something went wrong, while fetching branches',
    url: API_URL,
  })

// *****************************
// add branch
// *****************************
const addBranch = async (branch, branchesDispatch) =>
  postApi({
    dispatch: branchesDispatch,
    start: branch_actions.addBranchStart,
    data: branch,
    success: branch_actions.addBranchSuccess,
    successMsg: `New branch, with name: ${branch.name} has been created.`,
    failure: branch_actions.addBranchFailure,
    errorMsg: 'Something went wrong, while adding branch',
    url: API_URL,
  })

// *****************************
// update branch
// *****************************
const updateBranch = async (id, branch, branchesDispatch) =>
  putApi({
    dispatch: branchesDispatch,
    start: branch_actions.updateBranchStart,
    id,
    data: branch,
    success: branch_actions.updateBranchSuccess,
    successMsg: `Branches, with id: ${id} and name: ${branch.name} was updated.`,
    failure: branch_actions.updateBranchFailure,
    errorMsg: 'Something went wrong, while updating branch',
    url: API_URL,
  })

// *****************************
// move upsert to hooks or helpers(chat with cam)
// *****************************
export const upsertBranch = async (id, branch, branchesDispatch) =>
  id
    ? updateBranch(id, branch, branchesDispatch)
    : addBranch(branch, branchesDispatch)

// *****************************
// delete branch
// *****************************
export const deleteBranch = async (id, branchesDispatch) =>
  deleteApi({
    dispatch: branchesDispatch,
    start: branch_actions.deleteBranchStart,
    id,
    success: branch_actions.deleteBranchSuccess,
    successMsg: `Branches with id: ${id} has been deleted.`,
    failure: branch_actions.deleteBranchFailure,
    errorMsg: 'Something went wrong, while deleting branch',
    url: API_URL,
  })
