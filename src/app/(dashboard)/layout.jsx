// next
import { cookies } from 'next/headers'

// context
import GlobalProvider from '@/context/global-provider'

// components
import { SidebarProvider } from '@/components/ui/sidebar-provider'

// apis
import { fetchServerData } from '../api/_lib/server-fetch'

// helpers
import { isExpired } from '@/lib/check-token'

// meta
export const metadata = {
  title: 'Allied Steelrode',
  description: 'Allied Steelrode Routing System',
}

const DashboardLayout = async ({ children, sidebar, header }) => {
  // ⬅ important: must be awaited in Next.js app router
  const cookieStore = await cookies()
  const uid = cookieStore.get('uid')?.value
  const expRaw = cookieStore.get('expires_at')?.value
  const expiry = isExpired(expRaw)

  let data = {}

  if (!expiry && uid) {
    try {
      const [
        Branches,
        Routes,
        Customers,
        Drivers,
        Loads,
        Orders,
        Users,
        Vehicles,
        plansRes,
      ] = await Promise.all([
        fetchServerData('branches', 'GET'),
        fetchServerData('routes', 'GET'),
        fetchServerData('customers', 'GET'),
        fetchServerData('drivers', 'GET'),
        fetchServerData('loads', 'GET'),
        // fetchServerData('loads?includeItems=true', 'GET'),
        fetchServerData('orders', 'GET'),
        fetchServerData('users', 'GET'),
        fetchServerData('vehicles', 'GET'),
        fetchServerData(
          'plans?limit=1000&offset=0&include_units=true&include_counts=true&include_unassigned=true',
          'GET'
        ),
      ])

      const current_user = Users?.message?.find((u) => u.id == uid)

      data = {
        plans: plansRes?.data,
        load_assignment: {
          ...plansRes?.data,
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
    } catch (error) {
      console.log('dashboard layout data fetch error :>> ', error)
    }
  }

  return (
    <GlobalProvider data={data}>
      <SidebarProvider>
        {sidebar}
        <main className="flex-1 min-h-screen">
          {header}
          <div className="overflow-y-auto">{children}</div>
        </main>
      </SidebarProvider>
    </GlobalProvider>
  )
}

export default DashboardLayout

//bg-[#f3f3f3] dark:bg-gray-900
//bg-[#f3f3f3]
