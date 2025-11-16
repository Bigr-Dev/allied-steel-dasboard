'use client'

import CardsView from '@/components/layout/dashboard/card-view'
import MapWithCards from '@/components/layout/dashboard/map-with-cards'
import MapView from '@/components/layout/dashboard/map-box-view'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLiveStore } from '@/config/zustand'
import { useGlobalContext } from '@/context/global-context'
import { fetchData } from '@/lib/fetch'
import { assignmentAPI, transformPlanData } from '@/lib/assignment-helpers'
import {
  Funnel,
  LayoutGrid,
  Map,
  Maximize2,
  Minimize2,
  Search,
  Truck,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

// image
import page_bg from '@/assets/allied_plain_bg.png'
import Image from 'next/image'
import PageTitle from './[page_id]/@title/default'
import PlanSelector from '@/components/layout/dashboard/plan-selector'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Toggle } from '@/components/ui/toggle'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Label } from 'recharts'
import { ScrollArea } from '@/components/ui/scroll-area'
import CardsViewSidebar from '@/components/layout/dashboard/cards-view-slider-bar'

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

function extractPlatesFromAssignedUnits(assignedUnits = []) {
  const set = new Set()
  for (const u of assignedUnits) {
    const plate =
      u?.vehicle?.plate ?? u?.horse?.plate ?? u?.rigid?.plate ?? u?.plan_unit_id
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
  //console.log('raw TCP data :>> ', raw)
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

/**
 * Tunables
 */
const OFFLINE_MIN = 10 // minutes without any packet -> offline
const DELAYED_MIN = 15 // minutes stationary since last movement -> delayed
const DEPOT_COLOR = '#003e69'
const ORDER_EVENT = 'fleet:cardOrder:update' // cross-view sync event

// status keys we expose to the filter
const STATUS_KEYS = [
  'moving',
  'stationary',
  'delayed',
  'depot',
  'offline',
  // 'unknown',
]

// status priority order (lower number = higher priority)
const STATUS_PRIORITY = {
  delayed: 0, // highest priority - at top
  moving: 1,
  stationary: 2,
  depot: 3,
  offline: 4,
  unknown: 5, // lowest priority - at bottom
}

// last seen filter options (in minutes)
const LAST_SEEN_OPTIONS = [
  { key: 'all', label: 'All', maxMinutes: Infinity },
  { key: 'live', label: 'Live', maxMinutes: 1 },
  { key: '5min', label: '5 min', maxMinutes: 5 },
  { key: '15min', label: '15 min', maxMinutes: 15 },
  { key: '1hour', label: '1 hour', maxMinutes: 60 },
  { key: '1day', label: '1 day', maxMinutes: 1440 },
]

const Dashboard = () => {
  const { vehicles, assignment, assignment_preview, setAssignmentPreview } =
    useGlobalContext()
  const loading = assignment_preview?.loading
  // console.log('assignment :>> ', assignment)
  // console.log('assignment_preview :>> ', assignment_preview)
  // console.log('vehicles?.data :>> ', vehicles?.data)
  //console.log('assignment :>> ', assignment_preview)
  const [localFilters, setLocalFilters] = useState({
    currentVehicles: vehicles?.data ?? [],
    assignmentData: assignment_preview ?? null,
    plans: assignment?.data?.plans ?? [],
    selectedPlanId: 'all', // uses 'all' or a plan id
    assignedUnits: [],
    currentView: 'cards',
  })
  const [q, setQ] = useState('')

  // const { onEdit } = useGlobalContext()
  // const [q, setQ] = useState('')
  const liveByPlate = useLiveStore((s) => s.liveByPlate)

  // status filter state
  const [statusFilter, setStatusFilter] = useState(new Set(STATUS_KEYS))

  // last seen filter state
  const [lastSeenFilter, setLastSeenFilter] = useState('all')

  // // persistent order (shared across views via localStorage + event)
  // const [savedOrder, setSavedOrder] = usePersistentOrder(selectedPlanId)

  // --- Status filter UI helpers
  const allSelected = statusFilter.size === STATUS_KEYS.length
  const toggleAll = () =>
    setStatusFilter(allSelected ? new Set() : new Set(STATUS_KEYS))
  const toggleOne = (k) =>
    setStatusFilter((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  const statusLabel = {
    moving: 'Moving',
    stationary: 'Stationary',
    delayed: 'Delayed',
    depot: 'Depot',
    offline: 'Offline',
    unknown: 'Unknown',
  }
  const [fullscreen, setFullscreen] = useState(false)

  const goFullScreen = () => {
    const elem = document.getElementById('fullscreen')

    if (elem.requestFullscreen) {
      elem.requestFullscreen()
      setFullscreen(true)
    }
  }

  const exitFullScreen = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen()
      setFullscreen(false)
    } else {
      setFullscreen(false)
    }
  }

  //console.log('localFilters.assignedUnits :>> ', localFilters.assignedUnits)
  const [tcpError, setTcpError] = useState(null)
  const [mapShowTick, setMapShowTick] = useState(0)
  //console.log('localFilters :>> ', localFilters)
  // Zustand actions/state
  const upsertPackets = useLiveStore((s) => s.upsertPackets)
  // const liveByPlate = useLiveStore((s) => s.liveByPlate)

  // // ----- Live TCP store (keyed by Plate) -----
  // const liveByPlateRef = useRef(Object.create(null))
  // const [liveTick, setLiveTick] = useState(0) // <— drives recompute of vehicleCards

  // ----- Plan change -> fetch units -----
  const onPlanChange = async (value) => {
    if (value == 'all' || value == null) {
      setLocalFilters((prev) => ({
        ...prev,
        selectedPlanId: value,
        assignedUnits: [],
      }))
      return
    }

    try {
      const response = await assignmentAPI.getPlan(value)
      // console.log('Plan API response:', response)
      if (response.success) {
        const planData = transformPlanData(response.data)
        //  console.log('Transformed plan data:', planData)
        const units = planData.units || []
        // console.log('Units extracted:', units)
        // Update both selectedPlanId and assignedUnits atomically
        setLocalFilters((prev) => ({
          ...prev,
          selectedPlanId: value,
          assignedUnits: units,
        }))
        setAssignmentPreview(planData)
      }
    } catch (e) {
      console.warn('onSelectPlan failed', e)
      setLocalFilters((prev) => ({
        ...prev,
        selectedPlanId: value,
        assignedUnits: [],
      }))
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
    //const plans = assignment?.data?.plans ?? []
    setLocalFilters((prev) => ({
      ...prev,
      assignmentData: assignment_preview ?? null,
      assignedUnits: assignment_preview?.units ?? [],
      // plans,
    }))
  }, [assignment_preview, setAssignmentPreview])

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
    // console.log('WebSocket URL:', url)

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

  let plan_list = [
    {
      value: 'all',
      label: 'All Vehicles',
    },
  ]

  if (assignment?.data?.plans) {
    localFilters.plans?.forEach((plan) => {
      plan_list.push({
        value: plan.id,
        label: plan.plan_name || `Plan ${plan.id}`,
      })
    })
  }

  return (
    <div className="h-screen space-y-6  relative ">
      <ScrollArea className="h-full w-full " id="fullscreen">
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
        <div className="flex px-4 md:px-6 pt-4 md:pt-6 sticky top-0 z-2  flex-col md:flex-row justify-between items-end gap-4  ">
          <div>
            <ButtonGroup
              className={'bg-[#f3f3f3] border rounded-lg shadow-md p-1 '}
            >
              <Button
                variant={
                  localFilters.currentView === 'cards' ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => handleSelectChange('currentView', 'cards')}
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Cards</span>
              </Button>

              <Button
                variant={
                  localFilters.currentView === 'map' ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => handleSelectChange('currentView', 'map')}
                className="gap-2 "
              >
                <span className="hidden sm:inline">Map</span>
                <Map className="h-4 w-4" />
              </Button>
            </ButtonGroup>
          </div>
          <div>
            <ButtonGroup
              className={'bg-[#f3f3f3] border rounded-lg shadow-md p-1 '}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={'outline'} size="sm">
                    <Funnel className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-3 ">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search plate or driver…"
                        className="pl-8 h-8 "
                      />
                    </div>
                    <Separator className=" " />

                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={allSelected ? 'default' : 'outline'}
                        size="sm"
                        className="h-7"
                        onClick={toggleAll}
                      >
                        All
                      </Button>
                      {STATUS_KEYS.map((k) => (
                        <Button
                          key={k}
                          type="button"
                          size="sm"
                          variant={statusFilter.has(k) ? 'default' : 'outline'}
                          className="h-7"
                          onClick={() => toggleOne(k)}
                          title={statusLabel[k]}
                        >
                          {statusLabel[k]}
                        </Button>
                      ))}
                    </div>
                    <Separator className=" " />

                    <div className="grid grid-cols-3 gap-2">
                      {LAST_SEEN_OPTIONS.map((option) => (
                        <Button
                          key={option.key}
                          type="button"
                          size="sm"
                          variant={
                            lastSeenFilter === option.key
                              ? 'default'
                              : 'outline'
                          }
                          className="h-7"
                          onClick={() => setLastSeenFilter(option.key)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    disabled={localFilters.currentView === 'cards' ?? true}
                    variant={'outline'}
                    size="sm"
                  >
                    <Truck className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  // sideOffset={10}
                  className={'p-0 h-screen overflow-clip '}
                >
                  <CardsViewSidebar
                    q={q}
                    setQ={setQ}
                    vehicleCards={vehicleCards}
                    selectedPlanId={localFilters.selectedPlanId}
                    assignedUnits={localFilters.assignedUnits}
                  />
                </PopoverContent>
              </Popover>
              <PlanSelector
                selectedPlanId={localFilters.selectedPlanId}
                handleSelectChange={handleSelectChange}
                plans={plan_list}
              />
              {!fullscreen ? (
                <Button
                  size="sm"
                  onClick={goFullScreen}
                  className="  rounded-lg"
                  variant={'outline'}
                >
                  <Maximize2 />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={exitFullScreen}
                  className="  rounded-lg"
                >
                  <Minimize2 />
                </Button>
              )}
            </ButtonGroup>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center">loading</div>
        ) : (
          <div>
            {localFilters.currentView === 'cards' ? (
              <div className="h-full w-full px-4 md:px-6 ">
                <CardsView
                  q={q}
                  setQ={setQ}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  lastSeenFilter={lastSeenFilter}
                  setLastSeenFilter={setLastSeenFilter}
                  // goFullScreen={goFullScreen}
                  vehicleCards={vehicleCards}
                  selectedPlanId={localFilters.selectedPlanId}
                  targetPlates={targetPlates}
                  assignedUnits={localFilters.assignedUnits}
                />
              </div>
            ) : (
              <div className="absolute top-0 w-full h-screen  p-0 m-0">
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
      </ScrollArea>
    </div>
  )
}

export default Dashboard
