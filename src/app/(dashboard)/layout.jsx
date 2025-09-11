import { SidebarProvider } from '@/components/ui/sidebar-provider'
import GlobalProvider from '@/context/global-provider'
import { fetchServerData } from '../api/_lib/server-fetch'
import { cookies } from 'next/headers'

import { isExpired } from '@/lib/check-token'
import Image from 'next/image'

export const metadata = {
  title: 'Allied Steelrode',
  description: 'Allied Steelrode Routing System',
}
const DashboardLayout = async ({ children, sidebar, header }) => {
  const cookieStore = await cookies()
  const uid = cookieStore.get('uid')?.value
  const expRaw = cookieStore.get('expires_at')?.value
  const expiry = isExpired(expRaw)

  let data = {}

  const YMD_UTC = (date) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
      2,
      '0'
    )}-${String(date.getUTCDate()).padStart(2, '0')}`

  const now = new Date()
  const tomorrowUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  )
  console.log(typeof YMD_UTC(tomorrowUTC)) // UTC calendar date

  const tomorrow = YMD_UTC(tomorrowUTC)

  try {
    if (!expiry && uid) {
      const Branches = await fetchServerData('branches', 'GET')
      const Routes = await fetchServerData('routes', 'GET')
      const Customers = await fetchServerData('customers', 'GET')
      const Drivers = await fetchServerData('drivers', 'GET')
      const Loads = await fetchServerData(
        `loads?date=${tomorrow}&includeItems=true`,
        'GET'
      )
      // const Loads = await fetchServerData(`loads?includeItems=true`, 'GET')
      const Orders = await fetchServerData('orders', 'GET')
      const Users = await fetchServerData('users', 'GET')
      const Vehicles = await fetchServerData('vehicles', 'GET')

      let AssignedLoads = {}
      if (Users?.message) {
        const load_params = {
          date: tomorrow,
          branch_ids: [
            Users?.message?.filter((u) => u.id === uid)?.[0]?.managed_branches,
          ],
          order_status: 'Sales Order Open Printed',
          commit: false,
          detailLevel: 'item',
          maxItemsPerOrder: 200,
          ignoreDepartment: true,
          ignoreLengthIfMissing: true,
          defaultVehicleCapacityKg: 33000,
          defaultVehicleLengthMm: 13600,
          debug: true,
        }
        AssignedLoads = await fetchServerData('auto-assign/loads', 'POST', {
          ...load_params,
        })
      }

      data = {
        branches: Branches?.message,
        customers: Customers?.data,
        drivers: Drivers,
        loads: Loads?.data?.results,
        orders: Orders?.data,
        users: Users?.message,
        vehicles: Vehicles,
        routes: Routes?.data?.results,
        assigned_loads: AssignedLoads?.data?.assignments_by_load || [],
        assigned_vehicles: AssignedLoads?.data?.assignments_by_vehicle || [],
      }
    }
  } catch (error) {
    console.log('no uid :>> ')
  }

  return (
    <>
      <GlobalProvider data={data}>
        <SidebarProvider>
          {sidebar}
          <main className=" flex-1 min-h-screen  ">
            {header}
            <div className=" overflow-y-auto  ">{children}</div>
          </main>
        </SidebarProvider>
      </GlobalProvider>
    </>
  )
}

export default DashboardLayout
//bg-[#f3f3f3] dark:bg-gray-900
//bg-[#f3f3f3]
