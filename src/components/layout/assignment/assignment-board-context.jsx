'use client'

import { createContext, useContext, useReducer } from 'react'
import { assignmentBoardReducer, initialAssignmentBoardState, ASSIGNMENT_ACTIONS } from './assignment-board-reducer'
import { useToast } from '@/hooks/use-toast'
import { assignmentAPI, handleAPIError } from '@/lib/api-client'
import { useGlobalContext } from '@/context/global-context'

const AssignmentBoardContext = createContext()

export const AssignmentBoardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(assignmentBoardReducer, initialAssignmentBoardState)
  const { toast } = useToast()
  const { fetchData } = useGlobalContext()

  const loadAssignmentData = async () => {
    dispatch({ type: ASSIGNMENT_ACTIONS.SET_LOADING, payload: true })
    try {
      const body = { departure_date: '2025-09-30', commit: false }
      const data = await fetchData('vehicle-assignment', 'POST', body)
      dispatch({ type: ASSIGNMENT_ACTIONS.LOAD_DATA_SUCCESS, payload: data })
    } catch (error) {
      dispatch({ type: ASSIGNMENT_ACTIONS.LOAD_DATA_ERROR, payload: error.message })
      handleAPIError(error, toast)
    }
  }

  const handlePreviewPlan = async () => {
    try {
      const data = await assignmentAPI.getAssignments({ preview: true })
      dispatch({ type: ASSIGNMENT_ACTIONS.LOAD_DATA_SUCCESS, payload: data })
      toast({
        title: 'Plan Updated',
        description: 'Preview plan refreshed successfully',
      })
    } catch (error) {
      handleAPIError(error, toast)
    }
  }

  const moveOrder = async (movePayload) => {
    // Optimistic update
    dispatch({ type: ASSIGNMENT_ACTIONS.MOVE_ORDER, payload: movePayload })
    dispatch({ type: ASSIGNMENT_ACTIONS.ADD_CHANGE, payload: movePayload })

    try {
      const data = await assignmentAPI.moveItem(movePayload)
      dispatch({ type: ASSIGNMENT_ACTIONS.MOVE_ORDER_SUCCESS, payload: data })
      
      toast({
        title: 'Item Moved',
        description: 'Assignment updated successfully',
      })
    } catch (error) {
      dispatch({ type: ASSIGNMENT_ACTIONS.MOVE_ORDER_ERROR, payload: error.message })
      handleAPIError(error, toast)
    }
  }

  const undoLastChange = () => {
    if (state.undoStack.length === 0) return
    
    dispatch({ type: ASSIGNMENT_ACTIONS.UNDO_LAST_CHANGE })
    toast({
      title: 'Undone',
      description: 'Last action has been undone',
    })
  }

  const commitPlan = async () => {
    if (state.changes.length === 0) {
      toast({
        title: 'No Changes',
        description: 'No changes to commit',
      })
      return
    }

    try {
      await assignmentAPI.commitPlan(state.changes)
      dispatch({ type: ASSIGNMENT_ACTIONS.CLEAR_CHANGES })
      
      toast({
        title: 'Plan Committed',
        description: `${state.changes.length} changes have been saved`,
      })
    } catch (error) {
      handleAPIError(error, toast)
    }
  }

  const setActiveItem = (item) => {
    dispatch({ type: ASSIGNMENT_ACTIONS.SET_ACTIVE_ITEM, payload: item })
  }

  const value = {
    ...state,
    loadAssignmentData,
    handlePreviewPlan,
    moveOrder,
    undoLastChange,
    commitPlan,
    setActiveItem,
  }

  return (
    <AssignmentBoardContext.Provider value={value}>
      {children}
    </AssignmentBoardContext.Provider>
  )
}

export const useAssignmentBoard = () => {
  const context = useContext(AssignmentBoardContext)
  if (!context) {
    throw new Error('useAssignmentBoard must be used within AssignmentBoardProvider')
  }
  return context
}