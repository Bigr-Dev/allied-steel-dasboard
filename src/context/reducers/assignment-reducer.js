import * as assignment from '@/constants/types'

const assignmentReducer = (state, action) => {
  switch (action.type) {
    case assignment.REQUEST_START:
      return {
        ...state,
        loading: true,
      }
    case assignment.REQUEST_FAILURE:
      return {
        ...state,
        loading: false,
      }
    case assignment.AUTO_ASSIGN_LOADS:
      return {
        ...state,
        loading: false,
        data: action?.payload || {
          assigned_units: action?.payload?.assigned_units || [],
          unassigned: action?.payload?.unassigned || [],
          plan: action?.payload?.plan || {},
        },
      }
    case assignment.MANUAL_ASSIGN_LOADS:
      return {
        ...state,
        loading: false,
        // data: action?.payload || {},
      }
    case assignment.UNASSIGN_LOAD:
      return {
        ...state,
        loading: false,
        // data: action.payload,
      }
    case assignment.UNASSIGN_ALL:
      return {
        ...state,
        loading: false,
        data: { ...state.data, ...action.payload },
      }
    case assignment.GET_PLANNED_ASSIGNMENTS:
      return {
        ...state,
        loading: false,
        data: { ...state.data, ...action.payload },
      }
    case assignment.GET_PLANNED_ASSIGNMENT_BY_ID:
      return {
        ...state,
        loading: false,
        data: action.payload,
      }
    case assignment.DELETE_PLANNED_ASSIGNMENT_BY_ID:
      // console.log('state.plans :>> ', state.plans)
      // console.log('action.payload :>> ', action.payload)
      return {
        ...state,
        plans: Array.isArray(state.plans)
          ? state.plans.filter((item) => item.id !== action.payload)
          : [],
        // currentDriver:
        //   state.currentDriver?.id === action.payload
        //     ? null
        //     : state.currentDriver,
        loading: false,
      }

    default:
      return state
  }
}
export default assignmentReducer
