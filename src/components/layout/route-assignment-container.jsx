'use client'

// react
import { useState } from 'react'

// next
import { usePathname } from 'next/navigation'

// icons
import {
  MapPin,
  Truck,
  Unlock,
  User,
  Weight,
  ArrowLeft,
  Search,
  Bell,
  X,
} from 'lucide-react'

//context
import { useGlobalContext } from '@/context/global-context'

//components
import PageLoader from '../ui/loader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import DetailCard from '../ui/detail-card'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { DataTable } from '../ui/data-table'

// hooks
import { replaceHyphenWithUnderscore } from '@/hooks/replace-hyphen'

const RouteAssignment = () => {
  const pathname = usePathname().slice(1)
  const path = replaceHyphenWithUnderscore(pathname)
  const current_screen = useGlobalContext()[path]
  const {
    load_assignment,
    loads,
    onEdit,
    onDelete,
    loading,
    vehicles: { data },
  } = useGlobalContext()

  // const _vehicles = vehicles?.data || []

  const routingData = load_assignment?.data?.[0] || []
  //  console.log('routingData :>> ', load_assignment?.data?.[0])

  const vehicleData = load_assignment?.data?.[1] || []
  //  console.log('vehicleData :>> ', load_assignment?.data?.[1])

  const unassigned = load_assignment?.data?.[1] || []
  //  console.log('unassigned :>> ', load_assignment?.data)

  const [unlockedVehicles, setUnlockedVehicles] = useState(new Set())
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [vehicles, setVehicles] = useState(vehicleData)
  const [draggedItem, setDraggedItem] = useState(null)
  const [draggedFromVehicle, setDraggedFromVehicle] = useState(false)
  const [availableItems] = useState(unassigned)

  //console.log('vehicles :>> ', vehicles)

  const getVehicleUtilization = (vehicle) => {
    const _vehicle = data?.filter((v) => v.id == vehicle.vehicle_id)

    //console.log('_vehicle :>> ', _vehicle?.[0]?.tare)

    const capacity = _vehicle?.[0]?.capacity || 40000
    return Math.round((vehicle.total_assigned_kg / capacity) * 100)
  }

  const getUtilizationColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-400'
    if (percentage >= 70) return 'bg-orange-400'
    if (percentage >= 40) return 'bg-yellow-400'
    return 'bg-green-400'
  }

  const handleDragStart = (e, item) => {
    setDraggedItem(item)
    setDraggedFromVehicle(false)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleVehicleItemDragStart = (e, item) => {
    setDraggedItem(item)
    setDraggedFromVehicle(true)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (!draggedItem || !selectedVehicle) return

    if (!draggedFromVehicle) {
      const capacity = selectedVehicle.capacity_kg || 40000
      const availableCapacity = capacity - selectedVehicle.total_assigned_kg

      if (availableCapacity < draggedItem.weight) {
        alert(
          `Not enough capacity! Available: ${availableCapacity.toFixed(
            1
          )}kg, Required: ${draggedItem.weight}kg`
        )
        return
      }
    }

    if (!draggedFromVehicle) {
      const updatedVehicles = vehicles.map((vehicle) => {
        if (vehicle.vehicle_id === selectedVehicle.vehicle_id) {
          const newOrder = {
            order_id: `new-order-${Date.now()}`,
            sales_order_number: `NEW-${Math.random()
              .toString(36)
              .substr(2, 6)
              .toUpperCase()}`,
            customer_name: 'MANUAL ASSIGNMENT',
            order_status: 'Manually Assigned',
            total_weight: draggedItem.weight,
            items: [draggedItem],
          }

          const updatedLoads = [...vehicle.loads]
          if (updatedLoads.length > 0) {
            updatedLoads[0] = {
              ...updatedLoads[0],
              orders: [...updatedLoads[0].orders, newOrder],
              required_kg: updatedLoads[0].required_kg + draggedItem.weight,
            }
          }

          return {
            ...vehicle,
            loads: updatedLoads,
            total_assigned_kg: vehicle.total_assigned_kg + draggedItem.weight,
          }
        }
        return vehicle
      })

      setVehicles(updatedVehicles)
      const updatedSelected = updatedVehicles.find(
        (v) => v.vehicle_id === selectedVehicle.vehicle_id
      )
      setSelectedVehicle(updatedSelected || null)
    }

    setDraggedItem(null)
    setDraggedFromVehicle(false)
  }

  const handleRemoveItemFromVehicle = (itemToRemove, orderId, loadId) => {
    if (!selectedVehicle) return

    const updatedVehicles = vehicles.map((vehicle) => {
      if (vehicle.vehicle_id === selectedVehicle.vehicle_id) {
        const updatedLoads = vehicle.loads.map((load) => {
          if (load.load_id === loadId) {
            const updatedOrders = load.orders
              .map((order) => {
                if (order.order_id === orderId) {
                  const updatedItems = order.items.filter(
                    (item) => item.id !== itemToRemove.id
                  )
                  return {
                    ...order,
                    items: updatedItems,
                    total_weight: order.total_weight - itemToRemove.weight,
                  }
                }
                return order
              })
              .filter((order) => order.items.length > 0)

            return {
              ...load,
              orders: updatedOrders,
              required_kg: load.required_kg - itemToRemove.weight,
            }
          }
          return load
        })

        return {
          ...vehicle,
          loads: updatedLoads,
          total_assigned_kg: vehicle.total_assigned_kg - itemToRemove.weight,
        }
      }
      return vehicle
    })

    setVehicles(updatedVehicles)
    const updatedSelected = updatedVehicles.find(
      (v) => v.vehicle_id === selectedVehicle.vehicle_id
    )
    setSelectedVehicle(updatedSelected || null)
  }

  if (selectedVehicle) {
    //console.log('selectedVehicle :>> ', selectedVehicle)
    const utilization = getVehicleUtilization(selectedVehicle)
    const capacity = selectedVehicle.capacity_kg || 40000
    const availableCapacity = capacity - selectedVehicle.total_assigned_kg
    const vehicle = data?.filter((v) => v.id == selectedVehicle.vehicle_id)?.[0]
    // console.log('selectedVehicle :>> ', vehicle?.license_plate)
    return (
      <div className="min-h-screen ">
        <Card>
          <CardHeader>
            <div className="   py-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVehicle(null)}
                  className="p-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                {/* <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Vehicles</span>
                  <span>/</span>
                  <span>
                    {vehicle?.license_plate ||
                      selectedVehicle.vehicle_id.slice(0, 8)}
                  </span>
                </div> */}
                <div className="mt-2">
                  <h1 className="text-xl font-semibold">
                    Vehicle{' - '}
                    {vehicle?.license_plate ||
                      selectedVehicle.vehicle_id.slice(0, 8)}{' '}
                    -{' '}
                    {selectedVehicle.loads[0]?.route_name || 'Multiple Routes'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {selectedVehicle.loads[0]?.branch_name}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Vehicle Load</h2>
                  <div className="text-2xl font-bold text-orange-500">
                    {utilization}%
                  </div>
                </div>

                <Card className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-600 mb-2">Available, kg</p>
                    <p className="text-2xl font-bold">
                      {availableCapacity.toFixed(0)}/{capacity.toFixed(0)}
                    </p>
                  </div>

                  <div className="relative mb-8">
                    <div className="flex items-end justify-center">
                      <div className="relative">
                        <Truck className="w-32 h-20 text-gray-400" />
                        <div
                          className={`absolute top-2 left-8 w-16 h-12 ${getUtilizationColor(
                            utilization
                          )} rounded`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center min-h-[120px] flex items-center justify-center"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="text-gray-500">
                      <Truck className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Drop items here to load vehicle</p>
                      <p className="text-xs mt-1">
                        Available capacity: {availableCapacity.toFixed(1)} kg
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <h3 className="font-medium">Currently Loaded Items:</h3>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {selectedVehicle.loads.map((load) =>
                        load.orders.map((order) =>
                          order.items.map((item, index) => (
                            <div
                              key={index}
                              draggable
                              onDragStart={(e) =>
                                handleVehicleItemDragStart(e, item)
                              }
                              className="bg-blue-50 border border-blue-200 p-3 rounded cursor-move hover:bg-blue-100 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {item.description}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    Qty: {item.quantity} | Weight: {item.weight}
                                    kg | Order: {order.sales_order_number}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {order.customer_name}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveItemFromVehicle(
                                      item,
                                      order.order_id,
                                      load.load_id
                                    )
                                  }
                                  className="p-1 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )
                      )}
                      {selectedVehicle.loads.every((load) =>
                        load.orders.every((order) => order.items.length === 0)
                      ) && (
                        <div className="text-center text-gray-500 py-4">
                          <p className="text-sm">No items loaded</p>
                          <p className="text-xs">
                            Drag items from the right panel to load them
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <h3 className="font-medium">Load Summary:</h3>
                    {selectedVehicle.loads.map((load) => {
                      // console.log('load :>> ', load)
                      return (
                        <div
                          key={load.load_id}
                          className="bg-gray-50 p-3 rounded"
                        >
                          <div className="font-medium text-sm">
                            {load.route_name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {load.required_kg.toFixed(1)} kg
                          </div>
                          <div className="text-xs text-gray-500">
                            {load.orders.length} orders
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Available Items</h2>
                  <div className="text-sm text-gray-600">
                    Total items: {availableItems.length}
                  </div>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-600 uppercase">
                      <div>Description</div>
                      <div>Quantity</div>
                      <div>Weight (kg)</div>
                      <div>Length (mm)</div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {availableItems.length > 0 &&
                        availableItems?.map((item) => {
                          //    console.log('item :>> ', item)
                          return (
                            <div
                              key={item.vehicle_id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, item)}
                              className="grid grid-cols-4 gap-4 items-center py-3 px-2 hover:bg-gray-50 rounded cursor-move border border-transparent hover:border-gray-200"
                            >
                              <div className="text-sm font-medium">
                                {item.description}
                              </div>
                              <div className="text-sm">{item.quantity}</div>
                              <div className="text-sm font-medium">
                                {item.weight}
                              </div>
                              <div className="text-sm">{item.length}</div>
                            </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex">
      <div className="flex-1 pt-6">
        {/* <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Vehicle Assignments</h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex gap-2">
              <Badge variant="secondary">
                Total Vehicles ({vehicles.length})
              </Badge>
              <Badge variant="default" className="bg-blue-600">
                Assigned (
                {vehicles.filter((v) => v.total_assigned_kg > 0).length})
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>Sort by: Utilization</span>
              <span>
                Total Weight:{' '}
                {vehicles
                  .reduce((acc, v) => acc + v.total_assigned_kg, 0)
                  .toFixed(0)}{' '}
                kg
              </span>
            </div>
          </div>
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehicles?.map((vehicle) => {
            const utilization = getVehicleUtilization(vehicle)
            const _vehicle = data?.filter((v) => v.id == vehicle.vehicle_id)
            const capacity =
              Number(_vehicle?.[0]?.capacity) > 0
                ? Number(_vehicle?.[0]?.capacity)
                : 40000
            // console.log(
            //   'capacity :>> ',
            //   console.log('capacity :>> ', Number(_vehicle?.[0]?.capacity) > 0)
            // )
            const availableCapacity = capacity - vehicle.total_assigned_kg
            //   console.log('vehicle :>> ', _vehicle?.[0]?.license_plate)
            return (
              <Card
                key={vehicle.vehicle_id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {vehicle.loads[0]?.route_name || 'Multiple Routes'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {vehicle.loads.length} load
                        {vehicle.loads.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        Available, kg
                      </p>
                      <p className="font-semibold">
                        {availableCapacity.toFixed(0)}/{capacity.toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        License Plate
                      </p>
                      <p className="text-sm font-medium">
                        {_vehicle?.[0]?.license_plate || 'Missing Data'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Orders</p>
                      <p className="text-sm">
                        {vehicle.loads.reduce(
                          (acc, load) => acc + load.orders.length,
                          0
                        )}{' '}
                        orders
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-2xl font-bold mb-2"
                        style={{
                          color:
                            utilization >= 90
                              ? '#ef4444'
                              : utilization >= 70
                              ? '#f97316'
                              : utilization >= 40
                              ? '#eab308'
                              : '#22c55e',
                        }}
                      >
                        {utilization}%
                      </div>
                      <div className="relative">
                        <Truck className="w-24 h-16 text-gray-400" />
                        <div
                          className={`absolute top-1 left-4 w-12 h-8 ${getUtilizationColor(
                            utilization
                          )} rounded`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )

  // const handleUnlock = (vehicleId) => {
  //   setUnlockedVehicles((prev) => new Set([...prev, vehicleId]))
  // }

  // const tomorrowOrders = current_screen?.data?.filter((order) => {
  //   const dueRaw = order?.document_due_date
  //   if (!dueRaw) return false

  //   const due = new Date(dueRaw)
  //   if (Number.isNaN(due)) return false

  //   const now = new Date()
  //   const startTomorrow = new Date(
  //     now.getFullYear(),
  //     now.getMonth(),
  //     now.getDate() + 1
  //   )
  //   const startDayAfter = new Date(
  //     now.getFullYear(),
  //     now.getMonth(),
  //     now.getDate() + 2
  //   )

  //   return due >= startTomorrow && due < startDayAfter
  // })

  // console.log('loads?.data :>> ', loads?.data)
  // return (
  //   <>
  //     {loading ? (
  //       <PageLoader />
  //     ) : (
  //       <div>screen</div>
  //       // <div className="grid grid-cols-1">
  //       //   {
  //       //     <Tabs
  //       //       defaultValue={current_screen?.tableInfo?.tabs?.[0]?.value}
  //       //       className="w-full"
  //       //     >
  //       //       <TabsList
  //       //         className={`grid w-full grid-cols-${current_screen?.tableInfo?.tabs.length} gap-6`}
  //       //       >
  //       //         {current_screen?.tableInfo?.tabs.map((trigger, index) => {
  //       //           return (
  //       //             <TabsTrigger key={index} value={trigger.value}>
  //       //               <h6 className="capitalize font-bold">{trigger.title}</h6>
  //       //             </TabsTrigger>
  //       //           )
  //       //         })}
  //       //       </TabsList>
  //       //       {current_screen?.tableInfo?.tabs?.map((content, index) => {
  //       //         //console.log('content.value :>> ', content?.value)
  //       //         return (
  //       //           <TabsContent
  //       //             key={index}
  //       //             value={content?.value}
  //       //             className="space-y-4 "
  //       //           >
  //       //             {content.value == 'routes' ? (
  //       //               <div className="mt-6">
  //       //                 {/* <h2 className="text-lg font-semibold text-gray-800 mb-4">
  //       //                   Route Summary
  //       //                 </h2> */}
  //       //                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  //       //                   {routingData?.map((route) => {
  //       //                     console.log('route :>> ', route)
  //       //                     return (
  //       //                       <Card
  //       //                         key={route?.route_id}
  //       //                         className="border-gray-200"
  //       //                       >
  //       //                         <CardHeader>
  //       //                           <CardTitle className="text-base font-semibold text-blue-600">
  //       //                             {route?.route_name}
  //       //                           </CardTitle>
  //       //                           <p className="text-sm text-gray-600">
  //       //                             {route?.branch_name}
  //       //                           </p>
  //       //                         </CardHeader>

  //       //                         <CardContent>
  //       //                           {route.orders.map((order, index) => (
  //       //                             <div key={index} className="mb-4">
  //       //                               <div className="flex items-center space-x-2 mb-2">
  //       //                                 <MapPin className="h-4 w-4 text-gray-500" />
  //       //                                 <span className="text-sm font-medium text-gray-700">
  //       //                                   {`${order.customer_name} -
  //       //                                   ${order.sales_order_number}`}
  //       //                                 </span>
  //       //                               </div>

  //       //                               {order.items.map((order) => (
  //       //                                 <div
  //       //                                   key={order.id}
  //       //                                   className="ml-6 p-2 bg-gray-50 rounded text-xs space-y-1"
  //       //                                 >
  //       //                                   <div className="font-medium">
  //       //                                     {order.customer_name}
  //       //                                   </div>
  //       //                                   <div className="text-gray-600">
  //       //                                     Order: {order.sales_order_number}
  //       //                                   </div>
  //       //                                   <div className="text-gray-600">
  //       //                                     Weight:{' '}
  //       //                                     {order?.total_weight?.toFixed(1)} kg
  //       //                                   </div>
  //       //                                   <Badge
  //       //                                     variant="secondary"
  //       //                                     className="text-xs"
  //       //                                   >
  //       //                                     {order.order_status}
  //       //                                   </Badge>
  //       //                                 </div>
  //       //                               ))}
  //       //                             </div>
  //       //                           ))}
  //       //                         </CardContent>
  //       //                       </Card>
  //       //                     )
  //       //                   })}
  //       //                 </div>
  //       //               </div>
  //       //             ) : content.value == 'vehicles' ? (
  //       //               <div className="mt-6">
  //       //                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  //       //                   {vehicleData?.map((vehicle) => (
  //       //                     <Card
  //       //                       key={vehicle?.vehicle_id}
  //       //                       className="bg-gray-100 border-gray-300"
  //       //                     >
  //       //                       <CardHeader className="pb-3">
  //       //                         <div className="flex items-center justify-between">
  //       //                           <Truck className="h-5 w-5 text-gray-600" />
  //       //                           <CardTitle className="text-sm font-semibold text-gray-800">
  //       //                             {vehicle?.vehicle_id}
  //       //                           </CardTitle>
  //       //                         </div>
  //       //                       </CardHeader>

  //       //                       <CardContent className="space-y-3">
  //       //                         {/* Driver */}
  //       //                         <div className="flex items-center space-x-2">
  //       //                           <User className="h-4 w-4 text-gray-500" />
  //       //                           <span className="text-sm text-gray-700">
  //       //                             {vehicle.driver_name}
  //       //                           </span>
  //       //                         </div>

  //       //                         {/* Weight Info */}
  //       //                         <div className="flex items-center space-x-2">
  //       //                           <Weight className="h-4 w-4 text-gray-500" />
  //       //                           <div className="text-sm text-gray-700">
  //       //                             <div>{vehicle?.capacity} -</div>
  //       //                             <div>{vehicle?.current_load}</div>
  //       //                           </div>
  //       //                         </div>

  //       //                         {/* Route */}
  //       //                         <div className="flex items-center space-x-2">
  //       //                           <MapPin className="h-4 w-4 text-gray-500" />
  //       //                           <span className="text-xs text-gray-600">
  //       //                             {vehicle?.route}
  //       //                           </span>
  //       //                         </div>

  //       //                         {/* Status */}
  //       //                         <div className="text-sm text-gray-600 py-2">
  //       //                           {vehicle?.status}
  //       //                         </div>

  //       //                         {/* Unlock Button */}
  //       //                         <Button
  //       //                           onClick={() =>
  //       //                             handleUnlock(vehicle.vehicle_id)
  //       //                           }
  //       //                           disabled={unlockedVehicles.has(
  //       //                             vehicle.vehicle_id
  //       //                           )}
  //       //                           className={`w-full ${
  //       //                             unlockedVehicles.has(vehicle.vehicle_id)
  //       //                               ? 'bg-gray-400 cursor-not-allowed'
  //       //                               : 'bg-green-600 hover:bg-green-700'
  //       //                           } text-white text-sm`}
  //       //                         >
  //       //                           <Unlock className="h-4 w-4 mr-2" />
  //       //                           {unlockedVehicles.has(vehicle.vehicle_id)
  //       //                             ? 'Unlocked'
  //       //                             : 'Click to unlock'}
  //       //                         </Button>
  //       //                       </CardContent>
  //       //                     </Card>
  //       //                   ))}
  //       //                 </div>
  //       //               </div>
  //       //             ) : (
  //       //               <DetailCard
  //       //                 title={`All ${current_screen?.tableInfo.title}`}
  //       //               >
  //       //                 <DataTable
  //       //                   columns={current_screen?.columns({
  //       //                     onEdit,
  //       //                     onDelete,
  //       //                   })}
  //       //                   data={loads?.data}
  //       //                   filterColumn={loads?.tableInfo.filterColumn}
  //       //                   filterPlaceholder={loads?.tableInfo.filterPlaceholder}
  //       //                   csv_headers={loads?.csv_headers}
  //       //                   csv_rows={loads?.csv_rows}
  //       //                 />
  //       //               </DetailCard>
  //       //             )}
  //       //           </TabsContent>
  //       //         )
  //       //       })}
  //       //     </Tabs>
  //       //   }
  //       // </div>
  //     )}
  //   </>
  // )
}

export default RouteAssignment
