// icons
import { Plus, Clock, Play, AlertTriangle, CheckCircle } from 'lucide-react'

// components
import {
  createActionsColumn,
  createCheckboxColumn,
  createSortableHeader,
} from '@/components/ui/data-table'

// hooks
import { getLoadStatusBadge } from '@/hooks/use-badges'
import { Badge } from '@/components/ui/badge'

const titleSection = {
  title: 'Load Assignment',
  description: "Manage and assign your fleet's loads",
  button: {
    text: 'Auto Assign Loads',
    icon: <Plus className="mr-2 h-4 w-4" />,
  },
}

const screenStats = [
  {
    title: 'Total Loads',
    value: 91,
    icon: <Clock className="h-4 w-4 xl:h-7 xl:w-7 text-gray-500" />,
  },
  {
    title: 'In Progress',
    value: 24,
    icon: <Play className="h-4 w-4 xl:h-7 xl:w-7 text-blue-500" />,
  },
  {
    title: 'Delayed',
    value: 39,
    icon: <AlertTriangle className="h-4 w-4 xl:h-7 xl:w-7 text-red-500" />,
  },
  {
    title: 'Completed',
    value: 42,
    icon: <CheckCircle className="h-4 w-4 xl:h-7 xl:w-7 text-green-500" />,
  },
]

const data = []

// EXPORTS
// EAST RAND 01
// JHB SOUTH WEST
// PTA NORTH
// EAST RAND 04
// COLLECT

const tableInfo = {
  tabs: [
    {
      value: 'tomorrow',
      title: "Tomorrow's Loads",
      filterColumn: 'status',
      filterBy: 'tomorrow',
      filterPlaceholder: "Search Tomorrow's orders...",
    },
    {
      value: 'routes',
      title: 'Route Assignment',
      filterColumn: 'customerName',
      filterPlaceholder: 'Search loads...',
    },
    {
      value: 'vehicles',
      title: 'Vehicle Assignment',
      filterColumn: 'status',
      filterBy: 'tomorrow',
      filterPlaceholder: "Search Tomorrow's orders...",
    },
  ],
}

// table header
// const tableInfo = {
//   value: 'tomorrow',
//   title: "Tomorrow's Loads",
//   filterColumn: 'status',
//   filterBy: 'tomorrow',
//   filterPlaceholder: "Search Tomorrow's orders...",
// }

const columns = ({ onEdit, onDelete }) => [
  //createCheckboxColumn(),
  {
    accessorKey: 'branch_name',
    header: createSortableHeader('Branch'),
  },
  {
    accessorKey: 'route_name',
    header: createSortableHeader('Route'),
  },
  {
    accessorKey: 'suburbs',
    header: createSortableHeader('Active Suburbs'),
    cell: ({ row }) => {
      const total_suburbs = row.original.suburbs?.length || 0
      return (
        <div className=" flex justify-center items-center">
          <Badge
            variant="outline"
            className="bg-pink-50 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800"
          >
            {total_suburbs}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: 'total_stops',
    header: createSortableHeader('Total Stops'),
    cell: ({ row }) => {
      let stops = 0

      row.original?.suburbs?.map(
        (s) => (stops = stops + s?.load_orders?.length)
      )
      //  console.log('stops :>> ', stops)
      return (
        <div className=" flex justify-center items-center">
          <Badge
            variant="outline"
            className="bg-pink-50 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800"
          >
            {stops}
          </Badge>
        </div>
      )
    },
  },

  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) =>
      createActionsColumn({ data: row.original, onEdit, onDelete }),
  },
]

const headers = [
  'Sales Person',
  'Order Number',
  'Customer Name',
  'Delivery Date',
  'Address2',
  'Customer Ref. No.',
  'Item Description',
  'Lip Channel Qty',
  'Quantity',
  'Weight',
  'Weight UoM',
  'Unit Price',
  'Total (LC)',
  'Line Disc %',
  'Delivery Status',
  'Del Date',
  'Doc Date',
  'Planned Delivery Date',
  'Sales Order Delivery Date',
  'Planned Delivery Time',
  'Actual Delivery Date',
  'City on Customer Record',
  'ZIP Code on Customer Record',
  'CardCode',
  'Route',
  'Zoned',
  'Address2S',
  'StreetS',
  'BlockS',
  'City on SO',
  'ZipCodeS',
]

const rows = (data) =>
  data.map((item) => [
    item.salesOrderNumber || '',
    item.customerName || '',
    item.deliveryDate || '',
    item.itemDescription || '',
    item.quantity || '',
    item.weight || '',
    item.totalLC || '',
    item.status || '',
  ])

const upload_headers = [
  // 'Sales Person',
  // 'Order Number',
  // 'Customer Name',
  // 'Delivery Date',
  // 'Address2',
  // 'Customer Ref. No.',
  // 'Item Description',
  // 'Lip Channel Qty',
  // 'Quantity',
  // 'Weight',
  // 'Weight UoM',
  // 'Unit Price',
  // 'Total (LC)',
  // 'Line Disc %',
  // 'Delivery Status',
  // 'Del Date',
  // 'Doc Date',
  // 'Planned Delivery Date',
  // 'Sales Order Delivery Date',
  // 'Planned Delivery Time',
  // 'Actual Delivery Date',
  // 'City on Customer Record',
  // 'ZIP Code on Customer Record',
  // 'CardCode',
  // 'Route',
  // 'Zoned',
  // 'Address2S',
  // 'StreetS',
  // 'BlockS',
  // 'City on SO',
  // 'ZipCodeS',
  'SlpName',
  'Sales Order Number',
  'Customer Name',
  'Delivery Date',
  'Address2',
  'Customer Ref. No.',
  'Item Description',
  'Lip Channel Qty',
  'Quantity',
  'Weight',
  'Weight UoM',
  'Unit Price',
  'Total (LC)',
  'Line Disc %',
  'Delivery Status',
  'Del Date',
  'Doc Date',
  'Planned Delivery Date',
  'Sales Order Delivery Date',
  'Planned Delivery Time',
  'Actual Delivery Date',
  'City on Customer Record',
  'ZIP Code on Customer Record',
  'CardCode',
  'Route',
  'Zoned',
  'Address2S',
  'StreetS',
  'BlockS',
  'City on SO',
  'ZipCodeS',
]

const upload_map = [
  'SlpName',
  'Sales Order Number',
  'Customer Name',
  'Delivery Date',
  'Address2',
  'Customer Ref. No.',
  'Item Description',
  'Lip Channel Qty',
  'Quantity',
  'Weight',
  'Weight UoM',
  'Unit Price',
  'Total (LC)',
  'Line Disc %',
  'Delivery Status',
  'Del Date',
  'Doc Date',
  'Planned Delivery Date',
  'Sales Order Delivery Date',
  'Planned Delivery Time',
  'Actual Delivery Date',
  'City on Customer Record',
  'ZIP Code on Customer Record',
  'CardCode',
  'Route',
  'Zoned',
  'Address2S',
  'StreetS',
  'BlockS',
  'City on SO',
  'ZipCodeS',
]

export const initialGroupedLoadsState = {
  csv_headers: headers,
  csv_rows: rows,
  upload_headers,
  upload_map,
  titleSection,
  screenStats,
  tableInfo,
  columns: columns,
  data,
  loading: false,
  error: null,
}
