'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Gauge, Clock, MapPin } from 'lucide-react'

// --- helpers (same timestamp rules you used before) ---
function getTimestampMs(live) {
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
function getStatus(live) {
  const ts = getTimestampMs(live)
  const speed = Number(live?.Speed ?? 0)
  if (ts == null) return 'offline'
  const minutes = (Date.now() - ts) / 60000
  if (minutes > 5) return 'offline'
  return speed > 0 ? 'moving' : 'idle'
}
function statusColor(s) {
  if (s === 'moving') return '#10b981' // emerald-500
  if (s === 'idle') return '#eab308' // amber-500
  return '#9ca3af' // gray-400
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

// --- marker element that matches old-dashboard look ---
function createVehicleMarkerEl(color, pulsing = false) {
  const outer = document.createElement('div')
  outer.className = 'marker-outer relative'
  outer.style.width = '24px'
  outer.style.height = '24px'
  outer.style.pointerEvents = 'auto'

  if (pulsing) {
    const pulse = document.createElement('div')
    pulse.className = 'absolute -top-1 -left-1 w-8 h-8 rounded-full'
    pulse.style.background = color
    pulse.style.opacity = '0.25'
    pulse.style.animation = 'ping 1.2s cubic-bezier(0,0,.2,1) infinite'
    outer.appendChild(pulse)
  }

  const inner = document.createElement('div')
  inner.className =
    'marker-inner relative w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center'
  inner.style.background = color
  inner.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
      <circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>
    </svg>
  `
  outer.appendChild(inner)
  return outer
}

export default function MapViewMapbox({
  vehicleCards = [],
  initialViewport = { latitude: -26.2041, longitude: 28.0473, zoom: 9 },
}) {
  const containerRef = useRef(null)
  const markersRef = useRef(new Map())
  const [focusPlate, setFocusPlate] = useState('')
  const [map, setMap] = useState(null)

  // Resize when container size changes (sidebar open/close)
  useEffect(() => {
    if (!map || !containerRef.current) return
    const ro = new ResizeObserver(() => {
      try {
        map.resize()
      } catch {}
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [map])

  // Also listen for explicit “please resize” broadcasts + window events
  useEffect(() => {
    if (!map) return
    const handler = () => {
      try {
        map.resize()
      } catch {}
    }
    window.addEventListener('fleet:map:resize', handler)
    window.addEventListener('orientationchange', handler)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('fleet:map:resize', handler)
      window.removeEventListener('orientationchange', handler)
      window.removeEventListener('resize', handler)
    }
  }, [map])

  // compute valid vehicles
  const valid = useMemo(
    () =>
      vehicleCards.filter(
        (c) =>
          c?.live &&
          Number.isFinite(Number(c.live.Latitude)) &&
          Number.isFinite(Number(c.live.Longitude))
      ),
    [vehicleCards]
  )

  // focus event (from cards)
  useEffect(() => {
    const handler = (e) => {
      const plate = e?.detail?.plate
      if (!plate) return
      const card = valid.find((v) => v.plate === plate)
      if (card) setFocusPlate(plate)
    }
    window.addEventListener('fleet:focusPlate', handler)
    return () => window.removeEventListener('fleet:focusPlate', handler)
  }, [valid])

  // init mapbox
  useEffect(() => {
    if (typeof window !== 'undefined' && !map) {
      import('mapbox-gl').then((mod) => {
        const mapboxgl = mod.default
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

        if (containerRef.current) containerRef.current.innerHTML = ''

        const mapInstance = new mapboxgl.Map({
          container: containerRef.current, // ✅ attach to the real div
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [28.1396, -26.3071],
          zoom: 10,
        })

        mapInstance.on('load', () => setMap(mapInstance))
      })
    }
  }, [map])

  // add/update markers + popups
  useEffect(() => {
    if (!map) return

    // 1) Build the “next” set of plates that should be on the map
    const valid = Array.isArray(vehicleCards)
      ? vehicleCards.filter(
          (c) =>
            c?.live &&
            Number.isFinite(Number(c.live.Latitude)) &&
            Number.isFinite(Number(c.live.Longitude))
        )
      : []

    const nextPlates = new Set(
      valid.map((c) => String(c.plate || '').toUpperCase())
    )

    // 2) Remove stale markers (those not present anymore)
    for (const [plate, m] of markersRef.current.entries()) {
      if (!nextPlates.has(plate)) {
        try {
          m.remove()
        } catch {}
        markersRef.current.delete(plate)
      }
    }

    // 3) Add/update the current markers
    for (const card of valid) {
      const plate = String(card.plate || '').toUpperCase()
      const lat = Number(card.live.Latitude)
      const lng = Number(card.live.Longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

      let marker = markersRef.current.get(plate)
      if (!marker) {
        const el = makeMarkerEl('#10b981') // or your status color
        marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map)

        const popupHtml = buildPopupHTML(plate, card)
        marker.setPopup(
          new mapboxgl.Popup({ closeButton: true, offset: 12 }).setHTML(
            popupHtml
          )
        )

        el.addEventListener('click', () => {
          marker?.togglePopup()
          window.dispatchEvent(
            new CustomEvent('fleet:focusPlate', { detail: { plate } })
          )
        })

        markersRef.current.set(plate, marker)
      } else {
        marker.setLngLat([lng, lat])
      }
    }
  }, [map, vehicleCards, selectedPlanId])

  // useEffect(() => {
  //   //const map = mapRef.current
  //   if (!map || typeof map.getCanvasContainer !== 'function') return

  //   const stillHere = new Set()

  //   for (const card of valid) {
  //     const plate = (card.plate || '').toUpperCase()
  //     const lat = Number(card.live.Latitude)
  //     const lng = Number(card.live.Longitude)
  //     if (!plate || !Number.isFinite(lat) || !Number.isFinite(lng)) continue

  //     stillHere.add(plate)

  //     const status = getStatus(card.live)
  //     const color = statusColor(status)
  //     const ts = getTimestampMs(card.live)
  //     const pulsing = ts != null && Date.now() - ts < 30_000

  //     let marker = markersRef.current.get(plate)
  //     if (!marker) {
  //       const el = createVehicleMarkerEl(color, pulsing)
  //       marker = new mapboxgl.Marker({ element: el })
  //         .setLngLat([lng, lat])
  //         .addTo(map)

  //       // popup content mirrors your Leaflet popup content
  //       const popupHtml = `
  //         <div class=" p-4 min-w-[220px]">
  //           <div class="flex items-center justify-between mb-2">
  //             <h3 class="font-mono font-bold text-lg">${plate}</h3>
  //             <span class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium" style="background:${color};color:white">${status}</span>
  //           </div>
  //           <div class="space-y-1 text-sm">
  //             <div class="flex items-center gap-2">
  //               <span class="inline-flex"><svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M10 17l2-3 2 3"/><path d="M12 2v12"/></svg></span>
  //               <span>${Number(card.live.Speed ?? 0).toFixed(1)} km/h</span>
  //             </div>
  //             ${
  //               card.live.DriverName
  //                 ? `
  //             <div class="flex items-center gap-2">
  //               <span class="inline-flex"><svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" fill="none"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/></svg></span>
  //               <span>${card.live.DriverName}</span>
  //             </div>`
  //                 : ''
  //             }
  //             <div class="flex items-center gap-2">
  //               <span class="inline-flex"><svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M12 8v8"/><path d="M16 12H8"/></svg></span>
  //               <span>${lastSeen(card.live)}</span>
  //             </div>
  //             ${
  //               card.live.Address
  //                 ? `
  //             <div class="flex items-start gap-2 pt-1 border-t mt-2">
  //               <span class="inline-flex mt-0.5"><svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
  //               <span class="text-xs text-muted-foreground">${card.live.Address}</span>
  //             </div>`
  //                 : ''
  //             }
  //           </div>
  //         </div>
  //       `
  //       const popup = new mapboxgl.Popup({
  //         closeButton: true,
  //         offset: 12,
  //       }).setHTML(popupHtml)
  //       marker.setPopup(popup)

  //       // click → open popup & broadcast (optional)
  //       el.addEventListener('click', () => {
  //         marker?.togglePopup()
  //         window.dispatchEvent(
  //           new CustomEvent('fleet:focusPlate', { detail: { plate } })
  //         )
  //       })

  //       markersRef.current.set(plate, marker)
  //     } else {
  //       marker.setLngLat([lng, lat])
  //       // update color/pulse if status changed
  //       const el = marker.getElement()
  //       const inner = el?.querySelector?.('.marker-inner')
  //       if (inner) inner.style.background = color
  //     }
  //   }

  //   // cleanup stale
  //   for (const [plate, marker] of markersRef.current.entries()) {
  //     if (!stillHere.has(plate)) {
  //       marker.remove()
  //       markersRef.current.delete(plate)
  //     }
  //   }
  // }, [valid])

  // fly to focused plate
  useEffect(() => {
    // const map = mapRef.current
    if (!map || !focusPlate) return
    const m = markersRef.current.get(focusPlate)
    if (m) {
      const ll = m.getLngLat()
      map.flyTo({ center: [ll.lng, ll.lat], zoom: 14, duration: 900 })
    }
  }, [focusPlate])

  return (
    <div className="h-full w-full relative">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '100%' }}
      />
      {valid.length === 0 && (
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
        .mapboxgl-popup-content {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          padding: 0;
        }
      `}</style>
    </div>
  )
}

/* ---------- helpers ---------- */

function makeMarkerEl(color) {
  const outer = document.createElement('div')
  outer.className = 'marker-outer'
  outer.style.width = '24px'
  outer.style.height = '24px'
  outer.style.pointerEvents = 'auto'

  const inner = document.createElement('div')
  inner.className = 'marker-inner'
  inner.style.cssText =
    'width:24px;height:24px;border-radius:9999px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.2);background:' +
    color
  outer.appendChild(inner)
  return outer
}

function buildPopupHTML(plate, card) {
  const live = card?.live || {}
  const speed = Number(live.Speed ?? 0).toFixed(1)
  const driver = live.DriverName
    ? `<div class="mt-1 text-sm"><strong>Driver:</strong> ${live.DriverName}</div>`
    : ''
  const addr = live.Address
    ? `<div class="mt-1 text-xs text-gray-600">${live.Address}</div>`
    : ''
  return `
    <div class="p-2 min-w-[220px]">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-mono font-bold text-lg">${plate}</h3>
        <span class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium" style="background:#9ca3af;color:white">live</span>
      </div>
      <div class="space-y-1 text-sm">
        <div><strong>Speed:</strong> ${speed} km/h</div>
        ${driver}
        ${addr}
      </div>
    </div>
  `
}
