'use client'

import AlertScreen from '@/components/layout/alert-screen'
import DialogScreen from '@/components/layout/dialog-screen'
import { GlobalContext, initialState } from './global-context'
import { use, useEffect, useReducer, useState } from 'react'
import branchReducer from './reducers/branch-reducer'
import { fetchData } from '@/lib/fetch'
import { fetchBranches, loadBranches } from './apis/branch-apis'
import customerReducer from './reducers/customer-reducer'
import { fetchCustomers, loadCustomers } from './apis/customer-apis'
import userReducer from './reducers/user-reducer'
import { fetchUsers, loadUsers } from './apis/user-apis'
import loadReducer from './reducers/load-reducer'
import { fetchLoads, loadLoads } from './apis/load-apis'
import orderReducer from './reducers/order-reducer'
import { fetchOrders, loadOrders } from './apis/order-apis'
import vehicleReducer from './reducers/vehicle-apis'
import { fetchVehicles, loadVehicles } from './apis/vehicle-apis'
import driverReducer from './reducers/driver-reducer'
import { fetchDrivers, loadDrivers } from './apis/driver-apis'
import { useAuth } from './initial-states/auth-state'
import { onCreate, onDelete, onEdit } from '@/hooks/use-modal'
import routeReducer from './reducers/route-reducers'
import { loadRoutes } from './apis/route-apis'
import groupedLoadReducer from './reducers/grouped_load-reducer'
import { loadGroupedLoads } from './apis/grouped-load-apis'

const GlobalProvider = ({ children, data }) => {
  //  console.log('data :>> ', data)
  const { current_user, currentUserDispatch } = useAuth()
  const [branches, branchesDispatch] = useReducer(
    branchReducer,
    initialState.initialBranchesState
  )
  const [customers, customersDispatch] = useReducer(
    customerReducer,
    initialState.initialCustomerState
  )
  const [users, usersDispatch] = useReducer(
    userReducer,
    initialState.initialUsersState
  )
  const [loads, loadsDispatch] = useReducer(
    loadReducer,
    initialState.initialLoadsState
  )
  const [load_assignment, groupedLoadsDispatch] = useReducer(
    groupedLoadReducer,
    initialState.initialGroupedLoadsState
  )
  const [orders, ordersDispatch] = useReducer(
    orderReducer,
    initialState.initialOrderState
  )
  const [vehicles, vehiclesDispatch] = useReducer(
    vehicleReducer,
    initialState.initialVehiclesState
  )
  const [drivers, driversDispatch] = useReducer(
    driverReducer,
    initialState.initialDriversState
  )
  const [routes, routesDispatch] = useReducer(
    routeReducer,
    initialState.initialRoutesState
  )

  const [dashboardRoutes, setDashboardRoutes] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [id, setId] = useState(null)
  const [href, setHref] = useState(null)
  const [dashboardState, setDashboardState] = useState({
    value: current_user?.currentUser?.branch_id || '',
    label: current_user?.currentUser?.branch_name || '',
  })

  useEffect(() => {
    if (data) {
      if (!current_user?.currentUser?.id) return
      loadBranches(branchesDispatch, data?.branches)
      loadCustomers(customersDispatch, data?.customers)
      loadOrders(ordersDispatch, data?.orders)
      // loadRoutes(routesDispatch, data?.routes)
    }
  }, [data, current_user])

  useEffect(() => {
    if (branches?.data?.length > 0 && current_user) {
      const user = current_user?.currentUser?.branch_id
      setDashboardState({
        value: user,
        label: branches?.data?.find((b) => b.id == user)?.name || 'All',
      })
    }
  }, [branches, current_user, currentUserDispatch])

  // Handle select change for dashboard state
  const handleDashboardState = (value) => {
    setDashboardState(value)
  }
  useEffect(() => {
    if (!modalOpen) {
      setId(null)
      setHref(null)
    }
  }, [modalOpen])

  useEffect(() => {
    if (!alertOpen) {
      setId(null)
    }
  }, [alertOpen])

  useEffect(() => {
    if (data) {
      if (!current_user?.currentUser?.id) return

      if (data?.users) {
        loadUsers(
          usersDispatch,
          data?.users?.filter((u) => u.branch_id === dashboardState.value)
        )
      }

      if (data?.loads) {
        loadLoads(
          loadsDispatch,
          data?.loads?.filter((l) => l.branch_id === dashboardState.value)
        )
      }

      if (data?.vehicles) {
        loadVehicles(
          vehiclesDispatch,
          data?.vehicles?.filter((v) => v.branch_id === dashboardState.value)
        )
      }

      if (data?.drivers) {
        loadDrivers(
          driversDispatch,
          data?.drivers?.filter((d) => d.branch_id === dashboardState.value)
        )
      }

      if (data?.routes) {
        loadRoutes(
          routesDispatch,
          data?.routes?.filter((d) => d.branch_id === dashboardState.value)
        )
      }
    }
    if (data?.assigned_loads && data?.assigned_vehicles) {
      const assigned_loads_data = Object.entries(data?.assigned_loads).map(
        ([id, data]) => ({
          id,
          data,
        })
      )

      const assigned_loads = assigned_loads_data
        ?.map((l) => l.data)
        .filter((l) => l.branch_id === dashboardState.value)

      const assigned_vehicles = data?.assigned_vehicles

      loadGroupedLoads(groupedLoadsDispatch, [
        assigned_loads,
        assigned_vehicles,
      ])
    }
  }, [current_user, dashboardState])

  //console.log('load_assignment :>> ', load_assignment)
  return (
    <GlobalContext.Provider
      value={{
        onCreate: onCreate(setModalOpen, modalOpen, setHref),
        onEdit: onEdit(setModalOpen, modalOpen, setId),
        onDelete: onDelete(setAlertOpen, alertOpen, setId),
        load_assignment,
        groupedLoadsDispatch,
        dashboardState,
        setDashboardState,
        handleDashboardState,
        branches,
        branchesDispatch,
        customers,
        customersDispatch,
        users,
        usersDispatch,
        loads,
        loadsDispatch,
        orders,
        ordersDispatch,
        vehicles,
        vehiclesDispatch,
        drivers,
        driversDispatch,
        routes,
        routesDispatch,
      }}
    >
      {children}
      <AlertScreen
        alertOpen={alertOpen}
        setAlertOpen={setAlertOpen}
        id={id}
        // screen={screen}
      />
      <DialogScreen
        open={modalOpen}
        onOpenChange={setModalOpen}
        // screen={screen}
        id={id}
        href={href}
      />
    </GlobalContext.Provider>
  )
}
export default GlobalProvider
