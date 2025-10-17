'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Navigation,
  User,
  MapPin,
  Gauge,
  TrendingUp,
} from 'lucide-react'

/**
 * CardsView — presentational only
 * Props (from page.jsx):
 *  - vehicleCards: [{ plate: string, live: { Plate, Latitude, Longitude, Speed, Address, DriverName, Geozone, Mileage, Timestamp|Time } | null }]
 *  - selectedPlanId: 'all' | <planId>
 *  - targetPlates: string[] (UPPERCASE)
 *  - assignedUnits: [] (empty when 'all')
 */
export default function CardsView({
  vehicleCards = [],
  selectedPlanId,
  targetPlates = [],
  assignedUnits = [],
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('lastSeen') // 'lastSeen' | 'speed'

  // Robust timestamp getter (ms since epoch) from live.Time (ISO) or live.Timestamp (ms)
  const getTimestampMs = (card) => {
    const live = card?.live
    if (!live) return null
    // Numeric ms epoch (rare in your feed)
    if (typeof live.Timestamp === 'number' && Number.isFinite(live.Timestamp)) {
      return live.Timestamp
    }
    // Capitalized ISO string
    if (typeof live.Time === 'string') {
      const t = Date.parse(live.Time)
      if (Number.isFinite(t)) return t
    }
    // Lowercase ISO string from your feed
    if (typeof live.timestamp === 'string') {
      const t = Date.parse(live.timestamp)
      if (Number.isFinite(t)) return t
    }
    // LocTime like "2025-10-16 23:30:12"
    if (typeof live.LocTime === 'string') {
      const t = Date.parse(live.LocTime.replace(' ', 'T') + 'Z')
      if (Number.isFinite(t)) return t
    }
    return null
  }
  // const getTimestampMs = (card) => {
  //   const live = card?.live
  //   if (!live) return null
  //   if (typeof live.Timestamp === 'number' && Number.isFinite(live.Timestamp))
  //     return live.Timestamp
  //   if (typeof live.Time === 'string') {
  //     const t = Date.parse(live.Time)
  //     return Number.isFinite(t) ? t : null
  //   }
  //   return null
  // }

  // Derive vehicle status (moving/idle/offline)
  const getVehicleStatus = (card) => {
    const ts = getTimestampMs(card)
    const speed = Number(card?.live?.Speed ?? 0)
    if (ts == null) return 'offline'
    const minutesSince = (Date.now() - ts) / 60000
    if (minutesSince > 5) return 'offline'
    if (speed > 0) return 'moving'
    return 'idle'
  }

  // “Last seen” string from timestamp
  const getLastSeen = (card) => {
    const ts = getTimestampMs(card)
    if (ts == null) return 'Unknown'
    const minutes = Math.floor((Date.now() - ts) / 60000)
    if (minutes < 1) return 'Live'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  // Filter + sort
  const filteredAndSortedCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const filtered = vehicleCards.filter((card) => {
      const plate = (card?.plate || '').toLowerCase()
      const driver = (card?.live?.DriverName || '').toLowerCase()
      return q ? plate.includes(q) || driver.includes(q) : true
    })

    filtered.sort((a, b) => {
      if (sortBy === 'lastSeen') {
        const at = getTimestampMs(a) ?? -Infinity
        const bt = getTimestampMs(b) ?? -Infinity
        return bt - at // newest first
      }
      if (sortBy === 'speed') {
        const as = Number(a?.live?.Speed ?? 0)
        const bs = Number(b?.live?.Speed ?? 0)
        return bs - as // fastest first
      }
      return 0
    })

    return filtered
  }, [vehicleCards, searchQuery, sortBy])

  // Emit focus event for the map
  const handleCardClick = (plate) => {
    if (!plate) return
    window.dispatchEvent(
      new CustomEvent('fleet:focusPlate', { detail: { plate } })
    )
  }

  // Status badge look
  const getStatusBadge = (status) => {
    const variants = {
      moving: {
        variant: 'default',
        className: 'bg-green-500 hover:bg-green-600',
      },
      idle: {
        variant: 'secondary',
        className: 'bg-yellow-500 hover:bg-yellow-600',
      },
      offline: { variant: 'destructive', className: '' },
    }
    return variants[status] || variants.offline
  }

  if (!Array.isArray(vehicleCards) || vehicleCards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No vehicles to display</h3>
          <p className="text-muted-foreground">
            No vehicles found for this selection.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search + Sort */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by plate or driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastSeen">Last Seen</SelectItem>
                <SelectItem value="speed">Speed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedCards.map((card) => {
              const status = getVehicleStatus(card)
              const lastSeen = getLastSeen(card)
              const statusBadge = getStatusBadge(status)
              const speed = Number(card?.live?.Speed ?? 0)
              const mileage = Number(card?.live?.Mileage ?? 0)
              const driver = card?.live?.DriverName || null
              const zone = card?.live?.Geozone || null
              const addr = card?.live?.Address || null

              return (
                <Card
                  key={card.plate}
                  data-testid={`vehicle-card-${card.plate}`}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleCardClick(card.plate)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-2xl font-mono font-bold">
                        {card.plate}
                      </CardTitle>
                      <Badge {...statusBadge}>{status}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {card.live ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {speed.toFixed(1)} km/h
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground text-xs">
                              {Number.isFinite(mileage)
                                ? mileage.toLocaleString()
                                : '—'}{' '}
                              km
                            </span>
                          </div>
                        </div>

                        {driver && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{driver}</span>
                          </div>
                        )}

                        {zone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Navigation className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {zone}
                            </span>
                          </div>
                        )}

                        {addr && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground line-clamp-2">
                              {addr}
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-border">
                          <span className="text-xs text-muted-foreground">
                            Last seen: {lastSeen}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          No live data available
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
