'use client'

import PageTitle from '@/components/layout/page-title'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DetailCard from '@/components/ui/detail-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import supabase from '@/config/supabase'
import { useGlobalContext } from '@/context/global-context'
import { MapPin, Truck, Unlock, User, Weight } from 'lucide-react'
import { useEffect, useState } from 'react'

const Dashboard = () => {
  const { dashboardState, branches, load_assignment, vehicles } =
    useGlobalContext()
  const [liveData, setLiveData] = useState(null)
  const [error, setError] = useState(null)

  const [unlockedVehicles, setUnlockedVehicles] = useState(new Set())

  const handleUnlock = (vehicleId) => {
    setUnlockedVehicles((prev) => new Set([...prev, vehicleId]))
  }

  // const test = load_assignment?.data?.[1]

  // console.log('test :>> ', typeof test)

  // console.log(
  //   'vehicles?.data :>> ',
  //   vehicles?.data?.map((v) => console.log('v :>> ', v))
  // )

  const branch_inputs = [
    {
      type: 'select',
      htmlFor: 'costCentre',
      label: 'Cost Centre',
      placeholder: 'Select cost centre',
      value: dashboardState?.branch,

      options: branches
        ? branches?.data?.map((cc) => {
            return { value: cc.id, label: cc.name }
          })
        : [],
    },
  ]

  // useEffect(() => {
  //   const ws = new WebSocket('ws://64.227.138.235:8001') // use your droplet IP

  //   ws.onmessage = (event) => {
  //     try {
  //       const data = JSON.parse(event.data)
  //       setLiveData(data)
  //     } catch (e) {
  //       setError('❌ Invalid JSON received')
  //     }
  //   }

  //   ws.onerror = () => {
  //     setError('⚠️ WebSocket connection error')
  //   }

  //   ws.onclose = () => {
  //     console.log('🔌 WebSocket closed')
  //   }

  //   // Cleanup on unmount
  //   return () => {
  //     ws.close()
  //   }
  // }, [])

  // console.log('error :>> ', error)
  // console.log('liveData :>> ', typeof liveData)

  const channels = supabase
    .channel('custom-update-channel')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'vehicles' },
      (payload) => {
        console.log('Change received!', payload)
      }
    )
    .subscribe()

  console.log('channels :>> ', channels)

  const feed = [
    {
      label: 'Address',
      value: liveData?.Address,
    },
    { label: 'driverAuth', value: liveData?.driverAuth },
    { label: 'Geozone', value: liveData?.Geozone },
    { label: 'driverName', value: liveData?.DriverName },
    { label: 'head', value: liveData?.Head },
    { label: 'latitude', value: liveData?.Latitude },
    { label: 'locationTime', value: liveData?.LocTime },
    { label: 'longitude', value: liveData?.Longitude },
    { label: 'mileage', value: liveData?.Mileage },
    { label: 'plate', value: liveData?.Plate },
    { label: 'speed', value: liveData?.Speed },
    // { label: 'status', value: liveData?.status },
  ]

  const vehicleData = load_assignment?.data?.[1] || []
  //  const test = vehicleData?.filter((v) => v.loads)
  // console.log('test :>> ', test)
  return (
    <div className="space-y-6 p-4 md:p-6 ">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <PageTitle />
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vehicleData?.map((vehicle) => {
            const vehicle_plate = vehicles?.data?.filter(
              (v) => v.id == vehicle?.vehicle_id
            )?.[0]?.license_plate
            const test_plate = () => {
              if (liveData?.Plate == vehicle_plate) {
                return liveData
              }
            }
            console.log('test_plate :>> ', test_plate()?.Geozone)
            return (
              <>
                {vehicle_plate && (
                  <Card
                    key={vehicle?.vehicle_id}
                    className="bg-gray-100 border-gray-300"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Truck className="h-5 w-5 text-gray-600" />
                        <CardTitle className="text-sm font-semibold text-gray-800">
                          {vehicle_plate}
                        </CardTitle>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Driver */}
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {test_plate()?.Geozone}
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
                )}
              </>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
