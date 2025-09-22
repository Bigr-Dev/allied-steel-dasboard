'use client'

// Simple in-memory cache for route requests
const routeCache = new Map()

// Generate a stable hash for waypoints to use as cache key
function generateRouteKey(waypoints, profile) {
  const coordString = waypoints.map((w) => `${w[0]},${w[1]}`).join('|')
  return `${profile}:${coordString}`
}

/**
 * Get a road-following route between waypoints using Mapbox Directions API
 * @param {Object} options - Route options
 * @param {Array<[lng, lat]>} options.waypoints - Array of [longitude, latitude] coordinates
 * @param {string} options.profile - Routing profile: 'driving', 'walking', 'cycling', 'driving-traffic'
 * @returns {Promise<Object|null>} Route data with geometry, distance, duration, bbox or null if failed
 */
export async function getRoute({ waypoints, profile = 'driving' }) {
  if (!waypoints || waypoints.length < 2) {
    console.warn('[v0] getRoute: Need at least 2 waypoints')
    return null
  }

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    console.error('[v0] getRoute: NEXT_PUBLIC_MAPBOX_TOKEN not found')
    return { error: 'Mapbox token not configured' }
  }

  const cacheKey = generateRouteKey(waypoints, profile)

  // Check cache first
  if (routeCache.has(cacheKey)) {
    console.log('[v0] getRoute: Using cached route')
    return routeCache.get(cacheKey)
  }

  try {
    // Format waypoints for Mapbox API (lng,lat;lng,lat;...)
    const coordinates = waypoints.map((w) => `${w[0]},${w[1]}`).join(';')

    const url =
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}` +
      `?geometries=geojson&overview=full&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`

    console.log('[v0] getRoute: Fetching route from Mapbox Directions API')
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      console.warn('[v0] getRoute: No routes found')
      return { error: 'No route found between waypoints' }
    }

    const route = data.routes[0]
    const result = {
      geometry: route.geometry,
      distance: route.distance, // meters
      duration: route.duration, // seconds
      bbox: [
        Math.min(...route.geometry.coordinates.map((c) => c[0])), // min lng
        Math.min(...route.geometry.coordinates.map((c) => c[1])), // min lat
        Math.max(...route.geometry.coordinates.map((c) => c[0])), // max lng
        Math.max(...route.geometry.coordinates.map((c) => c[1])), // max lat
      ],
    }

    // Cache the result
    routeCache.set(cacheKey, result)
    console.log('[v0] getRoute: Route cached successfully')

    return result
  } catch (error) {
    console.error('[v0] getRoute: Error fetching route:', error)
    return {
      error: `Failed to get route: ${error.message}`,
      fallback: {
        geometry: {
          type: 'LineString',
          coordinates: waypoints,
        },
        distance: 0,
        duration: 0,
        bbox: [
          Math.min(...waypoints.map((w) => w[0])),
          Math.min(...waypoints.map((w) => w[1])),
          Math.max(...waypoints.map((w) => w[0])),
          Math.max(...waypoints.map((w) => w[1])),
        ],
      },
    }
  }
}

/**
 * Match GPS traces to roads using Mapbox Map Matching API
 * @param {Object} options - Matching options
 * @param {Array<[lng, lat]>} options.coords - Array of GPS coordinates to match
 * @param {string} options.profile - Routing profile: 'driving', 'walking', 'cycling'
 * @returns {Promise<Object|null>} Matched route data or null if failed
 */
export async function matchRoute({ coords, profile = 'driving' }) {
  if (!coords || coords.length < 2) {
    console.warn('[v0] matchRoute: Need at least 2 coordinates')
    return null
  }

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    console.error('[v0] matchRoute: NEXT_PUBLIC_MAPBOX_TOKEN not found')
    return { error: 'Mapbox token not configured' }
  }

  const cacheKey = generateRouteKey(coords, `match:${profile}`)

  // Check cache first
  if (routeCache.has(cacheKey)) {
    console.log('[v0] matchRoute: Using cached matched route')
    return routeCache.get(cacheKey)
  }

  try {
    // Format coordinates for Map Matching API
    const coordinates = coords.map((c) => `${c[0]},${c[1]}`).join(';')

    const url =
      `https://api.mapbox.com/matching/v5/mapbox/${profile}/${coordinates}` +
      `?geometries=geojson&overview=full&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`

    console.log(
      '[v0] matchRoute: Fetching matched route from Mapbox Map Matching API'
    )
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.matchings || data.matchings.length === 0) {
      console.warn('[v0] matchRoute: No route matches found')
      return { error: 'No route match found for GPS trace' }
    }

    const match = data.matchings[0]
    const result = {
      geometry: match.geometry,
      distance: match.distance,
      duration: match.duration,
      confidence: match.confidence,
      bbox: [
        Math.min(...match.geometry.coordinates.map((c) => c[0])),
        Math.min(...match.geometry.coordinates.map((c) => c[1])),
        Math.max(...match.geometry.coordinates.map((c) => c[0])),
        Math.max(...match.geometry.coordinates.map((c) => c[1])),
      ],
    }

    // Cache the result
    routeCache.set(cacheKey, result)
    console.log('[v0] matchRoute: Matched route cached successfully')

    return result
  } catch (error) {
    console.error('[v0] matchRoute: Error matching route:', error)
    return {
      error: `Failed to match route: ${error.message}`,
      fallback: {
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
        distance: 0,
        duration: 0,
        confidence: 0,
        bbox: [
          Math.min(...coords.map((c) => c[0])),
          Math.min(...coords.map((c) => c[1])),
          Math.max(...coords.map((c) => c[0])),
          Math.max(...coords.map((c) => c[1])),
        ],
      },
    }
  }
}

/**
 * Clear the route cache (useful for development)
 */
export function clearRouteCache() {
  routeCache.clear()
  console.log('[v0] Route cache cleared')
}

/**
 * Get cache statistics
 */
export function getRouteCacheStats() {
  return {
    size: routeCache.size,
    keys: Array.from(routeCache.keys()),
  }
}
