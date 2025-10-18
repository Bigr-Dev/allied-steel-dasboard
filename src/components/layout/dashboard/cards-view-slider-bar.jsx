'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, User, Gauge, Clock, MapPin } from 'lucide-react'
import { useLiveStore } from '@/config/zustand'

function getTimestampMs(live) {
  if (!live) return null
  if (typeof live.Timestamp === 'number' && Number.isFinite(live.Timestamp))
    return live.Timestamp
  if (typeof live.Time === 'string') {
    const t = Date.parse(live.Time)
    if (Number.isFinite(t)) return t
  }
  if (typeof live.LocTime === 'string') {
    const t = Date.parse(live.LocTime.replace(' ', 'T') + 'Z')
    if (Number.isFinite(t)) return t
  }
  return null
}
function getStatus(live) {
  const ts = getTimestampMs(live)
  const speed = Number(live?.Speed ?? 0)
  if (ts == null) return 'offline'
  const minutes = (Date.now() - ts) / 60000
  if (minutes > 5) return 'offline'
  return speed > 0 ? 'moving' : 'idle'
}
function statusBadge(status) {
  if (status === 'moving')
    return { className: 'bg-green-500 hover:bg-green-600', text: 'moving' }
  if (status === 'idle')
    return { className: 'bg-amber-500 hover:bg-amber-600', text: 'idle' }
  return { className: 'bg-gray-400 hover:bg-gray-500', text: 'offline' }
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

export default function CardsViewSidebar({ vehicleCards = [] }) {
  const [q, setQ] = useState('')
  const liveByPlate = useLiveStore((s) => s.liveByPlate)

  const items = useMemo(() => {
    const withFresh = vehicleCards.map((c) => ({
      ...c,
      live: liveByPlate[c.plate] ?? c.live,
    }))
    const filtered = withFresh.filter((c) => {
      const p = c.plate?.toLowerCase() || ''
      const d = c.live?.DriverName?.toLowerCase?.() || ''
      return q
        ? p.includes(q.toLowerCase()) || d.includes(q.toLowerCase())
        : true
    })
    // newest first
    filtered.sort(
      (a, b) =>
        (getTimestampMs(b.live) ?? -Infinity) -
        (getTimestampMs(a.live) ?? -Infinity)
    )
    return filtered
  }, [vehicleCards, q, liveByPlate])

  const focus = (plate) =>
    window.dispatchEvent(
      new CustomEvent('fleet:focusPlate', { detail: { plate } })
    )

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border bg-card">
        <div className="px-3 py-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="pl-7 h-8 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-2">
        {items.map((item) => {
          const s = getStatus(item.live)
          const b = statusBadge(s)
          const speed = Number(item?.live?.Speed ?? 0)

          return (
            <Card
              key={item.plate}
              className="cursor-pointer hover:shadow-sm"
              onClick={() => focus(item.plate)}
            >
              <CardHeader className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-mono">
                    {item.plate}
                  </CardTitle>
                  <Badge className={`text-[10px] ${b.className}`}>
                    {b.text}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0">
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
                    <div className="text-[11px] text-muted-foreground border-t pt-1">
                      Last seen: {lastSeen(item.live)}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    No live data.
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
