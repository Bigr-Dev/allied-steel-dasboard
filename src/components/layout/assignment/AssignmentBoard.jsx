'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { VehicleCard } from './VehicleCard'
import { UnassignedList } from './UnassignedList'
import { DraggableItemRow } from './DraggableItemRow'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { assignmentAPI, transformPlanData } from '@/lib/assignment-helpers'
import { RefreshCw, Save, RotateCcw } from 'lucide-react'
import { useGlobalContext } from '@/context/global-context'

export function AssignmentBoard() {
  const { fetchData } = useGlobalContext()

  const [assignedUnits, setAssignedUnits] = useState([])
  const [unassigned, setUnassigned] = useState([])
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(null)
  const [activeItem, setActiveItem] = useState(null)
  const [undoStack, setUndoStack] = useState([])
  const [changes, setChanges] = useState([])
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    loadAssignmentData()
  }, [])

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

  const handlePreviewPlan = async () => {
    try {
      const data = await assignmentAPI.getAssignments({ preview: true })
      console.log('data :>> ', data)
      setAssignedUnits(data.assigned_units || [])
      setUnassigned(data.unassigned || [])
      setPlan(data.plan || null)

      toast({
        title: 'Plan Updated',
        description: 'Preview plan refreshed successfully',
      })
    } catch (error) {
      handleAPIError(error, toast)
    }
  }

  const handleDragStart = (event) => {
    const { active } = event

    let draggedItem = null
    let sourceType = null
    let sourceVehicleId = null

    const unassignedItem = unassigned.find((item) => item.item_id === active.id)
    if (unassignedItem) {
      draggedItem = unassignedItem
      sourceType = 'unassigned'
    } else {
      for (const unit of assignedUnits) {
        for (const customer of unit.customers) {
          for (const order of customer.orders) {
            const item = order.items.find((item) => item.item_id === active.id)
            if (item) {
              draggedItem = {
                ...item,
                customer_name: customer.customer_name,
                route_name: customer.route_name,
                suburb_name: customer.suburb_name,
              }
              sourceType = 'assigned'
              sourceVehicleId = unit.plan_unit_id
              break
            }
          }
          if (draggedItem) break
        }
        if (draggedItem) break
      }
    }

    setActiveItem({ item: draggedItem, sourceType, sourceVehicleId })
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

    const undoState = {
      assignedUnits: [...assignedUnits],
      unassigned: [...unassigned],
      timestamp: Date.now(),
    }

    await handleOptimisticMove(movePayload)

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

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="h-6 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardHeader>
                  <div className="h-6 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-20 bg-muted rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {assignedUnits.map((unit) => (
                <VehicleCard
                  key={unit.plan_unit_id}
                  unit={unit}
                  onUnitChange={(updatedUnit) => {
                    setAssignedUnits((prev) =>
                      prev.map((u) =>
                        u.plan_unit_id === updatedUnit.plan_unit_id
                          ? updatedUnit
                          : u
                      )
                    )
                  }}
                />
              ))}

              {assignedUnits.length === 0 && (
                <DetailCard className="rounded-2xl border-dashed border-2 border-muted-foreground/25">
                  {/* <CardContent className="flex items-center justify-center h-48"> */}
                  <div className="text-center text-muted-foreground">
                    <p className="text-sm">No vehicles assigned</p>
                    <p className="text-xs mt-1">
                      Vehicles will appear here when assigned
                    </p>
                  </div>
                  {/* </CardContent> */}
                </DetailCard>
              )}
            </div>
          </div>
          <div className="lg:col-span-1">
            <UnassignedList items={unassigned} onItemsChange={setUnassigned} />
          </div>
        </div>

        <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {plan?.departure_date && `Departure: ${plan.departure_date}`}
              </span>
              {changes.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {changes.length} changes
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="gap-2 bg-transparent"
              >
                <RotateCcw className="h-4 w-4" />
                Undo
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={loadAssignmentData}
                className="gap-2 bg-transparent"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewPlan}
                className="gap-2 bg-transparent"
              >
                <RefreshCw className="h-4 w-4" />
                Preview Plan
              </Button>

              <Button
                size="sm"
                onClick={handleCommitPlan}
                disabled={changes.length === 0}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Commit Plan
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="rotate-3 opacity-90">
            <DraggableItemRow
              item={activeItem.item}
              isDraggable={false}
              isUnassigned={activeItem.sourceType === 'unassigned'}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
