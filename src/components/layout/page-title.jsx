import { useGlobalContext } from '@/context/global-context'
import { useParams, usePathname } from 'next/navigation'

const PageTitle = () => {
  const pathname = usePathname().slice(1)

  const params = useParams()
  const {
    dashboard,
    branches,
    customers,
    orders,
    loads,
    users,
    vehicles,
    drivers,
    stop_points,
    routes,
  } = useGlobalContext()

  let titleSection = {}

  if (pathname === '' || pathname.includes('dashboard')) {
    titleSection = dashboard?.titleSection
  } else if (pathname.includes('branches')) {
    if (params?.id) {
      const costCentre = branches?.data.find((item) => item.id === params.id)
      titleSection = {
        ...branches?.titleSection,
        title: costCentre?.name,
        description: 'Cost Centre Details',
      }
    } else {
      titleSection = branches?.titleSection
    }
    // titleSection = branches.titleSection
  } else if (pathname.includes('customers')) {
    if (params?.id) {
      const client = customers?.data.find((item) => item.id === params.id)
      titleSection = {
        ...client?.titleSection,
        title: client?.name,
        description: 'Client Details',
      }
    } else {
      titleSection = customers?.titleSection
    }
  } else if (pathname.includes('users')) {
    if (params?.id) {
      const user = users.data.find((item) => item.id === params.id)
      titleSection = {
        ...users?.titleSection,
        title: user?.name,
        description: 'User Details',
      }
    } else {
      titleSection = users?.titleSection
    }
  } else if (pathname.includes('vehicles')) {
    if (params?.id) {
      const vehicle = vehicles?.data.find((item) => item.id === params.id)
      titleSection = {
        ...vehicles?.titleSection,
        title: vehicle?.model,
        description: `${vehicle?.type} • ${vehicle?.regNumber}`,
      }
    } else {
      titleSection = vehicles?.titleSection
    }
  } else if (pathname.includes('drivers')) {
    if (params?.id) {
      const driver = drivers?.data.find((item) => item.id === params.id)
      titleSection = {
        ...drivers?.titleSection,
        title: driver?.name,
        description: ` ${driver?.license} •  ${driver?.experience} years`,
      }
    } else {
      titleSection = drivers?.titleSection
    }
  } else if (pathname.includes('stop-points')) {
    if (params?.id) {
      const stopPoint = stop_points?.data.find((item) => item.id === params.id)
      titleSection = {
        ...stop_points?.titleSection,
        title: stopPoint?.name,
        description: stopPoint?.address,
      }
    } else {
      titleSection = stop_points?.titleSection
    }
  } else if (pathname.includes('routes')) {
    if (params?.id) {
      const trip = routes?.data.find((item) => item.id === params.id)

      titleSection = {
        ...routes?.titleSection,
        title: trip?.customer || trip?.id,
        description: `${trip?.id} • ${trip?.pickupLocation} - ${trip?.dropoffLocation}`,
      }
    } else {
      titleSection = routes?.titleSection
    }
  } else if (pathname.includes('orders')) {
    if (params?.id) {
      const order = orders?.data.find((item) => item.id === params.id)

      titleSection = {
        ...order?.titleSection,
        title: order?.title || order?.id,
        description: `${order?.id} • ${order?.pickupLocation} - ${order?.dropoffLocation}`,
      }
    } else {
      titleSection = orders?.titleSection
    }
  } else if (pathname.includes('loads')) {
    if (params?.id) {
      const load = loads?.data.find((item) => item.id === params.id)

      titleSection = {
        ...load?.titleSection,
        title: load?.title || load?.id,
        description: `${load?.id} • ${load?.pickupLocation} - ${load?.dropoffLocation}`,
      }
    } else {
      titleSection = loads?.titleSection
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight capitalize">
        {titleSection?.title}
      </h2>
      <p className="text-muted-foreground">{titleSection?.description}</p>
    </div>
  )
}

export default PageTitle
