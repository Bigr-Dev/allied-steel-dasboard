'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useGlobalContext } from '@/context/global-context'
import { useToast } from '@/hooks/use-toast'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Truck, User, MapPin, RefreshCw } from 'lucide-react'
import Link from 'next/link'

/**
 * Helpers to read capacity & driver/vehicle info from buildPlanPayload units
 */
function parseCapacity(raw, fallback = 20000) {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return n
}

function getUnitCapacityKg(unit) {
  if (!unit) return 20000
  if (unit.vehicle_type === 'horse') {
    // horse + trailer → use trailer.capacity
    return parseCapacity(unit.trailer?.capacity)
  }
  // rigid → use vehicle.capacity
  return parseCapacity(unit.vehicle?.capacity)
}

function getUnitUsedWeightKg(unit) {
  if (!unit) return 0
  const summaryWeight = Number(unit.summary?.total_weight || 0)
  if (Number.isFinite(summaryWeight)) return summaryWeight
  // fallback: sum order weights
  return (unit.orders || []).reduce(
    (sum, o) => sum + Number(o.total_weight || 0),
    0
  )
}

function getVehicleLabel(unit) {
  if (!unit) return { name: 'Unknown vehicle', plate: '' }

  const v = unit.vehicle || {}
  const trailer = unit.trailer || {}

  if (unit.vehicle_type === 'horse') {
    const name =
      trailer.plate ||
      trailer.reg_number ||
      trailer.vehicle_description ||
      v.reg_number ||
      v.plate ||
      'Horse + Trailer'
    const plate = `${v.plate || v.reg_number || ''}${
      v.plate || v.reg_number ? ' + ' : ''
    }${trailer.plate || trailer.reg_number || ''}`.trim()
    return { name, plate }
  }

  const name = v.vehicle_description || v.reg_number || v.plate || 'Rigid'
  const plate = v.plate || v.reg_number || ''
  return { name, plate }
}

function getDriverLabel(unit) {
  const d = unit?.driver
  if (!d) return 'No driver'
  const parts = [d.name, d.last_name].filter(Boolean)
  if (parts.length === 0) return 'Unnamed driver'
  return parts.join(' ')
}

/**
 * Map a full buildPlanPayload into:
 *  - selected unit (by planned_unit_id)
 *  - assignedOrders: orders[] for that unit
 *  - unassignedOrders: all unassigned_orders (you can filter further on route/branch if you want)
 */
function deriveViewModel(data, unitId) {
  const plan = data?.plan || null
  const units = data?.units || []
  const unassignedAll = data?.unassigned_orders || []

  const unit =
    units.find((u) => String(u.planned_unit_id) === String(unitId)) ||
    units[0] ||
    null

  const assignedOrders = unit?.orders || []
  const unassignedOrders = unassignedAll

  return { plan, unit, assignedOrders, unassignedOrders }
}

const LoadAssignmentSingle = ({ id, data }) => {
  const { fetchData, setAssignmentPreview } = useGlobalContext()
  const { toast } = useToast()

  const [payload, setPayload] = useState(data || null)
  const [isSaving, setIsSaving] = useState(false)

  // Whenever props.data changes (navigation/refetch), refresh local state + context
  useEffect(() => {
    if (!data) return
    setPayload(data)
    setAssignmentPreview(data)
  }, [data, setAssignmentPreview])

  const { plan, unit, assignedOrders, unassignedOrders } = useMemo(
    () => deriveViewModel(payload, id),
    [payload, id]
  )

  const capacity = getUnitCapacityKg(unit)
  const used = getUnitUsedWeightKg(unit)
  const capacityPct = capacity > 0 ? (used / capacity) * 100 : 0
  const isOverCapacity = capacityPct > 100
  const isNearCapacity = capacityPct >= 85 && capacityPct <= 100

  const vehicleLabel = getVehicleLabel(unit)
  const driverLabel = getDriverLabel(unit)

  const refreshFromServer = async () => {
    if (!plan?.id) return
    try {
      const res = await fetchData(`planner/plans/${plan.id}`, 'GET')
      if (res?.success && res.data) {
        setPayload(res.data)
        setAssignmentPreview(res.data)
        toast({
          title: 'Refreshed',
          description: 'Plan reloaded from server.',
        })
      } else {
        throw new Error(res?.message || 'Failed to refresh plan')
      }
    } catch (err) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Refresh failed',
        description: err.message || 'Could not reload plan',
      })
    }
  }

  const handleAssignOrder = async (order) => {
    if (!plan?.id || !unit?.planned_unit_id || !order?.order_id) return
    setIsSaving(true)
    try {
      const body = {
        plan_id: plan.id,
        assignments: [
          {
            planned_unit_id: unit.planned_unit_id,
            order_ids: [order.order_id],
          },
        ],
      }

      const res = await fetchData(
        `planner/plans/${plan.id}/bulk-assign`,
        'POST',
        body
      )

      if (!res?.success) {
        throw new Error(res?.message || 'Bulk assign failed')
      }

      if (res.data) {
        setPayload(res.data)
        setAssignmentPreview(res.data)
      }

      toast({
        title: 'Order assigned',
        description: `Order ${
          order.sales_order_number || order.order_id
        } assigned to unit.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Assign failed',
        description: err.message || 'Could not assign order',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnassignOrder = async (order) => {
    if (!plan?.id || !unit?.planned_unit_id || !order?.order_id) return
    setIsSaving(true)
    try {
      const body = {
        plan_id: plan.id,
        planned_unit_id: unit.planned_unit_id,
        order_ids: [order.order_id],
      }

      const res = await fetchData('planner/unassign-unit', 'POST', body)

      if (!res?.success) {
        throw new Error(res?.message || 'Unassign failed')
      }

      if (res.data) {
        setPayload(res.data)
        setAssignmentPreview(res.data)
      }

      toast({
        title: 'Order unassigned',
        description: `Order ${
          order.sales_order_number || order.order_id
        } moved back to bucket.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Unassign failed',
        description: err.message || 'Could not unassign order',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!plan || !unit) {
    return (
      <div className="p-6">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>No plan / unit found</CardTitle>
            <CardDescription>
              Make sure you loaded this page with a valid plan and planned unit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/load-assignments">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to planner
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/load-assignments">
              <Button variant="ghost" size="icon" className="mr-1">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">
              Plan for {plan.departure_date || 'N/A'}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Branch scope:{' '}
            <span className="font-medium">
              {plan.scope_branch_name || 'All branches'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={refreshFromServer}
            disabled={isSaving}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Unit card */}
      <Card className="border rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  {vehicleLabel.name}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-1 text-xs">
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {vehicleLabel.plate || 'No plate'}
                  </Badge>
                  <span className="mx-1 text-muted-foreground">•</span>
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {driverLabel}
                  </span>
                </CardDescription>
              </div>
            </div>

            <div className="space-y-1 md:text-right">
              <div className="text-xs text-muted-foreground flex md:justify-end gap-2">
                <span>Capacity:</span>
                <span className="font-medium">
                  {used.toFixed(2)} / {capacity.toFixed(2)} kg
                </span>
              </div>
              <Progress
                value={Math.min(capacityPct, 130)}
                className={`h-2 rounded-full ${
                  isOverCapacity
                    ? 'bg-destructive/20'
                    : isNearCapacity
                    ? 'bg-amber-500/20'
                    : ''
                }`}
              />
              <div className="text-[11px] text-muted-foreground">
                {isOverCapacity
                  ? 'Over capacity'
                  : isNearCapacity
                  ? 'Near capacity'
                  : 'Within safe capacity'}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Route(s):{' '}
              <span className="font-medium">
                {Array.from(
                  new Set(
                    (unit.orders || []).map((o) => o.route_name).filter(Boolean)
                  )
                ).join(', ') || 'N/A'}
              </span>
            </span>
            <span className="mx-1">•</span>
            <span>
              Orders:{' '}
              <span className="font-medium">
                {(unit.summary?.orders_assigned ??
                  (unit.orders || []).length) ||
                  0}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout: assigned vs unassigned */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assigned orders */}
        <Card className="border rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Assigned to this unit</CardTitle>
              <Badge variant="outline" className="text-[11px]">
                {assignedOrders.length} order
                {assignedOrders.length === 1 ? '' : 's'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Click <span className="font-semibold">Unassign</span> to move an
              order back to the bucket.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[420px] pr-2">
              {assignedOrders.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No orders assigned to this unit yet.
                </p>
              )}

              <div className="space-y-2">
                {assignedOrders.map((order) => (
                  <div
                    key={order.order_id}
                    className="border rounded-xl p-2.5 text-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold">
                        {order.sales_order_number || order.order_id}
                      </div>
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={isSaving}
                        onClick={() => handleUnassignOrder(order)}
                      >
                        Unassign
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="font-medium">
                        {order.customer_name || 'Unknown customer'}
                      </span>
                      <span>• {order.route_name || 'No route'}</span>
                      <span>• {order.suburb_name || 'No suburb'}</span>
                      <span>
                        • {Number(order.total_weight || 0).toFixed(2)} kg
                      </span>
                      <span>• {order.lines?.length || 0} line(s)</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Unassigned orders */}
        <Card className="border rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Unassigned orders</CardTitle>
              <Badge variant="outline" className="text-[11px]">
                {unassignedOrders.length} order
                {unassignedOrders.length === 1 ? '' : 's'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Click <span className="font-semibold">Assign</span> to load an
              entire order onto this unit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[420px] pr-2">
              {unassignedOrders.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nothing in the unassigned bucket for this plan.
                </p>
              )}

              <div className="space-y-2">
                {unassignedOrders.map((order) => (
                  <div
                    key={order.order_id}
                    className="border rounded-xl p-2.5 text-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold">
                        {order.sales_order_number || order.order_id}
                      </div>
                      <Button
                        variant="default"
                        size="xs"
                        disabled={isSaving}
                        onClick={() => handleAssignOrder(order)}
                      >
                        Assign
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="font-medium">
                        {order.customer_name || 'Unknown customer'}
                      </span>
                      <span>• {order.route_name || 'No route'}</span>
                      <span>• {order.suburb_name || 'No suburb'}</span>
                      <span>
                        • {Number(order.total_weight || 0).toFixed(2)} kg
                      </span>
                      <span>• {order.lines?.length || 0} line(s)</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoadAssignmentSingle

// 'use client'
// import { useGlobalContext } from '@/context/global-context'
// import { useToast } from '@/hooks/use-toast'
// import { handleAPIError } from '@/lib/api-client'
// import {
//   DndContext,
//   DragOverlay,
//   closestCenter,
//   KeyboardSensor,
//   useSensor,
//   useSensors,
//   PointerSensor,
// } from '@dnd-kit/core'
// import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
// import { useMemo, useState, useEffect, useRef } from 'react'
// import DetailActionBar from '../layout/detail-action-bar'
// import { UnassignedList } from '../layout/assignment/UnassignedList'
// import { VehicleCard } from '../layout/assignment/VehicleCard'
// import { createPortal } from 'react-dom'
// import { useAssignmentPlan } from '@/hooks/assignment-plan/use-assignment-plan'

// // helpers

// async function commitImmediateMove(planId, payload, fetchData) {
//   const { item_id, weight_kg, from_plan_unit_id, to_plan_unit_id } = payload

//   // A) Bucket → Unit (assign)  ✅ working
//   if (!from_plan_unit_id && to_plan_unit_id) {
//     await fetchData(`plans/${planId}/bulk-assign`, 'POST', {
//       plan_id: planId, // REQUIRED by bulk-assign
//       assignments: [
//         {
//           plan_unit_id: to_plan_unit_id,
//           items: [{ item_id, weight_kg, note: 'manual' }],
//         },
//       ],
//       customerUnitCap: 0, // skip cap to avoid DB join ambiguity; set >0 if you want caps enforced
//       // enforce_family: false, // optional
//     })
//     return
//   }

//   // B) Unit → Bucket (unassign)  ✅ normalized shape
//   if (from_plan_unit_id && !to_plan_unit_id) {
//     await fetchData(`plans/${planId}/unassign`, 'POST', {
//       plan_id: planId, // include plan_id for clarity
//       items: [{ plan_unit_id: from_plan_unit_id, item_id }], // send as ARRAY
//       to_bucket: true,
//       bucket_reason: 'manual',
//       remove_empty_unit: true,
//     })
//     return
//   }

//   // C) Unit → Unit (move)  ✅ robust: unassign then bulk-assign
//   if (
//     from_plan_unit_id &&
//     to_plan_unit_id &&
//     from_plan_unit_id !== to_plan_unit_id
//   ) {
//     // 1) Unassign from source (no bucket write)
//     await fetchData(`plans/${planId}/unassign`, 'POST', {
//       plan_id: planId,
//       items: [{ plan_unit_id: from_plan_unit_id, item_id }],
//       to_bucket: false,
//       remove_empty_unit: true,
//     })

//     // 2) Assign to destination via bulk-assign
//     await fetchData(`plans/${planId}/bulk-assign`, 'POST', {
//       plan_id: planId,
//       assignments: [
//         {
//           plan_unit_id: to_plan_unit_id,
//           items: [{ item_id, weight_kg, note: 'manual-move' }],
//         },
//       ],
//       customerUnitCap: 0,
//       // enforce_family: false,
//     })
//     return
//   }
// }

// function removeItemFromUnitCustomers(customers = [], item_id) {
//   let removedWeight = 0
//   const nextCustomers = customers
//     .map((c) => {
//       const nextOrders = (c.orders || [])
//         .map((o) => {
//           const before = o.items || []
//           const kept = before.filter((it) => it.item_id !== item_id)
//           if (kept.length !== before.length) {
//             const removed = before.find((it) => it.item_id === item_id)
//             removedWeight += Number(removed?.assigned_weight_kg || 0)
//           }
//           return {
//             ...o,
//             items: kept,
//             total_assigned_weight_kg:
//               Number(o.total_assigned_weight_kg || 0) -
//               Number(
//                 (o.items || []).find((it) => it.item_id === item_id)
//                   ?.assigned_weight_kg || 0
//               ),
//           }
//         })
//         .filter((o) => (o.items || []).length > 0)
//       return { ...c, orders: nextOrders }
//     })
//     .filter((c) => (c.orders || []).length > 0)

//   return { nextCustomers, removedWeight }
// }

// const norm = (s) => (s == null ? '' : String(s).trim().toLowerCase())
// const sameCustomerIdOrName = (aId, aName, bId, bName) => {
//   const aHas = aId != null && aId !== ''
//   const bHas = bId != null && bId !== ''
//   if (aHas && bHas) return String(aId) === String(bId)
//   // fallback to name if id missing on either side
//   return norm(aName) === norm(bName)
// }
// const sameGroup = (c, meta) =>
//   sameCustomerIdOrName(
//     c.customer_id,
//     c.customer_name,
//     meta.customer_id,
//     meta.customer_name
//   ) &&
//   norm(c.route_name) === norm(meta.route_name) &&
//   norm(c.suburb_name) === norm(meta.suburb_name)

// function addItemIntoUnitCustomers(customers = [], meta) {
//   // meta must include: customer_id, customer_name, route_name, suburb_name, order_id, item_id, description, weight_left

//   const {
//     customer_id,
//     customer_name,
//     route_name,
//     suburb_name,
//     order_id,
//     item_id,
//     description,
//     weight_left,
//   } = meta

//   // deep-ish copy to preserve immutability
//   let next = customers.map((c) => ({
//     ...c,
//     orders: (c.orders || []).map((o) => ({
//       ...o,
//       items: [...(o.items || [])],
//     })),
//   }))

//   // 1) Try to find an exact group match (id/name + route/suburb)
//   let cIdx = next.findIndex((c) => sameGroup(c, meta))

//   // 2) If not found, try to find the same customer by id OR name, then prefer route/suburb, else first
//   if (cIdx === -1) {
//     const candidates = next
//       .map((c, idx) => ({ c, idx }))
//       .filter(({ c }) =>
//         sameCustomerIdOrName(
//           c.customer_id,
//           c.customer_name,
//           customer_id,
//           customer_name
//         )
//       )
//     if (candidates.length) {
//       const rn = norm(route_name)
//       const sn = norm(suburb_name)
//       const exactBoth = candidates.find(
//         ({ c }) => norm(c.route_name) === rn && norm(c.suburb_name) === sn
//       )
//       const exactRoute = candidates.find(({ c }) => norm(c.route_name) === rn)
//       const exactSuburb = candidates.find(({ c }) => norm(c.suburb_name) === sn)
//       cIdx = (exactBoth || exactRoute || exactSuburb || candidates[0]).idx
//     }
//   }

//   // 3) Still not found? Create the customer group
//   if (cIdx === -1) {
//     next = [
//       ...next,
//       {
//         customer_id,
//         customer_name, // keep for rendering; never for keys
//         route_name: route_name || null,
//         suburb_name: suburb_name || null,
//         orders: [],
//       },
//     ]
//     cIdx = next.length - 1
//   }

//   // 4) Find or create the order group
//   const cust = next[cIdx]
//   let oIdx = (cust.orders || []).findIndex(
//     (o) => String(o.order_id) === String(order_id)
//   )
//   if (oIdx === -1) {
//     next[cIdx] = {
//       ...cust,
//       orders: [
//         ...(cust.orders || []),
//         { order_id, total_assigned_weight_kg: 0, items: [] },
//       ],
//     }
//     oIdx = next[cIdx].orders.length - 1
//   }

//   // 5) Duplicate guard at item level
//   const order = next[cIdx].orders[oIdx]
//   if (
//     (order.items || []).some((it) => String(it.item_id) === String(item_id))
//   ) {
//     return { nextCustomers: next, addedWeight: 0 } // no-op if already present
//   }

//   const w = Number(weight_left || 0)
//   const nextItems = [
//     ...(order.items || []),
//     {
//       item_id,
//       description,
//       assigned_weight_kg: w,
//       assignment_id: `local-${item_id}`,
//       order_number: meta.order_number,
//     },
//   ]
//   const nextOrder = {
//     ...order,
//     items: nextItems,
//     total_assigned_weight_kg: Number(order.total_assigned_weight_kg || 0) + w,
//   }

//   const ordersCopy = [...next[cIdx].orders]
//   ordersCopy[oIdx] = nextOrder
//   next[cIdx] = { ...next[cIdx], orders: ordersCopy }

//   return { nextCustomers: next, addedWeight: w }
// }

// const LoadAssignmentSingle = ({ id, data }) => {
//   const { setAssignmentPreview, fetchData } = useGlobalContext()
//   const { unassignAllFromUnit } = useAssignmentPlan()
//   console.log('data :>> ', data)
//   const { toast } = useToast()

//   const [assignedUnits, setAssignedUnits] = useState(data?.assigned_units || [])
//   const [unassigned, setUnassigned] = useState(data?.unassigned || [])

//   const [plan, setPlan] = useState(data?.plan || null)
//   const [activeItem, setActiveItem] = useState(null)
//   const [undoStack, setUndoStack] = useState([])
//   const [changes, setChanges] = useState([])

//   const initialSnapshotRef = useRef({
//     plan: data?.plan || null,
//     assigned_units: JSON.parse(JSON.stringify(data?.assigned_units || [])),
//     unassigned: JSON.parse(JSON.stringify(data?.unassigned || [])),
//   })

//   // If the page receives new data (e.g., navigation), refresh the snapshot
//   useEffect(() => {
//     initialSnapshotRef.current = {
//       plan: data?.plan || null,
//       assigned_units: JSON.parse(JSON.stringify(data?.assigned_units || [])),
//       unassigned: JSON.parse(JSON.stringify(data?.unassigned || [])),
//     }
//     setAssignedUnits(data?.units || [])
//     setUnassigned(data?.unassigned_orders || [])
//     setPlan(data?.plan || null)
//     setChanges([])
//     setUndoStack([])
//   }, [data])

//   // Sync local state changes to global context
//   useEffect(() => {
//     setAssignmentPreview({
//       plan,
//       assigned_units: assignedUnits,
//       unassigned: unassigned,
//     })
//   }, [assignedUnits, unassigned, plan, setAssignmentPreview])

//   const planned_unit = assignedUnits?.find((v) => v.plan_unit_id === id)

//   const onUnassignAll = unassignAllFromUnit

//   const sensors = useSensors(
//     useSensor(PointerSensor, {
//       activationConstraint: {
//         distance: 12,
//         delay: 100,
//         tolerance: 8,
//       },
//     }),
//     useSensor(KeyboardSensor, {
//       coordinateGetter: sortableKeyboardCoordinates,
//     })
//   )

//   // Memoize item lookup for better performance

//   const itemLookupMap = useMemo(() => {
//     const map = new Map()

//     // Add unassigned items
//     unassigned.forEach((item) => {
//       map.set(item.item_id, {
//         item,
//         sourceType: 'unassigned',
//         sourceVehicleId: null,
//       })
//     })

//     // Add assigned items
//     assignedUnits.forEach((unit) => {
//       unit.customers.forEach((customer) => {
//         customer.orders.forEach((order) => {
//           order.items.forEach((item) => {
//             map.set(item.item_id, {
//               item: {
//                 ...item,
//                 customer_name: customer.customer_name,
//                 route_name: customer.route_name,
//                 suburb_name: customer.suburb_name,
//               },
//               sourceType: 'assigned',
//               sourceVehicleId: unit.plan_unit_id,
//             })
//           })
//         })
//       })
//     })

//     return map
//   }, [assignedUnits, unassigned])

//   const handleDragStart = (event) => {
//     const { active } = event
//     const lookupResult = itemLookupMap.get(active.id)

//     if (lookupResult) {
//       setActiveItem(lookupResult)
//     }
//   }

//   const handleDragEnd = (event) => {
//     const { active, over } = event
//     setActiveItem(null)
//     if (!over) return
//     const dragData = active.data.current
//     if (!dragData) return

//     const from = dragData.containerId
//     const to = over.id
//     if (from === to) return

//     // … (your capacity guard + undo snapshot stays unchanged)

//     const move = {
//       item_id: dragData.item_id,
//       weight_kg: dragData.weight,
//       from_plan_unit_id: from.startsWith('unit:') ? from.slice(5) : null,
//       to_plan_unit_id: to.startsWith('unit:') ? to.slice(5) : null,
//     }

//     // Optimistic local update (your existing helper)
//     handleOptimisticMove(move)

//     // Track change locally (optional – keep if you still show “undo”)
//     setChanges((prev) => [...prev /* your existing op mapping */])

//     // 🔴 NEW: immediately persist this single change via manually-assign / unassign
//     // plan.id is already in component state
//     commitImmediateMove(plan?.id, move, fetchData)
//       .then(() => {
//         toast({ title: 'Saved', description: 'Change committed.' })
//       })
//       .catch((err) => {
//         handleAPIError(err, toast)
//         // optional rollback: pop undo & restore snapshot
//         if (undoStack.length) handleUndo()
//       })

//     // Keep your toast about local update if you like, or rely on the "Saved" toast above.
//   }

//   const handleOptimisticMove = async (payload) => {
//     const { item_id, from_plan_unit_id, to_plan_unit_id } = payload

//     if (!from_plan_unit_id && to_plan_unit_id) {
//       // await handleAssignItem(item_id, to_plan_unit_id)
//       handleAssignItem(item_id, to_plan_unit_id)
//     } else if (from_plan_unit_id && !to_plan_unit_id) {
//       // await handleUnassignItem(item_id)
//       handleUnassignItem(item_id)
//     } else if (
//       from_plan_unit_id &&
//       to_plan_unit_id &&
//       from_plan_unit_id !== to_plan_unit_id
//     ) {
//       handleUnassignItem(item_id)
//       handleAssignItem(item_id, to_plan_unit_id)
//       //  await handleUnassignItem(item_id)
//       //  await handleAssignItem(item_id, to_plan_unit_id)
//     }
//   }

//   const handleAssignItem = (itemId, vehicleId) => {
//     const meta = unassigned.find((x) => String(x.item_id) === String(itemId))
//     if (!meta) return

//     // remove from unassigned
//     setUnassigned((prev) =>
//       prev.filter((x) => String(x.item_id) !== String(itemId))
//     )

//     // add into the destination unit immutably
//     setAssignedUnits((prev) =>
//       prev.map((u) => {
//         if (String(u.plan_unit_id) !== String(vehicleId)) return u
//         const { nextCustomers, addedWeight } = addItemIntoUnitCustomers(
//           u.customers || [],
//           meta
//         )
//         return {
//           ...u,
//           customers: nextCustomers,
//           used_capacity_kg:
//             Number(u.used_capacity_kg || 0) + Number(addedWeight || 0),
//         }
//       })
//     )
//   }

//   const handleUnassignItem = (itemId) => {
//     const metaFromUnits =
//       assignedUnits.flatMap((u) =>
//         (u.customers || []).flatMap((c) =>
//           (c.orders || []).flatMap((o) =>
//             (o.items || [])
//               .filter((it) => String(it.item_id) === String(itemId))
//               .map((it) => ({
//                 item_id: it.item_id,
//                 description: it.description,
//                 weight_left: it.assigned_weight_kg,
//                 customer_id: c.customer_id,
//                 customer_name: c.customer_name,
//                 route_name: c.route_name,
//                 suburb_name: c.suburb_name,
//                 order_id: o.order_id,
//                 order_number: it.order_number,
//               }))
//           )
//         )
//       )[0] || null

//     setAssignedUnits((prev) =>
//       prev.map((u) => {
//         const { nextCustomers, removedWeight } = removeItemFromUnitCustomers(
//           u.customers || [],
//           itemId
//         )
//         if (!removedWeight) return u
//         return {
//           ...u,
//           customers: nextCustomers,
//           used_capacity_kg: Math.max(
//             0,
//             Number(u.used_capacity_kg || 0) - Number(removedWeight || 0)
//           ),
//         }
//       })
//     )

//     setUnassigned((prev) =>
//       prev.some((x) => String(x.item_id) === String(itemId))
//         ? prev
//         : [
//             ...prev,
//             metaFromUnits || {
//               item_id: itemId,
//               description: '',
//               weight_left: 0,
//               order_number: 'No Order',
//             },
//           ]
//     )
//   }

//   const handleUndo = () => {
//     if (undoStack.length === 0) return

//     const lastState = undoStack[undoStack.length - 1]
//     setAssignedUnits(lastState.assignedUnits)
//     setUnassigned(lastState.unassigned)
//     setUndoStack((prev) => prev.slice(0, -1))
//     setChanges((prev) => prev.slice(0, -1))

//     toast({
//       title: 'Undone',
//       description: 'Last action has been undone',
//     })
//   }

//   return (
//     <DndContext
//       sensors={sensors}
//       collisionDetection={closestCenter}
//       onDragStart={handleDragStart}
//       onDragEnd={handleDragEnd}
//       onDragCancel={() => setActiveItem(null)}
//     >
//       <div className="space-y-6">
//         <DetailActionBar
//           id={id}
//           title={
//             planned_unit?.rigid ? planned_unit?.rigid?.fleet_number : 'N/A'
//           }
//           description={planned_unit?.rigid ? planned_unit?.rigid?.plate : 'N/A'}
//         />

//         <div className="grid gap-6  ">
//           <div className="grid gap-6  md:grid-cols-12">
//             <div className="md:col-span-7">
//               <div className="">
//                 {planned_unit && (
//                   <VehicleCard
//                     key={planned_unit.plan_unit_id}
//                     unit={planned_unit}
//                     onUnitChange={(updatedUnit) => {
//                       setAssignedUnits((prev) =>
//                         prev.map((u) =>
//                           u.plan_unit_id === updatedUnit.plan_unit_id
//                             ? updatedUnit
//                             : u
//                         )
//                       )
//                     }}
//                     onUnassignAll={() =>
//                       onUnassignAll(planned_unit.plan_unit_id)
//                     }
//                   />
//                 )}
//               </div>
//             </div>
//             <div className="md:col-span-5">
//               <UnassignedList
//                 items={unassigned}
//                 onItemsChange={setUnassigned}
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {typeof window !== 'undefined' &&
//         createPortal(
//           <DragOverlay>
//             {activeItem ? (
//               <div className="rounded-md border bg-popover px-2 py-1 text-sm shadow">
//                 {activeItem.item?.description || activeItem.item?.item_id}
//               </div>
//             ) : null}
//           </DragOverlay>,
//           document.body
//         )}
//     </DndContext>
//   )
// }

// export default LoadAssignmentSingle
