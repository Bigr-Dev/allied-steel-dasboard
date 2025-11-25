# Visual Guide to Hierarchical Sequencing

## Data Structure

```
Unit (Vehicle)
├── customers: [
│   ├── Customer 1 (customerIndex = 1)
│   │   └── orders: [
│   │       ├── Order A (orderIndex = 1) → stop_sequence = 1001
│   │       ├── Order B (orderIndex = 2) → stop_sequence = 1002
│   │       └── Order C (orderIndex = 3) → stop_sequence = 1003
│   │
│   ├── Customer 2 (customerIndex = 2)
│   │   └── orders: [
│   │       ├── Order D (orderIndex = 1) → stop_sequence = 2001
│   │       └── Order E (orderIndex = 2) → stop_sequence = 2002
│   │
│   └── Customer 3 (customerIndex = 3)
│       └── orders: [
│           └── Order F (orderIndex = 1) → stop_sequence = 3001
│
└── Display Grouping (for UI only):
    ├── Route A
    │   ├── Suburb 1
    │   │   ├── Customer 1 (1.1, 1.2, 1.3)
    │   │   └── Customer 2 (2.1, 2.2)
    │   └── Suburb 2
    │       └── Customer 3 (3.1)
    └── Route B
        └── (empty)
```

## Drag Scenarios

### Scenario 1: Drag Customer 3 to Position 1

**Before**:
```
Unit.customers = [Customer 1, Customer 2, Customer 3]
Sequences:
  Customer 1: 1.1, 1.2, 1.3
  Customer 2: 2.1, 2.2
  Customer 3: 3.1
```

**Action**: Drag Customer 3 to top

**After**:
```
Unit.customers = [Customer 3, Customer 1, Customer 2]
Sequences:
  Customer 3: 1.1 (was 3.1)
  Customer 1: 2.1, 2.2, 2.3 (was 1.1, 1.2, 1.3)
  Customer 2: 3.1, 3.2 (was 2.1, 2.2)
```

**Calculation**:
```
newCustomerIds = [3, 1, 2]
newCustomerIds.forEach((cid, idx) => {
  customerIndex = idx + 1
  // idx=0: customerIndex=1, cid=3
  // idx=1: customerIndex=2, cid=1
  // idx=2: customerIndex=3, cid=2
})
```

### Scenario 2: Drag Order C to Position 1 Within Customer 1

**Before**:
```
Customer 1.orders = [Order A, Order B, Order C]
Sequences: 1.1, 1.2, 1.3
```

**Action**: Drag Order C to top

**After**:
```
Customer 1.orders = [Order C, Order A, Order B]
Sequences: 1.1, 1.2, 1.3 (values change, but indices stay same)
  Order C: 1.1 (was 1.3)
  Order A: 1.2 (was 1.1)
  Order B: 1.3 (was 1.2)
```

**Calculation**:
```
customerIndex = 1 (stays same)
customerOrderIds = [C, A, B]
customerOrderIds.forEach((orderId, idx) => {
  orderIndex = idx + 1
  newSeq = 1 * 1000 + (idx + 1)
  // idx=0: orderIndex=1, newSeq=1001
  // idx=1: orderIndex=2, newSeq=1002
  // idx=2: orderIndex=3, newSeq=1003
})
```

## DnD Container Hierarchy

### OLD (Suburb-Scoped) - ❌ WRONG
```
DndContext
├── SortableContext (unit-level)
│   ├── SortableContext (suburb-level) ← PROBLEM: Limits to suburb
│   │   ├── SortableCustomer (Customer 1)
│   │   ├── SortableCustomer (Customer 2)
│   │   └── SortableCustomer (Customer 3)
│   └── SortableContext (suburb-level)
│       └── SortableCustomer (Customer 4)
```

### NEW (Unit-Level) - ✅ CORRECT
```
DndContext
├── SortableContext (unit-level)
│   ├── SortableCustomer (Customer 1)
│   ├── SortableCustomer (Customer 2)
│   ├── SortableCustomer (Customer 3)
│   └── SortableCustomer (Customer 4)
└── SortableContext (per-customer)
    ├── SortableOrder (Order 1)
    ├── SortableOrder (Order 2)
    └── SortableOrder (Order 3)
```

## Sequence Calculation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User drags Customer X to new position                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ handleCustomerReorder(active, over, dragData)              │
│ - Extract: unitId, customerIds (ALL unit customers)        │
│ - Calculate: oldIndex, newIndex                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ arrayMove(customerIds, oldIndex, newIndex)                 │
│ Result: newCustomerIds = reordered list                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ For each customer in newCustomerIds:                        │
│   customerIndex = position + 1 (1-based)                   │
│   For each order in customer:                              │
│     orderIndex = position + 1 (1-based)                    │
│     newSeq = customerIndex * 1000 + orderIndex             │
│     assignments.push({order_id, stop_sequence: newSeq})    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ setAssignedUnits(prev => {                                 │
│   // Update local state with new sequences                 │
│   return updated unit with new customers order             │
│ })                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ fetchData('plans/{planId}/bulk-assign', 'POST', {          │
│   assignments: [{                                          │
│     planned_unit_id: unitId,                               │
│     orders: assignments                                    │
│   }]                                                        │
│ })                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend processes and returns updated state                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ setAssignmentPreview({                                     │
│   units: res?.units,                                       │
│   unassigned_orders: res?.unassigned_orders,               │
│   plan: res?.plan                                          │
│ })                                                          │
│ ← Syncs backend state with UI                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ useEffect watches assignment_preview and updates:          │
│ - setAssignedUnits(assignment_preview.units)               │
│ - setUnassigned(assignment_preview.unassigned_orders)      │
│ - setPlan(assignment_preview.plan)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ UI re-renders with new sequences                           │
│ Sequences display as X.Y format (e.g., "3.2")              │
└─────────────────────────────────────────────────────────────┘
```

## Sequence Display Logic

```javascript
// In SortableOrder.jsx
const raw = order.stop_sequence  // e.g., 3002

const customerSeq = Math.floor(raw / 1000)  // 3
const orderSeq = raw % 1000                 // 2

displaySequence = `${customerSeq}.${orderSeq}`  // "3.2"

// Display: "Sequence #3.2"
```

## Duplicate Prevention Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User drags order from unassigned to unit                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ handleAssignItem(itemId, vehicleId)                        │
│ Check: alreadyExists = unit.orders.some(o =>               │
│   String(o.order_id) === String(itemId)                    │
│ )                                                           │
│ If alreadyExists: return (don't add)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ setUnassigned(prev =>                                      │
│   prev.filter(x => String(x.order_id) !== String(itemId))  │
│ )                                                           │
│ ← Remove from unassigned                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ setAssignedUnits(prev =>                                   │
│   prev.map(u => {                                          │
│     if (u.planned_unit_id === vehicleId) {                 │
│       return {...u, orders: [...u.orders, order]}          │
│     }                                                       │
│     return u                                               │
│   })                                                        │
│ )                                                           │
│ ← Add to unit                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ commitImmediateMove() calls API                            │
│ Backend returns: {units, unassigned_orders, plan}          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ setAssignmentPreview({                                     │
│   units: res?.units,                                       │
│   unassigned_orders: res?.unassigned_orders,               │
│   plan: res?.plan                                          │
│ })                                                          │
│ ← Sync with backend state                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ useEffect watches assignment_preview                       │
│ Re-syncs: assignedUnits, unassigned, plan                  │
│ ← Ensures no duplicates from stale state                    │
└─────────────────────────────────────────────────────────────┘
```

## Key Differences: OLD vs NEW

| Aspect | OLD (Suburb-Scoped) | NEW (Unit-Level) |
|--------|-------------------|-----------------|
| **Container** | `unit-customers:${unitId}:${suburbKey}` | `unit-customers:${unitId}` |
| **Customers** | Limited to suburb group | ALL unit customers |
| **Drag Range** | Can't drag between suburbs | Can drag between any suburb |
| **Sequence** | Suburb-local index | Global unit index |
| **Sync** | No assignment_preview sync | Syncs after API call |

## Example: Moving Customer Between Suburbs

### OLD (Suburb-Scoped) - ❌ WOULDN'T WORK
```
Route A
├── Suburb 1
│   ├── Customer 1 (1.1, 1.2)
│   └── Customer 2 (2.1)
└── Suburb 2
    └── Customer 3 (1.1) ← Can't drag here from Suburb 1
```

### NEW (Unit-Level) - ✅ WORKS
```
Route A
├── Suburb 1
│   ├── Customer 1 (1.1, 1.2)
│   └── Customer 2 (2.1)
└── Suburb 2
    └── Customer 3 (3.1) ← Can drag Customer 3 here!
                          ← Becomes position 3 in unit
```

After dragging Customer 3 to Suburb 1:
```
Route A
├── Suburb 1
│   ├── Customer 1 (1.1, 1.2)
│   ├── Customer 2 (2.1)
│   └── Customer 3 (3.1) ← Now position 3 in unit
└── Suburb 2
    └── (empty)
```
