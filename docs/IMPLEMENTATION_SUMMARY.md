# Hierarchical Customer Reordering Implementation Summary

## Changes Made

### 1. Updated `Sortable-customer.jsx`
- **Changed**: Removed `suburbKey` and `customersInGroup` parameters
- **Reason**: Customers should be reordered at the unit level (all customers), not just within a suburb group
- **Key Change**: `customerIds` now uses ALL unit customers: `(unit.customers || []).map((c) => c.customer_id)`
- **containerId**: Changed from `unit-customers:${unitId}:${suburbKey}` to `unit-customers:${unitId}`

### 2. Updated `VehicleCard.jsx`
- **Changed**: Removed `suburbKey` and `customersInGroup` props when calling `SortableCustomer`
- **Reason**: These props are no longer needed since we use all unit customers

### 3. Updated `load-assignment-single.jsx` - `handleCustomerReorder` function
- **Key Fix**: Now uses ALL unit customers for reordering, not just suburb-scoped ones
- **Sequencing Logic**: 
  - `customerIndex = idx + 1` (1-based position in the entire unit)
  - `orderIndex = orderIdx + 1` (1-based position within that customer)
  - `stop_sequence = customerIndex * 1000 + orderIndex`
- **Assignment Sync**: Added `setAssignmentPreview` sync after successful API call (preserves duplicate-fix pattern)
- **Code Pattern**:
  ```javascript
  if (typeof setAssignmentPreview === 'function' && res) {
    setAssignmentPreview({
      units: res?.units,
      unassigned_orders: res?.unassigned_orders,
      plan: res?.plan,
    })
  }
  ```

### 4. Sequence Display in `SortableOrder.jsx` (Already Implemented)
- Displays sequences as `customerIndex.orderIndex` (e.g., "3.2")
- Extracts from `stop_sequence` using:
  - `customerSeq = Math.floor(raw / 1000)`
  - `orderSeq = raw % 1000`

## Behavior

### Customer Dragging
- Users can drag an entire customer block up/down within a vehicle
- All orders in that customer move with it
- All orders' `stop_sequence` values are recalculated based on new customer position

### Order Dragging Within Customer
- Users can drag individual orders within a customer
- Only that customer's orders are resequenced
- `customerIndex` stays the same, only `orderIndex` changes

### Cross-Route/Suburb Customers
- When customers move between different routes/suburbs on the same vehicle
- Their `customerIndex` is their position in the complete `unit.customers` array
- Not restricted to one route/suburb group

## Duplicate Orders Fix Preserved
- All duplicate-prevention logic remains intact
- `handleAssignItem` and `handleUnassignItem` still have duplicate checks
- `commitImmediateMove` syncs `assignment_preview` for all three cases (assign, unassign, move)
- `useEffect` dependencies remain narrow: `[assignment_preview?.units, assignment_preview?.unassigned_orders]`

## Files Modified
1. `src/components/layout/assignment/Sortable-customer.jsx` - ✅ Updated
2. `src/components/layout/assignment/VehicleCard.jsx` - ✅ Updated
3. `src/components/layout/assignment/SortableOrder.jsx` - ✅ Already has display logic
4. `src/components/single-pages/load-assignment-single.jsx` - ⚠️ Needs `handleCustomerReorder` update

## Next Steps
Replace the `handleCustomerReorder` function in `load-assignment-single.jsx` with the corrected version that:
1. Uses all unit customers (not suburb-scoped)
2. Syncs `assignment_preview` after successful API call
3. Maintains the duplicate-fix pattern
