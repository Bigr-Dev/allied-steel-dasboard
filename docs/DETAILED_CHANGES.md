# Detailed Line-by-Line Changes

## File 1: Sortable-customer.jsx

### BEFORE (Old Version)
```javascript
export function SortableCustomer({
  id,
  unit,
  customer,
  suburbKey,
  customersInGroup,
  children,
}) {
  const unitId = unit.planned_unit_id || unit.plan_unit_id

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: 'sortable-customer',
      unitId,
      customerId: customer.customer_id,
      suburbKey,
      // visible ordering for this suburb group
      customerIds: (customersInGroup || []).map((c) => c.customer_id),
      containerId: `unit-customers:${unitId}:${suburbKey}`,
    },
  })
```

### AFTER (New Version)
```javascript
export function SortableCustomer({
  id,
  unit,
  customer,
  children,
}) {
  const unitId = unit.planned_unit_id || unit.plan_unit_id

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: 'sortable-customer',
      unitId,
      customerId: customer.customer_id,
      // ALL customers in the unit, not just suburb-scoped
      customerIds: (unit.customers || []).map((c) => c.customer_id),
      containerId: `unit-customers:${unitId}`,
    },
  })
```

**Changes**:
- Line 3-4: Removed `suburbKey` and `customersInGroup` parameters
- Line 24: Changed from `(customersInGroup || [])` to `(unit.customers || [])`
- Line 25: Changed from `unit-customers:${unitId}:${suburbKey}` to `unit-customers:${unitId}`

---

## File 2: VehicleCard.jsx

### BEFORE (Old Version)
```javascript
return (
  <SortableCustomer
    key={sortableId}
    id={sortableId}
    unit={unit}
    customer={customer}
    suburbKey={suburbKey}
    customersInGroup={sortedCustomers}
  >
```

### AFTER (New Version)
```javascript
return (
  <SortableCustomer
    key={sortableId}
    id={sortableId}
    unit={unit}
    customer={customer}
  >
```

**Changes**:
- Removed `suburbKey={suburbKey}` prop
- Removed `customersInGroup={sortedCustomers}` prop

---

## File 3: load-assignment-single.jsx - handleCustomerReorder

### BEFORE (Old Version)
```javascript
const handleCustomerReorder = async (active, over, dragData) => {
  if (!over) return
  const overData = over.data.current
  if (!overData || overData.type !== 'sortable-customer') return

  const { unitId, suburbKey, customerIds } = dragData  // ← INCLUDES suburbKey
  const activeCustomerId = dragData.customerId
  const overCustomerId = overData.customerId

  if (
    !Array.isArray(customerIds) ||
    customerIds.length === 0 ||
    activeCustomerId === overCustomerId
  ) {
    return
  }

  const oldIndex = customerIds.findIndex(
    (id) => String(id) === String(activeCustomerId)
  )
  const newIndex = customerIds.findIndex(
    (id) => String(id) === String(overCustomerId)
  )

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

  const newCustomerIds = arrayMove(customerIds, oldIndex, newIndex)

  const planId = plan?.id || data?.plan?.id
  if (!planId) {
    toast({ title: 'Error', description: 'Plan ID not found' })
    return
  }

  const assignments = []

  setAssignedUnits((prev) =>
    prev.map((u) => {
      if (String(u.planned_unit_id) !== String(unitId)) return u

      const existingCustomers = u.customers || []
      const customerMap = new Map(
        existingCustomers.map((c) => [String(c.customer_id), c])
      )

      const updatedCustomers = existingCustomers.slice()

      // Reorder only the customers in this suburb group
      const reorderedForGroup = newCustomerIds
        .map((cid, idx) => {
          const key = String(cid)
          const existing = customerMap.get(key)
          if (!existing) return null

          const customerIndex = idx + 1 // 1-based for this suburb group  ← WRONG COMMENT

          const updatedOrders = (existing.orders || []).map(
            (order, orderIdx) => {
              const orderIndex = orderIdx + 1
              const newSequence = customerIndex * 1000 + orderIndex

              assignments.push({
                order_id: order.order_id,
                stop_sequence: newSequence,
                sales_order_number:
                  order.sales_order_number ||
                  order.items?.[0]?.order_number ||
                  null,
              })

              return {
                ...order,
                stop_sequence: newSequence,
              }
            }
          )

          return {
            ...existing,
            orders: updatedOrders,
          }
        })
        .filter(Boolean)

      // Merge reordered customers back into the full list
      const updatedById = new Map(
        (reorderedForGroup || []).map((c) => [String(c.customer_id), c])
      )

      const finalCustomers = updatedCustomers.map((c) => {
        const overridden = updatedById.get(String(c.customer_id))
        return overridden || c
      })

      // Also update flat orders view to stay in sync
      const flatOrders = finalCustomers.flatMap((c) => c.orders || [])

      return {
        ...u,
        customers: finalCustomers,
        orders: flatOrders.length ? flatOrders : u.orders,
      }
    })
  )

  if (!assignments.length) return

  try {
    await fetchData(`plans/${planId}/bulk-assign`, 'POST', {
      plan_id: planId,
      assignments: [
        {
          planned_unit_id: unitId,
          orders: assignments.map((o) => ({\
            order_id: o.order_id,
            stop_sequence: o.stop_sequence,
            sales_order_number: o.sales_order_number,
          })),
        },
      ],
    })

    toast({
      title: 'Saved',
      description: 'Customer sequence updated',
    })
  } catch (error) {
    handleAPIError(error, toast)
    // Optional: you can refetch assignment_preview here to fully resync
  }
}
```

### AFTER (New Version)
```javascript
const handleCustomerReorder = async (active, over, dragData) => {
  if (!over) return
  const overData = over.data.current
  if (!overData || overData.type !== 'sortable-customer') return

  const { unitId, customerIds } = dragData  // ← REMOVED suburbKey
  const activeCustomerId = dragData.customerId
  const overCustomerId = overData.customerId

  if (
    !Array.isArray(customerIds) ||
    customerIds.length === 0 ||
    activeCustomerId === overCustomerId
  ) {
    return
  }

  const oldIndex = customerIds.findIndex(
    (id) => String(id) === String(activeCustomerId)
  )
  const newIndex = customerIds.findIndex(
    (id) => String(id) === String(overCustomerId)
  )

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

  const newCustomerIds = arrayMove(customerIds, oldIndex, newIndex)

  const planId = plan?.id || data?.plan?.id
  if (!planId) {
    toast({ title: 'Error', description: 'Plan ID not found' })
    return
  }

  const assignments = []

  setAssignedUnits((prev) =>
    prev.map((u) => {
      if (String(u.planned_unit_id) !== String(unitId)) return u

      const existingCustomers = u.customers || []
      const customerMap = new Map(
        existingCustomers.map((c) => [String(c.customer_id), c])
      )

      // Reorder ALL customers in the unit globally  ← UPDATED COMMENT
      const reorderedCustomers = newCustomerIds  // ← RENAMED from reorderedForGroup
        .map((cid, idx) => {
          const key = String(cid)
          const existing = customerMap.get(key)
          if (!existing) return null

          const customerIndex = idx + 1 // 1-based position in unit  ← UPDATED COMMENT

          const updatedOrders = (existing.orders || []).map(
            (order, orderIdx) => {
              const orderIndex = orderIdx + 1
              const newSeq = customerIndex * 1000 + orderIndex  // ← RENAMED to newSeq

              assignments.push({
                order_id: order.order_id,
                stop_sequence: newSeq,
                sales_order_number:
                  order.sales_order_number ||
                  order.items?.[0]?.order_number ||
                  null,
              })

              return {
                ...order,
                stop_sequence: newSeq,
              }
            }
          )

          return {
            ...existing,
            orders: updatedOrders,
          }
        })
        .filter(Boolean)

      // Merge reordered customers back into the full list
      const updatedById = new Map(
        (reorderedCustomers || []).map((c) => [String(c.customer_id), c])  // ← UPDATED
      )

      const finalCustomers = existingCustomers.map((c) => {  // ← CHANGED from updatedCustomers
        const overridden = updatedById.get(String(c.customer_id))
        return overridden || c
      })

      // Also update flat orders view to stay in sync
      const flatOrders = finalCustomers.flatMap((c) => c.orders || [])

      return {
        ...u,
        customers: finalCustomers,
        orders: flatOrders.length ? flatOrders : u.orders,
      }
    })
  )

  if (!assignments.length) return

  try {
    const res = await fetchData(`plans/${planId}/bulk-assign`, 'POST', {  // ← CAPTURE res
      plan_id: planId,
      assignments: [
        {
          planned_unit_id: unitId,
          orders: assignments.map((o) => ({
            order_id: o.order_id,
            stop_sequence: o.stop_sequence,
            sales_order_number: o.sales_order_number,
          })),
        },
      ],
    })

    // KEEP the duplicate-fix pattern: sync assignment_preview when res is available  ← NEW
    if (typeof setAssignmentPreview === 'function' && res) {  // ← NEW
      setAssignmentPreview({  // ← NEW
        units: res?.units,  // ← NEW
        unassigned_orders: res?.unassigned_orders,  // ← NEW
        plan: res?.plan,  // ← NEW
      })  // ← NEW
    }  // ← NEW

    toast({
      title: 'Saved',
      description: 'Customer sequence updated',
    })
  } catch (error) {
    handleAPIError(error, toast)
  }
}
```

**Key Changes**:
1. Line 6: Removed `suburbKey` from destructuring
2. Line 44: Changed comment from "suburb group" to "unit globally"
3. Line 45: Renamed `reorderedForGroup` to `reorderedCustomers`
4. Line 56: Renamed `newSequence` to `newSeq` for consistency
5. Line 75: Updated reference from `reorderedForGroup` to `reorderedCustomers`
6. Line 80: Changed from `updatedCustomers` to `existingCustomers`
7. Line 95: Added `const res =` to capture API response
8. Lines 108-114: Added `setAssignmentPreview` sync (NEW - critical for duplicate-fix)

---

## Summary of Changes

### Sortable-customer.jsx
- **Removed**: 2 parameters (`suburbKey`, `customersInGroup`)
- **Changed**: 2 lines (customerIds source, containerId)

### VehicleCard.jsx
- **Removed**: 2 props from SortableCustomer call

### load-assignment-single.jsx
- **Removed**: 1 parameter from destructuring (`suburbKey`)
- **Changed**: 1 variable name (`reorderedForGroup` → `reorderedCustomers`)
- **Added**: 7 lines for `setAssignmentPreview` sync
- **Updated**: 2 comments for clarity

**Total Impact**: Minimal, focused changes that enable hierarchical sequencing while preserving all duplicate-fix logic.
