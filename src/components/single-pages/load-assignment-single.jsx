'use client'
import { useGlobalContext } from '@/context/global-context'
import { useToast } from '@/hooks/use-toast'
import { assignmentAPI, handleAPIError } from '@/lib/api-client'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  useSensor,
  useSensors,
  rectIntersection,
  useDraggable,
  PointerSensor,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useMemo, useState, useEffect, useRef } from 'react'
import DetailActionBar from '../layout/detail-action-bar'
import { UnassignedList } from '../layout/assignment/UnassignedList'
import { VehicleCard } from '../layout/assignment/VehicleCard'
import { DraggableItemRow } from '../layout/assignment/DraggableItemRow'
import { createPortal } from 'react-dom'
import { useAssignmentPlan } from '@/hooks/assignment-plan/use-assignment-plan'

// helpers
// commitImmediateMove(planId, payload, fetchData)
// payload: { item_id, weight_kg, from_plan_unit_id, to_plan_unit_id }

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

// async function commitImmediateMove(planId, payload, fetchData) {
//   const { item_id, weight_kg, from_plan_unit_id, to_plan_unit_id } = payload

//   // A) Bucket → unit (assign)
//   if (!from_plan_unit_id && to_plan_unit_id) {
//     await fetchData(`plans/${planId}/bulk-assign`, 'POST', {
//       // items: { item_id, weight_kg, note: 'manual' },
//       plan_id: planId,
//       assignments: [
//         {
//           plan_unit_id: to_plan_unit_id,
//           items: [{ item_id, weight_kg, note: 'manual' }],
//         },
//       ],
//       customerUnitCap: 0,
//     })
//     return
//   }

//   // B) Unit → bucket (unassign)
//   if (from_plan_unit_id && !to_plan_unit_id) {
//     await fetchData(`plans/${planId}/unassign`, 'POST', {
//       items: { plan_unit_id: from_plan_unit_id, item_id },
//       to_bucket: true,
//       bucket_reason: 'manual',
//       remove_empty_unit: true,
//     })
//     return
//   }

//   // C) Unit → unit (move)
//   if (
//     from_plan_unit_id &&
//     to_plan_unit_id &&
//     from_plan_unit_id !== to_plan_unit_id
//   ) {
//     await fetchData(`plans/${planId}/unassign`, 'POST', {
//       items: { plan_unit_id: from_plan_unit_id, item_id },
//       to_bucket: false,
//       remove_empty_unit: true,
//     })
//     await fetchData(`plans/${planId}/units/${to_plan_unit_id}/assign`, 'POST', {
//       items: { item_id, weight_kg, note: 'manual-move' },
//       // no customerUnitCap
//     })
//   }
// }

// async function commitImmediateMove(planId, payload, fetchData) {
//   const { item_id, weight_kg, from_plan_unit_id, to_plan_unit_id } = payload

//   // A) Assign from bucket → unit
//   if (!from_plan_unit_id && to_plan_unit_id) {
//     await fetchData(`plans/${planId}/manually-assign`, 'POST', {
//       plan_unit_id: to_plan_unit_id,
//       items: { item_id, weight_kg, note: 'manual' },
//       //  customerUnitCap: 2,
//     })
//     return
//   }

//   // B) Unassign from unit → bucket
//   if (from_plan_unit_id && !to_plan_unit_id) {
//     await fetchData(`plans/${planId}/unassign`, 'POST', {
//       items: { plan_unit_id: from_plan_unit_id, item_id },
//       to_bucket: true,
//       bucket_reason: 'manual',
//       remove_empty_unit: true,
//     })
//     return
//   }

//   // C) Move unit → unit: unassign, then assign
//   if (
//     from_plan_unit_id &&
//     to_plan_unit_id &&
//     from_plan_unit_id !== to_plan_unit_id
//   ) {
//     await fetchData(`plans/${planId}/unassign`, 'POST', {
//       items: { plan_unit_id: from_plan_unit_id, item_id },
//       to_bucket: false, // pure move (no need to write bucket)
//       remove_empty_unit: true,
//     })
//     await fetchData(`plans/${planId}/manually-assign`, 'POST', {
//       plan_unit_id: to_plan_unit_id,
//       items: { item_id, weight_kg, note: 'manual-move' },
//       customerUnitCap: 2,
//     })
//   }
// }

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

async function commitChangesWithFetchData(
  planId,
  changes,
  fetchData,
  opts = {}
) {
  // Build payloads from local ops
  const assignsByUnit = new Map()
  const unassignList = []

  for (const c of changes) {
    if (c.op === 'assign') {
      if (!assignsByUnit.has(c.plan_unit_id))
        assignsByUnit.set(c.plan_unit_id, [])
      assignsByUnit
        .get(c.plan_unit_id)
        .push({ item_id: c.item_id, weight_kg: c.weight_kg })
    } else if (c.op === 'unassign') {
      unassignList.push({ plan_unit_id: c.plan_unit_id, item_id: c.item_id })
    } else if (c.op === 'move') {
      unassignList.push({
        plan_unit_id: c.from_plan_unit_id,
        item_id: c.item_id,
      })
      if (!assignsByUnit.has(c.to_plan_unit_id))
        assignsByUnit.set(c.to_plan_unit_id, [])
      assignsByUnit
        .get(c.to_plan_unit_id)
        .push({ item_id: c.item_id, weight_kg: c.weight_kg })
    }
  }

  // 1) manually-assign (if any)
  if (assignsByUnit.size) {
    for (const [plan_unit_id, items] of assignsByUnit.entries()) {
      // await fetchData(`plans/${planId}/manually-assign`, 'POST', {
      //   plan_unit_id,
      //   items, // [{ item_id, weight_kg }]
      //   //   customerUnitCap: opts.customerUnitCap ?? 2,
      // })
      await fetchData(`plans/${planId}/units/${plan_unit_id}/assign`, 'POST', {
        items, // [{ item_id, weight_kg? }]
      })
    }
  }

  // // 1) bulk-assign (if any)
  // if (assignsByUnit.size) {
  //   const bulkAssignPayload = {
  //     assignments: Array.from(assignsByUnit.entries()).map(
  //       ([plan_unit_id, items]) => ({
  //         plan_unit_id,
  //         items,
  //       })
  //     ),
  //     // tune if your backend expects these:
  //     customerUnitCap: opts.customerUnitCap ?? 2,
  //     enforce_family: opts.enforce_family ?? false,
  //   }
  //   await fetchData(`plans/${planId}/bulk-assign`, 'POST', bulkAssignPayload)
  //   // If you call the Express API directly, drop the /api prefix:
  //   // await fetchData(`/plans/${planId}/bulk-assign`, 'POST', bulkAssignPayload);
  // }

  // 2) unassign (if any)
  if (unassignList.length) {
    const unassignPayload = {
      items: unassignList,
      to_bucket: true,
      bucket_reason: 'manual',
      remove_empty_unit: true,
    }
    await fetchData(`plans/${planId}/unassign`, 'POST', unassignPayload)
    // Or: await fetchData(`/plans/${planId}/unassign`, 'POST', unassignPayload);
  }

  return true
}

const LoadAssignmentSingle = ({ id, data }) => {
  const { assignment_preview, setAssignmentPreview, fetchData } =
    useGlobalContext()
  const { error, refresh, assignItem, unassignItem, unassignAllFromUnit } =
    useAssignmentPlan()

  const { toast } = useToast()
  console.log('assignment_preview :>> ', assignment_preview)

  const [assignedUnits, setAssignedUnits] = useState(
    assignment_preview?.assigned_units || []
  )
  const [unassigned, setUnassigned] = useState(
    assignment_preview?.unassigned || []
  )
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState(assignment_preview?.plan || null)
  const [activeItem, setActiveItem] = useState(null)
  const [undoStack, setUndoStack] = useState([])
  const [changes, setChanges] = useState([])

  const CAPACITY_BUFFER = 0.1 // 10% leeway

  const initialSnapshotRef = useRef({
    plan: assignment_preview?.plan || null,
    assigned_units: JSON.parse(
      JSON.stringify(assignment_preview?.assigned_units || [])
    ),
    unassigned: JSON.parse(
      JSON.stringify(assignment_preview?.unassigned || [])
    ),
  })

  // If the page receives new data (e.g., navigation), refresh the snapshot
  useEffect(() => {
    initialSnapshotRef.current = {
      plan: assignment_preview?.plan || null,
      assigned_units: JSON.parse(
        JSON.stringify(assignment_preview?.assigned_units || [])
      ),
      unassigned: JSON.parse(
        JSON.stringify(assignment_preview?.unassigned || [])
      ),
    }
    setAssignedUnits(assignment_preview?.assigned_units || [])
    setUnassigned(assignment_preview?.unassigned || [])
    setPlan(assignment_preview?.plan || null)
    setChanges([])
    setUndoStack([])
  }, [data])

  const planned_unit = assignedUnits?.find((v) => v.plan_unit_id === id)

  const units = assignedUnits
  const onAssignItem = assignItem
  const onUnassignItem = unassignItem
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
    unassigned.forEach((item) => {
      map.set(item.item_id, {
        item,
        sourceType: 'unassigned',
        sourceVehicleId: null,
      })
    })

    // Add assigned items
    assignedUnits.forEach((unit) => {
      unit.customers.forEach((customer) => {
        customer.orders.forEach((order) => {
          order.items.forEach((item) => {
            map.set(item.item_id, {
              item: {
                ...item,
                customer_name: customer.customer_name,
                route_name: customer.route_name,
                suburb_name: customer.suburb_name,
              },
              sourceType: 'assigned',
              sourceVehicleId: unit.plan_unit_id,
            })
          })
        })
      })
    })

    return map
  }, [assignedUnits, unassigned])

  const containers = useMemo(() => {
    const arr = [
      { id: 'bucket:unassigned' },
      ...units.map((u) => ({ id: `unit:${u.plan_unit_id}` })),
    ]
    return new Set(arr.map((c) => c.id))
  }, [units])

  function getDropTargetId(over) {
    if (!over) return null

    const id = over.id?.toString()

    return containers.has(id) ? id : null
  }

  const loadAssignmentData = async () => {
    setLoading(true)
    try {
      // const data = await assignmentAPI.getAssignments({ preview: true })
      const body = { departure_date: '2025-09-30', commit: false }
      const data = await fetchData('vehicle-assignment', 'POST', body)
      // console.log('data.assigned_units :>> ', data.assigned_units)
      setAssignedUnits(data.assigned_units || [])
      setUnassigned(data.unassigned || [])
      setPlan(data.plan || null)
    } catch (error) {
      handleAPIError(error, toast)
    } finally {
      setLoading(false)
    }
  }

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

  // const handleDragEnd = (event) => {
  //   const { active, over } = event
  //   setActiveItem(null)
  //   if (!over) return
  //   const dragData = active.data.current
  //   if (!dragData) return

  //   const from = dragData.containerId
  //   const to = over.id
  //   if (from === to) return

  //   // Target capacity guard
  //   if (to.startsWith('unit:')) {
  //     const targetUnitId = to.slice(5)
  //     const targetUnit = assignedUnits.find(
  //       (u) => u.plan_unit_id === targetUnitId
  //     )
  //     if (targetUnit) {
  //       const newUsed =
  //         Number(targetUnit.used_capacity_kg || 0) +
  //         Number(dragData.weight || 0)
  //       const maxAllowed =
  //         Number(targetUnit.capacity_kg || 0) * (1 + CAPACITY_BUFFER)
  //       if (newUsed > maxAllowed) {
  //         toast({
  //           title: 'Over Capacity',
  //           // description: 'Cannot assign item - would exceed vehicle capacity',
  //           description: `Cannot assign item — would exceed ${Math.round(
  //             CAPACITY_BUFFER * 100
  //           )}% leeway`,
  //           variant: 'destructive',
  //         })
  //         return
  //       }
  //     }
  //   }

  //   // Save undo point (deep copy)
  //   const undoState = {
  //     assignedUnits: JSON.parse(JSON.stringify(assignedUnits)),
  //     unassigned: JSON.parse(JSON.stringify(unassigned)),
  //     timestamp: Date.now(),
  //   }

  //   // Apply local move
  //   const move = {
  //     item_id: dragData.item_id,
  //     weight_kg: dragData.weight, // normalized key
  //     from_plan_unit_id: from.startsWith('unit:') ? from.slice(5) : null,
  //     to_plan_unit_id: to.startsWith('unit:') ? to.slice(5) : null,
  //   }
  //   handleOptimisticMove(move)

  //   // Track the change as an op we can send later
  //   setChanges((prev) => [
  //     ...prev,
  //     move.to_plan_unit_id && !move.from_plan_unit_id
  //       ? {
  //           op: 'assign',
  //           plan_unit_id: move.to_plan_unit_id,
  //           item_id: move.item_id,
  //           weight_kg: move.weight_kg,
  //         }
  //       : !move.to_plan_unit_id && move.from_plan_unit_id
  //       ? {
  //           op: 'unassign',
  //           plan_unit_id: move.from_plan_unit_id,
  //           item_id: move.item_id,
  //         }
  //       : {
  //           op: 'move',
  //           from_plan_unit_id: move.from_plan_unit_id,
  //           to_plan_unit_id: move.to_plan_unit_id,
  //           item_id: move.item_id,
  //           weight_kg: move.weight_kg,
  //         },
  //   ])

  //   // Keep the last 10 undo points
  //   setUndoStack((prev) => [...prev.slice(-9), undoState])
  //   toast({
  //     title: 'Locally updated',
  //     description: 'Change recorded. Commit to save.',
  //   })
  // }

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
    const meta = unassigned.find((x) => String(x.item_id) === String(itemId))
    if (!meta) return

    // remove from unassigned
    setUnassigned((prev) =>
      prev.filter((x) => String(x.item_id) !== String(itemId))
    )

    // add into the destination unit immutably
    setAssignedUnits((prev) =>
      prev.map((u) => {
        if (String(u.plan_unit_id) !== String(vehicleId)) return u
        const { nextCustomers, addedWeight } = addItemIntoUnitCustomers(
          u.customers || [],
          meta
        )
        return {
          ...u,
          customers: nextCustomers,
          used_capacity_kg:
            Number(u.used_capacity_kg || 0) + Number(addedWeight || 0),
        }
      })
    )
  }

  const handleUnassignItem = (itemId) => {
    // find meta from units so we can re-add to unassigned
    const metaFromUnits =
      assignedUnits.flatMap((u) =>
        (u.customers || []).flatMap((c) =>
          (c.orders || []).flatMap((o) =>
            (o.items || [])
              .filter((it) => String(it.item_id) === String(itemId))
              .map((it) => ({
                item_id: it.item_id,
                description: it.description,
                weight_left: it.assigned_weight_kg,
                customer_id: c.customer_id,
                customer_name: c.customer_name,
                route_name: c.route_name,
                suburb_name: c.suburb_name,
                order_id: o.order_id,
              }))
          )
        )
      )[0] || null

    // remove from whichever unit has it, immutably (and prune empties)
    setAssignedUnits((prev) =>
      prev.map((u) => {
        const { nextCustomers, removedWeight } = removeItemFromUnitCustomers(
          u.customers || [],
          itemId
        )
        if (!removedWeight) return u
        return {
          ...u,
          customers: nextCustomers,
          used_capacity_kg: Math.max(
            0,
            Number(u.used_capacity_kg || 0) - Number(removedWeight || 0)
          ),
        }
      })
    )

    // add back to unassigned (guard duplicate)
    setUnassigned((prev) =>
      prev.some((x) => String(x.item_id) === String(itemId))
        ? prev
        : [
            ...prev,
            metaFromUnits || {
              item_id: itemId,
              description: '',
              weight_left: 0,
            },
          ]
    )
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

  const handleCommitPlan = async () => {
    if (changes.length === 0) {
      toast({
        title: 'No Changes',
        description: 'No changes to commit',
      })
      return
    }

    try {
      await assignmentAPI.commitPlan(changes)
      setChanges([])
      setUndoStack([])

      toast({
        title: 'Plan Committed',
        description: `${changes.length} changes have been saved`,
      })
    } catch (error) {
      handleAPIError(error, toast)
    }
  }
  // console.log('planned_unit :>> ', planned_unit)
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      // onDragStart={(evt) => {
      //   const item = evt.active?.assignment_preview?.current?.item_id || null
      //   setActiveItem(item)
      // }}
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
        <div className="flex items-center gap-2 mb-2">
          <button
            className="rounded-md border px-3 py-2 text-sm"
            onClick={async () => {
              if (!plan?.id) return
              if (!changes.length) {
                toast({
                  title: 'No changes',
                  description: 'Nothing to commit.',
                })
                return
              }

              try {
                setLoading(true)
                await commitChangesWithFetchData(plan.id, changes, fetchData, {
                  //   customerUnitCap: 2,
                  enforce_family: false, // this page allows mixing families
                })

                // (Optional) refetch your plan if you want fresh server truth:
                // const refreshed = await fetchData(`/api/plans/${plan.id}`, 'GET');
                // setAssignedUnits(refreshed.assigned_units || []);
                // setUnassigned(refreshed.unassigned || []);
                // setPlan(refreshed.plan);
                // initialSnapshotRef.current = refreshed;

                setChanges([])
                setUndoStack([])
                toast({ title: 'Committed', description: 'Assignments saved.' })
              } catch (e) {
                toast({
                  title: 'Commit failed',
                  description: e.message,
                  variant: 'destructive',
                })
              } finally {
                setLoading(false)
              }
            }}

            // onClick={async () => {
            //   if (!plan?.id) return
            //   if (!changes.length) {
            //     toast({
            //       title: 'No changes',
            //       description: 'Nothing to commit.',
            //     })
            //     return
            //   }

            //   // Build a backend-friendly payload
            //   // You can adapt this to your bulk APIs:
            //   // - POST /plans/:planId/bulk-assign  { assignments: [{ plan_unit_id, items:[{item_id, weight_kg}] }], ... }
            //   // - POST /plans/:planId/unassign     { items: [{ plan_unit_id, item_id }], ... }
            //   const assignsByUnit = new Map()
            //   const unassignList = []

            //   for (const c of changes) {
            //     if (c.op === 'assign') {
            //       if (!assignsByUnit.has(c.plan_unit_id))
            //         assignsByUnit.set(c.plan_unit_id, [])
            //       assignsByUnit
            //         .get(c.plan_unit_id)
            //         .push({ item_id: c.item_id, weight_kg: c.weight_kg })
            //     } else if (c.op === 'unassign') {
            //       unassignList.push({
            //         plan_unit_id: c.plan_unit_id,
            //         item_id: c.item_id,
            //       })
            //     } else if (c.op === 'move') {
            //       // Split into unassign + assign for server
            //       unassignList.push({
            //         plan_unit_id: c.from_plan_unit_id,
            //         item_id: c.item_id,
            //       })
            //       if (!assignsByUnit.has(c.to_plan_unit_id))
            //         assignsByUnit.set(c.to_plan_unit_id, [])
            //       assignsByUnit
            //         .get(c.to_plan_unit_id)
            //         .push({ item_id: c.item_id, weight_kg: c.weight_kg })
            //     }
            //   }

            //   const bulkAssignPayload = {
            //     assignments: Array.from(assignsByUnit.entries()).map(
            //       ([plan_unit_id, items]) => ({ plan_unit_id, items })
            //     ),
            //     customerUnitCap: 2, // optional: align with your rules
            //     enforce_family: false, // single-unit page → usually false
            //   }

            //   const unassignPayload = {
            //     items: unassignList,
            //     to_bucket: true,
            //     bucket_reason: 'manual',
            //     remove_empty_unit: true,
            //   }

            //   try {
            //     // 🔁 Placeholders — wire to your client fetch layer
            //     // await fetch(`/api/plans/${plan.id}/bulk-assign`, { method:'POST', body: JSON.stringify(bulkAssignPayload) })
            //     // await fetch(`/api/plans/${plan.id}/unassign`, { method:'POST', body: JSON.stringify(unassignPayload) })

            //     // On success, clear the local change log and snapshot new server state if you refetch:
            //     setChanges([])
            //     setUndoStack([])
            //     toast({ title: 'Committed', description: 'Assignments saved.' })

            //     // (Optional) Refetch plan → setAssignedUnits/setUnassigned/setPlan and refresh snapshot
            //   } catch (e) {
            //     handleAPIError(e, toast)
            //   }
            // }}
          >
            Commit ({changes.length})
          </button>

          <button
            className="rounded-md border px-3 py-2 text-sm"
            onClick={() => {
              const snap = initialSnapshotRef.current
              setPlan(snap.plan)
              setAssignedUnits(JSON.parse(JSON.stringify(snap.assigned_units)))
              setUnassigned(JSON.parse(JSON.stringify(snap.unassigned)))
              setChanges([])
              setUndoStack([])
              toast({ title: 'Reset', description: 'Local changes discarded.' })
            }}
          >
            Reset
          </button>
        </div>

        <div className="grid gap-6  ">
          <div className="grid gap-6  md:grid-cols-4">
            <div className="md:col-span-3">
              <div className="">
                {planned_unit && (
                  <VehicleCard
                    key={planned_unit.plan_unit_id}
                    unit={planned_unit}
                    onUnitChange={(updatedUnit) => {
                      setAssignedUnits((prev) =>
                        prev.map((u) =>
                          u.plan_unit_id === updatedUnit.plan_unit_id
                            ? updatedUnit
                            : u
                        )
                      )
                    }}
                    onUnassignAll={() =>
                      onUnassignAll(planned_unit.plan_unit_id)
                    }
                  />
                )}
              </div>
            </div>
            <div className="md:col-span-1">
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
