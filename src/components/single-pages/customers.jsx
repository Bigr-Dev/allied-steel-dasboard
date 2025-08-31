'use client'

// react
import { useEffect, useState } from 'react'

// components
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  createCheckboxColumn,
  createSortableHeader,
  DataTable,
  createActionsColumn,
} from '../ui/data-table'
import DetailActionBar from '@/components/layout/detail-action-bar'
import Loading from '@/components/ui/loading'
import DetailCard from '@/components/ui/detail-card'

// icons
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  User,
  Truck,
  Newspaper,
  MapPinPlusInside,
} from 'lucide-react'

// context

import { Separator } from '../ui/separator'

import DisplayMap from '../map/display-map'
import { useGlobalContext } from '@/context/global-context'

export default function CustomersPage({ id }) {
  const {
    trips,
    onEdit,
    onDelete,
    customers: { data },
    loads: { data: loads_data },
  } = useGlobalContext()

  //  console.log('data :>> ', loads_data)

  const [coords, setCoords] = useState(null)

  //  fetch based on ID
  const client = data?.find((c) => c.id === id) || {
    id: 'Not Found',
    name: 'Client Not Found',
    location: 'Unknown',
    manager: 'Unknown',
    users: 0,
    vehicles: 0,
    activeTrips: 0,
  }

  const clientTrips =
    trips?.data?.filter((trip) => trip?.clientDetails?.name === client.name) ||
    []

  const [invoices] = useState([
    {
      id: 'INV-001',
      date: '2024-01-01',
      amount: 5500,
      status: 'Paid',
      dueDate: '2024-01-31',
      trips: ['TRP-001', 'TRP-002'],
    },
    {
      id: 'INV-002',
      date: '2024-01-15',
      amount: 3200,
      status: 'Pending',
      dueDate: '2024-02-14',
      trips: ['TRP-003', 'TRP-004'],
    },
  ])

  const tripColumns = [
    createCheckboxColumn(),
    {
      accessorKey: 'id',
      header: createSortableHeader('Trip ID'),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('id')}</div>
      ),
    },
    {
      accessorKey: 'pickupLocation',
      header: createSortableHeader('Route'),
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">
            {row.getValue('pickupLocation')}
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <MapPin className="h-3 w-3 mr-1" />
            {row.original.dropoffLocation}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'driver',
      header: createSortableHeader('Driver'),
    },
    {
      accessorKey: 'vehicle',
      header: 'Vehicle',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status')
        return (
          <Badge
            variant={
              status === 'Completed'
                ? 'default'
                : status === 'In Progress'
                ? 'secondary'
                : status === 'Scheduled'
                ? 'outline'
                : 'destructive'
            }
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'cost',
      header: createSortableHeader('Cost'),
      cell: ({ row }) => (
        <div className="font-medium">
          R{row.getValue('cost')?.toLocaleString() || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'date',
      header: createSortableHeader('Date'),
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.getValue('date')).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const trip = row.original

        return createActionsColumn({ data: trip, onEdit, onDelete })
      },
    },
  ]

  const invoiceColumns = [
    {
      accessorKey: 'id',
      header: createSortableHeader('Invoice ID'),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('id')}</div>
      ),
    },
    {
      accessorKey: 'date',
      header: createSortableHeader('Date'),
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.getValue('date')).toLocaleDateString()}
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: createSortableHeader('Amount'),
      cell: ({ row }) => (
        <div className="font-medium">
          R{row.getValue('amount')?.toLocaleString() || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={row.getValue('status') === 'Paid' ? 'default' : 'secondary'}
        >
          {row.getValue('status')}
        </Badge>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: createSortableHeader('Due Date'),
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.getValue('dueDate')).toLocaleDateString()}
        </div>
      ),
    },
  ]

  let map_locations = client?.pickupLocations?.map((location) => {
    return location.address
  })

  const client_information = [
    {
      label: 'BP Code',
      value: client.bp_code || 'N/A',
    },
    {
      label: 'Name',
      value: client.customer_name || 'N/A',
    },
    {
      label: 'Contact Person',
      value: client.contact_person || 'N/A',
    },
    {
      label: 'Email',
      value: client.email || 'N/A',
    },
    {
      label: 'Phone',
      value: client.phone || 'N/A',
    },
    {
      label: 'Address',
      value: client.address_name || 'N/A',
    },
    { label: 'Country', value: client.country || 'N/A' },
    {
      label: 'Zone',
      value: client.zone || 'N/A',
    },
    // {
    //   label: 'Status',
    //   value: (
    //     <Badge variant={client.status === 'Active' ? 'default' : 'secondary'}>
    //       {client.status}
    //     </Badge>
    //   ),
    // },
  ]

  return (
    <div>
      {data ? (
        <div className="space-y-6">
          <DetailActionBar id={id} title={client?.customer_name} />

          <div className="grid gap-6 md:grid-cols-2">
            {/* Client Information */}
            <DetailCard
              title={`Client Information`}
              description={'Detailed information about this client'}
            >
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {client_information.map((info) => (
                  <div key={info.label}>
                    <dt className="text-sm font-medium text-gray-500">
                      {info.label}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{info.value}</dd>
                  </div>
                ))}
              </dl>

              <Separator className="my-4" />

              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Vehicle requirements
                </h4>
                <p className="mt-1 text-sm text-gray-900">
                  {client?.vehicle_requirements || 'No notes available.'}
                </p>
              </div>
              <Separator className="my-4" />
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Dispatch Remarks
                </h4>
                <p className="mt-1 text-sm text-gray-900">
                  {client?.dispatch_remarks || 'No notes available.'}
                </p>
              </div>
            </DetailCard>

            {/* Client Overview */}
            <DetailCard
              title={`Client Overview`}
              description={'Overview of trips associated with this client'}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col items-center justify-center rounded-lg bg-blue-50 p-4 dark:bg-blue-900">
                  <Truck className="h-8 w-8 text-blue-500 dark:text-blue-300" />
                  <h3 className="mt-2 text-xl font-bold">
                    {clientTrips?.length || 0}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Active Trips
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-orange-50 p-4 dark:bg-orange-900">
                  <MapPinPlusInside className="h-8 w-8 text-orange-500 dark:text-orange-300" />

                  <h3 className="mt-2 text-xl font-bold">
                    {(client.pickupLocations?.length || 0) +
                      (client.dropoffLocations?.length || 0) || 0}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    locations
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-green-50 p-4 dark:bg-green-900">
                  <Newspaper className="h-8 w-8 text-green-500 dark:text-green-300" />

                  <h3 className="mt-2 text-xl font-bold">
                    {client?.invoices?.length || 0}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Invoices
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="mt-6">
                <label className="text-sm font-medium text-gray-500">
                  Cost Centre location
                </label>
                <div className="mt-2 h-[200px] rounded-lg bg-gray-100 flex items-center justify-center">
                  <DisplayMap
                    coords={client.coords}
                    street={client.street}
                    city={client.city}
                    state={client.state}
                    country={client.country}
                  />
                </div>
              </div>
            </DetailCard>
          </div>
        </div>
      ) : (
        <Loading />
      )}
    </div>
  )
}
