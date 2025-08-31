// icons
import { Plus, Building2, Users, Truck, Route, MapPin } from 'lucide-react'

// components
import { Badge } from '@/components/ui/badge'
import {
  createActionsColumn,
  createCheckboxColumn,
  createSortableHeader,
} from '@/components/ui/data-table'

// data
const data = []

// page title
const titleSection = {
  title: 'Orders',
  description: 'Manage your SAP orders',
  button: {
    text: 'Add Order',
    icon: <Plus className="mr-2 h-4 w-4" />,
  },
}

// stats
const screenStats = [
  {
    title: 'Total Orders',
    value: 0,
    icon: <Building2 className="h-4 w-4 text-violet-500" />,
  },
  {
    title: 'unfulfilled Orders',
    value: 0,
    icon: <Users className="h-4 w-4 text-pink-700" />,
  },
  {
    title: 'Fulfilled Orders',
    value: 0,
    icon: <Truck className="h-4 w-4 text-orange-500" />,
  },
  {
    title: 'Active Orders',
    value: 0,
    icon: <Route className="h-4 w-4 text-emerald-500" />,
  },
]

// // table header
// const tableInfo = {
//   title: 'Orders',
//   filterColumn: 'name',
//   filterPlaceholder: 'Filter orders...',
// }

const tableInfo = {
  tabs: [
    {
      value: 'overdue',
      title: 'Overdue Orders',
      filterColumn: 'document_due_date',
      filterPlaceholder: 'Search overdue orders...',
    },
    {
      value: 'tomorrow',
      title: "Tomorrow's Orders",
      filterColumn: 'document_due_date',
      filterBy: ['in-progress', 'delayed'],
      filterPlaceholder: 'Search todays orders...',
    },
    {
      value: 'week',
      title: "Rest of the Week's Orders",
      filterColumn: 'document_due_date',
      filterBy: 'completed',
      filterPlaceholder: 'Search this weeks orders...',
    },
  ],
}

export const columns = ({ onEdit, onDelete }) => {
  return [
    createCheckboxColumn(),
    {
      accessorKey: 'sales_order_number',
      header: createSortableHeader('Order No.'),
      // cell: ({ row }) => (
      //   <div className="font-medium text-gray-500">{row.original.id}</div>
      // ),sales_person_name
    },
    {
      accessorKey: 'sales_person_name',
      header: createSortableHeader('Sales Person'),
      // cell: ({ row }) => (
      //   <div className="font-medium">{row.getValue('name')}</div>
      // ),
    },
    {
      accessorKey: 'customer_name',
      header: createSortableHeader('Customer'),
    },
    {
      accessorKey: 'sales_order_route',
      header: createSortableHeader('Route'),
      // cell: ({ row }) => (
      //   <div className="font-medium">{row.getValue('name')}</div>
      // ),
    },
    {
      accessorKey: 'document_due_date',
      header: createSortableHeader('Due Date'),
      // cell: ({ row }) => (
      //   <div className="font-medium">{row.getValue('contactPerson')}</div>
      // ),
    },

    {
      accessorKey: 'order_lines',
      header: createSortableHeader('Items'),
      cell: ({ row }) => {
        const totalOrders = row.original.order_lines?.length || 0
        return (
          <Badge
            variant="outline"
            className="bg-pink-50 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800"
          >
            {totalOrders}
          </Badge>
        )
      },
    },

    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const order = row.original
        return createActionsColumn({ data: order, onEdit, onDelete })
      },
    },
  ]
}

const headers = [
  'ID',
  'Customer',
  'Contact',
  'Industry',
  'Locations',
  'Status',
  'Total Spend',
  'Active Trips',
  'Total Trips',
]

const rows = (data) => {
  return data.map((item) => {
    const pickup = item.pickupLocations?.length || 0
    const dropoff = item.dropoffLocations?.length || 0

    return [
      item.id || '',
      item.name || '',
      item.contactPerson || '',
      item.industry || '',
      pickup + dropoff,
      item.status || '',
      item.totalSpend != null ? item.totalSpend : '',
      item.activeTrips != null ? item.activeTrips : '',
      item.totalTrips != null ? item.totalTrips : '',
    ]
  })
}

// context
export const initialOrderState = {
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
