'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'

/**
 * MapView (drop-in)
 *
 * Props
 *  - vehicleCards: [{ plate, live }] where live has Plate, Latitude, Longitude, Speed, timestamp|Time|LocTime, Address|Geozone, ...
 *  - initialCenter?: { lng, lat, zoom }  (default: Johannesburg)
 *  - fitOnUpdate?: boolean (default true)
 *
 * Behavior (mirrors old-dashboard):
 *  - One Mapbox marker per Plate (UPPERCASE).
 *  - Markers update in place as new live packets arrive.
 *  - Click marker: centers/zooms and highlights it (ring).
 *  - Listens for window event `fleet:focusPlate` ({ detail: { plate } }) to pan/zoom and open popup.
 */
export default function MapView({
  vehicleCards = [],
  initialCenter = { lng: 28.0473, lat: -26.2041, zoom: 9 },
  fitOnUpdate = true,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const mapboxglRef = useRef(null)

  // Marker + popup registries (Map<PLATE, ...>)
  const markersRef = useRef(new Map())
  const popupsRef = useRef(new Map())
  const selectedPlateRef = useRef(null)

  const [ready, setReady] = useState(false)

  // ----- helpers (time, status, HTML) -----
  const getTs = (live) => {
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

  const getStatus = (live) => {
    const ts = getTs(live)
    if (ts == null) return 'offline'
    if ((Date.now() - ts) / 60000 > 5) return 'offline'
    return Number(live?.Speed ?? 0) > 0 ? 'moving' : 'idle'
  }

  const statusDot = (status) =>
    status === 'moving'
      ? 'bg-green-500'
      : status === 'idle'
      ? 'bg-yellow-500'
      : 'bg-gray-400'

  const lastSeen = (live) => {
    const ts = getTs(live)
    if (ts == null) return 'Unknown'
    const m = Math.floor((Date.now() - ts) / 60000)
    if (m < 1) return 'Live'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  const popupHTML = (plate, live) => {
    const spd = Number(live?.Speed ?? 0).toFixed(1)
    const where = live?.Address || live?.Geozone || '—'
    return `
      <div class="text-xs">
        <div class="font-mono text-sm font-semibold mb-1">${plate}</div>
        <div><span class="text-muted">Speed:</span> <strong>${spd} km/h</strong></div>
        <div class="truncate max-w-[240px]"><span class="text-muted">Where:</span> ${where}</div>
        <div class="text-muted-foreground">Last seen: ${lastSeen(live)}</div>
      </div>
    `
  }

  // ----- stable signature so we only redraw on meaningful changes (like old code) -----
  const markerSig = useMemo(() => {
    const rows = []
    for (const c of vehicleCards) {
      const plate = String(c?.plate || '')
        .trim()
        .toUpperCase()
      const lat = Number(c?.live?.Latitude)
      const lng = Number(c?.live?.Longitude)
      if (!plate || !Number.isFinite(lat) || !Number.isFinite(lng)) continue
      const moving = Number(c?.live?.Speed ?? 0) > 0 ? 1 : 0
      rows.push([plate, lat.toFixed(5), lng.toFixed(5), moving])
    }
    rows.sort((a, b) => (a[0] < b[0] ? -1 : 1))
    return JSON.stringify(rows)
  }, [vehicleCards])

  // ----- init map (like the old dashboard did) -----
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return
    ;(async () => {
      const mod = await import('mapbox-gl')
      mapboxglRef.current = mod.default
      mapboxglRef.current.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

      // create container cleanly (old used innerHTML reset)
      if (containerRef.current) containerRef.current.innerHTML = ''

      const map = new mapboxglRef.current.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [initialCenter.lng, initialCenter.lat],
        zoom: initialCenter.zoom,
      })
      map.addControl(
        new mapboxglRef.current.NavigationControl({ visualizePitch: true }),
        'top-left'
      )

      mapRef.current = map
      map.on('load', () => setReady(true))
    })()

    return () => {
      try {
        mapRef.current?.remove()
      } catch {}
      mapRef.current = null
      for (const [, m] of markersRef.current) {
        try {
          m.remove()
        } catch {}
      }
      markersRef.current.clear()
      for (const [, p] of popupsRef.current) {
        try {
          p.remove()
        } catch {}
      }
      popupsRef.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ----- create/update/remove markers (mirrors old add/update/remove flow) -----
  useEffect(() => {
    if (!ready || !mapRef.current || !mapboxglRef.current) return
    const map = mapRef.current
    const mapboxgl = mapboxglRef.current

    const seen = new Set()

    for (const c of vehicleCards) {
      const plate = String(c?.plate || '')
        .trim()
        .toUpperCase()
      const live = c?.live || null
      const lat = Number(live?.Latitude)
      const lng = Number(live?.Longitude)
      if (!plate || !Number.isFinite(lat) || !Number.isFinite(lng)) continue

      seen.add(plate)
      const st = getStatus(live)

      let marker = markersRef.current.get(plate)
      if (!marker) {
        // create marker element (equivalent to old createVehicleMarker)
        const el = document.createElement('div')
        el.className = 'marker'
        el.style.width = '0px'
        el.style.height = '0px'

        const inner = document.createElement('div')
        inner.className =
          'marker-inner rounded-full ring-1 ring-white shadow-md text-white text-[10px] px-2 py-1 flex items-center gap-1 bg-black/70'
        inner.style.transform = 'translate(-50%, -50%)'
        inner.style.whiteSpace = 'nowrap'

        const dot = document.createElement('span')
        dot.className = `inline-block w-2 h-2 rounded-full ${statusDot(st)}`
        inner.appendChild(dot)

        const label = document.createElement('span')
        label.className = 'font-mono font-semibold tracking-wide'
        label.textContent = plate
        inner.appendChild(label)

        el.appendChild(inner)

        marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map)

        el.addEventListener('click', () => {
          setSelected(plate, true)
          flyTo([lng, lat], 14)
          ensurePopup(plate, live, [lng, lat])
          openPopup(plate)
        })

        markersRef.current.set(plate, marker)
      } else {
        marker.setLngLat([lng, lat])
        // recolor status dot if needed
        const inner = marker.getElement()?.querySelector?.('.marker-inner')
        const dot = inner?.querySelector?.('span')
        if (dot) {
          dot.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-gray-400')
          dot.classList.add(statusDot(st))
        }
        // update popup content if open
        const p = popupsRef.current.get(plate)
        if (p?.isOpen()) p.setHTML(popupHTML(plate, live))
      }
    }

    // remove stale markers
    for (const [plate, marker] of markersRef.current.entries()) {
      if (!seen.has(plate)) {
        try {
          marker.remove()
        } catch {}
        markersRef.current.delete(plate)
        const p = popupsRef.current.get(plate)
        if (p) {
          try {
            p.remove()
          } catch {}
          popupsRef.current.delete(plate)
        }
      }
    }

    // fit bounds like old when markers change
    if (fitOnUpdate && markersRef.current.size > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      markersRef.current.forEach((m) => bounds.extend(m.getLngLat()))
      try {
        map.fitBounds(bounds, { padding: 60, duration: 600 })
      } catch {}
    }
  }, [markerSig, fitOnUpdate, ready])

  // ----- selection highlight like the old ring toggle -----
  const setSelected = (plate, isSelected) => {
    const prev = selectedPlateRef.current
    if (prev && markersRef.current.has(prev)) {
      const el = markersRef.current
        .get(prev)
        .getElement()
        ?.querySelector?.('.marker-inner')
      el?.classList.remove('ring-2', 'ring-primary')
    }
    if (isSelected && markersRef.current.has(plate)) {
      const el = markersRef.current
        .get(plate)
        .getElement()
        ?.querySelector?.('.marker-inner')
      el?.classList.add('ring-2', 'ring-primary')
      selectedPlateRef.current = plate
    } else {
      selectedPlateRef.current = null
    }
  }

  const ensurePopup = (plate, live, lngLat) => {
    const mapboxgl = mapboxglRef.current
    if (!mapboxgl) return
    if (popupsRef.current.has(plate)) {
      popupsRef.current
        .get(plate)
        .setLngLat(lngLat)
        .setHTML(popupHTML(plate, live))
      return
    }
    const p = new mapboxgl.Popup({ closeButton: true, closeOnClick: true })
      .setLngLat(lngLat)
      .setHTML(popupHTML(plate, live))
      .addTo(mapRef.current)
    popupsRef.current.set(plate, p)
  }

  const openPopup = (plate) => {
    const p = popupsRef.current.get(plate)
    if (p && !p.isOpen()) p.addTo(mapRef.current)
  }

  const flyTo = ([lng, lat], minZoom = 14) => {
    if (!mapRef.current) return
    const z = Math.max(mapRef.current.getZoom(), minZoom)
    mapRef.current.flyTo({ center: [lng, lat], zoom: z, duration: 800 })
  }

  // ----- external “focus plate” (matches old flow) -----
  useEffect(() => {
    const handler = (e) => {
      const plate = String(e?.detail?.plate || '')
        .trim()
        .toUpperCase()
      if (!plate || !mapRef.current) return
      const marker = markersRef.current.get(plate)
      if (!marker) return
      const ll = marker.getLngLat()
      setSelected(plate, true)
      ensurePopup(
        plate,
        vehicleCards.find((c) => String(c.plate).toUpperCase() === plate)
          ?.live || null,
        [ll.lng, ll.lat]
      )
      openPopup(plate)
      flyTo([ll.lng, ll.lat], 14)
    }
    window.addEventListener('fleet:focusPlate', handler)
    return () => window.removeEventListener('fleet:focusPlate', handler)
  }, [vehicleCards])

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div
        ref={containerRef}
        className="w-full h-full rounded-lg overflow-hidden"
      />
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute inset-x-0 top-2 mx-auto w-fit bg-white/90 text-xs rounded shadow px-3 py-1">
          Map unavailable (missing NEXT_PUBLIC_MAPBOX_TOKEN)
        </div>
      )}
    </div>
  )
}
