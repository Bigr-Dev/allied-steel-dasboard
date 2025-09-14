'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Truck,
  User,
  Weight,
  MapPin,
  Unlock,
  Package,
  WeightIcon,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { useGlobalContext } from '@/context/global-context'
import DetailActionBar from '../layout/detail-action-bar'
import DetailCard from '../ui/detail-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@radix-ui/react-accordion'
import CountUp from '../ui/count-up'

// Sample data based on the provided structure
const routingData = [
  {
    route_id: 'bdb7be2b-68b4-49ee-91ba-d4aea76bbe95',
    route_name: 'ALRODE',
    branch_name: 'Allied Steelrode (Pty) Ltd Head Office',
    suburbs: [
      {
        city: 'Alberton',
        position: 1,
        province: 'Gauteng',
        load_orders: [
          {
            id: 'c3dc2130-83c8-4c2f-a7ae-a80e39396869',
            load_id: 'b9e7d73f-b3a6-4dd7-8be6-4e0dafc573bf',
            total_weight: 1930.153,
            customer_name: 'LAZER LADZ (PTY) LTD',
            delivery_date: '2025-08-21',
            total_quantity: 50,
            sales_order_number: '7180301',
            order_status: 'Sales Order Open Printed',
          },
        ],
      },
    ],
  },
  {
    route_id: 'b3ff875a-df4e-448b-9df3-f627881d7e89',
    route_name: 'EAST RAND 01',
    branch_name: 'Allied Steelrode (Pty) Ltd Head Office',
    suburbs: [
      {
        city: 'Germiston',
        position: 1,
        province: 'Gauteng',
        load_orders: [
          {
            id: 'db9f188f-8b9d-4301-88d0-b1420cbe4949',
            load_id: 'ebd8441e-30cc-46b3-bf31-091d50084f77',
            total_weight: 6939.4,
            customer_name: 'ACQUI 38 (PTY) LTD t/a GK STEEL & MINING',
            delivery_date: '2025-08-22',
            total_quantity: 20,
            sales_order_number: '337290',
            order_status: 'Delivery Note',
          },
        ],
      },
    ],
  },
]

// Mock vehicle data to simulate the routing view

export default function CurrentRoutingView({ id }) {
  const {
    onEdit,
    onDelete,
    loads: { data },
    // loads: { data: loads_data },
  } = useGlobalContext()
  const routeData = data?.find((r) => r.route_id === id)
  //  console.log('routeData :>> ', routeData)

  const [selectedView, setSelectedView] = useState(null)

  // Calculate totals
  const totalOrders = routeData?.suburbs.reduce(
    (sum, suburb) => sum + suburb.load_orders.length,
    0
  )
  const totalWeight = routeData?.suburbs.reduce(
    (sum, suburb) =>
      sum +
      suburb.load_orders.reduce(
        (orderSum, order) => orderSum + order.total_weight,
        0
      ),
    0
  )
  const totalQuantity = routeData?.suburbs.reduce(
    (sum, suburb) =>
      sum +
      suburb.load_orders.reduce(
        (orderSum, order) => orderSum + order.total_quantity,
        0
      ),
    0
  )

  const readyOrders = routeData?.suburbs.reduce(
    (sum, suburb) =>
      sum +
      suburb.load_orders.filter(
        (order) => order.order_status === 'Stock Item Ready to Load'
      ).length,
    0
  )

  const tabs = [
    { value: 'overview', label: 'Overview' },
    // { value: 'timeline', label: 'Timeline' },
    { value: 'capacity', label: 'Capacity' },
    { value: 'status', label: 'Status' },
  ]

  const screen_stats = [
    {
      title: 'Total Orders',
      icon: <Package className="h-6 w-6 text-blue-600" />,
      value: totalOrders || 0,
      description: ` Across ${routeData?.suburbs?.length} location(s)`,
    },
    {
      title: 'Total Weight',
      icon: <WeightIcon className="h-6 w-6 text-green-600" />,
      value: `${(totalWeight / 1000)?.toFixed(1)}` || 0,
      description: `${totalWeight?.toLocaleString()} kg`,
    },
    {
      title: 'Ready to Load',
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
      value: readyOrders || 0,
      description: `${Math.round((readyOrders / totalOrders) * 100)}% complete`,
    },
    {
      title: 'Items',
      icon: <TrendingUp className="h-6 w-6 text-purple-600" />,
      value: totalQuantity || 0,
      description: 'Total pieces',
    },
  ]
  // console.log('routeData :>> ', routeData)
  return (
    <div className="min-h-screen space-y-6">
      <DetailActionBar
        id={id}
        title={routeData?.route_name}
        description={'Route Summary'}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {screen_stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {stat.icon}
                  <CardTitle>{stat.title}</CardTitle>
                </div>
                <div className="text-2xl font-bold flex  justify-end items-center gap-2">
                  <div>
                    <CountUp value={stat.value} />
                    {stat.title === 'Total Weight' && 't'}
                  </div>
                  <p className="text-xs text-gray-600 ">{stat.description}</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Tabs defaultValue={tabs?.[0]?.value} className="w-full">
        <TabsList className={`grid w-full grid-cols-${tabs.length} gap-6`}>
          {tabs.map((trigger, index) => {
            return (
              <TabsTrigger key={index} value={trigger.value}>
                <h6 className="capitalize font-bold">{trigger.label}</h6>
              </TabsTrigger>
            )
          })}
        </TabsList>
        {/* Location Cards */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6">
            {routeData?.suburbs.map((suburb, index) => (
              <DetailCard
                key={index}
                className="overflow-hidden"
                title={suburb.suburb_name}
                description={`${suburb.province} • Position ${suburb.position}`}
              >
                <Accordion type="multiple" className="w-full space-y-4">
                  {suburb.load_orders.map((order, orderIndex) => {
                    console.log('order :>> ', order)
                    return (
                      <AccordionItem
                        key={order.id}
                        value={order.id}
                        className="border rounded-lg border-[#003e69] overflow-hidden"
                      >
                        <AccordionTrigger
                          onClick={() => setSelectedView(order.id)}
                          className="p-4 hover:bg-[#7a7877] hover:text-white [&[data-state=open]]:bg-[#003e69] [&[data-state=open]]:text-white w-full"
                        >
                          <div className="flex items-center justify-between w-full ">
                            <div className="flex items-center space-x-3">
                              <div className="bg-gray-100 p-1.5 rounded">
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                              <div className="text-left">
                                <h4 className="font-medium  leading-tight">
                                  {order.customer_name}
                                </h4>
                                <p className="text-sm ">
                                  Order #{order.sales_order_number}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {order.total_weight.toLocaleString()} kg
                                </p>
                                <p className="text-xs ">
                                  {order.total_quantity} items
                                </p>
                              </div>
                              <Badge
                                variant={
                                  order.order_status ===
                                  'Stock Item Ready to Load'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className="text-xs"
                              >
                                {order.order_status ===
                                'Stock Item Ready to Load'
                                  ? 'Ready'
                                  : 'Pending'}
                              </Badge>
                              {/* <div>
                                {selectedView == order.id ? (
                                  <ChevronDown />
                                ) : (
                                  <ChevronRight />
                                )}
                              </div> */}
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="">
                          <div className="w-full space-y-4">
                            {/* Order Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">
                                  Delivery:{' '}
                                  {new Date(
                                    order.delivery_date
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Weight className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">
                                  Total: {order.total_weight.toLocaleString()}{' '}
                                  kg
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">
                                  Items: {order.total_quantity}
                                </span>
                              </div>
                            </div>

                            {/* Detailed Order Items */}
                            <div className="px-4 mb-4 space-y-2">
                              <h5 className="font-medium text-gray-900 mb-3">
                                Order Items
                              </h5>
                              <div className="space-y-2">
                                {order.load_items?.map((item, itemIndex) => {
                                  // console.log('item :>> ', item)
                                  return (
                                    <div
                                      key={itemIndex}
                                      className="flex items-center justify-between p-3 border rounded-lg bg-white border-[#428bca]"
                                    >
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                          <div className="bg-blue-50 px-2 py-1 rounded text-xs font-mono text-blue-700">
                                            {item.item_code}
                                          </div>
                                          <div>
                                            <p className="font-medium text-gray-900">
                                              {item.description}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                              Qty: {item.quantity} {item.unit} •
                                              Weight:{' '}
                                              {item.weight.toLocaleString()} kg
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium">
                                          {item.weight.toLocaleString()} kg
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          {item.quantity} {item.unit}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Dispatch Remarks */}
                            {order.dispatch_remarks && (
                              <div className="p-4 bg-yellow-50 border border-yellow-200 ">
                                <div className="flex items-start space-x-2">
                                  <div className="bg-yellow-100 p-1 rounded">
                                    <Clock className="h-3 w-3 text-yellow-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-yellow-800">
                                      Dispatch Note
                                    </p>
                                    <p className="text-sm text-yellow-700">
                                      {order.dispatch_remarks}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </DetailCard>
            ))}
          </div>
        </TabsContent>

        {/* Timeline View */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Timeline</CardTitle>
              <p className="text-sm text-[#428bca]">
                Orders organized by delivery sequence with detailed items
              </p>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full space-y-4">
                {routeData?.suburbs.map((suburb) =>
                  suburb.load_orders.map((order, index) => (
                    <AccordionItem
                      key={order.id}
                      value={order.id}
                      className="border rounded-lg border-[#003e69] overflow-hidden"
                    >
                      <AccordionTrigger className="p-4 hover:bg-[#7a7877] hover:text-white [&[data-state=open]]:bg-[#003e69] [&[data-state=open]]:text-white w-full">
                        <div className="flex items-center space-x-4 w-full mr-4 ">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="text-left">
                                <p className="font-medium  ">
                                  {order.customer_name}
                                </p>
                                <p className="text-sm  ">
                                  {suburb.suburb_name} •{' '}
                                  {order.total_weight.toLocaleString()}kg •{' '}
                                  {order.total_quantity} items
                                </p>
                              </div>
                              <Badge
                                variant={
                                  order.order_status ===
                                  'Stock Item Ready to Load'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {order.order_status ===
                                'Stock Item Ready to Load'
                                  ? 'Ready'
                                  : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="pb-4 ">
                        <div className="w-full space-y-4 ">
                          {/* Order Summary */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide">
                                Order Number
                              </p>
                              <p className="font-medium">
                                #{order.sales_order_number}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide">
                                Delivery Date
                              </p>
                              <p className="font-medium">
                                {new Date(
                                  order.delivery_date
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide">
                                Status
                              </p>
                              <p className="font-medium">
                                {order.order_status}
                              </p>
                            </div>
                          </div>

                          {/* Detailed Items */}
                          <div className="space-y-2">
                            <h6 className="font-medium text-gray-900">
                              Items to Load
                            </h6>
                            <div className="space-y-2">
                              {order.order_items?.map((item, itemIndex) => (
                                <div
                                  key={itemIndex}
                                  className="flex items-center justify-between p-2 border rounded bg-white"
                                >
                                  <div className="flex items-center space-x-3">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                      {item.item_code}
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {item.description}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {item.quantity} {item.unit}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-sm font-medium">
                                    {item.weight.toLocaleString()} kg
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {order.dispatch_remarks && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-sm">
                                <strong>Note:</strong> {order.dispatch_remarks}
                              </p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))
                )}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capacity Planning */}
        <TabsContent value="capacity" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weight Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {routeData?.suburbs.map((suburb) =>
                  suburb.load_orders.map((order) => (
                    <div key={order.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="truncate">{order.customer_name}</span>
                        <span className="font-medium">
                          {order.total_weight}kg
                        </span>
                      </div>
                      <Progress
                        value={(order.total_weight / totalWeight) * 100}
                        className="h-2"
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Load Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="font-medium">Total Capacity Needed</span>
                    <span className="text-lg font-bold text-blue-600">
                      {(totalWeight / 1000).toFixed(1)}t
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="font-medium">Ready Orders</span>
                    <span className="text-lg font-bold text-green-600">
                      {readyOrders}/{totalOrders}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span className="font-medium">Total Items</span>
                    <span className="text-lg font-bold text-purple-600">
                      {totalQuantity}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Status Board */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {routeData?.suburbs.map((suburb) =>
              suburb.load_orders.map((order) => (
                <Card key={order.id} className="relative overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${
                      order.order_status === 'Stock Item Ready to Load'
                        ? 'bg-green-500'
                        : 'bg-yellow-500'
                    }`}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium leading-tight">
                          {order.customer_name}
                        </CardTitle>
                        <p className="text-xs text-gray-600 mt-1">
                          #{order.sales_order_number}
                        </p>
                      </div>
                      {order.order_status === 'Stock Item Ready to Load' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-medium">
                        {order.total_weight}kg
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-medium">
                        {order.total_quantity}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{suburb.suburb_name}</span>
                    </div>
                    <Badge
                      variant={
                        order.order_status === 'Stock Item Ready to Load'
                          ? 'default'
                          : 'secondary'
                      }
                      className="w-full justify-center mt-2"
                    >
                      {order.order_status === 'Stock Item Ready to Load'
                        ? 'Ready to Load'
                        : 'Preparing'}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

{
  /* <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {load?.suburbs?.map((suburb, index) => (
          <DetailCard
            key={index}
            title={suburb.suburb_name}
            description={suburb.city}
          >
            <div key={index} className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {suburb.suburb_name}, {suburb.city}
                </span>
              </div>

              {suburb.load_orders.map((order) => (
                <div
                  key={order.id}
                  className="ml-6 p-2 bg-gray-50 rounded text-xs space-y-1"
                >
                  <div className="font-medium">{order.customer_name}</div>
                  <div className="text-gray-600">
                    Order: {order.sales_order_number}
                  </div>
                  <div className="text-gray-600">
                    Weight: {order.total_weight.toFixed(1)} kg
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {order.order_status}
                  </Badge>
                </div>
              ))}
            </div>
          </DetailCard>
        ))}
      </div> */
}

// const [unlockedVehicles, setUnlockedVehicles] = useState(new Set())

// const handleUnlock = (vehicleId) => {
//   setUnlockedVehicles((prev) => new Set([...prev, vehicleId]))
// }

{
  /* Print Section */
}
{
  /* <div className="p-4"> */
}
{
  /* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vehicleData.map((vehicle) => (
            <Card
              key={vehicle.vehicle_id}
              className="bg-gray-100 border-gray-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Truck className="h-5 w-5 text-gray-600" />
                  <CardTitle className="text-sm font-semibold text-gray-800">
                    {vehicle.vehicle_id}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
           
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {vehicle.driver_name}
                  </span>
                </div>

               
                <div className="flex items-center space-x-2">
                  <Weight className="h-4 w-4 text-gray-500" />
                  <div className="text-sm text-gray-700">
                    <div>{vehicle.capacity} -</div>
                    <div>{vehicle.current_load}</div>
                  </div>
                </div>

            
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-600">{vehicle.route}</span>
                </div>

           
                <div className="text-sm text-gray-600 py-2">
                  {vehicle.status}
                </div>

           
                <Button
                  onClick={() => handleUnlock(vehicle.vehicle_id)}
                  disabled={unlockedVehicles.has(vehicle.vehicle_id)}
                  className={`w-full ${
                    unlockedVehicles.has(vehicle.vehicle_id)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white text-sm`}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  {unlockedVehicles.has(vehicle.vehicle_id)
                    ? 'Unlocked'
                    : 'Click to unlock'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div> */
}

{
  /* Route Summary Cards */
}
{
  /* <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Route Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routingData.map((route) => (
              <Card key={route.route_id} className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-blue-600">
                    {route.route_name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{route.branch_name}</p>
                </CardHeader>

                <CardContent>
                  {route.suburbs.map((suburb, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {suburb.suburb_name}, {suburb.city}
                        </span>
                      </div>

                      {suburb.load_orders.map((order) => (
                        <div
                          key={order.id}
                          className="ml-6 p-2 bg-gray-50 rounded text-xs space-y-1"
                        >
                          <div className="font-medium">
                            {order.customer_name}
                          </div>
                          <div className="text-gray-600">
                            Order: {order.sales_order_number}
                          </div>
                          <div className="text-gray-600">
                            Weight: {order.total_weight.toFixed(1)} kg
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {order.order_status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div> */
}
{
  /* </div> */
}

// 'use client'

// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
// import { ExternalLink, MapPin, Clock, Package, Route } from 'lucide-react'
// import { useGlobalContext } from '@/context/global-context'
// import DetailActionBar from '../layout/detail-action-bar'
// import CountUp from '../ui/count-up'
// import DetailCard from '../ui/detail-card'
// import { Separator } from '../ui/separator'
// import { createSortableHeader, DataTable } from '../ui/data-table'

// export default function LoadsPage({ id }) {
//   const { loads } = useGlobalContext()

//   const orderData = loads?.data?.find((o) => o.route_id == id)
//   let total_orders = 0
//   orderData?.suburbs?.forEach((s) => {
//     total_orders = total_orders + s.load_orders.length
//   })
//   console.log('total_orders :>> ', total_orders)
//   const totalWeight = orderData?.order_lines?.reduce(
//     (sum, line) => sum + line.weight * line.quantity,
//     0
//   )
//   const totalItems = orderData?.order_lines?.reduce(
//     (sum, line) => sum + line.quantity,
//     0
//   )

//   const screenStats = [
//     {
//       title: 'Active Suburbs',
//       value: orderData?.suburbs?.length || 0,
//       icon: <Package className="h-5 w-5 text-violet-500" />,
//     },
//     {
//       title: 'Total Weight',
//       value: `${totalWeight?.toFixed(1)} kg` || '0 kg',
//       icon: <Package className="h-5 w-5 text-pink-700" />,
//     },
//     {
//       title: 'Due Date',
//       value:
//         new Date(orderData?.document_due_date).toLocaleDateString() || 'N/A',
//       icon: <Clock className="h-5 w-5 text-orange-500" />,
//     },
//     {
//       title: 'Route',
//       value: orderData?.sales_order_route || 'N/A',
//       icon: <Route className="h-5 w-5 text-emerald-500" />,
//     },
//   ]

//   const order_information = [
//     {
//       label: 'Sales Person',
//       value: orderData?.sales_person_name,
//     },
//     {
//       label: 'Customer Reference',
//       value: orderData?.customer_reference_number,
//     },
//     {
//       label: 'Card Code',
//       value: orderData?.card_code,
//     },
//     {
//       label: 'Zone',
//       value: orderData?.sales_order_zone,
//     },
//     {
//       label: 'Created Date',
//       value: new Date(orderData?.created_at).toLocaleDateString(),
//     },
//     {
//       label: ' Dispatch Status',
//       value: (
//         <Badge
//           variant={
//             orderData?.send_to_dispatch === 'Y' ? 'default' : 'secondary'
//           }
//         >
//           {orderData?.send_to_dispatch === 'Y'
//             ? 'Ready for Dispatch'
//             : 'Not Ready'}
//         </Badge>
//       ),
//     },
//   ]

//   const customer_information = [
//     //  { label: 'Company Name', value: orderData?.customer_name },
//     {
//       label: 'Address',
//       value: (
//         <div className="text-sm">
//           <p>{orderData?.street_on_customer_record}</p>
//           <p>{orderData?.block_on_customer_record}</p>
//           <p>{orderData?.city_on_customer_record}</p>
//           <p>{orderData?.zip_code_on_customer_record}</p>
//         </div>
//       ),
//     },
//     {
//       label: 'Business Hours',
//       value: (
//         <div className="text-sm">
//           <p>
//             Mon-Thu: {orderData?.customer_opening_time_monday_to_friday} -{' '}
//             {orderData?.customer_closing_time_monday_to_thursday}
//           </p>
//           <p>
//             Friday: {orderData?.customer_opening_time_monday_to_friday} -{' '}
//             {orderData?.customer_closing_time_friday}
//           </p>
//         </div>
//       ),
//     },
//   ]

//   const order_columns = [
//     // {
//     //   accessorKey: 'id',
//     //   header: createSortableHeader('ID'),
//     // },position

//     {
//       accessorKey: 'province',
//       header: createSortableHeader('Province'),
//     },
//     {
//       accessorKey: 'city',
//       header: createSortableHeader('City'),
//     },
//     {
//       accessorKey: 'suburb_name',
//       header: createSortableHeader('Suburb'),
//     },
//     {
//       accessorKey: 'position',
//       header: createSortableHeader('Position'),
//       cell: ({ row }) => {
//         console.log('row :>> ', row.getValue('position'))
//         return (
//           <Badge
//             variant="outline"
//             className="bg-pink-50 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800"
//           >
//             {row.getValue('position')}
//           </Badge>
//         )
//       },
//     },
//   ]

//   return (
//     <div className=" space-y-6">
//       <DetailActionBar
//         id={id}
//         title={`Route Details`}
//         description={`${orderData?.route_name} | ${orderData?.branch_name.slice(
//           26
//         )} | ${orderData?.suburbs?.length} - Stops`}
//       />

//       {/* Summary Cards */}
//       <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
//         {screenStats?.map((stat, index) => (
//           <Card key={index}>
//             <CardHeader className="flex flex-row items-center h-full justify-between space-y-0 pb-2">
//               <CardTitle className="text-[10px] lg:text-[16px] font-bold ">
//                 {stat.title}
//               </CardTitle>
//               <div>{stat.icon}</div>
//             </CardHeader>
//             <CardContent>
//               <div className="text-[10px] lg:text-[16px] font-semibold  ">
//                 {typeof stat.value == 'number' ? (
//                   <CountUp value={stat.value} />
//                 ) : (
//                   stat.value
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* Main Content */}

//       <div className="grid gap-6 md:grid-cols-2">
//         {/* Order Information */}
//         <DetailCard
//           title={'Order Information'}
//           description={'Information about this order'}
//         >
//           <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//             {order_information?.map((info) => (
//               <div key={info.label}>
//                 <dt className="text-sm font-medium text-gray-500">
//                   {info.label}
//                 </dt>
//                 <dd className="mt-1 text-sm text-gray-900">{info.value}</dd>
//               </div>
//             ))}
//           </dl>
//         </DetailCard>

//         {/* Customer Information */}
//         <DetailCard
//           title={'Customer Details'}
//           description={orderData?.customer_name}
//         >
//           <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//             {customer_information?.map((info) => (
//               <div key={info.label}>
//                 <dt className="text-sm font-medium text-gray-500">
//                   {info.label}
//                 </dt>
//                 <dd className="mt-1 text-sm text-gray-900">{info.value}</dd>
//               </div>
//             ))}
//           </dl>
//           <Separator className={'my-6'} />
//         </DetailCard>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"></div>

//       {/* Order Lines Table */}
//       <DetailCard title={'Order Lines'}>
//         {orderData?.suburbs && (
//           <DataTable
//             columns={order_columns}
//             data={orderData?.suburbs}
//             filterColumn="model"
//             filterPlaceholder="Search vehicles..."
//           />
//         )}
//       </DetailCard>

//       {/* Actions */}
//       <div className="flex justify-end space-x-4">
//         <Button variant="outline">
//           <ExternalLink className="h-4 w-4 mr-2" />
//           View in System
//         </Button>
//         <Button className="bg-blue-600 hover:bg-blue-700">Process Order</Button>
//       </div>
//     </div>
//   )
// }
