// client cookies js
import Cookies from 'js-cookie'

// hooks
import { toast } from '@/hooks/use-toast'
import { fetchData } from '@/lib/fetch'

export const loadAPI = async ({
  dispatch,
  start,
  success,
  failure,
  errorMsg,
  data,
}) => {
  dispatch(start())
  if (data) {
    //  console.log('data :>> ', data)
    dispatch(success(data))
  } else {
    dispatch(failure(data))
    toast({
      title: errorMsg ? errorMsg : 'Something went wrong, while fetching data',
      description: 'Unknown error',
      variant: 'destructive',
    })
  }
}

export const fetchApi = async ({
  dispatch,
  start,
  success,
  failure,
  errorMsg,
  url,
}) => {
  dispatch(start())
  try {
    const uid = Cookies.get('uid')
    if (!uid) {
      dispatch(failure({ error: 'invalid user' }))
      return
    }
    const response = await fetchData(url, 'GET')
    //console.log('response from use api :>> ', response)
    // Handle new standardized response format
    const responseData = response
    if (responseData && responseData !== undefined) {
      dispatch(success(responseData))
    } else {
      // Fallback for old format
      dispatch(success(responseData))
    }
  } catch (error) {
    dispatch(failure(error))
    toast({
      title: errorMsg ? errorMsg : 'Something went wrong, while fetching data',
      description:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'Unknown error',
      variant: 'destructive',
    })
  }
}

export const postApi = async ({
  dispatch,
  start,
  data,
  success,
  successMsg,
  failure,
  errorMsg,
  url,
}) => {
  dispatch(start())

  try {
    const uid = Cookies.get('uid')
    if (!uid) {
      dispatch(failure({ error: 'invalid user' }))
      return
    }
    const response = await fetchData(url, 'POST', data)

    // Handle new standardized response format
    const responseData = response
    // if (responseData && responseData !== undefined) {
    //   dispatch(success(responseData))
    // } else {
    //   // Fallback for old format
    //   dispatch(success(responseData))
    // }
    console.log('url :>> ', url)
    toast({
      title: successMsg || 'Operation was successful',
      description: responseData?.message || '',
    })
  } catch (error) {
    dispatch(failure(error))
    toast({
      title: errorMsg ? errorMsg : 'Something went wrong',
      description:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'Unknown error',
      variant: 'destructive',
    })
  }
}

export const putApi = async ({
  dispatch,
  start,
  id,
  data,
  success,
  successMsg,
  failure,
  errorMsg,
  url,
}) => {
  dispatch(start())
  try {
    const uid = Cookies.get('uid')
    if (!uid) {
      dispatch(failure({ error: 'invalid user' }))
      return
    }
    const response = await fetchData(`${url}/${id}`, 'PUT', data)

    // Handle new standardized response format
    const responseData = response
    if (responseData && responseData !== undefined) {
      dispatch(success(responseData))
    } else {
      // Fallback for old format
      dispatch(success(responseData))
    }

    toast({
      title: successMsg || 'Operation was successful',
      description: responseData?.message || '',
    })
  } catch (error) {
    dispatch(failure(error))
    toast({
      title: errorMsg ? errorMsg : 'Something went wrong',
      description:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'Unknown error',
      variant: 'destructive',
    })
  }
}

export const deleteApi = async ({
  dispatch,
  start,
  id,
  success,
  successMsg,
  failure,
  errorMsg,
  url,
}) => {
  //  console.log('url :>> ', `${url}/${id}`)
  dispatch(start())
  try {
    const uid = Cookies.get('uid')
    if (!uid) {
      dispatch(failure({ error: 'invalid user' }))
      return
    }
    const response = await fetchData(`${url}/${id}`, 'DELETE')

    // Handle new standardized response format
    const responseData = response
    // if (responseData && responseData !== undefined) {
    //   dispatch(success(responseData))
    // } else {
    //   // Fallback for old format
    //   dispatch(success(responseData))
    // }

    toast({
      title: successMsg || 'Operation was successful',
      description: responseData?.message || '',
    })
  } catch (error) {
    dispatch(failure(error))
    toast({
      title: errorMsg ? errorMsg : 'Something went wrong',
      description:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'Unknown error',
      variant: 'destructive',
    })
  }
}
