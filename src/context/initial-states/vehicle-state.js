// icons
import { Plus, Truck, CheckCircle, Wrench } from 'lucide-react'

// components
import {
  createActionsColumn,
  createCheckboxColumn,
  createSortableHeader,
} from '@/components/ui/data-table'

// hooks
import { getVehicleStatusBadge } from '@/hooks/use-badges'

const titleSection = {
  title: 'Vehicles',
  description: 'Manage your fleet vehicles',
  button: {
    text: 'Add Vehicle',
    icon: <Plus className="mr-2 h-4 w-4" />,
  },
}

const screenStats = [
  {
    title: 'Total Vehicles',
    value: 0,
    icon: <Truck className="h-4 w-4 text-gray-500" />,
  },
  {
    title: 'Available',
    value: 0,
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
  },
  {
    title: 'In Use',
    value: 0,
    icon: <Truck className="h-4 w-4 text-blue-500" />,
  },
  {
    title: 'In Maintenance',
    value: 0,
    icon: <Wrench className="h-4 w-4 text-amber-500" />,
  },
]

const tableInfo = {
  tabs: [
    {
      value: 'all',
      title: 'Vehicles and Trailers',
      filterColumn: 'model',
      filterPlaceholder: 'Search vehicles...',
    },
    {
      value: 'vehicle',
      title: 'Horses',
      filterColumn: 'horse',
      filterBy: 'horse',
      filterPlaceholder: 'Search horses...',
    },
    {
      value: 'rigid',
      title: "Rigid's",
      filterColumn: 'rigid',
      filterBy: 'rigid',
      filterPlaceholder: "Search rigid's...",
    },
    {
      value: 'Trailer',
      title: 'Trailers',
      filterColumn: 'Trailer',
      filterBy: 'Trailer',
      filterPlaceholder: 'Search trailers...',
    },
  ],
}

const columns = ({ onEdit, onDelete }) => {
  return [
    createCheckboxColumn(),
    {
      accessorKey: 'fleet_number',
      header: createSortableHeader('Fleet Number'),
      // cell: ({ row }) => (
      //   <div className="font-medium">{row.getValue('fleet_number')}</div>
      // ),
    },
    {
      accessorKey: 'license_plate',
      header: createSortableHeader('License Plate'),
      // cell: ({ row }) => (
      //   <div className="font-medium">{row.getValue('fleet_number')}</div>
      // ),
    },
    {
      accessorKey: 'type',
      header: createSortableHeader('Type'),
    },
    {
      accessorKey: 'current_driver',
      header: createSortableHeader('Driver'),
      // cell: ({ row }) => (
      //   <div>
      //     <div className="font-medium">{row.getValue('model')}</div>
      //     <div className="text-sm text-gray-500">
      //       {row.original.manufacturer}
      //     </div>
      //   </div>
      // ),
    },
    {
      accessorKey: 'assigned_to',
      header: createSortableHeader('Horse/Trailer'),
      // cell: ({ row }) => (
      //   <div>
      //     <div className="font-medium">{row.getValue('regNumber')}</div>
      //     <div className="text-sm text-gray-500">
      //       {row.original.licensePlate}
      //     </div>
      //   </div>
      // ),
    },
    {
      accessorKey: 'capacity',
      header: createSortableHeader('Capacity'),
      cell: ({ row }) => (
        <div>
          <div>{row.original.capacity} Kg</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: createSortableHeader('Status'),
      cell: ({ row }) => getVehicleStatusBadge(row.getValue('status')),
    },
    {
      accessorKey: 'branch_name',
      header: createSortableHeader('Branch'),
      cell: ({ row }) => (
        <div className="">
          {row.getValue('branch_name')?.includes('Head Office')
            ? 'Alrode'
            : 'ASSM'}
        </div>
      ),
    },
    {
      accessorKey: 'licence_expiry_date',
      header: createSortableHeader('License Expiry'),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const vehicle = row.original

        return createActionsColumn({ data: vehicle, onEdit, onDelete })
      },
    },
  ]
}
const data = []

const headers = [
  'ID',
  'Type',
  'Model',
  'License Plate',
  'Tare (Kg)',
  'Status',
  'Cost Centre',
  'License Expiry',
]

const rows = (data) => {
  return data.map((item) => [
    item.id || '',
    item.type || '',
    item.model || '',
    item.licensePlate || '',
    item.tare != null ? `${item.tare} Kg` : '',
    item.status || '',
    item.costCentre || '',
    item.licenceExpiryDate || '',
  ])
}

export const initialVehiclesState = {
  csv_headers: headers,
  csv_rows: rows,
  titleSection,
  screenStats,
  tableInfo,
  columns: columns,
  data,
  loading: false,
  error: null,
}
