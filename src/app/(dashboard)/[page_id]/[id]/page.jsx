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
      const assignment = await fetchServerData(`plans/${id}`, 'GET')
      //  console.log('assignment?.data?.units :>> ', assignment?.data)
      const screenStats = [
        {
          title: 'Assigned Vehicles',
          value: assignment?.data?.units?.length || 0,
          icon: <Play className="h-6 w-6 xl:h-7 xl:w-7 text-blue-500" />,
        },
        {
          title: 'Unassigned Vehicles',
          value: assignment?.data?.unassigned_units?.length || 0,
          icon: (
            <AlertTriangle className="h-6 w-6 xl:h-7 xl:w-7 text-red-500" />
          ),
        },
        {
          title: 'Assigned Items',
          value: assignment?.data?.assigned_orders?.length || 0,
          icon: <Clock className="h-6 w-6 xl:h-7 xl:w-7 text-gray-500" />,
        },
        {
          title: 'Unassigned Items',
          value: assignment?.data?.unassigned_orders?.length || 0,
          icon: <Play className="h-6 w-6 xl:h-7 xl:w-7 text-blue-500" />,
        },
      ]
      // console.log('assignment :>> ', assignment?.data?.plan)
      return (
        <>
          {assignment?.data && (
            <>
              {/* <div className="flex flex-col md:flex-row justify-between items-end gap-4 p-1"> */}
              <DetailActionBar
                id={id}
                title={assignment?.data?.plan?.plan_name || 'Load Assignment'}
                description={assignment?.data?.plan?.notes || 'plan details'}
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
