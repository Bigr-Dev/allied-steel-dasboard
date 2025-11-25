'use client'

import { useEffect } from 'react'
import { BranchesProvider, useBranches } from './branches-provider'
import { CustomersProvider, useCustomers } from './customers-provider'
import { DriversProvider, useDrivers } from './drivers-provider'
import { VehiclesProvider, useVehicles } from './vehicles-provider'
import { OrdersProvider, useOrders } from './orders-provider'
import { AssignmentProvider, useAssignment } from './assignment-provider'
import { UsersProvider, useUsers } from './users-provider'
import { UIProvider, useUI } from './ui-provider'
import { useAuth } from '../initial-states/auth-state'
import supabase from '@/config/supabase'

// components
import AlertScreen from '@/components/layout/alert-screen'
import DialogScreen from '@/components/layout/dialog-screen'

// actions
import * as branch_actions from '@/context/actions/branch-actions'
import * as assignment_actions from '@/context/actions/assignment-actions'
import * as customer_actions from '@/context/actions/customer-actions'
import * as driver_actions from '@/context/actions/driver-actions'
import * as vehicle_actions from '@/context/actions/vehicle-actions'
import * as user_actions from '@/context/actions/user-actions'

// apis
import { loadBranches } from '../apis/branch-apis'
import { loadCustomers } from '../apis/customer-apis'
import { loadUsers } from '../apis/user-apis'
import { loadLoads } from '../apis/load-apis'
import { loadOrders } from '../apis/order-apis'
import { loadVehicles } from '../apis/vehicle-apis'
import { loadDrivers } from '../apis/driver-apis'
import { loadRoutes } from '../apis/route-apis'
import { loadAssignments } from '../apis/assignment-apis'

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

// Inner component that has access to all providers
const RootAppProviderInner = ({ children, data }) => {
  const { current_user } = useAuth()

  // Get dispatchers from all providers
  const { branchesDispatch } = useBranches()
  const { customersDispatch } = useCustomers()
  const { usersDispatch } = useUsers()
  const { loadsDispatch, ordersDispatch, routesDispatch } = useOrders()
  const { vehiclesDispatch } = useVehicles()
  const { driversDispatch } = useDrivers()
  const { assignmentDispatch } = useAssignment()
  const { dashboardState, alertOpen, setAlertOpen, id, modalOpen, setModalOpen, href } = useUI()

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

  return (
    <>
      {children}
      <AlertScreen alertOpen={alertOpen} setAlertOpen={setAlertOpen} id={id} />
      <DialogScreen
        open={modalOpen}
        onOpenChange={setModalOpen}
        id={id}
        href={href}
      />
    </>
  )
}

export function RootAppProvider({ children, data }) {
  return (
    <BranchesProvider>
      <CustomersProvider>
        <DriversProvider>
          <VehiclesProvider>
            <OrdersProvider>
              <AssignmentProvider>
                <UsersProvider>
                  <UIProvider>
                    <RootAppProviderInner data={data}>
                      {children}
                    </RootAppProviderInner>
                  </UIProvider>
                </UsersProvider>
              </AssignmentProvider>
            </OrdersProvider>
          </VehiclesProvider>
        </DriversProvider>
      </CustomersProvider>
    </BranchesProvider>
  )
}