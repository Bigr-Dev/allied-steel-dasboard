'use client'

import { useGlobalContext } from '@/context/global-context'
import { AssignmentBoard } from './AssignmentBoard'
import { useState } from 'react'
import DetailCard from '@/components/ui/detail-card'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AlertTriangle, Truck, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from './ProgressBar'
import { Separator } from '@/components/ui/separator'
import { useRouter } from 'next/navigation'

export function LoadAssignment() {
  const router = useRouter()
  const {
    assignment: { data },
  } = useGlobalContext()
  const assigned_units = data?.assigned_units || []
  const unassigned = data?.unassigned || []
  const plan = data?.plan || {}

  const [filters, setFilters] = useState({
    scope_branch_id: 'all',
    scope_customer_name: '',
    departure_date: '',
    cutoff_date: '',
    includeExisting: true,
    unit_type: 'all',
  })

  const getVehicleDisplay = (unit) => {
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

  const getDriverInfo = (unit) => {
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

  const getGroupUnitData = (unit) => {
    if (!unit || !unit.customers) return []

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
        (sum, order) => sum + (order.total_assigned_weight_kg || 0),
        0
      )
      const customerItems = customer.orders.reduce(
        (sum, order) => sum + (order.items?.length || 0),
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
  }

  // add these helpers inside LoadAssignmentSingle, above return
  // const onAssignItem = async ({ plan_unit_id, item }) => {
  //   // item here should be an UNASSIGNED item (has item_id, weight_left, description, etc.)
  //   await handleAssignItem(item.item_id, plan_unit_id)
  // }

  // const onUnassignItem = async (item_id) => {
  //   await handleUnassignItem(item_id)
  // }

  return (
    <DetailCard title="Vehicle Assignment">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {assigned_units.length > 0 &&
          assigned_units.map((unit, index) => {
            const vehicle = getVehicleDisplay(unit)
            const driverInfo = getDriverInfo(unit)
            const groupedData = getGroupUnitData(unit)
            const capacityPercentage =
              (unit.used_capacity_kg / unit.capacity_kg) * 100
            const isOverCapacity = capacityPercentage > 100
            const isNearCapacity = capacityPercentage >= 85
            //`/assignments/${plan.plan_id}/units/${unit.plan_unit_id}`
            return (
              <Card
                key={unit?.plan_unit_id || index}
                onClick={() =>
                  router.push(`/load-assignment/${unit.plan_unit_id}`)
                }
                className="cursor-pointer hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-end justify-between">
                    <div className="flex items-center gap-2">
                      {vehicle.icon}
                      <div>
                        <h3 className="font-semibold text-sm">
                          {vehicle.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.plate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {driverInfo.name}
                        {/* {driverInfo.source && (
                          <span className="ml-1 text-xs opacity-75">
                            ({driverInfo.source})
                          </span>
                        )} */}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {vehicle.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {unit.customers.length} customers
                    </Badge>
                  </div>
                  <Separator className="mt-2" />
                </CardHeader>

                <CardContent className="flex flex-col min-h-[150px] justify-between  ">
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {groupedData.map((route) => (
                      <Badge
                        key={route.route_name}
                        variant="outline"
                        className="text-xs"
                      >
                        {route.route_name}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 ">
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
                        Over capacity by {(capacityPercentage - 100).toFixed(1)}
                        %
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>
    </DetailCard>
  )
}
{
  /* <AssignmentBoard /> */
}
