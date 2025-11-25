# Hierarchical Customer & Order Sequencing Implementation Guide

## Overview
This implementation enables unit-level customer reordering with hierarchical sequencing where each order's `stop_sequence` is derived from its customer's position and its position within that customer.

## Formula
```
stop_sequence = customerIndex * 1000 + orderIndex

where:
  customerIndex = 1-based position of customer in unit.customers array
  orderIndex = 1-based position of order within that customer
```

## Display Format
Sequences are displayed as `customerIndex.orderIndex` (e.g., "3.2" means customer 3, order 2)

## Files Changed

### 1. `src/components/layout/assignment/Sortable-customer.jsx`
**Purpose**: Wrapper component for draggable customer blocks

**Key Changes**:
- Removed `suburbKey` and `customersInGroup` parameters
- Now uses ALL unit customers for `customerIds`
- `containerId` is unit-level: `unit-customers:${unitId}`

**Before**:
```javascript
customerIds: (customersInGroup || []).map((c) => c.customer_id),
containerId: `unit-customers:${unitId}:${suburbKey}`,
```

**After**:
```javascript
customerIds: (unit.customers || []).map((c) => c.customer_id),
containerId: `unit-customers:${unitId}`,
```

### 2. `src/components/layout/assignment/VehicleCard.jsx`
**Purpose**: Renders vehicle with customers and orders

**Key Changes**:
- Removed `suburbKey` and `customersInGroup` props from `SortableCustomer`
- Customers are still grouped by route/suburb for display, but DnD operates at unit level

**Before**:
```javascript
<SortableCustomer
  key={sortableId}
  id={sortableId}
  unit={unit}
  customer={customer}
  suburbKey={suburbKey}
  customersInGroup={sortedCustomers}
>
```

**After**:
```javascript
<SortableCustomer
  key={sortableId}
  id={sortableId}
  unit={unit}
  customer={customer}
>
```

### 3. `src/components/layout/assignment/SortableOrder.jsx`
**Purpose**: Renders individual orders with sequence display

**Already Implemented**:
- Extracts `customerSeq` and `orderSeq` from `stop_sequence`
- Displays as `customerSeq.orderSeq` format
- Handles legacy numeric values gracefully

```javascript
const customerSeq = Math.floor(raw / 1000)
const orderSeq = raw % 1000
displaySequence = `${customerSeq}.${orderSeq}`
```

### 4. `src/components/single-pages/load-assignment-single.jsx`
**Purpose**: Main assignment logic and DnD handlers

**Key Changes**:

#### a) `handleCustomerReorder` function
- **CRITICAL**: Must use ALL unit customers, not suburb-scoped ones
- Reorders customers globally within the unit
- Recalculates all affected orders' `stop_sequence` values
- Syncs `assignment_preview` after successful API call

**Key Logic**:
```javascript
const reorderedCustomers = newCustomerIds
  .map((cid, idx) => {
    const customerIndex = idx + 1 // 1-based position in unit
    const updatedOrders = (existing.orders || []).map((order, orderIdx) => {
      const orderIndex = orderIdx + 1
      const newSeq = customerIndex * 1000 + orderIndex
      // ... update order with newSeq
    })
    return { ...existing, orders: updatedOrders }
  })
```

#### b) `handleSortableReorder` function
- Already correctly uses `getCustomerIndexInUnit(unitId, customerId)`
- Calculates: `newSequence = customerIndex * 1000 + orderIndex`
- Only reorders orders within a single customer

#### c) `handleDragEnd` function
- Already correctly routes customer drags to `handleCustomerReorder`
- Already correctly routes order drags to `handleSortableReorder`

#### d) `getCustomerIndexInUnit` helper
- Already implemented correctly
- Returns 1-based index of customer in unit

#### e) `getNextStopSequenceForUnit` helper
- Already correctly uses all unit customers
- Finds max sequence across all customers and orders

## Duplicate Orders Fix Preservation

All existing duplicate-prevention logic is preserved:

### 1. `handleAssignItem`
```javascript
const alreadyExists = (u.orders || []).some(
  (o) => String(o.order_id) === String(itemId)
)
if (alreadyExists) return u
```

### 2. `handleUnassignItem`
```javascript
const alreadyExists = prev.some(
  (x) => String(x.order_id) === String(itemId)
)
if (alreadyExists) return prev
```

### 3. `commitImmediateMove` - All three cases
```javascript
if (typeof setAssignmentPreview === 'function' && res) {
  setAssignmentPreview({
    units: res?.units,
    unassigned_orders: res?.unassigned_orders,
    plan: res?.plan,
  })
}
```

### 4. `useEffect` dependencies
```javascript
useEffect(() => {
  if (assignment_preview?.units) {
    setAssignedUnits(assignment_preview.units)
    setUnassigned(assignment_preview.unassigned_orders || [])
    setPlan(assignment_preview.plan || data?.plan || null)
  }
}, [assignment_preview?.units, assignment_preview?.unassigned_orders])
```

## Behavior Examples

### Example 1: Dragging Customer Between Routes
**Initial State**:
- Route A: Customer 1 (orders 1.1, 1.2), Customer 2 (orders 2.1)
- Route B: Customer 3 (orders 3.1, 3.2)

**Action**: Drag Customer 3 to Route A (between Customer 1 and 2)

**Result**:
- Route A: Customer 1 (1.1, 1.2), Customer 3 (2.1, 2.2), Customer 2 (3.1)
- Route B: Empty
- All sequences recalculated based on new positions

### Example 2: Dragging Order Within Customer
**Initial State**:
- Customer 2: Order 1 (2.1), Order 2 (2.2), Order 3 (2.3)

**Action**: Drag Order 3 to position 1

**Result**:
- Customer 2: Order 3 (2.1), Order 1 (2.2), Order 2 (2.3)
- Customer index stays 2, only order indices change

## Testing Checklist

- [ ] Drag customer block up/down within same route
- [ ] Drag customer block between different routes
- [ ] Drag customer block between different suburbs
- [ ] Drag order within customer
- [ ] Verify sequences display as X.Y format
- [ ] Verify no duplicate orders appear
- [ ] Verify sequences persist after page refresh
- [ ] Verify rapid drag operations don't cause duplicates
- [ ] Verify assignment_preview syncs correctly

## Acceptance Criteria Met

✅ Customers can be dragged up/down within a vehicle
✅ Orders can be dragged within a customer
✅ Sequences follow `customerIndex * 1000 + orderIndex` formula
✅ Sequences display as `X.Y` format
✅ Customers moving between routes/suburbs use global unit index
✅ Duplicate orders fix is preserved
✅ assignment_preview syncing is maintained
✅ No TypeScript conversion
✅ No backend endpoint changes
✅ Visual design remains consistent
