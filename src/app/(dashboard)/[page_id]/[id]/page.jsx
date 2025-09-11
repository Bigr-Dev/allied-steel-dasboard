import SingleBranch from '@/components/single-pages/branch'
import CustomersPage from '@/components/single-pages/customers'
import SingleDriver from '@/components/single-pages/driver'
import LoadsPage from '@/components/single-pages/loads'
import RoutesPage from '@/components/single-pages/routes-suburbs'
import SalesOrderPage from '@/components/single-pages/sales-orders'
import UserPage from '@/components/single-pages/users'
import VehicleSinglePage from '@/components/single-pages/vehicles'

const SinglePage = async ({ params }) => {
  const { page_id, id } = await params
  //console.log('id :>> ', id)
  switch (page_id) {
    case 'branches':
      return <SingleBranch id={id} />

    case 'loads':
      return <LoadsPage id={id} />

    case 'load-assignment':
      return <LoadsPage id={id} />

    case 'customers':
      return <CustomersPage id={id} />

    case 'drivers':
      return <SingleDriver id={id} />

    // case 'stop-points':
    //   return <StopPointDetails id={id} />

    // case 'trips':
    //   return <TripDetails id={id} />

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
