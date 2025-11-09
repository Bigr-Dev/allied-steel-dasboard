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
} from 'lucide-react'
import { useGlobalContext } from '@/context/global-context'
import { Badge } from '../ui/badge'
import dynamic from 'next/dynamic'
import { fetchData } from '@/lib/fetch'

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
  const { selectedVehicle, vehicles } = useGlobalContext()

  const vehiclesData = vehicles?.data

  const [notes, setNotes] = useState('')
  const [customers, setCustomers] = useState(
    selectedVehicle?.customersData || []
  )
  const [customersWithCoords, setCustomersWithCoords] = useState([])
  const [branchCoords, setBranchCoords] = useState(null)
  const [geocoding, setGeocoding] = useState(false)

  // Auto-geocode on component mount
  useEffect(() => {
    geocodeCustomers()
  }, [])

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
    setGeocoding(true)

    // Get branch info
    const vehicle = vehiclesData?.find(
      (v) =>
        v.fleet_number === selectedVehicle?.vehicleData?.plate ||
        v.license_plate === selectedVehicle?.vehicleData?.plate
    )
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

    const branchGeocode = await geocodeAddress(branchAddress)
    setBranchCoords({
      ...branchGeocode,
      name: displayBranch,
      address: branchAddress,
      geocoded: !!branchGeocode,
    })

    // Geocode customers
    const customerPromises = (selectedVehicle?.customersData || []).map(
      async (customer) => {
        const coords = await geocodeAddress(`${customer.suburb}, South Africa`)
        return {
          ...customer,
          coordinates: coords,
          geocoded: !!coords,
        }
      }
    )

    const results = await Promise.all(customerPromises)
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
    // Handle form submission here

    const plan_id = selectedVehicle?.selectedPlanId
    const plan_unit_id = selectedVehicle?.unitData?.plan_unit_id

    fetchData(`plans/${plan_id}/units/${plan_unit_id}`, 'POST', {
      plan_id,
      plan_unit_id,
      note: notes,
    }).then((r) => {
      console.log('r :>> ', r)
    })
    // if (notes) {
    //   await fetchData('/api/assignment-planner/units/note', {
    //     // plan_id,
    //     // plan_unit_id,
    //     note: notes,
    //   }).then((r) => r.json())
    // }
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
                      const vehicle = vehiclesData.find(
                        (v) =>
                          v.license_plate === selectedVehicle.vehicleData?.plate
                      )
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
                  const vehicle = vehiclesData?.find(
                    (v) =>
                      v.fleet_number === selectedVehicle?.vehicleData?.plate ||
                      v.license_plate === selectedVehicle?.vehicleData?.plate
                  )
                  const branchName = vehicle?.branch_name
                  const displayBranch = branchName?.includes('Midvaal')
                    ? 'ASSM'
                    : branchName?.includes('Head Office')
                    ? 'ALRODE'
                    : branchName || 'Unknown Branch'

                  const branchInfo = branchCoords || {
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

                  const routeLocations = [
                    branchInfo,
                    ...(customersWithCoords.length > 0
                      ? customersWithCoords
                      : selectedVehicle?.customersData || []),
                    branchInfo,
                  ]

                  // Mock completed stops - in real implementation, this would come from vehicle tracking data
                  const completedStops = [0, 1] // First two segments completed

                  return (
                    <MapComponent
                      routeLocations={routeLocations}
                      vehicleData={selectedVehicle?.vehicleData}
                      completedStops={completedStops}
                    />
                  )
                })()}
              </div>
              {geocoding && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="h-8 px-3 text-xs bg-white text-black border rounded-md flex items-center">
                    Geocoding...
                  </div>
                </div>
              )}

              {selectedVehicle?.vehicleData?.live && (
                <div className="absolute top-2 right-2 z-20 bg-black bg-opacity-70 text-white p-3 rounded-lg text-xs min-w-[200px]">
                  <div className="space-y-2">
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

                    {(() => {
                      const live = selectedVehicle.vehicleData.live
                      const nextCustomer = customersWithCoords.find(
                        (c) => c.coordinates
                      )

                      if (
                        live.Latitude &&
                        live.Longitude &&
                        nextCustomer?.coordinates
                      ) {
                        const eta = calculateETA(
                          live.Latitude,
                          live.Longitude,
                          nextCustomer.coordinates.lat,
                          nextCustomer.coordinates.lng,
                          live.Speed || 0
                        )

                        if (eta) {
                          return (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>ETA: {eta}</span>
                            </div>
                          )
                        }
                      }
                      return null
                    })()}

                    {selectedVehicle.vehicleData.live.DriverName && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>
                          {selectedVehicle.vehicleData.live.DriverName}
                        </span>
                      </div>
                    )}
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
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}

export default DashboardForm
