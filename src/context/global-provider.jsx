'use client'

// react
import { useEffect, useReducer, useState } from 'react'

// icons

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
import { loadGroupedLoads } from './apis/grouped-load-apis'
import { deletePlannedAssignmentById } from './apis/assignment-apis'

// components
import AlertScreen from '@/components/layout/alert-screen'
import DialogScreen from '@/components/layout/dialog-screen'

// hooks
import { onCreate, onDelete, onEdit } from '@/hooks/use-modal'
import { usePathname } from 'next/navigation'
import { replaceHyphenWithUnderscore } from '@/hooks/replace-hyphen'

// config
import supabase from '@/config/supabase'
import { fetchData } from '@/lib/fetch'
import assignmentReducer from './reducers/assignment-reducer'
import { autoAssignLoads, loadAssignments } from './apis/assignment-apis'

const GlobalProvider = ({ children, data }) => {
  const pathname = usePathname().slice(1)
  const screen = replaceHyphenWithUnderscore(pathname)

  // console.log('screen :>> ', screen)
  // const vehicles_data = data?.vehicles?.map((v) => {
  //   const driver = data?.drivers?.filter((d) => d.id == v.current_driver)?.[0]
  //     ?.name
  //   const link = data?.vehicles?.filter((link) => link.id == v.assigned_to)?.[0]
  //     ?.fleet_number
  //   return { ...v, current_driver: driver, assigned_to: link }
  // })
  // console.log('vehicles_data :>> ', vehicles_data)
  // auth
  const { current_user, currentUserDispatch } = useAuth()

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
  // local states
  const [dashboardRoutes, setDashboardRoutes] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [id, setId] = useState(null)
  const [href, setHref] = useState(null)
  const [dashboardState, setDashboardState] = useState({
    value: current_user?.currentUser?.branch_id || '',
    label: current_user?.currentUser?.branch_name || '',
  })
  // console.log('data :>> ', data?.load_assignment)
  // load data on initial render
  useEffect(() => {
    if (data) {
      if (!current_user?.currentUser?.id) return
      loadBranches(branchesDispatch, data?.branches)
      loadCustomers(customersDispatch, data?.customers)
      loadOrders(ordersDispatch, data?.orders)
      loadAssignments(assignmentDispatch, data?.load_assignment)
      // loadRoutes(routesDispatch, data?.routes)
    }
  }, [data, current_user])

  // fetch data when user or current_user changes
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

  // reset id and href when modal is closed
  useEffect(() => {
    if (!modalOpen) {
      setId(null)
      setHref(null)
    }
  }, [modalOpen])

  // reset id when alert is closed
  useEffect(() => {
    if (!alertOpen) {
      setId(null)
    }
  }, [alertOpen])

  // filter data based on dashboard state
  useEffect(() => {
    if (data) {
      if (!current_user?.currentUser?.id) return

      if (data?.users) {
        if (dashboardState.value == 'all') {
          loadUsers(usersDispatch, data?.users)
        } else {
          loadUsers(
            usersDispatch,
            data?.users?.filter((u) => u.branch_id === dashboardState.value)
          )
        }
      }

      if (data?.loads) {
        if (dashboardState.value == 'all') {
          loadLoads(loadsDispatch, data?.loads)
        } else {
          loadLoads(
            loadsDispatch,
            data?.loads?.filter((l) => l.branch_id === dashboardState.value)
          )
        }
      }

      if (data?.vehicles) {
        if (dashboardState.value == 'all') {
          loadVehicles(vehiclesDispatch, data?.vehicles)
        } else {
          loadVehicles(
            vehiclesDispatch,
            data?.vehicles?.filter((v) => v.branch_id === dashboardState.value)
          )
        }
      }

      if (data?.drivers) {
        if (dashboardState.value == 'all') {
          loadDrivers(driversDispatch, data?.drivers)
        } else {
          loadDrivers(
            driversDispatch,
            data?.drivers?.filter((d) => d.branch_id === dashboardState.value)
          )
        }
      }

      if (data?.routes) {
        if (dashboardState.value == 'all') {
          loadRoutes(routesDispatch, data?.routes)
        } else {
          loadRoutes(
            routesDispatch,
            data?.routes?.filter((d) => d.branch_id === dashboardState.value)
          )
        }
      }
    }
    if (data?.assigned_loads && data?.assigned_vehicles) {
      const assigned_loads_data = Object.entries(data?.assigned_loads).map(
        ([id, data]) => ({
          id,
          data,
        })
      )

      const assigned_vehicles = data?.assigned_vehicles
      if (dashboardState.value == 'all') {
        const assigned_loads = assigned_loads_data
          ?.map((l) => l.data)
          .filter((l) => l.branch_id === dashboardState.value)
        loadGroupedLoads(groupedLoadsDispatch, [
          assigned_loads,
          assigned_vehicles,
        ])
      } else {
        loadGroupedLoads(groupedLoadsDispatch, [
          assigned_loads_data,
          assigned_vehicles,
        ])
      }

      //  console.log('data :>> ', data)
    }
  }, [current_user, dashboardState])

  const TABLES = [
    {
      table: 'branches',
      onInsert: (r) => branchesDispatch(branch_actions.addBranchSuccess(r)),
      onUpdate: (r) => branchesDispatch(branch_actions.updateBranchSuccess(r)),
      onDelete: (o) =>
        branchesDispatch(branch_actions.deleteBranchSuccess(o.id)),
    },
    {
      table: 'assignment_plans',
      onInsert: (r) => {
        return console.log('r-insert assignment_plans:>> GlobalProvider', r)
      },
      //assignmentDispatch(assignment_actions.addPlanSuccess(r)),
      onUpdate: (r) => {
        return console.log('r-update assignment_plans:>> GlobalProvider', r)
      },
      //  onInsert: (r) => assignmentDispatch(assignment_actions. (r)),
      //   onUpdate: (r) => assignmentDispatch(assignment_actions.updateBranchSuccess(r)),
      onDelete: (o) =>
        assignmentDispatch(
          assignment_actions.deletePlannedAssignmentByIdSuccess(o.id)
        ),
    },
    {
      table: 'customers',
      onInsert: (r) =>
        customersDispatch(customer_actions.addCustomerSuccess(r)),
      onUpdate: (r) =>
        customersDispatch(customer_actions.updateCustomerSuccess(r)),
      onDelete: (o) =>
        customersDispatch(customer_actions.deleteCustomerSuccess(o.id)),
    },
    {
      table: 'drivers',
      onInsert: (r) => driversDispatch(driver_actions.addDriverSuccess(r)),
      onUpdate: (r) => driversDispatch(driver_actions.updateDriverSuccess(r)),
      onDelete: (o) =>
        driversDispatch(driver_actions.deleteDriverSuccess(o.id)),
    },
    {
      table: 'users',
      onInsert: (r) => usersDispatch(user_actions.addUserSuccess(r)),
      onUpdate: (r) => usersDispatch(user_actions.updateUserSuccess(r)),
      onDelete: (o) => usersDispatch(user_actions.deleteUserSuccess(o.id)),
    },
    {
      table: 'vehicles',
      onInsert: (r) => vehiclesDispatch(vehicle_actions.addVehicleSuccess(r)),
      onUpdate: (r) =>
        vehiclesDispatch(vehicle_actions.updateVehicleSuccess(r)),
      onDelete: (o) =>
        vehiclesDispatch(vehicle_actions.deleteVehicleSuccess(o.id)),
    },
  ]

  //  realtime subscription
  // global-provider.jsx (inside GlobalProvider)
  useEffect(() => {
    // Guard: need a branch filter and a logged-in user before subscribing
    if (!current_user?.currentUser?.id) return

    // Build a simple filter by branch_id if applicable
    // If you want "All", set filter to null to receive everything (or skip the table).
    const branchId = dashboardState?.value
    const makeFilter = (table) =>
      branchId && branchId !== 'all' ? `branch_id=eq.${branchId}` : null

    // Single shared channel for all tables
    const ch = supabase.channel('app-rt')

    // helper to batch dispatches
    let queue = []
    let scheduled = false
    const enqueue = (fn) => {
      queue.push(fn)
      if (!scheduled) {
        scheduled = true
        // batch on next tick
        Promise.resolve().then(() => {
          const fns = queue
          queue = []
          scheduled = false
          // run all dispatches together
          fns.forEach((f) => f())
        })
      }
    }

    const addTable = ({ table, onInsert, onUpdate, onDelete }) => {
      const filter = makeFilter(table)

      // INSERT
      ch.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        (p) => enqueue(() => onInsert?.(p.new))
      )
      // UPDATE
      ch.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        (p) => enqueue(() => onUpdate?.(p.new))
      )
      // DELETE
      ch.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        (p) => enqueue(() => onDelete?.(p.old))
      )
    }

    // Attach all your tables to the one channel
    TABLES.forEach(addTable)

    // Subscribe once
    ch.subscribe((status) => {
      // optional: console.log('realtime status', status)
    })

    return () => {
      // Remove the whole channel (and every handler registered on it)
      supabase.removeChannel(ch)
    }
  }, [dashboardState?.value, current_user?.currentUser?.id])

  // useEffect(() => {
  //   const channels = TABLES.map(({ table, onInsert, onUpdate, onDelete }) => {
  //     const ch = supabase
  //       .channel(`${table}-rt`)
  //       .on(
  //         'postgres_changes',
  //         { event: 'INSERT', schema: 'public', table },
  //         (p) => onInsert?.(p.new)
  //       )
  //       .on(
  //         'postgres_changes',
  //         { event: 'UPDATE', schema: 'public', table },
  //         (p) => onUpdate?.(p.new)
  //       )
  //       .on(
  //         'postgres_changes',
  //         { event: 'DELETE', schema: 'public', table },
  //         (p) => onDelete?.(p.old)
  //       )
  //       .subscribe()

  //     return ch
  //   })

  //   return () => {
  //     channels.forEach((ch) => supabase.removeChannel(ch))
  //   }
  // }, [])
  // console.log('assignment :>> ', assignment)
  const [assignment_preview, setAssignmentPreview] = useState([])
  const fetchAssignmentPreview = async (data) =>
    autoAssignLoads(assignmentDispatch, data)

  return (
    <GlobalContext.Provider
      value={{
        onCreate: onCreate(setModalOpen, modalOpen, setHref),
        onEdit: onEdit(setModalOpen, modalOpen, setId),
        onDelete: onDelete(setAlertOpen, alertOpen, setId),
        assignment_preview,
        setModalOpen,
        assignment,

        fetchAssignmentPreview,
        assignmentDispatch,
        deletePlannedAssignmentById,
        load_assignment,
        groupedLoadsDispatch,
        dashboardState,
        setDashboardState,
        handleDashboardState,
        branches,
        branchesDispatch,
        upsertBranch,
        deleteBranch,
        customers,
        customersDispatch,
        upsertCustomer,
        deleteCustomer,
        users,
        usersDispatch,
        upsertUser,
        deleteUser,
        loads,
        loadsDispatch,
        fetchLoads,
        upsertLoad,
        deleteLoad,
        orders,
        ordersDispatch,
        upsertOrder,
        deleteOrder,
        vehicles,
        vehiclesDispatch,
        upsertVehicle,
        deleteVehicle,
        drivers,
        driversDispatch,
        upsertDriver,
        deleteDriver,
        routes,
        routesDispatch,
        upsertRoute,
        deleteRoute,
        fetchData,
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

// useEffect(() => {
//   const branches_channel = supabase
//     .channel('branches-realtime')
//     .on(
//       'postgres_changes',
//       { event: '*', schema: 'public', table: 'branches' },
//       (payload) => {
//         switch (payload.eventType) {
//           case 'INSERT':
//             branchesDispatch(branch_actions.addBranchSuccess(payload.new))
//             break
//           case 'UPDATE':
//             branchesDispatch(branch_actions.updateBranchSuccess(payload.new))
//             break
//           case 'DELETE':
//             branchesDispatch(
//               branch_actions.deleteBranchSuccess(payload.old.id)
//             )
//             break
//           default:
//             break
//         }
//         console.log('payload :>> ', payload, screen)
//       }
//     )
//     .subscribe()

//   return () => {
//     supabase.removeChannel(branches_channel)
//   }
// }, [])
