'use client'

// react
import { createContext, useContext } from 'react'

// initial state
import { initialBranchesState } from './initial-states/branch-state'
import { initialCustomerState } from './initial-states/customer-state'
// import { initialDashboardState } from './initial-states/dashboard-state'
import { initialDriversState } from './initial-states/driver-state'
import { initialLoadsState } from './initial-states/load-state'
// import { initialStopPointsState } from './initial-states/stop-point-state'
import { initialUsersState } from './initial-states/user-state'
import { initialOrderState } from './initial-states/orders-state'
import { initialVehiclesState } from './initial-states/vehicle-state'
import { initialRoutesState } from './initial-states/routes-state'
import { initialGroupedLoadsState } from './initial-states/grouped-load-state'
import { initialAssignmentState } from './initial-states/assignment-state'

// domain providers
import { useBranches } from './providers/branches-provider'
import { useCustomers } from './providers/customers-provider'
import { useDrivers } from './providers/drivers-provider'
import { useVehicles } from './providers/vehicles-provider'
import { useOrders } from './providers/orders-provider'
import { useAssignment } from './providers/assignment-provider'
import { useUsers } from './providers/users-provider'
import { useUI } from './providers/ui-provider'

export const initialState = {
  initialBranchesState,
  // initialDashboardState,
  initialCustomerState,
  initialDriversState,
  initialLoadsState,
  initialGroupedLoadsState,
  initialRoutesState,
  initialUsersState,
  initialVehiclesState,
  initialOrderState,
  initialAssignmentState,
}

export const GlobalContext = createContext(initialState)

/**
 * @deprecated Use domain-specific hooks instead:
 * - useBranches() for branches
 * - useCustomers() for customers
 * - useDrivers() for drivers
 * - useVehicles() for vehicles
 * - useOrders() for orders/loads/routes
 * - useAssignment() for assignments
 * - useUsers() for users
 * - useUI() for UI state
 */
export const useGlobalContext = () => {
  // Compatibility layer - combines all domain contexts
  const branches = useBranches()
  const customers = useCustomers()
  const drivers = useDrivers()
  const vehicles = useVehicles()
  const orders = useOrders()
  const assignment = useAssignment()
  const users = useUsers()
  const ui = useUI()

  return {
    // branches
    branches: branches.branches,
    branchesDispatch: branches.branchesDispatch,
    upsertBranch: branches.upsertBranch,
    deleteBranch: branches.deleteBranch,

    // customers
    customers: customers.customers,
    customersDispatch: customers.customersDispatch,
    upsertCustomer: customers.upsertCustomer,
    deleteCustomer: customers.deleteCustomer,

    // drivers
    drivers: drivers.drivers,
    driversDispatch: drivers.driversDispatch,
    upsertDriver: drivers.upsertDriver,
    deleteDriver: drivers.deleteDriver,

    // vehicles
    vehicles: vehicles.vehicles,
    vehiclesDispatch: vehicles.vehiclesDispatch,
    upsertVehicle: vehicles.upsertVehicle,
    deleteVehicle: vehicles.deleteVehicle,

    // orders/loads/routes
    orders: orders.orders,
    ordersDispatch: orders.ordersDispatch,
    upsertOrder: orders.upsertOrder,
    deleteOrder: orders.deleteOrder,
    loads: orders.loads,
    loadsDispatch: orders.loadsDispatch,
    fetchLoads: orders.fetchLoads,
    upsertLoad: orders.upsertLoad,
    deleteLoad: orders.deleteLoad,
    routes: orders.routes,
    routesDispatch: orders.routesDispatch,
    upsertRoute: orders.upsertRoute,
    deleteRoute: orders.deleteRoute,

    // assignment
    assignment: assignment.assignment,
    assignmentDispatch: assignment.assignmentDispatch,
    load_assignment: assignment.load_assignment,
    groupedLoadsDispatch: assignment.groupedLoadsDispatch,
    assignment_preview: assignment.assignment_preview,
    setAssignmentPreview: assignment.setAssignmentPreview,
    fetchAssignmentPreview: assignment.fetchAssignmentPreview,
    addNewPlan: assignment.addNewPlan,
    runAutoAssign: assignment.runAutoAssign,
    addNewUnit: assignment.addNewUnit,
    deletePlannedAssignmentById: assignment.deletePlannedAssignmentById,
    downloadPlan: assignment.downloadPlan,
    downloading: assignment.downloading,

    // users
    users: users.users,
    usersDispatch: users.usersDispatch,
    upsertUser: users.upsertUser,
    deleteUser: users.deleteUser,

    // UI state
    onCreate: ui.onCreate,
    onEdit: ui.onEdit,
    onDelete: ui.onDelete,
    selectedVehicle: ui.selectedVehicle,
    setSelectedVehicle: ui.setSelectedVehicle,
    dashboardState: ui.dashboardState,
    setDashboardState: ui.setDashboardState,
    handleDashboardState: ui.handleDashboardState,
    useLiveStore: ui.useLiveStore,
    fetchData: ui.fetchData,
    setModalOpen: ui.setModalOpen,
  }
}
