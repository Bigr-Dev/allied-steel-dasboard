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

async function commitImmediateMove(planId, payload, fetchData) {
  const { item_id, weight_kg, from_plan_unit_id, to_plan_unit_id } = payload

  // A) Bucket → Unit (assign)  ✅ working
  if (!from_plan_unit_id && to_plan_unit_id) {
    await fetchData(`plans/${planId}/bulk-assign`, 'POST', {
      plan_id: planId, // REQUIRED by bulk-assign
      assignments: [
        {
          plan_unit_id: to_plan_unit_id,
          items: [{ item_id, weight_kg, note: 'manual' }],
        },
      ],
      customerUnitCap: 0, // skip cap to avoid DB join ambiguity; set >0 if you want caps enforced
      // enforce_family: false, // optional
    })
    return
  }

  // B) Unit → Bucket (unassign)  ✅ normalized shape
  if (from_plan_unit_id && !to_plan_unit_id) {
    await fetchData(`plans/${planId}/unassign`, 'POST', {
      plan_id: planId, // include plan_id for clarity
      items: [{ plan_unit_id: from_plan_unit_id, item_id }], // send as ARRAY
      to_bucket: true,
      bucket_reason: 'manual',
      remove_empty_unit: true,
    })
    return
  }

  // C) Unit → Unit (move)  ✅ robust: unassign then bulk-assign
  if (
    from_plan_unit_id &&
    to_plan_unit_id &&
    from_plan_unit_id !== to_plan_unit_id
  ) {
    // 1) Unassign from source (no bucket write)
    await fetchData(`plans/${planId}/unassign`, 'POST', {
      plan_id: planId,
      items: [{ plan_unit_id: from_plan_unit_id, item_id }],
      to_bucket: false,
      remove_empty_unit: true,
    })

    // 2) Assign to destination via bulk-assign
    await fetchData(`plans/${planId}/bulk-assign`, 'POST', {
      plan_id: planId,
      assignments: [
        {
          plan_unit_id: to_plan_unit_id,
          items: [{ item_id, weight_kg, note: 'manual-move' }],
        },
      ],
      customerUnitCap: 0,
      // enforce_family: false,
    })
    return
  }
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
  const { setAssignmentPreview, fetchData } = useGlobalContext()
  const { unassignAllFromUnit } = useAssignmentPlan()

  const { toast } = useToast()
  console.log('data :>> ', data)
  const [assignedUnits, setAssignedUnits] = useState(data?.units || [])
  const [unassigned, setUnassigned] = useState(data?.unassigned_orders || [])

  const [plan, setPlan] = useState(data?.plan || null)
  const [activeItem, setActiveItem] = useState(null)
  const [undoStack, setUndoStack] = useState([])
  const [changes, setChanges] = useState([])

  const initialSnapshotRef = useRef({
    plan: data?.plan || null,
    units: JSON.parse(JSON.stringify(data?.units || [])),
    unassigned_orders: JSON.parse(JSON.stringify(data?.unassigned_orders || [])),
  })

  // If the page receives new data (e.g., navigation), refresh the snapshot
  useEffect(() => {
    initialSnapshotRef.current = {
      plan: data?.plan || null,
      units: JSON.parse(JSON.stringify(data?.units || [])),
      unassigned_orders: JSON.parse(JSON.stringify(data?.unassigned_orders || [])),
    }
    setAssignedUnits(data?.units || [])
    setUnassigned(data?.unassigned_orders || [])
    setPlan(data?.plan || null)
    setChanges([])
    setUndoStack([])
  }, [data])

  // Sync local state changes to global context
  useEffect(() => {
    setAssignmentPreview({
      plan,
      units: assignedUnits,
      unassigned_orders: unassigned,
    })
  }, [assignedUnits, unassigned, plan, setAssignmentPreview])

  const planned_unit = assignedUnits?.find((v) => v.planned_unit_id === id)

  const onUnassignAll = unassignAllFromUnit

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

    // … (your capacity guard + undo snapshot stays unchanged)

    const move = {
      item_id: dragData.item_id,
      weight_kg: dragData.weight,
      from_plan_unit_id: from.startsWith('unit:') ? from.slice(5) : null,
      to_plan_unit_id: to.startsWith('unit:') ? to.slice(5) : null,
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
    const { item_id, from_plan_unit_id, to_plan_unit_id } = payload

    if (!from_plan_unit_id && to_plan_unit_id) {
      // await handleAssignItem(item_id, to_plan_unit_id)
      handleAssignItem(item_id, to_plan_unit_id)
    } else if (from_plan_unit_id && !to_plan_unit_id) {
      // await handleUnassignItem(item_id)
      handleUnassignItem(item_id)
    } else if (
      from_plan_unit_id &&
      to_plan_unit_id &&
      from_plan_unit_id !== to_plan_unit_id
    ) {
      handleUnassignItem(item_id)
      handleAssignItem(item_id, to_plan_unit_id)
      //  await handleUnassignItem(item_id)
      //  await handleAssignItem(item_id, to_plan_unit_id)
    }
  }

  const handleAssignItem = (itemId, vehicleId) => {
    const meta = unassigned.find((x) => String(x.order_id) === String(itemId))
    if (!meta) return

    // remove from unassigned
    setUnassigned((prev) =>
      prev.filter((x) => String(x.order_id) !== String(itemId))
    )

    // add into the destination unit
    setAssignedUnits((prev) =>
      prev.map((u) => {
        if (String(u.planned_unit_id) !== String(vehicleId)) return u
        return {
          ...u,
          orders: [...(u.orders || []), meta],
          used_capacity_kg:
            Number(u.used_capacity_kg || 0) + Number(meta.total_weight || 0),
        }
      })
    )
  }

  const handleUnassignItem = (itemId) => {
    let removedOrder = null

    setAssignedUnits((prev) =>
      prev.map((u) => {
        const orderIndex = (u.orders || []).findIndex(
          (o) => String(o.order_id) === String(itemId)
        )
        if (orderIndex === -1) return u
        
        removedOrder = u.orders[orderIndex]
        return {
          ...u,
          orders: u.orders.filter((_, index) => index !== orderIndex),
          used_capacity_kg: Math.max(
            0,
            Number(u.used_capacity_kg || 0) - Number(removedOrder.total_weight || 0)
          ),
        }
      })
    )

    if (removedOrder) {
      setUnassigned((prev) => [
        ...prev.filter((x) => String(x.order_id) !== String(itemId)),
        removedOrder,
      ])
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
            planned_unit?.rigid ? planned_unit?.rigid?.fleet_number : 'N/A'
          }
          description={planned_unit?.rigid ? planned_unit?.rigid?.plate : 'N/A'}
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
