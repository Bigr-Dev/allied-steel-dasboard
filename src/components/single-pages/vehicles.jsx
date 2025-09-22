'use client'

// react
import React from 'react'

//components
import { Badge } from '../ui/badge'

// icons
import { AlertTriangle, CheckCircle, Truck, Wrench } from 'lucide-react'

// context
import { useGlobalContext } from '@/context/global-context'
import DetailActionBar from '../layout/detail-action-bar'
import DetailCard from '../ui/detail-card'
import { Separator } from '../ui/separator'

const getStatusBadge = (status) => {
  switch (status) {
    case 'available':
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
        >
          <CheckCircle className="h-3 w-3 mr-1" /> Available
        </Badge>
      )
    case 'in-use':
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600">
          <Truck className="h-3 w-3 mr-1" /> In Use
        </Badge>
      )
    case 'maintenance':
      return (
        <Badge
          variant="outline"
          className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800"
        >
          <Wrench className="h-3 w-3 mr-1" /> Maintenance
        </Badge>
      )
    case 'inactive':
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" /> Inactive
        </Badge>
      )
    default:
      return <Badge>{status}</Badge>
  }
}

const VehicleSinglePage = ({ id }) => {
  const {
    vehicles,
    drivers: { data: drivers },
  } = useGlobalContext()
  const vehicle = vehicles?.data?.find((v) => v.id === id)

  //console.log('vehicle :>> ', vehicle)

  //   {
  //     "id": "1ed16c61-bc2a-4b43-8f5b-ca82b9ec964a",
  //     "type": "Del Vehicle",
  //     "reg_number": "BSC877X",
  //     "license_plate": "JX05JXGP",
  //     "vin": "ABJ96441660429852",
  //     "engine_number": "460972U1054435",
  //     "vehicle_category": "Heavy load Vehicle Self-propelled",
  //     "model": "ACTROS 3345",
  //     "series_name": null,
  //     "vehicle_description": null,
  //     "tare": "9431",
  //     "registration_date": "2021-02-01",
  //     "capacity": "157416",
  //     "fuel_type": "Diesel",
  //     "status": null,
  //     "width": "2,55",
  //     "height": null,
  //     "length": "13,2 ",
  //     "transmission": null,
  //     "branch_id": "dd6bc80f-d3ef-408d-9992-ee0da9b04355",
  //     "purchase_date": null,
  //     "priority": null,
  //     "licence_expiry_date": "2025-12-31",
  //     "last_service": null,
  //     "service_intervals_km": "50000",
  //     "service_intervals_months": null,
  //     "manufacturer": "Mercedes-Benz",
  //     "year": "3/19/2012",
  //     "color": "White",
  //     "insurance_expiry": null,
  //     "odometer": null,
  //     "fuel_efficiency": null,
  //     "dimensions": null,
  //     "max_speed": null,
  //     "current_driver": null,
  //     "assigned_to": null,
  //     "current_trip_id": null,
  //     "last_trip_id": null,
  //     "tracker_provider": null,
  //     "tracker_device_id": null,
  //     "created_at": null,
  //     "updated_at": null,
  //     "purchase_price": 1703203,
  //     "retail_price": null,
  //     "service_provider": "Mercserv",
  //     "fleet_number": "AS49 ",
  //     "branch_name": "Allied Steelrode (Pty) Ltd Head Office"
  // }

  const vehicle_information = [
    { label: 'Type', value: vehicle?.type },
    { label: 'Make', value: vehicle?.model },
    { label: 'Model', value: vehicle?.manufacturer },
    { label: 'Registration Number', value: vehicle?.reg_number },
    { label: 'License Plate', value: vehicle?.license_plate || 'N/A' },
    { label: 'VIN', value: vehicle?.vin || 'N/A' },
    { label: 'Engine Number', value: vehicle?.engine_number || 'N/A' },
    { label: 'Series', value: vehicle?.series_name || 'N/A' },
    { label: 'Category', value: vehicle?.vehicle_category || 'N/A' },
    { label: 'Year', value: vehicle?.year || 'N/A' },
    { label: 'Color', value: vehicle?.color || 'N/A' },
    { label: 'Capacity (kg)', value: vehicle?.capacity || 'N/A' },
    { label: 'Fuel Type', value: vehicle?.fuel_type || 'N/A' },
    { label: 'Transmission', value: vehicle?.transmission || 'N/A' },
    { label: 'Status', value: getStatusBadge(vehicle?.status) },
    {
      label: 'Cost Centre',
      value: vehicle?.branch_name || 'N/A',
    },
  ]

  const vehicle_status = [
    {
      label: 'Current Driver',
      value: drivers?.filter((d) => d.id == vehicle?.current_driver)?.[0]?.name,
    },
    {
      label: 'assigned to',
      value: vehicles?.data?.filter((v) => v.id == vehicle?.assigned_to)?.[0]
        ?.fleet_number,
    },
    // { label: '', value: '' },
    // { label: '', value: '' },
  ]

  return (
    <div className="space-y-6">
      <DetailActionBar
        id={id}
        title={`${vehicle?.license_plate}`}
        description={`${vehicle?.type || ''} - ${
          vehicle?.manufacturer || ''
        } - ${vehicle?.model || ''}`}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <DetailCard
          title={'Vehicle Information'}
          description={'Detailed information about this vehicle'}
        >
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {vehicle_information.map((info) => (
              <div key={info.label}>
                <dt className="text-sm font-medium text-gray-500">
                  {info.label}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{info.value}</dd>
              </div>
            ))}
          </dl>
        </DetailCard>

        <DetailCard
          title={'Current Status'}
          description={'Current operational status and metrics'}
        >
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {vehicle_status.map((info) => (
              <div key={info.label}>
                <dt className="text-sm font-medium text-gray-500">
                  {info.label}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{info.value}</dd>
              </div>
            ))}
          </dl>

          <Separator className={'my-4'} />
        </DetailCard>
      </div>
    </div>
  )
}

export default VehicleSinglePage
