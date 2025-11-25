# Duplicate Orders Fix - Summary

## Root Causes Identified

### 1. **State Synchronization Race Condition**
The main issue occurs when optimistic UI updates race with backend responses:
- `handleAssignItem()` removes order from `unassigned` state
- Backend API call completes and returns updated data
- `setAssignmentPreview()` is called with backend response
- The `useEffect` watching `assignment_preview` re-syncs state
- If timing is off, the order can appear in both lists temporarily

### 2. **Missing Duplicate Checks**
- `handleAssignItem()` didn't check if order already exists in target unit
- `handleUnassignItem()` didn't check if order already exists in unassigned list
- This allowed the same order to be added twice during state updates

### 3. **Incomplete Backend Response Sync**
- `commitImmediateMove()` wasn't updating `assignment_preview` with backend response
- Only the unassign endpoint was syncing (and with wrong field name: `unassigned_units` vs `unassigned_orders`)
- Assign and move operations weren't syncing, leaving stale state

### 4. **useEffect Dependency Issues**
- The effect syncing `assignment_preview` had too broad dependencies
- It would re-run even when not needed, potentially overwriting optimistic updates

## Changes Made

### 1. **Enhanced `handleAssignItem()` (Line ~1050)**
```javascript
// Added duplicate check before adding to unit
const alreadyExists = (u.orders || []).some(
  (o) => String(o.order_id) === String(itemId)
)
if (alreadyExists) return u
```

### 2. **Enhanced `handleUnassignItem()` (Line ~1100)**
```javascript
// Added duplicate check before adding back to unassigned
const alreadyExists = prev.some(
  (x) => String(x.order_id) === String(itemId)
)
if (alreadyExists) return prev
return [...prev, originalOrder]
```

### 3. **Fixed `commitImmediateMove()` - Assign Case (Line ~165)**
```javascript
// Now captures and syncs backend response
const res = await fetchData(`plans/${planId}/bulk-assign`, 'POST', {...})
if (typeof setAssignmentPreview === 'function' && res) {
  setAssignmentPreview({
    units: res?.units,
    unassigned_orders: res?.unassigned_orders,  // Fixed field name
    plan: res?.plan,
  })
}
```

### 4. **Fixed `commitImmediateMove()` - Unassign Case (Line ~190)**
```javascript
// Already fixed - now properly syncs with correct field names
if (typeof setAssignmentPreview === 'function' && res) {
  setAssignmentPreview({
    units: res?.units,
    unassigned_orders: res?.unassigned_orders,
    plan: res?.plan,
  })
}
```

### 5. **Fixed `commitImmediateMove()` - Move Case (Line ~210)**
```javascript
// Now captures and syncs backend response after move
const res = await fetchData(`plans/${planId}/bulk-assign`, 'POST', {...})
if (typeof setAssignmentPreview === 'function' && res) {
  setAssignmentPreview({
    units: res?.units,
    unassigned_orders: res?.unassigned_orders,
    plan: res?.plan,
  })
}
```

### 6. **Optimized `useEffect` Dependencies (Line ~280)**
```javascript
// Changed from broad dependencies to specific ones
useEffect(() => {
  if (assignment_preview?.units) {
    setAssignedUnits(assignment_preview.units)
    setUnassigned(assignment_preview.unassigned_orders || [])
    setPlan(assignment_preview.plan || data?.plan || null)
  }
}, [assignment_preview?.units, assignment_preview?.unassigned_orders])
// Only re-run when actual data changes, not on every assignment_preview change
```

## How This Fixes Duplicates

1. **Prevents Double-Add**: Duplicate checks in `handleAssignItem()` and `handleUnassignItem()` ensure an order can't be added twice
2. **Syncs Backend State**: All three move operations now sync the backend response, ensuring UI matches server
3. **Reduces Race Conditions**: By syncing backend response immediately, we avoid stale state from previous operations
4. **Smarter Re-renders**: Optimized useEffect only re-runs when actual data changes, not on every state update

## Testing Recommendations

1. **Assign Order**: Drag from unassigned to vehicle - verify order appears once
2. **Unassign Order**: Drag from vehicle to unassigned - verify order appears once
3. **Move Order**: Drag from one vehicle to another - verify order appears once in new vehicle
4. **Unassign All**: Click unassign all button - verify all orders appear once in unassigned list
5. **Rapid Operations**: Perform multiple drag operations quickly - verify no duplicates appear

## Remaining Considerations

- Ensure backend endpoints return complete `units` and `unassigned_orders` arrays
- Verify field names match: `unassigned_orders` (not `unassigned_units`)
- Consider adding error recovery to refetch full state if sync fails
