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
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Truck, User, Weight, MapPin, Unlock } from 'lucide-react'
import { useState } from 'react'

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
const vehicleData = [
  {
    vehicle_id: 'JP33CFGP',
    driver_name: 'Patrick M',
    capacity: '8.00 Tons',
    current_load: '8.00 M',
    status: '0 B - 0%',
    route: 'ALRODE',
  },
  {
    vehicle_id: 'FG24FJGP',
    driver_name: 'TBA1 TB',
    capacity: '8.00 Tons',
    current_load: '7.00 M',
    status: '0 B - 0%',
    route: 'EAST RAND 01',
  },
  {
    vehicle_id: 'KH82LZGP',
    driver_name: 'TBA1 TB',
    capacity: '13.00 Tons',
    current_load: '5.80 M',
    status: '0 B - 0%',
    route: 'EAST RAND 02',
  },
  {
    vehicle_id: 'DN32BSGP',
    driver_name: 'Jabulani',
    capacity: '13.00 Tons',
    current_load: '9.00 M',
    status: '0 B - 0%',
    route: 'WEST RAND',
  },
  {
    vehicle_id: 'JZ32NHGP',
    driver_name: 'Ronald E',
    capacity: '20.00 Tons',
    current_load: '13.00 M',
    status: '0 B - 0%',
    route: 'NORTH RAND',
  },
  {
    vehicle_id: 'DX17CYGP',
    driver_name: 'SACKY S',
    capacity: '13.00 Tons',
    current_load: '13.20 M',
    status: '0 B - 0%',
    route: 'SOUTH RAND',
  },
]

export default function CurrentRoutingView() {
  const [unlockedVehicles, setUnlockedVehicles] = useState(new Set())

  const handleUnlock = (vehicleId) => {
    setUnlockedVehicles((prev) => new Set([...prev, vehicleId]))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 p-2 rounded">
              <Truck className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold">Current Routing View</h1>
          </div>
          <div className="text-sm">Good evening, Shanton Ferndale</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex space-x-8 px-4">
          <button className="py-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
            Upload Sap File
          </button>
          <button className="py-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
            Create Load
          </button>
          <button className="py-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
            Assignment
          </button>
          <button className="py-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
            Create Adhoc Load
          </button>
          <button className="py-3 px-1 border-b-2 border-blue-500 text-blue-600 font-medium">
            Current Routing View
          </button>
        </div>
      </div>

      {/* Print Section */}
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-6">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            Print
          </Button>
          <span className="text-sm text-gray-600">0 B</span>
        </div>

        {/* Vehicle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                {/* Driver */}
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {vehicle.driver_name}
                  </span>
                </div>

                {/* Weight Info */}
                <div className="flex items-center space-x-2">
                  <Weight className="h-4 w-4 text-gray-500" />
                  <div className="text-sm text-gray-700">
                    <div>{vehicle.capacity} -</div>
                    <div>{vehicle.current_load}</div>
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-600">{vehicle.route}</span>
                </div>

                {/* Status */}
                <div className="text-sm text-gray-600 py-2">
                  {vehicle.status}
                </div>

                {/* Unlock Button */}
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
        </div>

        {/* Route Summary Cards */}
        <div className="mt-8">
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
        </div>
      </div>
    </div>
  )
}
