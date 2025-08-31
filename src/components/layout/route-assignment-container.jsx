'use client'

import { useGlobalContext } from '@/context/global-context'
import PageLoader from '../ui/loader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import DetailCard from '../ui/detail-card'
import { usePathname } from 'next/navigation'
import { replaceHyphenWithUnderscore } from '@/hooks/replace-hyphen'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { MapPin, Truck, Unlock, User, Weight } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { useState } from 'react'
import { DataTable } from '../ui/data-table'

const RouteAssignment = () => {
  const pathname = usePathname().slice(1)
  const path = replaceHyphenWithUnderscore(pathname)
  const current_screen = useGlobalContext()[path]
  const { load_assignment, loads, onEdit, onDelete, loading } =
    useGlobalContext()

  const [unlockedVehicles, setUnlockedVehicles] = useState(new Set())

  const handleUnlock = (vehicleId) => {
    setUnlockedVehicles((prev) => new Set([...prev, vehicleId]))
  }

  const routingData = load_assignment?.data?.[0] || []
  console.log('routingData :>> ', load_assignment?.data?.[0])

  const vehicleData = load_assignment?.data?.[1] || []

  const tomorrowOrders = current_screen?.data?.filter((order) => {
    const dueRaw = order?.document_due_date
    if (!dueRaw) return false

    const due = new Date(dueRaw)
    if (Number.isNaN(due)) return false

    const now = new Date()
    const startTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    )
    const startDayAfter = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 2
    )

    return due >= startTomorrow && due < startDayAfter
  })

  // console.log('loads?.data :>> ', loads?.data)
  return (
    <>
      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1">
          {
            <Tabs
              defaultValue={current_screen?.tableInfo?.tabs?.[0]?.value}
              className="w-full"
            >
              <TabsList
                className={`grid w-full grid-cols-${current_screen?.tableInfo?.tabs.length} gap-6`}
              >
                {current_screen?.tableInfo?.tabs.map((trigger, index) => {
                  return (
                    <TabsTrigger key={index} value={trigger.value}>
                      <h6 className="capitalize font-bold">{trigger.title}</h6>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              {current_screen?.tableInfo?.tabs?.map((content, index) => {
                //console.log('content.value :>> ', content?.value)
                return (
                  <TabsContent
                    key={index}
                    value={content?.value}
                    className="space-y-4 "
                  >
                    {content.value == 'routes' ? (
                      <div className="mt-6">
                        {/* <h2 className="text-lg font-semibold text-gray-800 mb-4">
                          Route Summary
                        </h2> */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {routingData?.map((route) => {
                            console.log('route :>> ', route)
                            return (
                              <Card
                                key={route?.route_id}
                                className="border-gray-200"
                              >
                                <CardHeader>
                                  <CardTitle className="text-base font-semibold text-blue-600">
                                    {route?.route_name}
                                  </CardTitle>
                                  <p className="text-sm text-gray-600">
                                    {route?.branch_name}
                                  </p>
                                </CardHeader>

                                <CardContent>
                                  {route.orders.map((order, index) => (
                                    <div key={index} className="mb-4">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <MapPin className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">
                                          {`${order.customer_name} -
                                          ${order.sales_order_number}`}
                                        </span>
                                      </div>

                                      {order.items.map((order) => (
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
                                            Weight:{' '}
                                            {order?.total_weight?.toFixed(1)} kg
                                          </div>
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {order.order_status}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    ) : content.value == 'vehicles' ? (
                      <div className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {vehicleData?.map((vehicle) => (
                            <Card
                              key={vehicle?.vehicle_id}
                              className="bg-gray-100 border-gray-300"
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <Truck className="h-5 w-5 text-gray-600" />
                                  <CardTitle className="text-sm font-semibold text-gray-800">
                                    {vehicle?.vehicle_id}
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
                                    <div>{vehicle?.capacity} -</div>
                                    <div>{vehicle?.current_load}</div>
                                  </div>
                                </div>

                                {/* Route */}
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4 text-gray-500" />
                                  <span className="text-xs text-gray-600">
                                    {vehicle?.route}
                                  </span>
                                </div>

                                {/* Status */}
                                <div className="text-sm text-gray-600 py-2">
                                  {vehicle?.status}
                                </div>

                                {/* Unlock Button */}
                                <Button
                                  onClick={() =>
                                    handleUnlock(vehicle.vehicle_id)
                                  }
                                  disabled={unlockedVehicles.has(
                                    vehicle.vehicle_id
                                  )}
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
                      </div>
                    ) : (
                      <DetailCard
                        title={`All ${current_screen?.tableInfo.title}`}
                      >
                        <DataTable
                          columns={current_screen?.columns({
                            onEdit,
                            onDelete,
                          })}
                          data={loads?.data}
                          filterColumn={loads?.tableInfo.filterColumn}
                          filterPlaceholder={loads?.tableInfo.filterPlaceholder}
                          csv_headers={loads?.csv_headers}
                          csv_rows={loads?.csv_rows}
                        />
                      </DetailCard>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>
          }
        </div>
      )}
    </>
  )
}

export default RouteAssignment
