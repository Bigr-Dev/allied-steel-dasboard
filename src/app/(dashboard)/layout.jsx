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
  //console.log(typeof YMD_UTC(tomorrowUTC)) // UTC calendar date

  const tomorrow = YMD_UTC(tomorrowUTC)
  // const tomorrow = '2025-09-29'

  // console.log('tomorrow :>> ', tomorrow)
  try {
    if (!expiry && uid) {
      const Branches = await fetchServerData('branches', 'GET')
      const Routes = await fetchServerData('routes', 'GET')
      const Customers = await fetchServerData('customers', 'GET')
      const Drivers = await fetchServerData('drivers', 'GET')
      const Loads = await fetchServerData(`loads`, 'GET')
      // console.log('tomorrow :>> ', tomorrow)
      // const Loads = await fetchServerData(`loads?includeItems=true`, 'GET')
      const Orders = await fetchServerData('orders', 'GET')
      //console.log('Orders :>> ', Orders)
      const Users = await fetchServerData('users', 'GET')

      const Vehicles = await fetchServerData('vehicles', 'GET')
      // console.log('tomorrow :>> ', tomorrow)

      const current_user = Users?.message?.filter((u) => u.id == uid)?.[0]
      //console.log('current_user :>> ', current_user?.branch_id)

      const plans = await fetchServerData(
        `plans?limit=1000&offset=0&include_units=true&include_counts=true&include_unassigned=true`,
        'GET'
      )

      // let AssignedLoads = {}
      // if (Users?.message) {
      //   const load_params = {
      //     departure_date: tomorrow, // default: tomorrow
      //     //   "cutoff_date": "2025-09-18",     // default: today
      //     //   "branch_id": "uuid-optional",
      //     //   "customer_id": "uuid-optional",
      //     commit: false, // preview (no DB writes) if false
      //     //   "notes": "optional plan note"
      //   }
      //   //  console.log('AssignedLoads :>> ', load_params)
      //   AssignedLoads = await fetchServerData('plans/auto-assign', 'POST', {
      //     ...load_params,
      //   })
      // }
      // console.log('plans :>> ', plans)

      data = {
        plans: plans?.data,
        load_assignment: {
          ...plans?.data,
          // ...assignment?.data,
        },
        current_user,
        branches: Branches?.message,
        customers: Customers?.data,
        drivers: Drivers,
        loads: Loads?.data,
        orders: Orders?.data,
        users: Users?.message,
        vehicles: Vehicles,
        routes: Routes?.data?.results,
        assigned_loads: [],
        assigned_vehicles: [],
      }
    }
  } catch (error) {
    console.log('no uid :>> ', error)
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
