'use client'
import { useGlobalContext } from '@/context/global-context'
import { useToast } from '@/hooks/use-toast'
import { handleAPIError } from '@/lib/api-client'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { useMemo, useState, useEffect, useRef } from 'react'
import DetailActionBar from '../layout/detail-action-bar'
import { UnassignedList } from '../layout/assignment/UnassignedList'
import { VehicleCard } from '../layout/assignment/VehicleCard'
import { createPortal } from 'react-dom'

// helpers
// Take a unit from buildPlanPayload and make it look like what VehicleCard expects
function hydrateUnitFromPlanPayload(rawUnit) {
  const vehicle = rawUnit.vehicle || null
  const trailer = rawUnit.trailer || null
  const vehicleType = rawUnit.vehicle_type

  // capacity_kg rule: horse uses trailer’s capacity, rigid uses its own
  const capacity_kg =
    vehicleType === 'horse'
      ? Number(trailer?.capacity_kg ?? 0)
      : Number(vehicle?.capacity_kg ?? 0)

  // Build customers -> orders -> items from rawUnit.orders[].lines[]
  const customersMap = new Map()

  ;(rawUnit.orders || []).forEach((order) => {
    const key = [
      order.customer_id || '',
      order.customer_name || '',
      order.route_name || '',
      order.suburb_name || '',
    ].join('|')

    if (!customersMap.has(key)) {
      customersMap.set(key, {
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        route_name: order.route_name,
        suburb_name: order.suburb_name,
        orders: [],
      })
    }

    const customer = customersMap.get(key)

    const items = (order.lines || []).map((line) => {
      const weight = Number(line.weight || 0)
      return {
        item_id: line.order_line_id,
        description: line.description,
        assigned_weight_kg: weight,
        assignment_id: `server-${line.order_line_id}`,
        order_number: order.sales_order_number,
        order_id: order.order_id,
      }
    })

    const totalWeight = items.reduce(
      (sum, it) => sum + (it.assigned_weight_kg || 0),
      0
    )

    customer.orders.push({
      order_id: order.order_id,
      total_assigned_weight_kg: totalWeight,
      stop_sequence: order.stop_sequence,
      items,
    })
  })

  const customers = Array.from(customersMap.values())

  // sort orders for each customer by stop_sequence (defined first)
  customers.forEach((customer) => {
    customer.orders = (customer.orders || []).slice().sort((a, b) => {
      const aSeq =
        typeof a.stop_sequence === 'number' && !Number.isNaN(a.stop_sequence)
          ? a.stop_sequence
          : Number.MAX_SAFE_INTEGER
      const bSeq =
        typeof b.stop_sequence === 'number' && !Number.isNaN(b.stop_sequence)
          ? b.stop_sequence
          : Number.MAX_SAFE_INTEGER
      return aSeq - bSeq
    })
  })

  const used_capacity_kg = customers
    .flatMap((c) => c.orders || [])
    .flatMap((o) => o.items || [])
    .reduce((sum, it) => sum + (it.assigned_weight_kg || 0), 0)

  const unit_type =
    vehicleType === 'rigid'
      ? 'rigid'
      : vehicleType === 'horse'
      ? trailer
        ? 'horse+trailer'
        : 'horse'
      : 'unknown'

  // Give VehicleCard the shape it expects: rigid / horse / trailer objects with fleet_number & plate
  const rigid =
    vehicleType === 'rigid' && vehicle
      ? {
          ...vehicle,
          fleet_number: vehicle.fleet_number || vehicle.reg_number,
          plate: vehicle.plate || vehicle.license_plate,
        }
      : null

  const horse =
    vehicleType === 'horse' && vehicle
      ? {
          ...vehicle,
          fleet_number: vehicle.fleet_number || vehicle.reg_number,
          plate: vehicle.plate || vehicle.license_plate,
        }
      : null

  const normTrailer = trailer
    ? {
        ...trailer,
        fleet_number: trailer.fleet_number || trailer.reg_number,
        plate: trailer.plate || trailer.license_plate,
      }
    : null

  return {
    ...rawUnit,
    unit_type,
    rigid,
    horse,
    trailer: normTrailer,
    customers,
    capacity_kg,
    used_capacity_kg,
  }
}

// Build the bucket items for UnassignedList from buildPlanPayload.unassigned_orders
// IMPORTANT: requires backend to attach `lines` to each unassigned order (same as units.orders)
function buildUnassignedItems(unassignedOrders = []) {
  const items = []

  unassignedOrders.forEach((order) => {
    ;(order.lines || []).forEach((line) => {
      items.push({
        item_id: line.order_line_id,
        description: line.description,
        weight_left: Number(line.weight || 0),
        volume_left: null,
        order_id: order.order_id,
        order_number: order.sales_order_number,
        route_name: order.route_name,
        suburb_name: order.suburb_name,
        customer_id: order.customer_id,
        customer_name: order.customer_name,
      })
    })
  })

  return items
}

async function commitImmediateMove(
  planId,
  payload,
  fetchData,
  setAssignmentPreview
) {
  const {
    item_id,
    order_id,
    order_ids,
    from_plan_unit_id,
    to_plan_unit_id,
    stop_sequence,
  } = payload

  const cleanOrderId = (order_id || item_id || '').replace(/^order-/, '')

  const fromUnitId =
    from_plan_unit_id && from_plan_unit_id !== 'undefined'
      ? from_plan_unit_id
      : null
  const toUnitId =
    to_plan_unit_id && to_plan_unit_id !== 'undefined' ? to_plan_unit_id : null

  // A) Bucket → Unit (assign)
  if (!fromUnitId && toUnitId) {
    const res = await fetchData(`plans/${planId}/bulk-assign`, 'POST', {
      plan_id: planId,
      assignments: [
        {
          planned_unit_id: toUnitId,
          orders: [
            {
              order_id: cleanOrderId,
              ...(typeof stop_sequence === 'number' &&
                !Number.isNaN(stop_sequence) && {
                  stop_sequence,
                }),
            },
          ],
        },
      ],
    })
    if (typeof setAssignmentPreview === 'function' && res) {
      setAssignmentPreview({
        units: res?.units,
        unassigned_orders: res?.unassigned_orders,
        plan: res?.plan,
      })
    }
    return
  }

  // B) Unit → Bucket (unassign)
  if (fromUnitId && !toUnitId) {
    const idsToUnassign =
      Array.isArray(order_ids) && order_ids.length > 0
        ? order_ids
        : cleanOrderId
        ? [cleanOrderId]
        : []

    const res = await fetchData(`plans/${planId}/unassign`, 'POST', {
      plan_id: planId,
      planned_unit_id: fromUnitId,
      order_ids: idsToUnassign,
    })

    if (typeof setAssignmentPreview === 'function' && res) {
      setAssignmentPreview({
        units: res?.units,
        unassigned_orders: res?.unassigned_orders,
        plan: res?.plan,
      })
    }
    return
  }

  // C) Unit → Unit (move)
  if (fromUnitId && toUnitId && fromUnitId !== toUnitId) {
    await fetchData(`plans/${planId}/unassign`, 'POST', {
      plan_id: planId,
      planned_unit_id: fromUnitId,
      order_ids: [cleanOrderId],
    })

    await fetchData(`plans/${planId}/bulk-assign`, 'POST', {
      plan_id: planId,
      assignments: [
        {
          planned_unit_id: toUnitId,
          orders: [
            {
              order_id: cleanOrderId,
              ...(typeof stop_sequence === 'number' &&
                !Number.isNaN(stop_sequence) && {
                  stop_sequence,
                }),
            },
          ],
        },
      ],
    })
    return
  }

  console.log('No matching case found!')
}

function removeItemFromUnitCustomers(customers = [], item_id) {
  let removedWeight = 0
  const nextCustomers = customers
    .map((c) => {
      const nextOrders = (c.orders || [])
        .map((o) => {
          const before = o.items || []
          const kept = before.filter((it) => it.item_id !== item_id)
          if (kept.length !== before.length) {
            const removed = before.find((it) => it.item_id === item_id)
            removedWeight += Number(removed?.assigned_weight_kg || 0)
          }
          return {
            ...o,
            items: kept,
            total_assigned_weight_kg:
              Number(o.total_assigned_weight_kg || 0) -
              Number(
                (o.items || []).find((it) => it.item_id === item_id)
                  ?.assigned_weight_kg || 0
              ),
          }
        })
        .filter((o) => (o.items || []).length > 0)
      return { ...c, orders: nextOrders }
    })
    .filter((c) => (c.orders || []).length > 0)

  return { nextCustomers, removedWeight }
}

const norm = (s) => (s == null ? '' : String(s).trim().toLowerCase())
const sameCustomerIdOrName = (aId, aName, bId, bName) => {
  const aHas = aId != null && aId !== ''
  const bHas = bId != null && bId !== ''
  if (aHas && bHas) return String(aId) === String(bId)
  return norm(aName) === norm(bName)
}
const sameGroup = (c, meta) =>
  sameCustomerIdOrName(
    c.customer_id,
    c.customer_name,
    meta.customer_id,
    meta.customer_name
  ) &&
  norm(c.route_name) === norm(meta.route_name) &&
  norm(c.suburb_name) === norm(meta.suburb_name)

function addItemIntoUnitCustomers(customers = [], meta) {
  const {
    customer_id,
    customer_name,
    route_name,
    suburb_name,
    order_id,
    item_id,
    description,
    weight_left,
  } = meta

  let next = customers.map((c) => ({
    ...c,
    orders: (c.orders || []).map((o) => ({
      ...o,
      items: [...(o.items || [])],
    })),
  }))

  let cIdx = next.findIndex((c) => sameGroup(c, meta))

  if (cIdx === -1) {
    const candidates = next
      .map((c, idx) => ({ c, idx }))
      .filter(({ c }) =>
        sameCustomerIdOrName(
          c.customer_id,
          c.customer_name,
          customer_id,
          customer_name
        )
      )
    if (candidates.length) {
      const rn = norm(route_name)
      const sn = norm(suburb_name)
      const exactBoth = candidates.find(
        ({ c }) => norm(c.route_name) === rn && norm(c.suburb_name) === sn
      )
      const exactRoute = candidates.find(({ c }) => norm(c.route_name) === rn)
      const exactSuburb = candidates.find(({ c }) => norm(c.suburb_name) === sn)
      cIdx = (exactBoth || exactRoute || exactSuburb || candidates[0]).idx
    }
  }

  if (cIdx === -1) {
    next = [
      ...next,
      {
        customer_id,
        customer_name,
        route_name: route_name || null,
        suburb_name: suburb_name || null,
        orders: [],
      },
    ]
    cIdx = next.length - 1
  }

  const cust = next[cIdx]
  let oIdx = (cust.orders || []).findIndex(
    (o) => String(o.order_id) === String(order_id)
  )
  if (oIdx === -1) {
    next[cIdx] = {
      ...cust,
      orders: [
        ...(cust.orders || []),
        { order_id, total_assigned_weight_kg: 0, items: [] },
      ],
    }
    oIdx = next[cIdx].orders.length - 1
  }

  const order = next[cIdx].orders[oIdx]
  if (
    (order.items || []).some((it) => String(it.item_id) === String(item_id))
  ) {
    return { nextCustomers: next, addedWeight: 0 }
  }

  const w = Number(weight_left || 0)
  const nextItems = [
    ...(order.items || []),
    {
      item_id,
      description,
      assigned_weight_kg: w,
      assignment_id: `local-${item_id}`,
      order_number: meta.order_number,
    },
  ]
  const nextOrder = {
    ...order,
    items: nextItems,
    total_assigned_weight_kg: Number(order.total_assigned_weight_kg || 0) + w,
  }

  const ordersCopy = [...next[cIdx].orders]
  ordersCopy[oIdx] = nextOrder
  next[cIdx] = { ...next[cIdx], orders: ordersCopy }

  return { nextCustomers: next, addedWeight: w }
}

const LoadAssignmentSingle = ({ id, data }) => {
  const { assignment_preview, setAssignmentPreview, fetchData } =
    useGlobalContext()
  const { toast } = useToast()

  const [assignedUnits, setAssignedUnits] = useState(
    assignment_preview?.data?.units || []
  )
  const [unassigned, setUnassigned] = useState(
    assignment_preview?.data?.unassigned_orders || []
  )

  const [plan, setPlan] = useState(assignment_preview?.data?.plan || null)
  const [activeItem, setActiveItem] = useState(null)
  const [undoStack, setUndoStack] = useState([])
  const [changes, setChanges] = useState([])
  const [loading, setLoading] = useState(false)

  const initialSnapshotRef = useRef({
    plan: data?.plan || null,
    units: JSON.parse(JSON.stringify(data?.units || [])),
    unassigned_orders: JSON.parse(
      JSON.stringify(data?.unassigned_orders || [])
    ),
  })

  useEffect(() => {
    initialSnapshotRef.current = {
      plan: data?.plan || null,
      units: JSON.parse(JSON.stringify(data?.units || [])),
      unassigned_orders: JSON.parse(
        JSON.stringify(data?.unassigned_orders || [])
      ),
    }
    setAssignedUnits(data?.units || [])
    setUnassigned(data?.unassigned_orders || [])
    setPlan(data?.plan || null)
    setChanges([])
    setUndoStack([])
    setAssignmentPreview({
      plan: data?.plan || null,
      units: data?.units,
      unassigned_orders: data?.unassigned_orders,
    })
  }, [data, setAssignmentPreview])

  useEffect(() => {
    if (assignment_preview?.units) {
      setAssignedUnits(assignment_preview.units)
      setUnassigned(assignment_preview.unassigned_orders || [])
      setPlan(assignment_preview.plan || data?.plan || null)
    }
  }, [assignment_preview?.units, assignment_preview?.unassigned_orders])

  const planned_unit = assignedUnits?.find((v) => v.planned_unit_id === id)

  // const getNextStopSequenceForUnit = (unitId) => {
  //   if (!unitId) return 1

  //   const unit = assignedUnits.find(
  //     (u) => String(u.planned_unit_id) === String(unitId)
  //   )
  //   if (!unit) return 1

  //   const orders = unit.orders || []

  //   const seqs = orders.map((o, idx) =>
  //     typeof o.stop_sequence === 'number' && !Number.isNaN(o.stop_sequence)
  //       ? o.stop_sequence
  //       : idx + 1
  //   )

  //   if (!seqs.length) return 1

  //   const max = Math.max(...seqs)
  //   return (Number.isFinite(max) ? max : 0) + 1
  // }

  const getCustomerIndexInUnit = (unitId, customerId) => {
    const unit = assignedUnits.find(
      (u) => String(u.planned_unit_id) === String(unitId)
    )
    if (!unit) return 1

    const customers = unit.customers || []
    const idx = customers.findIndex(
      (c) => String(c.customer_id) === String(customerId)
    )

    return idx === -1 ? 1 : idx + 1 // 1-based
  }

  const getNextStopSequenceForUnit = (unitId) => {
    if (!unitId) return 1

    const unit = assignedUnits.find(
      (u) => String(u.planned_unit_id) === String(unitId)
    )
    if (!unit) return 1

    const orders =
      (unit.customers || []).flatMap((c) => c.orders || []) || unit.orders || []

    const seqs = orders.map((o, idx) =>
      typeof o.stop_sequence === 'number' && !Number.isNaN(o.stop_sequence)
        ? o.stop_sequence
        : idx + 1
    )

    if (!seqs.length) return 1

    const max = Math.max(...seqs)
    return (Number.isFinite(max) ? max : 0) + 1
  }

  const handleOrderResequence = async (
    unitId,
    orderId,
    newSequence,
    { silent } = {}
  ) => {
    const planId = plan?.id || data?.plan?.id
    if (!planId) {
      if (!silent) {
        toast({ title: 'Error', description: 'Plan ID not found' })
      }
      return
    }

    const unit = assignedUnits.find(
      (u) => String(u.planned_unit_id) === String(unitId)
    )
    const order = unit?.orders?.find(
      (o) => String(o.order_id) === String(orderId)
    )

    if (!order) {
      if (!silent) {
        toast({ title: 'Error', description: 'Order not found' })
      }
      return
    }

    try {
      await fetchData(`plans/${planId}/bulk-assign`, 'POST', {
        plan_id: planId,
        assignments: [
          {
            planned_unit_id: unitId,
            orders: [
              {
                order_id: orderId,
                stop_sequence: newSequence,
                sales_order_number: order.sales_order_number,
              },
            ],
          },
        ],
      })

      setAssignedUnits((prev) =>
        prev.map((u) => {
          if (String(u.planned_unit_id) !== String(unitId)) return u
          return {
            ...u,
            orders: (u.orders || []).map((ord) =>
              String(ord.order_id) === String(orderId)
                ? { ...ord, stop_sequence: newSequence }
                : ord
            ),
          }
        })
      )

      if (!silent) {
        toast({ title: 'Success', description: 'Order sequence updated' })
      }
    } catch (error) {
      handleAPIError(error, toast)
    }
  }

  const onUnassignAll = async (plannedUnitId) => {
    setLoading(true)

    const unit = assignedUnits?.find((u) => u.planned_unit_id === plannedUnitId)

    if (!unit) {
      setLoading(false)
      return
    }

    const orderIds = (unit.orders || [])
      .map((order) => order.order_id)
      .filter(Boolean)

    const planId = data?.plan?.id || plan?.id

    if (!planId) {
      toast({ title: 'Error', description: 'Plan ID not found' })
      setLoading(false)
      return
    }

    try {
      const payload = {
        plan_id: planId,
        from_plan_unit_id: plannedUnitId,
        order_ids: orderIds,
      }
      await commitImmediateMove(
        planId,
        payload,
        fetchData,
        setAssignmentPreview
      )

      toast({ title: 'Success', description: 'All items unassigned from unit' })
    } catch (error) {
      console.error('❌ Error unassigning all:', error)
      toast({ title: 'Error', description: 'Failed to unassign items' })
    } finally {
      setLoading(false)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 12,
        delay: 100,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const itemLookupMap = useMemo(() => {
    const map = new Map()

    unassigned.forEach((order) => {
      map.set(order.order_id, {
        item: order,
        sourceType: 'unassigned',
        sourceVehicleId: null,
      })
      map.set(`order-${order.order_id}`, {
        item: order,
        sourceType: 'unassigned',
        sourceVehicleId: null,
      })
    })

    assignedUnits.forEach((unit) => {
      unit.orders?.forEach((order) => {
        order.order_lines?.forEach((line) => {
          map.set(line.order_line_id, {
            item: {
              ...line,
              customer_name: order.customer_name,
              route_name: order.route_name,
              suburb_name: order.suburb_name,
              order_id: order.order_id,
              sales_order_number: order.sales_order_number,
            },
            sourceType: 'assigned',
            sourceVehicleId: unit.planned_unit_id,
          })
        })
      })
    })

    return map
  }, [assignedUnits, unassigned])

  const handleDragStart = (event) => {
    const { active } = event
    const lookupResult = itemLookupMap.get(active.id)

    if (lookupResult) {
      setActiveItem(lookupResult)
    }
  }

  // const handleSortableReorder = (active, over, dragData) => {
  //   if (!over) return
  //   const overData = over.data.current
  //   if (!overData || overData.type !== 'sortable-order') return

  //   const { unitId, customerOrderIds } = dragData
  //   const activeOrderId = dragData.orderId
  //   const overOrderId = overData.orderId

  //   if (
  //     !customerOrderIds ||
  //     !Array.isArray(customerOrderIds) ||
  //     activeOrderId === overOrderId
  //   ) {
  //     return
  //   }

  //   const oldIndex = customerOrderIds.indexOf(activeOrderId)
  //   const newIndex = customerOrderIds.indexOf(overOrderId)

  //   if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

  //   const newIds = arrayMove(customerOrderIds, oldIndex, newIndex)

  //   newIds.forEach((orderId, idx) => {
  //     handleOrderResequence(unitId, orderId, idx + 1, { silent: true })
  //   })

  //   toast({ title: 'Saved', description: 'Order sequence updated' })
  // }

  const handleSortableReorder = (active, over, dragData) => {
    if (!over) return
    const overData = over.data.current
    if (!overData || overData.type !== 'sortable-order') return

    const { unitId, customerId, customerOrderIds } = dragData
    const activeOrderId = dragData.orderId
    const overOrderId = overData.orderId

    if (
      !customerOrderIds ||
      !Array.isArray(customerOrderIds) ||
      activeOrderId === overOrderId
    ) {
      return
    }

    const oldIndex = customerOrderIds.indexOf(activeOrderId)
    const newIndex = customerOrderIds.indexOf(overOrderId)

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

    const newIds = arrayMove(customerOrderIds, oldIndex, newIndex)

    const customerIndex = getCustomerIndexInUnit(unitId, customerId)

    newIds.forEach((orderId, idx) => {
      const orderIndex = idx + 1
      const newSequence = customerIndex * 1000 + orderIndex
      handleOrderResequence(unitId, orderId, newSequence, { silent: true })
    })

    toast({ title: 'Saved', description: 'Order sequence updated' })
  }

  const handleCustomerReorder = async (active, over, dragData) => {
    if (!over) return
    const overData = over.data.current
    if (!overData || overData.type !== 'sortable-customer') return

    const { unitId, suburbKey, customerIds } = dragData
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

            const customerIndex = idx + 1 // 1-based for this suburb group

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
            orders: assignments.map((o) => ({
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

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveItem(null)
    if (!over) return

    const dragData = active.data.current
    if (!dragData) return

    if (dragData.type === 'sortable-customer') {
      const overData = over.data.current
      const sameContainer =
        overData &&
        overData.type === 'sortable-customer' &&
        overData.containerId === dragData.containerId

      if (sameContainer) {
        handleCustomerReorder(active, over, dragData)
      }

      return
    }

    if (dragData.type === 'sortable-order') {
      const overData = over.data.current
      const sameSortableList =
        overData &&
        overData.type === 'sortable-order' &&
        overData.containerId === dragData.containerId

      if (sameSortableList) {
        handleSortableReorder(active, over, dragData)
        return
      }
      // else: dragging out of the list → fall through to normal cross-container move
    }

    const from = dragData.containerId
    const to = over.id

    if (from === to) return

    const move = {
      item_id: dragData.item_id || active.id,
      order_id: dragData.order_id || active.id,
      weight_kg: dragData.weight,
      from_plan_unit_id:
        from === 'bucket:unassigned'
          ? null
          : from === 'unit:undefined'
          ? id
          : from && from.startsWith('unit:')
          ? from.slice(5)
          : null,
      to_plan_unit_id:
        to === 'bucket:unassigned'
          ? null
          : to && to.startsWith('unit:')
          ? to.slice(5)
          : null,
    }

    if (!move.from_plan_unit_id && move.to_plan_unit_id) {
      move.stop_sequence = getNextStopSequenceForUnit(move.to_plan_unit_id)
    } else if (
      move.from_plan_unit_id &&
      move.to_plan_unit_id &&
      move.from_plan_unit_id !== move.to_plan_unit_id
    ) {
      move.stop_sequence = getNextStopSequenceForUnit(move.to_plan_unit_id)
    }

    handleOptimisticMove(move)

    setChanges((prev) => [...prev])

    const planId = plan?.id || data?.plan?.id
    if (!planId) {
      toast({ title: 'Error', description: 'Plan ID not found' })
      return
    }

    commitImmediateMove(planId, move, fetchData, setAssignmentPreview)
      .then(() => {
        toast({ title: 'Saved', description: 'Change committed.' })
      })
      .catch((err) => {
        handleAPIError(err, toast)
        if (undoStack.length) handleUndo()
      })
  }

  const handleOptimisticMove = async (payload) => {
    const {
      item_id,
      order_id,
      from_plan_unit_id,
      to_plan_unit_id,
      stop_sequence,
    } = payload

    const cleanOrderId = (order_id || item_id || '').replace(/^order-/, '')

    if (!from_plan_unit_id && to_plan_unit_id) {
      handleAssignItem(cleanOrderId, to_plan_unit_id)
      return
    }

    if (from_plan_unit_id && !to_plan_unit_id) {
      handleUnassignItem(cleanOrderId)
      return
    }

    if (
      from_plan_unit_id &&
      to_plan_unit_id &&
      from_plan_unit_id !== to_plan_unit_id
    ) {
      setAssignedUnits((prev) => {
        const next = prev.map((u) => ({
          ...u,
          orders: [...(u.orders || [])],
        }))

        const fromUnit = next.find(
          (u) => String(u.planned_unit_id) === String(from_plan_unit_id)
        )
        const toUnit = next.find(
          (u) => String(u.planned_unit_id) === String(to_plan_unit_id)
        )

        if (!fromUnit || !toUnit) {
          console.warn('Unit→Unit move: unit not found', {
            from_plan_unit_id,
            to_plan_unit_id,
          })
          return prev
        }

        const idx = (fromUnit.orders || []).findIndex(
          (o) => String(o.order_id) === String(cleanOrderId)
        )
        if (idx === -1) {
          console.warn(
            'Unit→Unit move: order not found in source unit',
            cleanOrderId
          )
          return prev
        }

        const [order] = fromUnit.orders.splice(idx, 1)

        const wt = Number(order.total_weight || 0)
        fromUnit.used_capacity_kg = Math.max(
          0,
          Number(fromUnit.used_capacity_kg || 0) - wt
        )
        toUnit.used_capacity_kg = Number(toUnit.used_capacity_kg || 0) + wt

        order.stop_sequence =
          stop_sequence || getNextStopSequenceForUnit(to_plan_unit_id)
        toUnit.orders.push(order)

        return next
      })

      return
    }
  }

  const handleAssignItem = (itemId, vehicleId) => {
    const meta = unassigned.find((x) => String(x.order_id) === String(itemId))
    if (!meta) return

    const linesFromMeta = (meta.order_lines || []).map((line) => ({
      order_line_id: line.order_line_id,
      description:
        line.description ||
        `${meta.sales_order_number || meta.order_number || ''} - ${
          meta.customer_name || ''
        }`,
      weight: Number(
        line.weight ?? line.weight_left ?? line.assigned_weight_kg ?? 0
      ),
    }))

    const totalFromLines =
      linesFromMeta.length > 0
        ? linesFromMeta.reduce((sum, l) => sum + (Number(l.weight) || 0), 0)
        : Number(meta.total_weight || 0)

    const transformedOrder = {
      ...meta,
      order_id: meta.order_id,
      sales_order_number: meta.sales_order_number,
      route_name: meta.route_name,
      suburb_name: meta.suburb_name,
      total_weight: totalFromLines,
      stop_sequence: getNextStopSequenceForUnit(vehicleId),
      lines:
        linesFromMeta.length > 0
          ? linesFromMeta
          : [
              {
                order_line_id: `${meta.order_id}-line-1`,
                description: `${meta.sales_order_number} - ${meta.customer_name}`,
                weight: totalFromLines,
              },
            ],
    }

    setUnassigned((prev) =>
      prev.filter((x) => String(x.order_id) !== String(itemId))
    )

    setAssignedUnits((prev) =>
      prev.map((u) => {
        if (String(u.planned_unit_id) !== String(vehicleId)) return u
        const alreadyExists = (u.orders || []).some(
          (o) => String(o.order_id) === String(itemId)
        )
        if (alreadyExists) return u
        return {
          ...u,
          orders: [...(u.orders || []), transformedOrder],
          used_capacity_kg:
            Number(u.used_capacity_kg || 0) + Number(totalFromLines || 0),
        }
      })
    )
  }

  // const handleAssignItem = (itemId, vehicleId) => {
  //   const meta = unassigned.find((x) => String(x.order_id) === String(itemId))
  //   if (!meta) return

  //   const transformedOrder = {
  //     order_id: meta.order_id,
  //     sales_order_number: meta.sales_order_number,
  //     customer_name: meta.customer_name,
  //     route_name: meta.route_name,
  //     suburb_name: meta.suburb_name,
  //     total_weight: meta.total_weight || 0,
  //     stop_sequence: getNextStopSequenceForUnit(vehicleId),
  //     lines: [
  //       {
  //         order_line_id: `${meta.order_id}-line-1`,
  //         description: `${meta.sales_order_number} - ${meta.customer_name}`,
  //         weight: meta.total_weight || 0,
  //       },
  //     ],
  //     ...meta,
  //   }

  //   setUnassigned((prev) =>
  //     prev.filter((x) => String(x.order_id) !== String(itemId))
  //   )

  //   setAssignedUnits((prev) =>
  //     prev.map((u) => {
  //       if (String(u.planned_unit_id) !== String(vehicleId)) return u
  //       return {
  //         ...u,
  //         orders: [...(u.orders || []), transformedOrder],
  //         used_capacity_kg:
  //           Number(u.used_capacity_kg || 0) + Number(meta.total_weight || 0),
  //       }
  //     })
  //   )
  // }

  const handleUnassignItem = (itemId) => {
    let removedOrder = null

    setAssignedUnits((prev) =>
      prev.map((u) => {
        const orderIndex = (u.orders || []).findIndex(
          (o) => String(o.order_id) === String(itemId)
        )
        if (orderIndex === -1) return u

        removedOrder = u.orders[orderIndex]
        const updated = {
          ...u,
          orders: u.orders.filter((_, index) => index !== orderIndex),
          used_capacity_kg: Math.max(
            0,
            Number(u.used_capacity_kg || 0) -
              Number(removedOrder.total_weight || 0)
          ),
        }
        return updated
      })
    )

    if (removedOrder) {
      const { lines, ...originalOrder } = removedOrder

      setUnassigned((prev) => {
        const alreadyExists = prev.some(
          (x) => String(x.order_id) === String(itemId)
        )
        if (alreadyExists) return prev
        return [...prev, originalOrder]
      })
    }
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return

    const lastState = undoStack[undoStack.length - 1]
    setAssignedUnits(lastState.assignedUnits)
    setUnassigned(lastState.unassigned)
    setUndoStack((prev) => prev.slice(0, -1))
    setChanges((prev) => prev.slice(0, -1))

    toast({
      title: 'Undone',
      description: 'Last action has been undone',
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveItem(null)}
    >
      <div className="space-y-6">
        <DetailActionBar
          id={id}
          title={
            planned_unit?.vehicle?.license_plate
              ? planned_unit?.vehicle?.license_plate
              : 'N/A'
          }
          description={
            planned_unit?.vehicle?.type == 'rigid'
              ? `${planned_unit?.vehicle?.type || null} - ${
                  planned_unit?.vehicle?.fleet_number || null
                }`
              : `${planned_unit?.vehicle?.type || null} & Trailer - ${
                  planned_unit?.vehicle?.fleet_number || null
                } - ${planned_unit?.trailer?.fleet_number || null}`
          }
        />

        <div className="grid gap-6">
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-7">
              <div>
                {planned_unit && (
                  <VehicleCard
                    key={planned_unit.planned_unit_id}
                    unit={hydrateUnitFromPlanPayload(planned_unit)}
                    onUnitChange={(updatedUnit) => {
                      setAssignedUnits((prev) =>
                        prev.map((u) =>
                          u.planned_unit_id === updatedUnit.planned_unit_id
                            ? updatedUnit
                            : u
                        )
                      )
                    }}
                    onUnassignAll={() =>
                      onUnassignAll(planned_unit.planned_unit_id)
                    }
                  />
                )}
              </div>
            </div>
            <div className="md:col-span-5">
              <UnassignedList
                items={unassigned}
                onItemsChange={setUnassigned}
              />
            </div>
          </div>
        </div>
      </div>

      {typeof window !== 'undefined' &&
        createPortal(
          <DragOverlay>
            {activeItem ? (
              <div className="rounded-md border bg-popover px-2 py-1 text-sm shadow">
                {activeItem.item?.description || activeItem.item?.item_id}
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  )
}

export default LoadAssignmentSingle
