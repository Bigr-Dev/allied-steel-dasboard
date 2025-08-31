// actions
import * as customer_actions from '../actions/customer-actions'

// hooks
import { deleteApi, fetchApi, loadAPI, postApi, putApi } from '@/hooks/use-apis'

// api url
const API_URL = 'customers'

// *****************************
// load customers data
// *****************************
export const loadCustomers = async (customersDispatch, data) =>
  loadAPI({
    dispatch: customersDispatch,
    start: customer_actions.fetchCustomersStart,
    success: customer_actions.fetchCustomersSuccess,
    failure: customer_actions.fetchCustomersFailure,
    errorMsg: 'Something went wrong, while fetching customers',
    data: data,
  })

// *****************************
// fetch customer
// *****************************
export const fetchCustomers = async (customersDispatch) =>
  fetchApi({
    dispatch: customersDispatch,
    start: customer_actions.fetchCustomersStart,
    success: customer_actions.fetchCustomersSuccess,
    failure: customer_actions.fetchCustomersFailure,
    url: API_URL,
    errorMsg: 'Something went wrong, while fetching customers',
  })

const addCustomer = async (customer, customersDispatch) =>
  postApi({
    dispatch: customersDispatch,
    start: customer_actions.addCustomerStart,
    data: customer,
    success: customer_actions.addCustomerSuccess,
    successMsg: `New customer, with name: ${customer.name} has been created.`,
    failure: customer_actions.addCustomerFailure,
    errorMsg: 'Something went wrong, while adding customer',
    url: API_URL,
  })

// *****************************
// update customer
// *****************************
const updateCustomer = async (id, customer, customersDispatch) =>
  putApi({
    dispatch: customersDispatch,
    start: customer_actions.updateCustomerStart,
    id,
    data: customer,
    success: customer_actions.updateCustomerSuccess,
    successMsg: `${customer.name} with id: ${id} has been updated.`,
    failure: customer_actions.updateCustomerFailure,
    errorMsg: 'Something went wrong, while updating customer',
    url: API_URL,
  })

// *****************************
// move upsert to hooks or helpers(chat with cam)
// *****************************
export const upsertCustomer = async (id, customers, customersDispatch) =>
  id
    ? updateCustomer(id, customers, customersDispatch)
    : addCustomer(customers, customersDispatch)

// *****************************
// delete customer
// *****************************
export const deleteCustomer = async (id, customersDispatch) =>
  deleteApi({
    dispatch: customersDispatch,
    start: customer_actions.deleteCustomerStart,
    id,
    success: customer_actions.deleteCustomerSuccess,
    successMsg: `Customer with id: ${id} has been deleted.`,
    failure: customer_actions.deleteCustomerFailure,
    errorMsg: 'Something went wrong, while deleting customer',
    url: API_URL,
  })
