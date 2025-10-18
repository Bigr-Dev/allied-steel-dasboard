'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Gauge, Clock, MapPin } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function getTimestampMs(card) {
  const live = card?.live
  if (!live) return null
  if (typeof live.Timestamp === 'number' && Number.isFinite(live.Timestamp))
    return live.Timestamp
  if (typeof live.Time === 'string') {
    const t = Date.parse(live.Time)
    if (Number.isFinite(t)) return t
  }
  if (typeof live.timestamp === 'string') {
    const t = Date.parse(live.timestamp)
    if (Number.isFinite(t)) return t
  }
  if (typeof live.LocTime === 'string') {
    const t = Date.parse(live.LocTime.replace(' ', 'T') + 'Z')
    if (Number.isFinite(t)) return t
  }
  return null
}

function getVehicleStatus(card) {
  const ts = getTimestampMs(card)
  const speed = Number(card?.live?.Speed ?? 0)
  if (ts == null) return 'offline'
  const minutesSince = (Date.now() - ts) / 60000
  if (minutesSince > 5) return 'offline'
  if (speed > 0) return 'moving'
  return 'idle'
}

function getStatusColor(status) {
  if (status === 'moving') return '#10b981' // emerald-500
  if (status === 'idle') return '#eab308' // amber-500
  return '#9ca3af' // gray-400 (offline/default)
}

function getLastSeen(card) {
  const ts = getTimestampMs(card)
  if (ts == null) return 'Unknown'
  const diff = Date.now() - ts
  if (diff < 60000) return 'Live'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function createVehicleIcon(status, isRecent) {
  const color = getStatusColor(status)
  const pulse = isRecent
    ? `<div class="absolute -top-1 -left-1 w-8 h-8 rounded-full" style="background:${color};opacity:.25;animation:ping 1.2s cubic-bezier(0,0,.2,1) infinite"></div>`
    : ''

  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div class="relative">
        ${pulse}
        <div class="relative w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center" style="background:${color};">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
            <circle cx="6.5" cy="16.5" r="2.5"/>
            <circle cx="16.5" cy="16.5" r="2.5"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

function MapController({ focusVehicle }) {
  const map = useMap()
  useEffect(() => {
    if (focusVehicle?.live?.Latitude && focusVehicle?.live?.Longitude) {
      map.flyTo([focusVehicle.live.Latitude, focusVehicle.live.Longitude], 14, {
        duration: 1.2,
      })
    }
  }, [focusVehicle, map])
  return null
}

export default function MapView({
  vehicleCards = [],
  initialViewport = { latitude: -26.2041, longitude: 28.0473, zoom: 9 },
}) {
  const [focusVehicle, setFocusVehicle] = useState(null)

  const validVehicles = useMemo(
    () =>
      vehicleCards.filter(
        (c) =>
          c?.live &&
          Number.isFinite(Number(c.live.Latitude)) &&
          Number.isFinite(Number(c.live.Longitude))
      ),
    [vehicleCards]
  )

  useEffect(() => {
    const handler = (e) => {
      const plate = e?.detail?.plate
      if (!plate) return
      const v = validVehicles.find((x) => x.plate === plate)
      if (v) setFocusVehicle(v)
    }
    window.addEventListener('fleet:focusPlate', handler)
    return () => window.removeEventListener('fleet:focusPlate', handler)
  }, [validVehicles])

  const isRecent = (card) => {
    const ts = getTimestampMs(card)
    return ts != null && Date.now() - ts < 30_000
  }

  return (
    <div className="h-full w-full relative" data-testid="map-view">
      <MapContainer
        center={[initialViewport.latitude, initialViewport.longitude]}
        zoom={initialViewport.zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController focusVehicle={focusVehicle} />

        {validVehicles.map((card) => {
          const status = getVehicleStatus(card)
          return (
            <Marker
              key={card.plate}
              position={[
                Number(card.live.Latitude),
                Number(card.live.Longitude),
              ]}
              icon={createVehicleIcon(status, isRecent(card))}
            >
              <Popup>
                <div className="p-2 min-w-[220px]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-mono font-bold text-lg">
                      {card.plate}
                    </h3>
                    <Badge
                      className="text-xs capitalize"
                      style={{
                        backgroundColor: getStatusColor(status),
                        color: 'white',
                      }}
                    >
                      {status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-3 h-3 text-muted-foreground" />
                      <span>
                        {Number(card.live.Speed ?? 0).toFixed(1)} km/h
                      </span>
                    </div>

                    {card.live.DriverName && (
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span>{card.live.DriverName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>{getLastSeen(card)}</span>
                    </div>

                    {card.live.Address && (
                      <div className="flex items-start gap-2 pt-1 border-t mt-2">
                        <MapPin className="w-3 h-3 text-muted-foreground mt-0.5" />
                        <span className="text-xs text-muted-foreground">
                          {card.live.Address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {validVehicles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Card className="p-6 bg-background/95 backdrop-blur">
            <p className="text-muted-foreground">
              No vehicles with location data to display
            </p>
          </Card>
        </div>
      )}

      <style jsx global>{`
        @keyframes ping {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          80%,
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        .leaflet-container {
          font-family: inherit;
        }
        .custom-vehicle-marker {
          background: transparent;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-content {
          margin: 0;
        }
      `}</style>
    </div>
  )
}
