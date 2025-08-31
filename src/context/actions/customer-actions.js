// action customer
import * as customers from '@/constants/types'

// *****************************
// fetch customers
// *****************************
export const fetchCustomersStart = () => ({
  type: customers.REQUEST_START,
})
export const fetchCustomersSuccess = (data) => ({
  type: customers.FETCH_CUSTOMERS,
  payload: data,
})
export const fetchCustomersFailure = () => ({
  type: customers.REQUEST_FAILURE,
})

// *****************************
// add customer
// *****************************
export const addCustomerStart = () => ({
  type: customers.REQUEST_START,
})
export const addCustomerSuccess = (data) => ({
  type: customers.ADD_CUSTOMER,
  payload: data,
})
export const addCustomerFailure = () => ({
  type: customers.REQUEST_FAILURE,
})

// *****************************
// update customer
// *****************************
export const updateCustomerStart = () => ({
  type: customers.REQUEST_START,
})
export const updateCustomerSuccess = (data) => ({
  type: customers.UPDATE_CUSTOMER,
  payload: data,
})
export const updateCustomerFailure = () => ({
  type: customers.REQUEST_FAILURE,
})

// *****************************
// delete customer
// *****************************
export const deleteCustomerStart = () => ({
  type: customers.REQUEST_START,
})
export const deleteCustomerSuccess = (id) => ({
  type: customers.DELETE_CUSTOMER,
  payload: id,
})
export const deleteCustomerFailure = () => ({
  type: customers.REQUEST_FAILURE,
})
