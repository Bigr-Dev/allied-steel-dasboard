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
      // const assignment = await fetchServerData(`plans/${id}`, 'GET')

      return (
        <div className="space-y-6 h-full overflow-y-auto  p-1">
          <LoadAssignment id={id} />
        </div>
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
