# Context Migration Guide

## Overview
Migrate from deprecated `useGlobalContext()` to domain-specific hooks.

## Files to Update

### 1. load-assignment-single.jsx

**Location**: `src/components/single-pages/load-assignment-single.jsx`

**Current Code (Line 1-2)**:
```javascript
import { useGlobalContext } from '@/context/global-context'
...
const { assignment_preview, setAssignmentPreview, fetchData } = useGlobalContext()
```

**New Code**:
```javascript
import { useAssignment } from '@/context/providers/assignment-provider'
import { useUI } from '@/context/providers/ui-provider'
...
const { assignment_preview, setAssignmentPreview } = useAssignment()
const { fetchData } = useUI()
```

**Why**: 
- `assignment_preview` and `setAssignmentPreview` come from AssignmentProvider
- `fetchData` comes from UIProvider
- Using domain-specific hooks is clearer and more maintainable
- Reduces unnecessary context subscriptions

## Context Mapping Reference

### AssignmentProvider (useAssignment)
```javascript
{
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
}
```

### UIProvider (useUI)
```javascript
{
  onCreate,
  onEdit,
  onDelete,
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
}
```

### BranchesProvider (useBranches)
```javascript
{
  branches,
  branchesDispatch,
  upsertBranch,
  deleteBranch,
}
```

### CustomersProvider (useCustomers)
```javascript
{
  customers,
  customersDispatch,
  upsertCustomer,
  deleteCustomer,
}
```

### DriversProvider (useDrivers)
```javascript
{
  drivers,
  driversDispatch,
  upsertDriver,
  deleteDriver,
}
```

### VehiclesProvider (useVehicles)
```javascript
{
  vehicles,
  vehiclesDispatch,
  upsertVehicle,
  deleteVehicle,
}
```

### OrdersProvider (useOrders)
```javascript
{
  orders,
  ordersDispatch,
  upsertOrder,
  deleteOrder,
  loads,
  loadsDispatch,
  fetchLoads,
  upsertLoad,
  deleteLoad,
  routes,
  routesDispatch,
  upsertRoute,
  deleteRoute,
}
```

### UsersProvider (useUsers)
```javascript
{
  users,
  usersDispatch,
  upsertUser,
  deleteUser,
}
```

## Migration Steps

1. **Identify what you need** from the context
2. **Find the provider** that exports it (see mapping above)
3. **Import the hook** from the provider
4. **Replace useGlobalContext** with the specific hook
5. **Destructure only what you need**

## Example Migration

### Before
```javascript
import { useGlobalContext } from '@/context/global-context'

function MyComponent() {
  const { 
    assignment_preview, 
    setAssignmentPreview, 
    fetchData,
    vehicles,
    orders,
    // ... many other unused properties
  } = useGlobalContext()
  
  // Only uses assignment_preview, setAssignmentPreview, fetchData
}
```

### After
```javascript
import { useAssignment } from '@/context/providers/assignment-provider'
import { useUI } from '@/context/providers/ui-provider'

function MyComponent() {
  const { assignment_preview, setAssignmentPreview } = useAssignment()
  const { fetchData } = useUI()
  
  // Only imports what's needed
}
```

## Benefits

✅ **Clearer Dependencies**: Easy to see what context a component uses
✅ **Better Performance**: Only subscribe to needed context
✅ **Easier Testing**: Can mock individual providers
✅ **Better Tree-Shaking**: Unused providers can be removed
✅ **Maintainability**: Easier to refactor individual domains

## Backward Compatibility

The `useGlobalContext()` hook will remain available as a compatibility layer for legacy code, but new code should use domain-specific hooks.

## Verification

After migration, verify:
- [ ] Component still renders correctly
- [ ] All functionality works as expected
- [ ] No console errors
- [ ] No unused imports
