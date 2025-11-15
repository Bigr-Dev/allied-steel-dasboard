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
        data: {
          ...state.data,
          plans: state.data.plans,
          // plans: Array.isArray(state.data.plans)
          // ? [...state.data.plans, action.payload]
          // : [action.payload],
          ...action.payload,
        },
        loading: false,
      }
    case assignment.ADD_PLAN:
      return {
        ...state,
        data: {
          ...state.data,
          plans: Array.isArray(state.data.plans)
            ? [...state.data.plans, action.payload]
            : [action.payload],
        },
        loading: false,
      }
    case assignment.ADD_UNIT:
      return {
        ...state,
        data: {
          ...state.data,
          plans: Array.isArray(state.data.plans)
            ? [...state.data.plans, action.payload.plan]
            : [action.payload.plan],
        },
        loading: false,
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
        data: { ...state.data, ...action.payload },
        loading: false,
      }
    case assignment.GET_PLANNED_ASSIGNMENTS:
      return {
        ...state,
        data: { ...state.data, ...action.payload },
        loading: false,
      }
    case assignment.GET_PLANNED_ASSIGNMENT_BY_ID:
      return {
        ...state,
        data: action.payload,
        loading: false,
      }
    case assignment.DELETE_PLANNED_ASSIGNMENT_BY_ID:
      // return {
      //   ...state,
      //   data: Array.isArray(state.data.plans)
      //     ? state.data.filter((item) => item.id !== action.payload)
      //     : [],

      //   loading: false,
      // }
      const id =
        typeof action.payload === 'string'
          ? action.payload
          : action.payload?.plan_id
          ? action.payload?.id
          : action.payload
      console.log('id :>> ', id)
      const previous = Array.isArray(state?.data?.plans) ? state.data.plans : []
      const new_state = previous.filter((p) => String(p.id) !== String(id))

      return {
        ...state,
        data: { ...state.data, plans: new_state },
        loading: false,
      }

    default:
      return state
  }
}
export default assignmentReducer
