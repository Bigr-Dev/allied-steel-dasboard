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
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useMemo, useState, useEffect, useRef } from 'react'
import DetailActionBar from '../layout/detail-action-bar'
import { UnassignedList } from '../layout/assignment/UnassignedList'
import { VehicleCard } from '../layout/assignment/VehicleCard'
import { createPortal } from 'react-dom'
import { useAssignmentPlan } from '@/hooks/assignment-plan/use-assignment-plan'

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
      items,
    })
  })

  const customers = Array.from(customersMap.values())

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
  const { item_id, order_id, order_ids, from_plan_unit_id, to_plan_unit_id } =
    payload

  // plan_id: planId,
  //       planned_unit_id: plannedUnitId,
  //       order_ids: orderIds,
  // console.log('payload :>> ', payload)

  // Strip "order-" prefix if present
  const cleanOrderId = (order_id || item_id || '').replace(/^order-/, '')

  // Ensure we don't send 'undefined' string
  const fromUnitId =
    from_plan_unit_id && from_plan_unit_id !== 'undefined'
      ? from_plan_unit_id
      : null
  const toUnitId =
    to_plan_unit_id && to_plan_unit_id !== 'undefined' ? to_plan_unit_id : null

  // console.log('fromUnitId :>> ', fromUnitId)
  // console.log('toUnitId :>> ', toUnitId)

  // A) Bucket → Unit (assign)
  if (!fromUnitId && toUnitId) {
    // console.log('Case A: Bucket → Unit')
    await fetchData(`plans/${planId}/bulk-assign`, 'POST', {
      plan_id: planId,
      assignments: [
        {
          planned_unit_id: toUnitId,
          orders: [{ order_id: cleanOrderId }],
        },
      ],
    })
    return
  }

  // B) Unit → Bucket (unassign)
  if (fromUnitId && !toUnitId) {
    // console.log('Case B: Unit → Bucket')
    // console.log('item_ids :>> ', order_ids)
    try {
      const res = await fetchData(`plans/${planId}/unassign`, 'POST', {
        plan_id: planId,
        planned_unit_id: fromUnitId,
        order_ids: order_ids,
      })
      setAssignmentPreview({
        units: res?.units,
        unassigned_units: res?.unassigned_units,
      })
      // console.log('res :>> ', res)
      return
    } catch (error) {
      console.log('error :>> ', error)
    }
  }

  // C) Unit → Unit (move)
  if (fromUnitId && toUnitId && fromUnitId !== toUnitId) {
    // console.log('Case C: Unit → Unit')
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
          orders: [{ order_id: cleanOrderId }],
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
  // fallback to name if id missing on either side
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
  // meta must include: customer_id, customer_name, route_name, suburb_name, order_id, item_id, description, weight_left

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

  // deep-ish copy to preserve immutability
  let next = customers.map((c) => ({
    ...c,
    orders: (c.orders || []).map((o) => ({
      ...o,
      items: [...(o.items || [])],
    })),
  }))

  // 1) Try to find an exact group match (id/name + route/suburb)
  let cIdx = next.findIndex((c) => sameGroup(c, meta))

  // 2) If not found, try to find the same customer by id OR name, then prefer route/suburb, else first
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

  // 3) Still not found? Create the customer group
  if (cIdx === -1) {
    next = [
      ...next,
      {
        customer_id,
        customer_name, // keep for rendering; never for keys
        route_name: route_name || null,
        suburb_name: suburb_name || null,
        orders: [],
      },
    ]
    cIdx = next.length - 1
  }

  // 4) Find or create the order group
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

  // 5) Duplicate guard at item level
  const order = next[cIdx].orders[oIdx]
  if (
    (order.items || []).some((it) => String(it.item_id) === String(item_id))
  ) {
    return { nextCustomers: next, addedWeight: 0 } // no-op if already present
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
  // const { unassignAllFromUnit } = useAssignmentPlan()
  //console.log('assignment_preview :>> ', assignment_preview)
  const { toast } = useToast()
  //const planned_unit = assignedUnits?.find((v) => v.planned_unit_id === id)
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

  // If the page receives new data (e.g., navigation), refresh the snapshot
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
      plan,
      units: data?.units,
      unassigned_orders: data?.unassigned_orders,
    })
  }, [data])

  // Sync local state changes to global context
  useEffect(() => {
    setAssignedUnits(assignment_preview?.units || data?.units || [])
    setUnassigned(
      assignment_preview?.unassigned_orders || data?.unassigned_orders || []
    )
    setPlan(assignment_preview?.plan || data?.plan || null)
  }, [assignment_preview, setAssignmentPreview])

  const planned_unit = assignedUnits?.find((v) => v.planned_unit_id === id)
  // console.log('🔍 planned_unit found:', planned_unit)
  // console.log('🔍 Current states:', {
  //   plan,
  //   assignedUnits: assignedUnits?.length,
  //   unassigned: unassigned?.length,
  // })
  const onUnassignAll = async (plannedUnitId) => {
    setLoading(true)
    //   console.log('🚀 onUnassignAll called with plannedUnitId:', plannedUnitId)

    const unit = assignedUnits?.find((u) => u.planned_unit_id === plannedUnitId)
    console.log('🔍 Found unit:', unit)

    if (!unit) {
      console.log('❌ No unit found for plannedUnitId:', plannedUnitId)
      setLoading(false)
      return
    }

    // Extract order IDs from the unit's orders array
    const orderIds = (unit.orders || [])
      .map((order) => order.order_id)
      .filter(Boolean)
    // console.log('🔍 Extracted orderIds:', orderIds)

    // Use data.plan.id since plan state might not have id
    const planId = data?.plan?.id || plan?.id

    // console.log('🔍 Debug plan data:', {
    //   plan,
    //   dataPlan: data?.plan,
    //   planId,
    //   planKeys: plan ? Object.keys(plan) : 'null',
    //   dataPlanKeys: data?.plan ? Object.keys(data.plan) : 'null',
    // })

    // console.log('📤 Unassigning all from unit payload:', {
    //   plan_id: planId,
    //   planned_unit_id: plannedUnitId,
    //   order_ids: orderIds,
    // })

    if (!planId) {
      toast({ title: 'Error', description: 'Plan ID not found' })
      return
    }

    try {
      console.log('📡 Making API call to:', `plans/${planId}/unassign`)
      // const result = await fetchData(`plans/${planId}/unassign`, 'POST', {
      //   plan_id: planId,
      //   planned_unit_id: plannedUnitId,
      //   order_ids: orderIds,
      // })
      const payload = {
        plan_id: planId,
        from_plan_unit_id: plannedUnitId,
        order_ids: orderIds,
      }
      commitImmediateMove(planId, payload, fetchData, setAssignmentPreview)
      //console.log('✅ API call successful:', result)
      // setAssignmentPreview
      toast({ title: 'Success', description: 'All items unassigned from unit' })
    } catch (error) {
      console.error('❌ Error unassigning all:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
      })
      toast({ title: 'Error', description: 'Failed to unassign items' })
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

  // Memoize item lookup for better performance

  const itemLookupMap = useMemo(() => {
    const map = new Map()

    // Add unassigned items
    unassigned.forEach((order) => {
      map.set(order.order_id, {
        item: order,
        sourceType: 'unassigned',
        sourceVehicleId: null,
      })
    })

    // Add assigned items
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

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveItem(null)
    if (!over) return
    const dragData = active.data.current
    if (!dragData) return

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
          ? id // Use the current page's unit ID
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

    // Optimistic local update (your existing helper)
    handleOptimisticMove(move)

    // Track change locally (optional – keep if you still show “undo”)
    setChanges((prev) => [...prev /* your existing op mapping */])

    // 🔴 NEW: immediately persist this single change via manually-assign / unassign
    // plan.id is already in component state
    commitImmediateMove(plan?.id, move, fetchData)
      .then(() => {
        toast({ title: 'Saved', description: 'Change committed.' })
      })
      .catch((err) => {
        handleAPIError(err, toast)
        // optional rollback: pop undo & restore snapshot
        if (undoStack.length) handleUndo()
      })

    // Keep your toast about local update if you like, or rely on the "Saved" toast above.
  }

  const handleOptimisticMove = async (payload) => {
    const { item_id, order_id, from_plan_unit_id, to_plan_unit_id } = payload

    // Strip "order-" prefix for local state updates
    const cleanOrderId = (order_id || item_id || '').replace(/^order-/, '')

    if (!from_plan_unit_id && to_plan_unit_id) {
      handleAssignItem(cleanOrderId, to_plan_unit_id)
    } else if (from_plan_unit_id && !to_plan_unit_id) {
      handleUnassignItem(cleanOrderId)
    } else if (
      from_plan_unit_id &&
      to_plan_unit_id &&
      from_plan_unit_id !== to_plan_unit_id
    ) {
      handleUnassignItem(cleanOrderId)
      handleAssignItem(cleanOrderId, to_plan_unit_id)
    }
  }

  const handleAssignItem = (itemId, vehicleId) => {
    // console.log(
    //   '🔵 ASSIGN - Looking for itemId:',
    //   itemId,
    //   'in vehicleId:',
    //   vehicleId
    // )
    const meta = unassigned.find((x) => String(x.order_id) === String(itemId))
    //  console.log('🔵 ASSIGN - Found meta:', meta)
    if (!meta) {
      console.log('🔴 ASSIGN - No meta found for itemId:', itemId)
      return
    }

    // Transform the unassigned order to match the structure expected by VehicleCard
    const transformedOrder = {
      order_id: meta.order_id,
      sales_order_number: meta.sales_order_number,
      customer_name: meta.customer_name,
      route_name: meta.route_name,
      suburb_name: meta.suburb_name,
      total_weight: meta.total_weight || 0,
      // Create lines array that hydrateUnitFromPlanPayload expects
      lines: [
        {
          order_line_id: `${meta.order_id}-line-1`,
          description: `${meta.sales_order_number} - ${meta.customer_name}`,
          weight: meta.total_weight || 0,
        },
      ],
      ...meta, // Include all original properties
    }
    // console.log('🔵 ASSIGN - Transformed order:', transformedOrder)

    // remove from unassigned
    setUnassigned((prev) => {
      const filtered = prev.filter((x) => String(x.order_id) !== String(itemId))
      // console.log(
      //   '🔵 ASSIGN - Removing from unassigned. Before:',
      //   prev.length,
      //   'After:',
      //   filtered.length
      // )
      return filtered
    })

    // add into the destination unit with transformed structure
    setAssignedUnits((prev) =>
      prev.map((u) => {
        if (String(u.planned_unit_id) !== String(vehicleId)) return u
        // console.log(
        //   '🔵 ASSIGN - Adding to unit:',
        //   vehicleId,
        //   'Current orders:',
        //   u.orders?.length || 0
        // )
        const updated = {
          ...u,
          orders: [...(u.orders || []), transformedOrder],
          used_capacity_kg:
            Number(u.used_capacity_kg || 0) + Number(meta.total_weight || 0),
        }
        // console.log(
        //   '🔵 ASSIGN - Updated unit orders:',
        //   updated.orders?.length || 0
        // )
        return updated
      })
    )
  }

  const handleUnassignItem = (itemId) => {
    //  console.log('🟡 UNASSIGN - Looking for itemId:', itemId)
    let removedOrder = null

    setAssignedUnits((prev) =>
      prev.map((u) => {
        const orderIndex = (u.orders || []).findIndex(
          (o) => String(o.order_id) === String(itemId)
        )
        if (orderIndex === -1) return u

        removedOrder = u.orders[orderIndex]
        // console.log('🟡 UNASSIGN - Found order to remove:', removedOrder)
        // console.log(
        //   '🟡 UNASSIGN - Unit before removal orders:',
        //   u.orders?.length || 0
        // )
        const updated = {
          ...u,
          orders: u.orders.filter((_, index) => index !== orderIndex),
          used_capacity_kg: Math.max(
            0,
            Number(u.used_capacity_kg || 0) -
              Number(removedOrder.total_weight || 0)
          ),
        }
        // console.log(
        //   '🟡 UNASSIGN - Unit after removal orders:',
        //   updated.orders?.length || 0
        // )
        return updated
      })
    )

    if (removedOrder) {
      //  console.log('🟡 UNASSIGN - Adding back to unassigned:', removedOrder)

      // Transform back to original unassigned structure (remove the 'lines' property we added)
      const { lines, ...originalOrder } = removedOrder
      //  console.log('🟡 UNASSIGN - Transformed back to original:', originalOrder)

      setUnassigned((prev) => {
        const updated = [
          ...prev.filter((x) => String(x.order_id) !== String(itemId)),
          originalOrder,
        ]
        // console.log(
        //   '🟡 UNASSIGN - Unassigned count after adding back:',
        //   updated.length
        // )
        return updated
      })
    } else {
      console.log('🔴 UNASSIGN - No order found to remove for itemId:', itemId)
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
  // console.log('planned_unit :>> ', planned_unit)
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

        <div className="grid gap-6  ">
          <div className="grid gap-6  md:grid-cols-12">
            <div className="md:col-span-7">
              <div className="">
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
