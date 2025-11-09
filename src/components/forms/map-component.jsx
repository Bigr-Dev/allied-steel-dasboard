'use client'

import { useEffect, useRef, useState } from 'react'
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
  if (!token || !Array.isArray(points) || points.length < 2) {
    console.log('Invalid params for directions:', { token: !!token, points })
    return null
  }

  const coords = points.map((p) => `${p[0]},${p[1]}`).join(';')
  // Use driving profile with truck restrictions (avoid motorways with low bridges)
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&steps=true&exclude=motorway&access_token=${token}`

  try {
    const res = await fetch(url)
    const data = await res.json()
    
    if (data.code !== 'Ok') {
      console.error('Mapbox Directions API error:', data)
      return null
    }
    
    const route = data?.routes?.[0]
    if (!route) {
      console.log('No route found in response')
      return null
    }
    
    return {
      geometry: route.geometry,
      distance: route.distance,
      duration: route.duration,
      legs: route.legs,
      steps: route.legs?.[0]?.steps || [],
    }
  } catch (err) {
    console.error('Directions fetch error:', err)
    return null
  }
}

export default function MapComponent({ routeLocations = [], vehicleData = null, completedStops = [], onRouteInfoChange = null }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const routeLayerRef = useRef(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [nextCustomer, setNextCustomer] = useState(null)

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
    try {
      for (let i = 0; i < 20; i++) {
        const layerId = `route-segment-${i}`
        const sourceId = `route-segment-${i}`
        if (map.getLayer(layerId)) map.removeLayer(layerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      }
      routeLayerRef.current = null
    } catch {}

    const validLocations = routeLocations.filter(loc => 
      (loc.coordinates?.lat || loc.lat) && (loc.coordinates?.lng || loc.lng)
    )
    
    console.log('Valid locations for routing:', validLocations)

    if (validLocations.length === 0) {
      console.log('No valid locations with coordinates')
      return
    }

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

    // Draw route segments with different colors and collect route info
    let totalDistance = 0
    let totalDuration = 0
    let nextStop = null
    
    if (validLocations.length >= 2) {
      for (let i = 0; i < validLocations.length - 1; i++) {
        const start = validLocations[i]
        const end = validLocations[i + 1]
        
        const startPoint = [start.coordinates?.lng || start.lng, start.coordinates?.lat || start.lat]
        const endPoint = [end.coordinates?.lng || end.lng, end.coordinates?.lat || end.lat]
        
        const route = await fetchDirections([startPoint, endPoint], mapboxgl)
        console.log(`Route segment ${i}:`, { start, end, startPoint, endPoint, route })
        
        if (route) {
          totalDistance += route.distance
          totalDuration += route.duration
          
          // Track next customer (first non-completed stop)
          if (!nextStop && !completedStops.includes(i)) {
            nextStop = {
              location: end,
              distance: route.distance,
              duration: route.duration,
              steps: route.steps,
            }
          }
          
          // Determine segment color
          let segmentColor = ROUTE_PENDING
          if (completedStops.includes(i)) {
            segmentColor = ROUTE_COMPLETED
          }
          const isReturnRoute = i === validLocations.length - 2 && 
                               (end.name?.includes('Branch') || end.address?.includes('Road'))
          if (isReturnRoute) {
            segmentColor = ROUTE_RETURN
          }
          
          const sourceId = `route-segment-${i}`
          const layerId = `route-segment-${i}`
          
          try {
            if (!map.getSource(sourceId)) {
              map.addSource(sourceId, {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: route.geometry
                }
              })
            }

            if (!map.getLayer(layerId)) {
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
              console.log(`Added route layer ${layerId} with color ${segmentColor}`)
            }
          } catch (err) {
            console.error(`Error adding route layer ${layerId}:`, err)
          }
        } else {
          console.warn(`No route returned for segment ${i}`)
        }
      }
      routeLayerRef.current = true
      const info = { totalDistance, totalDuration }
      setRouteInfo(info)
      setNextCustomer(nextStop)
      if (onRouteInfoChange) onRouteInfoChange(info)
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
      
      {/* Next Customer Card */}
      {nextCustomer && (
        <div className="absolute bottom-4 left-4 z-20 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <h3 className="font-semibold text-sm mb-2 text-[#003e69]">🚚 Next Stop</h3>
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-medium">{nextCustomer.location.display_name || nextCustomer.location.name}</span>
              {nextCustomer.location.suburb && (
                <span className="text-gray-600 ml-1">({nextCustomer.location.suburb})</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-gray-600">Distance: </span>
                <span className="font-medium">{(nextCustomer.distance / 1000).toFixed(1)} km</span>
              </div>
              <div>
                <span className="text-gray-600">ETA: </span>
                <span className="font-medium">{Math.round(nextCustomer.duration / 60)} min</span>
              </div>
            </div>
            {nextCustomer.location.address && (
              <div className="text-gray-600 text-[11px] border-t pt-2">
                📍 {nextCustomer.location.address}
              </div>
            )}
            {nextCustomer.steps && nextCustomer.steps.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <div className="text-[10px] font-semibold text-gray-700 mb-1">Next Turn:</div>
                <div className="text-[11px] text-gray-600">
                  {nextCustomer.steps[0]?.maneuver?.instruction || 'Continue on current road'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      

    </div>
  )
}