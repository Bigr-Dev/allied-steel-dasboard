'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, Search, X } from 'lucide-react'

export function FilterPanel({
  liveVehicles,
  routeData,
  onFilterChange,
  isOpen,
  onToggle,
}) {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all', // all, moving, stopped
    vehicleType: 'all', // all, live, scheduled
    route: 'all',
    speedRange: { min: 0, max: 200 },
  })

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const defaultFilters = {
      search: '',
      status: 'all',
      vehicleType: 'all',
      route: 'all',
      speedRange: { min: 0, max: 200 },
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  const getUniqueRoutes = () => {
    const routes = new Set()
    routeData.forEach((vehicle) => {
      vehicle.loads.forEach((load) => {
        routes.add(load.route_name)
      })
    })
    return Array.from(routes).sort()
  }

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'speedRange') return value.min > 0 || value.max < 200
    return value !== 'all' && value !== ''
  }).length

  if (!isOpen) {
    return (
      <div className="absolute top-4 left-4 z-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="flex items-center space-x-2 bg-card shadow-lg"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="absolute top-4 left-4 z-10 w-80">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filter Vehicles</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Vehicle plate, driver, location..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          {/* Vehicle Status */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                <SelectItem value="moving">Moving Only</SelectItem>
                <SelectItem value="stopped">Stopped Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Type
            </label>
            <Select
              value={filters.vehicleType}
              onValueChange={(value) =>
                handleFilterChange('vehicleType', value)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="live">Live Tracked</SelectItem>
                <SelectItem value="scheduled">Scheduled Routes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Route Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Route
            </label>
            <Select
              value={filters.route}
              onValueChange={(value) => handleFilterChange('route', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routes</SelectItem>
                {getUniqueRoutes().map((route) => (
                  <SelectItem key={route} value={route}>
                    {route}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speed Range */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Speed Range (km/h)
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.speedRange.min}
                onChange={(e) =>
                  handleFilterChange('speedRange', {
                    ...filters.speedRange,
                    min: Number.parseInt(e.target.value) || 0,
                  })
                }
                className="h-9"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.speedRange.max}
                onChange={(e) =>
                  handleFilterChange('speedRange', {
                    ...filters.speedRange,
                    max: Number.parseInt(e.target.value) || 200,
                  })
                }
                className="h-9"
              />
            </div>
          </div>

          {/* Filter Summary */}
          {activeFilterCount > 0 && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-2">
                Active Filters:
              </div>
              <div className="flex flex-wrap gap-1">
                {filters.search && (
                  <Badge variant="secondary" className="text-xs">
                    Search: {filters.search}
                  </Badge>
                )}
                {filters.status !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {filters.status}
                  </Badge>
                )}
                {filters.vehicleType !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Type: {filters.vehicleType}
                  </Badge>
                )}
                {filters.route !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Route: {filters.route}
                  </Badge>
                )}
                {(filters.speedRange.min > 0 ||
                  filters.speedRange.max < 200) && (
                  <Badge variant="secondary" className="text-xs">
                    Speed: {filters.speedRange.min}-{filters.speedRange.max}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function applyFilters(liveVehicles, routeData, filters) {
  let filteredLive = [...liveVehicles]
  let filteredRoutes = [...routeData]

  // Apply search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    filteredLive = filteredLive.filter(
      (vehicle) =>
        vehicle.Plate?.toLowerCase().includes(searchTerm) ||
        vehicle.DriverName?.toLowerCase().includes(searchTerm) ||
        vehicle.Geozone?.toLowerCase().includes(searchTerm)
    )

    filteredRoutes = filteredRoutes.filter((vehicle) =>
      vehicle.loads.some(
        (load) =>
          load.route_name?.toLowerCase().includes(searchTerm) ||
          load.orders.some((order) =>
            order.customer_name?.toLowerCase().includes(searchTerm)
          )
      )
    )
  }

  // Apply status filter
  if (filters.status !== 'all') {
    if (filters.status === 'moving') {
      filteredLive = filteredLive.filter((vehicle) => vehicle.Speed > 0)
    } else if (filters.status === 'stopped') {
      filteredLive = filteredLive.filter((vehicle) => vehicle.Speed === 0)
    }
  }

  // Apply vehicle type filter
  if (filters.vehicleType === 'live') {
    filteredRoutes = []
  } else if (filters.vehicleType === 'scheduled') {
    filteredLive = []
  }

  // Apply route filter
  if (filters.route !== 'all') {
    filteredRoutes = filteredRoutes.filter((vehicle) =>
      vehicle.loads.some((load) => load.route_name === filters.route)
    )
  }

  // Apply speed range filter
  if (filters.speedRange.min > 0 || filters.speedRange.max < 200) {
    filteredLive = filteredLive.filter(
      (vehicle) =>
        vehicle.Speed >= filters.speedRange.min &&
        vehicle.Speed <= filters.speedRange.max
    )
  }

  return { filteredLive, filteredRoutes }
}
