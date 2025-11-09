'use client'

import { useState, useMemo, memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { DraggableItemRow } from './DraggableItemRow'
import { Search, Filter, Package, AlertCircle } from 'lucide-react'

export const UnassignedList = memo(function UnassignedList({
  items,
  onItemsChange,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoutes, setSelectedRoutes] = useState(new Set())
  const [selectedSuburbs, setSelectedSuburbs] = useState(new Set())
  const [selectedCustomers, setSelectedCustomers] = useState(new Set())

  const { isOver, setNodeRef } = useDroppable({ id: 'bucket:unassigned' })

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const routes = new Set(items.map((item) => item.route_name).filter(Boolean))
    const suburbs = new Set(
      items.map((item) => item.suburb_name).filter(Boolean)
    )
    const customers = new Set(
      items.map((item) => item.customer_name).filter(Boolean)
    )

    return {
      routes: Array.from(routes).sort(),
      suburbs: Array.from(suburbs).sort(),
      customers: Array.from(customers).sort(),
    }
  }, [items])

  // Handle both individual items (backward compatibility) and complete orders
  const orderGroups = useMemo(() => {
    // Check if items are already complete orders (new structure)
    const isOrderStructure = items.length > 0 && items[0].order_id && items[0].sales_order_number
    
    let ordersToProcess = []
    
    if (isOrderStructure) {
      // New structure: items are complete orders
      ordersToProcess = items.filter((order) => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const matchesSearch =
            (order.customer_name ?? '').toLowerCase().includes(query) ||
            (order.route_name ?? '').toLowerCase().includes(query) ||
            (order.suburb_name ?? '').toLowerCase().includes(query) ||
            (order.sales_order_number ?? '').toLowerCase().includes(query)
          if (!matchesSearch) return false
        }

        // Route filter
        if (selectedRoutes.size > 0 && !selectedRoutes.has(order.route_name)) {
          return false
        }

        // Suburb filter
        if (selectedSuburbs.size > 0 && !selectedSuburbs.has(order.suburb_name)) {
          return false
        }

        // Customer filter
        if (selectedCustomers.size > 0 && !selectedCustomers.has(order.customer_name)) {
          return false
        }

        return true
      })
      
      return ordersToProcess.map((order) => ({
        id: `order-${order.order_id}`,
        order_number: order.sales_order_number,
        order_id: order.order_id,
        items: order.order_lines || [],
        itemCount: order.total_line_items || (order.order_lines || []).length,
        totalWeight: order.total_weight || 0,
        totalVolume: 0,
        customer_name: order.customer_name || '',
        route_name: order.route_name || '',
        suburb_name: order.suburb_name || '',
        weight_left: order.total_weight || 0,
        volume_left: 0,
        description: `${order.sales_order_number} - ${order.customer_name} (${order.total_line_items || 0} items)`,
        isOrderGroup: true,
        ...order, // Include all order fields for drag payload
      }))
    } else {
      // Backward compatibility: group individual items by order number
      const filtered = items.filter((item) => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const matchesSearch =
            (item.description ?? '').toLowerCase().includes(query) ||
            (item.customer_name ?? '').toLowerCase().includes(query) ||
            (item.route_name ?? '').toLowerCase().includes(query) ||
            (item.suburb_name ?? '').toLowerCase().includes(query) ||
            (item.order_number ?? '').toLowerCase().includes(query)
          if (!matchesSearch) return false
        }

        if (selectedRoutes.size > 0 && !selectedRoutes.has(item.route_name)) {
          return false
        }

        if (selectedSuburbs.size > 0 && !selectedSuburbs.has(item.suburb_name)) {
          return false
        }

        if (selectedCustomers.size > 0 && !selectedCustomers.has(item.customer_name)) {
          return false
        }

        return true
      })

      const groups = new Map()
      filtered.forEach((item) => {
        const orderNum = item.order_number || 'NO_ORDER'
        if (!groups.has(orderNum)) {
          groups.set(orderNum, [])
        }
        groups.get(orderNum).push(item)
      })

      return Array.from(groups.entries()).map(([orderNumber, orderItems]) => {
        const totalWeight = orderItems.reduce((sum, item) => sum + (item.weight_left || 0), 0)
        const totalVolume = orderItems.reduce((sum, item) => sum + (item.volume_left || 0), 0)

        return {
          id: `order-${orderNumber}`,
          order_number: orderNumber,
          items: orderItems,
          itemCount: orderItems.length,
          totalWeight,
          totalVolume,
          customer_name: orderItems[0]?.customer_name || '',
          route_name: orderItems[0]?.route_name || '',
          suburb_name: orderItems[0]?.suburb_name || '',
          ...orderItems[0],
          weight_left: totalWeight,
          volume_left: totalVolume,
          description: `Order ${orderNumber} (${orderItems.length} items)`,
          isOrderGroup: true,
        }
      })
    }
  }, [items, searchQuery, selectedRoutes, selectedSuburbs, selectedCustomers])

  const totalWeight = orderGroups.reduce(
    (sum, order) => sum + order.totalWeight,
    0
  )
  const totalItems = orderGroups.reduce(
    (sum, order) => sum + order.itemCount,
    0
  )

  const handleRouteToggle = (route) => {
    const newSelected = new Set(selectedRoutes)
    if (newSelected.has(route)) {
      newSelected.delete(route)
    } else {
      newSelected.add(route)
    }
    setSelectedRoutes(newSelected)
  }

  const handleSuburbToggle = (suburb) => {
    const newSelected = new Set(selectedSuburbs)
    if (newSelected.has(suburb)) {
      newSelected.delete(suburb)
    } else {
      newSelected.add(suburb)
    }
    setSelectedSuburbs(newSelected)
  }

  const handleCustomerToggle = (customer) => {
    const newSelected = new Set(selectedCustomers)
    if (newSelected.has(customer)) {
      newSelected.delete(customer)
    } else {
      newSelected.add(customer)
    }
    setSelectedCustomers(newSelected)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedRoutes(new Set())
    setSelectedSuburbs(new Set())
    setSelectedCustomers(new Set())
  }

  const hasActiveFilters =
    searchQuery ||
    selectedRoutes.size > 0 ||
    selectedSuburbs.size > 0 ||
    selectedCustomers.size > 0

  return (
    <Card
      ref={setNodeRef}
      className={`rounded-2xl h-fit transition-all duration-200 ${
        isOver ? 'ring-2 ring-primary ring-offset-2 bg-accent/50' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Unassigned Orders
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {orderGroups.length} orders • {totalItems} items
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, customers, routes, order numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <Filter className="h-4 w-4" />
                Routes
                {selectedRoutes.size > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {selectedRoutes.size}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {filterOptions.routes.map((route) => (
                <DropdownMenuCheckboxItem
                  key={route}
                  checked={selectedRoutes.has(route)}
                  onCheckedChange={() => handleRouteToggle(route)}
                >
                  {route}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                Suburbs
                {selectedSuburbs.size > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {selectedSuburbs.size}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {filterOptions.suburbs.map((suburb) => (
                <DropdownMenuCheckboxItem
                  key={suburb}
                  checked={selectedSuburbs.has(suburb)}
                  onCheckedChange={() => handleSuburbToggle(suburb)}
                >
                  {suburb}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                Customers
                {selectedCustomers.size > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {selectedCustomers.size}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {filterOptions.customers.map((customer) => (
                <DropdownMenuCheckboxItem
                  key={customer}
                  checked={selectedCustomers.has(customer)}
                  onCheckedChange={() => handleCustomerToggle(customer)}
                >
                  {customer}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
          <span>
            {totalItems} items in {orderGroups.length} orders
          </span>
          <span>{totalWeight.toFixed(1)} kg total</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {orderGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>No orders match your filters</p>
          </div>
        ) : (
          orderGroups.map((order) => (
            <DraggableItemRow
              key={order.id}
              item={order}
              isDraggable={true}
              isUnassigned={true}
              isOrderGroup={true}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
})
