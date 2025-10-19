// 'use client'

// import React, { useEffect, useMemo, useRef, useState } from 'react'
// import mapboxgl from 'mapbox-gl'
// import 'mapbox-gl/dist/mapbox-gl.css'
// import { Card } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import { User, Gauge, Clock, MapPin } from 'lucide-react'

// // --- helpers (same timestamp rules you used before) ---
// function getTimestampMs(live) {
//   if (!live) return null
//   if (typeof live.Timestamp === 'number' && Number.isFinite(live.Timestamp))
//     return live.Timestamp
//   if (typeof live.Time === 'string') {
//     const t = Date.parse(live.Time)
//     if (Number.isFinite(t)) return t
//   }
//   if (typeof live.timestamp === 'string') {
//     const t = Date.parse(live.timestamp)
//     if (Number.isFinite(t)) return t
//   }
//   if (typeof live.LocTime === 'string') {
//     const t = Date.parse(live.LocTime.replace(' ', 'T') + 'Z')
//     if (Number.isFinite(t)) return t
//   }
//   return null
// }
// function getStatus(live) {
//   const ts = getTimestampMs(live)
//   const speed = Number(live?.Speed ?? 0)
//   if (ts == null) return 'offline'
//   const minutes = (Date.now() - ts) / 60000
//   if (minutes > 5) return 'offline'
//   return speed > 0 ? 'moving' : 'idle'
// }
// function statusColor(s) {
//   if (s === 'moving') return '#10b981' // emerald-500
//   if (s === 'idle') return '#eab308' // amber-500
//   return '#9ca3af' // gray-400
// }
// function lastSeen(live) {
//   const ts = getTimestampMs(live)
//   if (ts == null) return 'Unknown'
//   const d = Date.now() - ts
//   if (d < 60_000) return 'Live'
//   if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
//   if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
//   return `${Math.floor(d / 86_400_000)}d ago`
// }

// // --- marker element that matches old-dashboard look ---
// function createVehicleMarkerEl(color, pulsing = false) {
//   const outer = document.createElement('div')
//   outer.className = 'marker-outer relative'
//   outer.style.width = '24px'
//   outer.style.height = '24px'
//   outer.style.pointerEvents = 'auto'

//   if (pulsing) {
//     const pulse = document.createElement('div')
//     pulse.className = 'absolute -top-1 -left-1 w-8 h-8 rounded-full'
//     pulse.style.background = color
//     pulse.style.opacity = '0.25'
//     pulse.style.animation = 'ping 1.2s cubic-bezier(0,0,.2,1) infinite'
//     outer.appendChild(pulse)
//   }

//   const inner = document.createElement('div')
//   inner.className =
//     'marker-inner relative w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center'
//   inner.style.background = color
//   inner.innerHTML = `
//     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
//       <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
//       <circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>
//     </svg>
//   `
//   outer.appendChild(inner)
//   return outer
// }

// export default function MapViewMapbox({
//   vehicleCards = [],
//   initialViewport = { latitude: -26.2041, longitude: 28.0473, zoom: 9 },
// }) {
//   const containerRef = useRef(null)
//   const markersRef = useRef(new Map())
//   const [focusPlate, setFocusPlate] = useState('')
//   const [map, setMap] = useState(null)

//   const OFFLINE_MIN = 5
//   const DELAYED_MIN = 15
//   const DEPOT_COLOR = '#003e69'
//   const lastMoveRef = useRef(new Map()) // plate -> ts

//   function isDepot(geo) {
//     const s = String(geo || '')
//       .trim()
//       .toUpperCase()
//     return s === 'ASSM' || s === 'ALRODE DEPOT'
//   }

//   function deriveStatusForMap(plate, live) {
//     const now = Date.now()
//     const ts = getTimestampMs(live)
//     const speed = Number(live?.Speed ?? 0)

//     if (ts == null || (now - ts) / 60000 > OFFLINE_MIN)
//       return { key: 'offline', color: '#9ca3af', flash: false }
//     if (isDepot(live?.Geozone))
//       return { key: 'depot', color: DEPOT_COLOR, flash: false }

//     const prevMove = lastMoveRef.current.get(plate) ?? ts
//     if (speed > 0) lastMoveRef.current.set(plate, ts)
//     else if (!lastMoveRef.current.has(plate))
//       lastMoveRef.current.set(plate, prevMove)

//     const lastMoveTs = lastMoveRef.current.get(plate) ?? ts
//     const minutesSinceMove = (now - lastMoveTs) / 60000
//     if (speed === 0 && minutesSinceMove >= DELAYED_MIN)
//       return { key: 'delayed', color: '#f59e0b', flash: true }

//     if (speed > 0) return { key: 'moving', color: '#10b981', flash: false }
//     return { key: 'stationary', color: '#ef4444', flash: false }
//   }

//   // Resize when container size changes (sidebar open/close)
//   useEffect(() => {
//     if (!map || !containerRef.current) return
//     const ro = new ResizeObserver(() => {
//       try {
//         map.resize()
//       } catch {}
//     })
//     ro.observe(containerRef.current)
//     return () => ro.disconnect()
//   }, [map])

//   // Also listen for explicit “please resize” broadcasts + window events
//   useEffect(() => {
//     if (!map) return
//     const handler = () => {
//       try {
//         map.resize()
//       } catch {}
//     }
//     window.addEventListener('fleet:map:resize', handler)
//     window.addEventListener('orientationchange', handler)
//     window.addEventListener('resize', handler)
//     return () => {
//       window.removeEventListener('fleet:map:resize', handler)
//       window.removeEventListener('orientationchange', handler)
//       window.removeEventListener('resize', handler)
//     }
//   }, [map])

//   // compute valid vehicles
//   const valid = useMemo(
//     () =>
//       vehicleCards.filter(
//         (c) =>
//           c?.live &&
//           Number.isFinite(Number(c.live.Latitude)) &&
//           Number.isFinite(Number(c.live.Longitude))
//       ),
//     [vehicleCards]
//   )

//   // focus event (from cards)
//   useEffect(() => {
//     const handler = (e) => {
//       const plate = e?.detail?.plate
//       if (!plate) return
//       const card = valid.find((v) => v.plate === plate)
//       if (card) setFocusPlate(plate)
//     }
//     window.addEventListener('fleet:focusPlate', handler)
//     return () => window.removeEventListener('fleet:focusPlate', handler)
//   }, [valid])

//   // init mapbox
//   useEffect(() => {
//     if (typeof window !== 'undefined' && !map) {
//       import('mapbox-gl').then((mod) => {
//         const mapboxgl = mod.default
//         mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

//         if (containerRef.current) containerRef.current.innerHTML = ''

//         const mapInstance = new mapboxgl.Map({
//           container: containerRef.current, // ✅ attach to the real div
//           style: 'mapbox://styles/mapbox/streets-v12',
//           center: [28.1396, -26.3071],
//           zoom: 10,
//         })

//         mapInstance.on('load', () => setMap(mapInstance))
//       })
//     }
//   }, [map])

//   // add/update markers + popups
//   useEffect(() => {
//     if (!map) return

//     // 1) Build the “next” set of plates that should be on the map
//     const valid = Array.isArray(vehicleCards)
//       ? vehicleCards.filter(
//           (c) =>
//             c?.live &&
//             Number.isFinite(Number(c.live.Latitude)) &&
//             Number.isFinite(Number(c.live.Longitude))
//         )
//       : []

//     const nextPlates = new Set(
//       valid.map((c) => String(c.plate || '').toUpperCase())
//     )

//     // 2) Remove stale markers (those not present anymore)
//     for (const [plate, m] of markersRef.current.entries()) {
//       if (!nextPlates.has(plate)) {
//         try {
//           m.remove()
//         } catch {}
//         markersRef.current.delete(plate)
//       }
//     }

//     // 3) Add/update the current markers
//     for (const card of valid) {
//       const plate = String(card.plate || '').toUpperCase()
//       const lat = Number(card.live.Latitude)
//       const lng = Number(card.live.Longitude)
//       if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

//       const {
//         key: statusKey,
//         color,
//         flash,
//       } = deriveStatusForMap(plate, card.live)

//       let marker = markersRef.current.get(plate)
//       if (!marker) {
//         const el = makeMarkerEl(color, flash) // pass color + flash
//         marker = new mapboxgl.Marker({ element: el })
//           .setLngLat([lng, lat])
//           .addTo(map)
//         marker.setPopup(
//           new mapboxgl.Popup({ closeButton: true, offset: 12 }).setHTML(
//             buildPopupHTML(plate, card)
//           )
//         )
//         el.addEventListener('click', () => {
//           marker?.togglePopup()
//           window.dispatchEvent(
//             new CustomEvent('fleet:focusPlate', { detail: { plate } })
//           )
//         })
//         markersRef.current.set(plate, marker)
//       } else {
//         marker.setLngLat([lng, lat])
//         const el = marker.getElement()
//         const inner = el?.querySelector?.('.marker-inner')
//         if (inner) inner.style.background = color
//         el.style.animation = flash ? 'pulse 1s ease-in-out infinite' : 'none'
//       }

//     }
//   }, [map, vehicleCards, selectedPlanId])

//   // fly to focused plate
//   useEffect(() => {
//     // const map = mapRef.current
//     if (!map || !focusPlate) return
//     const m = markersRef.current.get(focusPlate)
//     if (m) {
//       const ll = m.getLngLat()
//       map.flyTo({ center: [ll.lng, ll.lat], zoom: 14, duration: 900 })
//     }
//   }, [focusPlate])

//   return (
//     <div className="absolute top-0 z-0 h-full w-full ">
//       <div
//         ref={containerRef}
//         className="w-full h-full"
//         style={{ minHeight: '100%' }}
//       />
//       {valid.length === 0 && (
//         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//           <Card className="p-6 bg-background/95 backdrop-blur">
//             <p className="text-muted-foreground">
//               No vehicles with location data to display
//             </p>
//           </Card>
//         </div>
//       )}
//       <style jsx global>{`
//         @keyframes ping {
//           0% {
//             transform: scale(1);
//             opacity: 0.8;
//           }
//           80%,
//           100% {
//             transform: scale(1.6);
//             opacity: 0;
//           }
//         }
//         @keyframes pulse {
//           0%,
//           100% {
//             opacity: 1;
//           }
//           50% {
//             opacity: 0.45;
//           }
//         }
//         .mapboxgl-popup-content {
//           border-radius: 8px;
//           box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
//           padding: 0;
//         }
//       `}</style>
//     </div>
//   )
// }

// /* ---------- helpers ---------- */

// function makeMarkerEl(color, flash) {
//   const outer = document.createElement('div')
//   outer.className = 'marker-outer'
//   outer.style.width = '24px'
//   outer.style.height = '24px'
//   outer.style.pointerEvents = 'auto'
//   outer.style.animation = flash ? 'pulse 1s ease-in-out infinite' : 'none'

//   const inner = document.createElement('div')
//   inner.className = 'marker-inner'
//   inner.style.cssText = `width:24px;height:24px;border-radius:9999px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.2);background:${color}`
//   outer.appendChild(inner)
//   return outer
// }

// function buildPopupHTML(plate, card) {
//   const live = card?.live || {}
//   const speed = Number(live.Speed ?? 0).toFixed(1)
//   const driver = live.DriverName
//     ? `<div class="mt-1 text-sm"><strong>Driver:</strong> ${live.DriverName}</div>`
//     : ''
//   const addr = live.Address
//     ? `<div class="mt-1 text-xs text-gray-600">${live.Address}</div>`
//     : ''
//   return `
//     <div class="p-2 min-w-[220px]">
//       <div class="flex items-center justify-between mb-2">
//         <h3 class="font-mono font-bold text-lg">${plate}</h3>
//         <span class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium" style="background:#9ca3af;color:white">live</span>
//       </div>
//       <div class="space-y-1 text-sm">
//         <div><strong>Speed:</strong> ${speed} km/h</div>
//         ${driver}
//         ${addr}
//       </div>
//     </div>
//   `
// }

'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'

// We’ll lazy-load the library to avoid SSR issues
let Mapbox
async function getMapbox() {
  if (!Mapbox) {
    const mod = await import('mapbox-gl')
    Mapbox = mod.default
  }
  return Mapbox
}

/* ---------------- timestamp + status helpers ---------------- */
function getTimestampMs(live) {
  if (!live) return null
  if (typeof live.timestamp === 'string') {
    const t = Date.parse(live.timestamp)
    if (Number.isFinite(t)) return t
  }
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
const OFFLINE_MIN = 5
const DELAYED_MIN = 15
const DEPOT_COLOR = '#003e69'

function isDepot(geo) {
  const s = String(geo || '')
    .trim()
    .toUpperCase()
  return s === 'ASSM' || s === 'ALRODE DEPOT'
}

function deriveStatusForMap(plate, live, lastMoveRef) {
  const now = Date.now()
  const ts = getTimestampMs(live)
  const speed = Number(live?.Speed ?? 0)

  if (ts == null || (now - ts) / 60000 > OFFLINE_MIN)
    return { key: 'offline', color: '#9ca3af', flash: false }
  if (isDepot(live?.Geozone))
    return { key: 'depot', color: DEPOT_COLOR, flash: false }

  const prevMove = lastMoveRef.current.get(plate) ?? ts
  if (speed > 0) lastMoveRef.current.set(plate, ts)
  else if (!lastMoveRef.current.has(plate))
    lastMoveRef.current.set(plate, prevMove)

  const lastMoveTs = lastMoveRef.current.get(plate) ?? ts
  const minutesSinceMove = (now - lastMoveTs) / 60000
  if (speed === 0 && minutesSinceMove >= DELAYED_MIN)
    return { key: 'delayed', color: '#f59e0b', flash: true }

  if (speed > 0) return { key: 'moving', color: '#10b981', flash: false }
  return { key: 'stationary', color: '#ef4444', flash: false }
}

function makeMarkerEl(color, flash) {
  const outer = document.createElement('div')
  outer.className = 'marker-outer'
  outer.style.width = '24px'
  outer.style.height = '24px'
  outer.style.pointerEvents = 'auto'
  outer.style.animation = flash ? 'pulse 1s ease-in-out infinite' : 'none'

  const inner = document.createElement('div')
  inner.className = 'marker-inner'
  inner.style.cssText = `width:24px;height:24px;border-radius:9999px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.2);background:${color}`
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

function once(map, evt) {
  return new Promise((resolve) => {
    const handler = () => {
      map.off(evt, handler)
      resolve()
    }
    map.on(evt, handler)
  })
}

// Wait until the style is actually ready to accept sources/layers
async function waitForStyleReady(map) {
  if (!map) return
  // If the map has loaded & style is ready, good to go
  if (map.loaded() && map.isStyleLoaded()) return
  // Otherwise, wait for a style-related event cycle to complete
  // 'load' -> style/parsing, 'styledata' -> style changed, 'idle' -> all tiles/layers have finished updating
  await Promise.race([
    once(map, 'load'),
    once(map, 'styledata'),
    once(map, 'idle'),
  ])
  // If still not ready, wait for idle which indicates style graph settled
  if (!map.isStyleLoaded()) {
    await once(map, 'idle')
  }
}

/* ---------------- geocoding + route helpers ---------------- */
function normalizeName(s) {
  return String(s || '').trim()
}

function unitForPlate(assignedUnits, plate) {
  const P = String(plate || '').toUpperCase()
  for (const u of assignedUnits || []) {
    const h = normalizeName(u?.horse?.plate).toUpperCase()
    const r = normalizeName(u?.rigid?.plate).toUpperCase()
    if (h && h === P) return u
    if (r && r === P) return u
  }
  return null
}

export default function MapViewMapbox({
  vehicleCards = [],
  selectedPlanId = 'all',
  assignedUnits = [],
  initialViewport = { latitude: -26.2041, longitude: 28.0473, zoom: 9 },
  refreshKey = 0,
}) {
  const routeRefreshQueued = useRef(false)
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map()) // plate -> Marker
  const routeIdsRef = useRef(new Set()) // layer/source ids to cleanup
  const lastMoveRef = useRef(new Map()) // plate -> ts
  const geocodeCacheRef = useRef(new Map()) // text -> [lng,lat]
  const [focusPlate, setFocusPlate] = useState('')

  // Compute valid vehicles (with lat/lng)
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

  // Focus event from cards
  useEffect(() => {
    const handler = (e) => {
      const plate = e?.detail?.plate
      if (!plate) return
      const card = validVehicles.find((v) => v.plate === plate)
      if (card) setFocusPlate(String(plate).toUpperCase())
    }
    window.addEventListener('fleet:focusPlate', handler)
    return () => window.removeEventListener('fleet:focusPlate', handler)
  }, [validVehicles])

  /* ------------ mount map (with cleanup + visibility/resize care) ------------ */
  useEffect(() => {
    let disposed = false
    ;(async () => {
      const mapboxgl = await getMapbox()
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

      if (!containerRef.current) return
      containerRef.current.innerHTML = ''

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [
          initialViewport.longitude ?? 28.1396,
          initialViewport.latitude ?? -26.3071,
        ],
        zoom: initialViewport.zoom ?? 10,
      })
      mapRef.current = map

      // Visibility/resize lifecycles
      const onResize = () => {
        try {
          map.resize()
        } catch {}
      }
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onResize()
          // Nudge a redraw by re-setting each marker’s position
          for (const m of markersRef.current.values()) {
            try {
              const ll = m.getLngLat()
              m.setLngLat(ll)
            } catch {}
          }
        }
      })
      io.observe(containerRef.current)

      const vis = () => onResize()
      window.addEventListener('visibilitychange', vis)
      window.addEventListener('fleet:map:resize', onResize)
      window.addEventListener('orientationchange', onResize)
      window.addEventListener('resize', onResize)

      map.on('styledata', () => {
        // Queue one refresh after the style settles
        if (routeRefreshQueued.current) return
        routeRefreshQueued.current = true
        requestAnimationFrame(async () => {
          routeRefreshQueued.current = false
          await refreshRoutes()
        })
      })

      map.on('load', () => {
        if (disposed) return
        // initial draw
        drawMarkers()
        refreshRoutes()
      })

      function cleanup() {
        try {
          for (const m of markersRef.current.values()) {
            try {
              m.remove()
            } catch {}
          }
          markersRef.current.clear()
          // remove route layers/sources
          if (map) {
            for (const id of routeIdsRef.current) {
              try {
                map.removeLayer(id)
              } catch {}
              try {
                map.removeSource(id)
              } catch {}
            }
            routeIdsRef.current.clear()
          }
          io.disconnect()
          window.removeEventListener('visibilitychange', vis)
          window.removeEventListener('fleet:map:resize', onResize)
          window.removeEventListener('orientationchange', onResize)
          window.removeEventListener('resize', onResize)
          map?.remove()
        } catch {}
        mapRef.current = null
      }

      // component unmount
      return () => {
        disposed = true
        cleanup()
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]) // remount map if you change refreshKey

  /* -------------------- draw/update markers -------------------- */
  function drawMarkers() {
    const map = mapRef.current
    if (!map) return

    // Build next set of plates currently valid
    const nextPlates = new Set(
      validVehicles.map((c) => String(c.plate || '').toUpperCase())
    )

    // Remove stale markers
    for (const [plate, m] of markersRef.current.entries()) {
      if (!nextPlates.has(plate)) {
        try {
          m.remove()
        } catch {}
        markersRef.current.delete(plate)
      }
    }

    // Add/update markers
    for (const card of validVehicles) {
      const plate = String(card.plate || '').toUpperCase()
      const lat = Number(card.live.Latitude)
      const lng = Number(card.live.Longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

      const { key, color, flash } = deriveStatusForMap(
        plate,
        card.live,
        lastMoveRef
      )
      let marker = markersRef.current.get(plate)
      if (!marker) {
        const el = makeMarkerEl(color, flash)
        marker = new Mapbox.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map)
        marker.setPopup(
          new Mapbox.Popup({ closeButton: true, offset: 12 }).setHTML(
            buildPopupHTML(plate, card)
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
        const el = marker.getElement()
        const inner = el?.querySelector?.('.marker-inner')
        if (inner) inner.style.background = color
        el.style.animation = flash ? 'pulse 1s ease-in-out infinite' : 'none'
      }
    }
  }

  // Re-draw markers when the inputs change
  useEffect(() => {
    drawMarkers()
  }, [validVehicles, selectedPlanId])

  // Fly to focused plate
  useEffect(() => {
    const map = mapRef.current
    if (!map || !focusPlate) return
    const m = markersRef.current.get(focusPlate)
    if (m) {
      const ll = m.getLngLat()
      map.flyTo({ center: [ll.lng, ll.lat], zoom: 14, duration: 900 })
    }
  }, [focusPlate])

  /* -------------------- route drawing (per plan) -------------------- */
  // Geocode helper (with memory + localStorage caching)
  async function geocode(text) {
    const key = normalizeName(text)
    if (!key) return null

    // in-memory cache
    if (geocodeCacheRef.current.has(key))
      return geocodeCacheRef.current.get(key)

    // localStorage cache
    const lsKey = `fleet:geocode:${key}`
    try {
      const fromLs = localStorage.getItem(lsKey)
      if (fromLs) {
        const val = JSON.parse(fromLs)
        geocodeCacheRef.current.set(key, val)
        return val
      }
    } catch {}

    // fetch from Mapbox
    const mapboxgl = await getMapbox()
    const token = mapboxgl.accessToken
    if (!token) return null

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      key
    )}.json?limit=1&access_token=${token}`

    try {
      const res = await fetch(url)
      const json = await res.json()
      const ll = json?.features?.[0]?.center
      if (
        Array.isArray(ll) &&
        Number.isFinite(ll[0]) &&
        Number.isFinite(ll[1])
      ) {
        geocodeCacheRef.current.set(key, ll)
        try {
          localStorage.setItem(lsKey, JSON.stringify(ll))
        } catch {}
        return ll
      }
    } catch {}
    return null
  }

  // Build a route for a single unit (Branch -> customers -> Branch)
  async function buildUnitRouteLL(unit) {
    if (!unit) return null
    const branch =
      unit.branch_name ||
      unit.branch ||
      unit.depot ||
      unit.depot_name ||
      'Depot'

    const customerObjs = Array.from(
      new Map(
        (unit.customers || [])
          .filter(Boolean)
          .map((c) => [String(c.customer_name || '').trim(), c])
      ).values()
    )

    const points = []

    // Branch first
    const branchLL = await geocode(branch)
    if (branchLL) points.push(branchLL)

    // Customers (name first, fall back to suburb)
    for (const c of customerObjs) {
      const name = normalizeName(c.customer_name)
      const suburb = normalizeName(
        c.suburb_name || c.surburb_name || c.subrub_name
      )
      let ll =
        (name && (await geocode(name))) ||
        (suburb && (await geocode(suburb))) ||
        null
      if (ll) points.push(ll)
    }

    // Return to Branch
    if (branchLL) points.push(branchLL)

    // Need at least two points to draw a line
    return points.length >= 2 ? points : null
  }

  function addOrUpdateRoute(id, coords) {
    const map = mapRef.current
    if (!map || !coords || coords.length < 2) return
    if (!map.isStyleLoaded()) return // style not ready yet — caller will try again later

    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: {},
        },
      ],
    }

    if (!map.getSource(id)) {
      map.addSource(id, { type: 'geojson', data: geojson })
      map.addLayer({
        id,
        type: 'line',
        source: id,
        paint: {
          'line-color': '#2563eb',
          'line-width': 3,
          'line-opacity': 0.85,
        },
      })
      routeIdsRef.current.add(id)
    } else {
      const src = map.getSource(id)
      src.setData(geojson)
    }
  }

  function clearAllRoutes() {
    const map = mapRef.current
    if (!map) return
    for (const id of routeIdsRef.current) {
      try {
        map.removeLayer(id)
      } catch {}
      try {
        map.removeSource(id)
      } catch {}
    }
    routeIdsRef.current.clear()
  }

  async function refreshRoutes() {
    const map = mapRef.current
    if (!map) return

    // Ensure style is ready before touching sources/layers
    await waitForStyleReady(map)
    if (!map.isStyleLoaded()) return

    // Clear any previous routes
    clearAllRoutes()

    // Only draw when a plan is selected
    if (!selectedPlanId || selectedPlanId === 'all') return

    // For each visible vehicle with a plan unit, build the route and add it
    for (const card of validVehicles) {
      const unit = unitForPlate(assignedUnits, card.plate)
      if (!unit) continue
      const coords = await buildUnitRouteLL(unit)
      if (coords) {
        const id = `route-${String(card.plate).toUpperCase()}`
        // Double-check the style is still OK after async geocoding
        await waitForStyleReady(map)
        if (!map.isStyleLoaded()) continue
        addOrUpdateRoute(id, coords)
      }
    }
  }

  // Keep routes in sync with inputs
  useEffect(() => {
    let canceled = false
    const run = async () => {
      // let the map mount/layout finish this tick
      await Promise.resolve()
      if (!canceled) await refreshRoutes()
    }
    run()
    return () => {
      canceled = true
    }
  }, [selectedPlanId, assignedUnits, validVehicles])

  // useEffect(() => {
  //   refreshRoutes()
  // }, [selectedPlanId, assignedUnits, validVehicles])

  return (
    <div className="absolute top-0 z-0 h-full w-full ">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '100%' }}
      />
      {validVehicles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="p-6 bg-background/95 backdrop-blur rounded-md shadow">
            <p className="text-muted-foreground">
              No vehicles with location data to display
            </p>
          </div>
        </div>
      )}

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
        .mapboxgl-popup-content {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          padding: 0;
        }
      `}</style>
    </div>
  )
}
