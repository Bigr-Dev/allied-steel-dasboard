'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}
