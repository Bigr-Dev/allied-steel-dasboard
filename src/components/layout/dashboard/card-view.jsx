'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, User, Gauge, MapPin, Navigation, Truck } from 'lucide-react'
import { useLiveStore } from '@/config/zustand'
import { useGlobalContext } from '@/context/global-context'
import DetailCard from '@/components/ui/detail-card'
import { Separator } from '@/components/ui/separator'

/**
 * Tunables
 */
const OFFLINE_MIN = 10 // minutes without any packet -> offline
const DELAYED_MIN = 15 // minutes stationary since last movement -> delayed
const DEPOT_COLOR = '#003e69'
const ORDER_EVENT = 'fleet:cardOrder:update' // cross-view sync event

// status keys we expose to the filter
const STATUS_KEYS = [
  'moving',
  'stationary',
  'delayed',
  'depot',
  'offline',
  'unknown',
]

// status priority order (lower number = higher priority)
const STATUS_PRIORITY = {
  delayed: 0, // highest priority - at top
  moving: 1,
  stationary: 2,
  depot: 3,
  offline: 4,
  unknown: 5, // lowest priority - at bottom
}

// last seen filter options (in minutes)
const LAST_SEEN_OPTIONS = [
  { key: 'live', label: 'Live', maxMinutes: 1 },
  { key: '5min', label: '5 min', maxMinutes: 5 },
  { key: '15min', label: '15 min', maxMinutes: 15 },
  { key: '1hour', label: '1 hour', maxMinutes: 60 },
  { key: '1day', label: '1 day', maxMinutes: 1440 },
  { key: 'all', label: 'All', maxMinutes: Infinity },
]

/* --------------------- Utilities --------------------- */

function getTimestampMs(live) {
  if (!live) return null
  // Priority: lowercase ISO e.g. "2025-10-19T10:17:14.982Z"
  if (typeof live.timestamp === 'string') {
    const t = Date.parse(live.timestamp)
    if (Number.isFinite(t)) return t
  }
  // Numeric variants (epoch/ms)
  const numeric = [
    live.TimestampMs,
    live.timestampMs,
    live.ts,
    live.TS,
    live.epoch,
    live.Epoch,
  ].find((v) => Number.isFinite(Number(v)))
  if (numeric != null) return Number(numeric)

  // Other ISO-ish strings
  const isoCandidates = [
    live.Timestamp,
    live.Time,
    live.time,
    live.ReceivedAt,
    live.ServerTime,
    live.PacketTime,
    live.LastSeenAt,
  ].filter(Boolean)
  for (const t of isoCandidates) {
    const p = Date.parse(String(t))
    if (Number.isFinite(p)) return p
  }

  // LocTime "YYYY-MM-DD HH:mm:ss"
  if (typeof live.LocTime === 'string') {
    const tryLocal = Date.parse(live.LocTime.replace(' ', 'T'))
    if (Number.isFinite(tryLocal)) return tryLocal
    const tryUTC = Date.parse(live.LocTime.replace(' ', 'T') + 'Z')
    if (Number.isFinite(tryUTC)) return tryUTC
  }
  return null
}

function getGeoZone(live) {
  const candidates = [live?.Geozone, live?.zone, live?.Head, live?.Quality]
  for (const c of candidates) {
    const s = String(c ?? '').trim()
    if (s) return s
  }
  return ''
}

function isDepot(geo) {
  const s = String(geo || '')
    .trim()
    .toUpperCase()
  return s === 'ASSM' || s === 'ALRODE DEPOT'
}

function deriveStatus(plate, live, lastMoveRef) {
  const now = Date.now()
  const ts = getTimestampMs(live)
  const speed = Number(live?.Speed ?? 0)
  const depot = isDepot(getGeoZone(live))

  if (live && ts == null) {
    if (speed > 0) return { key: 'moving', color: '#10b981', flash: false }
    return { key: 'unknown', color: '#9ca3af', flash: false }
  }

  if (ts == null || (now - ts) / 60000 > OFFLINE_MIN) {
    return { key: 'offline', color: '#9ca3af', flash: false }
  }

  const prevMove = lastMoveRef.current.get(plate) ?? ts
  if (speed > 0) {
    lastMoveRef.current.set(plate, ts)
  } else if (!lastMoveRef.current.has(plate)) {
    lastMoveRef.current.set(plate, prevMove)
  }

  if (depot) return { key: 'depot', color: DEPOT_COLOR, flash: false }

  const lastMoveTs = lastMoveRef.current.get(plate) ?? ts
  const minutesSinceMove = (now - lastMoveTs) / 60000
  if (speed === 0 && minutesSinceMove >= DELAYED_MIN) {
    return { key: 'delayed', color: '#f59e0b', flash: true }
  }

  if (speed > 0) return { key: 'moving', color: '#10b981', flash: false }
  return { key: 'stationary', color: '#ef4444', flash: false }
}

function lastSeen(live) {
  const ts = getTimestampMs(live)
  if (ts == null) return 'Unknown'
  const d = Date.now() - ts
  if (d < 60_000) return 'Live'
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return `${Math.floor(d / 86_400_000)}d ago`
}

// normalise suburb_name with common typos
function getSuburbName(c) {
  return c?.suburb_name ?? c?.surburb_name ?? c?.subrub_name ?? ''
}

/* ---------------- Persistent order (per plan) ---------------- */

function usePersistentOrder(planId) {
  const key = `fleet:cardOrder:${planId || 'all'}`
  const [order, setOrder] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(key)
      const arr = raw ? JSON.parse(raw) : []
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  })

  // listen for cross-view updates
  useEffect(() => {
    const handler = (e) => {
      const { key: evtKey, order: arr } = e.detail || {}
      if (evtKey === key && Array.isArray(arr)) setOrder(arr)
    }
    window.addEventListener(ORDER_EVENT, handler)
    return () => window.removeEventListener(ORDER_EVENT, handler)
  }, [key])

  const saveOrder = (arr) => {
    try {
      localStorage.setItem(key, JSON.stringify(arr))
      setOrder(arr)
      window.dispatchEvent(
        new CustomEvent(ORDER_EVENT, { detail: { key, order: arr } })
      )
    } catch {}
  }

  return [order, saveOrder]
}

/* ---------------- Component ---------------- */

export default function CardView({
  vehicleCards = [],
  selectedPlanId = 'all',
  assignedUnits = [],
}) {
  const { onEdit } = useGlobalContext()
  const [q, setQ] = useState('')
  const liveByPlate = useLiveStore((s) => s.liveByPlate)
  const lastMoveRef = useRef(new Map()) // plate -> timestamp(ms)
  const prevOrderRef = useRef(new Map()) // plate -> last on-screen index (stability tiebreaker)
  const sortBy = 'lastSeen' // or 'speed'

  // status filter state
  const [statusFilter, setStatusFilter] = useState(new Set(STATUS_KEYS))

  // last seen filter state
  const [lastSeenFilter, setLastSeenFilter] = useState('all')

  // persistent order (shared across views via localStorage + event)
  const [savedOrder, setSavedOrder] = usePersistentOrder(selectedPlanId)

  // drag state
  const dragFrom = useRef(null) // plate being dragged

  // Index assigned plan units by plate (horse or rigid)
  const unitByPlate = useMemo(() => {
    const map = new Map()
    for (const u of assignedUnits || []) {
      const plate = u?.vehicle?.plate?.trim()?.toUpperCase?.()
      if (plate) {
        map.set(plate, u)
      }
    }
    return map
  }, [assignedUnits])

  // Merge live + derive status, then filter by search + status
  const augmented = useMemo(() => {
    const query = q.trim().toLowerCase()
    return vehicleCards
      .map((c) => {
        const live = liveByPlate[c.plate] ?? c.live
        const status = deriveStatus(c.plate, live, lastMoveRef)
        return { ...c, live, __status: status }
      })
      .filter((card) => {
        const plate = (card?.plate || '').toLowerCase()
        const driver = (card?.live?.DriverName || '').toLowerCase()
        const textOk = query
          ? plate.includes(query) || driver.includes(query)
          : true
        const statusOk = statusFilter.has(card.__status.key)

        // last seen filter
        const lastSeenOk = (() => {
          if (lastSeenFilter === 'all') return true
          const option = LAST_SEEN_OPTIONS.find((o) => o.key === lastSeenFilter)
          if (!option) return true

          const ts = getTimestampMs(card.live)
          if (ts == null) return lastSeenFilter === 'all'

          const minutesAgo = (Date.now() - ts) / 60000
          return minutesAgo <= option.maxMinutes
        })()

        return textOk && statusOk && lastSeenOk
      })
  }, [vehicleCards, q, liveByPlate, statusFilter, lastSeenFilter])

  // Apply status-based grouping with stable ordering
  const cards = useMemo(() => {
    const orderMap = new Map(savedOrder.map((p, i) => [p, i]))
    const arr = [...augmented]

    // Group by status first
    const statusGroups = new Map()
    for (const card of arr) {
      const status = card.__status.key
      if (!statusGroups.has(status)) {
        statusGroups.set(status, [])
      }
      statusGroups.get(status).push(card)
    }

    // Sort each status group internally
    for (const [status, cards] of statusGroups) {
      cards.sort((a, b) => {
        // 1) Saved order within status group
        const ai = orderMap.has(a.plate) ? orderMap.get(a.plate) : Infinity
        const bi = orderMap.has(b.plate) ? orderMap.get(b.plate) : Infinity
        if (ai !== bi) return ai - bi

        // 2) Stability tiebreaker (previous on-screen order)
        const aPrev = prevOrderRef.current.get(a.plate) ?? Infinity
        const bPrev = prevOrderRef.current.get(b.plate) ?? Infinity
        if (aPrev !== bPrev) return aPrev - bPrev

        // 3) Deterministic fallback
        return String(a.plate).localeCompare(String(b.plate))
      })
    }

    // Combine groups in priority order
    const result = []
    const sortedStatuses = Object.keys(STATUS_PRIORITY).sort(
      (a, b) => STATUS_PRIORITY[a] - STATUS_PRIORITY[b]
    )

    for (const status of sortedStatuses) {
      if (statusGroups.has(status)) {
        result.push(...statusGroups.get(status))
      }
    }

    // Remember visual order for stability
    prevOrderRef.current = new Map(result.map((c, i) => [c.plate, i]))
    return result
  }, [augmented, savedOrder])

  const focus = (plate) =>
    window.dispatchEvent(
      new CustomEvent('fleet:focusPlate', { detail: { plate } })
    )

  // --- Status filter UI helpers
  const allSelected = statusFilter.size === STATUS_KEYS.length
  const toggleAll = () =>
    setStatusFilter(allSelected ? new Set() : new Set(STATUS_KEYS))
  const toggleOne = (k) =>
    setStatusFilter((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  const statusLabel = {
    moving: 'Moving',
    stationary: 'Stationary',
    delayed: 'Delayed',
    depot: 'Depot',
    offline: 'Offline',
    unknown: 'Unknown',
  }

  // --- DnD handlers (HTML5)
  const onDragStart = (plate) => (e) => {
    dragFrom.current = plate
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', plate)
  }
  const onDragOver = (plate) => (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const onDrop = (plate) => (e) => {
    e.preventDefault()
    const from = dragFrom.current || e.dataTransfer.getData('text/plain')
    const to = plate
    dragFrom.current = null
    if (!from || !to || from === to) return

    // Build next order from current rendered order
    const current = cards.map((c) => c.plate)
    const next = current.filter((p) => p !== from)
    const toIndex = next.indexOf(to)
    next.splice(toIndex, 0, from)

    setSavedOrder(next)
  }

  return (
    <div className="h-full flex flex-col mt-0 space-y-6">
      {/* Search + Status filter row */}

      <DetailCard>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search plate or driver…"
            className="pl-8 h-8 "
          />
        </div>
        <div className=" space-y-4 flex justify-between mt-4">
          {/* Status filter chips */}
          <div className="space-y-2 ">
            {/* <div className="text-xs font-medium text-muted-foreground">
              Status
            </div> */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant={allSelected ? 'default' : 'outline'}
                size="sm"
                className="h-7"
                onClick={toggleAll}
              >
                All
              </Button>
              {STATUS_KEYS.map((k) => (
                <Button
                  key={k}
                  type="button"
                  size="sm"
                  variant={statusFilter.has(k) ? 'default' : 'outline'}
                  className="h-7"
                  onClick={() => toggleOne(k)}
                  title={statusLabel[k]}
                >
                  {statusLabel[k]}
                </Button>
              ))}
            </div>
          </div>

          {/* Last seen filter */}
          <div className="space-y-2 ">
            {/* <div className="text-xs font-medium text-muted-foreground">
              Last Seen
            </div> */}
            <div className="flex flex-wrap items-center gap-1.5">
              {LAST_SEEN_OPTIONS.map((option) => (
                <Button
                  key={option.key}
                  type="button"
                  size="sm"
                  variant={
                    lastSeenFilter === option.key ? 'default' : 'outline'
                  }
                  className="h-7"
                  onClick={() => setLastSeenFilter(option.key)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <Separator />

        {/* Grid of cards (draggable) */}
        <div className="flex-1 overflow-auto py-4 px-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {cards.map((item) => {
              const s = item.__status
              const badgeStyle = {
                backgroundColor: s.color,
                animation: s.flash
                  ? 'pulse 1s ease-in-out infinite'
                  : undefined,
              }
              const speed = Number(item?.live?.Speed ?? 0)
              const unit = unitByPlate.get(String(item.plate).toUpperCase())

              const showPlanContext =
                selectedPlanId && selectedPlanId !== 'all' && unit
              const geozone = getGeoZone(item.live)

              const branchName =
                item?.branch_name ||
                item?.branch ||
                unit?.branch_name ||
                unit?.branch ||
                'Branch'

              const customerObjs = (unit?.orders || [])
                .map((order) => ({
                  customer_name: order.customer_name,
                  customer_id: order.customer_id,
                  customer_bp_code: order.customer_bp_code,
                  suburb_name: order.suburb_name,
                  address: order.address,
                  ...order,
                }))
                .filter((c) => c.customer_name)
              const uniqueCustomers = Array.from(
                new Map(
                  customerObjs.map((c) => [
                    String(c.customer_name || '').trim(),
                    c,
                  ])
                ).values()
              )

              return (
                <Card
                  key={item.plate}
                  className="cursor-grab hover:shadow-sm"
                  draggable
                  onDragStart={onDragStart(item.plate)}
                  onDragOver={onDragOver(item.plate)}
                  onDrop={onDrop(item.plate)}
                  // onClick={() => focus(item.plate)}
                  onClick={() => {
                    // Prepare customer data with coordinates if available
                    const customersWithCoords = uniqueCustomers.map(
                      (customer) => {
                        const name = String(customer.customer_name || '').trim()
                        const suburb = String(getSuburbName(customer)).trim()

                        // You can add geocoded coordinates here if you have them
                        // For now, we'll include the raw customer data
                        return {
                          ...customer,
                          display_name: name,
                          suburb: suburb,
                          // coordinates: null // Add geocoded coords here if available
                        }
                      }
                    )

                    //  console.log('data :>> ', unit)

                    onEdit({
                      id: item.plate,
                      selectedPlanId: selectedPlanId,
                      vehicleData: item,
                      unitData: unit,
                      customersData: customersWithCoords,
                      branchName: branchName,
                    })
                  }}
                >
                  <CardHeader className="py-2 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-mono">
                        {item.plate}
                      </CardTitle>
                      <Badge
                        style={badgeStyle}
                        className="text-[10px] capitalize"
                      >
                        {s.key}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="px-3 pb-3 pt-0">
                    {/* Live block */}
                    {item.live ? (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">
                            {speed.toFixed(1)} km/h
                          </span>
                        </div>

                        {item.live.DriverName && (
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{item.live.DriverName}</span>
                          </div>
                        )}

                        {item.live.Address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                            <span className="text-[11px] text-muted-foreground line-clamp-2">
                              {item.live.Address}
                            </span>
                          </div>
                        )}

                        {geozone && (
                          <div className="flex items-center gap-2">
                            <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground">
                              {geozone}
                            </span>
                          </div>
                        )}

                        <div className="text-[11px] text-muted-foreground border-t pt-1">
                          Last seen: {lastSeen(item.live)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        No live data.
                      </div>
                    )}

                    {/* Plan context */}
                    {showPlanContext && (
                      <div className="mt-2 border-t pt-2 space-y-2">
                        {unit?.horse && unit?.trailer && (
                          <div className="flex items-center gap-2 text-xs">
                            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Trailer:{' '}
                              <span className="font-medium">
                                {unit.trailer.plate}
                              </span>
                              {unit.trailer.fleet_number
                                ? ` (${unit.trailer.fleet_number})`
                                : ''}
                            </span>
                          </div>
                        )}

                        {/* Route strip: Branch -> customers -> Branch */}
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {branchName}
                          </Badge>

                          {uniqueCustomers.length === 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              No customers
                            </Badge>
                          )}
                          {uniqueCustomers.map((c, idx) => {
                            const name =
                              String(c.customer_name || '').trim() ||
                              `Customer ${idx + 1}`
                            const suburb = String(getSuburbName(c)).trim()
                            const match =
                              suburb &&
                              geozone &&
                              suburb.toUpperCase() === geozone.toUpperCase()
                            const cls = match
                              ? 'bg-green-600 text-white hover:bg-green-600'
                              : 'bg-muted text-foreground hover:bg-muted'
                            return (
                              <Badge
                                key={name + idx}
                                className={`text-[10px] ${cls}`}
                              >
                                {name}
                              </Badge>
                            )
                          })}

                          <Badge variant="secondary" className="text-[10px]">
                            {branchName}
                          </Badge>
                        </div>

                        {unit?.driver_name &&
                          unit?.driver_name !== item?.live?.DriverName && (
                            <div className="flex items-center gap-2 text-xs">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Planned driver:{' '}
                                <span className="font-medium">
                                  {unit.driver_name}
                                </span>
                              </span>
                            </div>
                          )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </DetailCard>

      {/* simple pulse keyframes */}
      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.45;
          }
        }
      `}</style>
    </div>
  )
}
