'use client'

// icons
import {
  Building2,
  Users,
  Truck,
  Route,
  MapPin,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Play,
  AlertTriangle,
  CheckCircle,
  Wrench,
  UserCircle,
  ChartColumnBig,
  Building,
  Map,
  ChevronDown,
  FileText,
  Waypoints,
  ClipboardList,
  PackageOpen,
  Package,
  PackagePlus,
  Tractor,
  Caravan,
} from 'lucide-react'

import CountUp from '@/components/ui/count-up'
import DetailCard from '@/components/ui/detail-card'
import { useGlobalContext } from '@/context/global-context'
import { replaceHyphenWithUnderscore } from '@/hooks/replace-hyphen'
import { usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatWeight } from '@/lib/formatters'
import { useEffect } from 'react'

const iconMap = {
  ChartColumnBig: ChartColumnBig,
  Building2: Building2,
  Building: Building,
  Users: Users,
  Truck: Truck,
  UserCircle: UserCircle,
  Map: Map,
  Route: Route,
  FileText: FileText,
  Package: Package,
  PackageOpen: PackageOpen,
  PackagePlus: PackagePlus,
  MapPin: MapPin,
  Plus: Plus,
  ShieldCheck: ShieldCheck,
  ShieldAlert: ShieldAlert,
  Clock: Clock,
  Play: Play,
  AlertTriangle: AlertTriangle,
  CheckCircle: CheckCircle,
  Wrench: Wrench,
  ChevronDown: ChevronDown,
  Waypoints: Waypoints,
  ClipboardList: ClipboardList,
}

const Statistics = () => {
  const pathname = usePathname().slice(1)
  const path = replaceHyphenWithUnderscore(pathname)
  const current_screen = useGlobalContext()[path]
  const { loads, users, vehicles, drivers, assignment } = useGlobalContext()
  //console.log('assignment :>> ', assignment?.data)
  const plan = assignment?.data
  let screenStats = []

  const overDueOrders = current_screen?.data?.filter((order) => {
    const dateStr = order?.document_due_date

    const inputDate = new Date(dateStr)
    const today = new Date()

    // Set time to 00:00:00 for accurate date comparison
    inputDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    return inputDate < today
  })

  const TodaysOrders = current_screen?.data?.filter((order) => {
    const dateStr = order?.document_due_date

    const inputDate = new Date(dateStr)
    const today = new Date()

    // Set time to 00:00:00 for accurate date comparison
    inputDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    return inputDate == today
  })

  const tomorrowOrders = current_screen?.data?.filter((order) => {
    const dueRaw = order?.document_due_date
    if (!dueRaw) return false

    const due = new Date(dueRaw)
    if (Number.isNaN(due)) return false

    const now = new Date()
    const startTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    )
    const startDayAfter = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 2
    )

    return due >= startTomorrow && due < startDayAfter
  })

  const upComingOrders = current_screen?.data?.filter((order) => {
    const dueRaw = order?.document_due_date
    if (!dueRaw) return false

    const due = new Date(dueRaw)
    if (Number.isNaN(due)) return false

    const now = new Date()
    const startTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    )
    const startDayAfter = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 2
    )

    return due >= startDayAfter
  })

  // *********************
  // Helper functions for load assignment stats
  // *********************

  // Count unique values helper
  const uniqueCount = (arr) => new Set(arr.filter(Boolean)).size

  const getTotalVehicles = (plan) => {
    // vehicles are the assigned units
    return Array.isArray(plan?.assigned_units) ? plan?.assigned_units.length : 0
  }

  const getTotalRoutes = (plan) => {
    //  console.log('plan.assigned_units :>> ', plan)
    if (!Array.isArray(plan.assigned_units)) return 0
    const routes = []
    plan.assigned_units.forEach((unit) => {
      unit.customers?.forEach((c) => {
        if (c.route_name) routes.push(c.route_name)
      })
    })
    // also include unassigned routes
    plan.unassigned?.forEach((item) => {
      if (item.route_name) routes.push(item.route_name)
    })
    return uniqueCount(routes)
  }

  const getTotalSuburbs = (plan) => {
    if (!Array.isArray(plan?.assigned_units)) return 0
    const suburbs = []
    plan.assigned_units.forEach((unit) => {
      unit.customers?.forEach((c) => {
        if (c.suburb_name) suburbs.push(c.suburb_name)
      })
    })
    plan.unassigned?.forEach((item) => {
      if (item.suburb_name) suburbs.push(item.suburb_name)
    })
    return uniqueCount(suburbs)
  }

  const getTotalClients = (plan) => {
    const clients = []
    plan.assigned_units?.forEach((unit) => {
      unit.customers?.forEach((c) => {
        if (c.customer_name) clients.push(c.customer_name)
      })
    })
    plan.unassigned?.forEach((item) => {
      if (item.customer_name) clients.push(item.customer_name)
    })
    return uniqueCount(clients)
  }

  const getIdleUnits = (plan) => {
    const orders = []
    plan?.idle_units_by_branch?.forEach((unit) => {
      orders.push(unit)
    })

    return uniqueCount(orders)
  }

  const getTotalOrders = (plan) => {
    const orders = []
    plan.assigned_units?.forEach((unit) => {
      unit.customers?.forEach((c) => {
        c.orders?.forEach((o) => orders.push(o.order_id))
      })
    })
    plan.unassigned?.forEach((item) => {
      if (item.order_id) orders.push(item.order_id)
    })
    return uniqueCount(orders)
  }

  switch (path) {
    case 'orders':
      screenStats = [
        {
          title: 'Overdue Orders',
          value: overDueOrders?.length || 0,
          icon: <Users className="h-6 w-6 text-violet-500 " />,
        },
        {
          title: "Today's Orders",
          value: TodaysOrders?.length,
          icon: <Truck className="h-6 w-6 text-pink-700 " />,
        },
        {
          title: "Tomorrow's Orders",
          value: tomorrowOrders?.length || 0,
          icon: <Building2 className="h-6 w-6 text-orange-500" />,
        },
        {
          title: 'Upcoming Orders',
          value: upComingOrders?.length || 0,
          icon: <Route className="h-6 w-6 text-emerald-500" />,
        },
      ]

      //      console.log('current_screen :Statistics>> ', path, current_screen?.data)
      break
    case 'loads':
      // useEffect(() => {
      //  // console.log('loads?.data :>> ', current_screen?.data)
      // }, [current_screen?.loading])
      const summaryStats = () => {
        if (current_screen?.data?.length === 0) {
          return {
            routes: 0,
            suburbs: 0,
            orders: 0,
            totalQty: 0,
            totalWeight: 0,
          }
        }

        let routes = current_screen?.data?.length
        let suburbs = 0
        let orders = 0
        let totalQty = 0
        let totalWeight = 0

        current_screen?.data?.forEach((route) => {
          route.suburbs?.forEach((suburb) => {
            suburbs++
            suburb.load_orders?.forEach((order) => {
              orders++
              totalQty += order.total_quantity || 0
              totalWeight += order.total_weight || 0
            })
          })
        })

        return {
          routes,
          suburbs,
          orders,
          totalQty,
          totalWeight,
        }
      }

      screenStats = [
        {
          title: 'Active Routes',
          value: summaryStats()?.routes || 0,
          icon: <Truck className="h-6 w-6 xl:h-7 xl:w-7 text-gray-500" />,
        },
        {
          title: 'Active Suburbs',
          value: summaryStats()?.suburbs || 0,
          icon: <MapPin className="h-6 w-6 xl:h-7 xl:w-7 text-blue-500" />,
        },
        {
          title: 'Total Orders',
          value: summaryStats()?.orders || 0,
          icon: <Package className="h-6 w-6 xl:h-7 xl:w-7 text-red-500" />,
        },
        // {
        //   title: 'Total Load Items',
        //   value: `${formatQty(summaryStats()?.totalQty)}` || 0,
        //   icon: <CheckCircle className="h-6 w-6 xl:h-7 xl:w-7 text-green-500" />,
        // },
        {
          title: 'Total Weight',
          value: `${formatWeight(summaryStats()?.totalWeight)}` || 0,
          icon: <Package className="h-6 w-6 xl:h-7 xl:w-7 text-green-500" />,
        },
      ]
      // let total_load_suburbs = 0
      // let total_load_orders = 0
      // let total_load_items = 0
      // loads?.data?.map(
      //   (r) => (total_load_suburbs = total_load_suburbs + r.suburbs.length)
      // )
      // loads?.data?.map((r) =>
      //   r.suburbs.map(
      //     (s) => (total_load_orders = total_load_orders + s.load_orders.length)
      //   )
      // )
      // loads?.data?.map((r) =>
      //   r.suburbs.map((s) =>
      //     s.load_orders?.map(
      //       (l) => (total_load_items = total_load_items + l.load_items.length)
      //     )
      //   )
      // )
      // screenStats = [
      //   {
      //     title: 'Active Routes',
      //     value: current_screen?.data?.length || 0,
      //     icon: <Clock className="h-6 w-6 xl:h-7 xl:w-7 text-gray-500" />,
      //   },
      //   {
      //     title: 'Total Suburbs',
      //     value: total_load_suburbs || 0,
      //     icon: <Play className="h-6 w-6 xl:h-7 xl:w-7 text-blue-500" />,
      //   },
      //   {
      //     title: 'Total Customers',
      //     value: total_load_orders || 0,
      //     icon: (
      //       <AlertTriangle className="h-6 w-6 xl:h-7 xl:w-7 text-red-500" />
      //     ),
      //   },
      //   {
      //     title: 'Total Load Items',
      //     value: total_load_items || 0,
      //     icon: (
      //       <CheckCircle className="h-6 w-6 xl:h-7 xl:w-7 text-green-500" />
      //     ),
      //   },
      // ]
      //  console.log('current_screen :Statistics>> ', path, current_screen?.data)
      break
    case 'branches':
      screenStats = [
        {
          title: 'Total Branches',
          value: current_screen?.data?.length || 0,
          icon: <Building2 className="h-6 w-6 text-violet-500" />,
        },
        {
          title: 'Total Users',
          value: users?.data?.length || 0,
          icon: <Users className="h-6 w-6 text-pink-700" />,
        },
        {
          title: 'Total Vehicles',
          value: vehicles?.data?.length || 0,
          icon: <Truck className="h-6 w-6 text-orange-500" />,
        },
        {
          title: 'Total Drivers',
          value: drivers?.data?.length || 0,
          icon: <UserCircle className="h-6 w-6 text-emerald-500" />,
        },
      ]
      // console.log('current_screen :Statistics>> ', path, current_screen?.data)
      break
    case 'users':
      screenStats = [
        {
          title: 'Total Users',
          value: users?.data?.length || 0,
          icon: <Users className="h-6 w-6 text-gray-500" />,
        },
        {
          title: 'Admins',
          value: users?.data?.filter((u) => u.role === 'admin')?.length || 0,
          icon: <ShieldCheck className="h-6 w-6 text-violet-500" />,
        },
        {
          title: 'Controllers',
          value: users?.data?.filter((u) => u.role == 'controller') || 0,
          icon: <ShieldAlert className="h-6 w-6 text-blue-500" />,
        },
        {
          title: 'Managers',
          value: users?.data?.filter((u) => u.role == 'manager') || 0,
          icon: <ShieldAlert className="h-6 w-6 text-blue-500" />,
        },
      ]

      // console.log('current_screen :Statistics>> ', path, users?.data?.[0]?.role)
      break
    case 'routes':
      let total_route_suburbs = 0
      current_screen?.data?.map(
        (r) =>
          (total_route_suburbs = total_route_suburbs + r.route_suburbs.length)
      )

      screenStats = [
        {
          title: 'Total Routes',
          value: current_screen?.data?.length || 0,
          icon: <Building2 className="h-6 w-6 text-violet-500" />,
        },
        {
          title: 'Total Suburbs',
          value: total_route_suburbs || 0,
          icon: <Users className="h-6 w-6 text-pink-700" />,
        },
        // {
        //   title: 'Total Vehicles',
        //   value: 0,
        //   icon: <Truck className="h-6 w-6 text-orange-500" />,
        // },
        // {
        //   title: 'Active Trips',
        //   value: 0,
        //   icon: <Route className="h-6 w-6 text-emerald-500" />,
        // },
      ]
      //console.log('current_screen :Statistics>> ', path, current_screen?.data)
      break
    case 'customers':
      screenStats = [
        {
          title: 'Total Customers',
          value: current_screen?.data?.length || 0,
          icon: <Building2 className="h-6 w-6 text-violet-500" />,
        },
        // {
        //   title: 'unfulfilled Orders',
        //   value: 0,
        //   icon: <Users className="h-6 w-6 text-pink-700" />,
        // },
        // {
        //   title: 'Fulfilled Orders',
        //   value: 0,
        //   icon: <Truck className="h-6 w-6 text-orange-500" />,
        // },
        // {
        //   title: 'Active Orders',
        //   value: 0,
        //   icon: <Route className="h-6 w-6 text-emerald-500" />,
        // },
      ]
      //  console.log('current_screen :Statistics>> ', path, current_screen?.data)
      break
    case 'vehicles':
      screenStats = [
        {
          title: 'Total Vehicles',
          value: current_screen?.data?.length || 0,
          icon: <Truck className="h-6 w-6 text-gray-500" />,
        },
        {
          title: "Horse's",
          value:
            current_screen?.data?.filter((v) => v.type == 'horse')?.length || 0,
          icon: <Tractor className="h-6 w-6 text-green-500" />,
        },
        {
          title: "Rigid's",
          value:
            current_screen?.data?.filter((v) => v.type == 'rigid')?.length || 0,
          icon: <Truck className="h-6 w-6 text-blue-500" />,
        },
        {
          title: 'Trailers',
          value:
            current_screen?.data?.filter((v) => v.type == 'Trailer')?.length ||
            0,
          icon: <Caravan className="h-6 w-6 text-amber-500" />,
        },
      ]

      //  console.log('current_screen :Statistics>> ', path, current_screen?.data)
      break
    case 'drivers':
      screenStats = [
        {
          title: 'Total Drivers',
          value: current_screen?.data?.length || 0,
          icon: <UserCircle className="h-6 w-6 text-gray-500" />,
        },
        // {
        //   title: 'Admins',
        //   value: 3,
        //   icon: <ShieldCheck className="h-6 w-6 text-violet-500" />,
        // },
        // {
        //   title: 'Managers',
        //   value: 8,
        //   icon: <ShieldAlert className="h-6 w-6 text-blue-500" />,
        // },
      ]
      //   console.log('current_screen :Statistics>> ', path, current_screen?.data)
      break
    case 'load_assignment':
      screenStats = [
        {
          title: 'Total Plans',
          value: assignment?.data?.total || 0,
          icon: <Clock className="h-6 w-6 xl:h-7 xl:w-7 text-gray-500" />,
        },
        {
          title: 'Total Suburbs',
          value: getTotalSuburbs(plan) || 0,
          icon: <Play className="h-6 w-6 xl:h-7 xl:w-7 text-blue-500" />,
        },
        {
          title: 'Assigned Vehicles',
          value: getTotalVehicles(plan) || 0,
          icon: <Play className="h-6 w-6 xl:h-7 xl:w-7 text-blue-500" />,
        },
        {
          title: 'Unassigned Vehicles',
          value: getIdleUnits(plan) || 0,
          icon: (
            <AlertTriangle className="h-6 w-6 xl:h-7 xl:w-7 text-red-500" />
          ),
        },
        // {
        //   title: 'Total Load Items',
        //   value: total_grouped_load_items || 0,
        //   icon: (
        //     <CheckCircle className="h-6 w-6 xl:h-7 xl:w-7 text-green-500" />
        //   ),
        // },
      ]
      //  console.log('current_screen :Statistics>> ', path, current_screen?.data)
      break
    default:
      break
  }

  return (
    <>
      {screenStats?.map((stat, index) => {
        const Icon = stat.icon

        return (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {Icon}
                  <CardTitle>{stat.title}</CardTitle>
                </div>
                <div className="text-2xl font-bold">
                  <CountUp value={stat.value} />
                </div>
              </div>
            </CardHeader>
          </Card>
        )
      })}
    </>
  )
}

export default Statistics
