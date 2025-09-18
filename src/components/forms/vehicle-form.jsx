'use client'

// react
import { useEffect, useState } from 'react'

// components
import { Button } from '@/components/ui/button'
import { CardDescription, CardTitle } from '@/components/ui/card'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

// icons
import {
  Save,
  Truck,
  CheckCircle,
  Wrench,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

// context
import { useGlobalContext } from '@/context/global-context'
import DetailCard from '../ui/detail-card'
import { Separator } from '../ui/separator'
import DynamicInput from '../ui/dynamic-input'

const VehiclesForm = ({ onCancel, id }) => {
  const {
    vehicles: { data: vehicles },
    branches: { data: branches },
    drivers: { data: drivers },
    vehiclesDispatch,
    upsertVehicle,
  } = useGlobalContext()

  const vehicle = vehicles?.find((v) => v.id === id)
  const trailers = vehicles?.filter((v) => v.type === 'Trailer')

  const [formData, setFormData] = useState({
    id: vehicle?.id || '',
    type: vehicle?.type || '',
    reg_number: vehicle?.reg_number || '',
    license_plate: vehicle?.license_plate || '',
    vin: vehicle?.vin || '',
    engine_number: vehicle?.engine_number || '',
    vehicle_category: vehicle?.vehicle_category || '',
    model: vehicle?.model || '',
    series_name: vehicle?.series_name || '',
    vehicle_description: vehicle?.vehicle_description || '',
    tare: vehicle?.tare || '',
    registration_date:
      vehicle?.registration_date || new Date().getFullYear().toString(),

    capacity: vehicle?.capacity || '',
    fuel_type: vehicle?.fuel_type || 'Diesel',
    status: vehicle?.status || 'available',
    width: vehicle?.width || '',
    height: vehicle?.height || '',
    length: vehicle?.length || '',
    transmission: vehicle?.transmission || 'manual',
    branch_id: vehicles?.branch_id || '',
    // branch_name: vehicle?.branch_name || '',
    // purchase_date: vehicle?.purchase_date || '',
    priority: vehicle?.priority || '',

    licence_expiry_date: vehicle?.licence_expiry_date || '',
    // last_service: vehicle?.last_service || '',
    service_intervals_km: vehicle?.service_intervals_km || '',
    service_intervals_months: vehicle?.service_intervals_months || 6,

    manufacturer: vehicle?.manufacturer || '',
    year: vehicle?.year || new Date().getFullYear().toString(),
    color: vehicle?.color || '',
    // insurance_expiry: vehicle?.insurance_expiry || '',

    odometer: vehicle?.odometer || '',
    // fuel_efficiency: vehicle?.fuelEfficiency || '',
    dimensions: vehicle?.dimensions || '',
    max_speed: vehicle?.max_speed || '',
    current_driver: vehicle?.current_driver || null,
    assigned_to: vehicle?.assigned_to || null,
    // current_trip_id: vehicle?.current_trip_id || null,
    // last_trip_id: vehicle?.last_trip_id || null,

    tracker_provider: vehicle?.tracker_provider || '',
    tracker_device_id: vehicle?.tracker_device_id || '',
    // created_at: null,
    // updated_at: null,
    purchase_price: vehicle?.purchase_price || '',
    retail_price: vehicle?.retail_price || 0,
    service_provider: vehicle?.service_provider || '',
    fleet_number: vehicle?.fleet_number || '',
  })

  const [currentTab, setCurrentTab] = useState(0)

  const nextStep = () => {
    if (currentTab < 2) {
      const next = currentTab + 1
      setCurrentTab(next)
    }
  }

  const prevStep = () => {
    if (currentTab > 0) {
      const prev = currentTab - 1
      setCurrentTab(prev)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // console.log('formData :>> ', formData)
    upsertVehicle(id, formData, vehiclesDispatch)
    onCancel()
  }

  // useEffect(() => {
  //   const current_branch = branches.filter((b) => b.id == formData.branch_id)
  //   console.log('current_branch :>> ', current_branch[0]?.name)
  //   setFormData({ ...formData, branch_name: current_branch[0]?.name })
  // }, [formData.branch_id])

  const tabs = [
    { name: 'Licence Information', value: '0' },
    { name: 'Additional Details', value: '1' },
    { name: 'Current Status', value: '2' },
  ]

  const licence_inputs = [
    {
      htmlFor: 'fleet_number',
      label: 'Fleet Number',
      value: formData.fleet_number,
      required: false,
      readOnly: true,
    },
    {
      type: 'select',
      htmlFor: 'type',
      label: 'Type *',
      placeholder: 'Select type',
      value: formData.type,
      required: true,
      readOnly: false,
      options: [
        { value: 'ad-hoc truck', label: 'AD-HOC Truck' },
        { value: 'bakkie', label: 'Bakkie' },
        { value: 'horse', label: 'Horse' },
        { value: 'rigid', label: 'Rigid' },
        // { value: 'Vehicle', label: 'Vehicle' },
        { value: 'Trailer', label: 'Trailer' },
      ],
    },
    {
      htmlFor: 'regNumber',
      label: 'Registration Number *',
      value: formData.reg_number,
      placeholder: 'e.g., CA 123-456',
      required: true,
      readOnly: false,
    },
    {
      htmlFor: 'licensePlate',
      label: 'License Number *',
      value: formData.license_plate,
      placeholder: 'e.g., CA123456',
      required: true,
      readOnly: false,
    },
    {
      htmlFor: 'vin',
      label: 'VIN Number *',
      value: formData.vin,
      placeholder: 'e.g., 1HGBH41JXMN109186',
      required: true,
      readOnly: false,
    },
    {
      htmlFor: 'engineNumber',
      label: 'Engine Number *',
      value: formData.engine_number,
      placeholder: 'e.g., ABC123456789',
      required: true,
      readOnly: false,
    },
    {
      htmlFor: 'model',
      label: 'Make *',
      value: formData.model,
      placeholder: 'e.g., Toyota',
      required: true,
      readOnly: false,
    },
    {
      htmlFor: 'manufacturer',
      label: 'Model/Manufacturer *',
      value: formData.manufacturer,
      placeholder: 'e.g., Hilux',
      required: true,
      readOnly: false,
    },
    {
      htmlFor: 'seriesName',
      label: 'Series Name *',
      value: formData.series_name,
      placeholder: 'e.g., SR5',
      required: true,
      readOnly: false,
    },
    {
      htmlFor: 'vehicleCategory',
      label: 'Vehicle Category *',
      value: formData.vehicle_category,
      placeholder: 'e.g., Light Commercial',
      required: true,
      readOnly: false,
    },
    {
      htmlFor: 'vehicleDescription',
      label: 'Vehicle Description *',
      value: formData.vehicle_description,
      placeholder: 'e.g., Double cab bakkie',
      required: true,
      readOnly: false,
    },
    {
      htmlFor: 'tare',
      label: 'Tare *',
      value: formData.tare,
      placeholder: 'e.g., 1850 kg',
      required: true,
      readOnly: false,
    },

    {
      htmlFor: 'year',
      label: 'Manufacture Date *',
      type: 'date',
      value: formData.year,
      placeholder: 'Select manufacture date',
      required: true,
      readOnly: false,
    },
    {
      htmlFor: 'registrationDate',
      label: 'Registration Date *',
      type: 'date',
      value: formData.registration_date,
      placeholder: 'Select registration date',
      required: true,
      readOnly: false,
    },
  ]

  const additional_information = [
    {
      type: 'select',
      htmlFor: 'branch_id',
      label: 'Branch *',
      placeholder: 'Select a branch',
      value: formData.branch_id,
      required: true,

      options: branches?.map((b) => {
        return { value: b.id, label: b.name }
      }),
    },
    {
      htmlFor: 'capacity',
      label: 'Payload (kg) *',
      value: formData.capacity,
      placeholder: "Capacity in Kg's",
      required: true,
      readOnly: false,
    },
    {
      htmlFor: 'color',
      label: 'Color *',
      value: formData.color,
      placeholder: 'e.g., White',
      required: true,
      readOnly: false,
    },
    {
      type: 'select',
      htmlFor: 'fuelType',
      label: 'Fuel Type *',
      placeholder: 'Select fuel type',
      value: formData.fuel_type,
      required: true,
      readOnly: false,
      options: [
        { value: 'Diesel', label: 'Diesel' },
        { value: 'Petrol', label: 'Petrol' },
        { value: 'Electric', label: 'Electric' },
        { value: 'Hybrid', label: 'Hybrid' },
      ],
    },

    // {
    //   htmlFor: 'capacity',
    //   label: 'Fuel Tank Size *',
    //   value: formData.capacity,
    //   placeholder: 'e.g., 80L',
    //   required: true,
    // },
    {
      htmlFor: 'transmission',
      label: 'Transmission *',
      placeholder: 'Select transmission type',
      value: formData.transmission,
      type: 'select',
      required: true,
      options: [
        { value: 'Manual', label: 'Manual' },
        { value: 'Automatic', label: 'Automatic' },
      ],
    },
    {
      htmlFor: 'length',
      label: 'Length *',
      value: formData.length,
      placeholder: 'e.g., 5.2m',
      required: true,
    },
    {
      htmlFor: 'height',
      label: 'Height *',
      value: formData.height,
      placeholder: 'e.g., 2.1m',
      required: true,
    },
    {
      htmlFor: 'width',
      label: 'Width *',
      value: formData.width,
      placeholder: 'e.g., 1.8m',
      required: true,
    },
    {
      htmlFor: 'odometer',
      label: 'Odometer Reading *',
      value: formData.odometer,
      placeholder: 'e.g., 125,000 km',
      required: true,
    },
    {
      htmlFor: 'priority',
      label: 'Vehicle Priority',
      value: formData.priority,
      placeholder: 'e.g., High, Medium, Low',
      required: false,
    },
  ]

  const maintenance_information = [
    {
      htmlFor: 'licenceExpiryDate',
      label: 'Licence Expiry Date *',
      type: 'date',
      value: formData.licence_expiry_date,
      placeholder: 'Select expiry date',
      required: true,
      readOnly: false,
    },
    // {
    //   htmlFor: 'lastService',
    //   label: 'Last Service Date',
    //   value: formData.last_service,
    //   type: 'date',
    //   placeholder: 'Select last service date',
    //   required: false,
    // },
    // {
    //   htmlFor: 'serviceIntervalsKM',
    //   label: 'Service Intervals (KM)',
    //   value: formData.service_intervals_KM,
    //   type: 'number',
    //   placeholder: 'e.g., 15000',
    //   required: false,
    // },
    {
      htmlFor: 'serviceIntervalsMonths',
      label: 'Service Intervals (Months)',
      value: formData.service_intervals_months,
      type: 'number',
      placeholder: 'e.g., 12',
      required: false,
    },
  ]

  const tracker_information = [
    {
      htmlFor: 'trackerProvider',
      label: 'Tracker Provider',
      value: formData.tracker_provider,
      placeholder: 'e.g., Tracker SA',
      required: true,
    },
    {
      htmlFor: 'trackerDeviceId',
      label: 'Tracker Device ID',
      value: formData.tracker_device_id,
      placeholder: 'e.g., 1234567890',
      required: true,
    },
  ]

  const current_status = [
    {
      type: 'select',
      htmlFor: 'current_driver',
      label: 'Current Driver',
      placeholder: 'Select a Driver',
      value: formData.current_driver,
      // required: true,

      options: drivers?.map((d) => {
        return { value: d.id, label: d.name }
      }),

      readOnly: vehicle?.type == 'Trailer' ? true : false,
    },
    {
      type: vehicle?.type == 'Trailer' ? null : 'select',
      htmlFor: 'assigned_to',
      label: vehicle?.type == 'Trailer' ? 'Linked Horse' : 'Linked Trailer',
      value: formData.assigned_to,

      options: trailers?.map((t) => {
        return { value: t.id, label: t.license_plate }
      }),

      readOnly: vehicle?.type == 'Trailer' ? true : false,
    },
    // {
    //   htmlFor: 'currentTripId',
    //   label: 'Current Trip ID',
    //   value: formData.current_trip_id || 'None',
    //   readOnly: true,
    // },
    // {
    //   htmlFor: 'lastTripId',
    //   label: 'Last Trip ID',
    //   value: formData.last_trip_id || 'None',
    //   readOnly: true,
    // },
    {
      htmlFor: 'status',
      label: 'Current Status',
      placeholder: 'Select current status',
      value: formData.status,
      type: 'select',
      required: false,
      options: [
        { value: 'available', label: 'Available' },
        { value: 'assigned', label: 'Assigned' },
        { value: 'on-trip', label: 'On A Trip' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  ]

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4  grid-cols-1">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-lg text-[#003e69]  font-bold tracking-tight uppercase">
              {vehicle?.id ? `Edit Vehicle` : 'Add New Vehicle'}
            </h2>
            <p className="text-[#428bca]">
              {vehicle?.id
                ? `${vehicle.model} • ${vehicle.type} • ${vehicle.license_plate}`
                : 'Enter vehicle details'}
            </p>
          </div>
        </div>

        <Tabs
          value={tabs[currentTab]?.value}
          onValueChange={(value) => {
            const index = tabs.findIndex((tab) => tab.value === value)
            setCurrentTab(index)
          }}
          className="w-full"
        >
          <TabsList className={`grid w-full grid-cols-${tabs.length} gap-6`}>
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
          <TabsContent value={tabs[0].value} className="space-y-4">
            <DetailCard
              title={'Vehicle Information'}
              description={'Basic information about this vehicle'}
            >
              <DynamicInput
                inputs={licence_inputs}
                handleSelectChange={handleSelectChange}
                handleChange={handleChange}
              />
            </DetailCard>
          </TabsContent>

          <TabsContent value={tabs[1].value} className="space-y-4">
            <DetailCard
              title={'Additional Information'}
              description={'Technical specifications and documentation'}
            >
              <DynamicInput
                inputs={additional_information}
                handleSelectChange={handleSelectChange}
                handleChange={handleChange}
              />

              <Separator className="my-4 space-y-1" />

              <div className="mb-6">
                <CardTitle>Maintenance Information</CardTitle>
                <CardDescription>
                  Service information about the vehicle
                </CardDescription>
              </div>

              <DynamicInput
                inputs={maintenance_information}
                handleSelectChange={handleSelectChange}
                handleChange={handleChange}
              />

              <Separator className="my-4 space-y-1" />
              <div className="mb-6">
                <CardTitle>Vehicle Tracking information</CardTitle>
                <CardDescription>
                  Tracker information for the vehicle
                </CardDescription>
              </div>

              <DynamicInput
                inputs={tracker_information}
                handleSelectChange={handleSelectChange}
                handleChange={handleChange}
              />
            </DetailCard>
          </TabsContent>

          <TabsContent value={tabs[2].value} className="space-y-4">
            <DetailCard
              title={'Current Status'}
              description={'Current operational status and assignments'}
            >
              <DynamicInput
                inputs={current_status}
                handleSelectChange={handleSelectChange}
                handleChange={handleChange}
              />
            </DetailCard>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-2 ">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              className={currentTab == 0 ? 'shadow-none' : 'shadow'}
              disabled={currentTab == 0}
              onClick={prevStep}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              type="button"
              className={currentTab == 2 ? 'shadow-none' : 'shadow'}
              disabled={currentTab == 2}
              onClick={nextStep}
            >
              <ChevronRight />
            </Button>
          </div>
          <Button
            type="submit"
            disabled={currentTab !== 2}
            className={'bg-[#003e69] hover:bg-[#428bca]'}
          >
            <Save className="mr-2 h-4 w-4" /> Save Vehicle
          </Button>
        </div>
      </div>
    </form>
  )
}

export default VehiclesForm
