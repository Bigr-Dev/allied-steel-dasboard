'use client'
import { Button } from '@/components/ui/button'
import { useGlobalContext } from '@/context/global-context'
import { useAuth } from '@/context/initial-states/auth-state'
import { getPermittedAccessRoutes } from '@/hooks/get-accessible-routes'
import { useParams, usePathname, useRouter } from 'next/navigation'

const PageTitle = () => {
  const pathname = usePathname().slice(1)
  const { push } = useRouter()
  const {
    current_user: {
      currentUser: { permissions },
    },
  } = useAuth()
  const params = useParams()
  const {
    assignment,
    dashboard,
    branches,
    customers,
    orders,
    loads,
    users,
    vehicles,
    drivers,
    load_assignment,
    routes,
    onCreate,
    onEdit,
    onDelete,
    grouped_loads,
  } = useGlobalContext()

  let titleSection = {}
  const accessibleRoutes = getPermittedAccessRoutes(permissions)
  const canEdit = accessibleRoutes.filter((p) => p.href.includes(pathname))

  //  console.log('accessibleRoutes :>> ', accessibleRoutes)
  if (pathname === '' || pathname.includes('dashboard')) {
    titleSection = dashboard?.titleSection
  } else if (pathname.includes('orders')) {
    if (params?.id) {
      const order = orders?.data.find((item) => item.id === params.id)
      titleSection = {
        ...orders?.titleSection,
        title: order?.name,
        description: 'Cost Centre Details',
      }
    } else {
      titleSection = orders?.titleSection
    }
    // titleSection = branches.titleSection
  } else if (pathname.includes('loads')) {
    if (params?.id) {
      const load = loads?.data.find((item) => item.id === params.id)
      titleSection = {
        ...loads?.titleSection,
        title: load?.name,
        description: 'Cost Centre Details',
      }
    } else {
      titleSection = loads?.titleSection
    }
    // titleSection = branches.titleSection
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
  } else if (pathname.includes('load-assignment')) {
    if (params?.id) {
      const loads = grouped_loads?.data.find((item) => item.id === params.id)
      titleSection = {
        ...assignment?.titleSection,
        // title: assignment?.name,
        // description: assignment?.address,
      }
    } else {
      titleSection = assignment?.titleSection
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
  }

  //console.log('canEdit :>> ', canEdit)

  return (
    <>
      <div>
        <h2 className="text-xl text-[#003e69]   font-bold tracking-tight uppercase">
          {titleSection?.title}
        </h2>
        <p className="text-[#428bca]]">{titleSection?.description}</p>
      </div>
      {titleSection?.button && (
        <Button
          onClick={() => {
            switch (pathname) {
              // case 'load-assignment':
              //   console.log(
              //     'create load assignment load-assignment :PageTitle>> '
              //   )
              //   push('/load-assignment/create-plan')
              //   break

              default:
                onCreate()
                break
            }
          }}
          disabled={canEdit[0]?.access !== 'write' || false}
          className={'bg-[#003e69] hover:bg-[#428bca]'}
        >
          {titleSection.button.icon}
          {titleSection.button.text}
        </Button>
      )}
    </>
  )
}

export default PageTitle
