'use client'

import { useState, useMemo, memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ProgressBar } from './ProgressBar'
import { DraggableItemRow } from './DraggableItemRow'
import {
  Truck,
  User,
  MoreVertical,
  UserPlus,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { assignmentAPI, handleAPIError } from '@/lib/api-client'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight } from 'lucide-react'

export const VehicleCard = memo(function VehicleCard({
  unit,
  onUnitChange,
  onUnassignAll,
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [expandedRoutes, setExpandedRoutes] = useState(new Set())
  const { toast } = useToast()

  const { isOver, setNodeRef } = useDroppable({
    id: `unit:${unit.plan_unit_id}`,
  })

  const capacityPercentage = (unit.used_capacity_kg / unit.capacity_kg) * 100
  const isOverCapacity = capacityPercentage > 100
  const isNearCapacity = capacityPercentage >= 85

  const getVehicleDisplay = () => {
    if (unit.unit_type === 'rigid' && unit.rigid) {
      return {
        icon: <Truck className="h-4 w-4" />,
        name: unit.rigid.fleet_number,
        plate: unit.rigid.plate,
        type: 'Rigid',
      }
    } else if (
      unit.unit_type === 'horse+trailer' &&
      unit.horse &&
      unit.trailer
    ) {
      return {
        icon: <Truck className="h-4 w-4" />,
        name: `${unit.horse.fleet_number}+${unit.trailer.fleet_number}`,
        plate: `${unit.horse.plate} / ${unit.trailer.plate}`,
        type: 'Horse+Trailer',
      }
    }
    return {
      icon: <Truck className="h-4 w-4" />,
      name: 'Unknown Vehicle',
      plate: 'N/A',
      type: 'Unknown',
    }
  }

  const vehicle = getVehicleDisplay()

  const handleUnassignAll = async () => {
    setIsLoading(true)
    try {
      await assignmentAPI.unassignAllItems(unit.plan_unit_id)

      onUnitChange({
        ...unit,
        customers: [],
        used_capacity_kg: 0,
      })

      toast({
        title: 'Items Unassigned',
        description: `All items removed from ${vehicle.name}`,
      })
    } catch (error) {
      handleAPIError(error, toast)
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalItems = () => {
    return unit.customers.reduce((total, customer) => {
      return (
        total +
        customer.orders.reduce((orderTotal, order) => {
          return orderTotal + order.items.length
        }, 0)
      )
    }, 0)
  }

  const getUniqueCustomers = () => {
    return unit.customers.length
  }

  const getUniqueRoutes = () => {
    const routes = new Set(unit.customers.map((c) => c.route_name))
    return routes.size
  }

  const getDriverInfo = () => {
    if (unit.unit_type === 'rigid' && unit.rigid) {
      return {
        name: unit.driver_name || 'No driver assigned',
        source: 'rigid',
      }
    } else if (unit.unit_type === 'horse+trailer' && unit.horse) {
      return {
        name: unit.driver_name || 'No driver assigned',
        source: 'horse',
      }
    }
    return {
      name: 'No driver assigned',
      source: null,
    }
  }

  const groupedData = useMemo(() => {
    const routeGroups = new Map()

    unit.customers.forEach((customer) => {
      const routeName = customer.route_name

      if (!routeGroups.has(routeName)) {
        routeGroups.set(routeName, {
          route_name: routeName,
          suburbs: new Map(),
          total_weight: 0,
          total_items: 0,
        })
      }

      const route = routeGroups.get(routeName)
      const suburbName = customer.suburb_name

      if (!route.suburbs.has(suburbName)) {
        route.suburbs.set(suburbName, {
          suburb_name: suburbName,
          customers: [],
          total_weight: 0,
          total_items: 0,
        })
      }

      const suburb = route.suburbs.get(suburbName)

      const customerWeight = customer.orders.reduce(
        (sum, order) => sum + order.total_assigned_weight_kg,
        0
      )
      const customerItems = customer.orders.reduce(
        (sum, order) => sum + order.items.length,
        0
      )

      suburb.customers.push(customer)
      suburb.total_weight += customerWeight
      suburb.total_items += customerItems

      route.total_weight += customerWeight
      route.total_items += customerItems
    })

    return Array.from(routeGroups.values()).map((route) => ({
      ...route,
      suburbs: Array.from(route.suburbs.values()),
    }))
  }, [unit.customers])

  const driverInfo = getDriverInfo()

  const toggleRoute = (routeName) => {
    const newExpanded = new Set(expandedRoutes)
    if (newExpanded.has(routeName)) {
      newExpanded.delete(routeName)
    } else {
      newExpanded.add(routeName)
    }
    setExpandedRoutes(newExpanded)
  }

  return (
    <Card
      ref={setNodeRef}
      className={`rounded-2xl transition-all duration-200 ${
        isOverCapacity
          ? 'border-destructive shadow-lg animate-pulse'
          : isNearCapacity
          ? 'border-amber-500'
          : ''
      } ${
        isOver ? 'ring-2 ring-primary ring-offset-2 bg-accent/50 scale-105' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {vehicle.icon}
            <div>
              <h3 className="font-semibold text-sm">{vehicle.name}</h3>
              <p className="text-xs text-muted-foreground">{vehicle.plate}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2">
                <UserPlus className="h-4 w-4" />
                Assign Driver
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Change Vehicle
              </DropdownMenuItem>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="gap-2 text-destructive"
                    disabled={isLoading || getTotalItems() === 0}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="h-4 w-4" />
                    Unassign All Items
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unassign All Items</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to unassign all {getTotalItems()}{' '}
                      items from {vehicle.name}? This action will move all items
                      back to the unassigned list.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleUnassignAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Unassign All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Driver Info */}
        <div className="flex items-center gap-2 mt-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {driverInfo.name}
            {driverInfo.source && (
              <span className="ml-1 text-xs opacity-75">
                ({driverInfo.source})
              </span>
            )}
          </span>
        </div>

        {/* Vehicle Type and Stats */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {vehicle.type}
          </Badge>
          {groupedData.map((route) => (
            <Badge key={route.route_name} variant="outline" className="text-xs">
              {route.route_name}
            </Badge>
          ))}
          <Badge variant="outline" className="text-xs">
            {getUniqueCustomers()} customers
          </Badge>
        </div>

        {/* Capacity Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Capacity</span>
              {isOverCapacity && (
                <AlertTriangle className="h-3 w-3 text-destructive" />
              )}
            </div>
            <span
              className={`font-medium ${
                isOverCapacity
                  ? 'text-destructive'
                  : isNearCapacity
                  ? 'text-amber-600'
                  : 'text-foreground'
              }`}
            >
              {unit.used_capacity_kg}kg / {unit.capacity_kg}kg
            </span>
          </div>
          <ProgressBar
            value={capacityPercentage}
            className={
              isOverCapacity
                ? 'bg-destructive'
                : isNearCapacity
                ? 'bg-amber-500'
                : 'bg-primary'
            }
          />
          {isOverCapacity && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Over capacity by {(capacityPercentage - 100).toFixed(1)}%
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0  max-h-screen overflow-y-auto">
        {/* Items List */}
        <div className="space-y-3">
          {groupedData.length === 0 ? (
            <div
              className={`text-center py-8 text-muted-foreground transition-all duration-200 border-2 border-dashed border-muted-foreground/25 rounded-lg ${
                isOver ? 'scale-105 text-primary border-primary/50' : ''
              }`}
            >
              <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Drop items here</p>
              <p className="text-xs">
                Drag items from unassigned to load this vehicle
              </p>
            </div>
          ) : (
            groupedData.map((route) => (
              <Collapsible
                key={route.route_name}
                open={expandedRoutes.has(route.route_name)}
                onOpenChange={() => toggleRoute(route.route_name)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                    {expandedRoutes.has(route.route_name) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-medium text-sm">
                      {route.route_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {route.total_items} items
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {route.total_weight}kg
                    </Badge>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="ml-6 mt-2 space-y-3">
                  {route.suburbs.map((suburb) => (
                    <div key={suburb.suburb_name} className="space-y-2">
                      {/* Suburb Header */}
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm text-muted-foreground">
                          {suburb.suburb_name}
                        </h5>
                        <Badge variant="secondary" className="text-xs">
                          {suburb.total_weight}kg
                        </Badge>
                      </div>

                      {/* Customers in Suburb */}
                      {suburb.customers.map((customer) => (
                        <div
                          key={customer.customer_id || customer.customer_name}
                          className="ml-4 space-y-2"
                        >
                          {/* Customer Header */}
                          <div className="flex items-center justify-between">
                            <h6 className="font-medium text-sm">
                              {customer.customer_name}
                            </h6>
                            <Badge variant="outline" className="text-xs">
                              {customer.orders.reduce(
                                (total, order) =>
                                  total + order.total_assigned_weight_kg,
                                0
                              )}
                              kg
                            </Badge>
                          </div>

                          {/* Orders and Items */}
                          {customer.orders.map((order) => (
                            <div
                              key={order.order_id}
                              className="ml-4 space-y-1"
                            >
                              {order.items.map((item) => (
                                <DraggableItemRow
                                  key={item.item_id}
                                  item={item}
                                  customer={customer}
                                  containerId={`unit:${unit.plan_unit_id}`}
                                  isDraggable={true}
                                />
                              ))}

                              {/* Order Subtotal */}
                              <div className="flex items-center justify-between text-xs text-muted-foreground ml-4 pt-1 border-t border-border/50">
                                <span>Order Total</span>
                                <span className="font-medium">
                                  {order.total_assigned_weight_kg}kg
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
})
