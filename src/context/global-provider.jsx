'use client'

// react
import { useEffect, useReducer, useState } from 'react'

// actions
import * as branch_actions from '@/context/actions/branch-actions'
import * as assignment_actions from '@/context/actions/assignment-actions'
import * as customer_actions from '@/context/actions/customer-actions'
import * as driver_actions from '@/context/actions/driver-actions'
import * as vehicle_actions from '@/context/actions/vehicle-actions'
import * as user_actions from '@/context/actions/user-actions'

// context
import { GlobalContext, initialState } from './global-context'

// reducers
import branchReducer from './reducers/branch-reducer'
import customerReducer from './reducers/customer-reducer'
import userReducer from './reducers/user-reducer'
import loadReducer from './reducers/load-reducer'
import orderReducer from './reducers/order-reducer'
import vehicleReducer from './reducers/vehicle-apis'
import driverReducer from './reducers/driver-reducer'
import routeReducer from './reducers/route-reducers'
import groupedLoadReducer from './reducers/grouped_load-reducer'
import assignmentReducer from './reducers/assignment-reducer'

// states
import { useAuth } from './initial-states/auth-state'

// api's
import { deleteBranch, loadBranches, upsertBranch } from './apis/branch-apis'
import {
  deleteCustomer,
  loadCustomers,
  upsertCustomer,
} from './apis/customer-apis'
import { deleteUser, loadUsers, upsertUser } from './apis/user-apis'
import { deleteLoad, fetchLoads, loadLoads, upsertLoad } from './apis/load-apis'
import { deleteOrder, loadOrders, upsertOrder } from './apis/order-apis'
import { deleteVehicle, loadVehicles, upsertVehicle } from './apis/vehicle-apis'
import { deleteDriver, loadDrivers, upsertDriver } from './apis/driver-apis'
import { deleteRoute, loadRoutes, upsertRoute } from './apis/route-apis'
import {
  addPlan,
  addUnit,
  autoAssignPlan,
  deletePlannedAssignmentById,
  loadAssignments,
} from './apis/assignment-apis'

// components
import AlertScreen from '@/components/layout/alert-screen'
import DialogScreen from '@/components/layout/dialog-screen'

// hooks
import { onCreate, onDelete, onEdit } from '@/hooks/use-modal'

// config
import supabase from '@/config/supabase'
import { useLiveStore } from '@/config/zustand'

// helpers
import { fetchData } from '@/lib/fetch'

const TABLE_CONFIG = [
  {
    table: 'branches',
    onInsert: (r, dispatch) => dispatch(branch_actions.addBranchSuccess(r)),
    onUpdate: (r, dispatch) => dispatch(branch_actions.updateBranchSuccess(r)),
    onDelete: (o, dispatch) =>
      dispatch(branch_actions.deleteBranchSuccess(o.id)),
  },
  {
    table: 'plans',
    onInsert: (r, dispatch) => {
      console.log('🟢 PLANS LISTENER - INSERT:', r)
      dispatch(assignment_actions.addPlanSuccess(r))
    },
    onUpdate: (r, dispatch) => {
      console.log('🟡 PLANS LISTENER - UPDATE:', r)
      dispatch(assignment_actions.addPlanSuccess(r))
    },
    onDelete: (o, dispatch) => {
      console.log('🔴 PLANS LISTENER - DELETE:', o)
      dispatch(assignment_actions.deletePlannedAssignmentByIdSuccess(o.id))
    },
  },
  {
    table: 'customers',
    onInsert: (r, dispatch) => dispatch(customer_actions.addCustomerSuccess(r)),
    onUpdate: (r, dispatch) =>
      dispatch(customer_actions.updateCustomerSuccess(r)),
    onDelete: (o, dispatch) =>
      dispatch(customer_actions.deleteCustomerSuccess(o.id)),
  },
  {
    table: 'drivers',
    onInsert: (r, dispatch) => dispatch(driver_actions.addDriverSuccess(r)),
    onUpdate: (r, dispatch) => dispatch(driver_actions.updateDriverSuccess(r)),
    onDelete: (o, dispatch) =>
      dispatch(driver_actions.deleteDriverSuccess(o.id)),
  },
  {
    table: 'users',
    onInsert: (r, dispatch) => dispatch(user_actions.addUserSuccess(r)),
    onUpdate: (r, dispatch) => dispatch(user_actions.updateUserSuccess(r)),
    onDelete: (o, dispatch) => dispatch(user_actions.deleteUserSuccess(o.id)),
  },
  {
    table: 'vehicles',
    onInsert: (r, dispatch) => dispatch(vehicle_actions.addVehicleSuccess(r)),
    onUpdate: (r, dispatch) =>
      dispatch(vehicle_actions.updateVehicleSuccess(r)),
    onDelete: (o, dispatch) =>
      dispatch(vehicle_actions.deleteVehicleSuccess(o.id)),
  },
]

const GlobalProvider = ({ children, data }) => {
  const { current_user } = useAuth()

  // reducers
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
  const [assignment, assignmentDispatch] = useReducer(
    assignmentReducer,
    initialState.initialAssignmentState
  )
  // console.log('assignment :>> ', assignment)
  // local UI state
  const [modalOpen, setModalOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [id, setId] = useState(null)
  const [href, setHref] = useState(null)
  const [assignment_preview, setAssignmentPreview] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const [dashboardState, setDashboardState] = useState({
    value: current_user?.currentUser?.branch_id || '',
    label: current_user?.currentUser?.branch_name || '',
  })

  // load initial data from server props
  useEffect(() => {
    if (!data) return
    if (!current_user?.currentUser?.id) return

    loadBranches(branchesDispatch, data.branches)
    loadCustomers(customersDispatch, data.customers)
    loadOrders(ordersDispatch, data.orders)
    loadAssignments(assignmentDispatch, data.load_assignment)
    loadUsers(usersDispatch, data.users)
    loadLoads(loadsDispatch, data.loads?.branches)
    loadRoutes(routesDispatch, data.routes)
    loadVehicles(vehiclesDispatch, data.vehicles)
    loadDrivers(driversDispatch, data.drivers)
  }, [data, current_user?.currentUser?.id])

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

  // realtime subscription
  useEffect(() => {
    const userId = current_user?.currentUser?.id
    if (!userId) return

    const branchId = dashboardState?.value

    // shared batching helper per channel
    let queue = []
    let scheduled = false

    const enqueue = (fn) => {
      queue.push(fn)
      if (scheduled) return
      scheduled = true
      Promise.resolve().then(() => {
        const fns = queue
        queue = []
        scheduled = false
        fns.forEach((f) => f())
      })
    }

    const ch = supabase.channel('app-rt')

    const makeHandler = (fn, dispatch) => (payload) => {
      const row = payload.eventType === 'DELETE' ? payload.old : payload.new
      enqueue(() => fn(row, dispatch))
    }

    TABLE_CONFIG.forEach(({ table, onInsert, onUpdate, onDelete }) => {
      const baseConfig = {
        schema: 'public',
        table,
      }

      // INSERT
      ch.on(
        'postgres_changes',
        { ...baseConfig, event: 'INSERT' },
        makeHandler(onInsert, getDispatchForTable(table))
      )

      // UPDATE
      ch.on(
        'postgres_changes',
        { ...baseConfig, event: 'UPDATE' },
        makeHandler(onUpdate, getDispatchForTable(table))
      )

      // DELETE
      ch.on(
        'postgres_changes',
        { ...baseConfig, event: 'DELETE' },
        makeHandler(onDelete, getDispatchForTable(table))
      )
    })

    function getDispatchForTable(table) {
      switch (table) {
        case 'branches':
          return branchesDispatch
        case 'plans':
          return assignmentDispatch
        case 'customers':
          return customersDispatch
        case 'drivers':
          return driversDispatch
        case 'users':
          return usersDispatch
        case 'vehicles':
          return vehiclesDispatch
        default:
          return () => {}
      }
    }

    ch.subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [dashboardState?.value, current_user?.currentUser?.id])

  const fetchAssignmentPreview = async (data) => {
    // currently same as addNewPlan, but kept separate for semantics
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

  const downloadPlan = async (id) => {
    console.log('id :>> ', id)
    // setDownloading(true)
    // try {
    //   const res = await fetch('/api/plans/export-load-plan', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(assignment_preview),
    //   })

    //   if (!res.ok) {
    //     const txt = await res.text().catch(() => '')
    //     throw new Error(txt || `HTTP ${res.status}`)
    //   }

    //   const blob = await res.blob()
    //   const ab = await blob.arrayBuffer()
    //   const sig = new Uint8Array(ab).slice(0, 2)

    //   // basic XLSX sanity check
    //   if (!(sig[0] === 0x50 && sig[1] === 0x4b)) {
    //     const text = new TextDecoder().decode(new Uint8Array(ab).slice(0, 200))
    //     throw new Error('Server did not return an XLSX.\nPreview: ' + text)
    //   }

    //   const cd = res.headers.get('Content-Disposition') || ''
    //   const m = cd.match(/filename="([^"]+)"/i)
    //   const filename = m?.[1] || 'load-plan.xlsx'

    //   const url = URL.createObjectURL(blob)
    //   const a = document.createElement('a')
    //   a.href = url
    //   a.download = filename
    //   document.body.appendChild(a)
    //   a.click()
    //   a.remove()
    //   URL.revokeObjectURL(url)
    // } catch (error) {
    //   console.log('download error:', error)
    //   alert(error.message || 'Export failed')
    // } finally {
    //   setDownloading(false)
    // }
  }

  return (
    <GlobalContext.Provider
      value={{
        onCreate: onCreate(setModalOpen, modalOpen, setHref),
        onEdit: (data) => {
          setSelectedVehicle(data)
          return onEdit(setModalOpen, modalOpen, setId)(data)
        },
        onDelete: onDelete(setAlertOpen, alertOpen, setId),

        // assignment / planning
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
        selectedVehicle,
        setSelectedVehicle,
        deletePlannedAssignmentById,

        // download
        downloadPlan,
        downloading,

        // dashboard + live store
        dashboardState,
        setDashboardState,
        handleDashboardState,
        useLiveStore,

        // branches
        branches,
        branchesDispatch,
        upsertBranch,
        deleteBranch,

        // customers
        customers,
        customersDispatch,
        upsertCustomer,
        deleteCustomer,

        // users
        users,
        usersDispatch,
        upsertUser,
        deleteUser,

        // loads
        loads,
        loadsDispatch,
        fetchLoads,
        upsertLoad,
        deleteLoad,

        // orders
        orders,
        ordersDispatch,
        upsertOrder,
        deleteOrder,

        // vehicles
        vehicles,
        vehiclesDispatch,
        upsertVehicle,
        deleteVehicle,

        // drivers
        drivers,
        driversDispatch,
        upsertDriver,
        deleteDriver,

        // routes
        routes,
        routesDispatch,
        upsertRoute,
        deleteRoute,

        // generic fetch helper
        fetchData,

        // modals
        setModalOpen,
      }}
    >
      {children}
      <AlertScreen alertOpen={alertOpen} setAlertOpen={setAlertOpen} id={id} />
      <DialogScreen
        open={modalOpen}
        onOpenChange={setModalOpen}
        id={id}
        href={href}
      />
    </GlobalContext.Provider>
  )
}

export default GlobalProvider
