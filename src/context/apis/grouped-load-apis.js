// actions
import * as grouped_load_actions from '../actions/grouped-load-actions'

// hooks
import { deleteApi, fetchApi, loadAPI, postApi, putApi } from '@/hooks/use-apis'

// api url
const API_URL = 'loads'

// *****************************
// load load data
// *****************************
export const loadGroupedLoads = async (groupedLoadsDispatch, data) =>
  loadAPI({
    dispatch: groupedLoadsDispatch,
    start: grouped_load_actions.fetchGroupedLoadsStart,
    success: grouped_load_actions.fetchGroupedLoadsSuccess,
    failure: grouped_load_actions.fetchGroupedLoadsFailure,
    errorMsg: 'Something went wrong, while fetching grouped loads',
    data: data,
  })

// *****************************
// fetch load
// *****************************
export const fetchGroupedLoads = async (groupedLoadsDispatch) =>
  fetchApi({
    dispatch: groupedLoadsDispatch,
    start: grouped_load_actions.fetchGroupedLoadsStart,
    success: grouped_load_actions.fetchGroupedLoadsSuccess,
    failure: grouped_load_actions.fetchGroupedLoadsFailure,
    errorMsg: 'Something went wrong, while fetching grouped loads',
    url: API_URL,
  })
