'use client'
import mapboxgl from 'mapbox-gl'
import { getRoute } from '@/lib/routeService'

// Route zone coordinates for South African locations
export const ZONE_COORDINATES = {
  ALRODE: [-26.3071, 28.1396],
  'EAST RAND 01': [-26.15, 28.25],
  'EAST RAND 02': [-26.18, 28.3],
  'EAST RAND 04': [-26.12, 28.28],
  'EAST RAND 05': [-25.95, 28.35],
  'EAST RAND 07': [-26.05, 28.45],
  'EAST RAND 11': [-26.25, 28.4],
  'JHB NORTH': [-26.0, 28.05],
  'JHB SOUTH': [-26.35, 28.05],
  'JHB SOUTH WEST': [-26.3, 27.95],
  'PTA EAST': [-25.75, 28.3],
  'PTA FAR NORTH': [-25.6, 28.2],
  'SOUTH EAST 01': [-26.4, 28.45],
  'WEST 01': [-26.4, 27.5],
  'WEST RAND 07': [-26.1, 27.75],
  'VAAL 03': [-26.7, 27.95],
  'VAAL 04': [-26.75, 27.9],
  BOKSBURG: [-26.2089, 28.2559],
  'JETPARK.BOKSBURG': [-26.15, 28.2],
  SPRINGS: [-26.25, 28.4],
  OLIFANTSFONTEIN: [-25.95, 28.35],
  VEREENIGING: [-26.6731, 27.9261],
  VANDERBIJLPARK: [-26.7131, 27.8378],
  JOHANNESBURG: [-26.2041, 28.0473],
  JOHANNESBURGSOUTH: [-26.35, 28.05],
  PRETORIA: [-25.7479, 28.2293],
  NIGEL: [-26.4309, 28.4772],
  KRUGERSDORP: [-26.0853, 27.7756],
  RANDBURG: [-26.0939, 28.0021],
  OLIFANTSVLEI: [-26.35, 28.1],
  ACTIVIAPARK: [-26.18, 28.32],
  DELMAS: [-26.1447, 28.6784],
  CARLETONVILLE: [-26.3609, 27.397],
  GERIMSTON: [-26.2309, 28.1772],
  '3KESWICKROAD': [-26.15, 28.22],
  'SILDALEPARK,SILVERDALE,PRETORIA': [-25.7, 28.35],
}

export async function createRouteLayer(map, routeData, selectedVehicleId) {
  console.log('[v0] createRouteLayer: Starting route creation')

  // Remove existing route layers
  if (map.getLayer('route-lines')) {
    map.removeLayer('route-lines')
  }
  if (map.getSource('route-lines')) {
    map.removeSource('route-lines')
  }

  const features = []
  const routePromises = []

  routeData.forEach((vehicle) => {
    if (selectedVehicleId && vehicle.vehicle_id !== selectedVehicleId) return

    vehicle.loads.forEach((load, loadIndex) => {
      const routeCoords = ZONE_COORDINATES[load.route_name]
      if (!routeCoords) return

      // Create waypoints for road-snapped route
      const depotCoords = ZONE_COORDINATES['ALRODE'] || [28.1396, -26.3071]
      const waypoints = [
        [depotCoords[1], depotCoords[0]], // [lng, lat] for depot
        [routeCoords[1], routeCoords[0]], // [lng, lat] for destination
      ]

      // Get road-following route
      const routePromise = getRoute({ waypoints, profile: 'driving' })
        .then((routeResult) => {
          if (routeResult && !routeResult.error) {
            console.log(
              '[v0] createRouteLayer: Got road-snapped route for',
              load.route_name
            )

            // Use the road-snapped geometry
            features.push({
              type: 'Feature',
              properties: {
                vehicle_id: vehicle.vehicle_id,
                route_name: load.route_name,
                load_weight: load.required_kg,
                color: getRouteColor(loadIndex),
                distance: Math.round(routeResult.distance / 1000), // km
                duration: Math.round(routeResult.duration / 60), // minutes
              },
              geometry: routeResult.geometry,
            })
          } else {
            console.warn(
              '[v0] createRouteLayer: Using fallback straight line for',
              load.route_name
            )

            // Fallback to straight line if API fails
            const geometry = routeResult?.fallback?.geometry || {
              type: 'LineString',
              coordinates: waypoints,
            }

            features.push({
              type: 'Feature',
              properties: {
                vehicle_id: vehicle.vehicle_id,
                route_name: load.route_name,
                load_weight: load.required_kg,
                color: getRouteColor(loadIndex),
                distance: 0,
                duration: 0,
                error: routeResult?.error || 'Unknown error',
              },
              geometry,
            })
          }

          // Add destination marker
          features.push({
            type: 'Feature',
            properties: {
              vehicle_id: vehicle.vehicle_id,
              route_name: load.route_name,
              type: 'destination',
              orders_count: load.orders.length,
              total_weight: load.required_kg,
            },
            geometry: {
              type: 'Point',
              coordinates: [routeCoords[1], routeCoords[0]],
            },
          })
        })
        .catch((error) => {
          console.error(
            '[v0] createRouteLayer: Route error for',
            load.route_name,
            error
          )

          // Add fallback straight line route
          features.push({
            type: 'Feature',
            properties: {
              vehicle_id: vehicle.vehicle_id,
              route_name: load.route_name,
              load_weight: load.required_kg,
              color: getRouteColor(loadIndex),
              distance: 0,
              duration: 0,
              error: error.message,
            },
            geometry: {
              type: 'LineString',
              coordinates: waypoints,
            },
          })

          // Add destination marker
          features.push({
            type: 'Feature',
            properties: {
              vehicle_id: vehicle.vehicle_id,
              route_name: load.route_name,
              type: 'destination',
              orders_count: load.orders.length,
              total_weight: load.required_kg,
            },
            geometry: {
              type: 'Point',
              coordinates: [routeCoords[1], routeCoords[0]],
            },
          })
        })

      routePromises.push(routePromise)
    })
  })

  // Wait for all route requests to complete
  try {
    await Promise.all(routePromises)
    console.log('[v0] createRouteLayer: All routes processed, adding to map')
  } catch (error) {
    console.error('[v0] createRouteLayer: Error processing routes:', error)
  }

  if (features.length === 0) {
    console.log('[v0] createRouteLayer: No features to display')
    return
  }

  // Add route lines source and layer
  map.addSource('route-lines', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: features.filter((f) => f.geometry.type === 'LineString'),
    },
  })

  map.addLayer({
    id: 'route-lines',
    type: 'line',
    source: 'route-lines',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': ['get', 'color'],
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 2, 12, 4, 16, 6],
      'line-opacity': 0.8,
    },
  })

  // Add destination points
  if (map.getLayer('route-destinations')) {
    map.removeLayer('route-destinations')
  }
  if (map.getSource('route-destinations')) {
    map.removeSource('route-destinations')
  }

  map.addSource('route-destinations', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: features.filter((f) => f.geometry.type === 'Point'),
    },
  })

  map.addLayer({
    id: 'route-destinations',
    type: 'circle',
    source: 'route-destinations',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8,
        6,
        12,
        8,
        16,
        12,
      ],
      'circle-color': '#059669',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  })

  // Add click handlers for destinations
  map.on('click', 'route-destinations', (e) => {
    const properties = e.features[0].properties

    // Find the corresponding route feature for distance/duration
    const routeFeature = features.find(
      (f) =>
        f.geometry.type === 'LineString' &&
        f.properties.route_name === properties.route_name &&
        f.properties.vehicle_id === properties.vehicle_id
    )

    const routeInfo = routeFeature ? routeFeature.properties : {}

    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(
        `
        <div class="p-3">
          <h3 class="font-semibold text-sm mb-2">${properties.route_name}</h3>
          <div class="space-y-1 text-xs">
            <div>Orders: ${properties.orders_count}</div>
            <div>Weight: ${Math.round(properties.total_weight)} kg</div>
            ${
              routeInfo.distance
                ? `<div>Distance: ${routeInfo.distance} km</div>`
                : ''
            }
            ${
              routeInfo.duration
                ? `<div>Duration: ${routeInfo.duration} min</div>`
                : ''
            }
            ${
              routeInfo.error
                ? `<div class="text-red-600">⚠ ${routeInfo.error}</div>`
                : ''
            }
          </div>
        </div>
      `
      )
      .addTo(map)
  })

  // Change cursor on hover
  map.on('mouseenter', 'route-destinations', () => {
    map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', 'route-destinations', () => {
    map.getCanvas().style.cursor = ''
  })

  console.log('[v0] createRouteLayer: Route layer creation complete')
}

function getRouteColor(index) {
  const colors = [
    '#059669',
    '#3b82f6',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
  ]
  return colors[index % colors.length]
}

export function fitMapToRoutes(map, routeData, selectedVehicleId) {
  console.log('[v0] fitMapToRoutes: Fitting map to routes')

  const coordinates = []

  // Add depot coordinates
  const depotCoords = ZONE_COORDINATES['ALRODE']
  if (depotCoords) {
    coordinates.push([depotCoords[1], depotCoords[0]])
  }

  routeData.forEach((vehicle) => {
    if (selectedVehicleId && vehicle.vehicle_id !== selectedVehicleId) return

    vehicle.loads.forEach((load) => {
      const routeCoords = ZONE_COORDINATES[load.route_name]
      if (routeCoords) {
        coordinates.push([routeCoords[1], routeCoords[0]])
      }
    })
  })

  if (coordinates.length > 0) {
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord)
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))

    map.fitBounds(bounds, {
      padding: { top: 80, bottom: 80, left: 80, right: 420 }, // More padding on right for sidebar
      duration: 1000,
    })
  }
}
