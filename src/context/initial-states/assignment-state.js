import { Plus } from 'lucide-react'
import { useGlobalContext } from '../global-context'
import {
  createActionsColumn,
  createCheckboxColumn,
  createSortableHeader,
} from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'

// data
const data = { plans: [], loading: false }

// page title
const titleSection = {
  title: 'Load Assignment Plans',
  description: 'Manage planned  vehicle assignments',
  button: {
    text: 'Create Assignment Plan',
    icon: <Plus className="mr-2 h-4 w-4" />,
  },
}

const tableInfo = {
  title: 'Assignment Plans',
  filterColumn: 'id',
  filterPlaceholder: 'Search plans...',
}

// const tableInfo = {
//   tabs: [
//     {
//       value: 'Preview',
//       title: 'Assignment Plan Preview',
//       filterColumn: 'id',
//       filterBy: 'id',
//       filterPlaceholder: 'Search horses...',
//     },
//     {
//       value: 'Plans',
//       title: 'Committed Assignment Plans',
//       filterColumn: 'id',
//       filterPlaceholder: 'Search plans...',
//     },
//   ],
// }

const str = '2025-09-30T23:04:59.857908+00:00'
const date = new Date(str)

// console.log('Date:', date.toISOString().split('T')[0]) // "2025-09-30"
// console.log('Time:', date.toISOString().split('T')[1].split('Z')[0]) // "23:04:59.857Z"

const columns = ({ onEdit, onDelete, branches }) => {
  // const { branches: data } = useGlobalContext()
  // // console.log('branches :>> ', branches)
  // const branches = data?.data
  return [
    createCheckboxColumn(),
    // {
    //   accessorKey: 'id',
    //   header: createSortableHeader('ID'),
    // },
    {
      accessorKey: 'plan_name',
      header: createSortableHeader('Plan Name'),
      cell: ({ row }) => (
        <div className="font-medium capitalize">{row.original.plan_name}</div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: createSortableHeader('Date Created'),
      cell: ({ row }) => {
        const str = new Date(row.getValue('created_at'))
        const date = str?.toISOString().split('T')[0]
        const time = str?.toISOString().split('T')[1].split('Z')[0]
        return (
          <div>
            <div className="font-medium">{date}</div>
            <div className="text-sm text-gray-500">{time}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'scope_all_branches',
      header: createSortableHeader('Branch'),
      cell: ({ row }) => {
        const isAllBranches = row.getValue('scope_all_branches')
        return (
          <div>
            <div className="font-medium">
              {isAllBranches ? 'All Branches' : 'Specific Branch'}
            </div>
          </div>
        )
      },
    },

    // {
    //   accessorKey: 'run_at',
    //   header: createSortableHeader('Date Created'),
    //   cell: ({ row }) => {
    //     const str = new Date(row.getValue('run_at'))
    //     const date = str.toISOString().split('T')[0]
    //     const time = str.toISOString().split('T')[1].split('Z')[0]
    //     return (
    //       <div>
    //         <div className="font-medium">{date}</div>
    //         <div className="text-sm text-gray-500">{time}</div>
    //       </div>
    //     )
    //   },
    // },
    {
      accessorKey: 'delivery_start',
      header: createSortableHeader('Delivery Start'),
    },
    {
      accessorKey: 'delivery_end',
      header: createSortableHeader('Delivery End'),
    },
    {
      accessorKey: 'status',
      header: createSortableHeader('Status'),
      cell: ({ row }) => (
        <Badge
          variant={
            row.getValue('status') === 'committed' ? 'default' : 'secondary'
          }
        >
          {row.getValue('status')}
        </Badge>
      ),
    },
    // {
    //   accessorKey: 'cutoff_date',
    //   header: createSortableHeader('Cutoff date'),
    //   // cell: ({ row }) => getDriverStatusBadge(row.getValue('status')),
    // },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return createActionsColumn({ data: row.original, onEdit, onDelete })
      },
    },
  ]
}

// context
export const initialAssignmentState = {
  // csv_headers: headers,
  // csv_rows: rows,
  titleSection,
  // screenStats,
  tableInfo,
  columns: columns,

  data,
  loading: false,
  error: null,
}
