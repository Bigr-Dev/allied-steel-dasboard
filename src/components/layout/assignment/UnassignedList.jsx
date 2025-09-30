'use client'

import { useState, useMemo } from 'react'
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

export function UnassignedList({ items, onItemsChange }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoutes, setSelectedRoutes] = useState(new Set())
  const [selectedSuburbs, setSelectedSuburbs] = useState(new Set())
  const [selectedCustomers, setSelectedCustomers] = useState(new Set())

  const { isOver, setNodeRef } = useDroppable({
    id: 'unassigned',
  })

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

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        // const matchesSearch =
        //   item.description.toLowerCase().includes(query) ||
        //   item.customer_name.toLowerCase().includes(query) ||
        //   item.route_name.toLowerCase().includes(query) ||
        //   item.suburb_name.toLowerCase().includes(query)
        const matchesSearch =
          (item.description ?? '').toLowerCase().includes(query) ||
          (item.customer_name ?? '').toLowerCase().includes(query) ||
          (item.route_name ?? '').toLowerCase().includes(query) ||
          (item.suburb_name ?? '').toLowerCase().includes(query)

        if (!matchesSearch) return false
      }

      // Route filter
      if (selectedRoutes.size > 0 && !selectedRoutes.has(item.route_name)) {
        return false
      }

      // Suburb filter
      if (selectedSuburbs.size > 0 && !selectedSuburbs.has(item.suburb_name)) {
        return false
      }

      // Customer filter
      if (
        selectedCustomers.size > 0 &&
        !selectedCustomers.has(item.customer_name)
      ) {
        return false
      }

      return true
    })
  }, [items, searchQuery, selectedRoutes, selectedSuburbs, selectedCustomers])

  const totalWeight = filteredItems.reduce(
    (sum, item) => sum + item.weight_left,
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
            Unassigned Items
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {filteredItems.length} items
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items, customers, routes..."
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
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Total Weight:{' '}
            <span className="font-medium text-foreground">{totalWeight}kg</span>
          </span>
          {hasActiveFilters && (
            <span className="text-xs text-muted-foreground">
              {filteredItems.length} of {items.length} items
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {items.length === 0 ? (
                <>
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs">No unassigned items remaining</p>
                </>
              ) : (
                <>
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No items match filters</p>
                  <p className="text-xs">
                    Try adjusting your search or filters
                  </p>
                </>
              )}
            </div>
          ) : (
            filteredItems.map((item) => (
              <DraggableItemRow
                key={item.item_id}
                item={item}
                containerId="unassigned"
                isDraggable={true}
                isUnassigned={true}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
