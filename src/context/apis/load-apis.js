// actions
import * as load_actions from '../actions/load-actions'

// client cookies js
import Cookies from 'js-cookie'

// hooks
import { toast } from '@/hooks/use-toast'
import { fetchApi, loadAPI } from '@/hooks/use-apis'

// api url
const API_URL = 'loads'

// *****************************
// load loads data
// *****************************
export const loadLoads = async (loadsDispatch, data) =>
  loadAPI({
    dispatch: loadsDispatch,
    start: load_actions.fetchLoadsStart,
    success: load_actions.fetchLoadsSuccess,
    failure: load_actions.fetchLoadsFailure,
    errorMsg: 'Something went wrong, while fetching loads',
    data: data,
  })

// *****************************
// fetch loads
// *****************************
export const fetchLoads = async (loadsDispatch) => {
  fetchApi({
    dispatch: loadsDispatch,
    start: load_actions.fetchLoadsStart,
    success: load_actions.fetchLoadsSuccess,
    failure: load_actions.fetchLoadsFailure,
    errorMsg: 'Something went wrong, while fetching loads',
    url: API_URL,
  })
}

// *****************************
// upload loads
// *****************************
// export const uploadLoads = async (file, loadsDispatch) => {
//   loadsDispatch(load_actions.uploadLoadsStart())

// *****************************
// add load
// *****************************
export const addLoad = async (load, loadsDispatch) => {
  loadsDispatch(load_actions.addLoadStart())
  try {
    const token = Cookies.get('firebaseIdToken')
    if (!token) {
      loadsDispatch(load_actions.addLoadFailure({ error: 'invalid user' }))
      return
    }
    const response = await axios.post(`${API_URL}`, load, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // Handle new standardized response format
    const responseData = response.data
    if (responseData.success && responseData.data !== undefined) {
      loadsDispatch(load_actions.addLoadSuccess(responseData.data))
    } else {
      // Fallback for old format
      loadsDispatch(load_actions.addLoadSuccess(responseData))
    }

    toast({
      title: 'Load added successfully',
      description: responseData?.message || 'Load has been added.',
    })
  } catch (error) {
    loadsDispatch(load_actions.addLoadFailure(error))
    toast({
      title: 'Something went wrong, while adding load',
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
// update load
// *****************************
export const updateLoad = async (id, load, loadsDispatch) => {
  loadsDispatch(load_actions.updateLoadStart())
  try {
    const token = Cookies.get('firebaseIdToken')
    if (!token) {
      loadsDispatch(load_actions.updateLoadFailure({ error: 'invalid user' }))
      return
    }
    const response = await axios.put(`${API_URL}/${id}`, load, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // Handle new standardized response format
    const responseData = response.data
    if (responseData.success && responseData.data !== undefined) {
      loadsDispatch(load_actions.updateLoadSuccess(responseData.data))
    } else {
      // Fallback for old format
      loadsDispatch(load_actions.updateLoadSuccess(responseData))
    }

    toast({
      title: 'Load updated successfully',
      description: responseData?.message || 'Load has been updated.',
    })
  } catch (error) {
    loadsDispatch(load_actions.updateLoadFailure(error))
    toast({
      title: 'Something went wrong, while updating load',
      description:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'Unknown error',
      variant: 'destructive',
    })
  }
}

export const upsertLoad = async (id, load, loadsDispatch) =>
  id ? updateLoad(id, load, loadsDispatch) : addLoad(load, loadsDispatch)

// *****************************
// delete load
// *****************************
export const deleteLoad = async (id, loadsDispatch) => {
  loadsDispatch(load_actions.deleteLoadStart())
  try {
    const token = Cookies.get('firebaseIdToken')
    if (!token) {
      loadsDispatch(load_actions.deleteLoadFailure({ error: 'invalid user' }))
      return
    }
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // Handle new standardized response format
    const responseData = response.data
    if (responseData.success && responseData.data !== undefined) {
      loadsDispatch(load_actions.deleteLoadSuccess(responseData.data))
    } else {
      // Fallback for old format
      loadsDispatch(load_actions.deleteLoadSuccess(responseData))
    }

    toast({
      title: 'Load removed successfully',
      description: responseData?.message || 'Load has been deleted.',
    })
  } catch (error) {
    loadsDispatch(load_actions.deleteLoadFailure(error))
    toast({
      title: 'Something went wrong, while removing load',
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
// update load status
// *****************************
export const updateLoadStatus = async (id, status, loadsDispatch) => {
  loadsDispatch(load_actions.updateLoadStatusStart())
  try {
    const token = Cookies.get('firebaseIdToken')
    const response = await axios.put(
      `${API_URL}/${id}/status`,
      {
        status,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    // Handle new standardized response format
    const responseData = response.data
    if (responseData.success && responseData.data !== undefined) {
      loadsDispatch(load_actions.updateLoadStatusSuccess(responseData.data))
    } else {
      // Fallback for old format
      loadsDispatch(load_actions.updateLoadStatusSuccess(responseData))
    }
  } catch (error) {
    console.error(`Error updating status for load ${id}:`, error)
    loadsDispatch(load_actions.updateLoadStatusFailure(error))
  }
}

// *****************************
// add load waypoint
// *****************************
export const addLoadWaypoint = async (loadId, waypoint, loadsDispatch) => {
  loadsDispatch(load_actions.addLoadWaypointStart())
  try {
    const token = Cookies.get('firebaseIdToken')
    const response = await axios.post(
      `${API_URL}/${loadId}/waypoints`,
      waypoint,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    // Handle new standardized response format
    const responseData = response.data
    if (responseData.success && responseData.data !== undefined) {
      loadsDispatch(load_actions.addLoadWaypointSuccess(responseData.data))
    } else {
      // Fallback for old format
      loadsDispatch(load_actions.addLoadWaypointSuccess(responseData))
    }
  } catch (error) {
    console.error(`Error adding waypoint for load ${loadId}:`, error)
    loadsDispatch(load_actions.addLoadWaypointFailure(error))
  }
}

// *****************************
// add load update
// *****************************
export const addLoadUpdate = async (loadId, update, loadsDispatch) => {
  loadsDispatch(load_actions.addLoadUpdateStart())
  try {
    const token = Cookies.get('firebaseIdToken')
    const response = await axios.post(`${API_URL}/${loadId}/updates`, update, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // Handle new standardized response format
    const responseData = response.data
    if (responseData.success && responseData.data !== undefined) {
      loadsDispatch(load_actions.addLoadUpdateSuccess(responseData.data))
    } else {
      // Fallback for old format
      loadsDispatch(load_actions.addLoadUpdateSuccess(responseData))
    }
  } catch (error) {
    console.error(`Error adding update for load ${loadId}:`, error)
    loadsDispatch(load_actions.addLoadUpdateFailure(error))
  }
}

// *****************************
// add load expense
// *****************************
export const addLoadExpense = async (loadId, expense, loadsDispatch) => {
  loadsDispatch(load_actions.addLoadExpenseStart())
  try {
    const token = Cookies.get('firebaseIdToken')
    const response = await axios.post(
      `${API_URL}/${loadId}/expenses`,
      expense,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    // Handle new standardized response format
    const responseData = response.data
    if (responseData.success && responseData.data !== undefined) {
      loadsDispatch(load_actions.addLoadExpenseSuccess(responseData.data))
    } else {
      // Fallback for old format
      loadsDispatch(load_actions.addLoadExpenseSuccess(responseData))
    }
  } catch (error) {
    console.error(`Error adding expense for load ${loadId}:`, error)
    loadsDispatch(load_actions.addLoadExpenseFailure(error))
  }
}
