# Final Implementation Checklist

## ✅ Completed Changes

### 1. Sortable-customer.jsx
**Status**: ✅ UPDATED
- Removed `suburbKey` parameter
- Removed `customersInGroup` parameter  
- Changed `customerIds` to use all unit customers: `(unit.customers || []).map((c) => c.customer_id)`
- Changed `containerId` to unit-level: `unit-customers:${unitId}`

**File**: `src/components/layout/assignment/Sortable-customer.jsx`

### 2. VehicleCard.jsx
**Status**: ✅ UPDATED
- Removed `suburbKey` prop from SortableCustomer
- Removed `customersInGroup` prop from SortableCustomer
- Kept all other functionality intact

**File**: `src/components/layout/assignment/VehicleCard.jsx`

### 3. SortableOrder.jsx
**Status**: ✅ ALREADY CORRECT
- Displays sequences as `customerIndex.orderIndex` format
- Extracts from `stop_sequence` using: `Math.floor(raw / 1000)` and `raw % 1000`
- No changes needed

**File**: `src/components/layout/assignment/SortableOrder.jsx`

## ⚠️ Remaining Change Required

### 4. load-assignment-single.jsx
**Status**: ⚠️ NEEDS UPDATE

**Location**: The `handleCustomerReorder` function (around line 1000+)

**What to Replace**:
The current `handleCustomerReorder` function that uses `suburbKey` and `customerIds` from suburb group

**With**:
The corrected version that:
1. Uses ALL unit customers (not suburb-scoped)
2. Syncs `assignment_preview` after successful API call
3. Maintains the duplicate-fix pattern

**Key Differences**:
- OLD: `const { unitId, suburbKey, customerIds } = dragData`
- NEW: `const { unitId, customerIds } = dragData`

- OLD: Reorders only customers in suburb group
- NEW: Reorders ALL customers in unit globally

- OLD: No `setAssignmentPreview` sync
- NEW: Syncs after successful API call

**Reference File**: `HANDLECUSTOMERREORDER_REPLACEMENT.js`

## Verification Steps

After making the change to `handleCustomerReorder`:

1. **Syntax Check**
   - File should have no TypeScript errors
   - All imports should be present
   - Function should be properly closed

2. **Logic Check**
   - `newCustomerIds` should be calculated from ALL unit customers
   - `customerIndex = idx + 1` (1-based)
   - `orderIndex = orderIdx + 1` (1-based)
   - `newSeq = customerIndex * 1000 + orderIndex`
   - `setAssignmentPreview` is called with `res?.units`, `res?.unassigned_orders`, `res?.plan`

3. **Functional Check**
   - Drag customer between routes → sequences update correctly
   - Drag customer between suburbs → sequences update correctly
   - Drag order within customer → only order indices change
   - Sequences display as X.Y format
   - No duplicate orders appear

## Duplicate Orders Fix Status

✅ **PRESERVED** - All duplicate-prevention logic remains intact:
- `handleAssignItem` has duplicate check
- `handleUnassignItem` has duplicate check
- `commitImmediateMove` syncs `assignment_preview` for all cases
- `useEffect` has narrow dependencies

## Files Summary

| File | Status | Changes |
|------|--------|---------|
| Sortable-customer.jsx | ✅ Done | Removed suburb-scoped params |
| VehicleCard.jsx | ✅ Done | Removed suburb-scoped props |
| SortableOrder.jsx | ✅ Done | Already correct |
| load-assignment-single.jsx | ⚠️ Pending | Update handleCustomerReorder |

## Next Action

Replace the `handleCustomerReorder` function in `load-assignment-single.jsx` with the version from `HANDLECUSTOMERREORDER_REPLACEMENT.js`

The function should:
1. Accept `active`, `over`, `dragData` parameters
2. Extract `unitId` and `customerIds` from `dragData` (NOT `suburbKey`)
3. Use ALL unit customers for reordering
4. Calculate sequences as `customerIndex * 1000 + orderIndex`
5. Sync `assignment_preview` after successful API call
6. Maintain error handling with `handleAPIError`

## Success Criteria

✅ Customers can be dragged up/down within a vehicle
✅ Orders can be dragged within a customer  
✅ Sequences follow hierarchical formula
✅ Sequences display as X.Y format
✅ No duplicate orders
✅ assignment_preview syncs correctly
✅ Duplicate orders fix is preserved
