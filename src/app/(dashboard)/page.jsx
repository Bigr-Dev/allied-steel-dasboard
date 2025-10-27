'use client'

import CardsView from '@/components/layout/dashboard/card-view'
import MapWithCards from '@/components/layout/dashboard/map-with-cards'
import MapView from '@/components/layout/dashboard/map-box-view'
import { Button } from '@/components/ui/button'
import DynamicInput from '@/components/ui/dynamic-input'
import { useLiveStore } from '@/config/zustand'
import { useGlobalContext } from '@/context/global-context'
import { fetchData } from '@/lib/fetch'
import { LayoutGrid, Map } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

// image
import page_bg from '@/assets/allied_plain_bg.png'
import Image from 'next/image'
import PageTitle from './[page_id]/@title/default'

/* ---------------- Helpers ---------------- */

// Build a plate-like identifier from a generic vehicle record
function pickPlateFromVehicle(v) {
  const s =
    v?.license_plate ??
    v?.registration ??
    v?.reg ??
    v?.reg_no ??
    v?.regNo ??
    v?.vehicle_reg ??
    v?.vehicleRegistration ??
    v?.fleet_number ??
    v?.plate ??
    v?.id ??
    ''
  return String(s).trim().toUpperCase()
}

// Extract plates from assigned_units: prefer horse.plate, else rigid.plate
function extractPlatesFromAssignedUnits(assignedUnits = []) {
  const set = new Set()
  for (const u of assignedUnits) {
    const plate =
      u?.horse?.plate ??
      u?.rigid?.plate ??
      //  u?.trailer?.plate ??
      u?.plan_unit_id
    if (!plate) continue
    set.add(String(plate).trim().toUpperCase())
  }
  return Array.from(set)
}

// Extract plates from current vehicles dataset (for 'all' mode)
function extractPlatesFromVehiclesList(vehicles = []) {
  const set = new Set()
  for (const v of vehicles) {
    const plate = pickPlateFromVehicle(v)
    if (plate) set.add(plate)
  }
  return Array.from(set)
}

// // Safe JSON parse
// function safeParseJSON(str) {
//   try {
//     return JSON.parse(str)
//   } catch {
//     return null
//   }
// }

function parseRawTcpData(raw) {
  if (typeof raw !== 'string') return []
  const parsed = safeParseJSON(raw)
  if (!parsed) return []
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object' && parsed.Plate) return [parsed]
  return []
}

// --- Safe JSON parse
function safeParseJSON(str) {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

// Normalize misaligned keys coming from TCP feed
function remapTcpFields(pkt = {}) {
  const out = { ...pkt }

  if (pkt.Geozone != null) out.DriverName = pkt.Geozone
  if (pkt.Head != null) out.Geozone = pkt.Head
  if (pkt.Pocsagstr != null) out.Head = pkt.Pocsagstr
  if (pkt.DriverName != null) out.Address = pkt.DriverName

  if (pkt.Distance != null) out.Mileage = pkt.Distance
  else if (pkt.ODO != null) out.Mileage = pkt.ODO
  else if (pkt.Mileage != null) out.Mileage = pkt.Mileage

  return out
}

const Dashboard = () => {
  const { vehicles, assignment } = useGlobalContext()
  const loading = assignment?.loading
  // console.log('vehicles?.data :>> ', vehicles?.data)
  //console.log('assignment :>> ', assignment?.data)
  const [localFilters, setLocalFilters] = useState({
    currentVehicles: vehicles?.data ?? [],
    assignmentData: assignment?.data ?? null,
    plans: assignment?.data?.plans ?? [],
    selectedPlanId: 'all', // uses 'all' or a plan id
    assignedUnits: [],
    currentView: 'cards',
  })
  const [tcpError, setTcpError] = useState(null)
  const [mapShowTick, setMapShowTick] = useState(0)
  //console.log('localFilters :>> ', localFilters)
  // Zustand actions/state
  const upsertPackets = useLiveStore((s) => s.upsertPackets)
  const liveByPlate = useLiveStore((s) => s.liveByPlate)

  // // ----- Live TCP store (keyed by Plate) -----
  // const liveByPlateRef = useRef(Object.create(null))
  // const [liveTick, setLiveTick] = useState(0) // <— drives recompute of vehicleCards

  // ----- Plan change -> fetch units -----
  const onPlanChange = async (value) => {
    setLocalFilters((prev) => ({ ...prev, selectedPlanId: value }))
    if (value == 'all' || value == null) {
      setLocalFilters((prev) => ({ ...prev, assignedUnits: [] }))
      return
    }
    try {
      const r = await fetchData(`plans/`, 'POST', {
        plan_id: value,
        include_nested: true,
        include_idle: true,
      })
      const units = Array.isArray(r?.assigned_units) ? r.assigned_units : []
      //   console.log('r :>> ', r)
      setLocalFilters((prev) => ({ ...prev, assignedUnits: units }))
    } catch (e) {
      console.warn('onSelectPlan failed', e)
      setLocalFilters((prev) => ({ ...prev, assignedUnits: [] }))
    }
  }
  //console.log('localFilters :>> ', localFilters)
  useEffect(() => {
    if (localFilters.currentView === 'map') {
      // give layout a tick to settle, then nudge the map
      requestAnimationFrame(() => {
        setTimeout(() => {
          setMapShowTick((n) => n + 1)
          window.dispatchEvent(new CustomEvent('fleet:map:resize'))
        }, 40)
      })
    }
  }, [localFilters.currentView])
  // Call onPlanChange whenever selectedPlanId changes via the select
  useEffect(() => {
    onPlanChange(localFilters.selectedPlanId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFilters.selectedPlanId])

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

  // ----- Keep context in sync -----
  useEffect(() => {
    const plans = assignment?.data?.plans ?? []
    setLocalFilters((prev) => ({
      ...prev,
      assignmentData: assignment?.data ?? null,
      plans,
    }))
  }, [assignment])

  useEffect(() => {
    setLocalFilters((prev) => ({
      ...prev,
      currentVehicles: vehicles?.data ?? [],
    }))
  }, [vehicles])

  // ----- Compute active target plates -----
  const targetPlates = useMemo(() => {
    if (
      localFilters?.selectedPlanId === 'all' ||
      localFilters?.selectedPlanId === null
    ) {
      return extractPlatesFromVehiclesList(localFilters?.currentVehicles)
    }
    return extractPlatesFromAssignedUnits(localFilters?.assignedUnits)
  }, [
    localFilters?.selectedPlanId,
    localFilters?.currentVehicles,
    localFilters?.assignedUnits,
  ])

  // WebSocket → parse → (optional remap) → filter → upsert into Zustand
  const targetPlatesRef = useRef([])
  useEffect(() => {
    targetPlatesRef.current = targetPlates || []
  }, [targetPlates])

  // ----- WebSocket: tolerant parser, filter to target plates, upsert live -----
  useEffect(() => {
    const url = computedWsUrl
    if (!url) return
    let ws
    try {
      ws = new WebSocket(url)
    } catch (e) {
      setTcpError('⚠️ Could not open WebSocket')
      return
    }

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data)
        let parsed = []
        if (raw && typeof raw === 'object' && 'rawMessage' in raw) {
          const inner = parseRawTcpData(raw.rawMessage) // returns [] if not JSON
          if (inner.length) parsed = inner
        }
        if (!parsed.length) {
          if (raw && typeof raw === 'object' && raw.Plate) parsed = [raw]
          else if (Array.isArray(raw)) parsed = raw
          else parsed = []
        }

        if (!parsed.length) return

        // remap misaligned keys

        const remapped = parsed.map(remapTcpFields)
        // console.log('parsed :>> ', parsed)
        // console.log('remapped :>> ', remapped)
        // filter to current plates (MATCHING STEP)
        const plates = targetPlatesRef.current
        const finalPackets =
          Array.isArray(plates) && plates.length > 0
            ? remapped.filter((p) =>
                plates.includes(
                  String(p.Plate || '')
                    .trim()
                    .toUpperCase()
                )
              )
            : remapped

        if (finalPackets.length) upsertPackets(finalPackets)
      } catch {
        setTcpError('❌ Invalid JSON received')
      }
    }

    ws.onerror = () => setTcpError('⚠️ WebSocket connection error')
    ws.onclose = () => {}

    return () => {
      try {
        ws && ws.close()
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedWsUrl, upsertPackets])

  // ----- Build merged cards (now recomputes on liveTick) -----

  // 2) derive in useMemo (outside the store selector)
  const vehicleCards = useMemo(() => {
    const livePlates = Object.keys(liveByPlate || {})
    const platesToShow = [...(targetPlates || [])]
    // const platesToShow = Array.from(
    //   new Set([...(targetPlates || []), ...livePlates])
    // )
    return platesToShow.map((plate) => ({
      plate,
      live: liveByPlate[plate] || null,
    }))
  }, [liveByPlate, targetPlates])

  // ----- Handlers for toolbar -----
  const handleChange = (e) => {
    const { name, value } = e.target
    setLocalFilters((prev) => ({ ...prev, [name]: value }))
  }
  const handleSelectChange = (name, value) => {
    setLocalFilters((prev) => ({ ...prev, [name]: value }))
  }

  // ----- Plan options -----
  const plans_options = [
    {
      type: 'select',
      htmlFor: 'selectedPlanId',
      placeholder: 'select a plan',
      value: localFilters?.selectedPlanId,
      options:
        localFilters.plans?.length > 0
          ? [
              { value: 'all', label: 'All Vehicles' }, // keep as 'all' string for clarity
              ...localFilters?.plans?.map((p) => ({
                value: p.id,
                label: p.notes || `Plan ${p.id}`,
              })),
            ]
          : [{ value: 'all', label: 'All' }],
    },
  ]

  // When switching to the Map view, nudge a resize after mount/paint
  useEffect(() => {
    if (localFilters.currentView === 'map') {
      requestAnimationFrame(() => {
        setTimeout(
          () => window.dispatchEvent(new CustomEvent('fleet:map:resize')),
          50
        )
      })
    }
  }, [localFilters.currentView])

  /* ---------- Debug while testing ---------- */
  // useEffect(() => {
  //   console.log('[Vehicle Cards]', vehicleCards)
  // }, [vehicleCards])

  // useEffect(() => {
  //   if (tcpError) console.warn('[TCP Error]', tcpError)
  // }, [tcpError])

  //console.log('localFilters :>> ', localFilters)
  return (
    <div className="h-screen space-y-6 p-0 md:p-0 relative">
      <div className="fixed h-full inset-0 -z-10 pointer-events-none">
        <Image
          src={page_bg}
          alt="motion-live-bg"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="fixed w-full shadow-lg z-4 flex flex-col md:flex-row justify-between items-center gap-4 p-4 px-10 bg-white">
        <div>
          <h2 className="text-xl text-[#003e69]   font-bold tracking-tight uppercase">
            {'Dashboard'}
          </h2>
          <p className="text-[#428bca]]">{'View current vehicle status'}</p>
        </div>
        <div
          className={`flex flex-col md:flex-row  items-center justify-between gap-4   `}
        >
          <div className="flex items-center  gap-2  w-[300px]">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Plan:
            </span>

            <div className="">
              <DynamicInput
                inputs={plans_options}
                handleSelectChange={handleSelectChange}
                handleChange={handleChange}
              />
            </div>
          </div>
          <div
            className="flex items-center gap-1 bg-muted p-1 mr-10 rounded-lg"
            data-testid="toolbar-view"
          >
            <Button
              variant={
                localFilters.currentView === 'cards' ? 'default' : 'ghost'
              }
              size="sm"
              onClick={() => handleSelectChange('currentView', 'cards')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
            <Button
              variant={localFilters.currentView === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSelectChange('currentView', 'map')}
              className="gap-2"
            >
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map</span>
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center">loading</div>
      ) : (
        <div>
          {localFilters.currentView === 'cards' ? (
            <div className=" p-4 md:p-6 ">
              <CardsView
                vehicleCards={vehicleCards}
                selectedPlanId={localFilters.selectedPlanId}
                targetPlates={targetPlates}
                assignedUnits={localFilters.assignedUnits}
              />
            </div>
          ) : (
            <div className="w-full h-screen p-0 m-0">
              <MapWithCards
                refreshKey={mapShowTick}
                vehicleCards={vehicleCards}
                selectedPlanId={localFilters.selectedPlanId}
                targetPlates={targetPlates}
                assignedUnits={localFilters.assignedUnits}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard
