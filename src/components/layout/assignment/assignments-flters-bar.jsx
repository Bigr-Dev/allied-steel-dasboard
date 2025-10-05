'use client'

import { useEffect, useState } from 'react'
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
import { CalendarIcon, Filter, RotateCcw, Search, Upload } from 'lucide-react'
import { useGlobalContext } from '@/context/global-context'
import { formatDateForInput, formatDate } from '@/lib/formatters'

/**
 * Filters we support for auto-assignment:
 * - scope_branch_id: 'all' | <uuid>
 * - scope_customer_name: '' | string
 * - departure_date: '' | 'YYYY-MM-DD'
 * - cutoff_date: '' | 'YYYY-MM-DD'
 * - includeExisting: boolean (optional helper for your UI; not sent to API)
 * - unit_type: 'all' | 'rigid' | 'horse+trailer' (optional)
 *
 * Props:
 * - filters (object)
 * - onFiltersChange (fn)
 * - onPreview (fn)            -> called with normalized params (commit=false)
 * - onCommit (fn)             -> called with normalized params (commit=true)
 * - onReset (fn)
 * - loading (bool)
 */

export default function AssignmentsFiltersBar({
  filters,
  onFiltersChange,
  onPreview,
  onCommit,
  onReset,
  loading = false,
}) {
  const { branches } = useGlobalContext()
  const [localFilters, setLocalFilters] = useState(filters || {})

  const [depOpen, setDepOpen] = useState(false)
  const [cutOpen, setCutOpen] = useState(false)

  useEffect(() => {
    setLocalFilters(filters || {})
  }, [filters])

  const handleFilterChange = (key, value) => {
    const next = { ...localFilters, [key]: value }
    setLocalFilters(next)
    onFiltersChange?.(next)
  }

  const handleDatePick = (key, date, close) => {
    if (date) {
      handleFilterChange(key, formatDateForInput(date))
    } else {
      handleFilterChange(key, '')
    }
    close(false)
  }

  const handleReset = () => {
    const reset = {
      scope_branch_id: 'all',
      scope_customer_name: '',
      departure_date: '',
      cutoff_date: '',
      includeExisting: true,
      unit_type: 'all',
    }
    setLocalFilters(reset)
    onFiltersChange?.(reset)
    onReset?.()
  }

  const buildNormalized = (commitFlag) => {
    const f = { ...localFilters }
    // Normalize “all” to empty for API omission
    const normalized = {
      departure_date: f.departure_date || '',
      cutoff_date: f.cutoff_date || '',
      scope_branch_id:
        f.scope_branch_id && f.scope_branch_id !== 'all'
          ? f.scope_branch_id
          : '',
      scope_customer_name: f.scope_customer_name || '',
      unit_type: f.unit_type && f.unit_type !== 'all' ? f.unit_type : '', // optional param
      commit: !!commitFlag,
    }
    return normalized
  }

  const handlePreview = () => {
    const params = buildNormalized(false)
    onPreview?.(params)
  }

  const handleCommit = () => {
    const params = buildNormalized(true)
    onCommit?.(params)
  }

  const branchOptions =
    branches?.data?.map((b) => ({
      value: b.id,
      label: b.name?.slice(26) || b.name || 'Unnamed',
    })) || []

  return (
    <Card className="sticky top-0 mb-6 ">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Assignment Filters
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Branch */}
          <div className="space-y-2">
            <Label>Branch</Label>
            <Select
              value={localFilters.scope_branch_id || 'all'}
              onValueChange={(v) => handleFilterChange('scope_branch_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branchOptions.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer (name contains) */}
          <div className="space-y-2">
            <Label>Customer</Label>
            <Input
              placeholder="Customer name…"
              value={localFilters.scope_customer_name || ''}
              onChange={(e) =>
                handleFilterChange('scope_customer_name', e.target.value)
              }
            />
          </div>

          {/* Departure Date */}
          <div className="space-y-2">
            <Label>Departure date</Label>
            <Popover open={depOpen} onOpenChange={setDepOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.departure_date
                    ? formatDate(localFilters.departure_date)
                    : 'Select departure date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    localFilters.departure_date
                      ? new Date(localFilters.departure_date)
                      : undefined
                  }
                  onSelect={(d) =>
                    handleDatePick('departure_date', d, setDepOpen)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Cutoff Date */}
          <div className="space-y-2">
            <Label>Cutoff date</Label>
            <Popover open={cutOpen} onOpenChange={setCutOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.cutoff_date
                    ? formatDate(localFilters.cutoff_date)
                    : 'Select cutoff date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    localFilters.cutoff_date
                      ? new Date(localFilters.cutoff_date)
                      : undefined
                  }
                  onSelect={(d) => handleDatePick('cutoff_date', d, setCutOpen)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Unit Type (optional) */}
          <div className="space-y-2">
            <Label>Unit type</Label>
            <Select
              value={localFilters.unit_type || 'all'}
              onValueChange={(v) => handleFilterChange('unit_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All unit types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All unit types</SelectItem>
                <SelectItem value="rigid">Rigid</SelectItem>
                <SelectItem value="horse+trailer">Horse + Trailer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Include existing (pure UI help; not sent unless you want) */}
          <div className="space-y-2">
            <Label htmlFor="includeExisting">Include existing</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="includeExisting"
                checked={!!localFilters.includeExisting}
                onCheckedChange={(checked) =>
                  handleFilterChange('includeExisting', checked)
                }
              />
              <span className="text-sm">
                {localFilters.includeExisting ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePreview}
              disabled={loading}
              variant="outline"
              className="border-[#003e69]"
            >
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Running preview…' : 'Preview auto-assignment'}
            </Button>

            <Button
              onClick={handleCommit}
              disabled={loading}
              className="bg-[#003e69] hover:bg-[#428bca]"
            >
              <Upload className="mr-2 h-4 w-4" />
              {loading ? 'Committing…' : 'Commit plan'}
            </Button>

            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading}
              className="ml-2"
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
