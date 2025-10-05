// action branches
import * as assignment from '@/constants/types'

// *****************************
// fetch auto assignments
// *****************************
export const autoAssignLoadsStart = () => ({
  type: assignment.REQUEST_START,
})

export const autoAssignLoadsSuccess = (data) => ({
  type: assignment.AUTO_ASSIGN_LOADS,
  payload: data,
})

export const autoAssignLoadsFailure = () => ({
  type: assignment.REQUEST_FAILURE,
})

// *****************************
// manually assign loads
// *****************************
export const manualAssignLoadsStart = () => ({
  type: assignment.REQUEST_START,
})

export const manualAssignLoadsSuccess = (data) => ({
  type: assignment.MANUAL_ASSIGN_LOADS,
  payload: data,
})

export const manualAssignLoadsFailure = () => ({
  type: assignment.REQUEST_FAILURE,
})

// *****************************
// unassign load
// *****************************
export const unassignLoadStart = () => ({
  type: assignment.REQUEST_START,
})

export const unassignLoadSuccess = (data) => ({
  type: assignment.UNASSIGN_LOAD,
  payload: data,
})

export const unassignLoadFailure = () => ({
  type: assignment.REQUEST_FAILURE,
})

// *****************************
// unassign all loads
// *****************************
export const unassignAllStart = () => ({
  type: assignment.REQUEST_START,
})

export const unassignAllSuccess = (data) => ({
  type: assignment.UNASSIGN_ALL,
  payload: data,
})

export const unassignAllFailure = () => ({
  type: assignment.REQUEST_FAILURE,
})

// *****************************
// fetch planned assignments
// *****************************
export const fetchPlannedAssignmentsStart = () => ({
  type: assignment.REQUEST_START,
})

export const fetchPlannedAssignmentsSuccess = (data) => ({
  type: assignment.GET_PLANNED_ASSIGNMENTS,
  payload: data,
})

export const fetchPlannedAssignmentsFailure = () => ({
  type: assignment.REQUEST_FAILURE,
})

// *****************************
// fetch planned assignments by id
// *****************************
export const fetchPlannedAssignmentByIdStart = () => ({
  type: assignment.REQUEST_START,
})

export const fetchPlannedAssignmentByIdSuccess = (data) => ({
  type: assignment.GET_PLANNED_ASSIGNMENT_BY_ID,
  payload: data,
})

export const fetchPlannedAssignmentByIdFailure = () => ({
  type: assignment.REQUEST_FAILURE,
})

export const deletePlannedAssignmentByIdStart = () => ({
  type: assignment.REQUEST_START,
})

export const deletePlannedAssignmentByIdSuccess = (id) => ({
  type: assignment.DELETE_PLANNED_ASSIGNMENT_BY_ID,
  payload: id,
})

export const deletePlannedAssignmentByIdFailure = (error) => ({
  type: assignment.REQUEST_FAILURE,
  payload: error,
})
