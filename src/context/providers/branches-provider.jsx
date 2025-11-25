'use client'

import { createContext, useContext, useReducer } from 'react'
import { initialBranchesState } from '../initial-states/branch-state'
import branchReducer from '../reducers/branch-reducer'
import { deleteBranch, upsertBranch } from '../apis/branch-apis'

const BranchesContext = createContext()

export const BranchesProvider = ({ children }) => {
  const [branches, branchesDispatch] = useReducer(
    branchReducer,
    initialBranchesState
  )

  return (
    <BranchesContext.Provider
      value={{
        branches,
        branchesDispatch,
        upsertBranch,
        deleteBranch,
      }}
    >
      {children}
    </BranchesContext.Provider>
  )
}

export const useBranches = () => {
  const context = useContext(BranchesContext)
  if (!context) {
    throw new Error('useBranches must be used within a BranchesProvider')
  }
  return context
}