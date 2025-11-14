'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Gauge,
  User,
  MapPin,
  Navigation,
  Clock,
  Compass,
  Save,
} from 'lucide-react'
import { useGlobalContext } from '@/context/global-context'
import { Badge } from '../ui/badge'
import dynamic from 'next/dynamic'
import { fetchData } from '@/lib/fetch'

import { Spinner } from '../ui/spinner'

const MapComponent = dynamic(() => import('./map-component'), { ssr: false })

const SortableCustomer = ({ customer, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: customer.id || index })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-2 p-2 border rounded bg-white"
    >
      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
        {index + 1}
      </div>
      <div {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{customer.display_name}</span>
          <span className="text-xs text-gray-500">({customer.suburb})</span>
        </div>
      </div>
    </div>
  )
}

const DashboardForm = ({ onCancel }) => {
  const {
    selectedVehicle,
    vehicles,
    assignment_preview,
    setAssignmentPreview,
  } = useGlobalContext()

  const vehiclesData = vehicles?.data
  // console.log('selectedVehicle :>> ', selectedVehicle)
  const [notes, setNotes] = useState(selectedVehicle?.unitData?.notes || '')
  const [customers, setCustomers] = useState(
    selectedVehicle?.customersData || []
  )
  const [customersWithCoords, setCustomersWithCoords] = useState([])
  const [branchCoords, setBranchCoords] = useState(null)
  const [geocoding, setGeocoding] = useState(false)
  const [routeInfo, setRouteInfo] = useState(null)
  const [loading, setLoading] = useState(false)

  // Auto-geocode on component mount and when selectedVehicle changes
  useEffect(() => {
    if (selectedVehicle?.customersData && vehiclesData) {
      geocodeCustomers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicle?.vehicleData?.plate, vehiclesData])

  const calculateETA = (
    currentLat,
    currentLng,
    targetLat,
    targetLng,
    speed
  ) => {
    if (
      !currentLat ||
      !currentLng ||
      !targetLat ||
      !targetLng ||
      !speed ||
      speed <= 0
    )
      return null

    const R = 6371 // Earth's radius in km
    const dLat = ((targetLat - currentLat) * Math.PI) / 180
    const dLng = ((targetLng - currentLng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((currentLat * Math.PI) / 180) *
        Math.cos((targetLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    const timeHours = distance / speed
    const hours = Math.floor(timeHours)
    const minutes = Math.round((timeHours - hours) * 60)

    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getHeadingDirection = (heading) => {
    if (!heading) return 'Unknown'
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(heading / 45) % 8
    return directions[index]
  }

  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?access_token=${
          process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
          'pk.eyJ1IjoiYWxsaWVkc3RlZWwiLCJhIjoiY2x6cWZqZGNzMGNhZzJqcGdxZGNqZGNqZCJ9.example'
        }`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center
        return { lat, lng }
      }
    } catch (error) {
      console.error(`Geocoding failed for ${address}:`, error)
    }
    return null
  }

  const geocodeCustomers = async () => {
    if (!selectedVehicle?.customersData || !vehiclesData) {
      console.log('No customer data or vehicle data available')
      return
    }

    setGeocoding(true)
    // console.log('Starting geocoding...')

    // Get branch info
    const targetPlate = selectedVehicle?.vehicleData?.plate
      ?.trim()
      .toUpperCase()
    const vehicle = vehiclesData.find((v) => {
      const vPlate = (
        v.license_plate ||
        v.plate ||
        v.reg_number ||
        v.fleet_number ||
        ''
      )
        .trim()
        .toUpperCase()
      return vPlate === targetPlate
    })

    const branchName = vehicle?.branch_name
    const displayBranch = branchName?.includes('Midvaal')
      ? 'ASSM'
      : branchName?.includes('Head Office')
      ? 'ALRODE'
      : branchName || 'Unknown Branch'

    // Geocode branch
    let branchAddress = 'Unknown Address'
    if (displayBranch === 'ASSM') {
      branchAddress = 'Springbok Road, South Africa'
    } else if (displayBranch === 'ALRODE') {
      branchAddress = 'Vereeniging Road, Alberton, 1451, South Africa'
    }

    // console.log('Geocoding branch:', branchAddress)
    const branchGeocode = await geocodeAddress(branchAddress)
    // console.log('Branch geocode result:', branchGeocode)

    const branchData = {
      lat: branchGeocode?.lat || null,
      lng: branchGeocode?.lng || null,
      name: displayBranch,
      address: branchAddress,
      geocoded: !!branchGeocode,
    }
    setBranchCoords(branchData)

    // Geocode customers
    // console.log('Geocoding customers:', selectedVehicle.customersData)
    const customerPromises = selectedVehicle.customersData.map(
      async (customer) => {
        const suburb =
          customer.suburb || customer.suburb_name || customer.surburb_name
        if (!suburb) {
          console.log('No suburb for customer:', customer)
          return { ...customer, coordinates: null, geocoded: false }
        }
        const coords = await geocodeAddress(`${suburb}, South Africa`)
        // console.log(`Geocoded ${suburb}:`, coords)
        return {
          ...customer,
          coordinates: coords,
          geocoded: !!coords,
        }
      }
    )

    const results = await Promise.all(customerPromises)
    //console.log('All geocoding complete:', results)
    setCustomersWithCoords(results)
    setGeocoding(false)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const tabs = [
    { name: 'Vehicle Information', value: 'vehicle_info' },
    { name: 'Map View', value: 'map_view' },
  ]

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setCustomers((items) => {
        const oldIndex = items.findIndex(
          (item) => (item.id || items.indexOf(item)) === active.id
        )
        const newIndex = items.findIndex(
          (item) => (item.id || items.indexOf(item)) === over.id
        )

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const formData = {
      plan_id: selectedVehicle?.selectedPlanId,
      planned_unit_id: selectedVehicle?.unitData?.planned_unit_id,
      note: notes,
    }
    if (notes) {
      // console.log('formData :>> ', formData)
      const res = await fetchData(`plans/units/note`, 'POST', formData)
      setAssignmentPreview(res)
      //console.log('assignment_preview :>> ', assignment_preview)
    }
    setLoading(false)
    onCancel()
  }
  // console.log('plan_unit_id  :>> ', selectedVehicle?.unitData?.plan_unit_id)
  const filteredNotes = notes.replace(/\s+/g, '')

  const disabled =
    selectedVehicle?.selectedPlanId == 'all'
      ? true
      : filteredNotes.length < 4
      ? true
      : false

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 grid-cols-1">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-lg text-[#003e69] font-bold tracking-tight uppercase">
              Vehicle Details
            </h2>
            <p className="text-[#428bca]">
              {selectedVehicle?.vehicleData?.plate || 'No vehicle selected'}
              {selectedVehicle?.unitData?.unit_type &&
                ` - ${selectedVehicle.unitData.unit_type}`}
            </p>
          </div>
        </div>

        <Tabs defaultValue={tabs[0]?.value} className="w-full">
          <TabsList className={`grid w-full grid-cols-${tabs.length} gap-6`}>
            {tabs.map((tab, index) => (
              <TabsTrigger key={index} value={tab.value}>
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="vehicle_info" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {selectedVehicle && vehiclesData && (
                <Card>
                  <CardHeader className="py-2 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-mono">
                        {selectedVehicle.vehicleData?.plate}
                      </CardTitle>
                      <Badge className="text-[10px] capitalize">
                        {selectedVehicle.vehicleData?.live ? 'Live' : 'Offline'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 pt-0">
                    {(() => {
                      const targetPlate = selectedVehicle.vehicleData?.plate
                        ?.trim()
                        .toUpperCase()
                      const vehicle = vehiclesData.find((v) => {
                        const vPlate = (
                          v.license_plate ||
                          v.plate ||
                          v.reg_number ||
                          v.fleet_number ||
                          ''
                        )
                          .trim()
                          .toUpperCase()
                        return vPlate === targetPlate
                      })
                      //console.log('vehicle :>> ', vehicle)
                      const live = selectedVehicle.vehicleData?.live
                      const branchName = vehicle?.branch_name
                      const displayBranch = branchName?.includes('Midvaal')
                        ? 'ASSM'
                        : branchName?.includes('Head Office')
                        ? 'ALRODE'
                        : branchName || 'Unknown Branch'

                      return (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[11px] text-muted-foreground">
                              Branch: {displayBranch}
                            </span>
                          </div>

                          {live?.Speed && (
                            <div className="flex items-center gap-2">
                              <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">
                                {Number(live.Speed).toFixed(1)} km/h
                              </span>
                            </div>
                          )}

                          {live?.DriverName && (
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{live.DriverName}</span>
                            </div>
                          )}

                          {live?.Address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                              <span className="text-[11px] text-muted-foreground line-clamp-2">
                                {live.Address}
                              </span>
                            </div>
                          )}

                          {(live?.Geozone || live?.zone) && (
                            <div className="flex items-center gap-2">
                              <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-[11px] text-muted-foreground">
                                {live.Geozone || live.zone}
                              </span>
                            </div>
                          )}

                          {live?.timestamp && (
                            <div className="text-[11px] text-muted-foreground border-t pt-1">
                              Last seen:{' '}
                              {(() => {
                                const ts = Date.parse(live.timestamp)
                                if (!ts) return 'Unknown'
                                const d = Date.now() - ts
                                if (d < 60_000) return 'Live'
                                if (d < 3_600_000)
                                  return `${Math.floor(d / 60_000)}m ago`
                                if (d < 86_400_000)
                                  return `${Math.floor(d / 3_600_000)}h ago`
                                return `${Math.floor(d / 86_400_000)}d ago`
                              })()}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this vehicle..."
                    className="min-h-[150px] bg-white border-[#d3d3d3]"
                  />
                </CardContent>
              </Card>
            </div>

            {customers && customers.length > 0 && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Customer Route Order</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag and drop customers to reorder the delivery route.
                    Numbers indicate visit sequence.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={customers.map(
                          (customer, index) => customer.id || index
                        )}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {customers.map((customer, index) => (
                            <SortableCustomer
                              key={customer.id || index}
                              customer={customer}
                              index={index}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="map_view" className="space-y-4">
            <div className="border rounded-lg h-96 relative">
              <div className="w-full h-full rounded overflow-hidden">
                {(() => {
                  const targetPlate = selectedVehicle?.vehicleData?.plate
                    ?.trim()
                    .toUpperCase()
                  const vehicle = vehiclesData?.find((v) => {
                    const vPlate = (
                      v.license_plate ||
                      v.plate ||
                      v.reg_number ||
                      v.fleet_number ||
                      ''
                    )
                      .trim()
                      .toUpperCase()
                    return vPlate === targetPlate
                  })
                  const branchName = vehicle?.branch_name
                  const displayBranch = branchName?.includes('Midvaal')
                    ? 'ASSM'
                    : branchName?.includes('Head Office')
                    ? 'ALRODE'
                    : branchName || 'Unknown Branch'

                  const branchInfo =
                    branchCoords && branchCoords.lat && branchCoords.lng
                      ? branchCoords
                      : {
                          lat: null,
                          lng: null,
                          name: displayBranch,
                          address:
                            displayBranch === 'ASSM'
                              ? 'Springbok Road, South Africa'
                              : displayBranch === 'ALRODE'
                              ? 'Vereeniging Road, Alberton, 1451, South Africa'
                              : 'Unknown Address',
                        }

                  // Add vehicle current location if available
                  const vehicleLocation =
                    selectedVehicle?.vehicleData?.live?.Latitude &&
                    selectedVehicle?.vehicleData?.live?.Longitude
                      ? {
                          lat: Number(
                            selectedVehicle.vehicleData.live.Latitude
                          ),
                          lng: Number(
                            selectedVehicle.vehicleData.live.Longitude
                          ),
                          name: 'Current Location',
                          display_name: `${selectedVehicle.vehicleData.plate} - Current Position`,
                          address:
                            selectedVehicle.vehicleData.live.Address ||
                            'Current vehicle position',
                        }
                      : null

                  const routeLocations = [
                    branchInfo,
                    ...(vehicleLocation ? [vehicleLocation] : []),
                    ...customersWithCoords,
                    branchInfo,
                  ]

                  // console.log('Route locations:', routeLocations)
                  // console.log('Branch coords:', branchCoords)
                  // console.log('Vehicle location:', vehicleLocation)
                  // console.log('Customers with coords:', customersWithCoords)

                  // Mock completed stops - in real implementation, this would come from vehicle tracking data
                  const completedStops = [0, 1] // First two segments completed

                  return (
                    <MapComponent
                      routeLocations={routeLocations}
                      vehicleData={selectedVehicle?.vehicleData}
                      completedStops={completedStops}
                      onRouteInfoChange={setRouteInfo}
                    />
                  )
                })()}
              </div>
              {geocoding && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="h-8 px-3 text-xs bg-white text-black border rounded-md flex items-center">
                    Geocoding addresses...
                  </div>
                </div>
              )}

              {selectedVehicle?.vehicleData?.live && routeInfo && (
                <div className="absolute top-2 right-2 z-20 bg-black bg-opacity-70 text-white p-3 rounded-lg text-xs min-w-[200px]">
                  <div className="space-y-2">
                    <div className="font-semibold text-sm mb-1">
                      Live Tracking
                    </div>

                    <div className="flex items-center gap-2">
                      <Gauge className="h-3 w-3" />
                      <span>
                        {Number(
                          selectedVehicle.vehicleData.live.Speed || 0
                        ).toFixed(1)}{' '}
                        km/h
                      </span>
                    </div>

                    {selectedVehicle.vehicleData.live.Heading && (
                      <div className="flex items-center gap-2">
                        <Compass className="h-3 w-3" />
                        <span>
                          {getHeadingDirection(
                            selectedVehicle.vehicleData.live.Heading
                          )}{' '}
                          ({selectedVehicle.vehicleData.live.Heading}°)
                        </span>
                      </div>
                    )}

                    {selectedVehicle.vehicleData.live.DriverName && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>
                          {selectedVehicle.vehicleData.live.DriverName}
                        </span>
                      </div>
                    )}

                    <div className="text-xs mt-1">
                      <div>
                        Distance: {(routeInfo.totalDistance / 1000).toFixed(1)}{' '}
                        km
                      </div>
                      <div>
                        Time: {Math.floor(routeInfo.totalDuration / 3600)}h{' '}
                        {Math.round((routeInfo.totalDuration % 3600) / 60)}m
                      </div>
                    </div>

                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <div className="text-[10px] text-gray-300">
                        ⚠️ Truck Route (avoids bridges &lt;5m)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#003e69] hover:bg-[#428bca]"
            disabled={disabled}
          >
            {loading ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}

export default DashboardForm
