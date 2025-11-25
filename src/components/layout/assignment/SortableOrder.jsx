// SortableOrder.jsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DraggableItemRow } from './DraggableItemRow'

export function SortableOrder({ order, unit, customer, customerOrderIds }) {
  const unitId = unit.planned_unit_id || unit.plan_unit_id

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `order-${order.order_id}`,
    data: {
      // identify this as an internal sortable order
      type: 'sortable-order',

      // make it look like a normal draggable to handleDragEnd
      containerId: `unit:${unitId}`,
      item_id: order.order_id,
      order_id: order.order_id,
      orderId: order.order_id, // 🔴 used by handleSortableReorder
      weight: order.total_assigned_weight_kg || 0,

      // extra info for resequencing
      unitId,
      customerId: customer.customer_id,
      route_name: customer.route_name,
      suburb_name: customer.suburb_name,
      customerOrderIds:
        Array.isArray(customerOrderIds) && customerOrderIds.length
          ? customerOrderIds
          : (customer.orders || []).map((o) => o.order_id),
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // const hasSequence =
  //   typeof order.stop_sequence === 'number' &&
  //   !Number.isNaN(order.stop_sequence)

  const hasSequence =
    typeof order.stop_sequence === 'number' &&
    !Number.isNaN(order.stop_sequence)

  let displaySequence = null
  if (hasSequence) {
    const raw = order.stop_sequence
    const customerSeq = Math.floor(raw / 1000)
    const orderSeq = raw % 1000

    if (customerSeq > 0 && orderSeq > 0) {
      displaySequence = `${customerSeq}.${orderSeq}`
    } else {
      displaySequence = String(raw)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* {hasSequence && (
        <div className="absolute -left-2 -top-2 z-10">
          <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 shadow-sm">
            #{order.stop_sequence}
          </span>
        </div>
      )} */}

      {hasSequence && (
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Sequence
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground">
            #{displaySequence}
          </span>
        </div>
      )}

      <DraggableItemRow
        item={{
          id: `order-${order.order_id}`,
          order_number: order.items?.[0]?.order_number || 'N/A',
          order_id: order.order_id,
          items: order.items || [],
          itemCount: order.items?.length || 0,
          totalWeight: order.total_assigned_weight_kg || 0,
          customer_name: customer.customer_name,
          route_name: customer.route_name,
          suburb_name: customer.suburb_name,
          weight_left: order.total_assigned_weight_kg || 0,
          description: `Order ${order.items?.[0]?.order_number || 'N/A'} - ${
            customer.customer_name
          } (${order.items?.length || 0} items)`,
          isOrderGroup: true,
          stop_sequence: order.stop_sequence,
        }}
        containerId={`unit:${unitId}`}
        // While sortable is dragging, prevent DraggableItemRow from also trying to drag
        isDraggable={!isDragging}
        isOrderGroup
        dragHandleProps={{
          attributes,
          listeners,
        }}
      />
    </div>
  )
}
