// actions
import * as assignment_actions from '../actions/assignment-actions'

// api calls
import { fetchApi, loadAPI, postApi } from '@/hooks/use-apis'

// api url
const API_URL = 'assignments'

// *****************************
// load assignments
// *****************************
export const loadAssignments = async (assignmentDispatch, data) =>
  loadAPI({
    dispatch: assignmentDispatch,
    start: assignment_actions.fetchPlannedAssignmentsStart,
    success: assignment_actions.fetchPlannedAssignmentsSuccess,
    failure: assignment_actions.fetchPlannedAssignmentsFailure,
    errorMsg: 'Something went wrong, while fetching planned assignments',
    data,
  })

// *****************************
// auto assign loads
// *****************************
export const autoAssignLoads = async (assignmentDispatch, data) =>
  postApi({
    dispatch: assignmentDispatch,
    url: `${API_URL}/auto-assign`,
    data,
    onStart: assignment_actions.autoAssignLoadsStart,
    onSuccess: assignment_actions.autoAssignLoadsSuccess,
    onFailure: assignment_actions.autoAssignLoadsFailure,
  })

// *****************************
// manually assign loads
// *****************************
export const manualAssignLoads = async (assignmentDispatch, data) =>
  postApi({
    dispatch: assignmentDispatch,
    url: `${API_URL}/manual-assign`,
    data,
    onStart: assignment_actions.manualAssignLoadsStart,
    onSuccess: assignment_actions.manualAssignLoadsSuccess,
    onFailure: assignment_actions.manualAssignLoadsFailure,
  })

// *****************************
// unassign load
// *****************************
export const unassignLoad = async (assignmentDispatch, data) =>
  postApi({
    dispatch: assignmentDispatch,
    onStart: assignment_actions.unassignLoadStart,
    onSuccess: assignment_actions.unassignLoadSuccess,
    onFailure: assignment_actions.unassignLoadFailure,
    errorMsg: 'Something went wrong, while unassigning load',
    url: `${API_URL}/unassign`,
    data,
  })

// *****************************
// unassign all loads
// *****************************
export const unassignAllLoads = async (assignmentDispatch, data) =>
  postApi({
    dispatch: assignmentDispatch,
    onStart: assignment_actions.unassignAllStart,
    onSuccess: assignment_actions.unassignAllSuccess,
    onFailure: assignment_actions.unassignAllFailure,
    errorMsg: 'Something went wrong, while unassigning all loads',
    url: `${API_URL}/unassign-all`,
    data,
  })

// *****************************
// get planned assignments
// *****************************
export const fetchPlannedAssignments = async (assignmentDispatch) =>
  fetchApi({
    dispatch: assignmentDispatch,
    onStart: assignment_actions.fetchPlannedAssignmentsStart,
    onSuccess: assignment_actions.fetchPlannedAssignmentsSuccess,
    onFailure: assignment_actions.fetchPlannedAssignmentsFailure,
    errorMsg: 'Something went wrong, while fetching planned assignments',
    url: `${API_URL}/planned`,
  })

// *****************************
// get planned assignments by id
// *****************************
export const fetchPlannedAssignmentById = async (assignmentDispatch, id) =>
  fetchApi({
    dispatch: assignmentDispatch,
    onStart: assignment_actions.fetchPlannedAssignmentByIdStart,
    onSuccess: assignment_actions.fetchPlannedAssignmentByIdSuccess,
    onFailure: assignment_actions.fetchPlannedAssignmentByIdFailure,
    errorMsg: 'Something went wrong, while fetching planned assignment',
    url: `${API_URL}/planned/${id}`,
  })
