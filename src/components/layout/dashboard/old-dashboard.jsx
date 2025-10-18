'use client'

/**
 * Dashboard: Vehicles Routes Live TCP overlay
 * - Expects you provide the auto-assign payload in global context: load_assignment?.data
 * - Reads: data.plan, data.plans (list), data.assigned_units
 * - Builds "route cards" from assigned_units (vehicle_id, total weight, load count, loads[])
 * - Plan selector: lets the user switch the current view; includes placeholders to fetch selected plan.
 * - Live TCP: WebSocket upsert by Plate without changing styling.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Image from 'next/image'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// icons (avoid naming collisions with mapbox-gl.Map)
import {
  MapPin,
  Truck,
  Clock,
  Gauge,
  Route as RouteIcon,
  Navigation,
  Zap,
  Eye,
  Map as MapIcon,
} from 'lucide-react'

// app context helpers
import { useGlobalContext } from '@/context/global-context'
import {
  createVehicleMarker,
  parseRawTcpData,
} from '@/components/map/vehicle-marker'
import { createRouteLayer, fitMapToRoutes } from '@/components/map/route-utils'
import { FilterPanel, applyFilters } from '@/components/map/filter-panel'

// mapbox css (prevents the warning you saw)
import 'mapbox-gl/dist/mapbox-gl.css'

// bg
import page_bg from '@/assets/page_bg.png'
import { fetchData } from '@/lib/fetch'

// Normalizes misaligned keys coming from TCP feed
function remapTcpFields(pkt) {
  const out = { ...pkt }

  // Address should be what is currently DriverName
  if (pkt.DriverName != null) out.Address = pkt.DriverName

  // DriverName should be what is currently Geozone
  if (pkt.Geozone != null) out.DriverName = pkt.Geozone

  // Geozone should be what is currently "Head Quality"
  // Some feeds use HeadQuality or "Head Quality"—handle both
  const headQuality = pkt.HeadQuality ?? pkt['Head Quality']
  if (headQuality != null) out.Geozone = headQuality

  // Head should be what is currently Pocsagstr (sometimes PocsagStr)
  const pocsag = pkt.Pocsagstr ?? pkt.PocsagStr
  if (pocsag != null) out.Head = pocsag

  // Mileage → you didn’t finish the sentence, so we’ll be cautious:
  // Try common alternates first (Distance, ODO), else keep existing.
  if (pkt.Distance != null) out.Mileage = pkt.Distance
  else if (pkt.ODO != null) out.Mileage = pkt.ODO
  // else leave whatever was there

  return out
}

export default function VehicleDashboard({
  // optional: let parent handle plan fetch on selection
  //onSelectPlan, // (planId) => Promise<{ plan, assigned_units, ... }>
  // optional: pass a ws url override or initial tcp payload
  // tcpSocketUrl = 'ws://64.227.138.235:8001',
  tcpSocketUrl = null,
  initialTcp = null,
} = {}) {
  const { assignment = {}, vehicles } = useGlobalContext()
  const onSelectPlan = async (planId) => {
    const res = await fetchData(`/api/plans/${planId}`) // your details endpoint
    const json = await res.json()
    // Must return at least { assigned_units: [...] }
    return json?.data || {}
  }

  const computedWsUrl = useMemo(() => {
    if (typeof window === 'undefined') return null

    // Support full ws:// or wss:// URL in env
    const envUrl =
      process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_WS_PATH || ''

    if (/^wss?:\/\//i.test(envUrl)) {
      return envUrl
    }

    // Otherwise build from current page + path
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = window.location.host
    const path = (envUrl || '/ws/').replace(/([^/])$/, '$1/') // ensure trailing /
    return `${proto}://${host}${path}`
  }, [])

  // Persist markers across renders
  const markerByPlateRef = useRef(new Map()) // Map<PLATE, mapboxgl.Marker>
  const prevSelectedPlateRef = useRef(null)

  // Toggle selected styling on an existing marker element (uses your ring classes)
  function setMarkerSelected(marker, isSelected) {
    if (!marker) return
    // const el = marker.getElement?.()
    // if (!el) return
    // el.classList.toggle('ring-2', !!isSelected)
    // el.classList.toggle('ring-primary', !!isSelected)
    const el = marker.getElement?.()
    const inner = el?.querySelector?.('.marker-inner')
    if (!inner) return
    inner.classList.toggle('ring-2', !!isSelected)
    inner.classList.toggle('ring-primary', !!isSelected)
  }
  // ---------- Source data ----------
  const data = assignment?.data || {} // now using your assignment store
  const vehiclesList = Array.isArray(vehicles?.data) ? vehicles.data : []
  const usingVehiclesOnly = vehiclesList.length > 0

  // plans come from assignment.data.plans
  const planList = Array.isArray(data?.plans) ? data.plans : []

  // default to first plan in list if available
  const [selectedPlanId, setSelectedPlanId] = useState(planList?.[0]?.id ?? '')

  // no pre-loaded assigned_units for now; parent fetch will supply them
  const [assignedUnits, setAssignedUnits] = useState([])

  // ---------- Live TCP upsert by Plate ----------
  const [liveVehicles, setLiveVehicles] = useState([]) // array of {Plate, Speed, Lat, Lng, ...}
  const [isLiveTracking, setIsLiveTracking] = useState(true)
  const [tcpError, setTcpError] = useState(null)

  // Boot with any initial one-off payload you might pass
  useEffect(() => {
    if (!initialTcp) return
    try {
      if (typeof initialTcp === 'string') {
        const parsed = parseRawTcpData(initialTcp)
        // upsertLive(parsed)
        upsertLive(parsed.map(remapTcpFields))
      } else if (initialTcp?.Plate) {
        // upsertLive([initialTcp])
        upsertLive([remapTcpFields(initialTcp)])
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // WebSocket → upsert by Plate
  useEffect(() => {
    // if (!tcpSocketUrl) return
    const url = tcpSocketUrl || computedWsUrl
    if (!url) return
    let ws
    try {
      // ws = new WebSocket(tcpSocketUrl)
      ws = new WebSocket(url)
    } catch (e) {
      setTcpError('⚠️ Could not open WebSocket')
      return
    }

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data)
        console.log('raw :>> ', raw)
        // your TCP sometimes arrives as one object, sometimes as a rawMessage string
        // normalize:
        const parsed = raw?.rawMessage
          ? parseRawTcpData(raw.rawMessage)
          : raw?.Plate
          ? [raw]
          : []

        // if (Array.isArray(parsed) && parsed.length) {
        //   upsertLive(parsed)
        // }
        if (Array.isArray(parsed) && parsed.length) {
          const remapped = parsed.map(remapTcpFields)
          upsertLive(remapped)
        }
      } catch (e) {
        setTcpError('❌ Invalid JSON received')
      }
    }

    ws.onerror = () => setTcpError('⚠️ WebSocket connection error')
    ws.onclose = () => {
      // no-op
    }
    return () => {
      try {
        ws && ws.close()
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tcpSocketUrl, computedWsUrl])

  function upsertLive(newPackets) {
    setLiveVehicles((prev) => {
      if (!Array.isArray(prev)) prev = []
      const byPlate = new Map(prev.map((v) => [v.Plate, v]))
      for (const pkt of newPackets) {
        if (!pkt?.Plate) continue
        byPlate.set(pkt.Plate, { ...(byPlate.get(pkt.Plate) || {}), ...pkt })
      }
      return Array.from(byPlate.values())
    })
  }

  // ---------- Map & filters ----------
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showAllVehicles, setShowAllVehicles] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [mapboxgl, setMapboxgl] = useState(null)
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState([])

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    vehicleType: 'all',
    route: 'all',
    speedRange: { min: 0, max: 200 },
  })
  const [filteredData, setFilteredData] = useState({
    filteredLive: [],
    filteredRoutes: [],
  })
  const mapContainer = useRef(null)

  // Helper to choose a plate-like identifier from vehicle record
  const pickPlate = (v) =>
    String(
      v?.license_plate || v?.reg_number || v?.fleet_number || v?.id || ''
    ).toUpperCase()

  // Transform either vehicles?.data or assigned_units → cards the UI expects
  const routeCards = useMemo(() => {
    if (usingVehiclesOnly) {
      // Build "vehicle cards" from vehicles list (no route info available here)
      return vehiclesList.map((v) => ({
        vehicle_id: pickPlate(v), // aligns with live marker Plate
        assigned_load_count: 0, // unknown without load_assignment
        total_assigned_kg: 0, // unknown without load_assignment
        loads: [], // unknown; keep shape for filters/UI
        _vehicle: v, // keep raw ref for future use
      }))
    }
    // legacy path: assigned_units → route cards (unchanged)
    return (assignedUnits || []).map((u) => {
      const plate =
        u?.rigid?.plate ||
        u?.horse?.plate ||
        u?.trailer?.plate ||
        u?.plan_unit_id
      let total_kg = 0
      let loadCount = 0
      const loads = []
      const seenRoutes = new Set()
      for (const cust of u.customers || []) {
        for (const order of cust.orders || []) {
          total_kg += Number(order.total_assigned_weight_kg || 0)
          loadCount += 1
        }
        const rn = (cust.route_name || '').trim()
        if (rn && !seenRoutes.has(rn)) {
          seenRoutes.add(rn)
          loads.push({ route_name: rn })
        }
      }
      return {
        vehicle_id: plate,
        assigned_load_count: loadCount,
        total_assigned_kg: total_kg,
        loads,
        _unit: u,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedUnits, vehiclesList, usingVehiclesOnly])

  // Initial mapbox glue
  useEffect(() => {
    if (typeof window === 'undefined' || map) return
    ;(async () => {
      const mapboxModule = await import('mapbox-gl')
      const _mapboxgl = mapboxModule.default
      setMapboxgl(_mapboxgl)
      _mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

      if (mapContainer.current) {
        mapContainer.current.innerHTML = ''
      }

      const mapInstance = new _mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [28.1396, -26.3071],
        zoom: 10,
      })

      mapInstance.on('load', () => setMap(mapInstance))
    })()

    return () => {
      try {
        map && map.remove()
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  // Filter application → responds to live routeCards filters
  useEffect(() => {
    const result = applyFilters(liveVehicles, routeCards, filters)
    setFilteredData(result)
  }, [liveVehicles, routeCards, filters])

  // Use the already-filtered list you render on the left
  const markersSig = useMemo(() => {
    const live = filteredData.filteredLive || []
    // only what affects position identity
    return JSON.stringify(
      live.map((v) => [
        String(v.Plate || '').toUpperCase(),
        Number(v.Latitude || 0).toFixed(5),
        Number(v.Longitude || 0).toFixed(5),
      ])
    )
  }, [filteredData.filteredLive])

  // Route layer drawing
  useEffect(() => {
    if (map && mapboxgl && showRoutes) {
      const vehicleToShow =
        selectedVehicle &&
        !filteredData.filteredLive.find((v) => v.Plate === selectedVehicle)
          ? selectedVehicle
          : null

      createRouteLayer(map, filteredData.filteredRoutes, vehicleToShow)
      if (vehicleToShow) {
        fitMapToRoutes(map, filteredData.filteredRoutes, vehicleToShow)
      }
    } else if (map && !showRoutes) {
      // remove layers if toggled off
      if (map.getLayer('route-lines')) map.removeLayer('route-lines')
      if (map.getSource('route-lines')) map.removeSource('route-lines')
      if (map.getLayer('route-destinations'))
        map.removeLayer('route-destinations')
      if (map.getSource('route-destinations'))
        map.removeSource('route-destinations')
    }
  }, [map, mapboxgl, selectedVehicle, showRoutes, filteredData])

  // Live markers
  useEffect(() => {
    if (!map || !mapboxgl) return

    const currentPlates = new Set()

    for (const v of filteredData.filteredLive || []) {
      const plate = String(v.Plate || '').toUpperCase()
      const lat = Number(v.Latitude)
      const lng = Number(v.Longitude)
      if (!plate || !Number.isFinite(lat) || !Number.isFinite(lng)) continue

      currentPlates.add(plate)

      let marker = markerByPlateRef.current.get(plate)
      if (!marker) {
        // create once
        marker = createVehicleMarker(mapboxgl, v, false)
          .setLngLat([lng, lat])
          .addTo(map)

        marker.getElement()?.addEventListener('click', () => {
          // NOTE: do NOT rebuild markers on click; just update state and highlight
          setSelectedVehicle(plate)
          // optional: center on click
          map.flyTo({ center: [lng, lat], zoom: 15, duration: 900 })
        })

        markerByPlateRef.current.set(plate, marker)
      } else {
        // update position only
        marker.setLngLat([lng, lat])
      }
    }

    // remove stale markers no longer present
    for (const [plate, marker] of markerByPlateRef.current.entries()) {
      if (!currentPlates.has(plate)) {
        marker.remove()
        markerByPlateRef.current.delete(plate)
      }
    }
  }, [map, mapboxgl, markersSig]) // <-- NOT on selectedVehicle anymore

  useEffect(() => {
    if (!map) return
    // unhighlight previous
    const prev = prevSelectedPlateRef.current
    if (prev && markerByPlateRef.current.has(prev)) {
      setMarkerSelected(markerByPlateRef.current.get(prev), false)
    }
    // highlight current
    if (selectedVehicle && markerByPlateRef.current.has(selectedVehicle)) {
      setMarkerSelected(markerByPlateRef.current.get(selectedVehicle), true)
    }
    prevSelectedPlateRef.current = selectedVehicle || null
  }, [selectedVehicle, map])

  const routeSig = useMemo(
    () =>
      JSON.stringify(
        (filteredData.filteredRoutes || []).map((r) => [
          r.vehicle_id,
          r.loads?.length || 0,
          Math.round(r.total_assigned_kg || 0),
        ])
      ),
    [filteredData.filteredRoutes]
  )

  useEffect(() => {
    if (!map || !mapboxgl) return
    if (!showRoutes || !(filteredData.filteredRoutes?.length > 0)) {
      if (map.getLayer('route-lines')) map.removeLayer('route-lines')
      if (map.getSource('route-lines')) map.removeSource('route-lines')
      if (map.getLayer('route-destinations'))
        map.removeLayer('route-destinations')
      if (map.getSource('route-destinations'))
        map.removeSource('route-destinations')
      return
    }
    createRouteLayer(map, filteredData.filteredRoutes, null)
  }, [map, mapboxgl, showRoutes, routeSig])

  const centerOnVehicle = (v) => {
    if (!map || !v?.Latitude || !v?.Longitude) return
    map.flyTo({ center: [v.Longitude, v.Latitude], zoom: 15, duration: 900 })
  }

  const getVehicleStatus = (speed) =>
    speed > 0
      ? { status: 'Moving', color: 'bg-green-500' }
      : { status: 'Stopped', color: 'bg-red-500' }

  const formatTime = (t) => new Date(t).toLocaleTimeString()

  const handleFilterChange = (newFilters) => setFilters(newFilters)

  // ---------- Plan selection ----------
  const prettyPlanLabel = (p) => {
    if (!p) return '—'
    // const dep = p.departure_date
    //   ? new Date(p.departure_date).toLocaleDateString()
    //   : 'n/a'
    // const ran = p.run_at ? new Date(p.run_at).toLocaleString() : null
    // return ran ? `${dep} · run ${ran}` : dep
    const dep = p.departure_date
      ? new Date(p.departure_date).toLocaleDateString()
      : 'n/a'
    const ran = p.run_at ? new Date(p.run_at).toLocaleString() : null
    const extra = []
    if (typeof p.units_count === 'number') extra.push(`${p.units_count} units`)
    if (typeof p.assignments_count === 'number')
      extra.push(`${p.assignments_count} loads`)
    return [dep, ran && `run ${ran}`, extra.length && `· ${extra.join(', ')}`]
      .filter(Boolean)
      .join(' ')
  }

  const onPlanChange = async (planId) => {
    setSelectedPlanId(planId)
    if (onSelectPlan && planId) {
      try {
        const r = await onSelectPlan(planId) // Expect: { plan, assigned_units, ... }
        if (r?.assigned_units) setAssignedUnits(r.assigned_units)
      } catch (e) {
        console.warn('onSelectPlan failed', e)
      }
    }
  }

  // const onPlanChange = async (planId) => {
  //   setSelectedPlanId(planId)

  //   // If a handler is provided, let parent fetch details for that plan
  //   if (planId) {
  //     try {
  //       const r = await fetchData(`plans/`, 'POST', {
  //         plan_id: planId, // required
  //         include_nested: true, // false => plan header only
  //         include_idle: true, // only if include_nested=true
  //       })
  //       // Expecting { plan, assigned_units, unassigned? }
  //       if (r?.assigned_units) {
  //         setAssignedUnits(r.assigned_units)
  //       }
  //     } catch (e) {
  //       console.warn('onSelectPlan failed', e)
  //     }
  //     return
  //   }

  //   // Otherwise leave a placeholder you can replace with your API call:
  //   // Example:
  //   // const resp = await fetch(`/api/assignments/${planId}`)
  //   // const json = await resp.json()
  //   // setAssignedUnits(json?.data?.assigned_units || [])
  // }

  return (
    <div className="h-full bg-background">
      {/* HEADER (kept lightweight to preserve your look/feel) */}
      <div className="border-b bg-transparent ">
        <div className="flex h-16 items-center px-4 md:px-6 gap-3">
          <div className="ml-auto flex items-center gap-3">
            {!usingVehiclesOnly && (
              <Select value={selectedPlanId || ''} onValueChange={onPlanChange}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue
                    placeholder="Select plan…"
                    // placeholder={
                    //   currentPlan
                    //     ? prettyPlanLabel(currentPlan)
                    //     : 'Select plan…'
                    // }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {planList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {prettyPlanLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              variant={showRoutes ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowRoutes(!showRoutes)}
              className="hidden md:inline-flex items-center space-x-2"
            >
              <MapIcon className="h-4 w-4" />
              <span>Routes</span>
            </Button>

            <Button
              variant={isLiveTracking ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsLiveTracking(!isLiveTracking)}
              className="hidden md:inline-flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>{isLiveTracking ? 'Live' : 'Paused'}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* LEFT COLUMN: Live Fleet Scheduled Routes */}
        <div className="w-80 border-r bg-card overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              {/* <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" color="#003e69" />
                <Badge variant="outline" className="text-xs md:text-sm">
                  {liveVehicles.length +
                    (usingVehiclesOnly
                      ? vehiclesList.length
                      : routeCards.length)}{' '}
                  vehicles
                </Badge>
              </div> */}
              <Button
                variant={showRoutes ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowRoutes(!showRoutes)}
                className="hidden md:inline-flex items-center space-x-2"
              >
                <MapIcon className="h-4 w-4" />
                <span>Routes</span>
              </Button>

              <Button
                variant={isLiveTracking ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsLiveTracking(!isLiveTracking)}
                className="hidden md:inline-flex items-center space-x-2"
              >
                <Zap className="h-4 w-4" />
                <span>{isLiveTracking ? 'Live' : 'Paused'}</span>
              </Button>
              <Button
                variant={showAllVehicles ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowAllVehicles(true)
                  setSelectedVehicle(null)
                }}
              >
                Show All
              </Button>
            </div>

            {/* {tcpError && (
              <div className="text-xs text-red-600 mb-3">{tcpError}</div>
            )} */}

            {filteredData.filteredLive.map((vehicle) => (
              <Card
                key={vehicle.Plate}
                className={`mb-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedVehicle === vehicle.Plate ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  setSelectedVehicle(vehicle.Plate)
                  setShowAllVehicles(false)
                  centerOnVehicle(vehicle)
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {vehicle.Plate}
                    </CardTitle>
                    <div className="flex items-center space-x-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          getVehicleStatus(vehicle.Speed).color
                        }`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {getVehicleStatus(vehicle.Speed).status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <Gauge className="h-3 w-3 text-muted-foreground" />
                      <span>{Math.round(vehicle.Speed || 0)} km/h</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">
                        {vehicle.Geozone || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Navigation className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">
                        {vehicle.Latitude?.toFixed(4)},{' '}
                        {vehicle.Longitude?.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{formatTime(vehicle.LocTime || Date.now())}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredData.filteredLive?.length === 0 &&
              liveVehicles?.length > 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No live vehicles match current filters
                </div>
              )}

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {usingVehiclesOnly ? 'Vehicles' : 'Scheduled Routes'}
              </h3>

              {filteredData.filteredRoutes.slice(0, 3).map((vehicle, index) => (
                <Card
                  key={vehicle.vehicle_id}
                  className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
                    selectedVehicle === vehicle.vehicle_id
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedVehicle(vehicle.vehicle_id)
                    setShowAllVehicles(false)
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        Route {index}
                      </CardTitle>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className="text-xs">
                          {vehicle.assigned_load_count} loads
                        </Badge>
                        {showRoutes &&
                          selectedVehicle === vehicle.vehicle_id && (
                            <Eye className="h-3 w-3 text-primary" />
                          )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <RouteIcon className="h-3 w-3 text-muted-foreground" />
                        <span>{Math.round(vehicle.total_assigned_kg)} kg</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">
                          {vehicle.loads?.[0]?.route_name || 'No route'}
                        </span>
                      </div>
                      {vehicle.loads?.length > 1 && (
                        <div className="text-xs text-muted-foreground">
                          +{vehicle.loads.length - 1} more destinations
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredData.filteredRoutes?.length === 0 &&
                routeCards?.length > 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No routes match current filters
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* RIGHT: Map info panel */}
        <div className="flex-1 relative">
          <div
            ref={mapContainer}
            className="w-full h-full"
            style={{ minHeight: '100%' }}
          />

          <FilterPanel
            liveVehicles={liveVehicles}
            routeData={routeCards}
            onFilterChange={handleFilterChange}
            isOpen={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />

          <div className="absolute top-4 right-4 bg-card rounded-lg shadow-lg p-4 max-w-sm">
            <h3 className="font-semibold mb-2 flex items-center space-x-2">
              {selectedVehicle &&
              filteredData.filteredLive.find(
                (v) => v.Plate === selectedVehicle
              ) ? (
                <>
                  <Zap className="h-4 w-4 text-green-500" />
                  <span>{selectedVehicle} - Live Tracking</span>
                </>
              ) : selectedVehicle ? (
                <>
                  <RouteIcon className="h-4 w-4 text-primary" />
                  <span>Route Details</span>
                </>
              ) : (
                <span>Fleet Overview</span>
              )}
            </h3>

            {selectedVehicle &&
              (() => {
                const liveVehicle = filteredData.filteredLive.find(
                  (v) => v.Plate === selectedVehicle
                )
                if (liveVehicle) {
                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Speed:</span>
                        <span className="font-medium">
                          {Math.round(liveVehicle.Speed || 0)} km/h
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Signal Quality:</span>
                        <span className="font-medium">
                          {liveVehicle.Quality || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span className="font-medium text-xs">
                          {liveVehicle.Geozone || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Update:</span>
                        <span className="font-medium text-xs">
                          {formatTime(liveVehicle.LocTime || Date.now())}
                        </span>
                      </div>
                    </div>
                  )
                }

                const routeVehicle = filteredData.filteredRoutes.find(
                  (v) => v.vehicle_id === selectedVehicle
                )
                return routeVehicle ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Weight:</span>
                      <span className="font-medium">
                        {Math.round(routeVehicle.total_assigned_kg)} kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Load Count:</span>
                      <span className="font-medium">
                        {routeVehicle.assigned_load_count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Destinations:</span>
                      <span className="font-medium">
                        {routeVehicle.loads?.length || 0}
                      </span>
                    </div>
                    <div className="mt-3 pt-2 border-t">
                      <div className="text-xs font-medium mb-1">
                        Route Stops:
                      </div>
                      <div className="space-y-1">
                        {(routeVehicle.loads || [])
                          .slice(0, 3)
                          .map((load, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-muted-foreground flex items-center space-x-1"
                            >
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <span>{load.route_name}</span>
                            </div>
                          ))}
                        {routeVehicle?.loads?.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{routeVehicle.loads.length - 3} more stops
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null
              })()}

            {showAllVehicles && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Live Vehicles:</span>
                  <span className="font-medium text-green-600">
                    {filteredData.filteredLive?.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Moving:</span>
                  <span className="font-medium text-green-600">
                    {
                      filteredData.filteredLive.filter(
                        (v) => (v.Speed || 0) > 0
                      )?.length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Stopped:</span>
                  <span className="font-medium text-red-600">
                    {
                      filteredData.filteredLive.filter(
                        (v) => (v.Speed || 0) === 0
                      )?.length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Scheduled Routes:</span>
                  <span className="font-medium">
                    {filteredData.filteredRoutes?.length}
                  </span>
                </div>
                {showRoutes && (
                  <div className="mt-3 pt-2 border-t">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <MapIcon className="h-3 w-3" />
                      <span>Route visualization active</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page BG to preserve visual feel */}
      <Image
        src={page_bg}
        alt=""
        aria-hidden
        className="pointer-events-none select-none fixed bottom-4 right-4 opacity-5 w-40 h-auto"
      />
    </div>
  )
}
