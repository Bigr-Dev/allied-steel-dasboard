'use client'

// next
import { useParams, usePathname } from 'next/navigation'

// context
import { useAuth } from '@/context/initial-states/auth-state'
import { useGlobalContext } from '@/context/global-context'

// hooks
import { getGreeting } from '@/hooks/use-greeting'

// icons
import { Bell } from 'lucide-react'

// components
import { SidebarTrigger } from '@/components/ui/sidebar-provider'
import Image from 'next/image'
import allied_logo from '@/assets/allied_logo_dark.png'
// import bg_img from '@/assets/Allied-Steelrode-Background-1.'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

import header_bg from '@/assets/Allied-Steelrode-Background-1.png'

const Header = () => {
  const {
    current_user: { currentUser },
  } = useAuth()
  const branch = currentUser?.branch
  const name = currentUser?.name
  const pathname = usePathname().slice(1)

  const params = useParams()
  const branches = useGlobalContext()?.branches
  const dashboardState = useGlobalContext()?.dashboardState
  const allBranches = branches?.data

  const selected_branch =
    dashboardState?.branch &&
    dashboardState?.branch !== 'All' &&
    dashboardState?.branch
  //console.log('selected_branch :>> ', selected_branch)
  const filter_cc =
    allBranches?.filter((cc) => cc.id == selected_branch)?.[0]?.name || branch
  return (
    <div className="sticky  h-16 top-0 z-10 px-4  md:px-6 bg-gray-100 dark:bg-gray-900 backdrop-blur supports-[backdrop-filter]:bg-[#003e69] dark:supports-[backdrop-filter]:bg-gray-900/60 flex shrink-0 justify-between items-center shadow-lg ">
      <div className="flex flex-col flex-1/3 ">
        <SidebarTrigger className={'text-white'} />
      </div>

      <div className="flex  aspect-square size-14 self-center items-center justify-center ">
        {/* <Truck className="size-4" /> */}
        <Image
          src={allied_logo}
          alt="Allied Steelrode"
          style={{ objectFit: 'contain', zIndex: 1 }}
        />
      </div>

      <div className=" flex flex-col flex-1/3  items-end space-x-4 items-center z-10">
        {/* <h2 className="text-l font-bold text-white tracking-tight capitalize">
   
          {getGreeting(name)}
        </h2> */}
        {/* <Sheet>
          <SheetTrigger asChild>
            <Bell size={20} color="#fff" />
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>
                Make changes to your profile here. Click save when you&apos;re
                done.
              </SheetDescription>
            </SheetHeader>
            <div className="grid flex-1 auto-rows-min gap-6 px-4">
              <div className="grid gap-3">
                <Label htmlFor="sheet-demo-name">Name</Label>
                <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="sheet-demo-username">Username</Label>
                <Input id="sheet-demo-username" defaultValue="@peduarte" />
              </div>
            </div>
            <SheetFooter>
              <Button type="submit">Save changes</Button>
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet> */}
        <h2 className="text-l text-white font-bold tracking-tight capitalize">
          {dashboardState?.label.slice(27)}
        </h2>
        <p className="text-white text-sm">{getGreeting(name)}</p>
      </div>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <Image
          src={header_bg}
          alt="motion-live-bg"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
    </div>
  )
}

export default Header
