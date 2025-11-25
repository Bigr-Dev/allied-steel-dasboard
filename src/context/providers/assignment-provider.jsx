'use client'

import { createContext, useContext, useReducer, useState } from 'react'
import { initialAssignmentState } from '../initial-states/assignment-state'
import { initialGroupedLoadsState } from '../initial-states/grouped-load-state'
import assignmentReducer from '../reducers/assignment-reducer'
import groupedLoadReducer from '../reducers/grouped_load-reducer'
import {
  addPlan,
  addUnit,
  autoAssignPlan,
  deletePlannedAssignmentById,
} from '../apis/assignment-apis'

const AssignmentContext = createContext()

export const AssignmentProvider = ({ children }) => {
  const [assignment, assignmentDispatch] = useReducer(
    assignmentReducer,
    initialAssignmentState
  )
  
  const [load_assignment, groupedLoadsDispatch] = useReducer(
    groupedLoadReducer,
    initialGroupedLoadsState
  )

  const [assignment_preview, setAssignmentPreview] = useState([])
  const [downloading, setDownloading] = useState(false)

  const fetchAssignmentPreview = async (data) => {
    await addPlan(assignmentDispatch, data)
  }

  const addNewPlan = async (data) => {
    await addPlan(assignmentDispatch, data)
  }

  const runAutoAssign = async (data) => {
    const res = await autoAssignPlan(assignmentDispatch, data)
    setAssignmentPreview(res?.data)
  }

  const addNewUnit = async (data) => {
    const res = await addUnit(assignmentDispatch, data)
    setAssignmentPreview(res)
  }

  const downloadPlan = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/plans/export-load-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment_preview),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `HTTP ${res.status}`)
      }

      const blob = await res.blob()
      const ab = await blob.arrayBuffer()
      const sig = new Uint8Array(ab).slice(0, 2)

      if (!(sig[0] === 0x50 && sig[1] === 0x4b)) {
        const text = new TextDecoder().decode(new Uint8Array(ab).slice(0, 200))
        throw new Error('Server did not return an XLSX.\\nPreview: ' + text)
      }

      const cd = res.headers.get('Content-Disposition') || ''
      const m = cd.match(/filename=\"([^\"]+)\"/i)
      const filename = m?.[1] || 'load-plan.xlsx'

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.log('download error:', error)
      alert(error.message || 'Export failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <AssignmentContext.Provider
      value={{
        assignment,
        assignmentDispatch,
        load_assignment,
        groupedLoadsDispatch,
        assignment_preview,
        setAssignmentPreview,
        fetchAssignmentPreview,
        addNewPlan,
        runAutoAssign,
        addNewUnit,
        deletePlannedAssignmentById,
        downloadPlan,
        downloading,
      }}
    >
      {children}
    </AssignmentContext.Provider>
  )
}

export const useAssignment = () => {
  const context = useContext(AssignmentContext)
  if (!context) {
    throw new Error('useAssignment must be used within an AssignmentProvider')
  }
  return context
}