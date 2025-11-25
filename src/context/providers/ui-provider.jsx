'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '../initial-states/auth-state'
import { onCreate, onDelete, onEdit } from '@/hooks/use-modal'
import { useLiveStore } from '@/config/zustand'
import { fetchData } from '@/lib/fetch'

const UIContext = createContext()

export const UIProvider = ({ children }) => {
  const { current_user } = useAuth()
  
  const [modalOpen, setModalOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [id, setId] = useState(null)
  const [href, setHref] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  const [dashboardState, setDashboardState] = useState({
    value: current_user?.currentUser?.branch_id || '',
    label: current_user?.currentUser?.branch_name || '',
  })

  const handleDashboardState = (value) => {
    setDashboardState(value)
  }

  // reset id + href + selection when modal closes
  useEffect(() => {
    if (modalOpen) return
    setId(null)
    setHref(null)
    setSelectedVehicle(null)
  }, [modalOpen])

  // reset id when alert closes
  useEffect(() => {
    if (alertOpen) return
    setId(null)
  }, [alertOpen])

  return (
    <UIContext.Provider
      value={{
        onCreate: onCreate(setModalOpen, modalOpen, setHref),
        onEdit: (data) => {
          setSelectedVehicle(data)
          return onEdit(setModalOpen, modalOpen, setId)(data)
        },
        onDelete: onDelete(setAlertOpen, alertOpen, setId),
        selectedVehicle,
        setSelectedVehicle,
        dashboardState,
        setDashboardState,
        handleDashboardState,
        useLiveStore,
        fetchData,
        setModalOpen,
        modalOpen,
        alertOpen,
        setAlertOpen,
        id,
        href,
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}