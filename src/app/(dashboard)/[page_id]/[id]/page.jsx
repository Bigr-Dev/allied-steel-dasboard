import { fetchServerData } from '@/app/api/_lib/server-fetch'
import { LoadAssignment } from '@/components/layout/assignment/load-assignment'
import DetailActionBar from '@/components/layout/detail-action-bar'
import SingleBranch from '@/components/single-pages/branch'
import CustomersPage from '@/components/single-pages/customers'
import SingleDriver from '@/components/single-pages/driver'
import LoadAssignmentSingle from '@/components/single-pages/load-assignment-single'
import LoadsPage from '@/components/single-pages/loads'
import RoutesPage from '@/components/single-pages/routes-suburbs'
import SalesOrderPage from '@/components/single-pages/sales-orders'
import UserPage from '@/components/single-pages/users'
import VehicleSinglePage from '@/components/single-pages/vehicles'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import CountUp from '@/components/ui/count-up'
import { useGlobalContext } from '@/context/global-context'
import { AlertTriangle, Clock, Play } from 'lucide-react'

const iconMap = {
  Clock: Clock,
  Play: Play,
  AlertTriangle: AlertTriangle,
}

const SinglePage = async ({ params }) => {
  const { page_id, id } = await params

  function todayTomorrow() {
    const now = new Date()
    const iso = (d) =>
      new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10)

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return {
      yesterday: iso(yesterday),
      today: iso(now),
      tomorrow: iso(tomorrow),
    }
  }

  const { today, tomorrow, yesterday } = todayTomorrow()

  switch (page_id) {
    case 'branches':
      return <SingleBranch id={id} />

    case 'loads':
      return <LoadsPage id={id} />

    case 'load-assignment':
      const assignment = await fetchServerData(`plans/`, 'POST', {
        plan_id: id, // required
        include_nested: true, // false => plan header only
        include_idle: true, // only if include_nested=true
      })
      if (id) {
        console.log('id :>> ', id)
      } else {
        console.log('plan :>> ')
      }

      //console.log('assignment :>> ', assignment)
      const plan = assignment?.data
      // console.log('plan :>> ', plan)
      // *********************
      // Helper functions for load assignment stats
      // *********************

      // Count unique values helper
      const uniqueCount = (arr) => new Set(arr.filter(Boolean)).size

      const getTotalVehicles = (plan) => {
        // vehicles are the assigned units
        return Array.isArray(plan.assigned_units)
          ? plan.assigned_units?.length
          : 0
      }

      const getTotalRoutes = (plan) => {
        //  console.log('plan.assigned_units :>> ', plan)
        if (!Array.isArray(plan?.assigned_units)) return 0
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
        if (!Array.isArray(plan.assigned_units)) return 0
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

      const screenStats = [
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
        {
          title: 'Assigned Items',
          value: getTotalOrders(plan) || 0,
          icon: <Clock className="h-6 w-6 xl:h-7 xl:w-7 text-gray-500" />,
        },
        {
          title: 'Unassigned Items',
          value: plan?.unassigned?.length || 0,
          icon: <Play className="h-6 w-6 xl:h-7 xl:w-7 text-blue-500" />,
        },
      ]

      // console.log('assignment?.data :page_id>> ', assignment?.data)
      return (
        <>
          {assignment?.data && (
            <>
              {/* <div className="flex flex-col md:flex-row justify-between items-end gap-4 p-1"> */}
              <DetailActionBar
                id={id}
                title={assignment?.data?.plan?.notes}
                description={'N/A'}
              />
              {/* </div> */}

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 p-1">
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
              </div>

              <div className="space-y-6 h-full overflow-y-auto  p-1">
                <LoadAssignment id={id} assignment={assignment} />
              </div>
            </>
          )}
        </>
      )

    case 'customers':
      return <CustomersPage id={id} />

    case 'drivers':
      return <SingleDriver id={id} />

    case 'users':
      return <UserPage id={id} />

    case 'vehicles':
      return <VehicleSinglePage id={id} />

    case 'routes':
      return <RoutesPage id={id} />

    case 'orders':
      return <SalesOrderPage id={id} />

    default:
      return <div>{id}</div>
  }
}
export default SinglePage
