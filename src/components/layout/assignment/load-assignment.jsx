'use client'

import { useGlobalContext } from '@/context/global-context'
import { AssignmentBoard } from './AssignmentBoard'
import { useEffect, useState } from 'react'
import DetailCard from '@/components/ui/detail-card'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertTriangle, Download, Truck, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from './ProgressBar'
import { Separator } from '@/components/ui/separator'
import { usePathname, useRouter } from 'next/navigation'
import { UnassignedList } from './UnassignedList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable, createSortableHeader } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export function LoadAssignment({ id, assignment, onEdit, preview }) {
  const router = useRouter()
  const pathname = usePathname()
  const {
    assignment_preview,
    setAssignmentPreview,
    vehicles,
    downloadPlan,
    downloading,
  } = useGlobalContext()

  useEffect(() => {
    if (assignment) {
      setAssignmentPreview(assignment?.data)
    }
  }, [assignment, setAssignmentPreview])

  const data = assignment?.data || assignment_preview
  //console.log('data :>> ', data)
  const assigned_units = data?.units || []
  const unassigned_orders = data?.unassigned_orders || []
  const unassigned_units = data?.unassigned_units || []
  const plan = data?.plan || {}
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    scope_branch_id: 'all',
    scope_customer_name: '',
    departure_date: '',
    cutoff_date: '',
    includeExisting: true,
    unit_type: 'all',
  })

  const tableInfo = {
    tabs: [
      {
        value: 'plan',
        title: `Vehicle Assignment `,
      },
      {
        value: 'unassigned',
        title: `Unassigned Items `,
      },
    ],
  }

  const getEnrichedVehicleInfo = (vehicleId) => {
    return vehicles?.data?.find((v) => v.id === vehicleId) || {}
  }

  const getVehicleDisplay = (unit) => {
    if (unit.vehicle_type === 'rigid' && unit.vehicle) {
      const enrichedVehicle = getEnrichedVehicleInfo(unit.vehicle.id)
      return {
        icon: <Truck className="h-4 w-4" />,
        name:
          enrichedVehicle.fleet_number ||
          unit.vehicle.fleet_number ||
          unit.vehicle.reg_number,
        plate: enrichedVehicle.license_plate || unit.vehicle.license_plate,
        type: 'Rigid',
      }
    } else if (unit.vehicle_type === 'horse' && unit.vehicle && unit.trailer) {
      const enrichedVehicle = getEnrichedVehicleInfo(unit.vehicle.id)
      const enrichedTrailer = getEnrichedVehicleInfo(unit.trailer.id)
      return {
        icon: <Truck className="h-4 w-4" />,
        name: `${
          enrichedVehicle.fleet_number ||
          unit.vehicle.fleet_number ||
          unit.vehicle.reg_number
        }+${
          enrichedTrailer.fleet_number ||
          unit.trailer.fleet_number ||
          unit.trailer.reg_number
        }`,
        plate: `${
          enrichedVehicle.license_plate || unit.vehicle.license_plate
        } / ${enrichedTrailer.license_plate || unit.trailer.license_plate}`,
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
    if (unit.driver) {
      return {
        name: `${unit.driver.name} ${unit.driver.last_name}`,
        source: unit.vehicle_type,
      }
    }
    return {
      name: 'No driver assigned',
      source: null,
    }
  }

  const getGroupUnitData = (unit) => {
    if (!unit || !unit.orders) return []

    const routeGroups = new Map()

    unit.orders.forEach((order) => {
      const routeName = order.route_name

      if (!routeGroups.has(routeName)) {
        routeGroups.set(routeName, {
          route_name: routeName,
          suburbs: new Map(),
          total_weight: 0,
          total_items: 0,
        })
      }

      const route = routeGroups.get(routeName)
      const suburbName = order.suburb_name

      if (!route.suburbs.has(suburbName)) {
        route.suburbs.set(suburbName, {
          suburb_name: suburbName,
          orders: [],
          total_weight: 0,
          total_items: 0,
        })
      }

      const suburb = route.suburbs.get(suburbName)

      suburb.orders.push(order)
      suburb.total_weight += order.total_weight || 0
      suburb.total_items += order.total_line_items || 0

      route.total_weight += order.total_weight || 0
      route.total_items += order.total_line_items || 0
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
  //console.log('commit :>> ', assignment?.data?.plan)
  const handleClick = ({ unit, preview, onEdit, id }) => {
    if (pathname.includes('create-plan')) {
      router.push(`${pathname}/${unit}`)
    } else {
      router.push(`/load-assignment/${unit}/${id}`)
    }
  }

  // Filter vehicles based on search query
  const filteredUnits = assigned_units.filter((unit) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    const vehicle = getVehicleDisplay(unit)
    const driver = getDriverInfo(unit)

    // Search in vehicle info
    if (
      vehicle.name?.toLowerCase().includes(query) ||
      vehicle.plate?.toLowerCase().includes(query)
    )
      return true

    // Search in driver name
    if (driver.name?.toLowerCase().includes(query)) return true

    // Search in orders and customers
    return unit.orders?.some(
      (order) =>
        order.customer_name?.toLowerCase().includes(query) ||
        order.route_name?.toLowerCase().includes(query) ||
        order.suburb_name?.toLowerCase().includes(query) ||
        order.sales_order_number?.toLowerCase().includes(query) ||
        order.order_lines?.some(
          (line) =>
            line.description?.toLowerCase().includes(query) ||
            line.ur_prod?.toLowerCase().includes(query)
        )
    )
  })

  // Columns for unassigned orders table
  const unassignedColumns = [
    {
      accessorKey: 'sales_order_number',
      header: createSortableHeader('Order #'),
    },
    {
      accessorKey: 'customer_name',
      header: createSortableHeader('Customer'),
    },
    {
      accessorKey: 'total_weight',
      header: createSortableHeader('Weight (kg)'),
      cell: ({ row }) => `${row.getValue('total_weight')}kg`,
    },
    {
      accessorKey: 'total_line_items',
      header: createSortableHeader('Items'),
    },
    {
      accessorKey: 'route_name',
      header: createSortableHeader('Route'),
    },
    {
      accessorKey: 'suburb_name',
      header: createSortableHeader('Suburb'),
    },
    {
      accessorKey: 'delivery_date',
      header: createSortableHeader('Delivery Date'),
    },
    {
      accessorKey: 'reason',
      header: createSortableHeader('Reason'),
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.getValue('reason')}>
          {row.getValue('reason')}
        </div>
      ),
    },
  ]
  return (
    <div className="grid grid-cols-1">
      <Tabs defaultValue={tableInfo?.tabs?.[0]?.value} className="w-full">
        <TabsList
          className={`grid w-full grid-cols-${tableInfo?.tabs?.length} gap-6`}
        >
          {tableInfo?.tabs.map((trigger, index) => {
            return (
              <TabsTrigger key={index} value={trigger.value}>
                <h6 className="capitalize font-bold">{trigger.title}</h6>
              </TabsTrigger>
            )
          })}
        </TabsList>
        <TabsContent
          // key={index}
          value={tableInfo?.tabs?.[0]?.value}
          className="space-y-4 "
        >
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    {plan?.id
                      ? `Vehicle Assignment - ${plan?.plan_name}`
                      : 'Tomorrows Assignment Preview'}
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      className="ml-auto border-[#003e69]"
                      onClick={downloadPlan}
                    >
                      {downloading ? (
                        <Spinner />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download Full Plan
                    </Button>
                  </div>
                </div>
              </CardTitle>
              <CardDescription>{plan?.notes}</CardDescription>
            </CardHeader>
            {/* Search Filter */}
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles, drivers, customers, order numbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div
                className={
                  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-h-screen overflow-y-auto'
                }
              >
                {filteredUnits.length > 0 &&
                  filteredUnits
                    .sort((a, b) => {
                      const aPercentage =
                        (a.used_capacity_kg / a.capacity_kg) * 100
                      const bPercentage =
                        (b.used_capacity_kg / b.capacity_kg) * 100
                      return aPercentage - bPercentage
                    })
                    .map((unit, index) => {
                      const vehicle = getVehicleDisplay(unit)
                      const driverInfo = getDriverInfo(unit)
                      const groupedData = getGroupUnitData(unit)
                      const capacityPercentage =
                        (unit.used_capacity_kg / unit.capacity) * 100
                      const isOverCapacity = capacityPercentage > 100
                      const isNearCapacity = capacityPercentage >= 85

                      //`/assignments/${plan.plan_id}/units/${unit.plan_unit_id}`
                      return (
                        <Card
                          key={unit?.planned_unit_id || index}
                          onClick={() => {
                            handleClick({
                              unit: unit.planned_unit_id,
                              preview,
                              onEdit,
                              id,
                            })
                          }}
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
                                {unit.summary?.total_customers || 0} customers
                              </Badge>
                            </div>
                            <Separator className="mt-2" />
                          </CardHeader>

                          <CardContent className="flex flex-col min-h-[150px] justify-between  ">
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {unit.routes_served?.map((route) => (
                                <Badge
                                  key={route}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {route}
                                </Badge>
                              ))}
                            </div>
                            <div className="mt-3 ">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">
                                    Capacity
                                  </span>
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
                                  {unit.used_capacity}kg / {unit.capacity}
                                  kg
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
                                  Over capacity by{' '}
                                  {(capacityPercentage - 100).toFixed(1)}%
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value={tableInfo?.tabs?.[1]?.value} className="space-y-4 ">
          <DetailCard
            title={`Unassigned Orders - ${plan?.plan_name || 'Preview'}`}
            description={
              plan?.id
                ? 'Orders that could not be assigned to any vehicle'
                : 'Orders that could not be assigned in the preview'
            }
          >
            <DataTable
              columns={unassignedColumns}
              data={unassigned_orders}
              filterColumn="customer_name"
              filterPlaceholder="Search orders, customers, routes..."
            />
          </DetailCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
