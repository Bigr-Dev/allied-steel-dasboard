// 'use client'

// import CardsView from '@/components/layout/dashboard/card-view'
// import { Button } from '@/components/ui/button'
// import DynamicInput from '@/components/ui/dynamic-input'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
// import { useGlobalContext } from '@/context/global-context'
// import { fetchData } from '@/lib/fetch'
// import { LayoutGrid, Map } from 'lucide-react'
// import { useEffect, useMemo, useRef, useState } from 'react'

// /* ---------------- Helpers ---------------- */

// // Build a plate-like identifier from a generic vehicle record
// function pickPlateFromVehicle(v) {
//   const s =
//     v?.license_plate ??
//     v?.reg_number ??
//     v?.fleet_number ??
//     v?.plate ??
//     v?.id ??
//     ''
//   return String(s).trim().toUpperCase()
// }

// // Extract plates from assigned_units: prefer horse.plate, else rigid.plate
// function extractPlatesFromAssignedUnits(assignedUnits = []) {
//   const set = new Set()
//   for (const u of assignedUnits) {
//     const plate =
//       u?.horse?.plate ?? u?.rigid?.plate ?? u?.trailer?.plate ?? u?.plan_unit_id
//     if (!plate) continue
//     set.add(String(plate).trim().toUpperCase())
//   }
//   return Array.from(set)
// }

// // Extract plates from current vehicles dataset (for 'all' mode)
// function extractPlatesFromVehiclesList(vehicles = []) {
//   const set = new Set()
//   for (const v of vehicles) {
//     const plate = pickPlateFromVehicle(v)
//     if (plate) set.add(plate)
//   }
//   return Array.from(set)
// }

// // Merge helper: creates a vehicle card for each target plate and overlays live data
// function buildVehicleCards(targetPlates = [], liveByPlate = {}) {
//   return targetPlates.map((plate) => ({
//     plate,
//     live: liveByPlate[plate] || null,
//   }))
// }

// // --- Safe JSON parse
// function safeParseJSON(str) {
//   try {
//     return JSON.parse(str)
//   } catch {
//     return null
//   }
// }

// // Old-dashboard style inner parser for a rawMessage string
// function parseRawTcpData(raw) {
//   if (typeof raw !== 'string') return []
//   const parsed = safeParseJSON(raw)
//   if (!parsed) return []
//   if (Array.isArray(parsed)) return parsed
//   if (parsed && typeof parsed === 'object' && parsed.Plate) return [parsed]
//   return []
// }

// // Normalize misaligned keys coming from TCP feed
// function remapTcpFields(pkt = {}) {
//   const out = { ...pkt }
//   if (pkt.DriverName != null) out.Address = pkt.DriverName // Address <- DriverName
//   if (pkt.Geozone != null) out.DriverName = pkt.Geozone // DriverName <- Geozone
//   const headQuality = pkt.HeadQuality ?? pkt['Head Quality']
//   if (headQuality != null) out.Geozone = headQuality // Geozone <- Head Quality
//   const pocsag = pkt.Pocsagstr ?? pkt.PocsagStr
//   if (pocsag != null) out.Head = pocsag // Head <- Pocsagstr
//   if (pkt.Distance != null) out.Mileage = pkt.Distance // Mileage <- Distance
//   else if (pkt.ODO != null) out.Mileage = pkt.ODO
//   return out
// }

// // Upsert packets (by Plate) into live map
// function upsertLivePackets(liveByPlateRef, packets) {
//   if (!Array.isArray(packets) || packets.length === 0) return false
//   let changed = false
//   for (const pkt of packets) {
//     const plate = String(pkt.Plate || '')
//       .trim()
//       .toUpperCase()
//     if (!plate) continue
//     const prev = liveByPlateRef.current[plate] || {}
//     const next = { ...prev, ...pkt }
//     liveByPlateRef.current[plate] = next
//     changed = true
//   }
//   return changed
// }

// const Dashboard = () => {
//   const { vehicles, assignment } = useGlobalContext()
//   const loading = assignment?.loading

//   const [localFilters, setLocalFilters] = useState({
//     currentVehicles: vehicles?.data ?? [],
//     assignmentData: assignment?.data ?? null,
//     plans: assignment?.data?.plans ?? [],
//     selectedPlanId: 'all', // compatible with your checks
//     assignedUnits: [],
//     currentView: 'cards',
//   })
//   const [tcpError, setTcpError] = useState(null)

//   // ----- Live TCP store (keyed by Plate) -----
//   const liveByPlateRef = useRef(Object.create(null))
//   const [, forceRender] = useState(0)

//   // ----- Plan change -> fetch units -----
//   const onPlanChange = async (value) => {
//     setLocalFilters((prev) => ({ ...prev, selectedPlanId: value }))
//     if (value == 'all' || value == null) {
//       setLocalFilters((prev) => ({ ...prev, assignedUnits: [] }))
//       return
//     }
//     try {
//       const r = await fetchData(`plans/`, 'POST', {
//         plan_id: value,
//         include_nested: true,
//         include_idle: true,
//       })
//       const units = Array.isArray(r?.assigned_units) ? r.assigned_units : []
//       setLocalFilters((prev) => ({ ...prev, assignedUnits: units }))
//     } catch (e) {
//       console.warn('onSelectPlan failed', e)
//       setLocalFilters((prev) => ({ ...prev, assignedUnits: [] }))
//     }
//   }

//   // ----- WS URL -----
//   const computedWsUrl = useMemo(() => {
//     if (typeof window === 'undefined') return null

//     // Support full ws:// or wss:// URL in env
//     const envUrl =
//       process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_WS_PATH || ''

//     if (/^wss?:\/\//i.test(envUrl)) {
//       return envUrl
//     }

//     // Otherwise build from current page + path
//     const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
//     const host = window.location.host
//     const path = (envUrl || '/ws/').replace(/([^/])$/, '$1/') // ensure trailing /
//     return `${proto}://${host}${path}`
//   }, [])

//   // ----- Keep context in sync -----
//   useEffect(() => {
//     const plans = assignment?.data?.plans ?? []
//     setLocalFilters((prev) => ({
//       ...prev,
//       assignmentData: assignment?.data ?? null,
//       plans,
//     }))
//   }, [assignment])

//   useEffect(() => {
//     setLocalFilters((prev) => ({
//       ...prev,
//       currentVehicles: vehicles?.data ?? [],
//     }))
//   }, [vehicles])

//   // ----- Compute active target plates -----
//   const targetPlates = useMemo(() => {
//     if (
//       localFilters?.selectedPlanId === 'all' ||
//       localFilters?.selectedPlanId === null
//     ) {
//       return extractPlatesFromVehiclesList(localFilters?.currentVehicles)
//     }
//     return extractPlatesFromAssignedUnits(localFilters?.assignedUnits)
//   }, [
//     localFilters?.selectedPlanId,
//     localFilters?.currentVehicles,
//     localFilters?.assignedUnits,
//   ])

//   // Ref for filtering without reconnect
//   const targetPlatesRef = useRef([])
//   useEffect(() => {
//     targetPlatesRef.current = Array.isArray(targetPlates) ? targetPlates : []
//   }, [targetPlates])

//   // ----- WebSocket: tolerant parser, filter to target plates, upsert live -----
//   useEffect(() => {
//     const url = computedWsUrl
//     console.log('url :>> ', url)
//     if (!url) return
//     let ws
//     try {
//       ws = new WebSocket(url)
//     } catch (e) {
//       setTcpError('⚠️ Could not open WebSocket')
//       return
//     }

//     ws.onmessage = (event) => {
//       try {
//         const raw = JSON.parse(event.data)
//         console.log('[WS raw]', raw)

//         // normalize to array of packets
//         const parsed = raw?.rawMessage
//           ? parseRawTcpData(raw.rawMessage)
//           : raw?.Plate
//           ? [raw]
//           : Array.isArray(raw)
//           ? raw
//           : []

//         if (!parsed.length) return

//         // remap misaligned keys
//         const remapped = parsed.map(remapTcpFields)

//         // optional filter to current plates
//         const plates = targetPlatesRef.current
//         // const finalPackets =
//         //   Array.isArray(plates) && plates.length > 0
//         //     ? remapped.filter((p) =>
//         //         plates.includes(
//         //           String(p.Plate || '')
//         //             .trim()
//         //             .toUpperCase()
//         //         )
//         //       )
//         //     : remapped
//         const finalPackets = remapped

//         const changed = upsertLivePackets(liveByPlateRef, finalPackets)
//         if (changed) {
//           // Debug the *matched* live data snapshot
//           // console.log('[TCP matched snapshot]', { ...liveByPlateRef.current })
//           forceRender((n) => n + 1)
//         }
//       } catch {
//         setTcpError('❌ Invalid JSON received')
//       }
//     }

//     ws.onerror = () => setTcpError('⚠️ WebSocket connection error')
//     ws.onclose = () => {}

//     return () => {
//       try {
//         ws && ws.close()
//       } catch {}
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [computedWsUrl])

//   // ----- Build merged cards (this is where UI will read from) -----
//   const vehicleCards = useMemo(() => {
//     return buildVehicleCards(targetPlates, liveByPlateRef.current)
//   }, [targetPlates, liveByPlateRef.current])

//   // ----- Handlers for toolbar -----
//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setLocalFilters((prev) => ({ ...prev, [name]: value }))
//   }
//   const handleSelectChange = (name, value) => {
//     setLocalFilters((prev) => ({ ...prev, [name]: value }))
//   }

//   // ----- Plan options (keeps your null 'All' for compatibility) -----
//   const plans_options = [
//     {
//       type: 'select',
//       htmlFor: 'selectedPlanId',
//       placeholder: 'select a plan',
//       value: localFilters?.selectedPlanId,
//       options:
//         localFilters.plans?.length > 0
//           ? [
//               { value: null, label: 'All' },
//               ...localFilters?.plans?.map((p) => ({
//                 value: p.id,
//                 label: p.notes || `Plan ${p.id}`,
//               })),
//             ]
//           : [{ value: null, label: 'All' }],
//     },
//   ]

//   /* ---------- Debug you’ll want to see while testing ---------- */
//   useEffect(() => {
//     console.log('[Target Plates]', targetPlates)
//   }, [targetPlates])

//   useEffect(() => {
//     console.log('[Vehicle Cards]', vehicleCards)
//   }, [vehicleCards])

//   useEffect(() => {
//     if (tcpError) console.warn('[TCP Error]', tcpError)
//   }, [tcpError])

// return (
//   <div className="h-full space-y-6 p-4 md:p-6">
//     <div
//       className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
//         localFilters.currentView === 'map' && 'fixed left-18 right-6'
//       }`}
//     >
//       <div className="flex items-center gap-2 w-full md:w-auto">
//         <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
//           Plan:
//         </span>
//         <DynamicInput
//           inputs={plans_options}
//           handleSelectChange={handleSelectChange}
//           handleChange={handleChange}
//         />
//       </div>
//       <div
//         className="flex items-center gap-1 bg-muted p-1 rounded-lg"
//         data-testid="toolbar-view"
//       >
//         <Button
//           variant={localFilters.currentView === 'cards' ? 'default' : 'ghost'}
//           size="sm"
//           onClick={() => handleSelectChange('currentView', 'cards')}
//           className="gap-2"
//         >
//           <LayoutGrid className="h-4 w-4" />
//           <span className="hidden sm:inline">Cards</span>
//         </Button>
//         <Button
//           variant={localFilters.currentView === 'map' ? 'default' : 'ghost'}
//           size="sm"
//           onClick={() => handleSelectChange('currentView', 'map')}
//           className="gap-2"
//         >
//           <Map className="h-4 w-4" />
//           <span className="hidden sm:inline">Map</span>
//         </Button>
//       </div>
//     </div>
//     {loading ? (
//       <div className="flex items-center justify-center">loading</div>
//     ) : (
//       <div>
//         {localFilters.currentView === 'cards' ? (
//           <CardsView
//             vehicleCards={vehicleCards}
//             selectedPlanId={localFilters.selectedPlanId}
//             targetPlates={targetPlates}
//             assignedUnits={localFilters.assignedUnits}
//           />
//         ) : (
//           <div>Map</div>
//         )}
//       </div>
//     )}
//   </div>
// )
// }

// export default Dashboard

'use client'

import CardsView from '@/components/layout/dashboard/card-view'
import MapView from '@/components/layout/dashboard/MapView'
import { Button } from '@/components/ui/button'
import DynamicInput from '@/components/ui/dynamic-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGlobalContext } from '@/context/global-context'
import { fetchData } from '@/lib/fetch'
import { LayoutGrid, Map } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

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
      u?.horse?.plate ?? u?.rigid?.plate ?? u?.trailer?.plate ?? u?.plan_unit_id
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

// Merge helper: creates a vehicle card for each target plate and overlays live data
function buildVehicleCards(targetPlates = [], liveByPlate = {}) {
  return targetPlates.map((plate) => ({
    plate,
    live: liveByPlate[plate] || null,
  }))
}

// --- Safe JSON parse
function safeParseJSON(str) {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

// Old-dashboard style inner parser for a rawMessage string
function parseRawTcpData(raw) {
  if (typeof raw !== 'string') return []
  const parsed = safeParseJSON(raw)
  if (!parsed) return []
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object' && parsed.Plate) return [parsed]
  return []
}

// Normalize misaligned keys coming from TCP feed
function remapTcpFields(pkt = {}) {
  const out = { ...pkt }
  if (pkt.DriverName != null) out.Address = pkt.DriverName // Address <- DriverName
  if (pkt.Geozone != null) out.DriverName = pkt.Geozone // DriverName <- Geozone
  const headQuality = pkt.HeadQuality ?? pkt['Head Quality']
  if (headQuality != null) out.Geozone = headQuality // Geozone <- Head Quality
  const pocsag = pkt.Pocsagstr ?? pkt.PocsagStr
  if (pocsag != null) out.Head = pocsag // Head <- Pocsagstr
  if (pkt.Distance != null) out.Mileage = pkt.Distance // Mileage <- Distance
  else if (pkt.ODO != null) out.Mileage = pkt.ODO
  return out
}

// Upsert packets (by Plate) into live map
function upsertLivePackets(liveByPlateRef, packets) {
  if (!Array.isArray(packets) || packets.length === 0) return false
  let changed = false
  for (const pkt of packets) {
    const plate = String(pkt.Plate || '')
      .trim()
      .toUpperCase()
    if (!plate) continue
    const prev = liveByPlateRef.current[plate] || {}
    const next = { ...prev, ...pkt }
    liveByPlateRef.current[plate] = next
    changed = true
  }
  return changed
}

const Dashboard = () => {
  const { vehicles, assignment } = useGlobalContext()
  const loading = assignment?.loading

  const [localFilters, setLocalFilters] = useState({
    currentVehicles: vehicles?.data ?? [],
    assignmentData: assignment?.data ?? null,
    plans: assignment?.data?.plans ?? [],
    selectedPlanId: 'all', // uses 'all' or a plan id
    assignedUnits: [],
    currentView: 'cards',
  })
  const [tcpError, setTcpError] = useState(null)

  // ----- Live TCP store (keyed by Plate) -----
  const liveByPlateRef = useRef(Object.create(null))
  const [liveTick, setLiveTick] = useState(0) // <— drives recompute of vehicleCards

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
      setLocalFilters((prev) => ({ ...prev, assignedUnits: units }))
    } catch (e) {
      console.warn('onSelectPlan failed', e)
      setLocalFilters((prev) => ({ ...prev, assignedUnits: [] }))
    }
  }

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

  // Ref for filtering without reconnect
  const targetPlatesRef = useRef([])
  useEffect(() => {
    targetPlatesRef.current = Array.isArray(targetPlates) ? targetPlates : []
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
        console.log('raw :>> ', raw)
        // normalize to array of packets
        // Normalize to an array of packets.
        // If rawMessage exists but isn't JSON (pipe-delimited), fall back to the top-level object.
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
        // const parsed = raw?.rawMessage
        //   ? parseRawTcpData(raw.rawMessage)
        //   : raw?.Plate
        //   ? [raw]
        //   : Array.isArray(raw)
        //   ? raw
        //   : []

        if (!parsed.length) return

        // remap misaligned keys
        const remapped = parsed
        // const remapped = parsed.map(remapTcpFields)
        console.log('remapped :>> ', remapped)
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

        const changed = upsertLivePackets(liveByPlateRef, finalPackets)
        if (changed) {
          // For debugging: see keys that are alive vs targets
          const liveKeys = Object.keys(liveByPlateRef.current)
          console.log('[TCP live keys]', liveKeys.slice(0, 20), '…')
          console.log('[Target Plates]', plates.slice(0, 20), '…')
          setLiveTick((n) => n + 1) // <— triggers vehicleCards recompute
        }
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
  }, [computedWsUrl])

  // ----- Build merged cards (now recomputes on liveTick) -----
  const vehicleCards = useMemo(() => {
    const livePlates = Object.keys(liveByPlateRef.current)
    // Union so cards render for incoming live plates even if not in extracted targetPlates yet
    const platesToShow = Array.from(
      new Set([...(targetPlates || []), ...livePlates])
    )
    return buildVehicleCards(platesToShow, liveByPlateRef.current)
  }, [targetPlates, liveTick])
  // const vehicleCards = useMemo(() => {
  //   return buildVehicleCards(targetPlates, liveByPlateRef.current)
  // }, [targetPlates, liveTick])

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
              { value: 'all', label: 'All' }, // keep as 'all' string for clarity
              ...localFilters?.plans?.map((p) => ({
                value: p.id,
                label: p.notes || `Plan ${p.id}`,
              })),
            ]
          : [{ value: 'all', label: 'All' }],
    },
  ]

  /* ---------- Debug while testing ---------- */
  useEffect(() => {
    console.log('[Vehicle Cards]', vehicleCards)
  }, [vehicleCards])

  useEffect(() => {
    if (tcpError) console.warn('[TCP Error]', tcpError)
  }, [tcpError])

  console.log('localFilters :>> ', localFilters)
  return (
    <div className="h-full space-y-6 p-4 md:p-6">
      <div
        className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          localFilters.currentView === 'map' && 'fixed left-18 right-6'
        }`}
      >
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Plan:
          </span>
          <DynamicInput
            inputs={plans_options}
            handleSelectChange={handleSelectChange}
            handleChange={handleChange}
          />
        </div>
        <div
          className="flex items-center gap-1 bg-muted p-1 rounded-lg"
          data-testid="toolbar-view"
        >
          <Button
            variant={localFilters.currentView === 'cards' ? 'default' : 'ghost'}
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
      {loading ? (
        <div className="flex items-center justify-center">loading</div>
      ) : (
        <div>
          {localFilters.currentView === 'cards' ? (
            <CardsView
              vehicleCards={vehicleCards}
              selectedPlanId={localFilters.selectedPlanId}
              targetPlates={targetPlates}
              assignedUnits={localFilters.assignedUnits}
            />
          ) : (
            <div className="h-screen">
              <MapView vehicleCards={vehicleCards} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard

// 'use client'

// import { Button } from '@/components/ui/button'
// import DynamicInput from '@/components/ui/dynamic-input'

// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
// import { useGlobalContext } from '@/context/global-context'
// import { fetchData } from '@/lib/fetch'
// import { LayoutGrid, Map } from 'lucide-react'
// import { useEffect, useMemo, useState } from 'react'

// // Build a plate-like identifier from a generic vehicle record
// function pickPlateFromVehicle(v) {
//   const s =
//     v?.license_plate ??
//     v?.reg_number ??
//     v?.fleet_number ??
//     v?.plate ??
//     v?.id ??
//     ''
//   return String(s).trim().toUpperCase()
// }

// // Extract plates from assigned_units: prefer horse.plate, else rigid.plate
// function extractPlatesFromAssignedUnits(assignedUnits = []) {
//   const set = new Set()

//   for (const u of assignedUnits) {
//     const plate =
//       u?.horse?.plate ?? u?.rigid?.plate ?? u?.trailer?.plate ?? u?.plan_unit_id
//     if (!plate) continue
//     set.add(String(plate).trim().toUpperCase())
//   }
//   return Array.from(set)
// }

// // Extract plates from current vehicles dataset (for 'all' mode)
// function extractPlatesFromVehiclesList(vehicles = []) {
//   const set = new Set()
//   for (const v of vehicles) {
//     const plate = pickPlateFromVehicle(v)
//     if (plate) set.add(plate)
//   }
//   return Array.from(set)
// }

// // Merge helper: creates a vehicle card for each target plate and overlays live data
// function buildVehicleCards(targetPlates = [], liveByPlate = {}) {
//   return targetPlates.map((plate) => {
//     const live = liveByPlate[plate] || null
//     return {
//       plate,
//       live, // {Plate, Latitude, Longitude, Speed, etc.} (remapped)
//       // add more computed fields here later (e.g., status, lastSeen, etc.)
//     }
//   })
// }

// const Dashboard = () => {
//   const { vehicles, assignment } = useGlobalContext()

//   const loading = assignment?.loading
//   const [localFilters, setLocalFilters] = useState({
//     currentVehicles: vehicles?.data,
//     assignmentData: assignment?.data,
//     plans: assignment?.data?.plans,
//     selectedPlanId: 'all',
//     assignedUnits: [],
//     currentView: 'cards',
//   })
//   const [tcpError, setTcpError] = useState(null)

//   const onPlanChange = async (value) => {
//     if (value == 'all' || value == null) return
//     try {
//       const r = await fetchData(`plans/`, 'POST', {
//         plan_id: value, // required
//         include_nested: true, // false => plan header only
//         include_idle: true, // only if include_nested=true
//       }) // Expect: { plan, assigned_units, ... }

//       if (r?.assigned_units)
//         setLocalFilters((prev) => ({
//           ...prev,
//           assignedUnits: r.assigned_units,
//         }))
//     } catch (e) {
//       console.warn('onSelectPlan failed', e)
//     }
//   }

// const computedWsUrl = useMemo(() => {
//   if (typeof window === 'undefined') return null

//   // Support full ws:// or wss:// URL in env
//   const envUrl =
//     process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_WS_PATH || ''

//   if (/^wss?:\/\//i.test(envUrl)) {
//     return envUrl
//   }

//   // Otherwise build from current page + path
//   const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
//   const host = window.location.host
//   const path = (envUrl || '/ws/').replace(/([^/])$/, '$1/') // ensure trailing /
//   return `${proto}://${host}${path}`
// }, [])

//   useEffect(() => {
//     const url = computedWsUrl
//     if (!url) return
//     let ws
//     try {
//       ws = new WebSocket(url)
//     } catch (e) {
//       setTcpError('⚠️ Could not open WebSocket')
//       return
//     }

//     ws.onmessage = (event) => {
//       try {
//         const raw = JSON.parse(event.data)
//         console.log('raw :>> ', raw)
//         // your TCP sometimes arrives as one object, sometimes as a rawMessage string
//         // normalize:
//         const parsed = raw?.rawMessage
//           ? parseRawTcpData(raw.rawMessage)
//           : raw?.Plate
//           ? [raw]
//           : []

//         // if (Array.isArray(parsed) && parsed.length) {
//         //   upsertLive(parsed)
//         // }
//         if (Array.isArray(parsed) && parsed.length) {
//           const remapped = parsed.map(remapTcpFields)
//           upsertLive(remapped)
//         }
//       } catch (e) {
//         setTcpError('❌ Invalid JSON received')
//       }
//     }

//     ws.onerror = () => setTcpError('⚠️ WebSocket connection error')
//     ws.onclose = () => {
//       // no-op
//     }
//     return () => {
//       try {
//         ws && ws.close()
//       } catch {}
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [computedWsUrl])

//   useEffect(() => {
//     const plans = assignment?.data?.plans ?? []
//     setLocalFilters((prev) => ({
//       ...prev,
//       assignmentData: assignment?.data ?? null,
//       plans,
//       // selectedPlanId: prev.selectedPlanId ?? plans[0]?.id ?? null,
//     }))
//   }, [assignment])

//   useEffect(() => {
//     setLocalFilters((prev) => ({
//       ...prev,
//       currentVehicles: vehicles?.data ?? [],
//     }))
//   }, [vehicles])

//   useEffect(() => {
//     if (localFilters.selectedPlanId) onPlanChange(localFilters.selectedPlanId)
//     else setLocalFilters((prev) => ({ ...prev, assignedUnits: null }))
//   }, [localFilters.selectedPlanId])

//   // ---------- Compute the active list of target plates ----------
//   const targetPlates = useMemo(() => {
//     if (
//       localFilters?.selectedPlanId === 'all' ||
//       localFilters?.selectedPlanId === null
//     ) {
//       //      console.log('vehicleList :>> ')
//       return extractPlatesFromVehiclesList(localFilters?.currentVehicles)
//     }
//     // plan mode
//     //   console.log('extract :>> ')
//     return extractPlatesFromAssignedUnits(localFilters?.assignedUnits)
//   }, [
//     localFilters?.selectedPlanId,
//     localFilters?.currentVehicles,
//     localFilters?.assignedUnits,
//   ])
//   console.log('targetPlates :>> ', targetPlates)
//   const handleChange = (e) => {
//     console.log('e.target :>> ', e.target)
//     const { name, value } = e.target
//     setLocalFilters((prev) => ({
//       ...prev,
//       [name]: value,
//     }))
//   }

//   const handleSelectChange = (name, value) => {
//     setLocalFilters((prev) => ({
//       ...prev,
//       [name]: value,
//     }))
//   }

//   const plans_options = [
//     {
//       type: 'select',
//       htmlFor: 'selectedPlanId',
//       // label: 'Plans *',
//       placeholder: 'selected a plan',
//       value: localFilters?.selectedPlanId,
//       // required: true,
//       options:
//         localFilters.plans?.length > 0
//           ? [
//               { value: null, label: 'All' },
//               ...localFilters?.plans?.map((p) => {
//                 return { value: p.id, label: p.notes }
//               }),
//             ]
//           : [{ value: null, label: 'All' }],
//     },
//   ]

//   return (
//     <div className="h-full space-y-6 p-4 md:p-6">
//       <div
//         className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
//           localFilters.currentView === 'map' && 'fixed left-18 right-6'
//         }`}
//       >
//         <div className="flex items-center gap-2 w-full md:w-auto">
//           <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
//             Plan:
//           </span>
//           <DynamicInput
//             inputs={plans_options}
//             handleSelectChange={handleSelectChange}
//             handleChange={handleChange}
//           />
//         </div>
//         <div
//           className="flex items-center gap-1 bg-muted p-1 rounded-lg"
//           data-testid="toolbar-view"
//         >
//           <Button
//             variant={localFilters.currentView === 'cards' ? 'default' : 'ghost'}
//             size="sm"
//             onClick={() => handleSelectChange('currentView', 'cards')}
//             className="gap-2"
//           >
//             <LayoutGrid className="h-4 w-4" />
//             <span className="hidden sm:inline">Cards</span>
//           </Button>
//           <Button
//             variant={localFilters.currentView === 'map' ? 'default' : 'ghost'}
//             size="sm"
//             onClick={() => handleSelectChange('currentView', 'map')}
//             className="gap-2"
//           >
//             <Map className="h-4 w-4" />
//             <span className="hidden sm:inline">Map</span>
//           </Button>
//         </div>
//       </div>
//       {loading ? (
//         <div className="flex items-center justify-center">loading</div>
//       ) : (
//         <div>
//           {localFilters.currentView === 'cards' ? (
//             <div>Cards</div>
//           ) : (
//             //    <CardsView
//             //   vehicleCards={vehicleCards}
//             //   selectedPlanId={localFilters.selectedPlanId}
//             //   targetPlates={targetPlates}
//             //   assignedUnits={localFilters.assignedUnits}
//             // />
//             <div>Map</div>
//           )}
//         </div>
//       )}
//     </div>
//   )
// }

// export default Dashboard
