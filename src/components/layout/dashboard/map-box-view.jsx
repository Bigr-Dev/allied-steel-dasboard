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
const VEHICLE_COLOR = '#6b21a8'  // Dark purple for vehicle (navigation style)
const CUSTOMER_COLOR = '#1e40af'  // Dark blue for customers
const ROUTE_COLOR = '#3b82f6'  // Blue for route lines
const DIRECTIONS_PROFILE = 'mapbox/driving' // truck routing
const DIRECTIONS_GEOMETRY = 'geojson'
const EXCLUDE_MOTORWAY = true // avoid motorways with low bridges
const GEOCODE_LIMIT = 1
const OPTIMIZATION_PROFILE = 'driving' // for route optimization

// --- Geocoding bias for South Africa ---
const GEOCODE_COUNTRY = 'ZA'
// South Africa bounding box: [minLng,minLat,maxLng,maxLat]
const BBOX_ZA = [16.2817, -34.834, 32.891, -22.125].join(',')

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

async function optimizeRouteWithMapbox(vehicleLL, customerLocations, mapboxgl) {
  if (!vehicleLL || !customerLocations?.length) return customerLocations
  if (customerLocations.length === 1) return customerLocations
  
  // Check if all locations are the same (duplicate coordinates)
  const uniqueCoords = new Set(customerLocations.map(c => `${c.coordinates[0]},${c.coordinates[1]}`))
  if (uniqueCoords.size === 1) {
    console.log('⚠️ All orders at same location, no optimization needed')
    return customerLocations
  }
  
  const token = mapboxgl.accessToken
  if (!token) {
    console.log('⚠️ No Mapbox token, using proximity fallback')
    return optimizeRouteByProximity(vehicleLL, customerLocations)
  }
  
  // Mapbox Optimization API has limits, use proximity for large sets
  if (customerLocations.length > 12) {
    console.log('⚠️ Too many customers for Optimization API, using proximity')
    return optimizeRouteByProximity(vehicleLL, customerLocations)
  }
  
  // For small sets with duplicates, just use proximity
  console.log('⚠️ Using proximity-based optimization')
  return optimizeRouteByProximity(vehicleLL, customerLocations)
}

function optimizeRouteByProximity(vehicleLL, customerLocations) {
  if (!vehicleLL || !customerLocations?.length) return customerLocations
  
  const sorted = [...customerLocations].sort((a, b) => {
    const distA = haversineKm(vehicleLL, a.coordinates)
    const distB = haversineKm(vehicleLL, b.coordinates)
    return distA - distB
  })
  
  console.log('🎯 Route optimized by proximity:', sorted.map((c, i) => ({
    order: i + 1,
    name: c.name,
    distance: haversineKm(vehicleLL, c.coordinates).toFixed(2) + ' km'
  })))
  
  return sorted
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
  return { key: 'vehicle', color: '#3b82f6', flash: false }
}

function makeMarkerEl(color, flash) {
  const outer = document.createElement('div')
  outer.className = 'marker-outer'
  outer.style.cssText = `width:24px;height:24px;pointer-events:auto;animation:${flash ? 'pulse 1s ease-in-out infinite' : 'none'};z-index:1`

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
    const v = String(u?.vehicle?.plate || '').trim().toUpperCase()
    const h = String(u?.horse?.plate || '').trim().toUpperCase()
    const r = String(u?.rigid?.plate || '').trim().toUpperCase()
    
    console.log('🔍 Checking unit:', { vehicle: v, horse: h, rigid: r, orders: u?.orders?.length })
    
    if (v && v === P) {
      console.log('✅ Found unit by vehicle plate:', v)
      return u
    }
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

async function fetchOptimizedRoute(allPoints, mapboxgl) {
  const token = mapboxgl.accessToken
  if (!token || !Array.isArray(allPoints) || allPoints.length < 2) return null

  const coords = allPoints.map((p) => `${p[0]},${p[1]}`).join(';')
  const excludeParam = EXCLUDE_MOTORWAY ? '&exclude=motorway' : ''
  
  console.log(`🔍 Fetching route for ${allPoints.length} waypoints`)
  
  // Use Directions API for the complete optimized route
  const url = `https://api.mapbox.com/directions/v5/${DIRECTIONS_PROFILE}/${coords}?geometries=${DIRECTIONS_GEOMETRY}&overview=full&annotations=duration,distance&steps=true${excludeParam}&access_token=${token}`

  try {
    const res = await fetch(url)
    const data = await res.json()
    
    if (data.code !== 'Ok') {
      console.error('❌ Directions API error:', data.code, data.message)
      return null
    }
    
    const route = data?.routes?.[0]
    if (!route) {
      console.error('❌ No route in response')
      return null
    }
    
    console.log(`✅ Route fetched: ${route.geometry.coordinates?.length || 0} coordinate points`)
    
    return {
      geometry: route.geometry,
      distance: route.distance,
      duration: route.duration,
      steps: route.legs || []
    }
  } catch (error) {
    console.error('❌ Fetch error:', error)
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
      
      if (!plate || plate === null || plate === '') {
        console.log('🎯 Clearing focus and routes')
        clearAllRoutes()
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
  async function drawMarkers() {
    const map = mapRef.current
    if (!map) return
    
    const mapboxgl = await getMapbox()
    if (!mapboxgl) return

    const seen = new Set()
    for (const card of validVehicles) {
      const plate = String(card.plate || '').trim().toUpperCase()
      seen.add(plate)
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

      if (!marker) {
        const el = makeMarkerEl(color, flash)
        marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map)
        marker.setPopup(
          new mapboxgl.Popup({ closeButton: true, offset: 12 }).setHTML(
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
        marker.getPopup()?.setHTML(buildPopupHTML(plate, card, eta))
      }
    }
  }

  // Debounced marker updates - only when not showing routes
  const markerTimeoutRef = useRef(null)
  
  useEffect(() => {
    // Don't redraw vehicle markers if we're showing a route
    if (focusPlate && selectedPlanId && selectedPlanId !== 'all') {
      return
    }
    
    if (markerTimeoutRef.current) {
      clearTimeout(markerTimeoutRef.current)
    }
    
    markerTimeoutRef.current = setTimeout(() => {
      drawMarkers()
    }, 100)
    
    return () => {
      if (markerTimeoutRef.current) {
        clearTimeout(markerTimeoutRef.current)
      }
    }
  }, [validVehicles, focusPlate, selectedPlanId])

  // Fly to focused plate and fit route bounds
  useEffect(() => {
    const map = mapRef.current
    if (!map || !focusPlate) return
    
    // Wait a bit for route to be drawn
    setTimeout(() => {
      const vehicleMarker = markersRef.current.get(focusPlate)
      const routeMarkers = routeMarkersRef.current
      
      if (vehicleMarker && routeMarkers.length > 0) {
        // Get all marker coordinates
        const bounds = new (window.mapboxgl || require('mapbox-gl')).LngLatBounds()
        bounds.extend(vehicleMarker.getLngLat())
        routeMarkers.forEach(marker => {
          bounds.extend(marker.getLngLat())
        })
        
        // Fit map to show entire route
        map.fitBounds(bounds, {
          padding: { top: 100, bottom: 100, left: 100, right: 100 },
          duration: 1200,
          maxZoom: 13
        })
      } else if (vehicleMarker) {
        // Just vehicle, zoom to it
        const ll = vehicleMarker.getLngLat()
        map.flyTo({ center: [ll.lng, ll.lat], zoom: 14, duration: 900 })
      }
    }, 500)
  }, [focusPlate])

  /* --------------------- routes (per plan) --------------------- */
  function clearAllRoutes() {
    const map = mapRef.current
    if (!map) return
    console.log('🗑️ Clearing routes:', routeIdsRef.current.size)
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
    
    if (!map || !geojson) {
      console.log(`❌ Route ${id} skipped: missing map or geojson`)
      return
    }
    if (!map.isStyleLoaded()) {
      console.log(`⏳ Route ${id} waiting: style not loaded`)
      setTimeout(() => addOrUpdateRouteSegment(id, geojson, color), 100)
      return
    }

    try {
      const existingSource = map.getSource(id)
      const existingLayer = map.getLayer(id)
      
      if (existingLayer) {
        map.removeLayer(id)
      }
      if (existingSource) {
        map.removeSource(id)
      }
      
      console.log(`✏️ Adding route ${id}:`, {
        color,
        coordinates: geojson.features[0]?.geometry?.coordinates?.length || 0
      })
      
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
          'line-width': 6,
          'line-opacity': 0.85,
        },
      })
      routeIdsRef.current.add(id)
      console.log(`✅ Route ${id} added with ${geojson.features[0]?.geometry?.coordinates?.length} points`)
    } catch (error) {
      console.error(`❌ Error adding route ${id}:`, error)
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
        (unit.orders || [])
          .filter(Boolean)
          .map((c) => [String(c.customer_name || '').trim(), c])
      ).values()
    )

    // Limit to max 20 customers to avoid Mapbox API limits (25 waypoints max)
    const limitedCustomers = customerObjs.slice(0, 20)
    
    // LOG: Customer data
    console.log(`📍 Customer data processing:`, {
      originalOrders: unit.orders?.length || 0,
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
    
    // Don't start a new refresh if we're actively drawing
    if (isDrawingRef.current) {
      console.log('⏸️ refreshRoutes blocked: route is being drawn')
      return
    }

    console.log('🗺️ refreshRoutes:', { selectedPlanId, focusPlate, assignedUnitsCount: assignedUnits?.length })

    await waitForStyleReady(map)
    if (!map.isStyleLoaded()) {
      console.log('⏳ Map style not ready')
      return
    }
    
    // Clear routes only if explicitly switching away
    if (!selectedPlanId || selectedPlanId === 'all') {
      const myGen = ++routesGenerationRef.current
      clearAllRoutes()
      drawMarkers()
      return
    }
    
    if (!focusPlate) {
      // Don't clear routes, just don't draw new ones - and DON'T increment generation
      console.log('⏸️ No focus plate, keeping existing routes')
      return
    }
    
    // Only increment generation when we're actually going to draw routes
    const myGen = ++routesGenerationRef.current

    const focusedVehicle = validVehicles.find(v => String(v.plate).toUpperCase() === focusPlate)
    if (!focusedVehicle) {
      console.log('❌ No focused vehicle found for plate:', focusPlate)
      clearAllRoutes()
      drawMarkers()
      return
    }

    const unit = unitForPlate(assignedUnits, focusedVehicle.plate)
    console.log('📦 Unit data:', unit)
    
    const customers = unit?.customers || unit?.orders || []
    if (!unit) {
      console.log('❌ No unit found')
      clearAllRoutes()
      drawMarkers()
      return
    }
    
    if (!customers.length) {
      console.log('⚠️ Vehicle has no orders - showing vehicle only')
      clearAllRoutes()
      // Clear old route markers
      routeMarkersRef.current.forEach(marker => {
        try { marker.remove() } catch {}
      })
      routeMarkersRef.current = []
      drawMarkers()
      return
    }
    
    console.log('✅ Drawing route for', focusedVehicle.plate, 'with', customers.length, 'customers')

    const mapboxgl = await getMapbox()
    
    // Get coordinates for route
    const routeLocations = await getRouteCoordinates(mapboxgl, unit, focusedVehicle)
    console.log('📍 Route locations count:', routeLocations.length)
    
    if (routeLocations.length < 2) {
      console.log('⚠️ Not enough locations, showing markers only')
      isDrawingRef.current = true
      clearAllRoutes()
      routeMarkersRef.current.forEach(marker => {
        try { marker.remove() } catch {}
      })
      routeMarkersRef.current = []
      addRouteMarkers(mapboxgl, map, routeLocations)
      drawMarkers()
      isDrawingRef.current = false
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

    console.log('🗺️ Drawing optimized route with', routeLocations.length, 'locations')
    isDrawingRef.current = true
    
    // Clear ALL old routes and markers when switching vehicles
    clearAllRoutes()
    
    // Clear old route markers
    routeMarkersRef.current.forEach(marker => {
      try { marker.remove() } catch {}
    })
    routeMarkersRef.current = []
    
    addRouteMarkers(mapboxgl, map, routeLocations)
    
    // Draw complete optimized route as single line (Bolt-style)
    console.log(`🚀 Fetching optimized route for ${routeLocations.length} locations`)
    
    const allCoords = routeLocations.map(loc => loc.coordinates).filter(Boolean)
    
    if (myGen !== routesGenerationRef.current) {
      console.log(`❌ Route cancelled: generation changed`)
      isDrawingRef.current = false
      return
    }
    
    const route = await fetchOptimizedRoute(allCoords, mapboxgl)
    
    if (myGen !== routesGenerationRef.current) {
      console.log(`❌ Route cancelled after fetch: generation changed`)
      isDrawingRef.current = false
      return
    }
    
    if (!route) {
      console.log(`❌ No route returned from API`)
      isDrawingRef.current = false
      return
    }
    
    console.log(`✅ Complete route: ${(route.distance / 1000).toFixed(1)}km, ${(route.duration / 60).toFixed(0)}min`)
    
    const geojson = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { 
          plate: focusedVehicle.plate,
          distance: route.distance,
          duration: route.duration
        },
        geometry: route.geometry,
      }],
    }
    
    addOrUpdateRouteSegment(`route-${focusedVehicle.plate}`, geojson, ROUTE_COLOR)
    
    console.log('✅ Route complete')
    isDrawingRef.current = false
  }
  
  async function getRouteCoordinates(mapboxgl, unit, vehicleData) {
    console.log('📦 getRouteCoordinates - unit:', unit)
    console.log('📦 getRouteCoordinates - vehicleData:', vehicleData)
    
    const locations = []
    
    // Vehicle current location
    const vehicleLat = Number(vehicleData?.live?.Latitude || 0)
    const vehicleLng = Number(vehicleData?.live?.Longitude || 0)
    const vehicleLL = [vehicleLng, vehicleLat]
    
    console.log('📍 Vehicle location:', { lat: vehicleLat, lng: vehicleLng })
    
    if (vehicleLat && vehicleLng) {
      locations.push({
        type: 'vehicle',
        name: vehicleData.plate || 'Vehicle',
        coordinates: vehicleLL
      })
    }
    
    // Get customers from unit.customers OR unit.orders
    const customerObjs = (unit?.customers || unit?.orders || []).filter(Boolean)
    console.log('📦 Raw customer objects:', customerObjs)
    
    // Don't deduplicate - show each order as a separate stop
    const allOrders = customerObjs.map((c, idx) => ({
      ...c,
      _stopId: `${c.customer_name}-${idx}` // unique ID for each stop
    }))
    
    console.log(`📍 Vehicle ${vehicleData.plate} has ${allOrders.length} order stops:`, allOrders)
    
    const customerLocations = []
    for (const customer of allOrders) {
      const name = customer.customer_name || ''
      const suburb = customer.suburb_name || customer.surburb_name || customer.subrub_name || ''
      
      // Check if customer already has coordinates
      const lat = Number(customer.latitude || customer.lat || customer.delivery_latitude || 0)
      const lng = Number(customer.longitude || customer.lng || customer.lon || customer.delivery_longitude || 0)
      
      let coords = null
      
      // Use existing coordinates if available and valid
      if (lat && lng && lat !== 0 && lng !== 0) {
        coords = [lng, lat]
        console.log(`🔍 Using existing coords for ${name}: [${lng}, ${lat}]`)
      } else {
        console.log(`🔍 Geocoding customer: ${name} (${suburb})`)
        
        // Priority 1: Suburb only (most accurate for delivery locations in Gauteng)
        if (suburb) {
          coords = await geocode(mapboxgl, geocodeCacheRef, `${suburb}, Gauteng, South Africa`, vehicleLL)
          if (coords) console.log(`  ✅ Suburb geocoded:`, coords)
        }
        
        // Priority 2: Full address (name + suburb)
        if (!coords && name && suburb) {
          coords = await geocode(mapboxgl, geocodeCacheRef, `${name}, ${suburb}, Gauteng, South Africa`, vehicleLL)
          if (coords) console.log(`  ✅ Full address geocoded:`, coords)
        }
        
        // Priority 3: Just name (least reliable)
        if (!coords && name) {
          coords = await geocode(mapboxgl, geocodeCacheRef, `${name}, Gauteng, South Africa`, vehicleLL)
          if (coords) console.log(`  ✅ Name geocoded:`, coords)
        }
      }
      
      if (coords) {
        customerLocations.push({
          type: 'customer',
          name: name,
          suburb,
          coordinates: coords
        })
      } else {
        console.log(`  ❌ Failed to geocode: ${name}`)
      }
    }
    
    console.log('📍 Customer locations before optimization:', customerLocations)
    
    // Optimize customer order using Mapbox Optimization API
    const optimizedCustomers = await optimizeRouteWithMapbox(vehicleLL, customerLocations, mapboxgl)
    locations.push(...optimizedCustomers)
    
    console.log(`🗺️ Final route: 1 vehicle + ${optimizedCustomers.length} customers`)
    console.log('🗺️ All locations:', locations)
    
    return locations
  }
  
  function addRouteMarkers(mapboxgl, map, locations) {
    routeMarkersRef.current.forEach(marker => {
      try { marker.remove() } catch {}
    })
    routeMarkersRef.current = []
    
    let customerNum = 0
    
    locations.forEach((location, index) => {
      if (!location.coordinates) return
      
      const [lng, lat] = location.coordinates
      const isVehicle = location.type === 'vehicle'
      const isCustomer = location.type === 'customer'
      
      if (!isVehicle && !isCustomer) return // Skip depot/branch markers
      
      const el = document.createElement('div')
      el.className = 'route-marker'
      
      if (isVehicle) {
        // Vehicle marker - navigation style with arrow pointer
        el.innerHTML = `
          <svg width="40" height="40" viewBox="0 0 40 40" style="display: block;">
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
              </filter>
            </defs>
            <!-- Outer glow -->
            <circle cx="20" cy="20" r="18" fill="#6b21a8" opacity="0.2"/>
            <!-- Main circle -->
            <circle cx="20" cy="20" r="14" fill="#6b21a8" stroke="white" stroke-width="3" filter="url(#shadow)"/>
            <!-- Direction arrow -->
            <path d="M20 10 L20 24 M20 10 L16 14 M20 10 L24 14" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <!-- Center dot -->
            <circle cx="20" cy="20" r="3" fill="white"/>
          </svg>
        `
      } else if (isCustomer) {
        // Customer pin marker with number
        customerNum++
        el.innerHTML = `
          <svg width="28" height="38" viewBox="0 0 28 38" style="display: block;">
            <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.3 21.7 0 14 0z" 
                  fill="${CUSTOMER_COLOR}" stroke="white" stroke-width="2"/>
            <circle cx="14" cy="14" r="9" fill="white"/>
            <text x="14" y="18.5" text-anchor="middle" fill="${CUSTOMER_COLOR}" font-size="11" font-weight="bold">${customerNum}</text>
          </svg>
        `
      }
      
      el.style.cursor = 'pointer'
      
      console.log(`📍 Placing ${isVehicle ? 'vehicle' : 'customer'} marker at precise coords: [${lng.toFixed(6)}, ${lat.toFixed(6)}]`)
      
      const marker = new mapboxgl.Marker({ 
        element: el, 
        anchor: isCustomer ? 'bottom' : 'center'
      })
        .setLngLat([lng, lat])
        .addTo(map)
      
      marker.getElement().style.zIndex = '100'
      
      const popup = new mapboxgl.Popup({ offset: isCustomer ? 25 : 15 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-sm">${location.name}</h3>
            ${location.suburb ? `<p class="text-xs text-gray-600">${location.suburb}</p>` : ''}
          </div>
        `)
      
      marker.setPopup(popup)
      routeMarkersRef.current.push(marker)
    })
  }

  // Debounced route refresh
  const refreshTimeoutRef = useRef(null)
  const lastRefreshKey = useRef('')
  const isDrawingRef = useRef(false)
  
  useEffect(() => {
    const key = `${selectedPlanId}|${focusPlate}|${assignedUnits?.length || 0}`
    
    // Skip if nothing meaningful changed
    if (key === lastRefreshKey.current) {
      return
    }
    
    // Skip if currently drawing a route
    if (isDrawingRef.current) {
      console.log('⏸️ Skipping refresh: route is being drawn')
      return
    }
    
    console.log('🔄 Route refresh triggered:', {
      selectedPlanId,
      assignedUnitsLength: assignedUnits?.length,
      focusPlate
    })
    
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      lastRefreshKey.current = key
      refreshRoutes()
    }, 300)
    
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
        .route-marker {
          z-index: 100 !important;
        }
        .route-marker svg {
          display: block;
          width: 100%;
          height: 100%;
        }
        .marker-outer {
          z-index: 1 !important;
        }
        .mapboxgl-marker.route-marker-container {
          z-index: 100 !important;
        }
        .mapboxgl-marker {
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
