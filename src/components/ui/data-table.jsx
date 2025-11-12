'use client'

// react
import { useState } from 'react'

// next
import { usePathname, useRouter } from 'next/navigation'

// icons
import { ChevronDown, ArrowUpDown, Eye, Edit, Trash2 } from 'lucide-react'

// components
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from './checkbox'
import Link from 'next/link'

// context
import { useGlobalContext } from '@/context/global-context'
import { useAuth } from '@/context/initial-states/auth-state'

// hooks
import { getPermittedAccessRoutes } from '@/hooks/get-accessible-routes'

export function DataTable({
  columns,
  data,
  filterColumn,
  url,
  filterPlaceholder = 'Filter...',
  showColumnToggle = true,
  csv_headers,
  csv_rows,
}) {
  const router = useRouter()
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const { downloadCSVFromTable } = useGlobalContext()

  const pathname = usePathname()

  // const rows = csv_rows(data)
  // console.log('rows :>> ', data?.length)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          {filterColumn && (
            <Input
              placeholder={filterPlaceholder}
              value={table.getState().globalFilter ?? ''}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              className="max-w-sm border-[#003e69]"
            />
          )}
        </div>
        <div className="flex space-x-4 items-center justify-center">
          {data?.length > 0 && csv_headers && csv_rows && (
            <Button
              variant="outline"
              className="ml-auto border-[#003e69]"
              onClick={() =>
                downloadCSVFromTable({
                  headers: csv_headers,
                  rows: csv_rows(data),
                  filename: 'export.csv',
                })
              }
            >
              Download (csv)
            </Button>
          )}
          {showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto border-[#003e69]">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <div className="rounded-md border overflow-hidden  border-[#003e69]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className=" bg-[#003e69] hover:bg-[#428bca]  "
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className=" mx-0 px-2 text-white">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => {
                    // console.log('url :>> ', url)
                    if (url) {
                      switch (url) {
                        case 'loads':
                          //console.log('row.original.id :>> ', row.original)
                          router.replace(`/${url}/${row.original.route_id}`)
                          break

                        // case 'route_id':
                        //  router.replace(`/${url}/${row.original.route_id}`)
                        // break

                        case 'none':
                          break

                        default:
                          router.replace(`/${url}/${row.original.id}`)

                          break
                      }
                    } else if (row.original.id) {
                      router.push(`${pathname}/${row.original.id}`)
                    } else if (row.original.route_id) {
                      router.push(`${pathname}/${row.original.route_id}`)
                    }
                    // if (url) {
                    //   router.push(`${pathname}/${row.original.id}`)
                    // }
                    // if (row.original.route_id) {
                    //   router.push(`${pathname}/${row.original.route_id}`)
                    // }
                    // if (row.original.id) {
                    //   router.push(`${pathname}/${row.original.id}`)

                    //   // if (row.original.id.includes('CC')) {
                    //   //   // If the ID starts with "CC", navigate to the cost centre details page
                    //   //   router.push(`/cost-centres/${row.original.id}`)
                    //   // } else if (row.original.id.includes('USR')) {
                    //   //   // If the ID starts with "USR", navigate to the user details page
                    //   //   router.push(`/users/${row.original.id}`)
                    //   // } else if (row.original.id.includes('CL')) {
                    //   //   // If the ID starts with "CL", navigate to the client details page
                    //   //   router.push(`/clients/${row.original.id}`)
                    //   // } else if (row.original.id.includes('VEH')) {
                    //   //   // If the ID starts with "VEH", navigate to the vehicle details page
                    //   //   router.push(`/vehicles/${row.original.id}`)
                    //   // } else if (row.original.id.includes('DRV')) {
                    //   //   // If the ID starts with "DRV", navigate to the driver details page
                    //   //   router.push(`/drivers/${row.original.id}`)
                    //   // } else if (row.original.id.includes('STP')) {
                    //   //   // If the ID starts with "STP", navigate to the stop details page
                    //   //   router.push(`/stop-points/${row.original.id}`)
                    //   // } else if (row.original.id.includes('TRP')) {
                    //   //   // If the ID starts with "TRP", navigate to the trip details page
                    //   //   router.push(`/trips/${row.original.id}`)
                    //   // } else {
                    //   //   // router.push(`${pathname}/${row.original.id}`)
                    //   //   null
                    //   // }
                    // }
                  }}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => {
                        // Prevent row click when clicking on action buttons or checkboxes
                        if (
                          e.target.closest('button') ||
                          e.target.closest('[role="checkbox"]')
                        ) {
                          e.stopPropagation()
                        }
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <>
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </>
          )}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={
              table.getCanPreviousPage()
                ? 'text-white hover:text-white bg-[#003e69] hover:bg-[#428bca]'
                : 'text-black border-[#003e69]'
            }
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={
              table.getCanNextPage()
                ? 'text-white hover:text-white bg-[#003e69] hover:bg-[#428bca]'
                : 'text-black border-[#003e69]'
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

// Helper function to create checkbox column
export function createCheckboxColumn() {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }
}

// Helper function to create sortable header
export function createSortableHeader(title) {
  return ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto w-full p-0 font-medium justify-between items-center m-0"
      >
        {title}
        <ArrowUpDown className=" h-4 w-4" />
      </Button>
    )
  }
}

export function createActionsColumn({ data, onEdit, onDelete }) {
  const pathname = usePathname().slice(1)
  const {
    current_user: {
      currentUser: { permissions },
    },
  } = useAuth()
  const { routes } = useGlobalContext()
  const accessibleRoutes = getPermittedAccessRoutes(permissions, routes)

  const canEdit = accessibleRoutes.filter((p) => p.href.includes(pathname))
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <Edit className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            navigator.clipboard.writeText(data.id)
          }}
        >
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <Link href={`/cost-centres/${data.id}`}>
          <DropdownMenuItem>
            <Eye className="mr-2 h-4 w-4" /> View details
          </DropdownMenuItem>
        </Link>
        {canEdit[0]?.access == 'write' && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onEdit({ id: data.id })
            }}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
        )}
        {canEdit[0]?.access == 'write' && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={(e) => {
              e.stopPropagation()
              onDelete({ id: data.id })
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
