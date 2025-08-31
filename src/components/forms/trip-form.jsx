'use client'

import { format } from 'date-fns'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
//import { BasicInfoSection } from './trip-form/basic-info-section'
//import { ClientSection } from './trip-form/client-section'
import { DriversVehiclesSection } from './trip-form/drivers-vehicles-section'
import { LocationsSection } from './trip-form/locations-section'
//import { WaypointsSection } from './trip-form/waypoints-section'

import { useGlobalContext } from '@/context/global-context'
import DynamicInput from '@/components/ui/dynamic-input'
import { Separator } from '@/components/ui/separator'
import DetailCard from '@/components/ui/detail-card'
import { CardDescription, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// hooks
//import { getAddressCoordinates } from '@/hooks/get-address-coordinates'

const TripForm = ({ onCancel, id }) => {
  const {
    trips,
    tripsDispatch,
    t_api,
    drivers,
    vehicles,
    stop_points,
    cost_centres,
    clients: _clients,
  } = useGlobalContext()
  const costCentres = cost_centres?.data
  const stopPoints = stop_points?.data
  const clients = _clients?.data
  const [loading, setLoading] = useState(false)

  // Form state
  const trip = trips.data.find((t) => t.id === id)
  const lastId =
    trips.length > 0
      ? Number.parseInt(trips[trips.length - 1].id.split('-')[1])
      : 0
  const newId = `TRP-${String(lastId + 1).padStart(3, '0')}`

  const [formData, setFormData] = useState({
    id: trip?.id || newId,
    orderNumber: trip?.orderNumber || '',
    rate: trip?.rate || '',
    status: 'pending',
    startDate: trip?.departureTime || format(new Date(), 'yyyy-MM-dd'),
    endDate: trip?.estimatedArrivalTime || format(new Date(), 'yyyy-MM-dd'),
    costCentre: trip?.costCentre || '',
    origin: trip?.pickupLocation || '',
    destination: '',
    cargo: trip?.cargo || '',
    cargoWeight: trip?.cargoWeight || '',
    notes: trip?.notes || '',
    drivers: trip?.drivers || [{ id: '', name: '' }],
    // remove after testing
    vehicles: [{ id: trip?.vehicleId, name: trip?.vehicle }] || [
      { id: '', name: '' },
    ],
    // updated vehicle
    vehicleAssignments: trip?.vehicleAssignments || [
      {
        vehicle: { id: '', name: '' },
        drivers: [{ id: '', name: '' }],
        trailers: [],
      },
    ],
    pickupLocations: [
      {
        location: '',
        address: '',
        contactPerson: '',
        contactNumber: '',
        operatingHours: '',
        scheduledTime: '',
        notes: '',
      },
    ],
    dropoffLocations: [
      {
        location: '',
        address: '',
        contactPerson: '',
        contactNumber: '',
        operatingHours: '',
        scheduledTime: '',
        notes: '',
      },
    ],
    waypoints: [],
    selectedStopPoints: [],
    stopPoints: trip?.stopPoints || [
      {
        name: '',
        address: '',
        contactPerson: '',
        contactNumber: '',
        operatingHours: '',
        scheduledTime: '',
        notes: '',
      },
    ],
    selectedClient: trip?.selectedClient || '',
    clientDetails: {
      name:
        clients?.find((client) => client.name === trip?.selectedClient)?.name ||
        '',
      email:
        clients?.find((client) => client.name === trip?.selectedClient)
          ?.email || '',
      phone:
        clients?.find((client) => client.name === trip?.selectedClient)
          ?.phone || '',
      address:
        clients?.find((client) => client.name === trip?.selectedClient)
          ?.address || '',
      contactPerson:
        clients?.find((client) => client.name === trip?.selectedClient)
          ?.contactPerson || '',
    },
    status: trip?.status || 'pending',
    statusNotes: trip?.statusNotes || '',
  })

  const [currentTab, setCurrentTab] = useState(0)

  // Handle client selection
  const handleClientChange = (clientId) => {
    //  console.log('clientId :>> ', clientId)
    const selectedClient = clients?.find((client) => client.name === clientId)

    if (selectedClient) {
      setFormData((prev) => ({
        ...prev,
        selectedClient: clientId,
        clientDetails: {
          name: selectedClient.name || '',
          email: selectedClient.email || '',
          phone: selectedClient.phone || '',
          address: selectedClient.address || '',
          contactPerson: selectedClient.contactPerson || '',
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedClient: '',
        clientDetails: {
          name: '',
          email: '',
          phone: '',
          address: '',
          contactPerson: '',
        },
      }))
    }
  }

  // Handle client details change
  const handleClientDetailsChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      clientDetails: {
        ...prev.clientDetails,
        [field]: value,
      },
    }))
  }

  // Handle stop point selection for waypoints
  const handleStopPointSelection = (stopPointId, checked) => {
    const stopPoint = stopPoints.data.find((point) => point.id === stopPointId)

    if (checked) {
      setFormData((prev) => ({
        ...prev,
        selectedStopPoints: [...prev.selectedStopPoints, stopPointId],
        waypoints: [
          ...prev.waypoints,
          {
            id: stopPointId,
            location: stopPoint.name,
            arrivalTime: '',
            departureTime: '',
            notes: '',
          },
        ],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedStopPoints: prev.selectedStopPoints.filter(
          (id) => id !== stopPointId
        ),
        waypoints: prev.waypoints.filter(
          (waypoint) => waypoint.id !== stopPointId
        ),
      }))
    }
  }

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle date change
  const handleDateChange = (field, date) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date ? format(date, 'yyyy-MM-dd') : '',
    }))
  }

  // Handle select change
  const handleSelectChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Vehicle Assignment Handlers
  const handleVehicleChange = (vehicleIndex, vehicleId) => {
    const selectedVehicle = vehicles.data.find(
      (vehicle) => vehicle.id === vehicleId
    )
    const vehicleName = selectedVehicle
      ? `${selectedVehicle.model} (${selectedVehicle.regNumber})`
      : ''

    setFormData((prev) => {
      const updatedAssignments = [...prev.vehicleAssignments]
      updatedAssignments[vehicleIndex] = {
        ...updatedAssignments[vehicleIndex],
        vehicle: { id: vehicleId, name: vehicleName },
      }
      return {
        ...prev,
        vehicleAssignments: updatedAssignments,
      }
    })
  }

  const addVehicle = () => {
    setFormData((prev) => ({
      ...prev,
      vehicleAssignments: [
        ...prev.vehicleAssignments,
        {
          vehicle: { id: '', name: '' },
          drivers: [{ id: '', name: '' }],
          trailers: [],
        },
      ],
    }))
  }

  const removeVehicle = (vehicleIndex) => {
    setFormData((prev) => {
      const updatedAssignments = [...prev.vehicleAssignments]
      updatedAssignments.splice(vehicleIndex, 1)
      return {
        ...prev,
        vehicleAssignments:
          updatedAssignments.length > 0
            ? updatedAssignments
            : [
                {
                  vehicle: { id: '', name: '' },
                  drivers: [{ id: '', name: '' }],
                  trailers: [],
                },
              ],
      }
    })
  }

  // Driver Handlers for specific vehicles
  const handleVehicleDriverChange = (vehicleIndex, driverIndex, driverId) => {
    const selectedDriver = drivers?.data.find(
      (driver) => driver.id === driverId
    )
    const driverName = selectedDriver ? selectedDriver.name : ''

    setFormData((prev) => {
      const updatedAssignments = [...prev.vehicleAssignments]
      const updatedDrivers = [...updatedAssignments[vehicleIndex].drivers]
      updatedDrivers[driverIndex] = { id: driverId, name: driverName }
      updatedAssignments[vehicleIndex] = {
        ...updatedAssignments[vehicleIndex],
        drivers: updatedDrivers,
      }
      return {
        ...prev,
        vehicleAssignments: updatedAssignments,
      }
    })
  }

  const addVehicleDriver = (vehicleIndex) => {
    setFormData((prev) => {
      const updatedAssignments = [...prev.vehicleAssignments]
      updatedAssignments[vehicleIndex] = {
        ...updatedAssignments[vehicleIndex],
        drivers: [
          ...updatedAssignments[vehicleIndex].drivers,
          { id: '', name: '' },
        ],
      }
      return {
        ...prev,
        vehicleAssignments: updatedAssignments,
      }
    })
  }

  const removeVehicleDriver = (vehicleIndex, driverIndex) => {
    setFormData((prev) => {
      const updatedAssignments = [...prev.vehicleAssignments]
      const updatedDrivers = [...updatedAssignments[vehicleIndex].drivers]
      updatedDrivers.splice(driverIndex, 1)
      updatedAssignments[vehicleIndex] = {
        ...updatedAssignments[vehicleIndex],
        drivers:
          updatedDrivers.length > 0 ? updatedDrivers : [{ id: '', name: '' }],
      }
      return {
        ...prev,
        vehicleAssignments: updatedAssignments,
      }
    })
  }

  // Trailer Handlers for specific vehicles
  const handleVehicleTrailerChange = (
    vehicleIndex,
    trailerIndex,
    trailerId
  ) => {
    const selectedTrailer = vehicles?.data.find(
      (trailer) => trailer.id === trailerId
    )
    const trailerName = selectedTrailer
      ? `${selectedTrailer.model} (${selectedTrailer.regNumber})`
      : ''

    setFormData((prev) => {
      const updatedAssignments = [...prev.vehicleAssignments]
      const updatedTrailers = [...updatedAssignments[vehicleIndex].trailers]
      updatedTrailers[trailerIndex] = { id: trailerId, name: trailerName }
      updatedAssignments[vehicleIndex] = {
        ...updatedAssignments[vehicleIndex],
        trailers: updatedTrailers,
      }
      return {
        ...prev,
        vehicleAssignments: updatedAssignments,
      }
    })
  }

  const addVehicleTrailer = (vehicleIndex) => {
    setFormData((prev) => {
      const updatedAssignments = [...prev.vehicleAssignments]
      updatedAssignments[vehicleIndex] = {
        ...updatedAssignments[vehicleIndex],
        trailers: [
          ...updatedAssignments[vehicleIndex].trailers,
          { id: '', name: '' },
        ],
      }
      return {
        ...prev,
        vehicleAssignments: updatedAssignments,
      }
    })
  }

  const removeVehicleTrailer = (vehicleIndex, trailerIndex) => {
    setFormData((prev) => {
      const updatedAssignments = [...prev.vehicleAssignments]
      const updatedTrailers = [...updatedAssignments[vehicleIndex].trailers]
      updatedTrailers.splice(trailerIndex, 1)
      updatedAssignments[vehicleIndex] = {
        ...updatedAssignments[vehicleIndex],
        trailers: updatedTrailers,
      }
      return {
        ...prev,
        vehicleAssignments: updatedAssignments,
      }
    })
  }

  // Handle driver selection
  const handleDriverChange = (index, driverId) => {
    const selectedDriver = drivers?.data.find(
      (driver) => driver.id === driverId
    )
    const driverName = selectedDriver ? selectedDriver.name : ''

    setFormData((prev) => {
      const updatedDrivers = [...prev.drivers]
      updatedDrivers[index] = { id: driverId, name: driverName }
      return {
        ...prev,
        drivers: updatedDrivers,
      }
    })
  }

  // Add driver
  const addDriver = () => {
    setFormData((prev) => ({
      ...prev,
      drivers: [...prev.drivers, { id: '', name: '' }],
    }))
  }

  // Remove driver
  const removeDriver = (index) => {
    setFormData((prev) => {
      const updatedDrivers = [...prev.drivers]
      updatedDrivers.splice(index, 1)
      return {
        ...prev,
        drivers:
          updatedDrivers.length > 0 ? updatedDrivers : [{ id: '', name: '' }],
      }
    })
  }

  // Handle pickup location change
  const handlePickupLocationChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedLocations = [...prev.pickupLocations]
      updatedLocations[index] = { ...updatedLocations[index], [field]: value }
      return {
        ...prev,
        pickupLocations: updatedLocations,
      }
    })
  }

  // Add pickup location
  const addPickupLocation = () => {
    setFormData((prev) => ({
      ...prev,
      pickupLocations: [
        ...prev.pickupLocations,
        {
          location: '',
          address: '',
          contactPerson: '',
          contactNumber: '',
          operatingHours: '',
          scheduledTime: '',
          notes: '',
        },
      ],
    }))
  }

  // Remove pickup location
  const removePickupLocation = (index) => {
    setFormData((prev) => {
      const updatedLocations = [...prev.pickupLocations]
      updatedLocations.splice(index, 1)
      return {
        ...prev,
        pickupLocations:
          updatedLocations.length > 0
            ? updatedLocations
            : [
                {
                  location: '',
                  address: '',
                  contactPerson: '',
                  contactNumber: '',
                  operatingHours: '',
                  scheduledTime: '',
                  notes: '',
                },
              ],
      }
    })
  }

  // Handle dropoff location change
  const handleDropoffLocationChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedLocations = [...prev.dropoffLocations]
      updatedLocations[index] = { ...updatedLocations[index], [field]: value }
      return {
        ...prev,
        dropoffLocations: updatedLocations,
      }
    })
  }

  // Add dropoff location
  const addDropoffLocation = () => {
    setFormData((prev) => ({
      ...prev,
      dropoffLocations: [
        ...prev.dropoffLocations,
        {
          location: '',
          address: '',
          contactPerson: '',
          contactNumber: '',
          operatingHours: '',
          scheduledTime: '',
          notes: '',
        },
      ],
    }))
  }

  // Remove dropoff location
  const removeDropoffLocation = (index) => {
    setFormData((prev) => {
      const updatedLocations = [...prev.dropoffLocations]
      updatedLocations.splice(index, 1)
      return {
        ...prev,
        dropoffLocations:
          updatedLocations.length > 0
            ? updatedLocations
            : [
                {
                  location: '',
                  address: '',
                  contactPerson: '',
                  contactNumber: '',
                  operatingHours: '',
                  scheduledTime: '',
                  notes: '',
                },
              ],
      }
    })
  }

  // Handle stop points change
  const handleStopPointsChange = (stopPoints) => {
    setFormData((prev) => ({
      ...prev,
      stopPoints: stopPoints,
    }))
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    const tripData = {
      ...formData,
      route: `${formData.origin} to ${formData.destination}`,
      driver: formData.drivers[0]?.name || 'Unassigned',
      vehicle: formData.vehicles[0]?.name || 'Unassigned',
      vehicleAssignments: formData.vehicleAssignments,
      distance: calculateDistance(),
    }
    //  console.log('id :>> ', id)
    //  console.log('tripData :>> ', tripData)
    t_api.upsertTrip(id, tripData, tripsDispatch)
    onCancel()
  }

  // Calculate estimated distance
  const calculateDistance = () => {
    return 'Calculating...'
  }

  // Handle cancel
  const handleCancel = () => {
    onCancel()
  }

  const tabs = [
    { name: 'Trip Information', value: 'trip' },
    { name: 'Vehicle Information', value: 'vehicle' },
    { name: 'Location Information', value: 'location' },
    { name: 'Current Status', value: 'status' },
  ]

  const trip_information = [
    {
      htmlFor: 'id',
      label: 'ID',
      value: formData.id,
      required: false,
      readOnly: true,
    },
    {
      htmlFor: 'orderNumber',
      label: 'Order Number',
      value: formData.orderNumber,
      placeholder: 'Enter order number',
      required: true,
    },
    {
      htmlFor: 'rate',
      label: 'Rate',
      value: formData.rate,
      placeholder: 'Enter rate',
      type: 'number',
      required: true,
    },
    {
      type: 'select',
      htmlFor: 'costCentre',
      label: 'Cost Centre',
      placeholder: 'Select cost centre',
      value: formData.costCentre,
      required: true,
      options: costCentres?.map((cc) => {
        return { value: cc.id, label: cc.name }
      }),
    },

    {
      htmlFor: 'startDate',
      label: 'Start Date',
      type: 'date',
      value: formData.startDate,
      required: true,
    },
    {
      htmlFor: 'endDate',
      label: 'Expected End Date',
      type: 'date',
      value: formData.endDate,
      required: true,
    },
    {
      htmlFor: 'cargo',
      label: 'Cargo Description/Commodity',
      value: formData.cargo,
      placeholder: 'describe the cargo',
      required: true,
    },
    {
      htmlFor: 'cargoWeight',
      label: 'Cargo Weight',
      value: formData.cargoWeight,
      placeholder: 'e.g., 24 tons',
      type: 'number',
      required: true,
    },
  ]

  const client_information = [
    {
      htmlFor: 'clientName',
      label: 'Client Name',
      value: formData.clientDetails.name,
      field: 'name',
      placeholder: 'Enter client name',
      required: true,
    },
    {
      htmlFor: 'contactPerson',
      label: 'Client Contact Person',
      value: formData.clientDetails.contactPerson,
      field: 'contactPerson',
      placeholder: 'Enter contact Person',
      required: true,
    },
    {
      htmlFor: 'clientPhone',
      label: 'Client Phone Number',
      value: formData.clientDetails.phone,
      field: 'phone',
      placeholder: 'Enter phone number',
      required: true,
    },
    {
      htmlFor: 'clientEmail',
      label: 'Client Email',
      value: formData.clientDetails.email,
      field: 'email',
      placeholder: 'Enter email address',
      required: true,
    },
  ]
  // console.log('formData', formData.selectedClient)
  return (
    <div className=" h-full space-y-6">
      <div className="flex items-center gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {trip?.id ? `Edit Trip` : 'Add New Trip'}
          </h2>
          <p className="text-muted-foreground">
            {trip?.id ? trip.clientDetails.name : 'Enter Trip Details'}
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <Tabs
          defaultValue="trip"
          value={tabs[currentTab]?.value}
          onValueChange={(value) => {
            const index = tabs.findIndex((tab) => tab.value === value)
            setCurrentTab(index)
          }}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 w-full">
            {tabs.map((tab, index) => (
              <TabsTrigger
                key={index}
                tabIndex={currentTab}
                value={tab.value}
                onClick={() => {
                  setCurrentTab(index)
                }}
              >
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="trip" className="space-y-6">
            <DetailCard
              title={'Client Information'}
              description={'Select or enter client information'}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="selectedClient">
                    Select Client (Optional)
                  </Label>
                  <Select
                    value={formData.selectedClient}
                    onValueChange={handleClientChange}
                  >
                    <SelectTrigger
                      id="selectedClient"
                      className="w-full border-[#d3d3d3]"
                    >
                      <SelectValue placeholder="Select existing client or leave blank for new client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">
                        New Client (Manual Entry)
                      </SelectItem>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.name}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {client_information.map((client) => {
                  return (
                    <div key={client.htmlFor} className="space-y-2">
                      <Label htmlFor={client.htmlFor}>{client.label}</Label>
                      <Input
                        id={client.htmlFor}
                        value={client.value}
                        onChange={(e) =>
                          handleClientDetailsChange(
                            client.field,
                            e.target.value
                          )
                        }
                        placeholder={client.placeholder}
                        disabled={!!formData.selectedClient}
                        className={!!formData.selectedClient && 'bg-muted'}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="clientAddress">Address</Label>
                <Textarea
                  id="clientAddress"
                  value={formData.clientDetails.address}
                  onChange={(e) =>
                    handleClientDetailsChange('address', e.target.value)
                  }
                  placeholder="Enter client address"
                  rows={3}
                  disabled={!!formData.selectedClient}
                  className="w-full border-[#d3d3d3]"
                />
              </div>

              <Separator className="my-4 space-y-1" />

              <div className="mb-6 space-y-1">
                <CardTitle>Trip Information</CardTitle>
                <CardDescription>Enter details for this trip</CardDescription>
              </div>

              <DynamicInput
                inputs={trip_information}
                handleSelectChange={handleSelectChange}
                handleChange={handleChange}
              />

              <div className="space-y-2 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Trip Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional information about this trip"
                    rows={4}
                    className="w-full border-[#d3d3d3]"
                  />
                </div>
              </div>
            </DetailCard>
          </TabsContent>

          <TabsContent value="vehicle" className="space-y-6">
            <DriversVehiclesSection
              formData={formData}
              handleDriverChange={handleDriverChange}
              addDriver={addDriver}
              removeDriver={removeDriver}
              handleVehicleChange={handleVehicleChange}
              addVehicle={addVehicle}
              removeVehicle={removeVehicle}
              drivers={drivers}
              vehicles={vehicles}
              handleVehicleDriverChange={handleVehicleDriverChange}
              addVehicleDriver={addVehicleDriver}
              removeVehicleDriver={removeVehicleDriver}
              handleVehicleTrailerChange={handleVehicleTrailerChange}
              addVehicleTrailer={addVehicleTrailer}
              removeVehicleTrailer={removeVehicleTrailer}
            />
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            <LocationsSection
              formData={formData}
              handlePickupLocationChange={handlePickupLocationChange}
              addPickupLocation={addPickupLocation}
              removePickupLocation={removePickupLocation}
              handleDropoffLocationChange={handleDropoffLocationChange}
              addDropoffLocation={addDropoffLocation}
              removeDropoffLocation={removeDropoffLocation}
              handleStopPointChange={handleStopPointsChange}
              clients={clients}
            />
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <DetailCard
              title="Trip Status"
              description="Update the current status of this trip"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleSelectChange('status', value)
                    }
                  >
                    <SelectTrigger
                      id="status"
                      className="w-full border-[#d3d3d3]"
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Optionally, show last updated and updated by if you have those fields */}
                {/* <div>
        <Label>Last Updated</Label>
        <div>{formData.statusLastUpdated || '-'}</div>
      </div>
      <div>
        <Label>Updated By</Label>
        <div>{formData.statusUpdatedBy || '-'}</div>
      </div> */}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="statusNotes">Status Notes</Label>
                  <Textarea
                    id="statusNotes"
                    name="statusNotes"
                    value={formData.statusNotes || ''}
                    onChange={handleChange}
                    placeholder="Add any notes about the status change"
                    rows={3}
                  />
                </div>
              </div>
            </DetailCard>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className=" flex justify-between gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            //onClick={handleSubmit}
          >
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Saving Trip...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Trip
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default TripForm

// Handle waypoint details change
// const handleWaypointDetailsChange = (stopPointId, field, value) => {
//   setFormData((prev) => ({
//     ...prev,
//     waypoints: prev.waypoints.map((waypoint) =>
//       waypoint.id === stopPointId ? { ...waypoint, [field]: value } : waypoint
//     ),
//   }))
// }

// const client_select_options = () => {
//   let options = [{ value: 'new', label: 'New Client (Manual Entry)' }]
//   clients?.map((c) => {
//     options.push({ value: c.id, label: c.name })
//   })
//   return options
// }

/* <TabsContent value="waypoints" className="space-y-6">
            <WaypointsSection
              formData={formData}
              handleStopPointSelection={handleStopPointSelection}
              handleWaypointDetailsChange={handleWaypointDetailsChange}
              stopPoints={stopPoints}
            />
          </TabsContent> */
