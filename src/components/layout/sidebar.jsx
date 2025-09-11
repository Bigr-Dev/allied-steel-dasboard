'use client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-provider'
import { routes } from '@/constants/routes'
import { useAuth } from '@/context/initial-states/auth-state'

import {
  ChartColumnBig,
  Building2,
  Building,
  Users,
  Truck,
  Route,
  Map,
  UserCircle,
  ChevronDown,
  FileText,
  Waypoints,
  ClipboardList,
  PackageOpen,
  Package,
  PackagePlus,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import allied_logo from '@/assets/Allied-logo.png'
import { useGlobalContext } from '@/context/global-context'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@radix-ui/react-collapsible'
import { SelectSeparator } from '../ui/select'

const iconMap = {
  ChartColumnBig: ChartColumnBig,
  Building2: Building2,
  Building: Building,
  Users: Users,
  Truck: Truck,
  UserCircle: UserCircle,
  Map: Map,
  Route: Route,
  FileText: FileText,
  Package: Package,
  PackageOpen: PackageOpen,
  PackagePlus: PackagePlus,
}

// const routes = [
//   {
//     label: 'Dashboard',
//     icon: 'ChartColumnBig',
//     href: '/',
//     color: 'text-sky-500',
//     permission: null, // accessible to all authenticated users
//   },
//   {
//     label: 'Branches',
//     icon: 'Building2',
//     href: '/branches',
//     color: 'text-violet-500',
//     permission: 'branches', // permission to manage branches
//   },
//   {
//     label: 'Customers',
//     icon: 'Building',
//     href: '/customers',
//     color: 'text-violet-500',
//     permission: 'customers', // permission to manage customers
//   },
//   {
//     label: 'Drivers',
//     icon: 'UserCircle',
//     href: '/drivers',
//     color: 'text-green-700',
//     permission: 'drivers', // permission to manage drivers
//   },
//   {
//     label: 'Loads',
//     icon: 'Route',
//     href: '/loads',
//     color: 'text-emerald-500',
//     permission: 'routes', // permission to manage routes
//   },
//   {
//     label: 'Users',
//     icon: 'Users',
//     href: '/users',
//     color: 'text-pink-700',
//     permission: 'users', // permission to manage users
//   },
//   {
//     label: 'Vehicles',
//     icon: 'Truck',
//     href: '/vehicles',
//     color: 'text-orange-500',
//     permission: 'vehicles', // permission to manage vehicles
//   },
// ]

const SideBar = () => {
  const pathname = usePathname()
  const {
    current_user: { currentUser },
    logout,
  } = useAuth()
  const { collapsed } = useSidebar()
  const { dashboardState, handleDashboardState, branches } = useGlobalContext()

  let branch_list = [{ value: 'all', label: 'All' }]

  branches &&
    branches?.data?.map((cc) => {
      branch_list.push({ value: cc.id, label: cc.name })
    })

  //console.log('branch_list :>> ', branch_list)
  const branch_inputs = [
    {
      type: 'select',
      htmlFor: 'costCentre',
      label: 'Cost Centre',
      placeholder: 'Select cost centre',
      value: dashboardState?.branch,

      options: branch_list,
    },
  ]

  // Filter routes based on user permissions
  const filteredRoutes = routes?.filter((route) => {
    if (!route?.permission) return true // Always show routes without permissions
    return currentUser?.permissions?.[route?.permission] === 'write' || 'read' // Check permission
  })

  const dashboard_route = filteredRoutes?.filter((item) => item.href === '/')
  const routing_information = filteredRoutes?.filter(
    (item) => item.href === '/loads' || item.href === '/load-assignment'
  )

  const branch_routes = filteredRoutes?.filter(
    (item) =>
      item.href !== '/loads' &&
      item.href !== '/' &&
      item.href !== '/grouped-routes' &&
      item.href !== '/load-assignment'
  )
  return (
    <Sidebar collapsible="icon" className="z-30 bg-white/40 group ">
      <SidebarHeader className=" h-16 justify-center  bg-[#003e69]  shadow-md ">
        <SidebarMenu className={''}>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  // className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip="Allied Steelrode Fleet Management"
                >
                  <div className="flex aspect-square size-7 items-center justify-center rounded-lg  text-white">
                    <Truck className="h-6 w-6" />
                    {/* <Image src={allied_logo} /> */}
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    {/* <span className="font-semibold text-[#fff]">
                      Allied Steel
                    </span> */}
                    <span className="text-xs text-[#fff] capitalize">
                      {dashboardState?.label}
                    </span>
                  </div>
                  <ChevronDown
                    className={
                      branch_inputs.length >= 0
                        ? 'ml-auto size-4 '
                        : 'display-none'
                    }
                    color="white"
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width]"
                align="start"
              >
                {branch_inputs?.map((input, inputIndex) => (
                  <div key={inputIndex}>
                    {input?.options?.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleDashboardState(option)}
                      >
                        <span>{option.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="mt-3">
        <SidebarGroup>
          <SidebarMenu>
            {dashboard_route.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
              const Icon = iconMap[item.icon]
              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    className={
                      isActive
                        ? 'bg-[#003e69] hover:bg-[#428bca] hover:text-white'
                        : 'hover:bg-[#428bca] hover:text-white'
                    }
                  >
                    <Link href={item.href}>
                      <Icon color={isActive ? '#fff ' : '#333333'} />
                      <span
                        className={
                          isActive
                            ? 'font-bold, text-white'
                            : 'hover:text-white'
                        }
                      >
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
          <SelectSeparator className={'mt-4'} />
        </SidebarGroup>
        <Collapsible defaultOpen>
          <SidebarGroup>
            <div className="flex items-center justify-between px-2 py-1.5">
              <CollapsibleTrigger
                aria-label="Routing Information"
                className="flex flex-1 justify-between font-bold text-sm text-[#003e69] capitalize"
              >
                <span className="group-data-[collapsible=icon]:hidden text-sm font-bold text-[#003e69] capitalize">
                  Routing Information
                </span>
                <Waypoints className="shrink-0" size={18} />
              </CollapsibleTrigger>
            </div>

            <SelectSeparator />
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {routing_information.map((item) => {
                    const isActive =
                      item.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.href)
                    const Icon = iconMap[item.icon]
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          asChild
                          className={
                            isActive
                              ? 'bg-[#003e69] hover:bg-[#428bca] hover:text-white'
                              : 'hover:bg-[#428bca] hover:text-white'
                          }
                        >
                          <Link href={item.href}>
                            <Icon color={isActive ? '#fff ' : '#333333'} />
                            <span
                              className={
                                isActive
                                  ? 'font-bold, text-white'
                                  : 'hover:text-white'
                              }
                            >
                              {item.label}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        <Collapsible defaultOpen>
          <SidebarGroup>
            <div className="flex items-center justify-between px-2 py-1.5">
              <CollapsibleTrigger
                aria-label="Routing Information"
                className="flex flex-1 justify-between font-bold text-sm text-[#003e69] capitalize"
              >
                <span className="group-data-[collapsible=icon]:hidden text-sm font-bold text-[#003e69] capitalize">
                  Branch Information
                </span>
                <ClipboardList size={18} className="shrink-0" />
              </CollapsibleTrigger>
            </div>
            <SelectSeparator />
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredRoutes.length > 0 ? (
                    branch_routes.map((item) => {
                      const isActive =
                        item.href === '/'
                          ? pathname === '/'
                          : pathname.startsWith(item.href)
                      const Icon = iconMap[item.icon]
                      return (
                        <SidebarMenuItem key={item.label}>
                          <SidebarMenuButton
                            asChild
                            className={
                              isActive
                                ? 'bg-[#003e69] hover:bg-[#428bca] hover:text-white'
                                : 'hover:bg-[#428bca] hover:text-white'
                            }
                          >
                            <Link href={item.href}>
                              <Icon
                                color={isActive ? '#fff ' : '#333333'}
                                className={
                                  isActive
                                    ? ' text-white'
                                    : 'hover:color-[white]'
                                }
                              />
                              <span
                                className={
                                  isActive
                                    ? 'font-bold text-white'
                                    : 'hover:text-white'
                                }
                              >
                                {item.label}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })
                  ) : (
                    <div className="p-4 text-sm text-gray-500">
                      No routes available. Loading...
                    </div>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip="User Profile">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-gray-200">
                    <UserCircle className="size-5 text-gray-600" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none ">
                    <span className="font-medium capitalize">{'User'}</span>
                    <span className="text-xs text-muted-foreground">
                      {currentUser?.email}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-dropdown-menu-trigger-width]"
                align="start"
              >
                <DropdownMenuItem>
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default SideBar
