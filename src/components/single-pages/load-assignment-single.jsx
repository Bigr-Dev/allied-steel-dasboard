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
import { useMemo, useState } from 'react'
import DetailActionBar from '../layout/detail-action-bar'
import { UnassignedList } from '../layout/assignment/UnassignedList'
import { VehicleCard } from '../layout/assignment/VehicleCard'
import { DraggableItemRow } from '../layout/assignment/DraggableItemRow'
import { createPortal } from 'react-dom'
import { useAssignmentPlan } from '@/hooks/assignment-plan/use-assignment-plan'

const LoadAssignmentSingle = ({ id }) => {
  const {
    assignment: { data },
  } = useGlobalContext()
  const { error, refresh, assignItem, unassignItem, unassignAllFromUnit } =
    useAssignmentPlan()
  const { toast } = useToast()
  //console.log('data :>> ', data)

  const [assignedUnits, setAssignedUnits] = useState(data?.assigned_units || [])
  const [unassigned, setUnassigned] = useState(data?.unassigned || [])
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(data?.plan || null)
  const [activeItem, setActiveItem] = useState(null)
  const [undoStack, setUndoStack] = useState([])
  const [changes, setChanges] = useState([])

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

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over) return

    const dragData = active.data.current
    if (!dragData) return

    const from = dragData.containerId
    const to = over.id

    if (from === to) return

    if (to.startsWith('unit:')) {
      const targetUnitId = to.slice(5)
      const targetUnit = assignedUnits.find(
        (unit) => unit.plan_unit_id === targetUnitId
      )

      if (targetUnit) {
        const newUsedCapacity = targetUnit.used_capacity_kg + dragData.weight
        if (newUsedCapacity > targetUnit.capacity_kg) {
          toast({
            title: 'Over Capacity',
            description: 'Cannot assign item - would exceed vehicle capacity',
            variant: 'destructive',
          })
          return
        }
      }
    }

    const movePayload = {
      item_id: dragData.item_id,
      assignment_id: dragData.assignment_id || null,
      from_plan_unit_id: from.startsWith('unit:') ? from.slice(5) : null,
      to_plan_unit_id: to.startsWith('unit:') ? to.slice(5) : null,
      weight: dragData.weight,
    }

    // Create undo state with deep copy only when needed
    const undoState = {
      assignedUnits: JSON.parse(JSON.stringify(assignedUnits)),
      unassigned: JSON.parse(JSON.stringify(unassigned)),
      timestamp: Date.now(),
    }

    handleOptimisticMove(movePayload)

    try {
      const data = await assignmentAPI.moveItem(movePayload)

      setAssignedUnits(data.assigned_units || assignedUnits)
      setUnassigned(data.unassigned || unassigned)

      setChanges((prev) => [...prev, movePayload])

      setUndoStack((prev) => [...prev.slice(-9), undoState])

      toast({
        title: 'Item Moved',
        description: 'Assignment updated successfully',
      })
    } catch (error) {
      setAssignedUnits(undoState.assignedUnits)
      setUnassigned(undoState.unassigned)
      handleAPIError(error, toast)
    }
  }

  // const handleDragStart = (event) => {
  //   const { active } = event

  //   let draggedItem = null
  //   let sourceType = null
  //   let sourceVehicleId = null

  //   const unassignedItem = unassigned.find((item) => item.item_id === active.id)
  //   if (unassignedItem) {
  //     draggedItem = unassignedItem
  //     sourceType = 'unassigned'
  //   } else {
  //     for (const unit of assignedUnits) {
  //       for (const customer of unit.customers) {
  //         for (const order of customer.orders) {
  //           const item = order.items.find((item) => item.item_id === active.id)
  //           if (item) {
  //             draggedItem = {
  //               ...item,
  //               customer_name: customer.customer_name,
  //               route_name: customer.route_name,
  //               suburb_name: customer.suburb_name,
  //             }
  //             sourceType = 'assigned'
  //             sourceVehicleId = unit.plan_unit_id
  //             break
  //           }
  //         }
  //         if (draggedItem) break
  //       }
  //       if (draggedItem) break
  //     }
  //   }

  //   setActiveItem({ item: draggedItem, sourceType, sourceVehicleId })
  // }

  // const handleDragEnd = async (event) => {
  //   const { active, over } = event
  //   setActiveItem(null)

  //   if (!over) return

  //   const dragData = active.data.current
  //   if (!dragData) return

  //   const from = dragData.containerId
  //   const to = over.id

  //   if (from === to) return

  //   if (to.startsWith('unit:')) {
  //     const targetUnitId = to.slice(5)
  //     const targetUnit = assignedUnits.find(
  //       (unit) => unit.plan_unit_id === targetUnitId
  //     )

  //     if (targetUnit) {
  //       const newUsedCapacity = targetUnit.used_capacity_kg + dragData.weight
  //       if (newUsedCapacity > targetUnit.capacity_kg) {
  //         toast({
  //           title: 'Over Capacity',
  //           description: 'Cannot assign item - would exceed vehicle capacity',
  //           variant: 'destructive',
  //         })
  //         return
  //       }
  //     }
  //   }

  //   const movePayload = {
  //     item_id: dragData.item_id,
  //     assignment_id: dragData.assignment_id || null,
  //     from_plan_unit_id: from.startsWith('unit:') ? from.slice(5) : null,
  //     to_plan_unit_id: to.startsWith('unit:') ? to.slice(5) : null,
  //     weight: dragData.weight,
  //   }

  //   const undoState = {
  //     assignedUnits: [...assignedUnits],
  //     unassigned: [...unassigned],
  //     timestamp: Date.now(),
  //   }

  //   await handleOptimisticMove(movePayload)

  //   try {
  //     const data = await assignmentAPI.moveItem(movePayload)

  //     setAssignedUnits(data.assigned_units || assignedUnits)
  //     setUnassigned(data.unassigned || unassigned)

  //     setChanges((prev) => [...prev, movePayload])

  //     setUndoStack((prev) => [...prev.slice(-9), undoState])

  //     toast({
  //       title: 'Item Moved',
  //       description: 'Assignment updated successfully',
  //     })
  //   } catch (error) {
  //     setAssignedUnits(undoState.assignedUnits)
  //     setUnassigned(undoState.unassigned)
  //     handleAPIError(error, toast)
  //   }
  // }

  const handleOptimisticMove = async (payload) => {
    const { item_id, from_plan_unit_id, to_plan_unit_id } = payload

    if (!from_plan_unit_id && to_plan_unit_id) {
      await handleAssignItem(item_id, to_plan_unit_id)
    } else if (from_plan_unit_id && !to_plan_unit_id) {
      await handleUnassignItem(item_id)
    } else if (
      from_plan_unit_id &&
      to_plan_unit_id &&
      from_plan_unit_id !== to_plan_unit_id
    ) {
      await handleUnassignItem(item_id)
      await handleAssignItem(item_id, to_plan_unit_id)
    }
  }

  const handleAssignItem = async (itemId, vehicleId) => {
    const item = unassigned.find((item) => item.item_id === itemId)
    if (!item) return

    const previousUnassigned = [...unassigned]
    const previousAssigned = [...assignedUnits]

    setUnassigned((prev) => prev.filter((item) => item.item_id !== itemId))

    setAssignedUnits((prev) =>
      prev.map((unit) => {
        if (unit.plan_unit_id === vehicleId) {
          const updatedUnit = { ...unit }
          updatedUnit.used_capacity_kg += item.weight_left

          let customerGroup = updatedUnit.customers.find(
            (c) => c.customer_name === item.customer_name
          )
          if (!customerGroup) {
            customerGroup = {
              customer_id: null,
              customer_name: item.customer_name,
              suburb_name: item.suburb_name,
              route_name: item.route_name,
              orders: [],
            }
            updatedUnit.customers.push(customerGroup)
          }

          let order = customerGroup.orders.find(
            (o) => o.order_id === item.order_id
          )
          if (!order) {
            order = {
              order_id: item.order_id,
              total_assigned_weight_kg: 0,
              items: [],
            }
            customerGroup.orders.push(order)
          }

          order.items.push({
            item_id: item.item_id,
            description: item.description,
            assigned_weight_kg: item.weight_left,
            assignment_id: `assign-${Date.now()}`,
          })
          order.total_assigned_weight_kg += item.weight_left

          return updatedUnit
        }
        return unit
      })
    )
  }

  const handleUnassignItem = async (itemId) => {
    let foundItem = null
    let sourceUnit = null

    for (const unit of assignedUnits) {
      for (const customer of unit.customers) {
        for (const order of customer.orders) {
          const item = order.items.find((item) => item.item_id === itemId)
          if (item) {
            foundItem = {
              ...item,
              customer_name: customer.customer_name,
              route_name: customer.route_name,
              suburb_name: customer.suburb_name,
              weight_left: item.assigned_weight_kg,
            }
            sourceUnit = unit
            break
          }
        }
        if (foundItem) break
      }
      if (foundItem) break
    }

    if (!foundItem || !sourceUnit) return

    const previousUnassigned = [...unassigned]
    const previousAssigned = [...assignedUnits]

    setUnassigned((prev) => [
      ...prev,
      {
        load_id: `load-${Date.now()}`,
        order_id: foundItem.order_id || `order-${Date.now()}`,
        item_id: foundItem.item_id,
        customer_name: foundItem.customer_name,
        suburb_name: foundItem.suburb_name,
        route_name: foundItem.route_name,
        weight_left: foundItem.assigned_weight_kg,
        description: foundItem.description,
      },
    ])

    setAssignedUnits((prev) =>
      prev.map((unit) => {
        if (unit.plan_unit_id === sourceUnit.plan_unit_id) {
          const updatedUnit = { ...unit }
          updatedUnit.used_capacity_kg -= foundItem.assigned_weight_kg

          updatedUnit.customers = updatedUnit.customers
            .map((customer) => {
              const updatedCustomer = { ...customer }
              updatedCustomer.orders = updatedCustomer.orders
                .map((order) => {
                  const updatedOrder = { ...order }
                  updatedOrder.items = updatedOrder.items.filter(
                    (item) => item.item_id !== itemId
                  )
                  updatedOrder.total_assigned_weight_kg =
                    updatedOrder.items.reduce(
                      (sum, item) => sum + item.assigned_weight_kg,
                      0
                    )
                  return updatedOrder
                })
                .filter((order) => order.items.length > 0)
              return updatedCustomer
            })
            .filter((customer) => customer.orders.length > 0)

          return updatedUnit
        }
        return unit
      })
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      // onDragStart={(evt) => {
      //   const item = evt.active?.data?.current?.item_id || null
      //   setActiveItem(item)
      // }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveItem(null)}
      // onDragEnd={async (evt) => {
      //   const { active, over } = evt
      //   //  console.log('evt :>> ', evt)
      //   setActiveItem(null)
      //   if (!active) return

      //   const item = active.data?.current?.item_id

      //   const from = 'bucket:unassigned' | `unit:${id}`

      //   const overId = getDropTargetId(over)

      //   if (!item || !overId || overId === from) return

      //   try {
      //     if (overId.startsWith('unit:')) {
      //       const plan_unit_id = overId.split(':')[1]
      //       await onAssignItem({ plan_unit_id, item })
      //       toast({ title: 'Assigned', description: `Moved item to vehicle` })
      //     } else if (overId === 'unassigned') {
      //       await onUnassignItem(item.item_id)
      //       toast({
      //         title: 'Unassigned',
      //         description: `Item returned to bucket`,
      //       })
      //     }
      //   } catch (e) {
      //     // error toast handled upstream if needed
      //   }
      // }}
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
          <div className="grid gap-6  md:grid-cols-4">
            <div className="md:col-span-1">
              <UnassignedList
                items={unassigned}
                onItemsChange={setUnassigned}
              />
            </div>
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
                    // onUnitChange={(updatedUnit) => {
                    //   setAssignedUnits((prev) =>
                    //     prev.map((u) =>
                    //       u.plan_unit_id === updatedUnit.plan_unit_id
                    //         ? updatedUnit
                    //         : u
                    //     )
                    //   )
                    // }}
                    onUnassignAll={() => onUnassignAll(u.plan_unit_id)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {typeof window !== 'undefined' &&
        createPortal(
          <DragOverlay>
            {activeItem ? (
              <div className="rounded-md border bg-popover px-2 py-1 text-sm shadow">
                {activeItem.description}
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  )
}

export default LoadAssignmentSingle
