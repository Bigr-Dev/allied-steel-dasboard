'use client'

import { createContext, useContext, useReducer } from 'react'
import { initialUsersState } from '../initial-states/user-state'
import userReducer from '../reducers/user-reducer'
import { deleteUser, upsertUser } from '../apis/user-apis'

const UsersContext = createContext()

export const UsersProvider = ({ children }) => {
  const [users, usersDispatch] = useReducer(
    userReducer,
    initialUsersState
  )

  return (
    <UsersContext.Provider
      value={{
        users,
        usersDispatch,
        upsertUser,
        deleteUser,
      }}
    >
      {children}
    </UsersContext.Provider>
  )
}

export const useUsers = () => {
  const context = useContext(UsersContext)
  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider')
  }
  return context
}