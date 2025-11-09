'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'

// Lazy-load Mapbox to avoid SSR issues
let Mapbox
async function getMapbox() {
  if (!Mapbox) {
    const mod = await import('mapbox-gl')
    Mapbox = mod.default
  }
  return Mapbox
}

/* ========================== Tunables ========================== */
const OFFLINE_MIN = 5
const DELAYED_MIN = 15
const DEPOT_COLOR = '#003e69'
const ROUTE_PENDING = '#9ca3af'  // Grey for pending segments
const ROUTE_COMPLETED = '#10b981'  // Green for completed segments
const ROUTE_RETURN = '#003e69'  // Company color for return route
const CUSTOMER_COLOR = '#10b981'  // Green for customers
const DIRECTIONS_PROFILE = 'mapbox/driving-traffic' // traffic-aware driving
const DIRECTIONS_GEOMETRY = 'geojson' // we want a GeoJSON LineString
const GEOCODE_LIMIT = 1

// --- Geocoding bias for South Africa ---
const GEOCODE_COUNTRY = 'ZA'
// South Africa bounding box: [minLng,minLat,maxLng,maxLat]
const BBOX_ZA = [16.2817, -34.834, 32.891, -22.125].join(',')

// Haversine distance in KM (quick sanity check)
function haversineKm(a, b) {
  if (!a || !b) return Infinity
  const [lng1, lat1] = a,
    [lng2, lat2] = b
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const s1 = Math.sin(dLat / 2) ** 2
  const s2 =
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s1 + s2))
}

/* ======================== Small utilities ===================== */
function normalizeName(s) {
  return String(s || '').trim()
}

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

function mins(n) {
  return Math.round((Number(n) || 0) / 60)
}
function km(meters) {
  return (Number(meters || 0) / 1000).toFixed(1)
}

function buildPopupHTML(plate, card, eta) {
  const live = card?.live || {}
  const speed = Number(live.Speed ?? 0).toFixed(1)
  const driver = live.DriverName
    ? `<div class="mt-1 text-sm"><strong>Driver:</strong> ${live.DriverName}</div>`
    : ''
  const addr = live.Address
    ? `<div class="mt-1 text-xs text-gray-600">${live.Address}</div>`
    : ''
  const etaRow = eta
    ? `<div class="mt-2 text-sm"><strong>Route ETA:</strong> ${mins(
        eta.duration
      )} min • ${km(eta.distance)} km</div>`
    : ''
  return `
    <div class="p-2 min-w-[240px]">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-mono font-bold text-lg">${plate}</h3>
        <span class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium" style="background:#9ca3af;color:white">live</span>
      </div>
      <div class="space-y-1 text-sm">
        <div><strong>Speed:</strong> ${speed} km/h</div>
        ${driver}
        ${addr}
        ${etaRow}
      </div>
    </div>
  `
}

/* ===================== Mapbox style readiness ================== */
function once(map, evt) {
  return new Promise((resolve) => {
    const handler = () => {
      map.off(evt, handler)
      resolve()
    }
    map.on(evt, handler)
  })
}
async function waitForStyleReady(map) {
  if (!map) return
  if (map.loaded() && map.isStyleLoaded()) return
  await Promise.race([
    once(map, 'load'),
    once(map, 'styledata'),
    once(map, 'idle'),
  ])
  if (!map.isStyleLoaded()) await once(map, 'idle')
}

/* ===================== Unit & geocoding helpers ===================== */

function unitForPlate(assignedUnits, plate) {
  const P = String(plate || '').trim().toUpperCase()
  console.log('🔍 unitForPlate searching for:', P, 'in', assignedUnits?.length, 'units')
  
  for (const u of assignedUnits || []) {
    const h = String(u?.horse?.plate || '').trim().toUpperCase()
    const r = String(u?.rigid?.plate || '').trim().toUpperCase()
    
    console.log('🔍 Checking unit:', { horse: h, rigid: r, customers: u?.customers?.length })
    
    if (h && h === P) {
      console.log('✅ Found unit by horse plate:', h)
      return u
    }
    if (r && r === P) {
      console.log('✅ Found unit by rigid plate:', r)
      return u
    }
  }
  
  console.log('❌ No unit found for plate:', P)
  return null
}

async function geocode(
  mapboxgl,
  cacheRef,
  text,
  biasLL /* [lng,lat] or null */
) {
  const keyRaw = normalizeName(text)
  if (!keyRaw) return null

  // include bias in the cache key so we don't mix results from very different proximities
  const key = biasLL
    ? `${keyRaw}@@${biasLL[0].toFixed(3)},${biasLL[1].toFixed(3)}`
    : keyRaw

  if (cacheRef.current.has(key)) return cacheRef.current.get(key)

  const lsKey = `fleet:geocode:${key}`
  try {
    const fromLs = localStorage.getItem(lsKey)
    if (fromLs) {
      const ll = JSON.parse(fromLs)
      cacheRef.current.set(key, ll)
      return ll
    }
  } catch {}

  const token = mapboxgl.accessToken
  if (!token) return null

  const params = new URLSearchParams({
    limit: String(GEOCODE_LIMIT),
    country: GEOCODE_COUNTRY, // hard-bias to ZA
    bbox: BBOX_ZA, // and to the ZA bounding box
    access_token: token,
    autocomplete: 'false',
    language: 'en',
    types: 'poi,place,locality,neighborhood,address',
  })
  if (biasLL && Number.isFinite(biasLL[0]) && Number.isFinite(biasLL[1])) {
    params.set('proximity', `${biasLL[0]},${biasLL[1]}`)
  }

  const base = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    keyRaw
  )}.json?${params.toString()}`

  // attempt 1: biased ZA search
  try {
    const res = await fetch(base)
    const json = await res.json()
    const ll = json?.features?.[0]?.center
    if (Array.isArray(ll) && Number.isFinite(ll[0]) && Number.isFinite(ll[1])) {
      cacheRef.current.set(key, ll)
      try {
        localStorage.setItem(lsKey, JSON.stringify(ll))
      } catch {}
      return ll
    }
  } catch {}

  // attempt 2: explicitly append country text (extra nudge)
  try {
    const alt = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      `${keyRaw}, South Africa`
    )}.json?${params.toString()}`
    const res2 = await fetch(alt)
    const json2 = await res2.json()
    const ll2 = json2?.features?.[0]?.center
    if (
      Array.isArray(ll2) &&
      Number.isFinite(ll2[0]) &&
      Number.isFinite(ll2[1])
    ) {
      cacheRef.current.set(key, ll2)
      try {
        localStorage.setItem(lsKey, JSON.stringify(ll2))
      } catch {}
      return ll2
    }
  } catch {}

  return null
}

// ===== Debugging toggles =====
const DEBUG_ROUTES = true // set false to silence logs
// you can also toggle at runtime from the console: window.fleetDebugRoutes = true/false

function formatLL(ll) {
  if (!Array.isArray(ll)) return ''
  const [lng, lat] = ll
  return `${Number(lng).toFixed(6)}, ${Number(lat).toFixed(6)}`
}

function debugPrintRoute(plate, labeled) {
  if (!DEBUG_ROUTES && !window.fleetDebugRoutes) return
  try {
    console.groupCollapsed(`Route for ${plate} — ${labeled.length} waypoints`)
    console.table(
      labeled.map((p, i) => ({
        '#': i,
        type: p.type, // 'branch' | 'customer'
        label: p.label, // e.g., 'Branch: Alrode Depot' or 'Customer: ACME (Randburg)'
        used: p.used || '', // 'name' | 'suburb'
        query: p.query || '', // the string we sent to geocoder
        coord: formatLL(p.ll),
      }))
    )
    console.groupEnd()
  } catch {}
}

/* ===================== Directions helpers (ETA + polyline) ===================== */
function keyForRoute(points) {
  // points: array of [lng,lat]
  return points.map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join('|')
}

async function fetchDirections(points, mapboxgl) {
  // points must be [lng, lat] pairs; Mapbox wants "lng,lat;lng,lat;..."
  const token = mapboxgl.accessToken
  if (!token || !Array.isArray(points) || points.length < 2) return null

  const coords = points.map((p) => `${p[0]},${p[1]}`).join(';')
  const url =
    `https://api.mapbox.com/directions/v5/${DIRECTIONS_PROFILE}/${coords}` +
    `?geometries=${DIRECTIONS_GEOMETRY}&overview=full&annotations=duration,distance&steps=false&access_token=${token}`

  try {
    const res = await fetch(url)
    const data = await res.json()
    const route = data?.routes?.[0]
    if (!route) return null
    // route.geometry is GeoJSON (LineString) because we requested geometries=geojson
    return {
      geometry: route.geometry, // {type:'LineString', coordinates:[ [lng,lat], ... ]}
      distance: route.distance, // meters
      duration: route.duration, // seconds
    }
  } catch {
    return null
  }
}

/* ======================== Component ======================== */
export default function MapViewMapbox({
  vehicleCards = [],
  selectedPlanId = 'all',
  assignedUnits = [],
  initialViewport = { latitude: -26.2041, longitude: 28.0473, zoom: 9 },
  refreshKey = 0,
}) {
  // Removed verbose logging
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map()) // plate -> Marker
  const routeIdsRef = useRef(new Set()) // layer/source ids to cleanup
  const routeMarkersRef = useRef([]) // route markers to cleanup
  const lastMoveRef = useRef(new Map()) // plate -> last move ts
  const geocodeCacheRef = useRef(new Map()) // geocode cache
  const directionsCacheRef = useRef(new Map()) // key(points) -> {geometry,duration,distance}
  const etaByPlateRef = useRef(new Map()) // plate -> {duration, distance}
  const routeRefreshQueued = useRef(false) // debounce styledata refresh
  const [focusPlate, setFocusPlate] = useState('')
  const [routeData, setRouteData] = useState(null)

  // Generation guard: ignore late results from older refresh cycles
  const routesGenerationRef = useRef(0)

  // Per-plate last waypoints key: avoids re-fetch when nothing changed
  const lastPointsKeyByPlateRef = useRef(new Map()) // plate -> keyForRoute(points)

  // Simple throttler (rate-limit + concurrency)
  function makeThrottler({
    interval = 1000,
    maxPerInterval = 4,
    concurrency = 2,
  } = {}) {
    const queue = []
    let running = 0
    let issuedInWindow = 0
    let windowStart = Date.now()

    const tryRun = () => {
      const now = Date.now()
      if (now - windowStart >= interval) {
        windowStart = now
        issuedInWindow = 0
      }
      while (
        running < concurrency &&
        queue.length > 0 &&
        issuedInWindow < maxPerInterval
      ) {
        const job = queue.shift()
        running++
        issuedInWindow++
        job()
      }
    }

    const schedule = (fn) =>
      new Promise((resolve, reject) => {
        const run = async () => {
          try {
            const r = await fn()
            resolve(r)
          } catch (e) {
            reject(e)
          } finally {
            running--
            setTimeout(tryRun, 0)
          }
        }
        queue.push(run)
        setTimeout(tryRun, 0)
      })

    return { schedule }
  }

  const directionsThrottleRef = useRef(
    makeThrottler({ interval: 1000, maxPerInterval: 4, concurrency: 2 })
  )

  // Filter to vehicles with coordinates
  const validVehicles = useMemo(
    () => {
      const valid = vehicleCards.filter(
        (c) =>
          c?.live &&
          Number.isFinite(Number(c.live.Latitude)) &&
          Number.isFinite(Number(c.live.Longitude))
      )
      
      // Removed verbose vehicle logging
      
      return valid
    },
    [vehicleCards]
  )

  // Focus from card click
  useEffect(() => {
    const handler = (e) => {
      const plate = e?.detail?.plate
      console.log('🎯 Focus event received:', plate)
      
      if (!plate || plate === null) {
        console.log('🎯 Clearing focus')
        setFocusPlate('')
        setRouteData(null)
        return
      }
      
      const plateUpper = String(plate).toUpperCase()
      console.log('🎯 Setting focus to:', plateUpper)
      setFocusPlate(plateUpper)
    }
    window.addEventListener('fleet:focusPlate', handler)
    return () => window.removeEventListener('fleet:focusPlate', handler)
  }, [])

  /* --------------------- init / cleanup map --------------------- */
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
      
      // Map initialized

      // Visibility/resize to keep markers alive after view switches
      const onResize = () => {
        try {
          map.resize()
        } catch {}
      }
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onResize()
          for (const m of markersRef.current.values()) {
            try {
              const ll = m.getLngLat()
              m.setLngLat(ll) // nudge redraw
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

      // If style reloads, queue a route refresh
      map.on('styledata', () => {
        if (!routeRefreshQueued.current) {
          routeRefreshQueued.current = true
          setTimeout(() => {
            routeRefreshQueued.current = false
            refreshRoutes()
          }, 120) // small debounce
        }
      })

      map.on('load', async () => {
        if (disposed) return
        drawMarkers()
        await refreshRoutes()
      })

      function cleanup() {
        try {
          for (const m of markersRef.current.values()) {
            try {
              m.remove()
            } catch {}
          }
          markersRef.current.clear()

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

      return () => {
        disposed = true
        cleanup()
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  /* --------------------- markers --------------------- */
  function drawMarkers() {
    const map = mapRef.current
    if (!map) return
    
    // Drawing markers

    const seen = new Set()
    for (const card of validVehicles) {
      const plate = String(card.plate || '').trim().toUpperCase()
      seen.add(plate)
      // ... existing add/update logic will follow ...
    }
    
    // remove markers for plates that disappeared
    for (const [plate, marker] of markersRef.current) {
      if (!seen.has(plate)) {
        try { marker.remove() } catch {}
        markersRef.current.delete(plate)
      }
    }

    for (const card of validVehicles) {
      const plate = String(card.plate || '').trim().toUpperCase()
      const lat = Number(card.live.Latitude)
      const lng = Number(card.live.Longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

      const { key, color, flash } = deriveStatusForMap(
        plate,
        card.live,
        lastMoveRef
      )
      let marker = markersRef.current.get(plate)
      const eta = etaByPlateRef.current.get(plate) || null
      
      // Marker data processed

      if (!marker) {
        const el = makeMarkerEl(color, flash)
        marker = new Mapbox.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map)
        marker.setPopup(
          new Mapbox.Popup({ closeButton: true, offset: 12 }).setHTML(
            buildPopupHTML(plate, card, eta)
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
        // update popup if ETA changed
        marker.getPopup()?.setHTML(buildPopupHTML(plate, card, eta))
      }
    }
  }

  // Debounced marker updates
  const markerTimeoutRef = useRef(null)
  
  useEffect(() => {
    if (markerTimeoutRef.current) {
      clearTimeout(markerTimeoutRef.current)
    }
    
    markerTimeoutRef.current = setTimeout(() => {
      drawMarkers()
    }, 100) // 100ms debounce for markers
    
    return () => {
      if (markerTimeoutRef.current) {
        clearTimeout(markerTimeoutRef.current)
      }
    }
  }, [validVehicles])

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

  /* --------------------- routes (per plan) --------------------- */
  function clearAllRoutes() {
    const map = mapRef.current
    if (!map) return
    for (const id of routeIdsRef.current) {
      try {
        if (map.getLayer(id)) {
          map.removeLayer(id)
        }
      } catch {}
      try {
        if (map.getSource(id)) {
          map.removeSource(id)
        }
      } catch {}
    }
    routeIdsRef.current.clear()
  }

  function addOrUpdateRouteSegment(id, geojson, color) {
    const map = mapRef.current
    
    console.log(`🗺️ Adding route segment ${id}:`, {
      mapExists: !!map,
      mapLoaded: map?.loaded(),
      styleLoaded: map?.isStyleLoaded(),
      geojsonExists: !!geojson,
      color,
      routeIdsCount: routeIdsRef.current.size
    })
    
    if (!map || !geojson) {
      console.log(`🗺️ Route ${id} skipped: missing map or geojson`)
      return
    }
    if (!map.isStyleLoaded()) {
      console.log(`🗺️ Route ${id} skipped: style not loaded`)
      return
    }

    try {
      if (!map.getSource(id)) {
        console.log(`🗺️ Creating new route source and layer: ${id}`)
        map.addSource(id, { type: 'geojson', data: geojson })
        map.addLayer({
          id,
          type: 'line',
          source: id,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': color,
            'line-width': 4,
            'line-opacity': 0.8,
          },
        })
        routeIdsRef.current.add(id)
        console.log(`🗺️ Route ${id} added successfully. Total routes: ${routeIdsRef.current.size}`)
      } else {
        console.log(`🗺️ Updating existing route: ${id}`)
        const src = map.getSource(id)
        src.setData(geojson)
        console.log(`🗺️ Route ${id} updated successfully`)
      }
    } catch (error) {
      console.error(`🗺️ Error adding route segment ${id}:`, error)
    }
  }

  async function buildUnitPoints(mapboxgl, unit, biasLL, vehicleData) {
    if (!unit) return null

    // Determine depot based on vehicle location or geozone
    const vehicleLat = Number(vehicleData?.live?.Latitude || 0)
    const vehicleLng = Number(vehicleData?.live?.Longitude || 0)
    const geozone = vehicleData?.live?.Geozone || ''
    
    // Use ASSM depot if vehicle is in that area or geozone indicates it
    const branch = (geozone === 'ASSM' || vehicleLat < -26.5) 
      ? 'Springbok Road, Midvaal, South Africa'
      : 'Alrode, Alberton, South Africa'
      
    // LOG: Unit point building
    console.log(`🗺️ Building points for unit:`, {
      plate: unit?.horse?.plate || unit?.rigid?.plate,
      vehicleLocation: { lat: vehicleLat, lng: vehicleLng },
      geozone,
      selectedBranch: branch,
      customersCount: unit.customers?.length || 0,
      biasLL
    })

    // Dedupe customers by name but keep first for suburb fallback
    const customerObjs = Array.from(
      new Map(
        (unit.customers || [])
          .filter(Boolean)
          .map((c) => [String(c.customer_name || '').trim(), c])
      ).values()
    )

    // Limit to max 20 customers to avoid Mapbox API limits (25 waypoints max)
    const limitedCustomers = customerObjs.slice(0, 20)
    
    // LOG: Customer data
    console.log(`📍 Customer data processing:`, {
      originalCustomers: unit.customers?.length || 0,
      afterDeduplication: customerObjs.length,
      afterLimiting: limitedCustomers.length,
      sampleCustomers: limitedCustomers.slice(0, 3).map(c => ({
        name: c.customer_name,
        suburb: c.suburb_name || c.surburb_name || c.subrub_name
      }))
    })

    const labeled = []

    // Branch first
    const branchLL = await geocode(mapboxgl, geocodeCacheRef, branch, biasLL)
    if (branchLL) {
      labeled.push({
        type: 'branch',
        label: `Branch: ${branch}`,
        used: 'name',
        query: branch,
        ll: branchLL,
      })
    }

    // Customers: try suburb first, fall back to name
    for (const c of limitedCustomers) {
      const name = normalizeName(c.customer_name)
      const suburb = normalizeName(
        c.suburb_name || c.surburb_name || c.subrub_name
      )

      let ll = null
      let used = ''
      let query = ''

      // Try suburb first as it's more likely to geocode successfully
      if (suburb) {
        ll = await geocode(mapboxgl, geocodeCacheRef, suburb, biasLL)
        used = 'suburb'
        query = suburb
      }
      if (!ll && name) {
        ll = await geocode(mapboxgl, geocodeCacheRef, name, biasLL)
        used = 'name'
        query = name
      }

      if (ll) {
        labeled.push({
          type: 'customer',
          label: `Customer: ${name || '(unnamed)'}${
            suburb ? ` (${suburb})` : ''
          }`,
          used,
          query,
          ll,
        })
      }
    }

    // Return to Branch
    if (branchLL) {
      labeled.push({
        type: 'branch',
        label: `Branch: ${branch}`,
        used: 'name',
        query: branch,
        ll: branchLL,
      })
    }

    // Print nicely for you to verify
    debugPrintRoute(unit?.horse?.plate || unit?.rigid?.plate || 'unit', labeled)

    // LOG: Route locations like dashboard map
    const routeInfo = {
      plate: unit?.horse?.plate || unit?.rigid?.plate,
      totalLocations: labeled.length,
      routeLocations: labeled.map((location, index) => {
        const isStart = index === 0
        const isEnd = index === labeled.length - 1
        const [lng, lat] = location.ll || [null, null]
        
        return {
          '#': isStart ? 'S' : isEnd ? 'E' : index,
          type: location.type,
          name: location.label,
          coordinates: lat && lng ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Not available',
          geocoded: !!(lat && lng),
          query: location.query,
          used: location.used
        }
      })
    }
    
    console.log(`🗺️ Route Locations for ${routeInfo.plate}:`, routeInfo)
    
    // Store route data for map display
    setRouteData(routeInfo)

    const coords = labeled.map((p) => p.ll)
    return coords.length >= 2 ? { coords, labeled } : null
  }

  async function refreshRoutes() {
    const map = mapRef.current
    if (!map) return
    const myGen = ++routesGenerationRef.current

    console.log('🗺️ refreshRoutes called:', { selectedPlanId, focusPlate, assignedUnitsCount: assignedUnits?.length })

    await waitForStyleReady(map)
    if (!map.isStyleLoaded()) return
    
    clearAllRoutes()
    
    // Only show routes if plan is selected and vehicle is focused
    if (!selectedPlanId || selectedPlanId === 'all') {
      drawMarkers()
      return
    }
    
    if (!focusPlate) {
      drawMarkers()
      return
    }

    const focusedVehicle = validVehicles.find(v => String(v.plate).toUpperCase() === focusPlate)
    console.log('🗺️ focusedVehicle found:', focusedVehicle?.plate)
    if (!focusedVehicle) {
      console.log('🗺️ No focused vehicle found for plate:', focusPlate)
      drawMarkers()
      return
    }

    const unit = unitForPlate(assignedUnits, focusedVehicle.plate)
    console.log('🗺️ unit found:', unit ? 'YES' : 'NO', 'customers:', unit?.customers?.length)
    if (!unit || !unit.customers?.length) {
      console.log('🗺️ No unit or customers found')
      drawMarkers()
      return
    }

    const mapboxgl = await getMapbox()
    
    // Get coordinates for route
    const routeLocations = await getRouteCoordinates(mapboxgl, unit, focusedVehicle)
    if (routeLocations.length < 2) {
      drawMarkers()
      return
    }
    
    // Check if route points changed to avoid needless refetch
    const points = routeLocations.map(r => r.coordinates).filter(Boolean)
    const key = keyForRoute(points)
    const prevKey = lastPointsKeyByPlateRef.current.get(focusPlate)
    
    if (prevKey === key) {
      // waypoints identical → just ensure markers are present and bail
      addRouteMarkers(mapboxgl, map, routeLocations)
      drawMarkers()
      return
    }
    lastPointsKeyByPlateRef.current.set(focusPlate, key)

    // Draw route segments
    for (let i = 0; i < routeLocations.length - 1; i++) {
      if (myGen !== routesGenerationRef.current) return  // cancel if newer refresh started
      const start = routeLocations[i]
      const end = routeLocations[i + 1]
      
      if (!start.coordinates || !end.coordinates) continue
      
      const route = await fetchDirections([start.coordinates, end.coordinates], mapboxgl)
      if (myGen !== routesGenerationRef.current) return  // check again after async call
      if (route) {
        const isReturnRoute = i === routeLocations.length - 2
        const color = isReturnRoute ? ROUTE_RETURN : ROUTE_PENDING
        
        const geojson = {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: { plate: focusedVehicle.plate, segment: i },
            geometry: route.geometry,
          }],
        }
        
        addOrUpdateRouteSegment(`route-${focusedVehicle.plate}-${i}`, geojson, color)
      }
    }
    
    // Add markers for route locations
    if (myGen !== routesGenerationRef.current) return  // final stale check
    addRouteMarkers(mapboxgl, map, routeLocations)
    drawMarkers()
  }
  
  async function getRouteCoordinates(mapboxgl, unit, vehicleData) {
    const locations = []
    
    // Determine branch
    const vehicleLat = Number(vehicleData?.live?.Latitude || 0)
    const geozone = vehicleData?.live?.Geozone || ''
    const branch = (geozone === 'ASSM' || vehicleLat < -26.5) 
      ? 'Springbok Road, Midvaal, South Africa'
      : 'Alrode, Alberton, South Africa'
    
    // Branch coordinates
    const branchCoords = await geocode(mapboxgl, geocodeCacheRef, branch, null)
    if (branchCoords) {
      locations.push({
        type: 'branch',
        name: `Branch: ${branch}`,
        coordinates: branchCoords
      })
    }
    
    // Customer coordinates
    const customers = unit.customers || []
    for (const customer of customers.slice(0, 10)) {
      const name = customer.customer_name || ''
      const suburb = customer.suburb_name || customer.surburb_name || customer.subrub_name || ''
      
      let coords = null
      if (suburb) {
        coords = await geocode(mapboxgl, geocodeCacheRef, suburb, branchCoords)
      }
      if (!coords && name) {
        coords = await geocode(mapboxgl, geocodeCacheRef, name, branchCoords)
      }
      
      if (coords) {
        locations.push({
          type: 'customer',
          name: `Customer: ${name}`,
          suburb,
          coordinates: coords
        })
      }
    }
    
    // Return to branch
    if (branchCoords) {
      locations.push({
        type: 'branch',
        name: `Branch: ${branch}`,
        coordinates: branchCoords
      })
    }
    
    return locations
  }
  
  function addRouteMarkers(mapboxgl, map, locations) {
    // Clear existing route markers
    routeMarkersRef.current.forEach(marker => {
      try {
        marker.remove()
      } catch {}
    })
    routeMarkersRef.current = []
    
    locations.forEach((location, index) => {
      if (!location.coordinates) return
      
      const [lng, lat] = location.coordinates
      const isStart = index === 0
      const isEnd = index === locations.length - 1
      const isBranch = location.type === 'branch'
      
      let color = CUSTOMER_COLOR
      let label = String(index)
      
      if (isStart) {
        color = DEPOT_COLOR
        label = 'S'
      } else if (isEnd) {
        color = DEPOT_COLOR
        label = 'E'
      } else if (isBranch) {
        color = DEPOT_COLOR
        label = 'D'
      }
      
      const el = document.createElement('div')
      el.style.cssText = `
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        color: white;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
      `
      el.textContent = label
      
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map)
      
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-sm">${location.name}</h3>
            ${location.suburb ? `<p class="text-xs text-gray-600">Suburb: ${location.suburb}</p>` : ''}
            <p class="text-xs text-gray-500">Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
          </div>
        `)
      
      marker.setPopup(popup)
      routeMarkersRef.current.push(marker)
    })
  }

  // Debounced route refresh to prevent excessive updates
  const refreshTimeoutRef = useRef(null)
  
  useEffect(() => {
    console.log('🔄 Route refresh triggered by dependency change:', {
      selectedPlanId,
      assignedUnitsLength: assignedUnits?.length,
      focusPlate
    })
    
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      refreshRoutes()
    }, 300) // 300ms debounce
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [selectedPlanId, assignedUnits, focusPlate])

  // Map rendering

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
