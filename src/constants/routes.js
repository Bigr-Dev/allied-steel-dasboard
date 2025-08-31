export const routes = [
  {
    label: 'Dashboard',
    icon: 'ChartColumnBig',
    href: '/',
    color: 'text-sky-500',
    permission: null, // accessible to all authenticated users
  },

  {
    label: 'Loads',
    icon: 'PackageOpen',
    href: '/loads',
    color: 'text-emerald-500',
    permission: 'loads', // permission to manage routes
  },
  {
    label: 'Load Assignment',
    icon: 'PackagePlus',
    href: '/load-assignment',
    color: 'text-emerald-500',
    permission: 'loads', // permission to manage routes
  },
  {
    label: 'Branches',
    icon: 'Building2',
    href: '/branches',
    color: 'text-violet-500',
    permission: 'branches', // permission to manage branches
  },
  {
    label: 'Customers',
    icon: 'Building',
    href: '/customers',
    color: 'text-violet-500',
    permission: 'customers', // permission to manage customers
  },
  {
    label: 'Drivers',
    icon: 'UserCircle',
    href: '/drivers',
    color: 'text-green-700',
    permission: 'drivers', // permission to manage drivers
  },
  {
    label: 'Orders',
    icon: 'FileText',
    href: '/orders',
    color: 'text-emerald-500',
    permission: 'orders', // permission to manage routes
  },
  {
    label: 'Routes',
    icon: 'Route',
    href: '/routes',
    color: 'text-emerald-500',
    permission: 'routes', // permission to manage routes
  },
  {
    label: 'Users',
    icon: 'Users',
    href: '/users',
    color: 'text-pink-700',
    permission: 'users', // permission to manage users
  },

  {
    label: 'Vehicles',
    icon: 'Truck',
    href: '/vehicles',
    color: 'text-orange-500',
    permission: 'vehicles', // permission to manage vehicles
  },
]
