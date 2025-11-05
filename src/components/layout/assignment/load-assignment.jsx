'use client'

import { useGlobalContext } from '@/context/global-context'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable, createSortableHeader } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function LoadAssignment({ id, assignment, onEdit, preview }) {
  const router = useRouter()
  const pathname = usePathname()

  const { assignment_preview, setAssignmentPreview } = useGlobalContext()

  // Seed preview state from the latest assignment payload (built by buildPlanPayload)
  useEffect(() => {
    if (
      assignment?.data &&
      (!assignment_preview?.plan ||
        assignment_preview.plan.id !== assignment?.data?.plan?.id)
    ) {
      setAssignmentPreview(assignment.data)
    }
  }, [assignment?.data, assignment_preview?.plan?.id, setAssignmentPreview])

  const data = assignment_preview

  // From buildPlanPayload:
  //   data.plan
  //   data.units
  //   data.unassigned_orders
  //   data.assigned_orders
  const assigned_units = data?.units || []
  const plan = data?.plan || {}
  const unassigned = data?.unassigned_orders || []

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
        title: `Unassigned Orders `,
      },
    ],
  }

  /**
   * Vehicle display (mimics old load-assignment-old.jsx style)
   * but uses buildPlanPayload shape:
   *   unit.vehicle_type: 'rigid' | 'horse'
   *   unit.vehicle: { reg_number, plate, capacity_kg, ... }
   *   unit.trailer: { reg_number, plate, capacity_kg, ... } (optional)
   */
  const getVehicleDisplay = (unit) => {
    const vehicle = unit?.vehicle || null
    const trailer = unit?.trailer || null
    const type = unit?.vehicle_type

    // Rigid
    if (type === 'rigid' && vehicle) {
      return {
        icon: <Truck className="h-4 w-4" />,
        name: vehicle.reg_number || vehicle.plate || 'Rigid',
        plate: vehicle.plate || vehicle.reg_number || 'N/A',
        type: 'Rigid',
      }
    }

    // Horse + Trailer (if trailer present)
    if (type === 'horse' && vehicle && trailer) {
      const horseName = vehicle.reg_number || vehicle.plate || 'Horse'
      const trailerName = trailer.reg_number || trailer.plate || 'Trailer'
      const horsePlate = vehicle.plate || vehicle.reg_number || ''
      const trailerPlate = trailer.plate || trailer.reg_number || ''
      return {
        icon: <Truck className="h-4 w-4" />,
        name: `${horseName} + ${trailerName}`,
        plate: `${horsePlate}${
          horsePlate && trailerPlate ? ' / ' : ''
        }${trailerPlate}`,
        type: 'Horse+Trailer',
      }
    }

    // Fallback using whatever vehicle we have
    if (vehicle) {
      return {
        icon: <Truck className="h-4 w-4" />,
        name: vehicle.reg_number || vehicle.plate || 'Unknown Vehicle',
        plate: vehicle.plate || vehicle.reg_number || 'N/A',
        type: type || 'Unknown',
      }
    }

    return {
      icon: <Truck className="h-4 w-4" />,
      name: 'Unknown Vehicle',
      plate: 'N/A',
      type: 'Unknown',
    }
  }

  /**
   * Driver display (old card showed driver_name)
   * buildPlanPayload gives unit.driver = { name, last_name, ... }
   */
  const getDriverInfo = (unit) => {
    const d = unit?.driver
    if (!d) {
      return {
        name: 'No driver assigned',
        source: null,
      }
    }
    const fullName = `${d.name || ''} ${d.last_name || ''}`.trim()
    return {
      name: fullName || 'No driver assigned',
      source: null,
    }
  }

  /**
   * Group routes per unit – used for route badges in the card.
   * buildPlanPayload gives unit.orders with route_name, total_weight, total_quantity.
   */
  const getGroupUnitData = (unit) => {
    if (!unit || !unit.orders) return []

    const routeGroups = new Map()

    unit.orders.forEach((order) => {
      const routeName = order.route_name || 'Unknown route'

      if (!routeGroups.has(routeName)) {
        routeGroups.set(routeName, {
          route_name: routeName,
          total_weight: 0,
          total_items: 0,
        })
      }

      const route = routeGroups.get(routeName)
      route.total_weight += Number(order.total_weight || 0)
      route.total_items += Number(order.total_quantity || 0)
    })

    return Array.from(routeGroups.values())
  }

  const handleClick = ({ unit, preview, onEdit, id }) => {
    if (pathname.includes('create-plan')) {
      router.push(`${pathname}/${unit}`)
    } else {
      router.push(`/load-assignment/${unit}/${id}`)
    }
  }

  /**
   * Filter units based on search query.
   * Search in vehicle, driver, and orders (customer, route, suburb, order number).
   */
  const filteredUnits = assigned_units.filter((unit) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    const vehicle = getVehicleDisplay(unit)
    const driver = getDriverInfo(unit)

    // vehicle
    if (
      vehicle.name?.toLowerCase().includes(query) ||
      vehicle.plate?.toLowerCase().includes(query)
    )
      return true

    // driver
    if (driver.name?.toLowerCase().includes(query)) return true

    // orders
    return unit.orders?.some(
      (order) =>
        order.customer_name?.toLowerCase().includes(query) ||
        order.route_name?.toLowerCase().includes(query) ||
        order.suburb_name?.toLowerCase().includes(query) ||
        order.sales_order_number?.toLowerCase().includes(query)
    )
  })

  /**
   * Unassigned orders table columns – using v_unassigned_orders fields
   * from buildPlanPayload: sales_order_number, delivery_date, route_name,
   * suburb_name, customer_name, total_weight, ...
   */
  const unassignedColumns = [
    {
      accessorKey: 'sales_order_number',
      header: createSortableHeader('Order #'),
    },
    {
      accessorKey: 'delivery_date',
      header: createSortableHeader('Delivery Date'),
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
      accessorKey: 'customer_name',
      header: createSortableHeader('Customer'),
    },
    {
      accessorKey: 'total_weight',
      header: createSortableHeader('Weight (kg)'),
      cell: ({ row }) => `${row.getValue('total_weight')}kg`,
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

        {/* PLAN / VEHICLE CARDS TAB */}
        <TabsContent value={tableInfo?.tabs?.[0]?.value} className="space-y-4 ">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-h-screen overflow-y-auto">
              {filteredUnits.length > 0 &&
                filteredUnits
                  // Sort by % capacity used, like the old component
                  .sort((a, b) => {
                    const getCap = (unit) => {
                      const capacity =
                        (unit.vehicle_type === 'horse'
                          ? unit?.trailer?.capacity_kg
                          : unit?.vehicle?.capacity_kg) || 1
                      const used = unit?.summary?.total_weight || 0
                      return {
                        cap: capacity,
                        used,
                        pct: (used / capacity) * 100,
                      }
                    }
                    const aCap = getCap(a)
                    const bCap = getCap(b)
                    return aCap.pct - bCap.pct
                  })
                  .map((unit) => {
                    const vehicle = getVehicleDisplay(unit)
                    const driverInfo = getDriverInfo(unit)
                    const groupedData = getGroupUnitData(unit)

                    const capacity =
                      (unit.vehicle_type === 'horse'
                        ? unit?.trailer?.capacity
                        : unit?.vehicle?.capacity) || 20000
                    const used = unit?.summary?.total_weight || 0
                    const capacityPercentage = (used / capacity) * 100
                    const isOverCapacity = capacityPercentage > 100
                    const isNearCapacity = capacityPercentage >= 85

                    // Derive #customers from orders (unique customer_id/name)
                    const customerKeys = new Set(
                      (unit.orders || []).map(
                        (o) => o.customer_id || o.customer_name
                      )
                    )
                    const customersCount = customerKeys.size

                    return (
                      <Card
                        key={`${unit?.planned_unit_id}-${used}-${customersCount}`}
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
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {vehicle.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {customersCount} customers
                            </Badge>
                          </div>
                          <Separator className="mt-2" />
                        </CardHeader>

                        <CardContent className="flex flex-col min-h-[150px] justify-between">
                          {/* Route badges */}
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

                          {/* Capacity */}
                          <div className="mt-3">
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
                                {used}kg / {capacity}kg
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

        {/* UNASSIGNED TAB */}
        <TabsContent value={tableInfo?.tabs?.[1]?.value} className="space-y-4 ">
          <DetailCard
            title={`Unassigned Orders - ${assignment?.data?.plan?.notes || ''}`}
            description={
              assignment?.data?.plan?.id
                ? 'Manually assign loads for this plan'
                : 'Adjust the preview, commit, then manual assign your loads from "Assignment Plans Tab"'
            }
          >
            <DataTable
              columns={unassignedColumns}
              data={unassigned}
              filterColumn="customer_name"
              filterPlaceholder="Search customers, routes, suburbs..."
              url="none"
            />
          </DetailCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 'use client'

// import { useGlobalContext } from '@/context/global-context'
// import { AssignmentBoard } from './AssignmentBoard'
// import { useEffect, useState } from 'react'
// import DetailCard from '@/components/ui/detail-card'
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card'
// import { AlertTriangle, Truck, User } from 'lucide-react'
// import { Badge } from '@/components/ui/badge'
// import { ProgressBar } from './ProgressBar'
// import { Separator } from '@/components/ui/separator'
// import { usePathname, useRouter } from 'next/navigation'
// import { UnassignedList } from './UnassignedList'
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { DataTable, createSortableHeader } from '@/components/ui/data-table'
// import { Input } from '@/components/ui/input'
// import { Search } from 'lucide-react'

// export function LoadAssignment({ id, assignment, onEdit, preview }) {
//   const router = useRouter()
//   const pathname = usePathname()
//   //console.log('assignment :>> ', assignment?.data)
//   //console.log('preview :>> ', preview)
//   const { assignment_preview, setAssignmentPreview } = useGlobalContext()

//   useEffect(() => {
//     // Only seed once or when changing to a different plan
//     if (
//       assignment?.data &&
//       (!assignment_preview?.plan ||
//         assignment_preview.plan.id !== assignment?.data?.plan?.id)
//     ) {
//       setAssignmentPreview(assignment.data)
//     }
//   }, [assignment?.data, assignment_preview?.plan?.id, setAssignmentPreview])
//   // console.log('assignment_preview :>> ', assignment_preview)
//   const data = assignment_preview

//   const assigned_units = data?.units || []
//   const plan = data?.plan || {}
//   const unassigned = data?.unassigned_orders || []
//   const assigned_orders = data?.assigned_orders || []
//   const [searchQuery, setSearchQuery] = useState('')
//   const [filters, setFilters] = useState({
//     scope_branch_id: 'all',
//     scope_customer_name: '',
//     departure_date: '',
//     cutoff_date: '',
//     includeExisting: true,
//     unit_type: 'all',
//   })

//   const tableInfo = {
//     tabs: [
//       {
//         value: 'plan',
//         title: `Vehicle Assignment `,
//       },
//       {
//         value: 'unassigned',
//         title: `Unassigned Items `,
//       },
//     ],
//   }

//   const getVehicleDisplay = (unit) => {
//     const vehicle = unit?.vehicle
//     console.log('data :>> ', unit.vehicle)
//     if (!vehicle) {
//       return {
//         icon: <Truck className="h-4 w-4" />,
//         name: 'Unknown Vehicle',
//         plate: 'N/A',
//         type: 'Unknown',
//       }
//     }

//     return {
//       icon: <Truck className="h-4 w-4" />,
//       name: vehicle.reg_number || 'N/A',
//       plate: vehicle.reg_number || 'N/A',
//       type: unit.vehicle_type || 'Unknown',
//     }
//   }

//   const getDriverInfo = (unit) => {
//     return {
//       name: unit?.driver?.name || 'No driver assigned',
//       source: null,
//     }
//   }

//   const getGroupUnitData = (unit) => {
//     if (!unit || !unit.orders) return []

//     const routeGroups = new Map()

//     unit.orders.forEach((order) => {
//       const routeName = order.route_name

//       if (!routeGroups.has(routeName)) {
//         routeGroups.set(routeName, {
//           route_name: routeName,
//           total_weight: 0,
//           total_items: 0,
//         })
//       }

//       const route = routeGroups.get(routeName)
//       route.total_weight += order.total_weight || 0
//       route.total_items += order.total_quantity || 0
//     })

//     return Array.from(routeGroups.values())
//   }

//   // add these helpers inside LoadAssignmentSingle, above return
//   // const onAssignItem = async ({ plan_unit_id, item }) => {
//   //   // item here should be an UNASSIGNED item (has item_id, weight_left, description, etc.)
//   //   await handleAssignItem(item.item_id, plan_unit_id)
//   // }

//   // const onUnassignItem = async (item_id) => {
//   //   await handleUnassignItem(item_id)
//   // }
//   //console.log('commit :>> ', assignment?.data?.plan)
//   const handleClick = ({ unit, preview, onEdit, id }) => {
//     if (pathname.includes('create-plan')) {
//       router.push(`${pathname}/${unit}`)
//     } else {
//       router.push(`/load-assignment/${unit}/${id}`)
//     }
//   }

//   // Filter vehicles based on search query
//   const filteredUnits = assigned_units.filter((unit) => {
//     if (!searchQuery) return true

//     const query = searchQuery.toLowerCase()
//     const vehicle = getVehicleDisplay(unit)
//     const driver = getDriverInfo(unit)

//     // Search in vehicle info
//     if (
//       vehicle.name?.toLowerCase().includes(query) ||
//       vehicle.plate?.toLowerCase().includes(query)
//     )
//       return true

//     // Search in driver name
//     if (driver.name?.toLowerCase().includes(query)) return true

//     // Search in orders
//     return unit.orders?.some(
//       (order) =>
//         order.customer_name?.toLowerCase().includes(query) ||
//         order.route_name?.toLowerCase().includes(query) ||
//         order.suburb_name?.toLowerCase().includes(query) ||
//         order.sales_order_number?.toLowerCase().includes(query)
//     )
//   })

//   // Columns for unassigned items table
//   const unassignedColumns = [
//     {
//       accessorKey: 'sales_order_number',
//       header: createSortableHeader('Order #'),
//     },
//     // {
//     //   accessorKey: 'sales_person_name',
//     //   header: createSortableHeader('Sales Person'),
//     // },
//     {
//       accessorKey: 'delivery_date',
//       header: createSortableHeader('Delivery Date'),
//     },
//     {
//       accessorKey: 'route_name',
//       header: createSortableHeader('Route'),
//     },
//     {
//       accessorKey: 'suburb_name',
//       header: createSortableHeader('Suburb'),
//     },
//     {
//       accessorKey: 'customer_name',
//       header: createSortableHeader('Customer'),
//     },
//     {
//       accessorKey: 'total_weight',
//       header: createSortableHeader('Weight (kg)'),
//       cell: ({ row }) => `${row.getValue('total_weight')}kg`,
//     },
//   ]
//   return (
//     <div className="grid grid-cols-1">
//       <Tabs defaultValue={tableInfo?.tabs?.[0]?.value} className="w-full">
//         <TabsList
//           className={`grid w-full grid-cols-${tableInfo?.tabs?.length} gap-6`}
//         >
//           {tableInfo?.tabs.map((trigger, index) => {
//             return (
//               <TabsTrigger key={index} value={trigger.value}>
//                 <h6 className="capitalize font-bold">{trigger.title}</h6>
//               </TabsTrigger>
//             )
//           })}
//         </TabsList>
//         <TabsContent
//           // key={index}
//           value={tableInfo?.tabs?.[0]?.value}
//           className="space-y-4 "
//         >
//           <DetailCard
//             title={
//               assignment?.data?.plan?.id
//                 ? `Vehicle Assignment - ${assignment?.data?.plan?.notes}`
//                 : 'Tomorrows Assignment Preview'
//             }
//             description={
//               assignment?.data?.plan?.id
//                 ? 'Manually assign loads for this plan'
//                 : 'Adjust the preview, commit, then manual assign your loads from "Assignment Plans Tab"'
//             }
//           >
//             {/* Search Filter */}
//             <div className="relative mb-4">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search vehicles, drivers, customers, order numbers..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-9"
//               />
//             </div>
//             <div
//               className={
//                 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-h-screen overflow-y-auto'
//               }
//             >
//               {filteredUnits.length > 0 &&
//                 filteredUnits
//                   .sort((a, b) => {
//                     const aCapacity =
//                       (a.vehicle_type === 'horse'
//                         ? a?.trailer?.capacity_kg
//                         : a?.vehicle?.capacity_kg) || 1
//                     const aUsed = a?.summary?.total_weight || 0
//                     const bCapacity =
//                       (b.vehicle_type === 'horse'
//                         ? b?.trailer?.capacity_kg
//                         : b?.vehicle?.capacity_kg) || 1
//                     const bUsed = b?.summary?.total_weight || 0
//                     const aPercentage = (aUsed / aCapacity) * 100
//                     const bPercentage = (bUsed / bCapacity) * 100
//                     return aPercentage - bPercentage
//                   })
//                   .map((unit, index) => {
//                     const vehicle = getVehicleDisplay(unit)
//                     const driverInfo = getDriverInfo(unit)
//                     const groupedData = getGroupUnitData(unit)
//                     const capacity =
//                       (unit.vehicle_type === 'horse'
//                         ? unit?.trailer?.capacity_kg
//                         : unit?.vehicle?.capacity_kg) || 1
//                     const used = unit?.summary?.total_weight || 0
//                     const capacityPercentage = (used / capacity) * 100
//                     const isOverCapacity = capacityPercentage > 100
//                     const isNearCapacity = capacityPercentage >= 85
//                     // console.log('unit :>> ', unit)
//                     //`/assignments/${plan.plan_id}/units/${unit.plan_unit_id}`
//                     return (
//                       <Card
//                         key={`${unit?.planned_unit_id}-${unit?.summary?.total_weight}-${unit?.summary?.orders_assigned}`}
//                         onClick={() => {
//                           handleClick({
//                             unit: unit.planned_unit_id,
//                             preview,
//                             onEdit,
//                             id,
//                           })
//                         }}
//                         className="cursor-pointer hover:shadow-lg transition-shadow"
//                       >
//                         <CardHeader className="pb-3">
//                           <div className="flex items-end justify-between">
//                             <div className="flex items-center gap-2">
//                               {vehicle.icon}
//                               <div>
//                                 <h3 className="font-semibold text-sm">
//                                   {vehicle.name}
//                                 </h3>
//                                 <p className="text-xs text-muted-foreground">
//                                   {vehicle.plate}
//                                 </p>
//                               </div>
//                             </div>
//                             <div className="flex items-center gap-2 mt-2">
//                               <User className="h-3 w-3 text-muted-foreground" />
//                               <span className="text-xs text-muted-foreground">
//                                 {driverInfo.name}
//                                 {/* {driverInfo.source && (
//                           <span className="ml-1 text-xs opacity-75">
//                             ({driverInfo.source})
//                           </span>
//                         )} */}
//                               </span>
//                             </div>
//                           </div>

//                           <div className="flex items-center justify-between gap-2 mt-2">
//                             <Badge variant="secondary" className="text-xs">
//                               {vehicle.type}
//                             </Badge>
//                             <Badge variant="outline" className="text-xs">
//                               {unit?.summary?.total_orders || 0} orders
//                             </Badge>
//                           </div>
//                           <Separator className="mt-2" />
//                         </CardHeader>

//                         <CardContent className="flex flex-col min-h-[150px] justify-between  ">
//                           <div className="flex items-center gap-2 mt-2 flex-wrap">
//                             {unit?.routes_served?.map((route) => (
//                               <Badge
//                                 key={route}
//                                 variant="outline"
//                                 className="text-xs"
//                               >
//                                 {route}
//                               </Badge>
//                             ))}
//                           </div>
//                           <div className="mt-3 ">
//                             <div className="flex items-center justify-between text-xs mb-1">
//                               <div className="flex items-center gap-1">
//                                 <span className="text-muted-foreground">
//                                   Capacity
//                                 </span>
//                                 {isOverCapacity && (
//                                   <AlertTriangle className="h-3 w-3 text-destructive" />
//                                 )}
//                               </div>
//                               <span
//                                 className={`font-medium ${
//                                   isOverCapacity
//                                     ? 'text-destructive'
//                                     : isNearCapacity
//                                     ? 'text-amber-600'
//                                     : 'text-foreground'
//                                 }`}
//                               >
//                                 {used}kg / {capacity}kg
//                               </span>
//                             </div>
//                             <ProgressBar
//                               value={capacityPercentage}
//                               className={
//                                 isOverCapacity
//                                   ? 'bg-destructive'
//                                   : isNearCapacity
//                                   ? 'bg-amber-500'
//                                   : 'bg-primary'
//                               }
//                             />
//                             {isOverCapacity && (
//                               <p className="text-xs text-destructive mt-1 flex items-center gap-1">
//                                 <AlertTriangle className="h-3 w-3" />
//                                 Over capacity by{' '}
//                                 {(capacityPercentage - 100).toFixed(1)}%
//                               </p>
//                             )}
//                           </div>
//                         </CardContent>
//                       </Card>
//                     )
//                   })}
//             </div>
//           </DetailCard>
//         </TabsContent>
//         <TabsContent value={tableInfo?.tabs?.[1]?.value} className="space-y-4 ">
//           <DetailCard
//             title={`Unassigned Items - ${assignment?.data?.plan?.notes}`}
//             description={
//               assignment?.data?.plan?.id
//                 ? 'Manually assign loads for this plan'
//                 : 'Adjust the preview, commit, then manual assign your loads from "Assignment Plans Tab"'
//             }
//           >
//             <DataTable
//               columns={unassignedColumns}
//               data={unassigned}
//               filterColumn="description"
//               filterPlaceholder="Search items, customers, routes..."
//               url="none"
//             />
//           </DetailCard>
//           {/* <Card className={'h-fit'}>
//             <CardHeader>
//               <CardTitle>
//                 {`Unassigned Items - ${assignment?.data?.plan?.notes}`}
//               </CardTitle>
//               <CardDescription>
//                 {assignment?.data?.plan?.id
//                   ? 'Manually assign loads for this plan'
//                   : 'Adjust the preview, commit, then manual assign your loads from "Assignment Plans Tab"'}
//               </CardDescription>
//             </CardHeader>

//             <CardContent className="p-4">
//               <DataTable
//                 columns={unassignedColumns}
//                 data={unassigned}
//                 filterColumn="description"
//                 filterPlaceholder="Search items, customers, routes..."
//               />
//             </CardContent>
//           </Card> */}
//         </TabsContent>
//       </Tabs>
//     </div>
//   )
// }

// // ;<Card className={'h-fit'}>
// //   <CardHeader>
// //     <CardTitle>
// //       {assignment?.data?.plan?.id
// //         ? `Vehicle Assignment - ${assignment?.data?.plan?.notes}`
// //         : 'Tomorrows Assignment Preview'}
// //     </CardTitle>
// //     <CardDescription>
// //       {assignment?.data?.plan?.id
// //         ? 'Manually assign loads for this plan'
// //         : 'Adjust the preview, commit, then manual assign your loads from "Assignment Plans Tab"'}
// //     </CardDescription>

// //     {/* Search Filter */}
// //     <div className="relative mt-4">
// //       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
// //       <Input
// //         placeholder="Search vehicles, drivers, customers, order numbers..."
// //         value={searchQuery}
// //         onChange={(e) => setSearchQuery(e.target.value)}
// //         className="pl-9"
// //       />
// //     </div>
// //   </CardHeader>

// //   <CardContent
// //     className={
// //       'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-h-screen overflow-y-auto'
// //     }
// //   >
// //     {filteredUnits.length > 0 &&
// //       filteredUnits
// //         .sort((a, b) => {
// //           const aPercentage = (a.used_capacity_kg / a.capacity_kg) * 100
// //           const bPercentage = (b.used_capacity_kg / b.capacity_kg) * 100
// //           return aPercentage - bPercentage
// //         })
// //         .map((unit, index) => {
// //           const vehicle = getVehicleDisplay(unit)
// //           const driverInfo = getDriverInfo(unit)
// //           const groupedData = getGroupUnitData(unit)
// //           const capacityPercentage =
// //             (unit.used_capacity_kg / unit.capacity_kg) * 100
// //           const isOverCapacity = capacityPercentage > 100
// //           const isNearCapacity = capacityPercentage >= 85

// //           //`/assignments/${plan.plan_id}/units/${unit.plan_unit_id}`
// //           return (
// //             <Card
// //               key={unit?.plan_unit_id || index}
// //               onClick={() => {
// //                 handleClick({
// //                   unit: unit.plan_unit_id,
// //                   preview,
// //                   onEdit,
// //                   id,
// //                 })
// //               }}
// //               className="cursor-pointer hover:shadow-lg transition-shadow"
// //             >
// //               <CardHeader className="pb-3">
// //                 <div className="flex items-end justify-between">
// //                   <div className="flex items-center gap-2">
// //                     {vehicle.icon}
// //                     <div>
// //                       <h3 className="font-semibold text-sm">{vehicle.name}</h3>
// //                       <p className="text-xs text-muted-foreground">
// //                         {vehicle.plate}
// //                       </p>
// //                     </div>
// //                   </div>
// //                   <div className="flex items-center gap-2 mt-2">
// //                     <User className="h-3 w-3 text-muted-foreground" />
// //                     <span className="text-xs text-muted-foreground">
// //                       {driverInfo.name}

// //                   </div>
// //                 </div>

// //                 <div className="flex items-center justify-between gap-2 mt-2">
// //                   <Badge variant="secondary" className="text-xs">
// //                     {vehicle.type}
// //                   </Badge>
// //                   <Badge variant="outline" className="text-xs">
// //                     {unit.customers.length} customers
// //                   </Badge>
// //                 </div>
// //                 <Separator className="mt-2" />
// //               </CardHeader>

// //               <CardContent className="flex flex-col min-h-[150px] justify-between  ">
// //                 <div className="flex items-center gap-2 mt-2 flex-wrap">
// //                   {groupedData.map((route) => (
// //                     <Badge
// //                       key={route.route_name}
// //                       variant="outline"
// //                       className="text-xs"
// //                     >
// //                       {route.route_name}
// //                     </Badge>
// //                   ))}
// //                 </div>
// //                 <div className="mt-3 ">
// //                   <div className="flex items-center justify-between text-xs mb-1">
// //                     <div className="flex items-center gap-1">
// //                       <span className="text-muted-foreground">Capacity</span>
// //                       {isOverCapacity && (
// //                         <AlertTriangle className="h-3 w-3 text-destructive" />
// //                       )}
// //                     </div>
// //                     <span
// //                       className={`font-medium ${
// //                         isOverCapacity
// //                           ? 'text-destructive'
// //                           : isNearCapacity
// //                           ? 'text-amber-600'
// //                           : 'text-foreground'
// //                       }`}
// //                     >
// //                       {unit.used_capacity_kg}kg / {unit.capacity_kg}
// //                       kg
// //                     </span>
// //                   </div>
// //                   <ProgressBar
// //                     value={capacityPercentage}
// //                     className={
// //                       isOverCapacity
// //                         ? 'bg-destructive'
// //                         : isNearCapacity
// //                         ? 'bg-amber-500'
// //                         : 'bg-primary'
// //                     }
// //                   />
// //                   {isOverCapacity && (
// //                     <p className="text-xs text-destructive mt-1 flex items-center gap-1">
// //                       <AlertTriangle className="h-3 w-3" />
// //                       Over capacity by {(capacityPercentage - 100).toFixed(1)}%
// //                     </p>
// //                   )}
// //                 </div>
// //               </CardContent>
// //             </Card>
// //           )
// //         })}
// //   </CardContent>
// // </Card>
