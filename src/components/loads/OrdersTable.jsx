'use client'

import { useState, useEffect } from 'react'
import { DataTable, createSortableHeader } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter } from 'lucide-react'
import { loadsAPI, flattenLoadsHierarchy } from '@/lib/assignment-helpers'
import DetailCard from '@/components/ui/detail-card'

export default function OrdersTable() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    date: '',
    branch_id: '',
    route_id: '',
    customer_name: ''
  })

  // Load orders data
  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async (filterParams = {}) => {
    setLoading(true)
    try {
      const response = await loadsAPI.getLoads(filterParams)
      const flattenedOrders = flattenLoadsHierarchy(response)
      setOrders(flattenedOrders)
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    loadOrders(newFilters)
  }

  const getStatusBadge = (status) => {
    const variants = {
      'Assigned': 'default',
      'Unassigned': 'secondary', 
      'Split': 'outline'
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  const columns = [
    {
      accessorKey: 'sales_order_number',
      header: createSortableHeader('Order #'),
    },
    {
      accessorKey: 'customer_name',
      header: createSortableHeader('Customer'),
    },
    {
      accessorKey: 'route_name',
      header: createSortableHeader('Route'),
    },
    {
      accessorKey: 'suburb_name',
      header: createSortableHeader('Suburb'),
    },
    {
      accessorKey: 'delivery_date',
      header: createSortableHeader('Delivery Date'),
    },
    {
      accessorKey: 'total_weight',
      header: createSortableHeader('Weight (kg)'),
      cell: ({ row }) => `${row.getValue('total_weight')}kg`,
    },
    {
      accessorKey: 'total_quantity',
      header: createSortableHeader('Quantity'),
    },
    {
      accessorKey: 'assignment_status',
      header: createSortableHeader('Status'),
      cell: ({ row }) => getStatusBadge(row.getValue('assignment_status')),
    },
    {
      accessorKey: 'assignment_plan_id',
      header: createSortableHeader('Plan ID'),
      cell: ({ row }) => {
        const planId = row.getValue('assignment_plan_id')
        return planId ? (
          <Badge variant="outline" className="text-xs">
            {planId.slice(0, 8)}...
          </Badge>
        ) : '-'
      },
    },
  ]

  return (
    <div className="space-y-4">
      <DetailCard
        title="Sales Orders"
        description="Manage and track all sales orders and their assignment status"
      >
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter by date (YYYY-MM-DD)"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-48"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter by customer"
              value={filters.customer_name}
              onChange={(e) => handleFilterChange('customer_name', e.target.value)}
              className="w-48"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setFilters({ date: '', branch_id: '', route_id: '', customer_name: '' })
              loadOrders()
            }}
          >
            Clear Filters
          </Button>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          filterColumn="sales_order_number"
          filterPlaceholder="Search orders..."
        />
      </DetailCard>
    </div>
  )
}