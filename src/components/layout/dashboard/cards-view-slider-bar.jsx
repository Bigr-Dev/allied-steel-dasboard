// // 'use client'

// // import React, { useMemo, useRef, useState } from 'react'
// // import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// // import { Badge } from '@/components/ui/badge'
// // import { Input } from '@/components/ui/input'
// // import { Search, User, Gauge, Clock, MapPin, Navigation } from 'lucide-react'
// // import { useLiveStore } from '@/config/zustand'

// // const OFFLINE_MIN = 5 // minutes since last packet
// // const DELAYED_MIN = 15 // minutes without movement
// // const DEPOT_COLOR = '#003e69'

// // function getTimestampMs(live) {
// //   if (!live) return null
// //   if (typeof live.Timestamp === 'number' && Number.isFinite(live.Timestamp))
// //     return live.Timestamp
// //   if (typeof live.Time === 'string') {
// //     const t = Date.parse(live.Time)
// //     if (Number.isFinite(t)) return t
// //   }
// //   if (typeof live.LocTime === 'string') {
// //     const t = Date.parse(live.LocTime.replace(' ', 'T') + 'Z')
// //     if (Number.isFinite(t)) return t
// //   }
// //   return null
// // }

// // function isDepot(geo) {
// //   const s = String(geo || '')
// //     .trim()
// //     .toUpperCase()
// //   return s === 'ASSM' || s === 'ALRODE DEPOT'
// // }

// // function getStatus(live) {
// //   const ts = getTimestampMs(live)
// //   const speed = Number(live?.Speed ?? 0)
// //   if (ts == null) return 'offline'
// //   const minutes = (Date.now() - ts) / 60000
// //   if (minutes > 5) return 'offline'
// //   return speed > 0 ? 'moving' : 'idle'
// // }
// // function statusBadge(status) {
// //   if (status === 'moving')
// //     return { className: 'bg-green-500 hover:bg-green-600', text: 'moving' }
// //   if (status === 'idle')
// //     return { className: 'bg-amber-500 hover:bg-amber-600', text: 'idle' }
// //   return { className: 'bg-gray-400 hover:bg-gray-500', text: 'offline' }
// // }
// // function lastSeen(live) {
// //   const ts = getTimestampMs(live)
// //   if (ts == null) return 'Unknown'
// //   const d = Date.now() - ts
// //   if (d < 60_000) return 'Live'
// //   if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
// //   if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
// //   return `${Math.floor(d / 86_400_000)}d ago`
// // }

// // export default function CardsViewSidebar({ vehicleCards = [] }) {
// //   const [q, setQ] = useState('')
// //   const liveByPlate = useLiveStore((s) => s.liveByPlate)

// //   // Track last movement per plate
// //   const lastMoveRef = useRef(new Map()) // plate -> timestamp(ms)

// //   function deriveStatus(plate, live) {
// //     const now = Date.now()
// //     const ts = getTimestampMs(live)
// //     const speed = Number(live?.Speed ?? 0)
// //     const depot = isDepot(live?.Geozone)

// //     // offline if no packet recently
// //     if (ts == null || (now - ts) / 60000 > OFFLINE_MIN)
// //       return { key: 'offline', color: '#9ca3af', flash: false }

// //     // update last-move tracker
// //     const prevMove = lastMoveRef.current.get(plate) ?? ts
// //     if (speed > 0) {
// //       lastMoveRef.current.set(plate, ts)
// //     } else if (!lastMoveRef.current.has(plate)) {
// //       lastMoveRef.current.set(plate, prevMove) // seed once
// //     }

// //     if (depot) return { key: 'depot', color: DEPOT_COLOR, flash: false }

// //     // delayed: online + speed==0 + no movement >= 15 min
// //     const lastMoveTs = lastMoveRef.current.get(plate) ?? ts
// //     const minutesSinceMove = (now - lastMoveTs) / 60000
// //     if (speed === 0 && minutesSinceMove >= DELAYED_MIN) {
// //       return { key: 'delayed', color: '#f59e0b', flash: true } // orange
// //     }

// //     if (speed > 0) return { key: 'moving', color: '#10b981', flash: false } // green
// //     return { key: 'stationary', color: '#ef4444', flash: false } // red
// //   }

// //   function lastSeen(live) {
// //     const ts = getTimestampMs(live)
// //     if (ts == null) return 'Unknown'
// //     const d = Date.now() - ts
// //     if (d < 60_000) return 'Live'
// //     if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
// //     if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
// //     return `${Math.floor(d / 86_400_000)}d ago`
// //   }

// //   const items = useMemo(() => {
// //     const withFresh = vehicleCards.map((c) => ({
// //       ...c,
// //       live: liveByPlate[c.plate] ?? c.live,
// //     }))
// //     const filtered = withFresh.filter((c) => {
// //       const p = c.plate?.toLowerCase() || ''
// //       const d = c.live?.DriverName?.toLowerCase?.() || ''
// //       return q
// //         ? p.includes(q.toLowerCase()) || d.includes(q.toLowerCase())
// //         : true
// //     })
// //     filtered.sort(
// //       (a, b) =>
// //         (getTimestampMs(b.live) ?? -Infinity) -
// //         (getTimestampMs(a.live) ?? -Infinity)
// //     )
// //     return filtered
// //   }, [vehicleCards, q, liveByPlate])

// //   const focus = (plate) =>
// //     window.dispatchEvent(
// //       new CustomEvent('fleet:focusPlate', { detail: { plate } })
// //     )

// //   // const items = useMemo(() => {
// //   //   const withFresh = vehicleCards.map((c) => ({
// //   //     ...c,
// //   //     live: liveByPlate[c.plate] ?? c.live,
// //   //   }))
// //   //   const filtered = withFresh.filter((c) => {
// //   //     const p = c.plate?.toLowerCase() || ''
// //   //     const d = c.live?.DriverName?.toLowerCase?.() || ''
// //   //     return q
// //   //       ? p.includes(q.toLowerCase()) || d.includes(q.toLowerCase())
// //   //       : true
// //   //   })
// //   //   // newest first
// //   //   filtered.sort(
// //   //     (a, b) =>
// //   //       (getTimestampMs(b.live) ?? -Infinity) -
// //   //       (getTimestampMs(a.live) ?? -Infinity)
// //   //   )
// //   //   return filtered
// //   // }, [vehicleCards, q, liveByPlate])

// //   // const focus = (plate) =>
// //   //   window.dispatchEvent(
// //   //     new CustomEvent('fleet:focusPlate', { detail: { plate } })
// //   //   )

// //   return (
// //     <div className="h-full flex flex-col">
// //       <div className="border-b bg-card">
// //         <div className="px-3 py-3">
// //           <div className="relative">
// //             <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
// //             <Input
// //               value={q}
// //               onChange={(e) => setQ(e.target.value)}
// //               placeholder="Search…"
// //               className="pl-7 h-8 text-xs"
// //             />
// //           </div>
// //         </div>
// //       </div>

// //       <div className="flex-1 overflow-auto p-2 space-y-2">
// //         {items.map((item) => {
// //           //    console.log('item :>> ', item)
// //           const s = deriveStatus(item.plate, item.live)
// //           const badgeStyle = {
// //             background: s.color,
// //             color: '#fff',
// //             animation: s.flash ? 'pulse 1s ease-in-out infinite' : undefined,
// //           }
// //           const speed = Number(item?.live?.Speed ?? 0)

// //           return (
// //             <Card
// //               key={item.plate}
// //               className="cursor-pointer hover:shadow-sm"
// //               onClick={() => focus(item.plate)}
// //             >
// //               <CardHeader className="py-2 px-3">
// //                 <div className="flex items-center justify-between">
// //                   <CardTitle className="text-base font-mono">
// //                     {item.plate}
// //                   </CardTitle>
// //                   <Badge style={badgeStyle} className="text-[10px] capitalize">
// //                     {s.key}
// //                   </Badge>
// //                 </div>
// //               </CardHeader>
// //               <CardContent className="px-3 pb-3 pt-0">
// //                 {item.live ? (
// //                   <div className="space-y-1.5 text-xs">
// //                     <div className="flex items-center gap-2">
// //                       <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
// //                       <span className="font-medium">
// //                         {speed.toFixed(1)} km/h
// //                       </span>
// //                     </div>
// //                     {item.live.DriverName && (
// //                       <div className="flex items-center gap-2">
// //                         <User className="h-3.5 w-3.5 text-muted-foreground" />
// //                         <span>{item.live.DriverName}</span>
// //                       </div>
// //                     )}
// //                     {item.live.Address && (
// //                       <div className="flex items-start gap-2">
// //                         <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
// //                         <span className="text-[11px] text-muted-foreground line-clamp-2">
// //                           {item.live.Address}
// //                         </span>
// //                       </div>
// //                     )}
// //                     {item.live.zone && (
// //                       <div className="flex items-center gap-2 text-sm">
// //                         <Navigation className="h-4 w-4 text-muted-foreground" />
// //                         <span className="text-muted-foreground">
// //                           {item.live.zone}
// //                         </span>
// //                       </div>
// //                     )}
// //                     <div className="text-[11px] text-muted-foreground border-t pt-1">
// //                       Last seen: {lastSeen(item.live)}
// //                     </div>
// //                   </div>
// //                 ) : (
// //                   <div className="text-xs text-muted-foreground">
// //                     No live data.
// //                   </div>
// //                 )}
// //               </CardContent>
// //             </Card>
// //           )
// //         })}
// //       </div>

// //       {/* simple pulse keyframes */}
// //       <style jsx global>{`
// //         @keyframes pulse {
// //           0%,
// //           100% {
// //             opacity: 1;
// //           }
// //           50% {
// //             opacity: 0.45;
// //           }
// //         }
// //       `}</style>
// //     </div>
// //   )

// //   // return (
// //   //   <div className="h-full flex flex-col">
// //   //     <div className="border-b border-border bg-card">
// //   //       <div className="px-3 py-3">
// //   //         <div className="relative">
// //   //           <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
// //   //           <Input
// //   //             value={q}
// //   //             onChange={(e) => setQ(e.target.value)}
// //   //             placeholder="Search…"
// //   //             className="pl-7 h-8 text-xs"
// //   //           />
// //   //         </div>
// //   //       </div>
// //   //     </div>

// //   //     <div className="flex-1 overflow-auto p-2 space-y-2">
// //   //       {items.map((item) => {
// //   //         const s = getStatus(item.live)
// //   //         const b = statusBadge(s)
// //   //         const speed = Number(item?.live?.Speed ?? 0)

// //   //         return (
// //   //           <Card
// //   //             key={item.plate}
// //   //             className="cursor-pointer hover:shadow-sm"
// //   //             onClick={() => focus(item.plate)}
// //   //           >
// //   //             <CardHeader className="py-2 px-3">
// //   //               <div className="flex items-center justify-between">
// //   //                 <CardTitle className="text-base font-mono">
// //   //                   {item.plate}
// //   //                 </CardTitle>
// //   //                 <Badge className={`text-[10px] ${b.className}`}>
// //   //                   {b.text}
// //   //                 </Badge>
// //   //               </div>
// //   //             </CardHeader>
// //   //             <CardContent className="px-3 pb-3 pt-0">
// //   //               {item.live ? (
// //   //                 <div className="space-y-1.5 text-xs">
// //   //                   <div className="flex items-center gap-2">
// //   //                     <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
// //   //                     <span className="font-medium">
// //   //                       {speed.toFixed(1)} km/h
// //   //                     </span>
// //   //                   </div>
// //   //                   {item.live.DriverName && (
// //   //                     <div className="flex items-center gap-2">
// //   //                       <User className="h-3.5 w-3.5 text-muted-foreground" />
// //   //                       <span>{item.live.DriverName}</span>
// //   //                     </div>
// //   //                   )}
// //   //                   {item.live.Address && (
// //   //                     <div className="flex items-start gap-2">
// //   //                       <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
// //   //                       <span className="text-[11px] text-muted-foreground line-clamp-2">
// //   //                         {item.live.Address}
// //   //                       </span>
// //   //                     </div>
// //   //                   )}
// //   //                   <div className="text-[11px] text-muted-foreground border-t pt-1">
// //   //                     Last seen: {lastSeen(item.live)}
// //   //                   </div>
// //   //                 </div>
// //   //               ) : (
// //   //                 <div className="text-xs text-muted-foreground">
// //   //                   No live data.
// //   //                 </div>
// //   //               )}
// //   //             </CardContent>
// //   //           </Card>
// //   //         )
// //   //       })}
// //   //     </div>

// //   //   </div>
// //   // )
// // }
// 'use client'

// import React, { useMemo, useRef, useState } from 'react'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import { Input } from '@/components/ui/input'
// import {
//   Search,
//   User,
//   Gauge,
//   MapPin,
//   Navigation,
//   Truck,
//   Trailer,
// } from 'lucide-react'
// import { useLiveStore } from '@/config/zustand'

// const OFFLINE_MIN = 5 // minutes since last packet
// const DELAYED_MIN = 15 // minutes without movement
// const DEPOT_COLOR = '#003e69'

// function getTimestampMs(live) {
//   if (!live) return null
//   if (typeof live.Timestamp === 'number' && Number.isFinite(live.Timestamp))
//     return live.Timestamp
//   if (typeof live.Time === 'string') {
//     const t = Date.parse(live.Time)
//     if (Number.isFinite(t)) return t
//   }
//   if (typeof live.LocTime === 'string') {
//     const t = Date.parse(live.LocTime.replace(' ', 'T') + 'Z')
//     if (Number.isFinite(t)) return t
//   }
//   return null
// }

// function isDepot(geo) {
//   const s = String(geo || '')
//     .trim()
//     .toUpperCase()
//   return s === 'ASSM' || s === 'ALRODE DEPOT'
// }

// export default function CardsViewSidebar({
//   vehicleCards = [],
//   selectedPlanId = 'all',
//   assignedUnits = [],
// }) {
//   const [q, setQ] = useState('')
//   const liveByPlate = useLiveStore((s) => s.liveByPlate)

//   // Track last movement per plate
//   const lastMoveRef = useRef(new Map()) // plate -> timestamp(ms)

//   function deriveStatus(plate, live) {
//     const now = Date.now()
//     const ts = getTimestampMs(live)
//     const speed = Number(live?.Speed ?? 0)
//     const depot = isDepot(live?.Geozone)

//     if (ts == null || (now - ts) / 60000 > OFFLINE_MIN)
//       return { key: 'offline', color: '#9ca3af', flash: false }

//     const prevMove = lastMoveRef.current.get(plate) ?? ts
//     if (speed > 0) {
//       lastMoveRef.current.set(plate, ts)
//     } else if (!lastMoveRef.current.has(plate)) {
//       lastMoveRef.current.set(plate, prevMove) // seed once
//     }

//     if (depot) return { key: 'depot', color: DEPOT_COLOR, flash: false }

//     const lastMoveTs = lastMoveRef.current.get(plate) ?? ts
//     const minutesSinceMove = (now - lastMoveTs) / 60000
//     if (speed === 0 && minutesSinceMove >= DELAYED_MIN) {
//       return { key: 'delayed', color: '#f59e0b', flash: true } // orange
//     }

//     if (speed > 0) return { key: 'moving', color: '#10b981', flash: false } // green
//     return { key: 'stationary', color: '#ef4444', flash: false } // red
//   }

//   function lastSeen(live) {
//     const ts = getTimestampMs(live)
//     if (ts == null) return 'Unknown'
//     const d = Date.now() - ts
//     if (d < 60_000) return 'Live'
//     if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
//     if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
//     return `${Math.floor(d / 86_400_000)}d ago`
//   }

//   // Build quick lookup: plate -> assigned unit (supports horse or rigid)
//   const unitByPlate = useMemo(() => {
//     const map = new Map()
//     for (const u of assignedUnits || []) {
//       const horsePlate = u?.horse?.plate?.trim()?.toUpperCase?.()
//       const rigidPlate = u?.rigid?.plate?.trim()?.toUpperCase?.()
//       if (horsePlate) map.set(horsePlate, u)
//       if (rigidPlate) map.set(rigidPlate, u)
//     }
//     return map
//   }, [assignedUnits])

//   const items = useMemo(() => {
//     const withFresh = vehicleCards.map((c) => ({
//       ...c,
//       live: liveByPlate[c.plate] ?? c.live,
//     }))
//     const filtered = withFresh.filter((c) => {
//       const p = c.plate?.toLowerCase() || ''
//       const d = c.live?.DriverName?.toLowerCase?.() || ''
//       return q
//         ? p.includes(q.toLowerCase()) || d.includes(q.toLowerCase())
//         : true
//     })
//     filtered.sort(
//       (a, b) =>
//         (getTimestampMs(b.live) ?? -Infinity) -
//         (getTimestampMs(a.live) ?? -Infinity)
//     )
//     return filtered
//   }, [vehicleCards, q, liveByPlate])

//   const focus = (plate) =>
//     window.dispatchEvent(
//       new CustomEvent('fleet:focusPlate', { detail: { plate } })
//     )

//   return (
//     <div className="h-full flex flex-col">
//       {/* Search */}
//       <div className="border-b border-border bg-card">
//         <div className="px-3 py-3">
//           <div className="relative">
//             <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
//             <Input
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//               placeholder="Search plate or driver…"
//               className="pl-8 h-8"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Cards */}
//       <div className="flex-1 overflow-auto p-3 space-y-2">
//         {items.map((item) => {
//           const s = deriveStatus(item.plate, item.live)
//           const badgeStyle = {
//             backgroundColor: s.color,
//             animation: s.flash ? 'pulse 1s ease-in-out infinite' : undefined,
//           }
//           const speed = Number(item?.live?.Speed ?? 0)
//           const unit = unitByPlate.get(String(item.plate).toUpperCase())

//           // Prepare customers (deduped, compact)
//           const customerNames = (unit?.customers || [])
//             .map((c) => (c?.customer_name || '').trim())
//             .filter(Boolean)

//           const uniqueCustomers = Array.from(new Set(customerNames))
//           const showCustomers =
//             selectedPlanId && selectedPlanId !== 'all' && unit

//           return (
//             <Card
//               key={item.plate}
//               className="cursor-pointer hover:shadow-sm"
//               onClick={() => focus(item.plate)}
//             >
//               <CardHeader className="py-2 px-3">
//                 <div className="flex items-center justify-between">
//                   <CardTitle className="text-base font-mono">
//                     {item.plate}
//                   </CardTitle>
//                   <Badge style={badgeStyle} className="text-[10px] capitalize">
//                     {s.key}
//                   </Badge>
//                 </div>
//               </CardHeader>

//               <CardContent className="px-3 pb-3 pt-0">
//                 {/* Live block */}
//                 {item.live ? (
//                   <div className="space-y-1.5 text-xs">
//                     <div className="flex items-center gap-2">
//                       <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
//                       <span className="font-medium">
//                         {speed.toFixed(1)} km/h
//                       </span>
//                     </div>

//                     {item.live.DriverName && (
//                       <div className="flex items-center gap-2">
//                         <User className="h-3.5 w-3.5 text-muted-foreground" />
//                         <span>{item.live.DriverName}</span>
//                       </div>
//                     )}

//                     {item.live.Address && (
//                       <div className="flex items-start gap-2">
//                         <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
//                         <span className="text-[11px] text-muted-foreground line-clamp-2">
//                           {item.live.Address}
//                         </span>
//                       </div>
//                     )}

//                     {item.live.zone && (
//                       <div className="flex items-center gap-2">
//                         <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
//                         <span className="text-[11px] text-muted-foreground">
//                           {item.live.zone}
//                         </span>
//                       </div>
//                     )}

//                     <div className="text-[11px] text-muted-foreground border-t pt-1">
//                       Last seen: {lastSeen(item.live)}
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="text-xs text-muted-foreground">
//                     No live data.
//                   </div>
//                 )}

//                 {/* Plan context block */}
//                 {showCustomers && (
//                   <div className="mt-2 border-t pt-2 space-y-1.5">
//                     {/* Vehicle/Trailer summary when this is a horse+trailer */}
//                     {unit?.horse && unit?.trailer && (
//                       <div className="flex items-center gap-2 text-xs">
//                         <Truck className="h-3.5 w-3.5 text-muted-foreground" />
//                         <span className="text-muted-foreground">
//                           Trailer:{' '}
//                           <span className="font-medium">
//                             {unit.trailer.plate}
//                           </span>
//                           {unit.trailer.fleet_number
//                             ? ` (${unit.trailer.fleet_number})`
//                             : ''}
//                         </span>
//                       </div>
//                     )}

//                     {/* Driver from plan (if present and different) */}
//                     {unit?.driver_name &&
//                       unit?.driver_name !== item?.live?.DriverName && (
//                         <div className="flex items-center gap-2 text-xs">
//                           <User className="h-3.5 w-3.5 text-muted-foreground" />
//                           <span className="text-muted-foreground">
//                             Planned driver:{' '}
//                             <span className="font-medium">
//                               {unit.driver_name}
//                             </span>
//                           </span>
//                         </div>
//                       )}

//                     {/* Customers */}
//                     {uniqueCustomers.length > 0 ? (
//                       <div className="text-[11px]">
//                         <div className="font-medium mb-1">Customers</div>
//                         <ul className="list-disc ml-4 space-y-0.5">
//                           {uniqueCustomers.slice(0, 6).map((name) => (
//                             <li key={name} className="text-muted-foreground">
//                               {name}
//                             </li>
//                           ))}
//                           {uniqueCustomers.length > 6 && (
//                             <li className="text-muted-foreground">
//                               +{uniqueCustomers.length - 6} more
//                             </li>
//                           )}
//                         </ul>
//                       </div>
//                     ) : (
//                       <div className="text-[11px] text-muted-foreground">
//                         No customers on this unit yet.
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           )
//         })}
//       </div>

//       {/* simple pulse keyframes */}
//       <style jsx global>{`
//         @keyframes pulse {
//           0%,
//           100% {
//             opacity: 1;
//           }
//           50% {
//             opacity: 0.45;
//           }
//         }
//       `}</style>
//     </div>
//   )
// }

'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, User, Gauge, MapPin, Navigation, Truck } from 'lucide-react'
import { useLiveStore } from '@/config/zustand'

const OFFLINE_MIN = 10
const DELAYED_MIN = 15
const DEPOT_COLOR = '#003e69'
const ORDER_EVENT = 'fleet:cardOrder:update'

/* --------------------- Utilities --------------------- */

function getTimestampMs(live) {
  if (!live) return null
  if (typeof live.timestamp === 'string') {
    const t = Date.parse(live.timestamp)
    if (Number.isFinite(t)) return t
  }
  const numeric = [
    live.TimestampMs,
    live.timestampMs,
    live.ts,
    live.TS,
    live.epoch,
    live.Epoch,
  ].find((v) => Number.isFinite(Number(v)))
  if (numeric != null) return Number(numeric)

  const isoCandidates = [
    live.Timestamp,
    live.Time,
    live.time,
    live.ReceivedAt,
    live.ServerTime,
    live.PacketTime,
    live.LastSeenAt,
  ].filter(Boolean)
  for (const t of isoCandidates) {
    const p = Date.parse(String(t))
    if (Number.isFinite(p)) return p
  }
  if (typeof live.LocTime === 'string') {
    const tryLocal = Date.parse(live.LocTime.replace(' ', 'T'))
    if (Number.isFinite(tryLocal)) return tryLocal
    const tryUTC = Date.parse(live.LocTime.replace(' ', 'T') + 'Z')
    if (Number.isFinite(tryUTC)) return tryUTC
  }
  return null
}

function isDepot(geo) {
  const s = String(geo || '')
    .trim()
    .toUpperCase()
  return s === 'ASSM' || s === 'ALRODE DEPOT'
}

function deriveStatus(plate, live, lastMoveRef) {
  const now = Date.now()
  const ts = getTimestampMs(live)
  const speed = Number(live?.Speed ?? 0)
  const depot = isDepot(live?.Geozone)

  if (live && ts == null) {
    if (speed > 0) return { key: 'moving', color: '#10b981', flash: false }
    return { key: 'unknown', color: '#9ca3af', flash: false }
  }
  if (ts == null || (now - ts) / 60000 > OFFLINE_MIN)
    return { key: 'offline', color: '#9ca3af', flash: false }

  const prevMove = lastMoveRef.current.get(plate) ?? ts
  if (speed > 0) lastMoveRef.current.set(plate, ts)
  else if (!lastMoveRef.current.has(plate))
    lastMoveRef.current.set(plate, prevMove)

  if (depot) return { key: 'depot', color: DEPOT_COLOR, flash: false }

  const lastMoveTs = lastMoveRef.current.get(plate) ?? ts
  const minutesSinceMove = (now - lastMoveTs) / 60000
  if (speed === 0 && minutesSinceMove >= DELAYED_MIN) {
    return { key: 'delayed', color: '#f59e0b', flash: true }
  }
  if (speed > 0) return { key: 'moving', color: '#10b981', flash: false }
  return { key: 'stationary', color: '#ef4444', flash: false }
}

function lastSeen(live) {
  const ts = getTimestampMs(live)
  if (ts == null) return 'Unknown'
  const d = Date.now() - ts
  if (d < 60_000) return 'Live'
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return `${Math.floor(d / 86_400_000)}d ago`
}

/* ---------------- Persistent order (per plan) ---------------- */

function usePersistentOrder(planId) {
  const key = `fleet:cardOrder:${planId || 'all'}`
  const [order, setOrder] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(key)
      const arr = raw ? JSON.parse(raw) : []
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    const handler = (e) => {
      const { key: evtKey, order: arr } = e.detail || {}
      if (evtKey === key && Array.isArray(arr)) setOrder(arr)
    }
    window.addEventListener(ORDER_EVENT, handler)
    return () => window.removeEventListener(ORDER_EVENT, handler)
  }, [key])

  return order
}

/* ---------------- Component ---------------- */

export default function CardsViewSidebar({
  vehicleCards = [],
  selectedPlanId = 'all',
  assignedUnits = [],
  q,
  setQ,
}) {
  // const [q, setQ] = useState('')
  const [focusPlate, setFocusPlate] = useState('')
  const liveByPlate = useLiveStore((s) => s.liveByPlate)

  const lastMoveRef = useRef(new Map()) // plate -> timestamp(ms)
  const prevOrderRef = useRef(new Map()) // stability tiebreaker

  // shared saved order (read-only here to mirror cards view)
  const savedOrder = usePersistentOrder(selectedPlanId)

  // Build quick lookup: plate -> assigned unit (supports horse or rigid)
  const unitByPlate = useMemo(() => {
    const map = new Map()
    for (const u of assignedUnits || []) {
      const horsePlate = u?.horse?.plate?.trim()?.toUpperCase?.()
      const rigidPlate = u?.rigid?.plate?.trim()?.toUpperCase?.()
      if (horsePlate) map.set(horsePlate, u)
      if (rigidPlate) map.set(rigidPlate, u)
    }
    return map
  }, [assignedUnits])

  const items = useMemo(() => {
    const withFresh = vehicleCards.map((c) => ({
      ...c,
      live: liveByPlate[c.plate] ?? c.live,
    }))
    const filtered = withFresh.filter((c) => {
      const p = c.plate?.toLowerCase() || ''
      const d = c.live?.DriverName?.toLowerCase?.() || ''
      return q
        ? p.includes(q.toLowerCase()) || d.includes(q.toLowerCase())
        : true
    })

    const orderMap = new Map((savedOrder || []).map((p, i) => [p, i]))
    filtered.sort((a, b) => {
      // 0) Focused vehicle goes to top
      const aFocused = String(a.plate).toUpperCase() === focusPlate
      const bFocused = String(b.plate).toUpperCase() === focusPlate
      if (aFocused && !bFocused) return -1
      if (!aFocused && bFocused) return 1

      // 1) Saved order first (mirror cards view)
      const ai = orderMap.has(a.plate) ? orderMap.get(a.plate) : Infinity
      const bi = orderMap.has(b.plate) ? orderMap.get(b.plate) : Infinity
      if (ai !== bi) return ai - bi

      // 2) For un-ordered items, keep freshest first
      if (ai === Infinity && bi === Infinity) {
        const at = getTimestampMs(a.live) ?? -Infinity
        const bt = getTimestampMs(b.live) ?? -Infinity
        if (bt !== at) return bt - at
      }

      // 3) Stability tiebreaker (no shuffling between updates)
      const aPrev = prevOrderRef.current.get(a.plate) ?? Infinity
      const bPrev = prevOrderRef.current.get(b.plate) ?? Infinity
      if (aPrev !== bPrev) return aPrev - bPrev

      return String(a.plate).localeCompare(String(b.plate))
    })
    prevOrderRef.current = new Map(filtered.map((c, i) => [c.plate, i]))
    return filtered
  }, [vehicleCards, q, liveByPlate, savedOrder, focusPlate])

  // Listen for focus events to update local state
  useEffect(() => {
    const handler = (e) => {
      const plate = e?.detail?.plate
      setFocusPlate(plate ? String(plate).toUpperCase() : '')
    }
    window.addEventListener('fleet:focusPlate', handler)
    return () => window.removeEventListener('fleet:focusPlate', handler)
  }, [])

  const focus = (plate) => {
    const plateUpper = String(plate).toUpperCase()
    // Card focus triggered
    setFocusPlate(plateUpper)
    window.dispatchEvent(
      new CustomEvent('fleet:focusPlate', { detail: { plate } })
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="border-b border-border bg-card">
        <div className="px-3 py-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search plate or driver…"
              className="pl-8 h-8"
            />
          </div>
        </div>
      </div>

      {/* Show All Button */}
      {focusPlate && (
        <div className="border-b border-border bg-card px-3 py-2">
          <button
            onClick={() => {
              setFocusPlate('')
              window.dispatchEvent(
                new CustomEvent('fleet:focusPlate', { detail: { plate: null } })
              )
            }}
            className="w-full h-8 px-3 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Show All
          </button>
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {items.map((item) => {
          const s = deriveStatus(item.plate, item.live, lastMoveRef)
          const badgeStyle = {
            backgroundColor: s.color,
            animation: s.flash ? 'pulse 1s ease-in-out infinite' : undefined,
          }
          const speed = Number(item?.live?.Speed ?? 0)
          const unit = unitByPlate.get(String(item.plate).toUpperCase())

          // Prepare customers (deduped, compact)
          const customerNames = (unit?.customers || [])
            .map((c) => (c?.customer_name || '').trim())
            .filter(Boolean)
          const uniqueCustomers = Array.from(new Set(customerNames))
          const showCustomers =
            selectedPlanId && selectedPlanId !== 'all' && unit

          return (
            <Card
              key={item.plate}
              className="cursor-pointer hover:shadow-sm"
              onClick={() => focus(item.plate)}
            >
              <CardHeader className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-mono">
                    {item.plate}
                  </CardTitle>
                  <Badge style={badgeStyle} className="text-[10px] capitalize">
                    {s.key}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="px-3 pb-3 pt-0">
                {/* Live block */}
                {item.live ? (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">
                        {speed.toFixed(1)} km/h
                      </span>
                    </div>

                    {item.live.DriverName && (
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{item.live.DriverName}</span>
                      </div>
                    )}

                    {item.live.Address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                        <span className="text-[11px] text-muted-foreground line-clamp-2">
                          {item.live.Address}
                        </span>
                      </div>
                    )}

                    {item.live.zone && (
                      <div className="flex items-center gap-2">
                        <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">
                          {item.live.zone}
                        </span>
                      </div>
                    )}

                    <div className="text-[11px] text-muted-foreground border-t pt-1">
                      Last seen: {lastSeen(item.live)}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    No live data.
                  </div>
                )}

                {/* Plan context block */}
                {showCustomers && (
                  <div className="mt-2 border-t pt-2 space-y-1.5">
                    {/* Vehicle/Trailer summary when this is a horse+trailer */}
                    {unit?.horse && unit?.trailer && (
                      <div className="flex items-center gap-2 text-xs">
                        <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Trailer:{' '}
                          <span className="font-medium">
                            {unit.trailer.plate}
                          </span>
                          {unit.trailer.fleet_number
                            ? ` (${unit.trailer.fleet_number})`
                            : ''}
                        </span>
                      </div>
                    )}

                    {/* Driver from plan (if present and different) */}
                    {unit?.driver_name &&
                      unit?.driver_name !== item?.live?.DriverName && (
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Planned driver:{' '}
                            <span className="font-medium">
                              {unit.driver_name}
                            </span>
                          </span>
                        </div>
                      )}

                    {/* Customers */}
                    {uniqueCustomers.length > 0 ? (
                      <div className="text-[11px]">
                        <div className="font-medium mb-1">Customers</div>
                        <ul className="list-disc ml-4 space-y-0.5">
                          {uniqueCustomers.slice(0, 6).map((name) => (
                            <li key={name} className="text-muted-foreground">
                              {name}
                            </li>
                          ))}
                          {uniqueCustomers.length > 6 && (
                            <li className="text-muted-foreground">
                              +{uniqueCustomers.length - 6} more
                            </li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground">
                        No customers on this unit yet.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* simple pulse keyframes */}
      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.45;
          }
        }
      `}</style>
    </div>
  )
}
