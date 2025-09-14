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
import { Skeleton } from '@/components/ui/skeleton'
import supabase from '@/config/supabase'
import { useGlobalContext } from '@/context/global-context'
import { MapPin, Truck, Unlock, User, Weight } from 'lucide-react'
//import { useEffect, useState } from 'react'

// image
import page_bg from '@/assets/page_bg.png'
import Image from 'next/image'

import { useState, useEffect, useRef } from 'react'
//import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
//import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  //  Truck,
  //  MapPin,
  Clock,
  Gauge,
  Route,
  Navigation,
  Zap,
  Map,
  Eye,
} from 'lucide-react'
// import {
//   createVehicleMarker,
//   parseRawTcpData,
// } from '@/components/vehicle-marker'
// import { createRouteLayer, fitMapToRoutes } from '@/components/route-utils'
// import { FilterPanel, applyFilters } from '@/components/filter-panel'

// Import data
// import tcpFeedData from '@/data/tcp-feed.json'
// import routeData from '@/data/route-data.json'
import {
  createVehicleMarker,
  parseRawTcpData,
} from '@/components/map/vehicle-marker'
import { createRouteLayer, fitMapToRoutes } from '@/components/map/route-utils'
import { FilterPanel, applyFilters } from '@/components/map/filter-panel'

export default function VehicleDashboard() {
  const { dashboardState, branches, load_assignment, vehicles } =
    useGlobalContext()
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showAllVehicles, setShowAllVehicles] = useState(true)
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState([])
  const [liveVehicles, setLiveVehicles] = useState([])
  const [isLiveTracking, setIsLiveTracking] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)
  const [mapboxgl, setMapboxgl] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    vehicleType: 'all',
    route: 'all',
    speedRange: { min: 0, max: 200 },
  })
  const [filteredData, setFilteredData] = useState({
    filteredLive: [],
    filteredRoutes: [],
  })
  const mapContainer = useRef(null)

  const tcpFeedData = []
  const routeData = load_assignment?.data?.[1] || []

  useEffect(() => {
    if (tcpFeedData.rawMessage) {
      const parsedVehicles = parseRawTcpData(tcpFeedData.rawMessage)
      setLiveVehicles([tcpFeedData, ...parsedVehicles])
    } else {
      setLiveVehicles([tcpFeedData])
    }
  }, [])

  useEffect(() => {
    const result = applyFilters(liveVehicles, routeData, filters)
    setFilteredData(result)
  }, [liveVehicles, filters])

  useEffect(() => {
    if (typeof window !== 'undefined' && !map) {
      import('mapbox-gl').then((mapboxModule) => {
        const mapboxgl = mapboxModule.default
        setMapboxgl(mapboxgl)
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

        if (mapContainer.current) {
          mapContainer.current.innerHTML = ''
        }

        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [28.1396, -26.3071],
          zoom: 10,
        })

        mapInstance.on('load', () => {
          setMap(mapInstance)
        })

        // return () => mapInstance.remove()
        return () => {
          if (mapInstance) {
            mapInstance.remove()
          }
        }
      })
    }
  }, [map])

  useEffect(() => {
    if (map && mapboxgl && showRoutes) {
      const vehicleToShow =
        selectedVehicle &&
        !filteredData.filteredLive.find((v) => v.Plate === selectedVehicle)
          ? selectedVehicle
          : null

      createRouteLayer(map, filteredData.filteredRoutes, vehicleToShow)

      if (vehicleToShow) {
        fitMapToRoutes(map, filteredData.filteredRoutes, vehicleToShow)
      }
    } else if (map && !showRoutes) {
      if (map.getLayer('route-lines')) {
        map.removeLayer('route-lines')
      }
      if (map.getSource('route-lines')) {
        map.removeSource('route-lines')
      }
      if (map.getLayer('route-destinations')) {
        map.removeLayer('route-destinations')
      }
      if (map.getSource('route-destinations')) {
        map.removeSource('route-destinations')
      }
    }
  }, [map, mapboxgl, selectedVehicle, showRoutes, filteredData])

  useEffect(() => {
    if (map && filteredData.filteredLive.length > 0) {
      markers.forEach((marker) => marker.remove())

      const newMarkers = []

      filteredData.filteredLive.forEach((vehicle, index) => {
        if (vehicle.Latitude && vehicle.Longitude) {
          import('mapbox-gl').then((mapboxModule) => {
            const mapboxgl = mapboxModule.default
            const isSelected = selectedVehicle === vehicle.Plate
            const marker = createVehicleMarker(mapboxgl, vehicle, isSelected)
              .setLngLat([vehicle.Longitude, vehicle.Latitude])
              .setPopup(
                new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div class="p-3 min-w-[200px]">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="font-semibold text-sm">${vehicle.Plate}</h3>
                    <span class="text-xs px-2 py-1 rounded-full ${
                      vehicle.Speed > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }">
                      ${vehicle.Speed > 0 ? 'Moving' : 'Stopped'}
                    </span>
                  </div>
                  <div class="space-y-1 text-xs text-gray-600">
                    <div class="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <span>Speed: ${vehicle.Speed} km/h</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span class="truncate">${
                        vehicle.Geozone || 'Unknown Location'
                      }</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                        <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                      </svg>
                      <span>Quality: ${vehicle.Quality}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                        <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                      </svg>
                      <span>${new Date(
                        vehicle.LocTime
                      ).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              `)
              )
              .addTo(map)

            marker.getElement().addEventListener('click', () => {
              setSelectedVehicle(vehicle.Plate)
              setShowAllVehicles(false)
            })

            newMarkers.push(marker)
          })
        }
      })

      setMarkers(newMarkers)
    }
  }, [map, selectedVehicle, showAllVehicles, filteredData.filteredLive])

  useEffect(() => {
    if (!isLiveTracking) return

    const interval = setInterval(() => {
      setLiveVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) => ({
          ...vehicle,
          Speed: Math.max(0, vehicle.Speed + (Math.random() - 0.5) * 10),
          Latitude: vehicle.Latitude + (Math.random() - 0.5) * 0.001,
          Longitude: vehicle.Longitude + (Math.random() - 0.5) * 0.001,
          LocTime: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        }))
      )
    }, 30000)

    return () => clearInterval(interval)
  }, [isLiveTracking])

  const getVehicleStatus = (speed) => {
    if (speed > 0) return { status: 'Moving', color: 'bg-green-500' }
    return { status: 'Stopped', color: 'bg-red-500' }
  }

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString()
  }

  const centerOnVehicle = (vehicle) => {
    if (map && vehicle.Latitude && vehicle.Longitude) {
      map.flyTo({
        center: [vehicle.Longitude, vehicle.Latitude],
        zoom: 15,
        duration: 1000,
      })
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  return (
    <div className="h-full bg-background">
      {/* <header className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-2">
            <Truck className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">
              Allied Steel Fleet Dashboard
            </h1>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button
              variant={showRoutes ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowRoutes(!showRoutes)}
              className="flex items-center space-x-2"
            >
              <Map className="h-4 w-4" />
              <span>Routes</span>
            </Button>
            <Button
              variant={isLiveTracking ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsLiveTracking(!isLiveTracking)}
              className="flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>{isLiveTracking ? 'Live' : 'Paused'}</span>
            </Button>
            <Badge variant="outline" className="text-sm">
              {filteredData.filteredLive.length +
                filteredData.filteredRoutes.length}{' '}
              of {liveVehicles.length + routeData.length} Vehicles
            </Badge>
            <div className="text-sm text-muted-foreground">
              Last Update: {formatTime(new Date().toISOString())}
            </div>
          </div>
        </div>
      </header> */}

      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-80 border-r bg-card overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Live Fleet</h2>
              <Button
                variant={showAllVehicles ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowAllVehicles(true)
                  setSelectedVehicle(null)
                }}
              >
                Show All
              </Button>
            </div>

            {filteredData.filteredLive.map((vehicle, index) => (
              <Card
                key={`${vehicle.Plate}-${index}`}
                className={`mb-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedVehicle === vehicle.Plate ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  setSelectedVehicle(vehicle.Plate)
                  setShowAllVehicles(false)
                  centerOnVehicle(vehicle)
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {vehicle.Plate}
                    </CardTitle>
                    <div className="flex items-center space-x-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          getVehicleStatus(vehicle.Speed).color
                        }`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {getVehicleStatus(vehicle.Speed).status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <Gauge className="h-3 w-3 text-muted-foreground" />
                      <span>{Math.round(vehicle.Speed)} km/h</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">
                        {vehicle.Geozone || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Navigation className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">
                        {vehicle.Latitude?.toFixed(4)},{' '}
                        {vehicle.Longitude?.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{formatTime(vehicle.LocTime)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredData.filteredLive.length === 0 &&
              liveVehicles.length > 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No live vehicles match current filters
                </div>
              )}

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Scheduled Routes
              </h3>
              {filteredData.filteredRoutes.slice(0, 3).map((vehicle, index) => (
                <Card
                  key={vehicle.vehicle_id}
                  className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
                    selectedVehicle === vehicle.vehicle_id
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedVehicle(vehicle.vehicle_id)
                    setShowAllVehicles(false)
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        Route {index + 1}
                      </CardTitle>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className="text-xs">
                          {vehicle.assigned_load_count} loads
                        </Badge>
                        {showRoutes &&
                          selectedVehicle === vehicle.vehicle_id && (
                            <Eye className="h-3 w-3 text-primary" />
                          )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <Route className="h-3 w-3 text-muted-foreground" />
                        <span>{vehicle.total_assigned_kg.toFixed(0)} kg</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">
                          {vehicle.loads[0]?.route_name || 'No route'}
                        </span>
                      </div>
                      {vehicle.loads.length > 1 && (
                        <div className="text-xs text-muted-foreground">
                          +{vehicle.loads.length - 1} more destinations
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredData.filteredRoutes.length === 0 &&
                routeData.length > 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No routes match current filters
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          <div
            ref={mapContainer}
            className="w-full h-full "
            style={{ minHeight: '100%' }}
          />

          <FilterPanel
            liveVehicles={liveVehicles}
            routeData={routeData}
            onFilterChange={handleFilterChange}
            isOpen={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />

          <div className="absolute top-4 right-4 bg-card rounded-lg shadow-lg p-4 max-w-sm">
            <h3 className="font-semibold mb-2 flex items-center space-x-2">
              {selectedVehicle &&
              filteredData.filteredLive.find(
                (v) => v.Plate === selectedVehicle
              ) ? (
                <>
                  <Zap className="h-4 w-4 text-green-500" />
                  <span>{selectedVehicle} - Live Tracking</span>
                </>
              ) : selectedVehicle ? (
                <>
                  <Route className="h-4 w-4 text-primary" />
                  <span>Route Details</span>
                </>
              ) : (
                <span>Fleet Overview</span>
              )}
            </h3>

            {selectedVehicle &&
              (() => {
                const liveVehicle = filteredData.filteredLive.find(
                  (v) => v.Plate === selectedVehicle
                )
                if (liveVehicle) {
                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Speed:</span>
                        <span className="font-medium">
                          {Math.round(liveVehicle.Speed)} km/h
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Signal Quality:</span>
                        <span className="font-medium">
                          {liveVehicle.Quality}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span className="font-medium text-xs">
                          {liveVehicle.Geozone}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Update:</span>
                        <span className="font-medium text-xs">
                          {formatTime(liveVehicle.LocTime)}
                        </span>
                      </div>
                    </div>
                  )
                }

                const routeVehicle = filteredData.filteredRoutes.find(
                  (v) => v.vehicle_id === selectedVehicle
                )
                return routeVehicle ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Weight:</span>
                      <span className="font-medium">
                        {routeVehicle.total_assigned_kg.toFixed(0)} kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Load Count:</span>
                      <span className="font-medium">
                        {routeVehicle.assigned_load_count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Destinations:</span>
                      <span className="font-medium">
                        {routeVehicle.loads.length}
                      </span>
                    </div>
                    <div className="mt-3 pt-2 border-t">
                      <div className="text-xs font-medium mb-1">
                        Route Stops:
                      </div>
                      <div className="space-y-1">
                        {routeVehicle.loads.slice(0, 3).map((load, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-muted-foreground flex items-center space-x-1"
                          >
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span>{load.route_name}</span>
                          </div>
                        ))}
                        {routeVehicle.loads.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{routeVehicle.loads.length - 3} more stops
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null
              })()}

            {showAllVehicles && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Live Vehicles:</span>
                  <span className="font-medium text-green-600">
                    {filteredData.filteredLive.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Moving:</span>
                  <span className="font-medium text-green-600">
                    {
                      filteredData.filteredLive.filter((v) => v.Speed > 0)
                        .length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Stopped:</span>
                  <span className="font-medium text-red-600">
                    {
                      filteredData.filteredLive.filter((v) => v.Speed === 0)
                        .length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Scheduled Routes:</span>
                  <span className="font-medium">
                    {filteredData.filteredRoutes.length}
                  </span>
                </div>
                {showRoutes && (
                  <div className="mt-3 pt-2 border-t">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Map className="h-3 w-3" />
                      <span>Route visualization active</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// const Dashboard = () => {
//   const { dashboardState, branches, load_assignment, vehicles } =
//     useGlobalContext()
//   const [liveData, setLiveData] = useState(null)
//   const [error, setError] = useState(null)

//   const [unlockedVehicles, setUnlockedVehicles] = useState(new Set())

//   const handleUnlock = (vehicleId) => {
//     setUnlockedVehicles((prev) => new Set([...prev, vehicleId]))
//   }

//   const test = load_assignment?.data?.[1]

//   // console.log('test :>> ', typeof test)

//   // console.log(
//   //   'vehicles?.data :>> ',
//   //   vehicles?.data?.map((v) => console.log('v :>> ', v))
//   // )

//   const branch_inputs = [
//     {
//       type: 'select',
//       htmlFor: 'costCentre',
//       label: 'Cost Centre',
//       placeholder: 'Select cost centre',
//       value: dashboardState?.branch,

//       options: branches
//         ? branches?.data?.map((cc) => {
//             return { value: cc.id, label: cc.name }
//           })
//         : [],
//     },
//   ]

//   useEffect(() => {
//     const ws = new WebSocket('ws://64.227.138.235:8001') // use your droplet IP

//     ws.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data)
//         setLiveData(data)
//       } catch (e) {
//         setError('❌ Invalid JSON received')
//       }
//     }

//     ws.onerror = () => {
//       setError('⚠️ WebSocket connection error')
//     }

//     ws.onclose = () => {
//       console.log('🔌 WebSocket closed')
//     }

//     // Cleanup on unmount
//     return () => {
//       ws.close()
//     }
//   }, [])

//   // console.log('error :>> ', error)
//   // console.log('liveData :>> ', liveData)

//   // const channels = supabase
//   //   .channel('custom-update-channel')
//   //   .on(
//   //     'postgres_changes',
//   //     { event: 'UPDATE', schema: 'public', table: 'vehicles' },
//   //     (payload) => {
//   //       console.log('Change received!', payload)
//   //     }
//   //   )
//   //   .subscribe()

//   // //  console.log('channels :>> ', channels)

//   // const feed = [
//   //   {
//   //     label: 'Address',
//   //     value: liveData?.Address,
//   //   },
//   //   { label: 'driverAuth', value: liveData?.driverAuth },
//   //   { label: 'Geozone', value: liveData?.Geozone },
//   //   { label: 'driverName', value: liveData?.DriverName },
//   //   { label: 'head', value: liveData?.Head },
//   //   { label: 'latitude', value: liveData?.Latitude },
//   //   { label: 'locationTime', value: liveData?.LocTime },
//   //   { label: 'longitude', value: liveData?.Longitude },
//   //   { label: 'mileage', value: liveData?.Mileage },
//   //   { label: 'plate', value: liveData?.Plate },
//   //   { label: 'speed', value: liveData?.Speed },
//   //   // { label: 'status', value: liveData?.status },
//   // ]

//   const vehicleData = load_assignment?.data?.[1] || []
//   //  const test = vehicleData?.filter((v) => v.loads)
//   // console.log('test :>> ', test)
//   console.log('vehicleData :>> ', vehicleData)

//   // console.log('vehicleData :>> ', vehicleData)
//   return (
//     <div className="space-y-6 p-4 md:p-6 ">
//       <div className="flex flex-col md:flex-row justify-between items-end gap-4">
//         <PageTitle />
//       </div>

//       <div className="mt-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//           {vehicleData?.map((vehicle) => {
//             const vehicle_plate = vehicles?.data?.filter(
//               (v) => v.id == vehicle?.vehicle_id
//             )?.[0]?.license_plate
//             const test_plate = () => {
//               if (liveData?.Plate == vehicle_plate) {
//                 return liveData
//               }
//             }

//             const test = vehicleData?.map((v) => v.loads)
//             const test2 = test?.filter((t) => t.branch_id)
//             // console.log('test2 :>> ', test2)
//             //  console.log('test_plate :>> ', test_plate()?.Geozone)

//             return (
//               <Card
//                 key={vehicle?.vehicle_id}
//                 className={` ${
//                   !vehicle_plate && 'visibility-hidden'
//                 } bg-gray-100 border-gray-300`}
//               >
//                 <CardHeader className="pb-3">
//                   <div className="flex items-center justify-between">
//                     <Truck className="h-5 w-5 text-gray-600" />
//                     <CardTitle className="text-sm font-semibold text-gray-800">
//                       {vehicle_plate}
//                     </CardTitle>
//                   </div>
//                 </CardHeader>

//                 <CardContent className="space-y-3">
//                   {/* Driver */}
//                   <div className="flex items-center space-x-2">
//                     <User className="h-4 w-4 text-gray-500" />
//                     <span className="text-sm text-gray-700">
//                       {test_plate()?.Geozone}
//                     </span>
//                   </div>

//                   {/* Weight Info */}
//                   <div className="flex items-center space-x-2">
//                     <Weight className="h-4 w-4 text-gray-500" />
//                     <div className="text-sm text-gray-700">
//                       <div>{vehicle?.capacity} -</div>
//                       <div>{vehicle?.current_load}</div>
//                     </div>
//                   </div>

//                   {/* Route */}
//                   <div className="flex items-center space-x-2">
//                     <MapPin className="h-4 w-4 text-gray-500" />
//                     <span className="text-xs text-gray-600">
//                       {vehicle?.route}
//                     </span>
//                   </div>

//                   {/* Status */}
//                   <div className="text-sm text-gray-600 py-2">
//                     {vehicle?.status}
//                   </div>

//                   {/* Unlock Button */}
//                   <Button
//                     onClick={() => handleUnlock(vehicle.vehicle_id)}
//                     disabled={unlockedVehicles.has(vehicle.vehicle_id)}
//                     className={`w-full ${
//                       unlockedVehicles.has(vehicle.vehicle_id)
//                         ? 'bg-gray-400 cursor-not-allowed'
//                         : 'bg-green-600 hover:bg-green-700'
//                     } text-white text-sm`}
//                   >
//                     <Unlock className="h-4 w-4 mr-2" />
//                     {unlockedVehicles.has(vehicle.vehicle_id)
//                       ? 'Unlocked'
//                       : 'Click to unlock'}
//                   </Button>
//                 </CardContent>
//               </Card>
//             )
//           })}
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Dashboard
// 'use client'

// import { useEffect, useMemo, useRef, useState } from 'react'
// import supabase from '@/config/supabase'
// import { useGlobalContext } from '@/context/global-context'
// import PageTitle from './[page_id]/@title/default'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { MapPin, Truck, Unlock, User, Weight } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// // … your other imports

// const Dashboard = () => {
//   const { dashboardState, branches, load_assignment, vehicles } =
//     useGlobalContext()

//   // Map of license_plate -> latest row from `vehicles`
//   const [liveByPlate, setLiveByPlate] = useState({})
//   const [realtimeError, setRealtimeError] = useState(null)

//   // If you want to show the cards for these:
//   const vehicleData = load_assignment?.data?.[1] || []

//   // Build a helper map: vehicle_id -> license_plate to avoid filtering every render
//   const plateByVehicleId = useMemo(() => {
//     const map = {}
//     vehicles?.data?.forEach((v) => {
//       if (v?.id && v?.license_plate) map[v.id] = v.license_plate
//     })
//     return map
//   }, [vehicles?.data])

//   useEffect(() => {
//     // Optional: filter by branch if your vehicles table has branch_id
//     const branchId = dashboardState?.branch // or whatever your selected branch is
//     const filter = branchId ? `branch_id=eq.${branchId}` : undefined

//     const channel = supabase
//       .channel('realtime:public:vehicles')
//       .on(
//         'postgres_changes',
//         {
//           event: '*', // INSERT | UPDATE | DELETE | *
//           schema: 'public',
//           table: 'vehicles',
//           ...(filter ? { filter } : {}), // filter is optional
//         },
//         (payload) => {
//           if (payload.eventType === 'DELETE') {
//             const oldRow = payload.old
//             const plate = oldRow?.license_plate
//             if (!plate) return
//             setLiveByPlate((prev) => {
//               const next = { ...prev }
//               delete next[plate]
//               return next
//             })
//             return
//           }

//           // INSERT or UPDATE
//           const newRow = payload.new
//           const plate = newRow?.license_plate
//           if (!plate) return

//           setLiveByPlate((prev) => ({
//             ...prev,
//             [plate]: newRow,
//           }))
//         }
//       )
//       .subscribe((status) => {
//         if (status === 'SUBSCRIBED') {
//           // console.log('Realtime subscribed')
//         }
//       })

//     // Handle channel errors
//     channel.on('error', (e) => setRealtimeError(String(e?.message || e)))

//     return () => {
//       // Clean up on unmount or when branch changes
//       supabase.removeChannel(channel)
//     }
//   }, [dashboardState?.branch]) // re-subscribe if the selected branch changes

//   // Optional: also fetch an initial snapshot so the UI is populated immediately
//   useEffect(() => {
//     let isMounted = true
//     const fetchInitial = async () => {
//       const query = supabase.from('vehicles').select('*')
//       const { data, error } = await (dashboardState?.branch
//         ? query.eq('branch_id', dashboardState.branch)
//         : query)

//       if (error) {
//         setRealtimeError(error.message)
//         return
//       }
//       if (!isMounted || !data) return
//       const next = {}
//       for (const row of data) {
//         if (row?.license_plate) next[row.license_plate] = row
//       }
//       setLiveByPlate(next)
//     }
//     fetchInitial()
//     return () => {
//       isMounted = false
//     }
//   }, [dashboardState?.branch])

//   // Helper to pick the live row for a vehicle
//   const liveForVehicle = (vehicle_id) => {
//     const plate = plateByVehicleId[vehicle_id]
//     if (!plate) return null
//     return liveByPlate[plate] || null
//   }

//   const [unlockedVehicles, setUnlockedVehicles] = useState('')
//   const handleUnlock = (vehicleId) => {
//     setUnlockedVehicles((prev) => new Set([...prev, vehicleId]))
//   }

//   return (
//     <div className="space-y-6 p-4 md:p-6">
//       <div className="flex flex-col md:flex-row justify-between items-end gap-4">
//         <PageTitle />
//       </div>

//       {realtimeError && (
//         <div className="text-sm text-red-600">
//           Realtime error: {realtimeError}
//         </div>
//       )}

//       <div className="mt-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//           {vehicleData?.map((vehicle) => {
//             const plate = plateByVehicleId[vehicle?.vehicle_id]
//             const live = plate ? liveByPlate[plate] : null

//             return plate ? (
//               <Card
//                 key={vehicle?.vehicle_id}
//                 className="bg-gray-100 border-gray-300"
//               >
//                 <CardHeader className="pb-3">
//                   <div className="flex items-center justify-between">
//                     <Truck className="h-5 w-5 text-gray-600" />
//                     <CardTitle className="text-sm font-semibold text-gray-800">
//                       {plate}
//                     </CardTitle>
//                   </div>
//                 </CardHeader>

//                 <CardContent className="space-y-3">
//                   {/* Example live fields. Match these to your column names */}
//                   <div className="flex items-center space-x-2">
//                     <User className="h-4 w-4 text-gray-500" />
//                     <span className="text-sm text-gray-700">
//                       {live?.drivername ?? live?.driver_name ?? '—'}
//                     </span>
//                   </div>

//                   <div className="flex items-center space-x-2">
//                     <MapPin className="h-4 w-4 text-gray-500" />
//                     <span className="text-xs text-gray-600">
//                       {live?.geozone ?? live?.address ?? '—'}
//                     </span>
//                   </div>

//                   <div className="flex items-center space-x-2">
//                     <Weight className="h-4 w-4 text-gray-500" />
//                     <div className="text-sm text-gray-700">
//                       <div>{vehicle?.capacity} -</div>
//                       <div>{vehicle?.current_load}</div>
//                     </div>
//                   </div>

//                   <div className="text-sm text-gray-600 py-2">
//                     {vehicle?.status}
//                   </div>

//                   <Button
//                     onClick={() => handleUnlock(vehicle.vehicle_id)}
//                     disabled={unlockedVehicles.has(vehicle.vehicle_id)}
//                     className={`w-full ${
//                       unlockedVehicles.has(vehicle.vehicle_id)
//                         ? 'bg-gray-400 cursor-not-allowed'
//                         : 'bg-green-600 hover:bg-green-700'
//                     } text-white text-sm`}
//                   >
//                     <Unlock className="h-4 w-4 mr-2" />
//                     {unlockedVehicles.has(vehicle.vehicle_id)
//                       ? 'Unlocked'
//                       : 'Click to unlock'}
//                   </Button>
//                 </CardContent>
//               </Card>
//             ) : null
//           })}
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Dashboard
