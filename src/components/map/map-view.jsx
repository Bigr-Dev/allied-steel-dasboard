'use client' // Only needed for Next.js App Router

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export default function MapView({ center = [28.0473, -26.2041], zoom = 12 }) {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (map.current) return // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: center,
      zoom: zoom,
    })

    // Optional: Add zoom and rotation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
  }, [])

  return (
    <div
      ref={mapContainer}
      style={{ width: '100%', height: '500px', borderRadius: '8px' }}
    />
  )
}
