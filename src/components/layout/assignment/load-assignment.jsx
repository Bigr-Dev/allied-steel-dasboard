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
import { AlertTriangle, Truck, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from './ProgressBar'
import { Separator } from '@/components/ui/separator'
import { usePathname, useRouter } from 'next/navigation'
import { UnassignedList } from './UnassignedList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable, createSortableHeader } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function LoadAssignment({ id, assignment, onEdit, preview }) {
  const router = useRouter()
  const pathname = usePathname()
  console.log('assignment :>> ', assignment?.data)
  //console.log('preview :>> ', preview)
  const {
    assignment: { data: context_data },
    assignment_preview,
    setAssignmentPreview,
  } = useGlobalContext()

  useEffect(() => {
    // Only seed once or when changing to a different plan
    if (
      assignment?.data &&
      (!assignment_preview?.plan ||
        assignment_preview.plan.id !== assignment?.data?.plan?.id)
    ) {
      setAssignmentPreview(assignment.data)
    }
  }, [assignment?.data, assignment_preview?.plan?.id, setAssignmentPreview])
  // console.log('assignment_preview :>> ', assignment_preview)
  const data = assignment_preview

  const assigned_units = data?.assigned_units || []
  // const unassigned = data?.unassigned || []
  const plan = data?.plan || {}

  // Use assignment_preview.unassigned directly instead of local state
  const unassigned = data?.unassigned || []
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

    // Search in customers, orders, and items
    return unit.customers?.some(
      (customer) =>
        customer.customer_name?.toLowerCase().includes(query) ||
        customer.route_name?.toLowerCase().includes(query) ||
        customer.suburb_name?.toLowerCase().includes(query) ||
        customer.orders?.some((order) =>
          order.items?.some(
            (item) =>
              item.order_number?.toLowerCase().includes(query) ||
              item.description?.toLowerCase().includes(query)
          )
        )
    )
  })

  // Columns for unassigned items table
  const unassignedColumns = [
    {
      accessorKey: 'order_number',
      header: createSortableHeader('Order #'),
    },
    {
      accessorKey: 'description',
      header: createSortableHeader('Description'),
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.getValue('description')}>
          {row.getValue('description')}
        </div>
      ),
    },
    {
      accessorKey: 'weight_left',
      header: createSortableHeader('Weight (kg)'),
      cell: ({ row }) => `${row.getValue('weight_left')}kg`,
    },
    {
      accessorKey: 'customer_name',
      header: createSortableHeader('Customer'),
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
      accessorKey: 'order_date',
      header: createSortableHeader('Order Date'),
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
          <DetailCard
            title={
              assignment?.data?.plan?.id
                ? `Vehicle Assignment - ${assignment?.data?.plan?.notes}`
                : 'Tomorrows Assignment Preview'
            }
            description={
              assignment?.data?.plan?.id
                ? 'Manually assign loads for this plan'
                : 'Adjust the preview, commit, then manual assign your loads from "Assignment Plans Tab"'
            }
          >
            {/* Search Filter */}
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
                      (unit.used_capacity_kg / unit.capacity_kg) * 100
                    const isOverCapacity = capacityPercentage > 100
                    const isNearCapacity = capacityPercentage >= 85

                    //`/assignments/${plan.plan_id}/units/${unit.plan_unit_id}`
                    return (
                      <Card
                        key={`${unit?.plan_unit_id}-${unit?.used_capacity_kg}-${unit?.customers?.length}`}
                        onClick={() => {
                          handleClick({
                            unit: unit.plan_unit_id,
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
                                {unit.used_capacity_kg}kg / {unit.capacity_kg}
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
          </DetailCard>
        </TabsContent>
        <TabsContent value={tableInfo?.tabs?.[1]?.value} className="space-y-4 ">
          <DetailCard
            title={`Unassigned Items - ${assignment?.data?.plan?.notes}`}
            description={
              assignment?.data?.plan?.id
                ? 'Manually assign loads for this plan'
                : 'Adjust the preview, commit, then manual assign your loads from "Assignment Plans Tab"'
            }
          >
            <DataTable
              columns={unassignedColumns}
              data={unassigned}
              filterColumn="description"
              filterPlaceholder="Search items, customers, routes..."
            />
          </DetailCard>
          {/* <Card className={'h-fit'}>
            <CardHeader>
              <CardTitle>
                {`Unassigned Items - ${assignment?.data?.plan?.notes}`}
              </CardTitle>
              <CardDescription>
                {assignment?.data?.plan?.id
                  ? 'Manually assign loads for this plan'
                  : 'Adjust the preview, commit, then manual assign your loads from "Assignment Plans Tab"'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              <DataTable
                columns={unassignedColumns}
                data={unassigned}
                filterColumn="description"
                filterPlaceholder="Search items, customers, routes..."
              />
            </CardContent>
          </Card> */}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ;<Card className={'h-fit'}>
//   <CardHeader>
//     <CardTitle>
//       {assignment?.data?.plan?.id
//         ? `Vehicle Assignment - ${assignment?.data?.plan?.notes}`
//         : 'Tomorrows Assignment Preview'}
//     </CardTitle>
//     <CardDescription>
//       {assignment?.data?.plan?.id
//         ? 'Manually assign loads for this plan'
//         : 'Adjust the preview, commit, then manual assign your loads from "Assignment Plans Tab"'}
//     </CardDescription>

//     {/* Search Filter */}
//     <div className="relative mt-4">
//       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//       <Input
//         placeholder="Search vehicles, drivers, customers, order numbers..."
//         value={searchQuery}
//         onChange={(e) => setSearchQuery(e.target.value)}
//         className="pl-9"
//       />
//     </div>
//   </CardHeader>

//   <CardContent
//     className={
//       'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-h-screen overflow-y-auto'
//     }
//   >
//     {filteredUnits.length > 0 &&
//       filteredUnits
//         .sort((a, b) => {
//           const aPercentage = (a.used_capacity_kg / a.capacity_kg) * 100
//           const bPercentage = (b.used_capacity_kg / b.capacity_kg) * 100
//           return aPercentage - bPercentage
//         })
//         .map((unit, index) => {
//           const vehicle = getVehicleDisplay(unit)
//           const driverInfo = getDriverInfo(unit)
//           const groupedData = getGroupUnitData(unit)
//           const capacityPercentage =
//             (unit.used_capacity_kg / unit.capacity_kg) * 100
//           const isOverCapacity = capacityPercentage > 100
//           const isNearCapacity = capacityPercentage >= 85

//           //`/assignments/${plan.plan_id}/units/${unit.plan_unit_id}`
//           return (
//             <Card
//               key={unit?.plan_unit_id || index}
//               onClick={() => {
//                 handleClick({
//                   unit: unit.plan_unit_id,
//                   preview,
//                   onEdit,
//                   id,
//                 })
//               }}
//               className="cursor-pointer hover:shadow-lg transition-shadow"
//             >
//               <CardHeader className="pb-3">
//                 <div className="flex items-end justify-between">
//                   <div className="flex items-center gap-2">
//                     {vehicle.icon}
//                     <div>
//                       <h3 className="font-semibold text-sm">{vehicle.name}</h3>
//                       <p className="text-xs text-muted-foreground">
//                         {vehicle.plate}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2 mt-2">
//                     <User className="h-3 w-3 text-muted-foreground" />
//                     <span className="text-xs text-muted-foreground">
//                       {driverInfo.name}

//                   </div>
//                 </div>

//                 <div className="flex items-center justify-between gap-2 mt-2">
//                   <Badge variant="secondary" className="text-xs">
//                     {vehicle.type}
//                   </Badge>
//                   <Badge variant="outline" className="text-xs">
//                     {unit.customers.length} customers
//                   </Badge>
//                 </div>
//                 <Separator className="mt-2" />
//               </CardHeader>

//               <CardContent className="flex flex-col min-h-[150px] justify-between  ">
//                 <div className="flex items-center gap-2 mt-2 flex-wrap">
//                   {groupedData.map((route) => (
//                     <Badge
//                       key={route.route_name}
//                       variant="outline"
//                       className="text-xs"
//                     >
//                       {route.route_name}
//                     </Badge>
//                   ))}
//                 </div>
//                 <div className="mt-3 ">
//                   <div className="flex items-center justify-between text-xs mb-1">
//                     <div className="flex items-center gap-1">
//                       <span className="text-muted-foreground">Capacity</span>
//                       {isOverCapacity && (
//                         <AlertTriangle className="h-3 w-3 text-destructive" />
//                       )}
//                     </div>
//                     <span
//                       className={`font-medium ${
//                         isOverCapacity
//                           ? 'text-destructive'
//                           : isNearCapacity
//                           ? 'text-amber-600'
//                           : 'text-foreground'
//                       }`}
//                     >
//                       {unit.used_capacity_kg}kg / {unit.capacity_kg}
//                       kg
//                     </span>
//                   </div>
//                   <ProgressBar
//                     value={capacityPercentage}
//                     className={
//                       isOverCapacity
//                         ? 'bg-destructive'
//                         : isNearCapacity
//                         ? 'bg-amber-500'
//                         : 'bg-primary'
//                     }
//                   />
//                   {isOverCapacity && (
//                     <p className="text-xs text-destructive mt-1 flex items-center gap-1">
//                       <AlertTriangle className="h-3 w-3" />
//                       Over capacity by {(capacityPercentage - 100).toFixed(1)}%
//                     </p>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           )
//         })}
//   </CardContent>
// </Card>
