// icons
import { UserCircle, ShieldCheck, ShieldAlert, Plus } from 'lucide-react'

// components

import {
  createActionsColumn,
  createCheckboxColumn,
  createSortableHeader,
} from '@/components/ui/data-table'

// hooks
import { getDriverStatusBadge } from '@/hooks/use-badges'

const titleSection = {
  title: 'Drivers',
  description: 'Manage your fleet drivers',
  button: {
    text: 'Add Driver',
    icon: <Plus className="mr-2 h-4 w-4" />,
  },
}

const screenStats = [
  {
    title: 'Total Drivers',
    value: 52,
    icon: <UserCircle className="h-4 w-4 text-gray-500" />,
  },
  {
    title: 'Admins',
    value: 3,
    icon: <ShieldCheck className="h-4 w-4 text-violet-500" />,
  },
  {
    title: 'Managers',
    value: 8,
    icon: <ShieldAlert className="h-4 w-4 text-blue-500" />,
  },
]

const tableInfo = {
  title: 'Drivers',
  filterColumn: 'name',
  filterPlaceholder: 'Search drivers...',
}

const columns = ({ onEdit, onDelete }) => {
  return [
    createCheckboxColumn(),
    // {
    //   accessorKey: 'id',
    //   header: createSortableHeader('ID'),
    // },last_name

    {
      accessorKey: 'name',
      header: createSortableHeader('Name'),
    },
    {
      accessorKey: 'last_name',
      header: createSortableHeader('Last Name'),
    },
    {
      accessorKey: 'branch_name',
      header: createSortableHeader('Branch'),
    },

    {
      accessorKey: 'phone',
      header: createSortableHeader('Contact'),
    },
    {
      accessorKey: 'emergency_contact',
      header: createSortableHeader('Emergency Contact'),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('emergency_contact')}</div>
          <div className="text-sm text-gray-500">
            {row.original.emergency_phone}
          </div>
        </div>
      ),
    },

    {
      accessorKey: 'status',
      header: createSortableHeader('Status'),
      cell: ({ row }) => getDriverStatusBadge(row.getValue('status')),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const driver = row.original

        return createActionsColumn({ data: driver, onEdit, onDelete })
      },
    },
  ]
}

const data = []

const headers = [
  'ID',
  'Cost Centre',
  'Name',
  'Contact',
  'Emergency Contact',
  'Emergency Phone',
  'Status',
]

const rows = (data) => {
  return data.map((item) => [
    item.id || '',
    item.costCentre || '',
    item.name || '',
    item.phone || '',
    item.emergencyContact || '',
    item.emergencyPhone || '',
    item.status || '',
  ])
}

export const initialDriversState = {
  csv_headers: headers,
  csv_rows: rows,
  titleSection,
  tableInfo,
  screenStats,
  columns: columns,
  data,
  loading: false,
  error: null,
}
