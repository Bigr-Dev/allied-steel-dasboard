'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Filter, RotateCcw, Search } from 'lucide-react'
import { formatDateForInput, formatDate } from '@/lib/formatters'
import { useGlobalContext } from '@/context/global-context'

const statusOptions = [
  { value: 'planned', label: 'Planned' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'loaded', label: 'Loaded' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function FiltersBar({
  filters,
  onFiltersChange,
  onFetch,
  onReset,
  // loading = false,
}) {
  const {
    branches,
    dashboardState,
    fetchLoads,
    loadsDispatch,
    loads: { loading },
  } = useGlobalContext()

  const [localFilters, setLocalFilters] = useState(filters)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  // console.log('dashboardState :>> ', dashboardState)

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleFetch = () => {
    // Convert "all" values back to empty strings for API calls

    //     let apiFilters = { ...localFilters }
    // if (apiFilters.branch_id === 'all') delete apiFilters.branch_id
    // if (apiFilters.route_name === '') delete apiFilters.route_name
    // if (apiFilters.date === '') delete apiFilters.date
    // if (apiFilters.status === 'all' || apiFilters.status === '')
    //   apiFilters.status = ''
    let url = '/?'
    const apiFilters = { ...localFilters }
    if (apiFilters.branch_id !== 'all' && apiFilters.branch_id !== '')
      url = url + `branch_id=${apiFilters.branch_id}&`
    if (apiFilters.customer_name !== 'all' && apiFilters.customer_name !== '')
      url = url + `customer_name=${apiFilters.customer_name}&`
    if (apiFilters.date !== 'all' && apiFilters.date !== '')
      url = url + `date=${apiFilters.date}&`
    if (apiFilters.route_name !== 'all' && apiFilters.route_name !== '')
      url = url + `route_name=${apiFilters.route_name}&`
    if (apiFilters.status !== 'all' && apiFilters.status !== '')
      url = url + `status=${apiFilters.status}&`
    url = url + `includeItems=${apiFilters.includeItems}`

    // if (apiFilters.branch_id === 'all') apiFilters.branch_id = ''
    // if (apiFilters.status === 'all') apiFilters.status = ''

    //  console.log('apiFilters :>> ', url)
    fetchLoads(loadsDispatch, url)
  }

  const handleReset = () => {
    const resetFilters = {
      branch_id: 'all',
      route_name: '',
      date: '',
      status: 'all',
      customer_name: '',
      includeItems: false,
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
    onReset()
  }

  const handleDateSelect = (date) => {
    if (date) {
      const formattedDate = formatDateForInput(date)
      handleFilterChange('date', formattedDate)
    } else {
      handleFilterChange('date', '')
    }
    setDatePickerOpen(false)
  }

  const branchOptions =
    branches?.data?.map((branch) => ({
      value: branch.id,
      label: branch.name?.slice(26),
    })) || []

  return (
    <Card className="sticky top-0  mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Branch Filter */}
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Select
              value={localFilters.branch_id || ''}
              onValueChange={(value) => handleFilterChange('branch_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branchOptions.map((branch) => (
                  <SelectItem key={branch.value} value={branch.value}>
                    {branch.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Route Filter */}
          <div className="space-y-2">
            <Label htmlFor="route">Route</Label>
            <Input
              id="route"
              placeholder="Route name..."
              value={localFilters.route_name || ''}
              onChange={(e) => handleFilterChange('route_name', e.target.value)}
            />
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.date
                    ? formatDate(localFilters.date)
                    : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    localFilters.date ? new Date(localFilters.date) : undefined
                  }
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={localFilters.status || ''}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Filter */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="customer"
                placeholder="Customer name..."
                className="pl-8"
                value={localFilters.customer_name || ''}
                onChange={(e) =>
                  handleFilterChange('customer_name', e.target.value)
                }
              />
            </div>
          </div>

          {/* Include Items Switch */}
          <div className="space-y-2">
            <Label htmlFor="includeItems">Include Items</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="includeItems"
                checked={localFilters.includeItems || false}
                onCheckedChange={(checked) =>
                  handleFilterChange('includeItems', checked)
                }
              />
              <Label htmlFor="includeItems" className="text-sm">
                {localFilters.includeItems ? 'Yes' : 'No'}
              </Label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleFetch}
              disabled={loading}
              className="bg-[#003e69] hover:bg-[#428bca]"
            >
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Fetching...' : 'Fetch'}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading}
              className="border-[#003e69]"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
