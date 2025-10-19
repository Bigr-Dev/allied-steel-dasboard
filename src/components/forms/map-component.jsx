'use client'

import React, { useEffect, useRef, useState } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'

let Mapbox
async function getMapbox() {
  if (!Mapbox) {
    const mod = await import('mapbox-gl')
    Mapbox = mod.default
  }
  return Mapbox
}

const DEPOT_COLOR = '#003e69'
const CUSTOMER_COLOR = '#10b981'
const ROUTE_PENDING = '#9ca3af'  // Grey for pending segments
const ROUTE_COMPLETED = '#10b981'  // Green for completed segments
const ROUTE_RETURN = '#003e69'  // Company color for return route

function makeMarkerEl(color, label) {
  const outer = document.createElement('div')
  outer.className = 'marker-outer'
  outer.style.cssText = `
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
  outer.textContent = label
  return outer
}

async function fetchDirections(points, mapboxgl) {
  const token = mapboxgl.accessToken
  if (!token || !Array.isArray(points) || points.length < 2) return null

  const coords = points.map((p) => `${p[0]},${p[1]}`).join(';')
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${token}`

  try {
    const res = await fetch(url)
    const data = await res.json()
    const route = data?.routes?.[0]
    if (!route) return null
    return {
      geometry: route.geometry,
      distance: route.distance,
      duration: route.duration,
    }
  } catch {
    return null
  }
}

export default function MapComponent({ routeLocations = [], vehicleData = null, completedStops = [] }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const routeLayerRef = useRef(null)

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
        center: [28.1396, -26.3071],
        zoom: 9,
      })
      mapRef.current = map

      map.on('load', () => {
        if (disposed) return
        updateMapContent()
      })

      return () => {
        disposed = true
        cleanup()
      }
    })()

    function cleanup() {
      try {
        markersRef.current.forEach(marker => marker.remove())
        markersRef.current = []
        if (routeLayerRef.current && mapRef.current) {
          try {
            mapRef.current.removeLayer('route')
            mapRef.current.removeSource('route')
          } catch {}
        }
        mapRef.current?.remove()
        mapRef.current = null
      } catch {}
    }
  }, [])

  useEffect(() => {
    updateMapContent()
  }, [routeLocations, vehicleData])

  async function updateMapContent() {
    const map = mapRef.current
    if (!map || !map.loaded()) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Clear existing route segments
    if (routeLayerRef.current) {
      try {
        // Remove all route segments
        for (let i = 0; i < 20; i++) {  // Assume max 20 segments
          try {
            map.removeLayer(`route-segment-${i}`)
            map.removeSource(`route-segment-${i}`)
          } catch {}
        }
        routeLayerRef.current = null
      } catch {}
    }

    const validLocations = routeLocations.filter(loc => 
      (loc.coordinates?.lat || loc.lat) && (loc.coordinates?.lng || loc.lng)
    )

    if (validLocations.length === 0) return

    const mapboxgl = await getMapbox()
    const bounds = new mapboxgl.LngLatBounds()

    // Add markers for each location
    validLocations.forEach((location, index) => {
      const lat = location.coordinates?.lat || location.lat
      const lng = location.coordinates?.lng || location.lng
      
      if (!lat || !lng) return

      const isStart = index === 0
      const isEnd = index === validLocations.length - 1
      const isBranch = location.name?.includes('Branch') || location.address?.includes('Road')
      
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

      const el = makeMarkerEl(color, label)
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map)

      // Add popup
      const popupContent = `
        <div class="p-2 min-w-[200px]">
          <h3 class="font-semibold text-sm mb-1">${location.display_name || location.name}</h3>
          ${location.suburb ? `<p class="text-xs text-gray-600">Suburb: ${location.suburb}</p>` : ''}
          ${location.address ? `<p class="text-xs text-gray-600">Address: ${location.address}</p>` : ''}
          <p class="text-xs text-gray-500 mt-1">Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
        </div>
      `
      
      marker.setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent)
      )

      markersRef.current.push(marker)
      bounds.extend([lng, lat])
    })

    // Add vehicle marker if available
    if (vehicleData?.live?.Latitude && vehicleData?.live?.Longitude) {
      const lat = Number(vehicleData.live.Latitude)
      const lng = Number(vehicleData.live.Longitude)
      
      const el = makeMarkerEl('#3b82f6', 'V')
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map)

      const popupContent = `
        <div class="p-2 min-w-[200px]">
          <h3 class="font-semibold text-sm mb-1">${vehicleData.plate}</h3>
          <p class="text-xs text-gray-600">Speed: ${Number(vehicleData.live.Speed || 0).toFixed(1)} km/h</p>
          ${vehicleData.live.DriverName ? `<p class="text-xs text-gray-600">Driver: ${vehicleData.live.DriverName}</p>` : ''}
          ${vehicleData.live.Address ? `<p class="text-xs text-gray-600">${vehicleData.live.Address}</p>` : ''}
          <p class="text-xs text-gray-500 mt-1">Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
        </div>
      `
      
      marker.setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent)
      )

      markersRef.current.push(marker)
      bounds.extend([lng, lat])
    }

    // Draw route segments with different colors
    if (validLocations.length >= 2) {
      for (let i = 0; i < validLocations.length - 1; i++) {
        const start = validLocations[i]
        const end = validLocations[i + 1]
        
        const startPoint = [start.coordinates?.lng || start.lng, start.coordinates?.lat || start.lat]
        const endPoint = [end.coordinates?.lng || end.lng, end.coordinates?.lat || end.lat]
        
        const route = await fetchDirections([startPoint, endPoint], mapboxgl)
        if (route) {
          // Determine segment color
          let segmentColor = ROUTE_PENDING  // Default grey
          
          if (completedStops.includes(i)) {
            segmentColor = ROUTE_COMPLETED  // Green for completed
          }
          
          // Check if this is the return route (last segment back to depot)
          const isReturnRoute = i === validLocations.length - 2 && 
                               (end.name?.includes('Branch') || end.address?.includes('Road'))
          
          if (isReturnRoute) {
            segmentColor = ROUTE_RETURN  // Company color for return
          }
          
          const sourceId = `route-segment-${i}`
          const layerId = `route-segment-${i}`
          
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route.geometry
            }
          })

          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': segmentColor,
              'line-width': 4,
              'line-opacity': 0.8
            }
          })
        }
      }
      routeLayerRef.current = true
    }

    // Fit map to bounds
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      })
    }
  }

  return (
    <div className="w-full h-full relative">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '100%' }}
      />
      {routeLocations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="p-4 bg-white/90 backdrop-blur rounded-md shadow">
            <p className="text-gray-500 text-sm">
              Click "Get Coordinates" to display route on map
            </p>
          </div>
        </div>
      )}
    </div>
  )
}