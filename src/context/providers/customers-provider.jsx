'use client'

import { createContext, useContext, useReducer } from 'react'
import { initialCustomerState } from '../initial-states/customer-state'
import customerReducer from '../reducers/customer-reducer'
import { deleteCustomer, upsertCustomer } from '../apis/customer-apis'

const CustomersContext = createContext()

export const CustomersProvider = ({ children }) => {
  const [customers, customersDispatch] = useReducer(
    customerReducer,
    initialCustomerState
  )

  return (
    <CustomersContext.Provider
      value={{
        customers,
        customersDispatch,
        upsertCustomer,
        deleteCustomer,
      }}
    >
      {children}
    </CustomersContext.Provider>
  )
}

export const useCustomers = () => {
  const context = useContext(CustomersContext)
  if (!context) {
    throw new Error('useCustomers must be used within a CustomersProvider')
  }
  return context
}