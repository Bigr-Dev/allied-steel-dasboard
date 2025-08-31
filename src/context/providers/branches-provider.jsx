'use client'

import AlertScreen from '@/components/layout/alert-screen'
import DialogScreen from '@/components/layout/dialog-screen'
import { GlobalContext, initialState } from './global-context'
import { use, useEffect, useReducer, useState } from 'react'
import branchReducer from './reducers/branch-reducer'
import { fetchData } from '@/lib/fetch'
import { fetchBranches, loadBranches } from './apis/branch-apis'

import { useAuth } from './initial-states/auth-state'

const GlobalProvider = ({ children, data }) => {
  //  console.log('data :>> ', data)
  const { current_user, currentUserDispatch } = useAuth()
  const [branches, branchesDispatch] = useReducer(
    branchReducer,
    initialState.initialBranchesState
  )

  // fetch branches
  useEffect(() => {
    if (data) {
      loadBranches(branchesDispatch, data?.branches)
    }
  }, [data])

  useEffect(() => {
    if (branches?.data?.length > 0 && current_user) {
      const user = current_user?.currentUser?.branch_id
      setDashboardState({
        value: user,
        label: branches?.data?.find((b) => b.id == user)?.name || 'All',
      })
    }
  }, [branches, current_user])

  return (
    <GlobalContext.Provider
      value={{
        branches,
        branchesDispatch,
      }}
    >
      {children}
    </GlobalContext.Provider>
  )
}
export default GlobalProvider
