// actions
import { fetchData } from '@/lib/fetch'
import * as assignment_actions from '../actions/assignment-actions'

// api calls
import { deleteApi, fetchApi, loadAPI, postApi } from '@/hooks/use-apis'
import Cookies from 'js-cookie'
import { toast } from '@/hooks/use-toast'

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
// export const addPlan = async (assignmentDispatch, data) =>
//   postApi({
//     dispatch: assignmentDispatch,
//     start: assignment_actions.addPlanStart,
//     success: assignment_actions.addPlanSuccess,
//     successMsg: data?.plan_name
//       ? `${data?.plan_name} was
//     successfully added`
//       : 'Assignment plan was successfully added',
//     failure: assignment_actions.addPlanFailure,
//     errorMsg: `Something went wrong, while adding ${
//       data?.notes || 'the assignment plan'
//     }`,
//     url: `/plans/add-plan`,
//     data,
//   })

export const addPlan = async (assignmentDispatch, data) => {
  assignmentDispatch(assignment_actions.addPlanStart())

  try {
    const uid = Cookies.get('uid')
    // console.log('uid :>> ', uid)
    if (!uid) {
      console.log('invalid user :>> ')
      assignmentDispatch(
        assignment_actions.addPlanFailure({ error: 'invalid user' })
      )
      return
    }

    const response = await fetchData(`plans/add-plan`, 'POST', data)
    console.log('response :>> ', response)
    assignmentDispatch(assignment_actions.addPlanSuccess(response))
    toast({
      title: data?.plan_name
        ? `${data?.plan_name} was successfully added`
        : 'Assignment plan was successfully added',
      // description: `Something went wrong, while adding ${
      //   data?.notes || 'the assignment plan'
      // }`,
    })
  } catch (error) {
    assignmentDispatch(assignment_actions.addPlanFailure(error))
    toast({
      title: 'Something went wrong, while adding the assignment plan',
      description:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'Unknown error',
      variant: 'destructive',
    })
  }
}

export const addUnit = async (assignmentDispatch, data) => {
  assignmentDispatch(assignment_actions.addUnitStart())

  try {
    const uid = Cookies.get('uid')
    // console.log('uid :>> ', uid)
    if (!uid) {
      console.log('invalid user :>> ')
      assignmentDispatch(
        assignment_actions.addPlanFailure({ error: 'invalid user' })
      )
      return
    }

    const response = await fetchData(`plans/${data?.planId}/units/add-unit`, 'POST', data)
    console.log('response :>> ', response)
    // assignmentDispatch(assignment_actions.addPlanSuccess(response))
    toast({
      title: `Vehicle was successfully added`

      // description: `Something went wrong, while adding ${
      //   data?.notes || 'the assignment plan'
      // }`,
    })
    return data;
  } catch (error) {
    assignmentDispatch(assignment_actions.addPlanFailure(error))
    toast({
      title: 'Something went wrong, while adding the assignment plan',
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
// auto assign loads
// *****************************
export const autoAssignPlan = async (assignmentDispatch, data) => {
  assignmentDispatch(assignment_actions.autoAssignLoadsStart())
  try {
    const uid = Cookies.get('uid')
    // console.log('uid :>> ', uid)
    if (!uid) {
      console.log('invalid user :>> ')
      assignmentDispatch(
        assignment_actions.autoAssignLoadsFailure({ error: 'invalid user' })
      )
      return
    }

    const response = await fetchData(`plans/auto-assign`, 'POST', data)
    // console.log('response :>> ', response)

    if (response.id) {
      try {
        const plan = await fetchData(`plans/${response.id}`, 'GET')
        console.log('plan :>> ', plan)
        assignmentDispatch(assignment_actions.autoAssignLoadsSuccess(plan))
        toast({
          title: 'Assignment plan was successfully added',
          // description: `Something went wrong, while adding ${
          //   data?.notes || 'the assignment plan'
          // }`,
        })
        return plan
      } catch (error) {
        assignmentDispatch(assignment_actions.autoAssignLoadsFailure(error))
        toast({
          title: 'Something went wrong, while fetching the assignment plan',
          description:
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error.message ||
            'Unknown error',
          variant: 'destructive',
        })
      }
    }
  } catch (error) {
    assignmentDispatch(assignment_actions.autoAssignLoadsFailure(error))
    toast({
      title: 'Something went wrong, while fetching the assignment plan',
      description:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'Unknown error',
      variant: 'destructive',
    })
  }
}

// export const autoAssignPlan = async (assignmentDispatch, data) => {
//   const res = await postApi({
//     dispatch: assignmentDispatch,
//     start: assignment_actions.autoAssignLoadsStart,
//     success: assignment_actions.autoAssignLoadsSuccess,
//     successMsg: 'success',
//     failure: assignment_actions.autoAssignLoadsFailure,
//     errorMsg: 'Something went wrong, while fetching the assignment plan',
//     url: `/plans/auto-assign`,
//     data,
//   })
//   return res
// }

export const autoAssignLoads = async (assignmentDispatch, data) =>
  postApi({
    dispatch: assignmentDispatch,
    start: assignment_actions.autoAssignLoadsStart,
    success: assignment_actions.addPlanSuccess,
    successMsg: 'success',
    failure: assignment_actions.autoAssignLoadsFailure,
    errorMsg: 'Something went wrong, while fetching the assignment plan',
    url: `/plans/auto-assign`,
    data,
  })

//   {
//   //assignmentDispatch(assignment_actions.autoAssignLoadsStart())
//   try {
//     const r = await fetchData(`plans`, 'POST', data)
//     //(assignment_actions.autoAssignLoadsSuccess(r))
//     // console.log('r :>> ', r)
//     return r
//   } catch (error) {
//     console.log('error :>> ', error)
//     // assignmentDispatch(assignment_actions.autoAssignLoadsFailure(error))
//   }
// }
// export
// postApi({
//   dispatch: assignmentDispatch,
//   Start: assignment_actions.autoAssignLoadsStart,
//   Success: assignment_actions.autoAssignLoadsSuccess,
//   successMsg: 'success',
//   Failure: assignment_actions.autoAssignLoadsFailure,
//   errorMsg: 'Something went wrong, while fetching the assignment preview',
//   url: `plans`,
//   data: data,
// })

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

// *****************************
// delete driver
// *****************************
export const deletePlannedAssignmentById = async (id, assignmentDispatch) =>
  deleteApi({
    dispatch: assignmentDispatch,
    start: assignment_actions.deletePlannedAssignmentByIdStart,
    id,
    success: assignment_actions.deletePlannedAssignmentByIdSuccess,
    successMsg: `plan with id: ${id} has been deleted.`,
    failure: assignment_actions.deletePlannedAssignmentByIdFailure,
    errorMsg: 'Something went wrong, while deleting plan',
    url: `plans`,
  })
