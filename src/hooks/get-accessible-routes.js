import { routes } from '@/constants/routes'

export const getAccessibleRoutes = (permissions) => {
  // Handle case where permissions are not available
  if (!permissions) {
    // Return basic routes that don't require permissions or are commonly accessible
    return [
      {
        label: 'Dashboard',
        icon: 'ChartColumnBig',
        href: '/',
        color: 'text-sky-500',
        permission: null, // Accessible to all authenticated users
      },
      {
        label: 'Vehicles',
        icon: 'Truck',
        href: '/vehicles',
        color: 'text-orange-500',
        permission: null, // Accessible by default
      },
      {
        label: 'Drivers',
        icon: 'UserCircle',
        href: '/drivers',
        color: 'text-green-700',
        permission: null, // Accessible by default
      },
      {
        label: 'Trips',
        icon: 'Route',
        href: '/trips',
        color: 'text-emerald-500',
        permission: null, // Accessible by default
      },
    ]
  }
  console.log('permissions :>> ', permissions)
  return routes.filter((route) => {
    // Route doesn't require a permission → allow
    if (!route.permission) {
      return true
    }

    // Check if the user has the required permission for the route
    const userPermission = permissions[route.permission] // Assuming permissions is an object

    // Allow access if the user has 'write' or 'read' permission
    return userPermission === 'write' || userPermission === 'read'
  })
}

export const getPermittedAccessRoutes = (permissions) => {
  return routes
    .map((route) => {
      //console.log('route :getPermittedAccessRoutes>> ', route)
      // If the route doesn't have a specific permission, default it to 'read'
      if (!route.permission) return { ...route, access: 'read' }

      // Check the user's permission for the route
      const userPermission = permissions[route.permission] // Accessing the permission directly from the object

      // If the user has the required permission, return the route with the appropriate access
      if (userPermission === 'read' || userPermission === 'write') {
        return { ...route, access: userPermission }
      }

      // If the user doesn't have access, return null
      return null
    })
    .filter(Boolean) // Remove null values (routes the user does not have access to)
}
